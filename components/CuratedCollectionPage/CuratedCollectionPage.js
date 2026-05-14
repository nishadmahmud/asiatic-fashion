"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import ProductCard from "@/components/ProductCard/ProductCard";
import { getNewArrivalsFromServer, getBestDeals, getBestSellers, getCampaigns } from "@/lib/api";
import { transformProduct, buildCampaignDiscountMap } from "@/lib/transformProduct";

function extractNestedData(res) {
  if (res?.success && Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

const MODES = {
  "new-arrivals": {
    title: "New Arrivals",
    fetch: getNewArrivalsFromServer,
    extract: (res) => {
      if (res?.success && Array.isArray(res?.data?.data)) return res.data.data;
      if (Array.isArray(res?.data?.data)) return res.data.data;
      return [];
    },
    mainClass: "bg-white",
    gridWrapperClass: "",
  },
  "best-deals": {
    title: "Best Deals",
    fetch: getBestDeals,
    extract: extractNestedData,
    mainClass: "bg-[#F8F8F6]",
    gridWrapperClass: "",
  },
  "best-sellers": {
    title: "Best Sellers",
    fetch: getBestSellers,
    extract: extractNestedData,
    mainClass: "bg-white",
    gridWrapperClass: "",
  },
};

export default function CuratedCollectionPage({ mode }) {
  const cfg = MODES[mode];
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cfg) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setProducts([]);
      try {
        const res = await cfg.fetch();
        if (cancelled) return;

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

        const raw = cfg.extract(res);
        const transformed = raw.map((p) => transformProduct(p, campaignMap));
        if (!cancelled) setProducts(transformed);
      } catch (e) {
        console.error(`CuratedCollectionPage (${mode}):`, e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [mode, cfg]);

  if (!cfg) {
    return (
      <>
        <Header />
        <main className="min-h-[40vh] bg-white px-4 py-20 text-center text-sm text-[#6B6B6B]">Unknown collection.</main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={cfg.mainClass}>
        <div className="border-b border-[#E5E5E5] bg-[#FAFAF8]">
          <div className="mx-auto flex max-w-[1600px] flex-col px-4 py-5 md:px-12 md:py-6">
            <nav className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#999999]">
              <Link href="/" className="transition-colors hover:text-[#1A1A1A]">
                Home
              </Link>
              <span className="mx-2 text-[#E5E5E5]">{">"}</span>
              <span className="text-[#1A1A1A]">{cfg.title}</span>
            </nav>
            <h1 className="text-sm font-bold uppercase tracking-[0.28em] text-[#1A1A1A] md:text-base md:tracking-[0.32em]">
              {cfg.title}
            </h1>
          </div>
        </div>

        <div className={`mx-auto max-w-[1600px] px-4 py-10 md:px-12 md:py-14 ${cfg.gridWrapperClass}`}>
          {loading && products.length === 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-8 sm:gap-y-14 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={`curated-skel-${idx}`} className="w-full">
                  <div className="mb-4 aspect-[3/4] w-full animate-pulse bg-[#F0F0EE]" />
                  <div className="mb-2 h-3 w-2/3 animate-pulse bg-[#F0F0EE]" />
                  <div className="h-4 w-1/3 animate-pulse bg-[#F0F0EE]" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="border border-dashed border-[#E5E5E5] bg-[#FAFAF8] px-6 py-16 text-center">
              <p className="text-sm text-[#6B6B6B]">No products to show right now.</p>
              <Link
                href="/"
                className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-[#1A1A1A] underline underline-offset-4"
              >
                Back to home
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-8 sm:gap-y-16 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
