import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enCommon from './locales/en/common.json';
import hiCommon from './locales/hi/common.json';

const resources = {
  en: {
    common: enCommon,
  },
  hi: {
    common: hiCommon,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    debug: false,
    
    // have a common namespace used around the full app
    defaultNS: 'common',
    ns: ['common'],

    keySeparator: '.',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });

export default i18n;