// src/pages/Home/useHomeData.js
import { useEffect, useState } from "react";
import { apiGet } from "../../utils/api";
import fallbackHero from "../../assets/images/banner02.jpg";

let homeDataCache = null;
let homeDataPromise = null;

const fallbackHomeData = {
  featuredCategories: [],
  categories: [],
  banners: [
    {
      id: "local-first-paint",
      image: fallbackHero,
      title: "Premium Sneaker Collection",
      description: "Shop the latest sneakers, apparel, and accessories.",
      btn_text: "Shop Now",
      link: "/new-arrivals",
    },
  ],
  new_arrivals: [],
  key_features: [],
};

export const useHomeData = () => {
  const [data, setData] = useState(homeDataCache || fallbackHomeData);
  const [loading, setLoading] = useState(!homeDataCache);

  useEffect(() => {
    if (homeDataCache) {
      queueMicrotask(() => {
        setData(homeDataCache);
        setLoading(false);
      });
      return;
    }

    const schedule = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 1200));
    const cancel = window.cancelIdleCallback || window.clearTimeout;

    const id = schedule(() => {
      if (!homeDataPromise) {
        homeDataPromise = apiGet("/home")
          .then((res) => {
            if (!res.data?.success) {
              throw new Error("API returned success=false");
            }

            const responseData = res.data.data || {};
            const normalized = {
              featuredCategories: responseData.featuredCategories || [],
              categories: responseData.categories || [],
              banners: responseData.banners?.length ? responseData.banners : fallbackHomeData.banners,
              new_arrivals: responseData.new_arrivals || [],
              key_features: responseData.key_features || [],
            };

            homeDataCache = normalized;
            return normalized;
          })
          .catch((err) => {
            console.error("Home API error:", err);
            return fallbackHomeData;
          })
          .finally(() => {
            homeDataPromise = null;
          });
      }

      homeDataPromise
        .then((normalized) => {
          setData(normalized);
        })
        .finally(() => setLoading(false));
    }, { timeout: 2500 });

    return () => cancel(id);
  }, []);

  return { data, loading };
};
