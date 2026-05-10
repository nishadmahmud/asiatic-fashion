"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard/ProductCard";
import { getProducts, getCampaigns } from "@/lib/api";
import { transformProduct, buildCampaignDiscountMap } from "@/lib/transformProduct";

const dummyProducts = [
  { id: 1, name: "Loading...", brand: "—", price: 0, image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800", colors: ["#E5E5E5"] },
  { id: 2, name: "Loading...", brand: "—", price: 0, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800", colors: ["#E5E5E5"] },
  { id: 3, name: "Loading...", brand: "—", price: 0, image: "https://images.unsplash.com/photo-1594938298596-af014bd07b98?auto=format&fit=crop&q=80&w=800", colors: ["#E5E5E5"] },
  { id: 4, name: "Loading...", brand: "—", price: 0, image: "https://images.unsplash.com/photo-1593998066526-65fcab3021a2?auto=format&fit=crop&q=80&w=800", colors: ["#E5E5E5"] },
];

export default function PopularProducts() {
  const [products, setProducts] = useState(dummyProducts);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts(1);

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
            .slice(0, 8)
            .map((p) => transformProduct(p, campaignMap));
          setProducts(apiProducts);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  return (
    <section className="w-full max-w-[1600px] mx-auto px-4 md:px-12 py-10 md:py-16" id="products">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E5E5E5]">
        <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A]">
          Popular Items
        </h2>
        <Link
          href="/category/16167"
          className="text-xs font-bold tracking-widest uppercase text-[#999999] hover:text-[#1A1A1A] transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-8 sm:gap-y-16">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
