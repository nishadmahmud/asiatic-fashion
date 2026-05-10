"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

const SuccessContent = () => {
    const searchParams = useSearchParams();
    const invoiceId = searchParams.get('invoice');

    return (
        <div className="flex-1 flex items-center justify-center pt-24 pb-20 px-4 min-h-[70vh] bg-[#F8F8F6]">
            <div className="text-center max-w-2xl w-full bg-white p-12 border border-[#E5E5E5]">
                {/* Success Icon */}
                <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold mb-4 text-[#1A1A1A] tracking-widest uppercase">Order Placed Successfully!</h1>
                <p className="text-[#666666] mb-6 text-sm tracking-widest uppercase">
                    Thank you for your order. We've received your order and will process it shortly.
                </p>
                {invoiceId && (
                    <div className="mb-8 inline-block bg-[#F8F8F6] px-6 py-3 border border-[#E5E5E5]">
                        <p className="text-[#1A1A1A] text-xs font-bold tracking-widest uppercase">
                            Order ID: <span className="font-mono ml-2">{invoiceId}</span>
                        </p>
                    </div>
                )}

                {/* Order Details */}
                <div className="bg-[#F8F8F6] border border-[#E5E5E5] p-6 mb-8 text-left">
                    <h2 className="font-bold text-[#1A1A1A] text-xs tracking-widest uppercase mb-4 border-b border-[#E5E5E5] pb-2">What's Next?</h2>
                    <ul className="space-y-4 text-[#666666] text-[10px] tracking-widest uppercase">
                        <li className="flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>You can track your order using the Order ID <strong>{invoiceId}</strong></span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>You will receive an order confirmation email shortly</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>We'll call you to confirm your order and delivery details</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>Your order will be delivered within the estimated time</span>
                        </li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                    <Link
                        href="/category/16167"
                        className="px-8 py-4 bg-[#1A1A1A] text-white font-bold uppercase text-[10px] tracking-widest hover:bg-[#333333] transition-colors"
                    >
                        Continue Shopping
                    </Link>
                    <Link
                        href="/track-order"
                        className="px-8 py-4 border border-[#1A1A1A] text-[#1A1A1A] font-bold uppercase text-[10px] tracking-widest hover:bg-[#F8F8F6] transition-colors"
                    >
                        Track Order
                    </Link>
                </div>

                <p className="text-[10px] text-[#999999] tracking-widest uppercase mt-8">
                    Need help? Contact us at <a href="mailto:info@asiaticfashion.com" className="text-[#1A1A1A] hover:underline">info@asiaticfashion.com</a>
                </p>
            </div>
        </div>
    );
};

const OrderSuccessPage = () => {
    return (
        <div className="min-h-screen flex flex-col bg-[#F8F8F6]">
            <Header />
            <Suspense fallback={<div className="flex-1 flex items-center justify-center text-[#1A1A1A] text-xs uppercase tracking-widest font-bold">Loading...</div>}>
                <SuccessContent />
            </Suspense>
            <Footer />
        </div>
    );
};

export default OrderSuccessPage;
