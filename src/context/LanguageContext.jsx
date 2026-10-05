import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from '../constants/translations';

const LanguageContext = createContext(null);

const defaultT = (path, fallback = '') => {
  if (!path) return fallback;
  const parts = path.split('.');
  let current = translations.en;
  for (const key of parts) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      current = null;
      break;
    }
  }
  return typeof current === 'string' ? current : (fallback || path);
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('yamaha_lang');
      return saved === 'si' ? 'si' : 'en';
    } catch {
      return 'en';
    }
  });

  const setLang = useCallback((newLang) => {
    const validLang = newLang === 'si' ? 'si' : 'en';
    setLangState(validLang);
    try {
      localStorage.setItem('yamaha_lang', validLang);
      document.documentElement.lang = validLang;
    } catch {
      // ignore localStorage errors in sandboxed environments
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'si' : 'en');
  }, [lang, setLang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  /**
   * Safe nested key translation helper
   * Usage: t('profile.fullNameLabel') or t('common.save')
   */
  const t = useCallback((path, fallback = '') => {
    if (!path) return fallback;
    const parts = path.split('.');
    
    // First try active language
    let current = translations[lang];
    for (const key of parts) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        current = null;
        break;
      }
    }

    if (current && typeof current === 'string') {
      return current;
    }

    // Fallback to English
    let enFallback = translations.en;
    for (const key of parts) {
      if (enFallback && typeof enFallback === 'object' && key in enFallback) {
        enFallback = enFallback[key];
      } else {
        enFallback = null;
        break;
      }
    }

    if (enFallback && typeof enFallback === 'string') {
      return enFallback;
    }

    return fallback || path;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      lang: 'en',
      setLang: () => {},
      toggleLang: () => {},
      t: defaultT
    };
  }
  return context;
}

