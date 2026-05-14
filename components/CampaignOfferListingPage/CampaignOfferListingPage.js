"use client";

import Link from "next/link";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import ProductCard from "@/components/ProductCard/ProductCard";

/**
 * Slim text banner + product grid for campaign / offer listings.
 * Pass `bannerExtra` (React node) or `children` inside the banner block for dates, T&Cs, etc.
 */
export default function CampaignOfferListingPage({
  title,
  breadcrumbs = [],
  bannerExtra = null,
  children = null,
  products = [],
  loading = false,
  mainClassName = "bg-white",
  emptyMessage = "No products in this offer right now.",
}) {
  return (
    <>
      <Header />
      <main className={mainClassName}>
        <div className="border-b border-[#E5E5E5] bg-[#FAFAF8]">
          <div className="mx-auto flex max-w-[1600px] flex-col px-4 py-5 md:px-12 md:py-6">
            <nav className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#999999]">
              {breadcrumbs.map((crumb, i) => (
                <span key={`${crumb.label}-${i}`}>
                  {i > 0 && <span className="mx-2 text-[#E5E5E5]">{">"}</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="transition-colors hover:text-[#1A1A1A]">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-[#1A1A1A]">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
            <h1 className="text-sm font-bold uppercase tracking-[0.28em] text-[#1A1A1A] md:text-base md:tracking-[0.32em]">
              {title}
            </h1>
            {bannerExtra ? <div className="mt-3 max-w-2xl">{bannerExtra}</div> : null}
            {children}
          </div>
        </div>

        <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-12 md:py-14">
          {loading && products.length === 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-8 sm:gap-y-14 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={`offer-skel-${idx}`} className="w-full">
                  <div className="mb-4 aspect-[3/4] w-full animate-pulse bg-[#F0F0EE]" />
                  <div className="mb-2 h-3 w-2/3 animate-pulse bg-[#F0F0EE]" />
                  <div className="h-4 w-1/3 animate-pulse bg-[#F0F0EE]" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="border border-dashed border-[#E5E5E5] bg-[#FAFAF8] px-6 py-16 text-center text-sm text-[#6B6B6B]">
              <p>{emptyMessage}</p>
              <Link
                href="/offers"
                className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-[#1A1A1A] underline underline-offset-4"
              >
                All offers
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
