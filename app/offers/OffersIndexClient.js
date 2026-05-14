"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { getCampaigns } from "@/lib/api";

function isActiveCampaign(c) {
  return String(c?.status || "").toLowerCase() === "active";
}

function discountBadgeLabel(campaign) {
  const t = String(campaign?.discount_type || "").toLowerCase();
  const isAmount = t === "amount" || t === "fixed";
  const d = Number(campaign?.discount || 0);
  if (isAmount) return `৳${d.toLocaleString()} off`;
  return `${d}% off`;
}

export default function OffersIndexClient() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getCampaigns();
        if (cancelled) return;
        const list = Array.isArray(res?.campaigns?.data) ? res.campaigns.data : [];
        setCampaigns(list.filter(isActiveCampaign));
      } catch (e) {
        console.error("Offers fetch:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="border-b border-[#E5E5E5] bg-[#FAFAF8]">
          <div className="mx-auto max-w-[1600px] px-4 py-5 md:px-12 md:py-6">
            <nav className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#999999]">
              <Link href="/" className="transition-colors hover:text-[#1A1A1A]">
                Home
              </Link>
              <span className="mx-2 text-[#E5E5E5]">{">"}</span>
              <span className="text-[#1A1A1A]">Offers</span>
            </nav>
            <h1 className="text-sm font-bold uppercase tracking-[0.28em] text-[#1A1A1A] md:text-base md:tracking-[0.32em]">
              Offers
            </h1>
          </div>
        </div>

        <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-12 md:py-14">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden border border-[#E5E5E5] bg-white">
                  <div className="aspect-[16/10] animate-pulse bg-[#F0F0EE]" />
                  <div className="space-y-3 p-5">
                    <div className="h-4 w-3/4 animate-pulse bg-[#F0F0EE]" />
                    <div className="h-3 w-1/2 animate-pulse bg-[#F0F0EE]" />
                  </div>
                </div>
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="border border-dashed border-[#E5E5E5] bg-[#FAFAF8] px-6 py-16 text-center">
              <p className="text-sm text-[#6B6B6B]">No active offers at the moment.</p>
              <Link
                href="/"
                className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-[#1A1A1A] underline underline-offset-4"
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/offers/${campaign.id}`}
                  className="group flex flex-col overflow-hidden border border-[#E5E5E5] bg-white transition-colors hover:border-[#1A1A1A]"
                >
                  <div className="relative aspect-[16/10] w-full shrink-0 bg-[#F8F8F6]">
                    {campaign.bg_image ? (
                      <Image
                        src={campaign.bg_image}
                        alt={campaign.name || "Offer"}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#1A1A1A] text-3xl text-white">
                        %
                      </div>
                    )}
                    <div className="absolute right-3 top-3 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] shadow-sm">
                      {discountBadgeLabel(campaign)}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#1A1A1A] transition-colors group-hover:text-[#666666] md:text-[15px]">
                      {campaign.name}
                    </h2>
                    <div className="mt-4 flex items-center justify-between border-t border-[#E5E5E5] pt-4 text-[10px] font-bold uppercase tracking-widest text-[#999999]">
                      <span>{Array.isArray(campaign.products) ? campaign.products.length : 0} products</span>
                      <span className="flex items-center gap-1 text-[#1A1A1A] transition-transform group-hover:translate-x-0.5">
                        Shop
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
