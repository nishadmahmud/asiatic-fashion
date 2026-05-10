"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getBannerFromServer } from "@/lib/api";

const dummyCards = [
  {
    id: 1,
    title: "The Signature Collection",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: 2,
    title: "Summer Essentials",
    image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=1200",
  },
];

export default function PromoCards() {
  const [cards, setCards] = useState(dummyCards);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await getBannerFromServer();
        if (response.success && response.banners && response.banners.length > 0) {
          // Use non-featured banners for promo cards
          const promoBanners = response.banners
            .filter((b) => b.type !== "featured" && b.status === 1)
            .slice(0, 2)
            .map((banner) => ({
              id: banner.id,
              title: banner.title || banner.description || "Shop Now",
              image: banner.image_path,
              link: banner.button_url || "/category/16167",
            }));
          if (promoBanners.length > 0) setCards(promoBanners);
        }
      } catch (error) {
        console.error("Error fetching banners:", error);
      }
    };
    fetchBanners();
  }, []);

  return (
    <section className="w-full max-w-[1600px] mx-auto px-4 md:px-12 py-10" id="promo-section">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {cards.map((card) => (
          <div
            key={card.id}
            className="relative h-[400px] md:h-[500px] lg:h-[600px] bg-[#F8F8F6] overflow-hidden group"
          >
            <Image
              src={card.image}
              alt={card.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
              <h3 className="text-white text-2xl md:text-3xl font-bold tracking-tight mb-6 uppercase">
                {card.title}
              </h3>
              <Link
                href={card.link || "/category/16167"}
                className="inline-flex items-center gap-2 text-white text-xs font-bold tracking-widest uppercase hover:opacity-70 transition-opacity"
              >
                Discover More
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
