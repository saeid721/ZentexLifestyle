
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/env";

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API = API_BASE_URL;

  useEffect(() => {
    axios
      .get(`${API}/categories`)
      .then((res) => {
        if (res.data.success) {
          const formatted = res.data.data.map((cat) => ({
            id: cat.id,
            name: cat.name,
            label: cat.name.toUpperCase(),
            slug: cat.slug,
            image: cat.image,
            span: "tall",
          }));
          setCategories(formatted);
        } else {
          setError(res.data.message || "Failed to fetch categories");
        }
      })
      .catch((err) => {
        console.error("Categories API error:", err);
        setError("Unable to load categories. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, [API]);

  return { categories, loading, error };
};