import { useMemo, useState, type ReactNode } from 'react';
import { getTranslation } from './languageDictionary';
import {
  LanguageContext,
  type LanguageCode,
  type LanguageContextValue,
} from './languageStore';

const storageKey = 'sicd-language';

function getInitialLanguage(): LanguageCode {
  if (typeof window === 'undefined') {
    return 'es';
  }

  const savedLanguage = window.localStorage.getItem(storageKey);
  return savedLanguage === 'en' ? 'en' : 'es';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage(nextLanguage) {
        setLanguageState(nextLanguage);
        window.localStorage.setItem(storageKey, nextLanguage);
      },
      t(key) {
        return getTranslation(language, key);
      },
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}
