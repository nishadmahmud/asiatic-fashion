"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getBannerFromServer } from "@/lib/api";

const CollectionCard = ({ image, video, title, alt, subtitle, buttonText, buttonUrl, alignment, type = 'image' }) => {
    const [videoError, setVideoError] = useState(false);

    const CardContent = () => (
        <>
            {/* Conditional rendering: Video or Image */}
            {type === 'video' && video && !videoError ? (
                <video
                    src={video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={() => setVideoError(true)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            ) : (
                <Image
                    src={image}
                    alt={alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
            )}

            {/* Dark Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            <div className={`absolute bottom-6 md:bottom-10 ${alignment === 'left' ? 'left-4 md:left-8 text-left' : 'left-4 md:left-8 text-left'} w-full pr-4 md:pr-8`}>
                {/* Subtitle - Always white */}
                <p className="text-xs md:text-lg font-bold uppercase tracking-widest mb-2 text-white/80">
                    {subtitle}
                </p>

                {/* Title - Always white */}
                <h3 className="text-2xl md:text-3xl font-serif mb-4 md:mb-6 leading-tight text-white">
                    <span dangerouslySetInnerHTML={{ __html: title }} />
                </h3>

                {/* Button */}
                {buttonText && (
                    <span className="inline-block px-6 md:px-8 py-2 md:py-3 font-bold text-xs tracking-widest uppercase transition-colors bg-white text-black hover:bg-[var(--brand-royal-red)] hover:text-white">
                        {buttonText}
                    </span>
                )}
            </div>
        </>
    );

    return (
        <div className="relative h-[350px] md:h-[450px] lg:h-[500px] w-full group overflow-hidden cursor-pointer">
            {buttonUrl ? (
                <Link href={buttonUrl} className="block w-full h-full">
                    <CardContent />
                </Link>
            ) : (
                <CardContent />
            )}
        </div>
    );
};

const FeaturedCollections = () => {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeaturedBanners = async () => {
            try {
                const response = await getBannerFromServer();
                if (response.success && response.banners) {
                    // Filter for featured type banners
                    const featuredBanners = response.banners.filter(
                        banner => banner.type === "featured" && banner.status === 1
                    );

                    // Transform API data to component format
                    const transformedCollections = featuredBanners.map((banner) => {
                        const isVideo = banner.image_path?.endsWith('.mp4') || banner.image_path?.endsWith('.webm');

                        return {
                            id: banner.id,
                            type: isVideo ? 'video' : 'image',
                            video: isVideo ? banner.image_path : null,
                            image: banner.image_path,
                            title: banner.description && banner.description !== 'null'
                                ? banner.description
                                : banner.title,
                            subtitle: banner.title,
                            alt: banner.title,
                            buttonText: banner.button_text,
                            buttonUrl: banner.button_url,
                            alignment: 'left'
                        };
                    });

                    // Reorder: put video in middle if exists
                    const videoIndex = transformedCollections.findIndex(c => c.type === 'video');
                    if (videoIndex !== -1 && transformedCollections.length === 3 && videoIndex !== 1) {
                        const videoItem = transformedCollections[videoIndex];
                        transformedCollections.splice(videoIndex, 1);
                        transformedCollections.splice(1, 0, videoItem);
                    }

                    setCollections(transformedCollections);
                }
            } catch (error) {
                console.error("Error fetching featured banners:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedBanners();
    }, []);

    if (loading) {
        return (
            <section className="section-content py-12 md:py-16">
                <h2 className="text-lg md:text-xl font-bold mb-6 md:mb-8 uppercase tracking-widest text-gray-900">
                    Featured Collections
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-[350px] md:h-[450px] lg:h-[500px] bg-gray-100 animate-pulse rounded-lg" />
                    ))}
                </div>
            </section>
        );
    }

    if (collections.length === 0) {
        return null;
    }

    return (
        <section className="section-content py-12 md:py-16">
            <h2 className="text-lg md:text-xl font-bold mb-6 md:mb-8 uppercase tracking-widest text-gray-900">
                Featured Collections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {collections.map((collection) => (
                    <CollectionCard key={collection.id} {...collection} />
                ))}
            </div>
        </section>
    );
};

export default FeaturedCollections;
