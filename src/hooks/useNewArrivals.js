import { useEffect, useState } from 'react';
import axios from 'axios';

import { API_BASE_URL } from '../config/env';

const API = API_BASE_URL;

export const useNewArrivals = () => {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/new-arrivals`)
      .then((res) => {
        const body = res.data;
        // Handle both { data: [...] } and { success, data: [...] } shapes
        const list = body?.data ?? body?.products ?? (Array.isArray(body) ? body : []);
        setProducts(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error('New arrivals fetch error:', err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { products, loading };
};