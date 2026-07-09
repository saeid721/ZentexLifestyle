// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async'; // ✅ ADD

// ① Bootstrap customization (must come before component styles)
import './bootstrap/bootstrap.scss';

// ② Global styles
import './styles/global.scss';

import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider> {/* ✅ WRAP */}
      <App />
    </HelmetProvider> {/* ✅ CLOSE */}
  </React.StrictMode>,
);