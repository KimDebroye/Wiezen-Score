import { TEXTS as nl } from './nl';
import { TEXTS as en } from './en';

export const LOCALES = {
  nl: {
    id: 'nl',
    name: 'Nederlands',
    texts: nl,
  },
  en: {
    id: 'en',
    name: 'English',
    texts: en,
  },
} as const;

export type LanguageId = keyof typeof LOCALES;

export function getTexts(langId: LanguageId) {
  return LOCALES[langId]?.texts || LOCALES.nl.texts;
}
