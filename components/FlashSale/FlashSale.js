"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const saleProducts = [
  {
    id: 101,
    name: "Limited Edition Jacket",
    originalPrice: 299,
    salePrice: 149,
    image: "/images/products/green_jacket.png",
  },
  {
    id: 102,
    name: "Designer Sunglasses",
    originalPrice: 150,
    salePrice: 89,
    image: "/images/products/sunglass.png",
  },
];

export default function FlashSale() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 12,
    minutes: 45,
    seconds: 30,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            }
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 py-10 md:py-16">
      <div className="bg-[#FFF3ED] rounded-3xl overflow-hidden flex flex-col lg:flex-row relative shadow-xl border border-[#E8611A]/20">
        
        {/* Left Side: Content & Timer */}
        <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#E8611A] text-white rounded-full text-sm font-bold tracking-wide w-fit mb-6 shadow-md shadow-[#E8611A]/30">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            FLASH SALE
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-[#1A1A1A] mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Up to 50% Off<br />Premium Styles
          </h2>
          <p className="text-[#6B6B6B] mb-8 max-w-md text-sm md:text-base">
            Hurry up! These exclusive deals are only available for a limited time. Grab your favorites before they are gone.
          </p>

          {/* Countdown Timer */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-xl flex items-center justify-center text-2xl md:text-3xl font-bold text-[#E8611A] shadow-sm border border-[#E5E5E5]">
                {String(timeLeft.hours).padStart(2, "0")}
              </div>
              <span className="text-xs text-[#6B6B6B] mt-2 font-bold uppercase tracking-wider">Hours</span>
            </div>
            <span className="text-2xl font-bold text-[#1A1A1A]/30 -mt-6">:</span>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-xl flex items-center justify-center text-2xl md:text-3xl font-bold text-[#E8611A] shadow-sm border border-[#E5E5E5]">
                {String(timeLeft.minutes).padStart(2, "0")}
              </div>
              <span className="text-xs text-[#6B6B6B] mt-2 font-bold uppercase tracking-wider">Mins</span>
            </div>
            <span className="text-2xl font-bold text-[#1A1A1A]/30 -mt-6">:</span>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-[#E8611A] rounded-xl flex items-center justify-center text-2xl md:text-3xl font-bold text-white shadow-lg shadow-[#E8611A]/30">
                {String(timeLeft.seconds).padStart(2, "0")}
              </div>
              <span className="text-xs text-[#E8611A] mt-2 font-bold uppercase tracking-wider">Secs</span>
            </div>
          </div>

          <button className="bg-[#1A1A1A] text-white px-8 py-3.5 rounded-full font-bold hover:bg-[#E8611A] transition-all duration-300 w-fit shadow-lg">
            Shop Sale Now
          </button>
        </div>

        {/* Right Side: Products */}
        <div className="lg:w-5/12 bg-white/60 backdrop-blur-sm p-6 md:p-8 flex items-center relative z-10 border-l border-white/50">
          <div className="w-full space-y-4">
            {saleProducts.map((product) => (
              <Link href="/product/240158" key={product.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all border border-[#E5E5E5] cursor-pointer group hover:-translate-y-1 block">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-[#F8F8F6] rounded-xl relative overflow-hidden shrink-0">
                  <Image 
                    src={product.image} 
                    alt={product.name} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-[#1A1A1A] font-bold text-sm md:text-base line-clamp-1 mb-1">{product.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[#E8611A] font-extrabold text-lg">${product.salePrice}</span>
                    <span className="text-[#999999] text-sm line-through font-medium">${product.originalPrice}</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#FFF3ED] flex items-center justify-center text-[#E8611A] group-hover:bg-[#E8611A] group-hover:text-white transition-colors shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 z-0 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E8611A]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 z-0 pointer-events-none"></div>
      </div>
    </section>
  );
}
