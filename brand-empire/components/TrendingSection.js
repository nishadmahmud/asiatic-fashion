"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getBannerFromServer } from "@/lib/api";

const CategoryCard = ({ image, title, link }) => {
    return (
        <Link href={link} className="group block">
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 rounded-sm mb-3">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
            </div>
            <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-center text-gray-900">
                {title}
            </h3>
        </Link>
    );
};

const TrendingSection = () => {
    const [trendingCategories, setTrendingCategories] = useState([]);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const response = await getBannerFromServer();
                if (response?.success && response?.banners) {
                    const formattedBanners = response.banners
                        .filter(banner => banner.type === 'trending' && banner.status === 1)
                        .map(banner => ({
                            id: banner.id,
                            image: banner.image_path,
                            title: banner.title,
                            link: banner.button_url || '#'
                        }));
                    setTrendingCategories(formattedBanners);
                }
            } catch (error) {
                console.error("Error fetching trending banners:", error);
            }
        };

        fetchBanners();
    }, []);

    if (trendingCategories.length === 0) {
        return null;
    }

    return (
        <section className="section-content py-12 md:py-16">
            <h2 className="text-lg md:text-xl font-bold mb-6 md:mb-8 uppercase tracking-widest text-gray-900">
                Trending Now
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
                {trendingCategories.map((category) => (
                    <CategoryCard key={category.id} {...category} />
                ))}
            </div>
        </section>
    );
};

export default TrendingSection;
