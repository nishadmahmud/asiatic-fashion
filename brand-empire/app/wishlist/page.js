"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import { getCategoriesFromServer } from "@/lib/api";
import { Play, Heart, X } from "lucide-react";

const WishlistPage = () => {
    const { wishlist, removeFromWishlist, studioWishlist, removeFromStudioWishlist } = useWishlist();
    const [activeTab, setActiveTab] = useState("products");
    const [continueShoppingHref, setContinueShoppingHref] = useState("/category/all");

    const totalItems = wishlist.length + studioWishlist.length;
    const hasProducts = wishlist.length > 0;
    const hasStudio = studioWishlist.length > 0;

    useEffect(() => {
        const loadFirstCategory = async () => {
            try {
                const response = await getCategoriesFromServer();
                const categories = Array.isArray(response?.data) ? response.data : [];
                const firstCategoryId = categories[0]?.category_id || categories[0]?.id;

                if (firstCategoryId) {
                    setContinueShoppingHref(`/category/${firstCategoryId}`);
                }
            } catch (error) {
                console.error("Failed to load categories for wishlist continue shopping route", error);
            }
        };

        loadFirstCategory();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white px-4 py-8 shadow-sm">
                <div className="max-w-[1400px] mx-auto text-center">
                    <h1 className="text-2xl font-extrabold uppercase tracking-widest mb-2">My Wishlist</h1>
                    <p className="text-sm text-gray-500">{totalItems} Items</p>
                </div>
            </div>

            {/* Tabs */}
            {(hasProducts || hasStudio) && (
                <div className="bg-white border-b sticky top-0 z-10">
                    <div className="max-w-[1400px] mx-auto px-4 flex gap-0">
                        <button
                            onClick={() => setActiveTab("products")}
                            className={`px-6 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === "products" ? "border-[var(--brand-royal-red)] text-[var(--brand-royal-red)]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                        >
                            Products ({wishlist.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("studio")}
                            className={`px-6 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === "studio" ? "border-[var(--brand-royal-red)] text-[var(--brand-royal-red)]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                        >
                            Studio ({studioWishlist.length})
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="max-w-[1400px] mx-auto px-4 py-8">

                {/* Products Tab */}
                {activeTab === "products" && (
                    <>
                        {hasProducts ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                                {wishlist.map((product) => (
                                    <div key={product.id} className="relative group/card">
                                        {/* Remove Button */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                removeFromWishlist(product.id);
                                            }}
                                            className="absolute top-2 right-2 z-20 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover/card:opacity-100"
                                            title="Remove from wishlist"
                                        >
                                            <X size={14} />
                                        </button>
                                        <Link href={`/product/${product.id}`} className="group">
                                            <div className="bg-white rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100">
                                                <div className="relative aspect-square bg-gray-100">
                                                    {product.images?.[0] ? (
                                                        <Image
                                                            src={product.images[0]}
                                                            alt={product.name || "Product"}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                                <polyline points="21 15 16 10 5 21"></polyline>
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3">
                                                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
                                                        {product.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-[var(--brand-royal-red)]">৳{product.price}</span>
                                                        {product.originalPrice && (
                                                            <span className="text-xs text-gray-400 line-through">৳{product.originalPrice}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="No products in your wishlist" continueShoppingHref={continueShoppingHref} />
                        )}
                    </>
                )}

                {/* Studio Tab */}
                {activeTab === "studio" && (
                    <>
                        {hasStudio ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {studioWishlist.map((post) => (
                                    <div key={post.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow group/studio relative">
                                        {/* Remove Button */}
                                        <button
                                            onClick={() => removeFromStudioWishlist(post.id)}
                                            className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/90 backdrop-blur rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover/studio:opacity-100"
                                            title="Remove from favorites"
                                        >
                                            <X size={16} />
                                        </button>

                                        {/* Wishlisted Badge */}
                                        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-[var(--brand-royal-red)] text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md">
                                            <Heart size={10} fill="currentColor" />
                                            Saved
                                        </div>

                                        {/* Video/Image Thumbnail */}
                                        <div className="relative aspect-[4/5] bg-gray-100">
                                            {post.type === "video" && post.content ? (
                                                <video
                                                    src={post.content}
                                                    className="w-full h-full object-cover"
                                                    muted
                                                    playsInline
                                                    preload="metadata"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                                    <Play size={40} className="text-gray-400" />
                                                </div>
                                            )}

                                            {/* Play Icon Overlay */}
                                            {post.type === "video" && (
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="w-14 h-14 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
                                                        <Play size={24} className="text-white ml-1" fill="white" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Post Info */}
                                        <div className="p-4">
                                            {/* Vendor Info */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
                                                    <Image
                                                        src={post.user?.avatar || "https://ui-avatars.com/api/?name=BE"}
                                                        alt={post.user?.name || "Brand"}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{post.user?.name || "Brand Empire"}</p>
                                                    <p className="text-[10px] text-gray-400">{post.user?.time}</p>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            {post.description && (
                                                <p className="text-xs text-gray-600 line-clamp-2 mb-3">{post.description}</p>
                                            )}

                                            {/* Products Preview */}
                                            {post.products?.length > 0 && (
                                                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pt-2 border-t border-gray-100">
                                                    {post.products.slice(0, 4).map((product) => (
                                                        <Link
                                                            key={product.id}
                                                            href={`/product/${product.id}`}
                                                            className="flex-shrink-0"
                                                        >
                                                            <div className="relative w-12 h-14 rounded-md overflow-hidden bg-gray-100 border border-gray-200 hover:border-gray-400 transition-colors">
                                                                <Image
                                                                    src={product.image}
                                                                    alt={product.name}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                        </Link>
                                                    ))}
                                                    {post.products.length > 4 && (
                                                        <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">+{post.products.length - 4} more</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="No studio posts saved yet" continueShoppingHref={continueShoppingHref} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

function EmptyState({ message, continueShoppingHref }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-40 h-40 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{message}</h2>
            <p className="text-gray-500 mb-8 max-w-md">Save items that you like in your wishlist. Review them anytime and easily move them to the bag.</p>
            <Link href={continueShoppingHref} className="px-8 py-3 bg-[var(--brand-royal-red)] text-white font-bold uppercase tracking-wider rounded hover:bg-[#a01830] transition-colors">
                Continue Shopping
            </Link>
        </div>
    );
}

export default WishlistPage;

