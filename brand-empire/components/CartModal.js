"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

const CartModal = () => {
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

    const { showToast } = useToast();

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
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold uppercase tracking-wider">
                        Shopping Cart ({getCartCount()})
                    </h2>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close cart"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4">
                    {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mb-4">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            <p className="text-gray-500 mb-4">Your cart is empty</p>
                            <Link
                                href="/"
                                onClick={() => setIsCartOpen(false)}
                                className="px-6 py-2 bg-[var(--brand-royal-red)] text-white font-bold uppercase text-sm hover:bg-red-700 transition-colors"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
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
                                    className="group flex cursor-pointer gap-4 pb-4 border-b border-gray-200"
                                >
                                    {/* Product Image */}
                                    <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-cover rounded"
                                        />
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0">
                                        <p className="block truncate text-sm font-medium text-gray-900 transition-colors group-hover:text-[var(--brand-royal-red)]">
                                            {item.name}
                                        </p>
                                        {item.brand && (
                                            <p className="text-xs text-gray-500 mt-0.5">{item.brand}</p>
                                        )}
                                        {(item.selectedSize || item.selectedColor) && (
                                            <div className="flex gap-2 mt-1 text-xs text-gray-600">
                                                {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                                                {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                                            </div>
                                        )}

                                        {/* Price and Quantity */}
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateQuantity(item.id, item.quantity - 1, item.selectedSize, item.selectedColor, item.variantId, item.childVariantId);
                                                    }}
                                                    className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                                                >
                                                    -
                                                </button>
                                                <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const maxLimit = item.variantStockMap?.[item.selectedSize] ?? item.maxStock ?? 99;
                                                        if (item.quantity >= maxLimit) {
                                                            const sizeMsg = item.selectedSize ? ` for Size ${item.selectedSize}` : '';
                                                            showToast({ message: `Only ${maxLimit} is in stock${sizeMsg}`, type: 'error' });
                                                            return;
                                                        }
                                                        updateQuantity(item.id, item.quantity + 1, item.selectedSize, item.selectedColor, item.variantId, item.childVariantId);
                                                    }}
                                                    className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <p className="text-sm font-bold">৳{(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFromCart(item.id, item.selectedSize, item.selectedColor, item.variantId, item.childVariantId);
                                        }}
                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                        aria-label="Remove item"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div className="border-t border-gray-200 p-4 space-y-4">
                        {/* Subtotal */}
                        <div className="flex items-center justify-between text-lg font-bold">
                            <span>Subtotal:</span>
                            <span>৳{getSubtotal().toLocaleString()}</span>
                        </div>

                        {/* Buttons */}
                        <div className="space-y-2">
                            <Link
                                href="/cart"
                                onClick={() => setIsCartOpen(false)}
                                className="block w-full py-3 text-center border-2 border-[var(--brand-royal-red)] text-[var(--brand-royal-red)] font-bold uppercase text-sm hover:bg-red-50 transition-colors"
                            >
                                View Cart
                            </Link>
                            <Link
                                href="/checkout"
                                onClick={() => setIsCartOpen(false)}
                                className="block w-full py-3 text-center bg-[var(--brand-royal-red)] text-white font-bold uppercase text-sm hover:bg-red-700 transition-colors"
                            >
                                Checkout
                            </Link>
                        </div>

                        <p className="text-xs text-gray-500 text-center">
                            Shipping & taxes calculated at checkout
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartModal;
