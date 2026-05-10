"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getTopBrands } from "@/lib/api";

function BrandsContent() {
    const searchParams = useSearchParams();
    const typeFilter = searchParams.get("type");

    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(typeFilter || "all");

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const response = await getTopBrands();
                if (response.success && response.data) {
                    setBrands(response.data);
                }
            } catch (error) {
                console.error("Error fetching brands:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBrands();
    }, []);

    useEffect(() => {
        if (typeFilter) {
            setActiveTab(typeFilter);
        }
    }, [typeFilter]);

    const filteredBrands = brands.filter(brand => {
        if (activeTab === "all") return true;
        if (activeTab === "international") return brand.description === "International";
        if (activeTab === "local") return brand.description === "Local";
        return true;
    });

    const tabs = [
        { id: "all", label: "All Brands" },
        { id: "international", label: "International" },
        { id: "local", label: "Bangladeshi" },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Header */}
            <div className="bg-gradient-to-r from-[var(--brand-royal-red)] to-red-700 py-12 md:py-16">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                        Our Brands
                    </h1>
                    <p className="text-white/80 text-sm md:text-base max-w-2xl mx-auto">
                        Discover our curated collection of premium international and local brands
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-1 md:gap-2 overflow-x-auto py-3 md:py-4 scrollbar-hide">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                    ? "bg-[var(--brand-royal-red)] text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Brands Grid */}
            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-royal-red)]"></div>
                    </div>
                ) : filteredBrands.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">No brands found</p>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-600 text-sm mb-6 md:mb-8">
                            Showing {filteredBrands.length} brand{filteredBrands.length !== 1 ? 's' : ''}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                            {filteredBrands.map((brand, index) => (
                                <Link
                                    key={brand.id || index}
                                    href={`/brand/${brand.id}`}
                                    className="group bg-white rounded-xl p-4 md:p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center"
                                >
                                    <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden mb-3 md:mb-4 border-2 border-gray-100 group-hover:border-[var(--brand-royal-red)] transition-colors">
                                        <Image
                                            src={brand.image_path || brand.image || "/placeholder.png"}
                                            alt={brand.name}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-sm md:text-base group-hover:text-[var(--brand-royal-red)] transition-colors uppercase tracking-wide">
                                        {brand.name}
                                    </h3>
                                    <span className="text-[10px] md:text-xs text-gray-400 mt-1 uppercase">
                                        {brand.description || "Brand"}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function BrandsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-royal-red)]"></div>
            </div>
        }>
            <BrandsContent />
        </Suspense>
    );
}
