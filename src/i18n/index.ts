import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import aboutEn from './locales/en/about.json'
import adminEn from './locales/en/admin.json'
import authEn from './locales/en/auth.json'
import commonEn from './locales/en/common.json'
import directoryEn from './locales/en/directory.json'
import eventsEn from './locales/en/events.json'
import homeEn from './locales/en/home.json'
import legalEn from './locales/en/legal.json'
import matrimonialEn from './locales/en/matrimonial.json'
import profileEn from './locales/en/profile.json'

import aboutHi from './locales/hi/about.json'
import adminHi from './locales/hi/admin.json'
import authHi from './locales/hi/auth.json'
import commonHi from './locales/hi/common.json'
import directoryHi from './locales/hi/directory.json'
import eventsHi from './locales/hi/events.json'
import homeHi from './locales/hi/home.json'
import legalHi from './locales/hi/legal.json'
import matrimonialHi from './locales/hi/matrimonial.json'
import profileHi from './locales/hi/profile.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: commonEn,
        home: homeEn,
        about: aboutEn,
        events: eventsEn,
        auth: authEn,
        profile: profileEn,
        matrimonial: matrimonialEn,
        directory: directoryEn,
        admin: adminEn,
        legal: legalEn,
      },
      hi: {
        common: commonHi,
        home: homeHi,
        about: aboutHi,
        events: eventsHi,
        auth: authHi,
        profile: profileHi,
        matrimonial: matrimonialHi,
        directory: directoryHi,
        admin: adminHi,
        legal: legalHi,
      },
    },
    defaultNS: 'common',
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'abgs_language',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
