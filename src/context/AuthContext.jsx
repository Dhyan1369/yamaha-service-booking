import { createContext, useState, useEffect } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'yamaha_auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (err) {
      console.error('Failed to update localStorage with user:', err);
    }
  }, [user]);

  const login = (userData) => {
    setUser(userData);
    setShowAuthModal(false);
  };

  const googleLogin = () => {
    const googleUser = {
      name: 'Charith Fernando',
      nic: '984521098V',
      phone: '0778901234',
      bikeModel: 'Yamaha MT-15',
      method: 'Google Account'
    };
    login(googleUser);
  };

  const logout = () => {
    setUser(null);
  };

  const openAuthModal = () => setShowAuthModal(true);
  const closeAuthModal = () => setShowAuthModal(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        googleLogin,
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
