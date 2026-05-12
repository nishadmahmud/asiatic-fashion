"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCategoriesFromServer } from "@/lib/api";

const CategoriesContext = createContext(null);

export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (loading || loaded || categories.length > 0) return;
    setLoading(true);
    try {
      const response = await getCategoriesFromServer();
      if (response?.success && Array.isArray(response?.data)) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoaded(true);
      setLoading(false);
    }
  }, [categories.length, loaded, loading]);

  const seedCategories = useCallback((initialCategories) => {
    if (!Array.isArray(initialCategories) || initialCategories.length === 0) return;
    setCategories((prev) => (prev.length > 0 ? prev : initialCategories));
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const value = useMemo(
    () => ({ categories, loading, loaded, fetchCategories, seedCategories }),
    [categories, loading, loaded, fetchCategories, seedCategories]
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error("useCategories must be used within CategoriesProvider");
  }
  return context;
}
