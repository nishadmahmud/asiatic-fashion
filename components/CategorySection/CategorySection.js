"use client";

import { useState } from "react";
import Image from "next/image";

const filters = ["ALL", "WOMEN", "CHILDREN"];

const categories = [
  { name: "SHOES", image: "/images/categories/shoes.png" },
  { name: "BRUSH", image: "/images/categories/brush.png" },
  { name: "BAG", image: "/images/categories/bag.png" },
  { name: "T-SHIRT", image: "/images/categories/tshirt.png" },
];

export default function CategorySection() {
  const [activeFilter, setActiveFilter] = useState("ALL");

  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12" id="categories-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A]">
          Browse by categories
        </h2>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ${
                activeFilter === filter
                  ? "bg-[#E8611A] text-white shadow-md shadow-[#E8611A]/25"
                  : "bg-white text-[#6B6B6B] border border-[#E5E5E5] hover:border-[#6B6B6B]"
              }`}
              id={`cat-filter-${filter.toLowerCase()}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {categories.map((cat, index) => (
          <div
            key={cat.name}
            className="group relative bg-[#F0ECE3] rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-400 aspect-square"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Image
              src={cat.image}
              alt={cat.name}
              fill
              unoptimized
              className="object-cover object-center group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, 25vw"
            />

            {/* Label */}
            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
              <span className="inline-block px-3 py-1.5 bg-white/90 backdrop-blur-sm text-xs font-bold text-[#1A1A1A] rounded-full shadow-sm">
                {cat.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
