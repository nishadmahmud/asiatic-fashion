"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard/ProductCard";
import { getNewArrivalsFromServer, getCampaigns } from "@/lib/api";
import { transformProduct, buildCampaignDiscountMap } from "@/lib/transformProduct";

export default function NewArrivals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const response = await getNewArrivalsFromServer();

        if (response.success && response.data && response.data.data && response.data.data.length > 0) {
          // Also fetch campaigns to overlay discounts
          let campaignMap = {};
          try {
            const campaignsRes = await getCampaigns();
            if (campaignsRes?.success && Array.isArray(campaignsRes?.campaigns?.data)) {
              const active = campaignsRes.campaigns.data.filter((c) => c?.status === "active");
              campaignMap = buildCampaignDiscountMap(active);
            }
          } catch (e) {
            console.error("Campaign fetch error:", e);
          }

          const apiProducts = response.data.data
            .slice(0, 8)
            .map((p) => transformProduct(p, campaignMap));
          setProducts(apiProducts);
        }
      } catch (error) {
        console.error("Error fetching new arrivals:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNewArrivals();
  }, []);

  return (
    <section id="new-arrivals" className="w-full max-w-[1600px] mx-auto px-4 md:px-12 py-10 md:py-16">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E5E5E5]">
        <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A]">
          New Arrivals
        </h2>
        <Link
          href="/category/16167"
          className="text-xs font-bold tracking-widest uppercase text-[#999999] hover:text-[#1A1A1A] transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-8 sm:gap-y-16">
        {loading && products.length === 0
          ? Array.from({ length: 8 }).map((_, idx) => (
              <div key={`new-arrivals-skeleton-${idx}`} className="w-full">
                <div className="w-full aspect-[3/4] bg-[#F8F8F6] animate-pulse mb-4" />
                <div className="h-3 bg-[#F8F8F6] animate-pulse w-2/3 mb-2" />
                <div className="h-4 bg-[#F8F8F6] animate-pulse w-1/3" />
              </div>
            ))
          : products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}
