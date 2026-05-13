"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

/**
 * Matches brand-empire/components/ProductDetailsPage.js lightbox (desktop + mobile).
 */
export default function ProductImageLightbox({
  isOpen,
  onClose,
  images,
  currentIndex,
  onIndexChange,
  productName,
}) {
  const total = Array.isArray(images) ? images.length : 0;
  const safeIndex = total > 0 ? Math.min(Math.max(0, currentIndex), total - 1) : 0;
  const src = total > 0 ? images[safeIndex] : null;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && total > 0) {
        onIndexChange(safeIndex === 0 ? total - 1 : safeIndex - 1);
      } else if (e.key === "ArrowRight" && total > 0) {
        onIndexChange(safeIndex === total - 1 ? 0 : safeIndex + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, safeIndex, total, onIndexChange]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !src || typeof document === "undefined") return null;

  const tree = (
    <div
      className="fixed inset-0 bg-white md:bg-gray-900/60 md:backdrop-blur-[3px] z-[100] flex items-center justify-center p-0 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Product images"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full md:w-auto md:h-auto md:inline-block flex items-center justify-center bg-white md:bg-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 md:left-auto md:right-2 z-50 md:z-40 text-black md:bg-white/90 md:hover:bg-white md:text-gray-900 p-2 rounded-full transition-colors md:shadow-lg"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (total <= 0) return;
            onIndexChange(safeIndex === 0 ? total - 1 : safeIndex - 1);
          }}
          className="absolute left-2 md:-left-14 top-1/2 -translate-y-1/2 z-40 bg-white/80 md:bg-white hover:bg-gray-100 text-gray-900 p-3 rounded-full transition-colors shadow-lg"
          aria-label="Previous image"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (total <= 0) return;
            onIndexChange(safeIndex === total - 1 ? 0 : safeIndex + 1);
          }}
          className="absolute right-2 md:-right-14 top-1/2 -translate-y-1/2 z-40 bg-white/80 md:bg-white hover:bg-gray-100 text-gray-900 p-3 rounded-full transition-colors shadow-lg"
          aria-label="Next image"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <div
          className="hidden md:flex absolute left-4 top-4 z-30 flex-col max-h-[80vh] overflow-y-auto scrollbar-hide"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onIndexChange(index)}
              className={`relative w-14 h-16 flex-shrink-0 overflow-hidden transition-all ${
                safeIndex === index ? "opacity-100 z-10" : "opacity-70 hover:opacity-100"
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${index + 1}`}
                width={56}
                height={64}
                unoptimized
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        <div className="relative w-full h-full md:w-auto md:h-auto flex items-center justify-center">
          <Image
            src={src}
            alt={productName || "Product"}
            width={1400}
            height={1800}
            unoptimized
            className="w-full h-auto max-h-full md:h-[95vh] md:w-auto md:max-w-[90vw] object-contain md:rounded md:shadow-2xl"
            sizes="(max-width: 768px) 100vw, 90vw"
            priority
            draggable={false}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(tree, document.body);
}
