"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getBannerFromServer } from "@/lib/api";

export default function FullWidthBanner() {
    const [banner, setBanner] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanner = async () => {
            try {
                const response = await getBannerFromServer();
                if (response.success && response.banners && response.banners.length > 2) {
                    // Get the 3rd banner (index 2)
                    setBanner(response.banners[2]);
                }
            } catch (error) {
                console.error("Error loading banner:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBanner();
    }, []);

    if (loading || !banner) {
        return null; // Don't show anything if no banner
    }

    return (
        <section className="w-full">
            <div className="relative w-full h-auto">
                <Image
                    src={banner.image_path}
                    alt={banner.title || "Promotional Banner"}
                    width={1920}
                    height={700}
                    className="w-full h-auto object-contain"
                />
            </div>
        </section>
    );
}
