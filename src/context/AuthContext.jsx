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

  // Convert a phone number to a virtual Supabase-compatible email
  const phoneToAuthEmail = (phone) => {
    const clean = (phone || '').replace(/[\s-]/g, '');
    return `${clean}@phone.yamaha.lk`;
  };

  const formatUser = (sbUser, customMeta = {}) => {
    if (!sbUser) return null;

    // Supabase stores extra fields inside user_metadata.
    // Offline (localStorage) users are flat objects with the fields at the top level.
    // We merge both sources so the code below works for either shape.
    const meta = {
      ...(sbUser.user_metadata || {}), // Supabase path
      // Offline path: pick top-level fields that Supabase would put in user_metadata
      ...(sbUser.phone     ? { phone:     sbUser.phone }     : {}),
      ...(sbUser.nic       ? { nic:       sbUser.nic }       : {}),
      ...(sbUser.name      ? { name:      sbUser.name }      : {}),
      ...(sbUser.bikeModel ? { bikeModel: sbUser.bikeModel } : {}),
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

    const rawPhone = (meta.phone || phoneFromEmail || sbUser.phone || '').replace(/[\s-]/g, '');

    // ── SECURITY: Admin status is determined ONLY from server-controlled
    // app_metadata (set via Supabase dashboard / Edge Function, never by the
    // client). user_metadata is user-writable and must NOT be trusted for
    // privilege checks.
    const isAdmin = appMeta.role === 'admin';

    // Offline dev-only fallback: the local user object may have isAdmin set
    // explicitly by the development seed — but ONLY when Supabase is not
    // configured so this code path can never run in production.
    const isAdminLocal = !isSupabaseConfigured && (sbUser.isAdmin === true || customMeta.isAdmin === true);
    const effectiveAdmin = isAdmin || isAdminLocal;

    return {
      id: sbUser.id || 'usr_' + (rawPhone || 'guest'),
      email: displayEmail,
      name: meta.full_name || meta.name || (effectiveAdmin ? 'Admin Manager' : rawPhone || 'Customer'),
      nic:  meta.nic || '',
      phone: rawPhone,          // always cleaned and normalised
      bikeModel: meta.bikeModel || meta.bike_model || 'Yamaha Bike',
      avatarUrl: meta.avatarUrl || meta.avatar_url || sbUser.avatarUrl || sbUser.avatar_url || '',
      isAdmin: Boolean(effectiveAdmin),
      rawUser: sbUser
    };
  };

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(formatUser(session?.user));
        setLoading(false);
      });

      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(formatUser(session?.user));
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  // Accepts either a 10-digit phone number OR a real email address
  const loginWithPhonePassword = async (phoneOrEmail, password) => {
    if (isSupabaseConfigured && supabase) {
      const trimmed = (phoneOrEmail || '').trim();
      const isEmail = trimmed.includes('@');
      // If phone → convert to virtual email for Supabase lookup
      const email = isEmail ? trimmed : phoneToAuthEmail(trimmed);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // If phone login failed, try Supabase native phone auth as last resort
        if (!isEmail) {
          const rawDigits = trimmed.replace(/[\s-]/g, '');
          const e164 = rawDigits.startsWith('0') ? `+94${rawDigits.slice(1)}` : rawDigits;
          const phoneRes = await supabase.auth
            .signInWithPassword({ phone: e164, password })
            .catch(() => null);
          if (phoneRes?.data?.session) return phoneRes.data;
        }
        throw error;
      }
      return data;
    }

    // ── Offline / localStorage fallback (development only) ──────────────────
    const cleanInput = (phoneOrEmail || '').trim().replace(/[\s-]/g, '');
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
  // Phone is required; email is optional (stored in metadata for password reset)
  const signUpWithPhonePassword = async (phone, password, userMetaData = {}) => {
    const cleanPhone = (phone || '').replace(/[\s-]/g, '');

    if (isSupabaseConfigured && supabase) {
      // Use virtual phone email as Supabase identifier
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
            email: userMetaData.email || '' // real email stored in metadata
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
    if (isSupabaseConfigured && supabase && user?.rawUser) {
      const rawAvatar = profileData.avatarUrl ?? (user?.avatarUrl || '');
      // Prevent Base64 strings from bloating JWT auth headers (causes HTTP 431)
      const safeAvatarUrl = typeof rawAvatar === 'string' && rawAvatar.startsWith('http') ? rawAvatar : '';

      const updatePayload = {
        data: {
          name: profileData.name,
          full_name: profileData.name,
          phone: profileData.phone,
          nic: profileData.nic,
          bikeModel: profileData.bikeModel,
          email: profileData.email || '',
          avatarUrl: safeAvatarUrl,
          avatar_url: safeAvatarUrl
        }
      };
      if (profileData.password) {
        updatePayload.password = profileData.password;
      }
      const { data, error } = await supabase.auth.updateUser(updatePayload);
      if (error) throw error;
      const formatted = formatUser(data.user);
      if (rawAvatar && rawAvatar.startsWith('data:')) {
        formatted.avatarUrl = rawAvatar;
      }
      setUser(formatted);
      return formatted;
    } else if (user) {
      const updatedUser = { 
        ...user, 
        ...profileData, 
        isAdmin: Boolean(user.isAdmin) 
      };
      localStorage.setItem('yamaha_current_user', JSON.stringify(updatedUser));
      const localUsers = JSON.parse(localStorage.getItem('yamaha_local_users') || '[]');
      const index = localUsers.findIndex((u) => u.id === user.id || u.phone === user.phone);
      if (index !== -1) {
        localUsers[index] = { 
          ...localUsers[index], 
          ...profileData, 
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

  const openAuthModal  = () => setShowAuthModal(true);
  const closeAuthModal = () => setShowAuthModal(false);

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
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

