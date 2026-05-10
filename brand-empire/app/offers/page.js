"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCampaigns } from "@/lib/api";

export default function OffersPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const response = await getCampaigns();
                if (response.success && response.campaigns?.data) {
                    // Filter only active campaigns
                    const activeCampaigns = response.campaigns.data.filter(
                        campaign => campaign.status === 'active'
                    );
                    setCampaigns(activeCampaigns);
                }
            } catch (error) {
                console.error("Error fetching campaigns:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaigns();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-royal-red)]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--brand-royal-red)] to-red-700 text-white py-8 md:py-12">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold mb-2">🔥 HOT DEALS & OFFERS</h1>
                    <p className="text-lg md:text-xl opacity-90">Don't miss out on these amazing discounts!</p>
                </div>
            </div>

            {/* Campaigns Grid */}
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
                {campaigns.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">No active offers at the moment.</p>
                        <Link href="/" className="text-[var(--brand-royal-red)] font-semibold hover:underline mt-4 inline-block">
                            Continue Shopping →
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaigns.map((campaign) => (
                            <Link
                                key={campaign.id}
                                href={`/offers/${campaign.id}`}
                                className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                            >
                                {/* Campaign Banner */}
                                <div className="relative h-48 md:h-56 overflow-hidden">
                                    {campaign.bg_image ? (
                                        <Image
                                            src={campaign.bg_image}
                                            alt={campaign.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[var(--brand-royal-red)] to-red-600 flex items-center justify-center">
                                            <span className="text-white text-4xl">🎉</span>
                                        </div>
                                    )}
                                    {/* Discount Badge */}
                                    <div className="absolute top-4 right-4 bg-[var(--brand-royal-red)] text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                        {campaign.discount_type === 'amount'
                                            ? `Up to ${campaign.discount} TAKA OFF`
                                            : `Up to ${campaign.discount}% OFF`
                                        }
                                    </div>
                                </div>

                                {/* Campaign Info */}
                                <div className="p-5">
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-[var(--brand-royal-red)] transition-colors mb-2">
                                        {campaign.name}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">
                                            {campaign.products?.length || 0} Products
                                        </span>
                                        <span className="text-[var(--brand-royal-red)] font-semibold text-sm group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                                            Shop Now
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
