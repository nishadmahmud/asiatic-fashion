
"use client";

import React from "react";
import Image from "next/image";
import { Award, Users, Heart, Globe } from "lucide-react";

export default function AboutUs() {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative h-[400px] bg-gray-900 flex items-center justify-center text-center px-4">
                <div className="absolute inset-0 bg-black/60 z-10"></div>
                <div className="relative z-20 max-w-3xl">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Redefining Fashion for the Modern Era</h1>
                    <p className="text-gray-200 text-lg md:text-xl leading-relaxed">
                        Brand Empire is not just a clothing store; it's a statement of style, quality, and individuality. We bring world-class fashion to your doorstep.
                    </p>
                </div>
                {/* Background Image Placeholder - In a real app, use a real image */}
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-red-900 to-gray-900"></div>
            </div>

            <div className="section-content py-16 md:py-24">
                {/* Our Story */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
                        <div className="space-y-4 text-gray-600 leading-relaxed">
                            <p>
                                Founded in 2020, Brand Empire began with a simple mission: to make premium fashion accessible to everyone in Bangladesh. What started as a small online boutique has grown into a premier fashion destination.
                            </p>
                            <p>
                                We believe that fashion is a form of self-expression. That's why we curate collections that cater to diverse tastes—from timeless classics to the latest streetwear trends. Our team works tirelessly to source the best fabrics and designs, ensuring that every piece you buy stands the test of time.
                            </p>
                            <p>
                                Today, Brand Empire serves customers across the nation, driven by our core values of quality, integrity, and customer obsession.
                            </p>
                        </div>
                    </div>
                    <div className="relative h-[400px] bg-gray-100 rounded-2xl overflow-hidden shadow-lg">
                        {/* Placeholder for About Image */}
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-200">
                            <span className="text-xl font-medium">Brand Empire Store Image</span>
                        </div>
                    </div>
                </div>

                {/* Values */}
                <div className="mb-24">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
                        <p className="text-gray-600">We are committed to providing the best shopping experience.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Award, title: "Premium Quality", desc: "Handpicked fabrics and superior craftsmanship in every stitch." },
                            { icon: Heart, title: "Customer First", desc: "Your satisfaction is our priority. 24/7 support for all your needs." },
                            { icon: Globe, title: "Nationwide Delivery", desc: "Fast and secure delivery to every corner of Bangladesh." },
                            { icon: Users, title: "Community", desc: "Join thousands of fashion enthusiasts who trust Brand Empire." }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-gray-50 p-8 rounded-xl text-center hover:bg-white hover:shadow-lg transition-all border border-gray-100">
                                <div className="w-14 h-14 bg-red-100 text-[var(--brand-royal-red)] rounded-full flex items-center justify-center mx-auto mb-6">
                                    <item.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                                <p className="text-gray-500 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="bg-[var(--brand-royal-red)] rounded-3xl p-12 md:p-16 text-white text-center">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <div className="text-4xl md:text-5xl font-extrabold mb-2">50k+</div>
                            <div className="text-red-100 text-sm md:text-base font-medium">Happy Customers</div>
                        </div>
                        <div>
                            <div className="text-4xl md:text-5xl font-extrabold mb-2">100+</div>
                            <div className="text-red-100 text-sm md:text-base font-medium">Top Brands</div>
                        </div>
                        <div>
                            <div className="text-4xl md:text-5xl font-extrabold mb-2">5k+</div>
                            <div className="text-red-100 text-sm md:text-base font-medium">Products</div>
                        </div>
                        <div>
                            <div className="text-4xl md:text-5xl font-extrabold mb-2">4.8</div>
                            <div className="text-red-100 text-sm md:text-base font-medium">Average Rating</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
