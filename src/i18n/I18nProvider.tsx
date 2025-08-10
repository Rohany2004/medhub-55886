import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './translations/en';
import hi from './translations/hi';
import mr from './translations/mr';

export type Language = 'en' | 'hi' | 'mr';

type Dict = Record<string, string | Record<string, any>>;

const dictionaries: Record<Language, Dict> = { en, hi, mr } as const;

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getFromPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => (acc && acc[part] != null ? acc[part] : undefined), obj);
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('lang') as Language | null;
    return saved ?? 'en';
  });

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    const dict = dictionaries[language];
    let res = getFromPath(dict, key);
    if (res == null) {
      // fallback to English
      res = getFromPath(dictionaries.en, key) ?? key;
    }
    if (typeof res !== 'string') return key;
    if (!vars) return res;
    return Object.keys(vars).reduce((acc, k) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]!)), res);
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
