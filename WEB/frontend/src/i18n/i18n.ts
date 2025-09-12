// src/i18n/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  // Load translation files from public/locales
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Default language
    fallbackLng: 'en',
    
    // Debug mode for development
    debug: process.env.NODE_ENV === 'development',
    
    // Detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    // Backend options
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Supported languages
   // Supported languages
supportedLngs: ['en', 'hi', 'ml', 'bn', 'te', 'or'], // ✅ Added 'or' for Odia

    
    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation'],
    
    // React options
    react: {
      useSuspense: false,
    },
  });

export default i18n;