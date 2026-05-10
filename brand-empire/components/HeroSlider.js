"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getSlidersFromServer } from "@/lib/api";
import Link from "next/link";

// Dummy slides as fallback
const dummySlides = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
        title: "ART OF SASHIKO",
        subtitle: "JAPANESE CRAFTSMANSHIP MEETS EFFORTLESS STYLE.",
        buttonText: "EXPLORE NOW",
        alignment: "left",
        link: "/category/all"
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2070&auto=format&fit=crop",
        title: "URBAN REDEFINED",
        subtitle: "BOLD LOOKS FOR THE MODERN ERA.",
        buttonText: "SHOP LATEST",
        alignment: "right",
        link: "/category/all"
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
        title: "TIMELESS ELEGANCE",
        subtitle: "CURATED COLLECTIONS FOR HER.",
        buttonText: "VIEW COLLECTION",
        alignment: "center",
        link: "/category/all"
    },
    {
        id: 4,
        image: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop",
        title: "WINTER ESSENTIALS",
        subtitle: "WARMTH MEETS LUXURY.",
        buttonText: "SHOP WINTER",
        alignment: "left",
        link: "/category/all"
    },
    {
        id: 5,
        image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop",
        title: "HIGH FASHION",
        subtitle: "RUNWAY READY STYLES.",
        buttonText: "DISCOVER MORE",
        alignment: "right",
        link: "/category/all"
    },
];

const HeroSlider = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slides, setSlides] = useState(dummySlides); // Start with dummy data
    const [autoPlayInterval, setAutoPlayInterval] = useState(5000);

    useEffect(() => {
        const fetchSliders = async () => {
            try {
                const response = await getSlidersFromServer();

                if (response.success && response.sliders && response.sliders.length > 0) {
                    // Transform API data to match component structure
                    const apiSlides = response.sliders
                        .filter(slider => slider.status === 1)
                        .map((slider, index) => ({
                            id: slider.id,
                            image: slider.image_path,
                            title: slider.title || "",
                            subtitle: "",
                            buttonText: "SHOP NOW",
                            alignment: index % 3 === 0 ? "left" : index % 3 === 1 ? "right" : "center",
                            link: slider.link || `/product/${slider.product_id}`
                        }));

                    if (apiSlides.length > 0) {
                        setSlides(apiSlides);
                    }

                    // Set autoplay interval from API (convert to milliseconds)
                    if (response.autoPlayInterval) {
                        setAutoPlayInterval(parseInt(response.autoPlayInterval));
                    }
                }
            } catch (error) {
                console.error("Error fetching sliders:", error);
                // Keep dummy slides on error
            }
        };

        fetchSliders();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, autoPlayInterval);
        return () => clearInterval(timer);
    }, [slides.length, autoPlayInterval]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    return (
        <div className="relative w-full h-[400px] md:h-[500px] lg:h-[650px] overflow-hidden group font-sans">
            {/* Slides */}
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                        }`}
                >
                    <div className="relative w-full h-full">
                        <Image
                            src={slide.image}
                            alt={slide.title || "Slider"}
                            fill
                            className="object-cover"
                            priority={index === 0}
                        />
                        {/* Overlay Gradient - Removed for clean image display */}
                        {/* <div className="absolute inset-0 bg-black/20" /> */}

                        {/* Text Content - Hidden per user request */}
                        {/* <div className={`absolute inset-0 flex flex-col justify-center px-6 md:px-12 lg:px-20 ${slide.alignment === 'left' ? 'items-start text-left' :
                                slide.alignment === 'right' ? 'items-end text-right' : 'items-center text-center'
                            }`}>
                            {slide.title && (
                                <h2 className="text-2xl md:text-4xl lg:text-6xl font-light text-white mb-2 font-serif tracking-wide drop-shadow-md">
                                    {slide.title}
                                </h2>
                            )}
                            {slide.subtitle && (
                                <p className="text-xs md:text-base lg:text-xl text-white mb-4 md:mb-8 tracking-[0.1em] md:tracking-[0.2em] font-light drop-shadow-sm uppercase">
                                    {slide.subtitle}
                                </p>
                            )}
                            <Link href={slide.link || "/category/all"}>
                                <button className="bg-[#C41E3A] text-white px-6 md:px-10 py-2 md:py-3 font-bold text-xs md:text-sm tracking-widest hover:bg-[#a01830] transition-colors shadow-lg uppercase">
                                    {slide.buttonText}
                                </button>
                            </Link>
                        </div> */}

                    </div>
                </div>
            ))}

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 p-3 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 p-3 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m9 18 6-6-6-6" /></svg>
            </button>

            {/* Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`h-1 rounded-full transition-all duration-300 ${index === currentSlide ? "bg-[#C41E3A] w-8" : "bg-white/50 w-4 hover:bg-white"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroSlider;
