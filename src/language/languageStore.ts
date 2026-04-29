import { createContext } from 'react';

export type LanguageCode = 'es' | 'en';

export type TranslationValue = string;

export type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string) => TranslationValue;
};

export const LanguageContext = createContext<LanguageContextValue | null>(null);
