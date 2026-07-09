import { useState } from 'react';

/**
 * useImageLoad — image load হওয়া পর্যন্ত skeleton দেখায়
 * Returns: { loaded, onLoad, onError }
 */
const useImageLoad = () => {
  const [loaded, setLoaded] = useState(false);

  return {
    loaded,
    onLoad:  () => setLoaded(true),
    onError: () => setLoaded(true), // error হলেও skeleton সরিয়ে দাও
  };
};

export default useImageLoad;