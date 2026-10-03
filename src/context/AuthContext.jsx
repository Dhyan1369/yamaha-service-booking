import { createContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
    const meta = { ...(sbUser.user_metadata || {}), ...customMeta };
    const appMeta = sbUser.app_metadata || {};

    const rawEmail = meta.email || sbUser.email || '';
    // Hide virtual phone emails from display
    const displayEmail = rawEmail.includes('@phone.yamaha.lk') ? '' : rawEmail;
    const rawPhone = (meta.phone || sbUser.phone || '').replace(/[\s-]/g, '');

    // Check if user has admin privileges via app_metadata, user_metadata, email, phone, or flag
    const isAdmin =
      appMeta.role === 'admin' ||
      meta.role === 'admin' ||
      rawEmail.toLowerCase() === 'admin@yamahapro.lk' ||
      rawPhone === '0770000000' ||
      sbUser.isAdmin === true ||
      customMeta.isAdmin === true;

    return {
      id: sbUser.id || 'usr_' + (rawPhone || 'guest'),
      email: displayEmail,
      name: meta.full_name || meta.name || (isAdmin ? 'Admin Manager' : meta.phone || 'Customer'),
      nic: meta.nic || '',
      phone: meta.phone || (sbUser.phone || ''),
      bikeModel: meta.bikeModel || meta.bike_model || 'Yamaha Bike',
      isAdmin: Boolean(isAdmin),
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
    const matchedUser = localUsers.find(
      (u) =>
        (u.phone?.replace(/[\s-]/g, '') === cleanInput ||
          (u.email && u.email.toLowerCase() === phoneOrEmail.trim().toLowerCase())) &&
        u.password === password
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

    const newUser = {
      id: 'local_usr_' + Date.now(),
      phone: cleanPhone,
      name: userMetaData.name || 'Customer',
      nic: userMetaData.nic || '',
      bikeModel: userMetaData.bikeModel || 'Yamaha FZ-S V3',
      email: userMetaData.email || '',
      password: password,
      isAdmin: false, // SECURITY: never grant admin from local signup
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
      const { data, error } = await supabase.auth.updateUser({ data: profileData });
      if (error) throw error;
      setUser(formatUser(data.user));
    } else if (user) {
      const updatedUser = { ...user, ...profileData, isAdmin: false }; // preserve security
      localStorage.setItem('yamaha_current_user', JSON.stringify(updatedUser));
      const localUsers = JSON.parse(localStorage.getItem('yamaha_local_users') || '[]');
      const index = localUsers.findIndex((u) => u.id === user.id);
      if (index !== -1) {
        localUsers[index] = { ...localUsers[index], ...profileData, isAdmin: false };
        localStorage.setItem('yamaha_local_users', JSON.stringify(localUsers));
      }
      setUser(updatedUser);
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

