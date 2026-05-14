"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { getRelatedProduct } from '@/lib/api';

const CartSidebar = () => {
    const router = useRouter();
    const {
        cartItems,
        isCartOpen,
        setIsCartOpen,
        removeFromCart,
        updateQuantity,
        getSubtotal,
        getCartCount
    } = useCart();
    const [recommendedProducts, setRecommendedProducts] = useState([]);

    const firstCartItemId = useMemo(() => cartItems[0]?.id || null, [cartItems]);

    const handleCardNavigation = (itemId) => {
        setIsCartOpen(false);
        router.push(`/product/${itemId}`);
    };

    // Prevent body scroll when cart is open
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isCartOpen]);

    useEffect(() => {
        const fetchRecommended = async () => {
            if (!isCartOpen || !firstCartItemId) {
                setRecommendedProducts([]);
                return;
            }
            try {
                const response = await getRelatedProduct(firstCartItemId);
                const rawList = Array.isArray(response)
                    ? response
                    : response?.success && Array.isArray(response?.data)
                      ? response.data
                      : [];

                const mapped = rawList
                    .filter((p) => String(p.id) !== String(firstCartItemId))
                    .slice(0, 6)
                    .map((p) => ({
                        id: p.id,
                        name: p.name,
                        image: (Array.isArray(p.image_paths) && p.image_paths[0]) || p.image_path || "/placeholder.png",
                        price: Number(p.retails_price || 0),
                    }));

                setRecommendedProducts(mapped);
            } catch (error) {
                console.error("Error fetching cart recommendations:", error);
                setRecommendedProducts([]);
            }
        };

        fetchRecommended();
    }, [isCartOpen, firstCartItemId]);

    if (!isCartOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-[110] transition-opacity"
                onClick={() => setIsCartOpen(false)}
            />

            {/* Cart Modal — above MobileBottomNav (z-[100]) */}
            <div className="fixed right-0 top-0 flex h-full min-h-0 w-full flex-col bg-white z-[120] shadow-2xl duration-300 sm:w-[400px]">
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-[#E5E5E5] bg-[#F8F8F6] p-6">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-[#1A1A1A]">
                        Shopping Cart ({getCartCount()})
                    </h2>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="rounded-full p-2 transition-colors hover:bg-[#E5E5E5]"
                        aria-label="Close cart"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Scroll: line items + recommendations + subtotal */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white">
                    {cartItems.length === 0 ? (
                        <div className="flex h-full min-h-[40vh] flex-col items-center justify-center px-6 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-[#999999]">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            <p className="mb-6 text-xs uppercase tracking-widest text-[#666666]">Your cart is empty</p>
                            <Link
                                href="/category/16167"
                                onClick={() => setIsCartOpen(false)}
                                className="bg-[#1A1A1A] px-8 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#333333]"
                            >
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <div>
                            <div className="space-y-6 p-6">
                                {cartItems.map((item) => (
                                    <div
                                        key={`${item.id}-${item.selectedSize}-${item.selectedColor}-${item.variantId || ""}-${item.childVariantId || ""}`}
                                        role="link"
                                        tabIndex={0}
                                        onClick={() => handleCardNavigation(item.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                handleCardNavigation(item.id);
                                            }
                                        }}
                                        className="group relative flex cursor-pointer gap-4 border-b border-[#E5E5E5] pb-6"
                                    >
                                        <div className="relative h-[120px] w-24 shrink-0 bg-[#F8F8F6]">
                                            {item.image ? (
                                                <Image
                                                    src={typeof item.image === "string" ? item.image : "/placeholder.png"}
                                                    alt={item.name || "Product"}
                                                    fill
                                                    unoptimized
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-widest text-[#999999]">
                                                    No Image
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                                            <div>
                                                <p className="block truncate text-xs font-bold uppercase tracking-widest text-[#1A1A1A] transition-colors group-hover:text-[#666666]">
                                                    {item.name}
                                                </p>
                                                {(item.selectedSize || item.selectedColor) && (
                                                    <div className="mt-1 flex gap-2 text-[10px] uppercase tracking-widest text-[#999999]">
                                                        {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                                                        {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="flex items-center border border-[#E5E5E5]">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateQuantity(
                                                                item.id,
                                                                item.quantity - 1,
                                                                item.selectedSize,
                                                                item.selectedColor,
                                                                item.variantId,
                                                                item.childVariantId
                                                            );
                                                        }}
                                                        className="flex h-8 w-8 items-center justify-center text-[#1A1A1A] transition-colors hover:bg-[#F8F8F6]"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-8 text-center text-xs font-bold text-[#1A1A1A]">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const maxLimit =
                                                                item.variantStockMap?.[item.selectedSize] ?? item.maxStock ?? 99;
                                                            if (item.quantity >= maxLimit) {
                                                                alert(`Only ${maxLimit} is in stock.`);
                                                                return;
                                                            }
                                                            updateQuantity(
                                                                item.id,
                                                                item.quantity + 1,
                                                                item.selectedSize,
                                                                item.selectedColor,
                                                                item.variantId,
                                                                item.childVariantId
                                                            );
                                                        }}
                                                        className="flex h-8 w-8 items-center justify-center text-[#1A1A1A] transition-colors hover:bg-[#F8F8F6]"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <p className="text-sm font-bold text-[#1A1A1A]">
                                                    ৳{(item.price * item.quantity).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFromCart(
                                                    item.id,
                                                    item.selectedSize,
                                                    item.selectedColor,
                                                    item.variantId,
                                                    item.childVariantId
                                                );
                                            }}
                                            className="absolute right-0 top-0 text-[#999999] transition-colors hover:text-[#1A1A1A]"
                                            aria-label="Remove item"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {recommendedProducts.length > 0 && (
                                <div className="border-t border-[#E5E5E5] bg-[#F8F8F6] px-6 pb-6 pt-6">
                                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]">We recommend</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {recommendedProducts.slice(0, 2).map((product) => (
                                            <Link
                                                key={product.id}
                                                href={`/product/${product.id}`}
                                                onClick={() => setIsCartOpen(false)}
                                                className="group block"
                                            >
                                                <div className="relative aspect-[3/4] w-full bg-white">
                                                    <Image
                                                        src={product.image}
                                                        alt={product.name}
                                                        fill
                                                        unoptimized
                                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                </div>
                                                <p className="mt-2 line-clamp-2 text-[10px] uppercase tracking-wide text-[#6B6B6B]">
                                                    {product.name}
                                                </p>
                                                <p className="mt-1 text-xs font-bold text-[#1A1A1A]">৳{product.price.toLocaleString()}</p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-[#E5E5E5] bg-[#F8F8F6] px-6 py-5">
                                <div className="flex items-center justify-between text-sm font-bold uppercase tracking-widest text-[#1A1A1A]">
                                    <span>Subtotal:</span>
                                    <span>৳{getSubtotal().toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Fixed checkout — only when cart has items */}
                {cartItems.length > 0 && (
                    <div className="shrink-0 border-t border-[#E5E5E5] bg-[#F8F8F6] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 md:p-6">
                        <button
                            type="button"
                            onClick={() => {
                                setIsCartOpen(false);
                                router.push("/checkout");
                            }}
                            className="block w-full bg-[#1A1A1A] py-4 text-center text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#333333]"
                        >
                            Checkout
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartSidebar;
