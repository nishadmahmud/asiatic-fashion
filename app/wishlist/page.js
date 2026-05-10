"use client";

import { useWishlist } from "@/context/WishlistContext";
import Image from "next/image";
import Link from "next/link";
import { HeartCrack, ShoppingBag } from "lucide-react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

export default function PublicWishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();

  const formatPrice = (price) => `৳ ${Number(price || 0).toLocaleString()}`;

  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-white py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-4 md:px-12">
          <div className="flex items-center justify-between mb-8 border-b border-[#E5E5E5] pb-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-widest uppercase text-[#1A1A1A]">
              My Wishlist
            </h1>
            <span className="text-xs font-bold tracking-widest text-[#999999]">
              {wishlist.length} Items
            </span>
          </div>

          {wishlist.length === 0 ? (
            <div className="text-center py-24 bg-[#F8F8F6] border border-[#E5E5E5] border-dashed">
              <HeartCrack className="w-12 h-12 text-[#999999] mx-auto mb-6" />
              <p className="text-sm text-[#6B6B6B] mb-4">Your wishlist is currently empty.</p>
              <Link 
                href="/category/16167"
                className="inline-block px-8 py-3 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {wishlist.map((product) => (
                <div key={product.id} className="group border border-[#E5E5E5] bg-white relative">
                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromWishlist(product.id);
                    }}
                    className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/80 hover:bg-white text-[#1A1A1A] flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                    aria-label="Remove from wishlist"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>

                  <Link href={`/product/${product.id}`} className="block">
                    <div className="relative aspect-[3/4] bg-[#F8F8F6]">
                      {product.image_paths?.[0] || product.image_path || product.image ? (
                        <Image
                          src={product.image_paths?.[0] || product.image_path || product.image}
                          alt={product.name || "Product"}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[#999999]">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="text-xs font-bold tracking-widest uppercase text-[#1A1A1A] truncate mb-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-medium text-[#1A1A1A]">
                          {formatPrice(product.retail_price || product.price)}
                        </span>
                        {(product.old_price || product.mrp_price) && (
                          <span className="text-xs text-[#999999] line-through">
                            {formatPrice(product.old_price || product.mrp_price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  
                  <button className="w-full h-12 border-t border-[#E5E5E5] bg-[#F8F8F6] hover:bg-[#1A1A1A] hover:text-white transition-colors text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2">
                    <ShoppingBag className="w-4 h-4" /> Add to Cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
