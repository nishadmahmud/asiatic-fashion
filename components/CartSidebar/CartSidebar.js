"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

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

    if (!isCartOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-[90] transition-opacity"
                onClick={() => setIsCartOpen(false)}
            />

            {/* Cart Modal */}
            <div className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-white z-[100] shadow-2xl transform transition-transform duration-300 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#E5E5E5] bg-[#F8F8F6]">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-[#1A1A1A]">
                        Shopping Cart ({getCartCount()})
                    </h2>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="p-2 hover:bg-[#E5E5E5] rounded-full transition-colors"
                        aria-label="Close cart"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[#999999] mb-4">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            <p className="text-xs text-[#666666] tracking-widest uppercase mb-6">Your cart is empty</p>
                            <Link
                                href="/category/16167"
                                onClick={() => setIsCartOpen(false)}
                                className="px-8 py-3 bg-[#1A1A1A] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#333333] transition-colors"
                            >
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cartItems.map((item) => (
                                <div
                                    key={`${item.id}-${item.selectedSize}-${item.selectedColor}-${item.variantId || ''}-${item.childVariantId || ''}`}
                                    role="link"
                                    tabIndex={0}
                                    onClick={() => handleCardNavigation(item.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleCardNavigation(item.id);
                                        }
                                    }}
                                    className="group flex cursor-pointer gap-4 pb-6 border-b border-[#E5E5E5] relative"
                                >
                                    {/* Product Image */}
                                    <div className="relative w-24 h-[120px] flex-shrink-0 bg-[#F8F8F6]">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            unoptimized
                                            className="object-cover"
                                        />
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <p className="block truncate text-xs font-bold uppercase tracking-widest text-[#1A1A1A] transition-colors group-hover:text-[#666666]">
                                                {item.name}
                                            </p>
                                            {(item.selectedSize || item.selectedColor) && (
                                                <div className="flex gap-2 mt-1 text-[10px] uppercase tracking-widest text-[#999999]">
                                                    {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                                                    {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                                                </div>
                                            )}
                                        </div>

                                        {/* Price and Quantity */}
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center border border-[#E5E5E5]">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateQuantity(item.id, item.quantity - 1, item.selectedSize, item.selectedColor, item.variantId, item.childVariantId);
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-[#F8F8F6] transition-colors"
                                                >
                                                    -
                                                </button>
                                                <span className="text-xs font-bold w-8 text-center text-[#1A1A1A]">{item.quantity}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const maxLimit = item.variantStockMap?.[item.selectedSize] ?? item.maxStock ?? 99;
                                                        if (item.quantity >= maxLimit) {
                                                            alert(`Only ${maxLimit} is in stock.`);
                                                            return;
                                                        }
                                                        updateQuantity(item.id, item.quantity + 1, item.selectedSize, item.selectedColor, item.variantId, item.childVariantId);
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-[#F8F8F6] transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <p className="text-sm font-bold text-[#1A1A1A]">৳{(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFromCart(item.id, item.selectedSize, item.selectedColor, item.variantId, item.childVariantId);
                                        }}
                                        className="absolute top-0 right-0 text-[#999999] hover:text-[#1A1A1A] transition-colors"
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
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div className="border-t border-[#E5E5E5] p-6 bg-[#F8F8F6] space-y-6">
                        {/* Subtotal */}
                        <div className="flex items-center justify-between text-sm font-bold tracking-widest uppercase text-[#1A1A1A]">
                            <span>Subtotal:</span>
                            <span>৳{getSubtotal().toLocaleString()}</span>
                        </div>

                        {/* Buttons */}
                        <div className="space-y-3">
                            <Link
                                href="/checkout"
                                onClick={() => setIsCartOpen(false)}
                                className="block w-full py-4 text-center bg-[#1A1A1A] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#333333] transition-colors"
                            >
                                Checkout
                            </Link>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="block w-full py-4 text-center border border-[#1A1A1A] text-[#1A1A1A] font-bold uppercase tracking-widest text-xs hover:bg-[#1A1A1A] hover:text-white transition-colors"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartSidebar;
