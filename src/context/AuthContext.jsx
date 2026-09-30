import { createContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const formatUser = (sbUser, customMeta = {}) => {
    if (!sbUser) return null;
    const meta = { ...(sbUser.user_metadata || {}), ...customMeta };
    const appMeta = sbUser.app_metadata || {};
    const isAdmin = appMeta.role === 'admin';

    return {
      id: sbUser.id,
      email: sbUser.email || '',
      name: meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'Customer',
      nic: meta.nic || '',
      phone: meta.phone || '',
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

  const loginWithEmailPassword = async (email, password) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data;
    }
    throw new Error('Supabase is not configured yet. Please check your .env.local file.');
  };

  const signUpWithEmailPassword = async (email, password, userMetaData = {}) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userMetaData.name,
            nic: userMetaData.nic,
            phone: userMetaData.phone,
            bikeModel: userMetaData.bikeModel
          }
        }
      });
      if (error) throw error;
      return data;
    }
    throw new Error('Supabase is not configured yet. Please check your .env.local file.');
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
    } else {
      throw new Error('Supabase is not configured. Customer profiles cannot be stored locally.');
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
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

