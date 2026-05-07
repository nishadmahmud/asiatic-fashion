"use client";

import { useState, useEffect, useRef } from "react";

const reviews = [
  {
    id: 1,
    name: "Sarah Ahmed",
    initials: "SA",
    rating: 5,
    text: "Absolutely love the quality! The fabric is premium and the fit is perfect. Will definitely order more from Asiatic Fashion.",
    gradient: "from-orange-400 to-pink-500",
  },
  {
    id: 2,
    name: "Rafiq Hassan",
    initials: "RH",
    rating: 5,
    text: "Best fashion store I've found online. The delivery was fast and the clothes look exactly like the photos. Highly recommended!",
    gradient: "from-blue-400 to-purple-500",
  },
  {
    id: 3,
    name: "Nadia Islam",
    initials: "NI",
    rating: 4,
    text: "Great collection and very stylish designs. The customer service was also very helpful when I needed to exchange a size.",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    id: 4,
    name: "Kamal Roy",
    initials: "KR",
    rating: 5,
    text: "The premium jacket I ordered exceeded my expectations. The attention to detail is impressive. Five stars!",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    id: 5,
    name: "Fatima Begum",
    initials: "FB",
    rating: 5,
    text: "I've been shopping here for months now. Every purchase has been a delight. The styles are always on trend and the prices are fair.",
    gradient: "from-rose-400 to-red-500",
  },
  {
    id: 6,
    name: "Arif Khan",
    initials: "AK",
    rating: 4,
    text: "Really good quality casual wear. The t-shirts are super comfortable and have held up well after many washes.",
    gradient: "from-violet-400 to-indigo-500",
  },
];

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={star <= rating ? "#F59E0B" : "none"}
          stroke={star <= rating ? "#F59E0B" : "#D1D5DB"}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -340 : 340,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-12 md:py-16 bg-[#F8F8F6]" id="reviews-section">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A]">
              Over 350+ Customer
              <br className="sm:hidden" /> Reviews from our clients
            </h2>
            <p className="text-sm text-[#6B6B6B] mt-2">
              See what our happy customers have to say
            </p>
          </div>

          {/* Scroll Arrows (Desktop) */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="w-10 h-10 rounded-full border border-[#E5E5E5] bg-white flex items-center justify-center hover:bg-[#E8611A] hover:text-white hover:border-[#E8611A] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Scroll left"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="w-10 h-10 rounded-full border border-[#E5E5E5] bg-white flex items-center justify-center hover:bg-[#E8611A] hover:text-white hover:border-[#E8611A] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Scroll right"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Reviews Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex-shrink-0 w-[280px] md:w-[320px] bg-white rounded-2xl p-5 md:p-6 border border-[#E5E5E5]/50 hover:shadow-lg transition-shadow duration-300 snap-start"
            >
              {/* Avatar + Name */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${review.gradient} flex items-center justify-center text-white text-sm font-bold`}
                >
                  {review.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">
                    {review.name}
                  </p>
                  <StarRating rating={review.rating} />
                </div>
              </div>

              {/* Review Text */}
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                &ldquo;{review.text}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
