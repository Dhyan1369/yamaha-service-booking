import { createContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ── Security helper: one-way SHA-256 hash for offline password storage ──────
// NOTE: This is NOT a substitute for bcrypt on a real server; it is only used
// for the local-development localStorage fallback when Supabase is not wired up.
async function hashPassword(plain) {
  const encoded = new TextEncoder().encode(plain);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (!isSupabaseConfigured) {
      try {
        const stored = localStorage.getItem('yamaha_current_user');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [session, setSession] = useState(() => {
    if (!isSupabaseConfigured) {
      try {
        const stored = localStorage.getItem('yamaha_current_user');
        return stored ? { user: JSON.parse(stored) } : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signin');
  const [authRedirectPath, setAuthRedirectPath] = useState(null);

  // Convert a phone number to a virtual Supabase-compatible email (always using 0XXXXXXXXX format, no +94)
  const phoneToAuthEmail = (phone) => {
    let clean = (phone || '').replace(/[\s-]/g, '');
    if (clean.startsWith('+94')) {
      clean = '0' + clean.slice(3);
    } else if (clean.startsWith('94') && clean.length === 11) {
      clean = '0' + clean.slice(2);
    }
    return `${clean}@phone.yamaha.lk`;
  };

  // Fetch user profile from public.profiles
  const fetchProfile = async (userId) => {
    if (!isSupabaseConfigured || !supabase || !userId) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[AuthContext] Notice: failed to load public.profiles:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('[AuthContext] Error fetching public.profiles:', err);
      return null;
    }
  };

  const formatUser = (sbUser, profile = null, customMeta = {}) => {
    if (!sbUser) return null;

    // Supabase stores extra fields inside user_metadata.
    // public.profiles holds the canonical relational profile data.
    // Offline (localStorage) users are flat objects with the fields at the top level.
    const meta = {
      ...(sbUser.user_metadata || {}), // Supabase path
      // Offline path: pick top-level fields that Supabase would put in user_metadata
      ...(sbUser.phone     ? { phone:     sbUser.phone }     : {}),
      ...(sbUser.nic       ? { nic:       sbUser.nic }       : {}),
      ...(sbUser.name      ? { name:      sbUser.name }      : {}),
      ...(sbUser.bikeModel ? { bikeModel: sbUser.bikeModel } : {}),
      ...(sbUser.vehicleNo ? { vehicleNo: sbUser.vehicleNo } : {}),
      ...(sbUser.email     ? { email:     sbUser.email }     : {}),
      ...customMeta,
    };
    const appMeta = sbUser.app_metadata || {};

    const rawEmail = meta.email || sbUser.email || '';
    // Hide virtual phone emails from display
    const displayEmail = rawEmail.includes('@phone.yamaha.lk') ? '' : rawEmail;

    // Try to recover phone from the virtual email (e.g. 0771234567@phone.yamaha.lk)
    const phoneFromEmail =
      rawEmail.includes('@phone.yamaha.lk')
        ? rawEmail.replace('@phone.yamaha.lk', '')
        : '';

    let rawPhone = (profile?.phone || meta.phone || phoneFromEmail || sbUser.phone || '').replace(/[\s-]/g, '');
    // Ensure 0-prefixed 10-digit format without +94 across the entire system
    if (rawPhone.startsWith('+94')) {
      rawPhone = '0' + rawPhone.slice(3);
    } else if (rawPhone.startsWith('94') && rawPhone.length === 11) {
      rawPhone = '0' + rawPhone.slice(2);
    }

    // Role priority: canonical public.profiles table -> server app_metadata -> default 'customer'
    const userRole = profile?.role || appMeta.role || sbUser.role || (sbUser.isAdmin ? 'admin' : 'customer');
    const isAdmin = userRole === 'admin' || appMeta.role === 'admin';

    // Offline dev-only fallback:
    const isAdminLocal = !isSupabaseConfigured && (sbUser.isAdmin === true || customMeta.isAdmin === true);
    const effectiveAdmin = isAdmin || isAdminLocal;
    const effectiveRole = effectiveAdmin ? 'admin' : 'customer';

    const bikeModel =
      profile?.default_bike_model ||
      meta.bikeModel ||
      meta.bike_model ||
      meta.default_bike_model ||
      'Yamaha Bike';

    const vehiclePlate =
      profile?.default_vehicle_plate ||
      meta.vehicleNo ||
      meta.vehicle_no ||
      meta.default_vehicle_plate ||
      '';

    const fullName =
      profile?.full_name ||
      meta.full_name ||
      meta.name ||
      (effectiveAdmin ? 'Admin Manager' : rawPhone || 'Customer');

    const nic = profile?.nic || meta.nic || '';

    return {
      id: sbUser.id || 'usr_' + (rawPhone || 'guest'),
      email: displayEmail,
      name: fullName,
      phone: rawPhone,          // always formatted exactly as user entered (e.g. 0760755111, no +94)
      nic:  nic,
      role: effectiveRole,
      bikeModel: bikeModel,
      defaultBikeModel: bikeModel,
      vehiclePlate: vehiclePlate,
      defaultVehiclePlate: vehiclePlate,
      avatarUrl: meta.avatarUrl || meta.avatar_url || sbUser.avatarUrl || sbUser.avatar_url || '',
      isAdmin: Boolean(effectiveAdmin),
      rawUser: sbUser,
      profile: profile || null
    };
  };

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      let isMounted = true;

      const initSession = async () => {
        try {
          const { data: { session: initialSession } } = await supabase.auth.getSession();
          if (!isMounted) return;
          setSession(initialSession);
          if (initialSession?.user) {
            const profile = await fetchProfile(initialSession.user.id);
            if (isMounted) setUser(formatUser(initialSession.user, profile));
          } else {
            if (isMounted) setUser(null);
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      initSession();

      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        if (newSession?.user) {
          const profile = await fetchProfile(newSession.user.id);
          if (isMounted) setUser(formatUser(newSession.user, profile));
        } else {
          if (isMounted) setUser(null);
        }
        if (isMounted) setLoading(false);
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  // Accepts either a 10-digit phone number OR a real email address
  const loginWithPhonePassword = async (phoneOrEmail, password) => {
    if (isSupabaseConfigured && supabase) {
      const trimmed = (phoneOrEmail || '').trim();
      const isEmail = trimmed.includes('@');

      if (isEmail) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmed.toLowerCase(),
          password
        });
        if (error) throw error;
        return data;
      }

      let cleanPhone = trimmed.replace(/[\s-]/g, '');
      if (cleanPhone.startsWith('+94')) {
        cleanPhone = '0' + cleanPhone.slice(3);
      } else if (cleanPhone.startsWith('94') && cleanPhone.length === 11) {
        cleanPhone = '0' + cleanPhone.slice(2);
      }

      // 1. Try native phone login first with cleanPhone
      const phoneRes = await supabase.auth
        .signInWithPassword({ phone: cleanPhone, password })
        .catch(() => null);

      if (phoneRes?.data?.session) {
        return phoneRes.data;
      }

      // Also try with +94 in case an older account has +94 in auth.users.phone
      const e164 = cleanPhone.startsWith('0') ? `+94${cleanPhone.slice(1)}` : `+94${cleanPhone}`;
      const phoneE164Res = await supabase.auth
        .signInWithPassword({ phone: e164, password })
        .catch(() => null);

      if (phoneE164Res?.data?.session) {
        return phoneE164Res.data;
      }

      // 2. Check if this phone number belongs to an account registered with a real email
      try {
        const { data: foundEmail } = await supabase.rpc('get_email_by_phone', { p_phone: cleanPhone });
        if (foundEmail && foundEmail.includes('@') && !foundEmail.includes('@phone.yamaha.lk')) {
          const emailLoginRes = await supabase.auth.signInWithPassword({
            email: foundEmail,
            password
          });
          if (emailLoginRes?.data?.session) {
            return emailLoginRes.data;
          }
        }
      } catch {
        // Fall through to virtual email
      }

      // 3. Fallback: virtual email lookup (0XXXXXXXXX@phone.yamaha.lk)
      const virtualEmail = phoneToAuthEmail(cleanPhone);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password
      });

      if (error) throw error;
      return data;
    }

    // ── Offline / localStorage fallback (development only) ──────────────────
    let cleanInput = (phoneOrEmail || '').trim().replace(/[\s-]/g, '');
    if (cleanInput.startsWith('+94')) {
      cleanInput = '0' + cleanInput.slice(3);
    }
    const localUsers = JSON.parse(localStorage.getItem('yamaha_local_users') || '[]');
    // Compare against the stored SHA-256 hash, not the plain-text password.
    const inputHash = await hashPassword(password);
    const matchedUser = localUsers.find(
      (u) =>
        (u.phone?.replace(/[\s-]/g, '') === cleanInput ||
          (u.email && u.email.toLowerCase() === phoneOrEmail.trim().toLowerCase())) &&
        u.passwordHash === inputHash
    );

    if (!matchedUser) {
      throw new Error('දුරකථන අංකය/ඊමේල් හෝ මුරපදය වැරදියි (Invalid credentials).');
    }

    const formattedUser = formatUser(matchedUser);
    const sessionObj = { user: formattedUser };
    localStorage.setItem('yamaha_current_user', JSON.stringify(formattedUser));
    setUser(formattedUser);
    setSession(sessionObj);
    return { user: formattedUser, session: sessionObj };
  };

  // ── Sign Up ────────────────────────────────────────────────────────────────
  // Phone is required; saved exactly as user typed (e.g. 0XXXXXXXXX, no +94)
  const signUpWithPhonePassword = async (phone, password, userMetaData = {}) => {
    let cleanPhone = (phone || '').replace(/[\s-]/g, '');
    if (cleanPhone.startsWith('+94')) {
      cleanPhone = '0' + cleanPhone.slice(3);
    } else if (cleanPhone.startsWith('94') && cleanPhone.length === 11) {
      cleanPhone = '0' + cleanPhone.slice(2);
    }

    const realEmail = (userMetaData.email || '').trim().toLowerCase();
    const hasRealEmail = realEmail && realEmail.includes('@');

    if (isSupabaseConfigured && supabase) {
      // CASE 1: User provided BOTH email and phone number!
      // Register with their real email in the Email column, and phone exactly as entered in metadata/trigger
      if (hasRealEmail) {
        const { data, error } = await supabase.auth.signUp({
          email: realEmail,
          password,
          options: {
            data: {
              name: userMetaData.name,
              nic: userMetaData.nic,
              phone: cleanPhone,
              bikeModel: userMetaData.bikeModel,
              email: realEmail
            }
          }
        });
        if (error) throw error;
        return data;
      }

      // CASE 2: User provided ONLY phone number (no email)
      // Save directly with virtual email (0XXXXXXXXX@phone.yamaha.lk) so phone SMS provider is not required,
      // and database trigger automatically saves cleanPhone (0XXXXXXXXX, no +94) directly to auth.users.phone
      const authEmail = phoneToAuthEmail(cleanPhone);
      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password,
        options: {
          data: {
            name: userMetaData.name,
            nic: userMetaData.nic,
            phone: cleanPhone,
            bikeModel: userMetaData.bikeModel,
            email: ''
          }
        }
      });
      if (error) throw error;
      return data;
    }

    // ── Offline / localStorage fallback ──────────────────────────────────────
    const localUsers = JSON.parse(localStorage.getItem('yamaha_local_users') || '[]');
    const existing = localUsers.find(
      (u) => u.phone?.replace(/[\s-]/g, '') === cleanPhone
    );
    if (existing) {
      throw new Error(
        'මෙම දුරකථන අංකය දැනටමත් ලියාපදිංචි කර ඇත (Phone already registered). කරුණාකර Sign In වන්න.'
      );
    }

    // Hash the password before storing — never save plain text.
    const passwordHash = await hashPassword(password);

    const newUser = {
      id: 'local_usr_' + Date.now(),
      phone: cleanPhone,
      name: userMetaData.name || 'Customer',
      nic: userMetaData.nic || '',
      bikeModel: userMetaData.bikeModel || 'Yamaha FZ-S V3',
      email: userMetaData.email || '',
      passwordHash,          // SHA-256 hex; plain-text is never persisted
      isAdmin: false,        // SECURITY: admin is only granted via app_metadata
      createdAt: new Date().toISOString()
    };

    localUsers.push(newUser);
    localStorage.setItem('yamaha_local_users', JSON.stringify(localUsers));
    localStorage.setItem('yamaha_current_user', JSON.stringify(newUser));

    setUser(newUser);
    setSession({ user: newUser });
    return { user: newUser, session: { user: newUser } };
  };

  // Wrapper aliases used by AuthModal
  const loginWithEmailPassword = async (emailOrPhone, password) => {
    return loginWithPhonePassword(emailOrPhone, password);
  };

  const signUpWithEmailPassword = async (emailOrPhone, password, userMetaData = {}) => {
    const phone = userMetaData.phone || (emailOrPhone.includes('@') ? '' : emailOrPhone);
    if (phone) {
      return signUpWithPhonePassword(phone, password, {
        ...userMetaData,
        email: emailOrPhone.includes('@') ? emailOrPhone : (userMetaData.email || '')
      });
    }
    return signUpWithPhonePassword(emailOrPhone, password, userMetaData);
  };

  // ── Password Reset ─────────────────────────────────────────────────────────
  // FREE on Supabase: sends a reset link to the user's real email address.
  // Phone-only users (no real email) must contact the workshop admin.
  const resetPassword = async (emailInput) => {
    const email = (emailInput || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address to receive the reset link.');
    }
    if (email.includes('@phone.yamaha.lk')) {
      throw new Error(
        'ඔබ phone number භාවිතා කර ලියාපදිංචි වී ඇත. Password reset සඳහා workshop admin සම්බන්ධ කරගන්න.\n(You registered with a phone number. Please contact the workshop admin to reset your password.)'
      );
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      return true;
    }

    // Offline mode — cannot send real email
    throw new Error(
      'Password reset email cannot be sent in offline mode. Please contact the workshop admin.'
    );
  };

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const googleLogin = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}` }
      });
      if (error) throw error;
      return data;
    }
    throw new Error('Google Sign-In requires Supabase to be configured.');
  };

  // ── Update Profile ─────────────────────────────────────────────────────────
  const updateCustomerProfile = async (profileData) => {
    let cleanPhone = (profileData.phone || '').trim().replace(/[\s-]/g, '');
    if (cleanPhone.startsWith('+94')) {
      cleanPhone = '0' + cleanPhone.slice(3);
    } else if (cleanPhone.startsWith('94') && cleanPhone.length === 11) {
      cleanPhone = '0' + cleanPhone.slice(2);
    }

    if (isSupabaseConfigured && supabase && user?.rawUser) {
      const rawAvatar = profileData.avatarUrl ?? (user?.avatarUrl || '');
      // Prevent Base64 strings from bloating JWT auth headers (causes HTTP 431)
      const safeAvatarUrl = typeof rawAvatar === 'string' && rawAvatar.startsWith('http') ? rawAvatar : '';

      const resolvedName = profileData.name ?? profileData.full_name ?? user.name;
      const resolvedBike = profileData.bikeModel ?? profileData.default_bike_model ?? user.bikeModel;
      const resolvedPlate = profileData.vehiclePlate ?? profileData.default_vehicle_plate ?? profileData.vehicleNo ?? user.vehiclePlate;
      const resolvedNic = profileData.nic !== undefined ? (profileData.nic ? profileData.nic.trim().toUpperCase() : '') : user.nic;
      const resolvedPhone = cleanPhone || profileData.phone || user.phone;

      // 1. Persist directly to canonical public.profiles table
      let updatedProfile = null;
      try {
        const profilePayload = {
          id: user.id,
          full_name: resolvedName,
          phone: resolvedPhone,
          nic: resolvedNic,
          default_bike_model: resolvedBike,
          default_vehicle_plate: resolvedPlate ? resolvedPlate.trim().toUpperCase() : '',
          updated_at: new Date().toISOString()
        };

        const { data: profData, error: profError } = await supabase
          .from('profiles')
          .upsert(profilePayload)
          .select()
          .single();

        if (profError) {
          console.warn('[AuthContext] Notice: could not upsert public.profiles:', profError.message);
        } else {
          updatedProfile = profData;
        }
      } catch (e) {
        console.warn('[AuthContext] Exception while upserting public.profiles:', e);
      }

      // 2. Sync auth user metadata
      const updatePayload = {
        data: {
          name: resolvedName,
          full_name: resolvedName,
          phone: resolvedPhone,
          nic: resolvedNic,
          bikeModel: resolvedBike,
          default_bike_model: resolvedBike,
          vehicleNo: resolvedPlate,
          default_vehicle_plate: resolvedPlate,
          email: profileData.email || user.email || '',
          avatarUrl: safeAvatarUrl,
          avatar_url: safeAvatarUrl
        }
      };
      if (profileData.password) {
        updatePayload.password = profileData.password;
      }

      const { data, error } = await supabase.auth.updateUser(updatePayload);
      if (error) throw error;

      const formatted = formatUser(data.user, updatedProfile || user.profile);
      if (rawAvatar && rawAvatar.startsWith('data:')) {
        formatted.avatarUrl = rawAvatar;
      }
      setUser(formatted);
      return formatted;
    } else if (user) {
      const updatedUser = { 
        ...user, 
        ...profileData, 
        role: user.role || (user.isAdmin ? 'admin' : 'customer'),
        isAdmin: Boolean(user.isAdmin) 
      };
      localStorage.setItem('yamaha_current_user', JSON.stringify(updatedUser));
      const localUsers = JSON.parse(localStorage.getItem('yamaha_local_users') || '[]');
      const index = localUsers.findIndex((u) => u.id === user.id || u.phone === user.phone);
      if (index !== -1) {
        localUsers[index] = { 
          ...localUsers[index], 
          ...profileData, 
          role: localUsers[index].role || (localUsers[index].isAdmin ? 'admin' : 'customer'),
          isAdmin: Boolean(localUsers[index].isAdmin) 
        };
        localStorage.setItem('yamaha_local_users', JSON.stringify(localUsers));
      }
      setUser(updatedUser);
      return updatedUser;
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('yamaha_current_user');
    setUser(null);
    setSession(null);
  };

  const openAuthModal = (mode = 'signin', redirectTo = null) => {
    const validMode = (typeof mode === 'string' && (mode === 'signup' || mode === 'forgot')) ? mode : 'signin';
    const validRedirect = typeof redirectTo === 'string' ? redirectTo : null;
    setAuthModalMode(validMode);
    setAuthRedirectPath(validRedirect);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthRedirectPath(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        loginWithPhonePassword,
        signUpWithPhonePassword,
        loginWithEmailPassword,
        signUpWithEmailPassword,
        googleLogin,
        resetPassword,
        updateCustomerProfile,
        logout,
        showAuthModal,
        authModalMode,
        authRedirectPath,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

