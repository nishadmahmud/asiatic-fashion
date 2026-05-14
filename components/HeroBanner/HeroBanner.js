"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSlidersFromServer } from "@/lib/api";
import { useCategories } from "@/context/CategoriesContext";
import CategoryNavBar from "@/components/CategoryNavBar/CategoryNavBar";
import { sortCategoriesForNav } from "@/lib/sortCategoriesForNav";

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
    let raw = [];
    if (Array.isArray(contextCategories) && contextCategories.length > 0) raw = contextCategories;
    else if (Array.isArray(initialCategories) && initialCategories.length > 0) raw = initialCategories;
    return sortCategoriesForNav(raw);
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
  const activeSlide = slides[current];

  if (loading && slides.length === 0) {
    return (
      <div className="relative z-0 w-full mt-0 md:mt-0">
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
        <div className="relative z-0 w-full mt-0.5 md:mt-0">
          <section className="relative w-full aspect-[16/7] min-h-[200px] max-h-[40vh] bg-[#F0F0EE]" aria-hidden />
          <CategoryNavBar categories={navCategories} variant="hero-attach" />
        </div>
      );
    }
    return null;
  }

  return (
    <div className="relative z-0 w-full mt-0.5 md:mt-0">
      <section className="relative z-0 w-full aspect-[16/7] min-h-[260px] max-h-[78vh] bg-[#F8F8F6] overflow-hidden">
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
            <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />

            {slide.title && (
              <div
                className={
                  showAttachedNav
                    ? "absolute bottom-24 left-0 hidden w-full md:block"
                    : "absolute bottom-20 left-0 hidden w-full md:block"
                }
              >
                <div className="max-w-[1600px] mx-auto px-4 md:px-12 text-center md:text-left">
                  <p className="text-white/75 text-[10px] md:text-[11px] font-bold tracking-[0.42em] uppercase mb-3 md:mb-4">
                    Asiatic Fashion
                  </p>
                  <h2 className="mx-auto mb-0 max-w-4xl text-[clamp(1.75rem,5vw,3.5rem)] font-semibold uppercase leading-[1.08] tracking-tight text-white md:mx-0 md:mb-6 md:text-[3.25rem] md:tracking-tighter">
                    {slide.title}
                  </h2>
                  <Link
                    href={slide.link || "/#new-arrivals"}
                    className="mt-5 inline-flex items-center gap-3 border border-white/75 bg-white/10 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-white hover:text-[#1A1A1A] md:mt-6 md:px-8 md:py-3.5 md:text-[11px]"
                  >
                    Shop the edit
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="md:size-4" aria-hidden>
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}

        {activeSlide?.title && (
          <div className="pointer-events-auto absolute inset-x-0 bottom-5 z-30 flex flex-col items-center gap-1.5 px-4 text-center md:hidden">
            <p className="text-[8px] font-bold uppercase tracking-[0.32em] text-white/75">Asiatic Fashion</p>
            <h2
              key={activeSlide.id}
              className="max-w-[92vw] text-[13px] font-semibold uppercase leading-snug tracking-[0.12em] text-white"
            >
              {activeSlide.title}
            </h2>
            <Link
              href={activeSlide.link || "/#new-arrivals"}
              className="mt-0.5 inline-flex items-center gap-1.5 border border-white/75 bg-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm transition-all hover:border-white hover:bg-white hover:text-[#1A1A1A] active:opacity-90"
            >
              Shop the edit
              <svg
                className="size-3 shrink-0"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            {slides.length > 1 && (
              <div className="mt-0.5 flex items-center gap-1.5">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Go to slide ${index + 1}`}
                    onClick={() => setCurrent(index)}
                    className={`h-px rounded-full transition-all duration-300 ${
                      index === current ? "w-5 bg-white" : "w-2.5 bg-white/45"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {slides.length > 1 && (
          <div
            className={`absolute left-1/2 z-20 hidden -translate-x-1/2 gap-2 md:flex ${dotsBottomClass}`}
          >
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
