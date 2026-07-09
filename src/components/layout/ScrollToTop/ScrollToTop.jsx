// src/components/layout/ScrollToTop/ScrollToTop.jsx
import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * @typedef {object} ScrollToTopProps
 * @property {() => void} [onScrollComplete]
 * @property {boolean} [smooth] 
 * @property {number} [delay]
 * @property {boolean} [onlyOnPathnameChange]
 */

/** @param {ScrollToTopProps} props */
const ScrollToTop = ({
  onScrollComplete,
  smooth = true,
  delay = 0,
  onlyOnPathnameChange = false,
}) => {
  const location = useLocation();
  const prevPathnameRef = useRef(location.pathname);
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    // Disable browser's native scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  useEffect(() => {
    const { pathname, hash } = location;

    // Skip if pathname unchanged & onlyOnPathnameChange is true
    if (onlyOnPathnameChange && pathname === prevPathnameRef.current) {
      return;
    }

    // Clear any pending scroll
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    const performScroll = () => {
      // Handle hash anchor scroll
      if (hash) {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({
            behavior: smooth ? 'smooth' : 'auto',
            block: 'start',
          });
          onScrollComplete?.();
        }
        return;
      }

      // Scroll to top
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: smooth ? 'smooth' : 'auto',
      });

      // Callback after scroll (CSS smooth scroll ~300-500ms)
      if (smooth && onScrollComplete) {
        // Listen for scroll end more accurately
        let scrollEndTimer;
        const onScroll = () => {
          clearTimeout(scrollEndTimer);
          scrollEndTimer = setTimeout(() => {
            window.removeEventListener('scroll', onScroll);
            onScrollComplete();
          }, 100); // Wait 100ms after scroll stops
        };
        window.addEventListener('scroll', onScroll, { passive: true });
      } else {
        onScrollComplete?.();
      }
    };

    // Delay before scrolling (for content render)
    scrollTimeoutRef.current = setTimeout(performScroll, delay);
    prevPathnameRef.current = pathname;

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [location, smooth, delay, onlyOnPathnameChange, onScrollComplete]);

  return null;
};

export default React.memo(ScrollToTop);