"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCategoriesFromServer } from "@/lib/api";

export default function CategorySection({ initialCategories = [] }) {
  const normalizedInitial = useMemo(
    () =>
      Array.isArray(initialCategories)
        ? initialCategories.map((cat) => ({
            id: cat.category_id,
            name: cat.name,
            image: cat.image || null,
            subcategories: cat.sub_category || [],
          }))
        : [],
    [initialCategories]
  );
  const [categories, setCategories] = useState(normalizedInitial);
  const [loading, setLoading] = useState(normalizedInitial.length === 0);

  useEffect(() => {
    if (normalizedInitial.length > 0) {
      setCategories(normalizedInitial);
      setLoading(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await getCategoriesFromServer();
        if (response.success && response.data && response.data.length > 0) {
          const apiCategories = response.data.map((cat) => ({
            id: cat.category_id,
            name: cat.name,
            image: cat.image || null,
            subcategories: cat.sub_category || [],
          }));
          setCategories(apiCategories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [normalizedInitial]);

  return (
    <section className="w-full max-w-[1600px] mx-auto px-4 md:px-12 py-10 md:py-16">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E5E5E5]">
        <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A]">
          Shop by Category
        </h2>
        <Link
          href="/category/16167"
          className="text-xs font-bold tracking-widest uppercase text-[#999999] hover:text-[#1A1A1A] transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
        {loading && categories.length === 0
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div key={`cat-skeleton-${idx}`}>
                <div className="w-full aspect-square bg-[#F8F8F6] animate-pulse mb-3" />
                <div className="h-3 bg-[#F8F8F6] animate-pulse w-2/3 mx-auto" />
              </div>
            ))
          : categories.map((cat) => (
          <Link key={cat.id} href={`/category/${cat.id}`} className="group">
            <div className="relative w-full aspect-square bg-[#F8F8F6] overflow-hidden mb-3">
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#999999]">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 15l6-6 4 4 4-4 4 4" />
                  </svg>
                </div>
              )}
            </div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-center text-[#1A1A1A] group-hover:text-[#999999] transition-colors">
              {cat.name}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
