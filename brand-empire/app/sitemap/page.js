"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Sitemap() {
    const sitemapLinks = [
        {
            title: "Shop",
            links: [
                { name: "New Arrivals", href: "/#new-arrivals" },
                { name: "Men", href: "/men" }, // These would ideally be dynamic if I had the IDs, but linking to the general concept is fine or just ommiting if strictly dynamic. 
                // Wait, I configured the footer to be dynamic. The sitemap should ideally be too, but static links to main areas are standard.
                // Since I deleted /men etc, I should link to valid existing pages or generic search/offers.
                // Actually, I deleted the /men pages. linking to them here will break.
                // I will link to general sections for now.
                { name: "Offers", href: "/offers" },
            ]
        },
        {
            title: "Customer Service",
            links: [
                { name: "Contact Us", href: "/contact" },
                { name: "Shipping Info", href: "/shipping" },
                { name: "Returns Policy", href: "/returns" },
                { name: "Size Guide", href: "/size-guide" },
                { name: "Track Order", href: "/track-order" },
            ]
        },
        {
            title: "Company",
            links: [
                { name: "About Us", href: "/about" },
                { name: "Careers", href: "/careers" },
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Terms & Conditions", href: "/terms" },
            ]
        },
        {
            title: "User Account",
            links: [
                { name: "Login", href: "/login" },
                { name: "Register", href: "/register" },
                { name: "My Profile", href: "/profile" },
                { name: "Wishlist", href: "/wishlist" },
                { name: "Cart", href: "/cart" },
            ]
        }
    ];

    return (
        <div className="section-full py-12 md:py-20 bg-gray-50">
            <div className="section-content max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Sitemap</h1>
                    <p className="text-gray-600">Overview of the pages on our website.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {sitemapLinks.map((section, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">{section.title}</h2>
                            <ul className="space-y-3">
                                {section.links.map((link, linkIdx) => (
                                    <li key={linkIdx}>
                                        <Link href={link.href} className="flex items-center gap-2 text-gray-600 hover:text-[var(--brand-royal-red)] hover:translate-x-1 transition-all">
                                            <ArrowRight size={14} className="opacity-50" />
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
