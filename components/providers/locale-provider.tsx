'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';
import { zh, en } from '@/locales';
import type { Locale } from '@/locales';

type Lang = 'zh' | 'en';

interface LocaleContextValue {
  lang: Lang;
  t: Locale;
  setLang: (lang: Lang) => void;
}

const locales: Record<Lang, Locale> = { zh, en };

const LocaleContext = createContext<LocaleContextValue>({
  lang: 'zh',
  t: zh,
  setLang: () => {}
});

const STORAGE_KEY = 'ezlink-locale';

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('zh');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && locales[saved]) {
      setLangState(saved);
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  return (
    <LocaleContext.Provider value={{ lang, t: locales[lang], setLang }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
