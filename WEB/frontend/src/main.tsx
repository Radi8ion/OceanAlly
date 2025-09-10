import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import App from './App';
import { AuthProvider } from './hooks/useAuth'; // Import the provider here
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* ✅ Wrap App with the provider */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);