import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../services/apiClient';

/**
 * Generic data-fetching hook (ViewModel layer).
 * Supports abort on unmount, dependency-driven re-fetch, and manual refresh.
 */
const useFetch = (url, options = {}) => {
  const { immediate = true, initialData = null } = options;

  const [data, setData]       = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError]     = useState(null);
  const abortRef              = useRef(null);

  const fetch = useCallback(async (overrideUrl) => {
    const endpoint = overrideUrl || url;
    if (!endpoint) return;

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get(endpoint, {
        signal: abortRef.current.signal,
      });
      setData(res?.data ?? res);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setError(err?.response?.data?.message || 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (immediate) fetch();
    return () => abortRef.current?.abort();
  }, [fetch, immediate]);

  return { data, loading, error, refetch: fetch };
};

export default useFetch;
