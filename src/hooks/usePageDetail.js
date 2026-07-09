// src/hooks/usePageDetail.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const API = API_BASE_URL;

/**
 * Custom hook to fetch page details by slug
 * @param {string} slug - The page slug identifier
 * @returns {Object} { data, loading, error }
 */
export const usePageDetail = (slug) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true); // Start as true for initial load
  const [error, setError] = useState(null);

  useEffect(() => {
    // Skip if no slug provided
    if (!slug) {
      setError('No slug provided');
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    let isMounted = true;

    axios
      .get(`${API}/page?slug=${slug}`)
      .then((res) => {
        if (!isMounted) return;
        
        if (res.data?.success) {
          setData(res.data.data);
        } else {
          setError(res.data?.message || 'Failed to load page');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.response?.status === 404 
          ? 'Page not found' 
          : 'An error occurred while fetching the page');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { data, loading, error };
};