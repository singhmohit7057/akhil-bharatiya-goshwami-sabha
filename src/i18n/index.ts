import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import aboutEn from './locales/en/about.json'
import adminEn from './locales/en/admin.json'
import authEn from './locales/en/auth.json'
import commonEn from './locales/en/common.json'
import contactEn from './locales/en/contact.json'
import galleryEn from './locales/en/gallery.json'
import verifyEn from './locales/en/verify.json'
import directoryEn from './locales/en/directory.json'
import donateEn from './locales/en/donate.json'
import eventsEn from './locales/en/events.json'
import homeEn from './locales/en/home.json'
import legalEn from './locales/en/legal.json'
import matrimonialEn from './locales/en/matrimonial.json'
import membersEn from './locales/en/members.json'
import profileEn from './locales/en/profile.json'
import souvenirsEn from './locales/en/souvenirs.json'

import aboutHi from './locales/hi/about.json'
import adminHi from './locales/hi/admin.json'
import authHi from './locales/hi/auth.json'
import commonHi from './locales/hi/common.json'
import contactHi from './locales/hi/contact.json'
import galleryHi from './locales/hi/gallery.json'
import verifyHi from './locales/hi/verify.json'
import directoryHi from './locales/hi/directory.json'
import donateHi from './locales/hi/donate.json'
import eventsHi from './locales/hi/events.json'
import homeHi from './locales/hi/home.json'
import legalHi from './locales/hi/legal.json'
import matrimonialHi from './locales/hi/matrimonial.json'
import membersHi from './locales/hi/members.json'
import profileHi from './locales/hi/profile.json'
import souvenirsHi from './locales/hi/souvenirs.json'

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
        contact: contactEn,
        donate: donateEn,
        gallery: galleryEn,
        verify: verifyEn,
        members: membersEn,
        souvenirs: souvenirsEn,
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
        contact: contactHi,
        donate: donateHi,
        gallery: galleryHi,
        verify: verifyHi,
        members: membersHi,
        souvenirs: souvenirsHi,
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
