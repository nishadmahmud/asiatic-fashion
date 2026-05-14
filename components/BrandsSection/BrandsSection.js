"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTopBrands } from "@/lib/api";

const BrandGrid = ({ title, brands, kicker }) => (
  <div className="mb-12 md:mb-20">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8 pb-5 border-b border-[#E5E5E5]">
      <div>
        {kicker ? (
          <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-[#999999] mb-2">{kicker}</p>
        ) : null}
        <h2 className="text-sm md:text-[15px] font-bold tracking-[0.2em] uppercase text-[#1A1A1A]">{title}</h2>
      </div>
    </div>
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
      {brands.map((brand, index) => (
        <Link key={brand.id || index} href={`/brand/${brand.id}`} className="group relative block aspect-square overflow-hidden bg-[#F8F8F6] hover:bg-[#E5E5E5] transition-colors border border-transparent hover:border-[#1A1A1A]">
          {/* Logo container - centered */}
          <div className="absolute inset-0 flex items-center justify-center p-4 transition-transform duration-500 group-hover:-translate-y-2">
             <div className="relative w-[70%] h-[70%]">
               <Image 
                 src={brand.image_path || brand.image} 
                 alt={brand.name} 
                 fill 
                 className="object-contain opacity-70 group-hover:opacity-100 transition-opacity duration-300 filter grayscale group-hover:grayscale-0" 
                 unoptimized 
               />
             </div>
          </div>
          
          {/* Brand Name - revealed on hover */}
          <div className="absolute bottom-0 left-0 w-full p-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex justify-center items-center bg-[#1A1A1A]">
            <span className="text-white text-[9px] md:text-[10px] font-bold tracking-widest uppercase truncate text-center">{brand.name}</span>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default function BrandsSection() {
  const [internationalBrands, setInternationalBrands] = useState([]);
  const [localBrands, setLocalBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await getTopBrands();
        if (response.success && response.data && response.data.length > 0) {
          // In brand-empire they separated by description, let's just show all as "Top Brands" if there's no description filter needed,
          // but we'll retain the filter logic just in case it is used by asiatic-fashion backend.
          const international = response.data.filter((brand) => brand.description === "International");
          const bangladeshi = response.data.filter((brand) => brand.description === "Local");

          if (international.length === 0 && bangladeshi.length === 0) {
            // If descriptions aren't set, just show all top 8 brands
            setInternationalBrands(response.data.slice(0, 8));
          } else {
            setInternationalBrands(international);
            setLocalBrands(bangladeshi);
          }
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  if (loading || (internationalBrands.length === 0 && localBrands.length === 0)) {
    return null; // Keep it clean, don't show an empty section
  }

  return (
    <section className="w-full max-w-[1600px] mx-auto px-4 md:px-12 py-14 md:py-24" id="brands">
      <header className="mb-14 md:mb-20 max-w-3xl">
        <p className="text-[10px] font-bold tracking-[0.42em] uppercase text-[#999999] mb-4">
          Under the spotlight
        </p>
        <h2 className="text-[clamp(1.65rem,4.2vw,2.65rem)] font-medium text-[#1A1A1A] tracking-tight leading-[1.12] mb-5">
          Labels we love — from Dhaka to the world
        </h2>
        <p className="text-[15px] md:text-base text-[#6B6B6B] leading-relaxed font-light max-w-2xl border-l-[3px] border-[#1A1A1A] pl-5 md:pl-6">
          Handpicked partners with real craft behind the name: consistent quality, honest materials, and cuts
          that feel lived-in from day one.
        </p>
      </header>
      {localBrands.length > 0 ? (
        <>
          {internationalBrands.length > 0 && (
            <BrandGrid title="International Brands" kicker="Global houses" brands={internationalBrands} />
          )}
          <BrandGrid title="Local Brands" kicker="Homegrown favourites" brands={localBrands} />
        </>
      ) : (
        /* If just a single list of brands */
        <BrandGrid title="Featured Brands" kicker="Editor's picks" brands={internationalBrands} />
      )}
    </section>
  );
}
