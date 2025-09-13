import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all your translation files.
// Make sure you have created these files in the 'resources' folder.
import en from './resources/en.json';
import hi from './resources/hi.json';
import or from './resources/or.json';
import bn from './resources/bn.json';
import te from './resources/te.json';
import ta from './resources/ta.json';
import ml from './resources/ml.json';
import kn from './resources/kn.json';
import mr from './resources/mr.json';
import gu from './resources/gu.json';

const resources = {
  en,
  hi,
  or,
  bn,
  te,
  ta,
  ml,
  kn,
  mr,
  gu,
};

// This custom detector finds the user's saved language on their device
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    const savedLanguage = await AsyncStorage.getItem('user-language');
    // If a language is saved, use it. Otherwise, default to English.
    const lng = savedLanguage || 'en';
    callback(lng);
  },
  init: () => {},
  cacheUserLanguage: async (lng) => {
    // Save the user's language choice for the next time they open the app
    await AsyncStorage.setItem('user-language', lng);
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', // Required for React Native
    resources,
    fallbackLng: 'en', // If a translation is missing, use the English version
    interpolation: {
      escapeValue: false, // React already protects from XSS
    },
  });

export default i18n;