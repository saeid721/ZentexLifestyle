import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/env";

/**
 * Hook: Fetch subcategories for a specific parent category
 * @param {string} categorySlug - The slug of the parent category (e.g., "sneakers")
 * @param {boolean} enabled - Whether to fetch data (default: true)
 * @returns {Object} { subcategories, loading, error, refetch, isEmpty }
 */
export const useSubCategories = (categorySlug, enabled = true) => {
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const API = API_BASE_URL;

  // Memoize the fetch function to avoid unnecessary re-creations
  const fetchSubcategories = useCallback(async () => {
    // Guard clauses
    if (!categorySlug || !enabled) {
      setSubcategories([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all categories (API returns nested subcategories structure)
      const res = await axios.get(`${API}/categories`);
      
      if (res.data?.success && Array.isArray(res.data.data)) {
        // Find the parent category by slug - CRITICAL for isolation
        const parentCategory = res.data.data.find(
          (cat) => cat.slug === categorySlug
        );

        if (parentCategory && Array.isArray(parentCategory.subcategories)) {
          // ✅ Format subcategories with parent context for strict isolation
          const formatted = parentCategory.subcategories.map((sub) => ({
            id: sub.id,
            name: sub.subcategoryName,
            label: sub.subcategoryName?.toUpperCase() || '',
            slug: sub.slug,
            image: sub.image || null,
            // ✅ CRITICAL: Store parent category_id to validate products later
            parentCategoryId: parentCategory.id,
            parentCategorySlug: parentCategory.slug,
            parentCategoryName: parentCategory.name,
            // ✅ Store subcategory's own category_id for product filtering
            subcategoryId: sub.category_id,
            // Add child categories if available (3rd level navigation)
            children: Array.isArray(sub.childcategories) 
              ? sub.childcategories.map((child) => ({
                  id: child.id,
                  name: child.childcategoryName,
                  slug: child.slug,
                  parentSubcategorySlug: sub.slug,
                }))
              : [],
          }));
          setSubcategories(formatted);
        } else {
          // No subcategories found for this category - return empty, not error
          setSubcategories([]);
        }
      } else {
        throw new Error(res.data?.message || "Failed to fetch categories");
      }
    } catch (err) {
      console.error(`Subcategories fetch error for "${categorySlug}":`, err);
      setError(err.message || "Unable to load subcategories. Please try again.");
      setSubcategories([]); // Clear data on error
    } finally {
      setLoading(false);
      setLastFetched(Date.now());
    }
  }, [categorySlug, enabled, API]);

  // Auto-fetch when categorySlug or enabled changes
  useEffect(() => {
    fetchSubcategories();
  }, [fetchSubcategories]);

  // Manual refetch function for pull-to-refresh or retry logic
  const refetch = useCallback(() => {
    setLastFetched(null); // Clear timestamp to force fresh fetch
    return fetchSubcategories();
  }, [fetchSubcategories]);

  // Memoize the returned subcategories array to prevent unnecessary re-renders
  const memoizedSubcategories = useMemo(() => subcategories, [subcategories]);

  return {
    subcategories: memoizedSubcategories,
    loading,
    error,
    refetch,
    lastFetched,
    // Convenience boolean for empty state rendering
    isEmpty: !loading && !error && memoizedSubcategories.length === 0,
  };
};

export default useSubCategories;