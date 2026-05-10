"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FilterSidebar from "@/components/FilterSidebar";
import ProductCard from "@/components/ProductCard";
import { searchProducts, getProductById, filterProductsByAttributes } from "@/lib/api";

import CategoryTopFilters from "@/components/CategoryTopFilters";

function SearchPageContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [sortBy, setSortBy] = useState("recommended");

    // Dynamic filters state
    const [availableCategories, setAvailableCategories] = useState([]);
    const [availableSizes, setAvailableSizes] = useState([]);

    const [filters, setFilters] = useState({
        categories: [],
        brands: [],
        priceRange: [0, 50000],
        colors: [],
        sizes: [],
        discount: 0,
        bundle: 'single',
        country: 'all',
        attributeValues: [], // For dynamic attribute filters
    });


    // Fetch search results
    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!query.trim() && filters.attributeValues.length === 0) {
                setProducts([]);
                setAvailableCategories([]);
                setAvailableSizes([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                let response;

                // If attribute filters are selected, use the filter-products API
                if (filters.attributeValues.length > 0) {
                    response = await filterProductsByAttributes(filters.attributeValues, 1);
                    if (response.success && response.data?.data) {
                        response = { success: true, data: { data: response.data.data } };
                    }
                } else {
                    response = await searchProducts(query);
                }

                if (response.success && response.data && response.data.data) {
                    const transformedProducts = response.data.data.map(product => {
                        let finalPrice = product.retails_price || 0;
                        let rawPrice = finalPrice;
                        let originalPrice = null;
                        let discountLabel = "";
                        let rawDiscount = product.discount || 0;

                        // Check for Campaign first
                        if (product.campaigns && product.campaigns.length > 0) {
                            const campaign = product.campaigns[0];
                            let discountAmount = 0;

                            // Check discount type (handle null case safely)
                            const discountType = campaign.discount_type ? String(campaign.discount_type).toLowerCase() : 'amount';

                            if (discountType === 'amount') {
                                discountAmount = campaign.discount;
                                discountLabel = `৳${campaign.discount} OFF`;
                            } else if (discountType === 'percentage') {
                                discountAmount = (finalPrice * campaign.discount) / 100;
                                discountLabel = `${campaign.discount}% OFF`;
                            }

                            let calculatedPrice = finalPrice - discountAmount;
                            if (calculatedPrice < 0) calculatedPrice = 0;

                            originalPrice = finalPrice; // The retail price becomes original
                            finalPrice = calculatedPrice;
                            rawPrice = calculatedPrice;
                            rawDiscount = campaign.discount; // Store for filtering if needed

                        } else if (product.discount > 0) {
                            // Standard discount logic
                            // Assuming retails_price is the Selling Price (post-discount) as per previous logic
                            originalPrice = finalPrice / (1 - product.discount / 100);
                            discountLabel = `${product.discount}% OFF`;
                        }

                        return {
                            id: product.id,
                            brand: product.brand_name || product.brands?.name || "BRAND",
                            name: product.name,
                            price: `৳ ${finalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                            originalPrice: originalPrice ? `৳ ${originalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "",
                            discount: discountLabel,
                            images: product.image_paths && product.image_paths.length > 0
                                ? product.image_paths
                                : [product.image_path, product.image_path1, product.image_path2].filter(Boolean),
                            sizes: product.product_variants && product.product_variants.length > 0
                                ? product.product_variants.map(v => v.name)
                                : product.items?.map(item => item.size) || [],
                            unavailableSizes: product.product_variants && product.product_variants.length > 0
                                ? product.product_variants.filter(v => v.quantity === 0).map(v => v.name)
                                : product.items?.filter(item => item.quantity === 0).map(item => item.size) || [],
                            color: product.color ||
                                (product.name.toLowerCase().includes("black") ? "black" :
                                    product.name.toLowerCase().includes("blue") ? "blue" :
                                        product.name.toLowerCase().includes("white") ? "white" : "gray"),
                            rating: product.review_summary?.average_rating || 0,
                            reviews: product.review_summary?.total_reviews || 0,
                            rawPrice: rawPrice,
                            rawDiscount: rawDiscount,
                            category: product.category, // Keep original category object for filtering
                            categoryId: product.category_id,
                            categoryName: product.category?.name
                        };
                    });

                    setProducts(transformedProducts);

                    // Extract unique categories from search results
                    const categoriesMap = new Map();
                    transformedProducts.forEach(p => {
                        if (p.categoryId && p.categoryName) {
                            if (!categoriesMap.has(p.categoryId)) {
                                categoriesMap.set(p.categoryId, {
                                    id: p.categoryId,
                                    name: p.categoryName,
                                    count: 1
                                });
                            } else {
                                categoriesMap.get(p.categoryId).count++;
                            }
                        }
                    });
                    setAvailableCategories(Array.from(categoriesMap.values()));

                    // Extract unique sizes
                    // Extract unique sizes
                    const sizesSet = new Set();
                    transformedProducts.forEach(p => {
                        if (p.sizes && Array.isArray(p.sizes)) {
                            p.sizes.forEach(s => sizesSet.add(s));
                        }
                    });
                    setAvailableSizes(Array.from(sizesSet).sort());

                    setLoading(false);

                    // Background fetch for details (to get sizes)
                    try {
                        const enrichedProducts = await Promise.all(
                            transformedProducts.map(async (p) => {
                                try {
                                    const detailRes = await getProductById(p.id);
                                    if (detailRes.success && detailRes.data) {
                                        const detailedParams = detailRes.data;
                                        const variants = detailedParams.product_variants || [];
                                        const sizes = variants.map(v => v.name).filter(Boolean);
                                        const unavailableSizes = variants.filter(v => v.quantity === 0).map(v => v.name);

                                        if (sizes.length > 0) {
                                            return {
                                                ...p,
                                                sizes: sizes,
                                                unavailableSizes: unavailableSizes.length > 0 ? unavailableSizes : p.unavailableSizes
                                            };
                                        }
                                    }
                                } catch (err) {
                                    // Ignore error
                                }
                                return p;
                            })
                        );

                        setProducts(enrichedProducts);

                        // Re-extract unique sizes from enriched products
                        const enrichedSizesSet = new Set();
                        enrichedProducts.forEach(p => {
                            if (p.sizes && Array.isArray(p.sizes)) {
                                p.sizes.forEach(s => enrichedSizesSet.add(s));
                            }
                        });
                        setAvailableSizes(Array.from(enrichedSizesSet).sort());

                    } catch (bgError) {
                        console.error("Background fetch error:", bgError);
                    }

                } else {
                    setProducts([]);
                    setAvailableCategories([]);
                    setAvailableSizes([]);
                    setLoading(false);
                }


            } catch (error) {
                console.error("Error fetching search results:", error);
                setProducts([]);
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [query, filters.attributeValues]);


    // Apply filters and sorting
    const filteredAndSortedProducts = useMemo(() => {
        if (!products || !Array.isArray(products)) {
            return [];
        }
        let result = [...products];

        // Apply category filter (from sidebar)
        if (filters.categories && filters.categories.length > 0) {
            result = result.filter(p => filters.categories.includes(p.categoryId.toString()) || filters.categories.includes(p.categoryId));
        }

        // Apply brand filter
        if (filters.brands && filters.brands.length > 0) {
            result = result.filter(p => filters.brands.includes(p.brand));
        }

        // Apply price range filter
        if (filters.priceRange && filters.priceRange.length === 2) {
            result = result.filter(p =>
                p.rawPrice >= filters.priceRange[0] &&
                p.rawPrice <= filters.priceRange[1]
            );
        }

        // Apply color filter
        if (filters.colors && filters.colors.length > 0) {
            result = result.filter(p => filters.colors.includes(p.color));
        }

        // Apply size filter
        if (filters.sizes && filters.sizes.length > 0) {
            result = result.filter(p =>
                p.sizes.some(size => filters.sizes.includes(size))
            );
        }

        // Apply discount filter
        if (filters.discount > 0) {
            result = result.filter(p => p.rawDiscount >= filters.discount);
        }

        // Apply Country Filter
        if (filters.country === 'bangladesh') {
            // Assuming "Made in Bangladesh" logic. 
            // Since we don't have a direct field in transformedProducts for country yet, 
            // we'll filter based on a hypothetical property or description check if available.
            // But checking the API response provided by user: `description` contains "Made in Bangladesh".
            // However, parsing HTML description is expensive. 
            // For now, we will perform a check on `p.description` if it exists.
            result = result.filter(p =>
                p.description && p.description.toLowerCase().includes("bangladesh")
            );
        }

        // Apply Bundle Filter (Placeholder logic for now as per user request history)
        if (filters.bundle === 'bundle') {
            // Logic for bundles (currently same as single/placeholder)
        }


        // Apply sorting
        switch (sortBy) {
            case "price-low":
                result.sort((a, b) => a.rawPrice - b.rawPrice);
                break;
            case "price-high":
                result.sort((a, b) => b.rawPrice - a.rawPrice);
                break;
            case "newest":
                result.reverse();
                break;
            default:
                break;
        }

        return result;
    }, [products, filters, sortBy]);

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const handleClearAll = () => {
        setFilters({
            categories: [],
            brands: [],
            priceRange: [0, 50000],
            colors: [],
            sizes: [],
            discount: 0,
            bundle: 'single',
            country: 'all',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-4 md:pt-4">

            {/* Breadcrumb - with Filter/Sort on mobile */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-2 md:py-3">
                    <div className="flex items-center justify-between">
                        {/* Breadcrumb Links */}
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 flex-wrap">
                            <a href="/" className="hover:text-[var(--brand-royal-red)]">Home</a>
                            <span>/</span>
                            <span className="text-gray-900 font-medium">Search Results</span>
                            {query && (
                                <>
                                    <span>/</span>
                                    <span className="text-gray-900 font-medium">"{query}"</span>
                                </>
                            )}
                            {/* Item count on mobile */}
                            <span className="lg:hidden text-gray-400 ml-1">
                                ({loading ? "..." : filteredAndSortedProducts.length})
                            </span>
                        </div>

                        {/* Filter & Sort - Mobile only in breadcrumb */}
                        <div className="flex items-center gap-2 lg:hidden">
                            <button
                                onClick={() => setMobileFiltersOpen(true)}
                                className="flex items-center justify-center gap-1 px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 bg-white text-xs font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="4" y1="21" x2="4" y2="14"></line>
                                    <line x1="4" y1="10" x2="4" y2="3"></line>
                                    <line x1="12" y1="21" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12" y2="3"></line>
                                    <line x1="20" y1="21" x2="20" y2="16"></line>
                                    <line x1="20" y1="12" x2="20" y2="3"></line>
                                </svg>
                                <span>Filter</span>
                            </button>
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-2 py-1 border border-gray-300 rounded-md bg-white text-xs focus:outline-none appearance-none font-medium pr-5"
                                >
                                    <option value="recommended">Sort</option>
                                    <option value="newest">New</option>
                                    <option value="price-low">Low</option>
                                    <option value="price-high">High</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-1 pointer-events-none text-gray-500">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Filters - Mobile */}
            <div className="md:hidden bg-white border-b border-gray-100 px-4">
                <CategoryTopFilters
                    availableSizes={availableSizes}
                    selectedSizes={filters.sizes}
                    onSizeChange={(size) => {
                        const newSizes = filters.sizes.includes(size)
                            ? filters.sizes.filter(s => s !== size)
                            : [...filters.sizes, size];
                        handleFilterChange('sizes', newSizes);
                    }}
                    selectedBundle={filters.bundle}
                    onBundleChange={(val) => handleFilterChange('bundle', val)}
                    selectedCountry={filters.country}
                    onCountryChange={(val) => handleFilterChange('country', val)}
                    selectedAttributeValues={filters.attributeValues}
                    onAttributeChange={(values) => handleFilterChange('attributeValues', values)}
                />
            </div>

            {/* Main Content */}
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-2 md:py-6">
                <div className="flex gap-6">
                    {/* Filter Sidebar - Desktop */}
                    <div className="hidden lg:block w-64 flex-shrink-0">
                        <FilterSidebar
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearAll={handleClearAll}
                            products={products}
                            categories={availableCategories}
                            selectedCategoryId={filters.categories[0]}
                            onCategoryChange={(id) => handleFilterChange('categories', id ? [id] : [])}
                        />
                    </div>

                    {/* Products Section */}
                    <div className="flex-1">
                        {/* Header with Sort - Desktop only */}
                        <div className="hidden md:flex items-center justify-between mb-3 gap-2">
                            <CategoryTopFilters
                                className="flex-1"
                                availableSizes={availableSizes}
                                selectedSizes={filters.sizes}
                                onSizeChange={(size) => {
                                    const newSizes = filters.sizes.includes(size)
                                        ? filters.sizes.filter(s => s !== size)
                                        : [...filters.sizes, size];
                                    handleFilterChange('sizes', newSizes);
                                }}
                                selectedBundle={filters.bundle}
                                onBundleChange={(val) => handleFilterChange('bundle', val)}
                                selectedCountry={filters.country}
                                onCountryChange={(val) => handleFilterChange('country', val)}
                                selectedAttributeValues={filters.attributeValues}
                                onAttributeChange={(values) => handleFilterChange('attributeValues', values)}
                            />

                            <div className="flex items-center gap-2">
                                {/* Sort Dropdown - Desktop */}
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-royal-red)] appearance-none font-medium pr-8"
                                    >
                                        <option value="recommended">Recommended</option>
                                        <option value="newest">Newest First</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Products Grid */}
                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-royal-red)]"></div>
                            </div>
                        ) : !query ? (
                            <div className="text-center py-20">
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-300 mb-4">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
                                <p className="text-gray-500 text-lg">Enter a search term to find products</p>
                            </div>
                        ) : filteredAndSortedProducts.length > 0 ? (
                            <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
                                {filteredAndSortedProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-300 mb-4">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
                                <p className="text-gray-500 text-lg">No products found for "{query}"</p>
                                <button
                                    onClick={handleClearAll}
                                    className="mt-4 text-[var(--brand-royal-red)] font-semibold hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Modal */}
            {mobileFiltersOpen && (
                <div className="fixed inset-0 z-[70] lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)}></div>
                    <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto pb-32">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-bold">Filters</h2>
                            <button onClick={() => setMobileFiltersOpen(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <FilterSidebar
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearAll={handleClearAll}
                            products={products}
                            categories={availableCategories}
                            selectedCategoryId={filters.categories[0]}
                            onCategoryChange={(id) => handleFilterChange('categories', id ? [id] : [])}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-royal-red)]"></div>
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}
