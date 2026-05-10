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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] bg-[#F8F8F6] overflow-hidden group"
          >
            <Image
              src={card.image}
              alt={card.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
              <h3 className="text-white text-xl md:text-2xl font-bold tracking-widest mb-4 uppercase leading-tight">
                {card.title}
              </h3>
              <Link
                href={card.link || "/category/16167"}
                className="inline-flex items-center gap-3 text-white text-xs font-bold tracking-widest uppercase hover:text-gray-300 transition-colors relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-0 after:h-[1px] after:bg-white hover:after:w-full after:transition-all after:duration-300"
              >
                Discover More
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transform group-hover:translate-x-2 transition-transform duration-300">
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
