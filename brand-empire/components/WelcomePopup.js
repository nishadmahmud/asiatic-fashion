"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getPopupBanners } from "@/lib/api";

const WelcomePopup = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [popupData, setPopupData] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check if popup has been shown in this session
        const hasSeenPopup = sessionStorage.getItem("welcomePopupShown");
        console.log("🔍 Popup session check:", hasSeenPopup ? "Already shown" : "Not shown yet");

        if (!hasSeenPopup) {
            // Fetch popup data from API
            const fetchPopupData = async () => {
                try {
                    console.log("🎯 Fetching popup banners from API...");
                    const response = await getPopupBanners();
                    console.log("📦 Popup API Response:", response);

                    if (response.success && response.data && response.data.length > 0) {
                        console.log("✅ Popup data found:", response.data[0]);
                        setPopupData(response.data[0]); // Use first popup

                        // Show popup after a short delay
                        setTimeout(() => {
                            console.log("🎉 Showing popup!");
                            setIsVisible(true);
                            sessionStorage.setItem("welcomePopupShown", "true");
                        }, 1000);
                    } else {
                        console.warn("⚠️ No popup data available in response");
                    }
                } catch (error) {
                    console.error("❌ Error fetching popup banners:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchPopupData();
        } else {
            console.log("ℹ️ Popup already shown in this session");
            setLoading(false);
        }
    }, []);

    const handleClose = () => {
        console.log("🚫 Closing popup");
        setIsVisible(false);
    };

    const handleShopNow = () => {
        console.log("🛍️ Shop Now clicked");
        setIsVisible(false);
        // Use the URL from API if available, otherwise fallback to default
        const targetUrl = popupData?.url || "/category/all";
        router.push(targetUrl);
    };

    if (loading || !isVisible || !popupData) {
        console.log("⏳ Popup not ready:", { loading, isVisible, hasData: !!popupData });
        return null;
    }

    console.log("✨ Rendering popup with data:", popupData);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className="relative w-[90vw] max-w-4xl bg-white rounded-lg overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                style={{
                    animation: "fadeInScale 0.4s ease-out"
                }}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 bg-white hover:bg-gray-100 text-gray-900 p-2 rounded-full transition-all shadow-lg hover:scale-110"
                    aria-label="Close popup"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {/* Popup Content */}
                <div className="relative">
                    {/* Background Image */}
                    <div className="relative w-full h-[400px] sm:h-[500px]">
                        <Image
                            src={popupData.image || "/welcome_popup_banner.png"}
                            alt={popupData.title || "Welcome"}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                    {/* CTA Button - Positioned at Bottom */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                        <button
                            onClick={handleShopNow}
                            className="bg-white text-gray-900 px-10 py-4 text-lg font-bold uppercase tracking-wider rounded-md hover:bg-gray-100 transition-all shadow-2xl hover:scale-105 hover:shadow-xl"
                        >
                            {popupData.button_text || "SHOP NOW"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Animation Keyframes */}
            <style jsx>{`
                @keyframes fadeInScale {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </div>
    );
};

export default WelcomePopup;
