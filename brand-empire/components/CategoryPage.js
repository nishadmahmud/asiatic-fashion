"use client";

import React, { useState, useMemo } from "react";
import FilterSidebar from "./FilterSidebar";
import ProductCard from "./ProductCard";
import { categoryProducts } from "@/data/categoryData";

const CategoryPage = ({ category = "men" }) => {
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [sortBy, setSortBy] = useState("recommended");
    const [filters, setFilters] = useState({
        gender: category === "men" ? "Men" : category === "women" ? "Women" : "",
        categories: [],
        brands: [],
        priceRange: [500, 9000],
        colors: [],
        discount: 0,
    });

    // Filter products
    const filteredProducts = useMemo(() => {
        let products = [...categoryProducts];

        // Gender filter
        if (filters.gender) {
            products = products.filter(p => p.gender === filters.gender);
        }

        // Categories filter
        if (filters.categories.length > 0) {
            products = products.filter(p => filters.categories.includes(p.category));
        }

        // Brands filter
        if (filters.brands.length > 0) {
            products = products.filter(p => filters.brands.includes(p.brand));
        }

        // Price range filter
        products = products.filter(p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]);

        // Color filter
        if (filters.colors.length > 0) {
            products = products.filter(p => filters.colors.includes(p.color));
        }

        // Discount filter
        if (filters.discount > 0) {
            products = products.filter(p => p.discount >= filters.discount);
        }

        return products;
    }, [filters]);

    // Sort products
    const sortedProducts = useMemo(() => {
        let products = [...filteredProducts];

        switch (sortBy) {
            case "price-low":
                return products.sort((a, b) => a.price - b.price);
            case "price-high":
                return products.sort((a, b) => b.price - a.price);
            case "newest":
                return products.reverse();
            default:
                return products;
        }
    }, [filteredProducts, sortBy]);

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const handleClearAll = () => {
        setFilters({
            gender: category === "men" ? "Men" : category === "women" ? "Women" : "",
            categories: [],
            brands: [],
            priceRange: [500, 9000],
            colors: [],
            discount: 0,
        });
    };

    // Format product for ProductCard
    const formatProduct = (product) => ({
        ...product,
        price: `৳ ${product.price.toLocaleString()}`,
        originalPrice: product.originalPrice ? `৳ ${product.originalPrice.toLocaleString()}` : "",
        discount: product.discount ? `${product.discount}% OFF` : "",
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-200">
                <div className="w-[90%] max-w-[1600px] mx-auto py-3">
                    <div className="flex items-center gap-2 text-sm">
                        <a href="/" className="text-gray-500 hover:text-black">Home</a>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-900 font-medium capitalize">{category}</span>
                    </div>
                </div>
            </div>

            {/* Header with count and sort */}
            <div className="bg-white border-b border-gray-200">
                <div className="w-[90%] max-w-[1600px] mx-auto py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold capitalize mb-1">{category}</h1>
                            <p className="text-sm text-gray-500">{sortedProducts.length} items</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Mobile Filter Button */}
                            <button
                                onClick={() => setMobileFiltersOpen(true)}
                                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="4" y1="21" x2="4" y2="14"></line>
                                    <line x1="4" y1="10" x2="4" y2="3"></line>
                                    <line x1="12" y1="21" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12" y2="3"></line>
                                    <line x1="20" y1="21" x2="20" y2="16"></line>
                                    <line x1="20" y1="12" x2="20" y2="3"></line>
                                    <line x1="1" y1="14" x2="7" y2="14"></line>
                                    <line x1="9" y1="8" x2="15" y2="8"></line>
                                    <line x1="17" y1="16" x2="23" y2="16"></line>
                                </svg>
                                Filters
                            </button>

                            {/* Sort Dropdown */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 hidden sm:block">Sort by:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded text-sm font-medium focus:outline-none focus:border-[var(--brand-royal-red)] cursor-pointer"
                                >
                                    <option value="recommended">Recommended</option>
                                    <option value="newest">Newest First</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-[90%] max-w-[1600px] mx-auto py-6">
                <div className="flex gap-6">
                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-24">
                            <FilterSidebar
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                onClearAll={handleClearAll}
                            />
                        </div>
                    </aside>

                    {/* Product Grid */}
                    <main className="flex-1">
                        {sortedProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {sortedProducts.map((product) => (
                                    <ProductCard key={product.id} product={formatProduct(product)} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-gray-500 text-lg">No products found matching your filters.</p>
                                <button
                                    onClick={handleClearAll}
                                    className="mt-4 text-[var(--brand-royal-red)] font-bold hover:underline"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            {mobileFiltersOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setMobileFiltersOpen(false)}
                    ></div>

                    {/* Drawer */}
                    <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                            <h3 className="text-lg font-bold">Filters</h3>
                            <button
                                onClick={() => setMobileFiltersOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <FilterSidebar
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearAll={handleClearAll}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryPage;
