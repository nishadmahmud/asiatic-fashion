"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getBannerFromServer } from "@/lib/api";

const PromoBanners = () => {
    const [banners, setBanners] = useState([]);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const response = await getBannerFromServer();
                if (response.success && response.banners) {
                    setBanners(response.banners);
                }
            } catch (error) {
                console.error("Error loading banners:", error);
            }
        };

        fetchBanners();
    }, []);

    // Default Images
    const defaultImage1 = "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?q=80&w=2000&auto=format&fit=crop";
    const defaultImage2 = "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=2000&auto=format&fit=crop";

    // Assign images based on user request:
    // 2nd API image -> 1st Card ("The December Edit")
    // 1st API image -> 2nd Card ("Holiday Gifting")
    const image1 = banners.length > 1 ? banners[1].image_path : defaultImage1;
    const image2 = banners.length > 0 ? banners[0].image_path : defaultImage2;

    return (
        <section className="section-content py-10 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Banner 1: The December Edit */}
                <div className="relative h-[350px] md:h-[450px] lg:h-[500px] w-full group overflow-hidden cursor-pointer rounded-sm">
                    <Image
                        src={image1}
                        alt="The December Edit"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    <div className="absolute bottom-6 md:bottom-12 left-6 md:left-10 text-white">
                        <p className="italic font-serif text-lg md:text-2xl mb-1">The</p>
                        <h3 className="text-3xl md:text-5xl font-serif mb-2 leading-none uppercase tracking-wide">
                            DECEMBER <br /> <span className="italic font-normal lowercase">Edit</span>
                        </h3>
                        <p className="text-xs md:text-sm tracking-widest uppercase mb-4 md:mb-6 opacity-90">Blazers that do all the talking.</p>
                        <button className="bg-white text-black px-6 md:px-8 py-2 md:py-3 font-bold text-xs tracking-widest uppercase hover:bg-[var(--brand-royal-red)] hover:text-white transition-colors">
                            Shop Now
                        </button>
                    </div>
                </div>

                {/* Banner 2: Holiday Gifting */}
                <div className="relative h-[350px] md:h-[450px] lg:h-[500px] w-full group overflow-hidden cursor-pointer rounded-sm">
                    <Image
                        src={image2}
                        alt="Holiday Gifting"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    <div className="absolute bottom-6 md:bottom-12 right-6 md:right-10 text-white text-right">
                        <h3 className="text-3xl md:text-5xl font-serif mb-2 leading-none cursor-default">
                            Holiday <span className="font-sans font-bold">Gifting</span>
                        </h3>
                        <p className="text-base md:text-lg italic font-serif mb-4 md:mb-6 opacity-90">Season of Giving Collection</p>
                        <button className="border-2 border-white text-white px-6 md:px-8 py-2 md:py-3 font-bold text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-colors">
                            Shop Now
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PromoBanners;
