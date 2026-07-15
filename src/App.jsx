// src/App.jsx
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './components/layout/ScrollToTop/ScrollToTop';
import './styles/scrollAnimations.scss';
import { TRACK_VISIT_URL } from './config/env';

const WhatsAppButton = lazy(() => import('./components/WhatsAppButton'));

const App = () => {
  const [showDeferredUi, setShowDeferredUi] = useState(false);

  useEffect(() => {
    const schedule = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 1800));
    const cancel = window.cancelIdleCallback || window.clearTimeout;
    const id = schedule(() => setShowDeferredUi(true), { timeout: 2500 });
    return () => cancel(id);
  }, []);

  useEffect(() => {
    const deviceId = localStorage.getItem("device_id") ||
      crypto.randomUUID();

    localStorage.setItem("device_id", deviceId);

    fetch(TRACK_VISIT_URL, {
      method: "GET",
      headers: {
        "X-Device-ID": deviceId,
      },
    });
  }, []);

  return (
    <BrowserRouter>
      <Helmet>
        <title>Zentex | Built for the Confident</title>
        <meta name="description" content="Premium Quality Clothing Manufacturer & Exporter." />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="app-shell" style={{ minHeight: '100%' }}>
        <ScrollToTop smooth delay={100} />
        <AppRoutes />
        {showDeferredUi && (
          <Suspense fallback={null}>
            <WhatsAppButton />
          </Suspense>
        )}
      </div>
    </BrowserRouter>
  );
};

export default App;