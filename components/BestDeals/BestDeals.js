"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard/ProductCard";
import { getBestDeals, getCampaigns } from "@/lib/api";
import { transformProduct, buildCampaignDiscountMap } from "@/lib/transformProduct";

export default function BestDeals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getBestDeals();

        // The API may return data in response.data or response.data.data
        let rawProducts = [];
        if (Array.isArray(response?.data)) {
          rawProducts = response.data;
        } else if (Array.isArray(response?.data?.data)) {
          rawProducts = response.data.data;
        }

        if (rawProducts.length > 0) {
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

          const apiProducts = rawProducts
            .slice(0, 4) // Show top 4 deals
            .map((p) => transformProduct(p, campaignMap));
          setProducts(apiProducts);
        }
      } catch (error) {
        console.error("Error fetching best deals:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <section className="w-full max-w-[1600px] mx-auto px-4 md:px-12 py-10 md:py-16 bg-[#F8F8F6]">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E5E5E5]">
        <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A]">
          Best Deals
        </h2>
        <Link
          href="/category/16167"
          className="text-xs font-bold tracking-widest uppercase text-[#999999] hover:text-[#1A1A1A] transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-8 sm:gap-y-16">
        {loading && products.length === 0
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div key={`best-deals-skeleton-${idx}`} className="w-full">
                <div className="w-full aspect-[3/4] bg-white animate-pulse mb-4" />
                <div className="h-3 bg-white animate-pulse w-2/3 mb-2" />
                <div className="h-4 bg-white animate-pulse w-1/3" />
              </div>
            ))
          : products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}
