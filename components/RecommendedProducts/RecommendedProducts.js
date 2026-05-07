"use client";

import { useState } from "react";
import Image from "next/image";

const products = [
  {
    id: 101,
    name: "Polo with Contrast Trim",
    price: 212,
    originalPrice: 242,
    discount: 20,
    rating: 4.0,
    image: "/images/products/polo.png",
  },
  {
    id: 102,
    name: "Casual Winter Hoodie",
    price: 89,
    originalPrice: 120,
    discount: 25,
    rating: 4.5,
    image: "/images/products/hoodie.png",
  },
  {
    id: 103,
    name: "Premium Green Jacket",
    price: 178,
    originalPrice: 210,
    discount: 15,
    rating: 4.8,
    image: "/images/products/green_jacket.png",
  },
  {
    id: 104,
    name: "Classic White Hoodie",
    price: 95,
    originalPrice: 130,
    discount: 27,
    rating: 4.2,
    image: "/images/products/hoodie_white.png",
  },
];

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={star <= Math.floor(rating) ? "#F59E0B" : star - 0.5 <= rating ? "#F59E0B" : "none"}
          stroke={star <= rating ? "#F59E0B" : "#D1D5DB"}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="text-xs text-[#6B6B6B] ml-1">{rating}/5</span>
    </div>
  );
}

function RecommendedCard({ product }) {
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
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={liked ? "#E8611A" : "none"}
            stroke={liked ? "#E8611A" : "currentColor"}
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="p-3 md:p-4">
        <h4 className="text-sm font-medium text-[#1A1A1A] truncate">
          {product.name}
        </h4>
        <div className="mt-1">
          <StarRating rating={product.rating} />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-bold text-[#1A1A1A]">
            ${product.price}
          </span>
          <span className="text-xs text-[#999999] line-through">
            ${product.originalPrice}
          </span>
          <span className="text-xs font-bold text-[#E8611A] bg-[#E8611A]-light px-1.5 py-0.5 rounded-md">
            -{product.discount}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default function RecommendedProducts() {
  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12" id="recommended-section">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A]">
          You might also like
        </h2>
        <a
          href="#"
          className="text-sm font-medium text-[#E8611A] hover:text-[#E8611A]-hover transition-colors"
        >
          View All →
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <RecommendedCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
