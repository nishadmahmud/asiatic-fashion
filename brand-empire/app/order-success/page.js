"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const SuccessContent = () => {
    const searchParams = useSearchParams();
    const invoiceId = searchParams.get('invoice');

    return (
        <div className="flex-1 flex items-center justify-center pt-24 pb-20 px-4">
            <div className="text-center max-w-2xl w-full">
                {/* Success Icon */}
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-4">Order Placed Successfully!</h1>
                <p className="text-gray-600 mb-2 text-lg">
                    Thank you for your order. We've received your order and will process it shortly.
                </p>
                {invoiceId && (
                    <div className="mb-6 inline-block bg-gray-100 px-4 py-2 rounded-lg">
                        <p className="text-gray-900 font-medium">
                            Order ID: <span className="font-mono font-bold text-black">{invoiceId}</span>
                        </p>
                    </div>
                )}

                {/* Order Details */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-left">
                    <h2 className="font-bold text-lg mb-4">What's Next?</h2>
                    <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 flex-shrink-0 mt-0.5">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>You can track your order using the Order ID <strong>{invoiceId}</strong></span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 flex-shrink-0 mt-0.5">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>You will receive an order confirmation email shortly</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 flex-shrink-0 mt-0.5">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>We'll call you to confirm your order and delivery details</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 flex-shrink-0 mt-0.5">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>Your order will be delivered within the estimated time</span>
                        </li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="px-8 py-3 bg-[var(--brand-royal-red)] text-white font-bold uppercase text-sm hover:bg-red-700 transition-colors"
                    >
                        Continue Shopping
                    </Link>
                    <Link
                        href="/track-order"
                        className="px-8 py-3 border-2 border-[var(--brand-royal-red)] text-[var(--brand-royal-red)] font-bold uppercase text-sm hover:bg-red-50 transition-colors"
                    >
                        Track Order
                    </Link>
                </div>

                <p className="text-sm text-gray-500 mt-8">
                    Need help? Contact us at <a href="mailto:support@brandempire.com" className="text-[var(--brand-royal-red)] hover:underline">support@brandempire.com</a>
                </p>
            </div>
        </div>
    );
};

const OrderSuccessPage = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
                <SuccessContent />
            </Suspense>
        </div>
    );
};

export default OrderSuccessPage;
