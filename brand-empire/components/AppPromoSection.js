"use client";

import React from "react";
import Image from "next/image";

const AppPromoSection = () => {
    return (
        <section className="bg-gradient-to-br from-[#fef5f0] to-[#fff9f5] overflow-hidden">
            <div className="section-content py-6 md:py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Left: Text Content */}
                    <div className="space-y-3 md:space-y-4 text-center md:text-left order-2 md:order-1">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1.5">
                                Download Our App
                            </h2>
                            <p className="text-sm md:text-base text-gray-600">
                                Experience seamless shopping on the go
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2.5 justify-center md:justify-start">
                                <div className="w-8 h-8 bg-[var(--brand-royal-red)] rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                <span className="text-xs md:text-sm text-gray-700">Exclusive app-only deals</span>
                            </div>
                            <div className="flex items-center gap-2.5 justify-center md:justify-start">
                                <div className="w-8 h-8 bg-[var(--brand-royal-red)] rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                <span className="text-xs md:text-sm text-gray-700">Easy returns & exchanges</span>
                            </div>
                            <div className="flex items-center gap-2.5 justify-center md:justify-start">
                                <div className="w-8 h-8 bg-[var(--brand-royal-red)] rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                <span className="text-xs md:text-sm text-gray-700">Track your orders in real-time</span>
                            </div>
                        </div>

                        {/* Download Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2.5 justify-center md:justify-start pt-1">
                            <a href="#" className="inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                </svg>
                                <div className="text-left">
                                    <div className="text-[9px] leading-tight">Download on the</div>
                                    <div className="text-xs font-semibold leading-tight">App Store</div>
                                </div>
                            </a>
                            <a href="#" className="inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z" />
                                </svg>
                                <div className="text-left">
                                    <div className="text-[9px] leading-tight">GET IT ON</div>
                                    <div className="text-xs font-semibold leading-tight">Google Play</div>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Center: QR Code */}
                    <div className="flex justify-center order-1 md:order-2">
                        <div className="inline-block bg-white p-3 rounded-lg shadow-md">
                            <Image
                                src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://brandempire.com"
                                alt="QR Code"
                                width={120}
                                height={120}
                            />
                            <p className="text-center text-[10px] text-gray-600 mt-2">Scan to Download</p>
                        </div>
                    </div>

                    {/* Right: Phone Mockup */}
                    <div className="flex justify-center md:justify-end order-3">
                        <div className="relative">
                            {/* Phone Frame - Smaller */}
                            <div className="relative w-[200px] h-[400px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-[32px] p-2 shadow-2xl">
                                {/* Screen */}
                                <div className="w-full h-full bg-gradient-to-br from-blue-900 to-blue-700 rounded-[28px] flex items-center justify-center overflow-hidden">
                                    {/* App Icon with Brand Empire Logo */}
                                    <div className="bg-white rounded-2xl p-4 shadow-xl">
                                        <Image
                                            src="/logo.png"
                                            alt="Brand Empire"
                                            width={60}
                                            height={60}
                                            className="object-contain"
                                        />
                                    </div>
                                </div>

                                {/* Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-900 rounded-b-2xl"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AppPromoSection;
