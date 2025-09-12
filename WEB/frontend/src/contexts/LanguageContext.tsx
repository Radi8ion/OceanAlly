// src/contexts/LanguageContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' }, // ✅ Add this
];


interface LanguageContextType {
  currentLanguage: Language;
  languages: Language[];
  changeLanguage: (languageCode: string) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    languages.find(lang => lang.code === i18n.language) || languages[0]
  );

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    const newLanguage = languages.find(lang => lang.code === languageCode) || languages[0];
    setCurrentLanguage(newLanguage);
    
    // Store preference in localStorage
    localStorage.setItem('preferred-language', languageCode);
    
    // Update document direction and language
    document.documentElement.lang = languageCode;
    document.documentElement.dir = isRTLLanguage(languageCode) ? 'rtl' : 'ltr';
  };

  const isRTLLanguage = (code: string): boolean => {
    return ['ar', 'he', 'fa', 'ur'].includes(code);
  };

  useEffect(() => {
    // Update current language when i18n language changes
    const newLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
    setCurrentLanguage(newLanguage);
    
    // Set document properties
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = isRTLLanguage(i18n.language) ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const value: LanguageContextType = {
    currentLanguage,
    languages,
    changeLanguage,
    isRTL: isRTLLanguage(currentLanguage.code),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};