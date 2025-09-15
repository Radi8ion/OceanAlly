import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import App from './App';
import './index.css';
import { SocketProvider } from './contexts/SocketContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/i18n';
import { ClerkProvider } from '@clerk/clerk-react';


const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <I18nextProvider i18n={i18n}>  {/* ✅ Wrap with I18nextProvider */}        
          <LanguageProvider>
            <SocketProvider>
              <App />
            </SocketProvider>
          </LanguageProvider>
      </I18nextProvider>
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
