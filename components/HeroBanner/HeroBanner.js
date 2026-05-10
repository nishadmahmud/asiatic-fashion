"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSlidersFromServer } from "@/lib/api";

const dummySlides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600",
    title: "NEW SEASON",
    link: "/category/16167",
  },
];

export default function HeroBanner() {
  const [slides, setSlides] = useState(dummySlides);
  const [current, setCurrent] = useState(0);

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
      }
    };
    fetchSliders();
  }, []);

  // Auto-play
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative w-full h-[60vh] md:h-[75vh] lg:h-[85vh] bg-[#F8F8F6] overflow-hidden">
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
            className="object-cover"
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {slide.title && (
            <div className="absolute bottom-12 md:bottom-20 left-0 w-full">
              <div className="max-w-[1600px] mx-auto px-4 md:px-12">
                <h2 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight uppercase mb-6">
                  {slide.title}
                </h2>
                <Link
                  href={slide.link || "/category/16167"}
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

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`h-0.5 rounded-full transition-all duration-300 ${
                index === current ? "bg-white w-8" : "bg-white/40 w-4"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
