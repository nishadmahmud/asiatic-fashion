"use client";

import HeroSlider from "@/components/HeroSlider";
import BrandsSection from "@/components/BrandsSection";
import PromoBanners from "@/components/PromoBanners";
import TrendingSection from "@/components/TrendingSection";
import FeaturedCollections from "@/components/FeaturedCollections";
import NewArrivals from "@/components/NewArrivals";
import AppPromoSection from "@/components/AppPromoSection";
import WelcomePopup from "@/components/WelcomePopup";
import BlogSection from "@/components/BlogSection";
import FullWidthBanner from "@/components/FullWidthBanner";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden w-full max-w-[100vw]">
      <WelcomePopup />

      {/* Hero Section - Full Width */}
      <section className="section-full relative">
        <HeroSlider />
      </section>

      {/* Brands Section */}
      <div className="mt-8 md:mt-12">
        <BrandsSection />
      </div>

      {/* Promotional Banners */}
      <div className="mt-8 md:mt-12">
        <PromoBanners />
      </div>

      {/* Trending Section */}
      <div className="mt-8 md:mt-12">
        <TrendingSection />
      </div>

      {/* Featured Collections */}
      <div className="mt-8 md:mt-12">
        <FeaturedCollections />
      </div>

      {/* New Arrivals */}
      <div id="new-arrivals" className="mt-8 md:mt-12">
        <NewArrivals />
      </div>

      {/* App Promotion */}
      <div className="mt-8 md:mt-12">
        <AppPromoSection />
      </div>

      {/* Full Width Banner */}
      <div className="mt-8 md:mt-12">
        <FullWidthBanner />
      </div>

      {/* Blog Section */}
      <div className="mt-8 md:mt-12">
        <BlogSection />
      </div>
    </div>
  );
}
