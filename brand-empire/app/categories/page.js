"use client";

import { useState, useEffect } from "react";
import { getCategoriesFromServer } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await getCategoriesFromServer();
                if (response.success && response.data) {
                    setCategories(response.data);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--brand-royal-red)]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-4 md:pt-8 pb-24 md:pb-8">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Browse Categories</h1>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {categories.map((category) => (
                        <Link
                            key={category.category_id}
                            href={`/category/${category.category_id}`}
                            className="group"
                        >
                            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                                <div className="relative aspect-square mb-4 bg-gray-50 rounded-xl overflow-hidden">
                                    {category.image_url ? (
                                        <Image
                                            src={category.image_url}
                                            alt={category.name}
                                            fill
                                            className="object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="3" y1="9" x2="21" y2="9"></line>
                                                <line x1="9" y1="21" x2="9" y2="9"></line>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-center font-semibold text-gray-900 text-sm md:text-base">
                                    {category.name}
                                </h3>
                            </div>
                        </Link>
                    ))}
                </div>

                {categories.length === 0 && !loading && (
                    <div className="text-center py-20 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="3" y1="9" x2="21" y2="9"></line>
                            <line x1="9" y1="21" x2="9" y2="9"></line>
                        </svg>
                        <p className="text-lg">No categories available</p>
                    </div>
                )}
            </div>
        </div>
    );
}
