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

  const phoneToAuthEmail = (phone) => {
    const clean = (phone || '').replace(/[\s-]/g, '');
    return `${clean}@phone.yamaha.lk`;
  };

  const formatUser = (sbUser, customMeta = {}) => {
    if (!sbUser) return null;
    const meta = { ...(sbUser.user_metadata || {}), ...customMeta };
    const appMeta = sbUser.app_metadata || {};
    const isAdmin = appMeta.role === 'admin';

    const rawEmail = meta.email || sbUser.email || '';
    const displayEmail = rawEmail.includes('@phone.yamaha.lk') ? '' : rawEmail;

    return {
      id: sbUser.id,
      email: displayEmail,
      name: meta.full_name || meta.name || meta.phone || 'Customer',
      nic: meta.nic || '',
      phone: meta.phone || (sbUser.phone || ''),
      bikeModel: meta.bikeModel || meta.bike_model || 'Yamaha Bike',
      isAdmin: Boolean(isAdmin),
      rawUser: sbUser
    };
  };

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // 1. Fetch active session on initial load
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(formatUser(session?.user));
        setLoading(false);
      });

      // 2. Listen to real-time auth changes
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

  const loginWithPhonePassword = async (phoneOrEmail, password) => {
    if (isSupabaseConfigured && supabase) {
      const trimmed = (phoneOrEmail || '').trim();
      const isEmail = trimmed.includes('@');
      const email = isEmail ? trimmed : phoneToAuthEmail(trimmed);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (!isEmail) {
          const rawDigits = trimmed.replace(/[\s-]/g, '');
          const e164 = rawDigits.startsWith('0') ? `+94${rawDigits.slice(1)}` : rawDigits;
          const phoneRes = await supabase.auth.signInWithPassword({
            phone: e164,
            password
          }).catch(() => null);
          if (phoneRes?.data?.session) return phoneRes.data;
        }
        throw error;
      }
      return data;
    }

    // LocalStorage Fallback for Offline / Local dev mode
    const cleanInput = (phoneOrEmail || '').trim().replace(/[\s-]/g, '');
    const localUsers = JSON.parse(localStorage.getItem('yamaha_local_users') || '[]');
    const matchedUser = localUsers.find(
      (u) =>
        (u.phone?.replace(/[\s-]/g, '') === cleanInput || (u.email && u.email.toLowerCase() === phoneOrEmail.trim().toLowerCase())) &&
        u.password === password
    );

    if (!matchedUser) {
      throw new Error('දුරකථන අංකය හෝ මුරපදය වැරදියි (Invalid phone number or password).');
    }

    const sessionObj = { user: matchedUser };
    localStorage.setItem('yamaha_current_user', JSON.stringify(matchedUser));
    setUser(matchedUser);
    setSession(sessionObj);
    return { user: matchedUser, session: sessionObj };
  };

  const signUpWithPhonePassword = async (phone, password, userMetaData = {}) => {
    const cleanPhone = (phone || '').replace(/[\s-]/g, '');

    if (isSupabaseConfigured && supabase) {
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
            email: userMetaData.email || ''
          }
        }
      });
      if (error) throw error;
      return data;
    }

    // LocalStorage Fallback for Offline / Local dev mode
    const localUsers = JSON.parse(localStorage.getItem('yamaha_local_users') || '[]');
    const existing = localUsers.find(
      (u) => u.phone?.replace(/[\s-]/g, '') === cleanPhone
    );
    if (existing) {
      throw new Error('මෙම දුරකථන අංකය දැනටමත් ලියාපදිංචි කර ඇත (This phone number is already registered). කරුණාකර Sign In වන්න.');
    }

    const newUser = {
      id: 'local_usr_' + Date.now(),
      phone: cleanPhone,
      name: userMetaData.name || 'Customer',
      nic: userMetaData.nic || '',
      bikeModel: userMetaData.bikeModel || 'Yamaha FZ-S V3',
      email: userMetaData.email || '',
      password: password,
      isAdmin: cleanPhone === '0770000000',
      createdAt: new Date().toISOString()
    };

    localUsers.push(newUser);
    localStorage.setItem('yamaha_local_users', JSON.stringify(localUsers));
    localStorage.setItem('yamaha_current_user', JSON.stringify(newUser));

    setUser(newUser);
    setSession({ user: newUser });
    return { user: newUser, session: { user: newUser } };
  };

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

  const googleLogin = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`
        }
      });
      if (error) throw error;
      return data;
    } else {
      throw new Error('Supabase is not configured. Add the required environment variables before signing in.');
    }
  };

  const updateCustomerProfile = async (profileData) => {
    if (isSupabaseConfigured && supabase && user?.rawUser) {
      const { data, error } = await supabase.auth.updateUser({
        data: profileData
      });
      if (error) throw error;
      setUser(formatUser(data.user));
    } else if (user) {
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('yamaha_current_user', JSON.stringify(updatedUser));
      const localUsers = JSON.parse(localStorage.getItem('yamaha_local_users') || '[]');
      const index = localUsers.findIndex((u) => u.id === user.id);
      if (index !== -1) {
        localUsers[index] = { ...localUsers[index], ...profileData };
        localStorage.setItem('yamaha_local_users', JSON.stringify(localUsers));
      }
      setUser(updatedUser);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('yamaha_current_user');
    setUser(null);
    setSession(null);
  };

  const openAuthModal = () => setShowAuthModal(true);
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

