"use client";

import React, { useState, useEffect } from "react";
import { getCouponList } from "@/lib/api";
import { Copy, X } from "lucide-react";
import toast from "react-hot-toast";

const FloatingIcons = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [coupon, setCoupon] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const fetchCoupon = async () => {
            try {
                const response = await getCouponList();
                if (response.success && response.data && response.data.length > 0) {
                    // Filter for active coupons
                    const now = new Date();
                    const activeCoupons = response.data.filter(c => {
                        const expireDate = new Date(c.expire_date);
                        return expireDate > now;
                    });

                    if (activeCoupons.length > 0) {
                        // Sort by amount (descending) to show the best coupon
                        activeCoupons.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
                        setCoupon(activeCoupons[0]);
                        setIsVisible(true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch coupons:", error);
            }
        };

        fetchCoupon();
    }, []);

    const handleCopy = async () => {
        if (!coupon) return;
        try {
            await navigator.clipboard.writeText(coupon.coupon_code);
            setIsCopied(true);
            toast.success("Coupon code copied to clipboard!");
            // Reset after 3 seconds
            setTimeout(() => {
                setIsCopied(false);
            }, 3000);
        } catch (error) {
            console.error("Failed to copy:", error);
            toast.error("Failed to copy coupon code");
        }
    };

    // Reset copied state when modal closes
    const handleClose = () => {
        setIsOpen(false);
        setIsCopied(false);
    };

    if (!isVisible || !coupon) return null;

    const isFixed = coupon.coupon_amount_type === "fixed";
    const amountDisplay = isFixed ? `৳${parseInt(coupon.amount)}` : `${parseInt(coupon.amount)}%`;

    const FloatingContent = () => (
        <>
            {/* Expanded Content (Slide out) */}
            <div
                className={`bg-white shadow-2xl overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "w-[280px] md:w-[350px] opacity-100 mr-0" : "w-0 opacity-0 -mr-4"
                    } rounded-l-lg border border-gray-100 flex flex-col max-h-full`}
            >
                <div className="bg-gradient-to-r from-pink-100 to-orange-100 p-4 md:p-6 relative overflow-y-auto">
                    <button
                        onClick={handleClose}
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 z-10"
                    >
                        <X size={18} className="md:w-5 md:h-5" />
                    </button>

                    <div className="mb-1 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Limited Time Offer</div>
                    <div className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-1">
                        {isFixed ? "FLAT" : "GET"} <span className="text-[var(--brand-royal-red)]">{amountDisplay} OFF</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                        {parseFloat(coupon.minimum_order_amount) > 0
                            ? `On orders above ৳${parseInt(coupon.minimum_order_amount)}`
                            : "On your order"}
                    </p>

                    <div className="bg-white border-2 border-dashed border-gray-300 rounded p-2 md:p-3 flex flex-col items-center justify-center mb-3 md:mb-4">
                        <span className="text-[10px] md:text-xs text-gray-400 mb-1">Coupon Code</span>
                        <div className="text-lg md:text-xl font-bold font-mono tracking-wider text-gray-800">{coupon.coupon_code}</div>
                    </div>

                    <button
                        onClick={handleCopy}
                        className={`w-full py-2 md:py-2.5 font-bold rounded transition flex items-center justify-center gap-2 text-xs md:text-sm ${isCopied
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-[var(--brand-royal-red)] text-white hover:bg-red-700'
                            }`}
                    >
                        {isCopied ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-4 md:h-4">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                COPIED
                            </>
                        ) : (
                            <>
                                <Copy size={14} className="md:w-4 md:h-4" />
                                COPY CODE
                            </>
                        )}
                    </button>
                </div>

                <div className="p-2 md:p-3 bg-gray-50 text-[9px] md:text-[10px] text-gray-500 text-center">
                    Genuine Products • Easy Returns • Secure Payment
                </div>
            </div>

            {/* Vertical Tab (Collapsed) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`bg-[#3E4152] text-white flex flex-col items-center justify-center py-3 md:py-4 px-1.5 md:px-2 rounded-l-md shadow-lg transition-transform duration-300 hover:bg-gray-800 ${isOpen ? "opacity-0 pointer-events-none absolute" : "opacity-100"
                    }`}
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
                <div className="transform rotate-180 flex items-center gap-1.5 md:gap-2">
                    <span className="font-bold text-xs md:text-sm tracking-wider whitespace-nowrap">{isFixed ? "FLAT" : "GET"} {amountDisplay} OFF</span>
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 border-t-2 border-r-2 border-white transform rotate-[135deg] mt-0.5 md:mt-1"></span>
                </div>
            </button>
        </>
    );

    return (
        <>
            {/* Backdrop overlay - click to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={handleClose}
                />
            )}

            {/* DESKTOP ONLY - Middle Right */}
            <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center">
                <FloatingContent />
            </div>
        </>
    );
};

export default FloatingIcons;
