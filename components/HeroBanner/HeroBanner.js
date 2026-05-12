"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSlidersFromServer } from "@/lib/api";
import { useCategories } from "@/context/CategoriesContext";
import CategoryNavBar from "@/components/CategoryNavBar/CategoryNavBar";

/**
 * @param {Array} initialCategories - Server-fetched categories (homepage).
 * @param {boolean} attachCategoryNav - Flush desktop category strip under hero (homepage).
 */
export default function HeroBanner({ initialCategories = [], attachCategoryNav = false }) {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const { categories: contextCategories } = useCategories();

  const navCategories = useMemo(() => {
    if (Array.isArray(contextCategories) && contextCategories.length > 0) return contextCategories;
    if (Array.isArray(initialCategories) && initialCategories.length > 0) return initialCategories;
    return [];
  }, [contextCategories, initialCategories]);

  useEffect(() => {
    const fetchSliders = async () => {
      try {
        const response = await getSlidersFromServer();
        if (response.success && response.sliders && response.sliders.length > 0) {
          const apiSlides = response.sliders
            .filter((s) => s.status === 1)
            .map((slider) => ({
              id: slider.id,
              image: slider.image_path,
              title: slider.title || "",
              link: slider.link || `/product/${slider.product_id}`,
            }));
          if (apiSlides.length > 0) setSlides(apiSlides);
        }
      } catch (error) {
        console.error("Error fetching sliders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSliders();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const showAttachedNav = attachCategoryNav && navCategories.length > 0;
  const dotsBottomClass = showAttachedNav ? "bottom-14 md:bottom-16" : "bottom-6";

  if (loading && slides.length === 0) {
    return (
      <div className="relative w-full">
        <section
          className={`relative w-full bg-[#F8F8F6] overflow-hidden animate-pulse ${
            attachCategoryNav
              ? "aspect-[16/7] min-h-[240px] max-h-[78vh]"
              : "h-[60vh] md:h-[75vh] lg:h-[85vh]"
          }`}
        />
        {showAttachedNav && <CategoryNavBar categories={navCategories} variant="hero-attach" />}
      </div>
    );
  }

  if (slides.length === 0) {
    if (showAttachedNav) {
      return (
        <div className="relative w-full">
          <section className="relative w-full aspect-[16/7] min-h-[200px] max-h-[40vh] bg-[#F0F0EE]" aria-hidden />
          <CategoryNavBar categories={navCategories} variant="hero-attach" />
        </div>
      );
    }
    return null;
  }

  return (
    <div className="relative w-full">
      <section className="relative w-full aspect-[16/7] min-h-[260px] max-h-[78vh] bg-[#F8F8F6] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title || "Hero Banner"}
              fill
              unoptimized
              className="object-cover object-center"
              priority={index === 0}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-transparent" />

            {slide.title && (
              <div className={`absolute left-0 w-full ${showAttachedNav ? "bottom-20 md:bottom-24" : "bottom-12 md:bottom-20"}`}>
                <div className="max-w-[1600px] mx-auto px-4 md:px-12 text-center md:text-left">
                  <h2 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight uppercase mb-4 md:mb-6">
                    {slide.title}
                  </h2>
                  <Link
                    href={slide.link || "/#new-arrivals"}
                    className="inline-flex items-center gap-2 text-white text-xs font-bold tracking-widest uppercase hover:opacity-70 transition-opacity"
                  >
                    Shop Now
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}

        {slides.length > 1 && (
          <div className={`absolute left-1/2 -translate-x-1/2 z-20 flex gap-2 ${dotsBottomClass}`}>
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => setCurrent(index)}
                className={`h-0.5 rounded-full transition-all duration-300 ${
                  index === current ? "bg-white w-8" : "bg-white/40 w-4"
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {showAttachedNav && <CategoryNavBar categories={navCategories} variant="hero-attach" />}
    </div>
  );
}
