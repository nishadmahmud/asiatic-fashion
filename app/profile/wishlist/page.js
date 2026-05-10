"use client";

import { useWishlist } from "@/context/WishlistContext";
import Image from "next/image";
import Link from "next/link";
import { HeartCrack, ShoppingBag } from "lucide-react";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();

  const formatPrice = (price) => `৳ ${Number(price || 0).toLocaleString()}`;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8 border-b border-[#E5E5E5] pb-4">
        <h2 className="text-lg font-bold tracking-widest uppercase text-[#1A1A1A]">
          My Wishlist
        </h2>
        <span className="text-xs font-bold tracking-widest text-[#999999]">
          {wishlist.length} Items
        </span>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-20 bg-[#F8F8F6] border border-[#E5E5E5] border-dashed">
          <HeartCrack className="w-8 h-8 text-[#999999] mx-auto mb-4" />
          <p className="text-sm text-[#6B6B6B] mb-2">Your wishlist is currently empty.</p>
          <Link 
            href="/"
            className="inline-block text-xs font-bold uppercase tracking-widest text-[#1A1A1A] hover:underline underline-offset-4 mt-4"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {wishlist.map((product) => (
            <div key={product.id} className="group border border-[#E5E5E5] bg-white relative">
              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  removeFromWishlist(product.id);
                }}
                className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/80 hover:bg-white text-[#1A1A1A] flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all"
                aria-label="Remove from wishlist"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              <Link href={`/product/${product.id}`} className="block">
                <div className="relative aspect-[3/4] bg-[#F8F8F6]">
                  {product.image_path || product.image ? (
                    <Image
                      src={product.image_path || product.image}
                      alt={product.name || "Product"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
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
              
              <button className="w-full h-10 border-t border-[#E5E5E5] bg-[#F8F8F6] hover:bg-[#1A1A1A] hover:text-white transition-colors text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
