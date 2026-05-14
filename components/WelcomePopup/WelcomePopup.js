"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getPopupBanners } from "@/lib/api";

/**
 * Session-scoped welcome popup — same API and UI pattern as brand-empire WelcomePopup.
 * Uses `getPopupBanners()` → `response.data[0]` with `image`, `title`, `button_text`, `url`.
 */
export default function WelcomePopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem("welcomePopupShown");

    if (!hasSeenPopup) {
      const fetchPopupData = async () => {
        try {
          const response = await getPopupBanners();

          if (response.success && response.data && response.data.length > 0) {
            setPopupData(response.data[0]);

            setTimeout(() => {
              setIsVisible(true);
              sessionStorage.setItem("welcomePopupShown", "true");
            }, 1000);
          }
        } catch (error) {
          console.error("Error fetching popup banners:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchPopupData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleShopNow = () => {
    setIsVisible(false);
    const targetUrl = popupData?.url || "/category/all";
    router.push(targetUrl);
  };

  if (loading || !isVisible || !popupData) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="animate-welcome-popup relative w-[90vw] max-w-4xl overflow-hidden rounded-lg bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-gray-900 shadow-lg transition-all hover:scale-110 hover:bg-gray-100"
          aria-label="Close popup"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="relative">
          <div className="relative h-[400px] w-full sm:h-[500px]">
            <Image
              src={popupData.image || "/welcome_popup_banner.png"}
              alt={popupData.title || "Welcome"}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>

          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <button
              type="button"
              onClick={handleShopNow}
              className="rounded-md bg-white px-10 py-4 text-lg font-bold uppercase tracking-wider text-gray-900 shadow-2xl transition-all hover:scale-105 hover:bg-gray-100 hover:shadow-xl"
            >
              {popupData.button_text || "SHOP NOW"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
