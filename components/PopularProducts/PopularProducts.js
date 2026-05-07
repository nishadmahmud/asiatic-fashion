"use client";

import { useState } from "react";
import Image from "next/image";

const filters = ["ALL", "SHORTS", "JACKETS", "SHOES", "T-SHIRT"];

const products = [
  {
    id: 1,
    name: "Casual Shirt",
    price: 225,
    image: "/images/products/casual_shirt.png",
    category: "T-SHIRT",
  },
  {
    id: 2,
    name: "Sunglass",
    price: 125,
    image: "/images/products/sunglass.png",
    category: "SHORTS",
  },
  {
    id: 3,
    name: "Galaxy Watch",
    price: 75,
    image: "/images/products/watch.png",
    category: "SHORTS",
  },
  {
    id: 4,
    name: "Gery T-shirt",
    price: 120,
    image: "/images/products/jacket.png",
    category: "JACKETS",
  },
  {
    id: 5,
    name: "Premium Jacket",
    price: 185,
    image: "/images/products/green_jacket.png",
    category: "JACKETS",
  },
  {
    id: 6,
    name: "Hoodie Winter",
    price: 95,
    image: "/images/products/hoodie.png",
    category: "T-SHIRT",
  },
  {
    id: 7,
    name: "Modern Blazer",
    price: 245,
    image: "/images/products/polo.png",
    category: "T-SHIRT",
  },
  {
    id: 8,
    name: "White Hoodie",
    price: 110,
    image: "/images/products/hoodie_white.png",
    category: "T-SHIRT",
  },
];

function HeartIcon({ filled }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "#E8611A" : "none"}
      stroke={filled ? "#E8611A" : "currentColor"}
      strokeWidth="2"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ProductCard({ product }) {
  const [liked, setLiked] = useState(false);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-[#E5E5E5]/50 hover:shadow-xl hover:border-[#E5E5E5] transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          unoptimized
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {/* Wishlist */}
        <button
          onClick={() => setLiked(!liked)}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            liked
              ? "bg-[#E8611A]/10 text-[#E8611A]"
              : "bg-white/80 backdrop-blur-sm text-[#999999] hover:bg-white hover:text-[#E8611A]"
          } shadow-sm`}
          aria-label="Add to wishlist"
        >
          <HeartIcon filled={liked} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 md:p-4">
        <h4 className="text-sm font-medium text-[#1A1A1A] truncate">
          {product.name}
        </h4>
        <p className="text-sm font-bold text-[#1A1A1A] mt-1">
          ${product.price}
        </p>
      </div>
    </div>
  );
}

export default function PopularProducts() {
  const [activeFilter, setActiveFilter] = useState("ALL");

  const filteredProducts =
    activeFilter === "ALL"
      ? products
      : products.filter((p) => p.category === activeFilter);

  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12" id="products">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A]">
          Popular products
        </h2>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all duration-300 ${
                activeFilter === filter
                  ? "bg-[#E8611A] text-white shadow-md shadow-[#E8611A]/25"
                  : "bg-white text-[#6B6B6B] border border-[#E5E5E5] hover:border-[#6B6B6B]"
              }`}
              id={`prod-filter-${filter.toLowerCase()}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
