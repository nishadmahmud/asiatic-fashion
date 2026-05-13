"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ProductCard({ product, showMobileArrows = false }) {
  const [currentImg, setCurrentImg] = useState(0);

  const brand = product.brand || "ASIATIC";
  const colors = product.colors || ["#1A1A1A"];
  const price = typeof product.price === "number" ? product.price : 0;
  const originalPrice = product.originalPrice || null;
  const discount = product.discount || "";
  const productLink = `/product/${product.id || 240158}`;

  // Build images array — support both single `image` and `images[]`
  const images = (() => {
    if (Array.isArray(product.images) && product.images.length > 0) return product.images;
    if (product.image) return [product.image];
    return ["/placeholder.png"];
  })();

  const hasMultiple = images.length > 1;

  const prevImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImg((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImg((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="group cursor-pointer w-full">
      <Link href={productLink} className="block">
        {/* Image Container */}
        <div className="relative w-full aspect-[3/4] bg-[#F8F8F6] overflow-hidden mb-4">
          <Image
            src={images[currentImg]}
            alt={product.name}
            fill
            unoptimized
            className="object-contain object-center transition-all duration-500 group-hover:scale-105"
          />

          {/* Discount Badge */}
          {discount && (
            <div className="absolute top-3 left-3 bg-[#1A1A1A] text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 z-10">
              {discount}
            </div>
          )}

          {/* Desktop arrows (hover) + optional mobile arrows for list view */}
          {hasMultiple && (
            <>
              <button
                onClick={prevImg}
                className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm items-center justify-center transition-opacity duration-300 z-10 hover:bg-white shadow-sm ${
                  showMobileArrows
                    ? "flex md:hidden"
                    : "hidden md:flex opacity-0 md:group-hover:opacity-100"
                }`}
                aria-label="Previous image"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button
                onClick={nextImg}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm items-center justify-center transition-opacity duration-300 z-10 hover:bg-white shadow-sm ${
                  showMobileArrows
                    ? "flex md:hidden"
                    : "hidden md:flex opacity-0 md:group-hover:opacity-100"
                }`}
                aria-label="Next image"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>

              {/* Dot Indicators */}
              <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 transition-opacity duration-300 ${
                showMobileArrows
                  ? "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              }`}>
                {images.slice(0, 5).map((_, idx) => (
                  <span
                    key={idx}
                    className={`block rounded-full transition-all duration-300 ${
                      idx === currentImg ? "w-4 h-1 bg-[#1A1A1A]" : "w-1 h-1 bg-[#1A1A1A]/40"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#999999] tracking-widest uppercase font-bold">
            {brand}
          </span>
          <h3 className="text-xs text-[#1A1A1A] font-medium leading-relaxed truncate">
            {product.name}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#1A1A1A]">
                ৳{price.toLocaleString()}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-xs text-[#999999] line-through">
                  ৳{originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {/* Colors */}
            <div className="flex gap-1">
              {colors.map((color, idx) => (
                <div
                  key={idx}
                  className="w-3.5 h-3.5 border border-[#E5E5E5]"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
