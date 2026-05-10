"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';
import FilterSidebar from "@/components/FilterSidebar";
import ProductCard from "@/components/ProductCard";
import CategoryTopFilters from "@/components/CategoryTopFilters";
import { getNewArrivalsFromServer, getCategoriesFromServer, getProductById, filterProductsByAttributes, getCampaigns } from "@/lib/api";

export default function NewArrivalsPage() {
    const router = useRouter();
    const pathname = usePathname();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1); // Might need client-side calc if API doesn't paginate
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [sortBy, setSortBy] = useState("newest"); // Default to newest for New Arrivals
    const [mobileSortOpen, setMobileSortOpen] = useState(false);
    const sortDropdownRef = useRef(null);

    // Filters
    const [filters, setFilters] = useState({
        categories: [],
        brands: [],
        priceRange: [0, 1000000],
        colors: [],
        sizes: [],
        discount: 0,
        bundle: 'single',
        country: 'all',
        attributeValues: [],
    });

    // Categories for sidebar (optionally fetch if needed for filtering)
    const [allCategories, setAllCategories] = useState([]);

    const getSizeDataFromVariants = (product) => {
        const variants = Array.isArray(product.product_variants) ? product.product_variants : [];
        if (variants.length === 0) {
            return { sizes: [], unavailableSizes: [] };
        }

        const sizes = [...new Set(variants.map((variant) => variant?.name).filter(Boolean))];
        const unavailableSizes = [...new Set(
            variants
                .filter((variant) => {
                    if (Array.isArray(variant.child_variants) && variant.child_variants.length > 0) {
                        return variant.child_variants.every((child) => (child?.quantity ?? 0) <= 0);
                    }
                    return (variant?.quantity ?? 0) <= 0;
                })
                .map((variant) => variant?.name)
                .filter(Boolean)
        )];

        return { sizes, unavailableSizes };
    };

    const buildCampaignDiscountMap = (campaigns = []) => {
        const discountMap = {};
        campaigns.forEach((campaign) => {
            const campaignProducts = Array.isArray(campaign?.products) ? campaign.products : [];
            campaignProducts.forEach((product) => {
                const productId = product?.id;
                const mrp = Number(product?.retails_price || 0);
                if (!productId || mrp <= 0) return;

                const discountType = String(product?.pivot?.discount_type || campaign?.discount_type || "percentage").toLowerCase();
                const discountValue = Number(product?.pivot?.discount ?? campaign?.discount ?? 0);
                if (discountValue <= 0) return;

                const discountedPrice = discountType === "amount"
                    ? Math.max(0, mrp - discountValue)
                    : Math.max(0, Math.round(mrp * (1 - discountValue / 100)));
                const savings = Math.max(0, mrp - discountedPrice);

                const existing = discountMap[productId];
                if (!existing || savings > existing.savings) {
                    discountMap[productId] = {
                        discountType,
                        discountValue,
                        savings,
                    };
                }
            });
        });
        return discountMap;
    };

    const getProductPricing = (product, campaignDiscountsMap = {}) => {
        const mrp = Number(product.retails_price || 0);
        let finalPrice = mrp;
        let discountLabel = "";
        let rawDiscount = Number(product.discount || 0);

        if (rawDiscount > 0) {
            const discountType = product.discount_type ? String(product.discount_type).toLowerCase() : "percentage";
            if (discountType === "amount") {
                finalPrice = mrp - rawDiscount;
                discountLabel = `\u09F3${rawDiscount} OFF`;
            } else {
                finalPrice = Math.round(mrp * (1 - rawDiscount / 100));
                discountLabel = `${rawDiscount}% OFF`;
            }
            if (finalPrice < 0) finalPrice = 0;
        }

        const campaignDiscount = campaignDiscountsMap[product.id];
        if (campaignDiscount && mrp > 0) {
            const campaignFinalPrice = campaignDiscount.discountType === "amount"
                ? Math.max(0, mrp - campaignDiscount.discountValue)
                : Math.max(0, Math.round(mrp * (1 - campaignDiscount.discountValue / 100)));

            if (rawDiscount <= 0 || campaignFinalPrice < finalPrice) {
                finalPrice = campaignFinalPrice;
                rawDiscount = campaignDiscount.discountValue;
                discountLabel = campaignDiscount.discountType === "amount"
                    ? `\u09F3${campaignDiscount.discountValue} OFF`
                    : `${campaignDiscount.discountValue}% OFF`;
            }
        }

        return { mrp, finalPrice, discountLabel, rawDiscount };
    };

    // Extract unique sizes from products
    const availableSizes = useMemo(() => {
        const sizes = products
            .flatMap(p => p.sizes || [])
            .filter((size, index, self) => self.indexOf(size) === index)
            .sort((a, b) => {
                const aNum = parseInt(a);
                const bNum = parseInt(b);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return aNum - bNum;
                }
                return a.localeCompare(b);
            });
        return sizes;
    }, [products]);

    // Extract unique categories for sidebar
    const availableSidebarCategories = useMemo(() => {
        // Since we don't have a tree structure from the new arrivals API directly similar to category API
        // We might just list categories found in the products? 
        // Or fetch all categories. Let's try to map product categories if available.
        // For now, let's fetch global categories to populate the sidebar if products have category_id
        return allCategories;
    }, [allCategories]);


    // Validation for Sort Dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
                setMobileSortOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch Categories (for sidebar filter structure if we want to show all categories)
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await getCategoriesFromServer();
                if (response.success && response.data) {
                    // Transform categories to ensure products_count is a number
                    const transformedCategories = response.data.map(cat => ({
                        ...cat,
                        id: cat.category_id || cat.id,
                        name: cat.name,
                        products_count: typeof cat.products_count === 'number' ? cat.products_count : parseInt(cat.products_count) || 0
                    }));
                    setAllCategories(transformedCategories);
                }
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        };
        fetchCategories();
    }, []);

    // Fetch New Arrivals
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                let apiProducts = [];
                let response;

                // If attribute filters are selected, use the filter-products API
                if (filters.attributeValues.length > 0) {
                    response = await filterProductsByAttributes(filters.attributeValues, 1);
                    if (response.success && response.data?.data) {
                        apiProducts = response.data.data;
                    }
                } else {
                    response = await getNewArrivalsFromServer();
                    if (response.success && response.data && response.data.data) {
                        apiProducts = response.data.data;
                    }
                }

                let campaignDiscountsMap = {};
                try {
                    const campaignsResponse = await getCampaigns();
                    if (campaignsResponse?.success && Array.isArray(campaignsResponse?.campaigns?.data)) {
                        const activeCampaigns = campaignsResponse.campaigns.data.filter((campaign) => campaign?.status === "active");
                        campaignDiscountsMap = buildCampaignDiscountMap(activeCampaigns);
                    }
                } catch (campaignError) {
                    console.error("Error fetching campaigns for new arrivals discount overlay:", campaignError);
                }

                // Transform
                const transformedProducts = apiProducts.map(product => {
                    const { mrp, finalPrice, discountLabel, rawDiscount } = getProductPricing(product, campaignDiscountsMap);
                    const { sizes, unavailableSizes } = getSizeDataFromVariants(product);

                    return {
                        id: product.id,
                        brand: product.brands?.name || product.category_name || "BRAND",
                        // Keep category_id/name for filtering if needed
                        categoryId: product.category_id,
                        name: product.name,
                        price: `\u09F3 ${finalPrice.toLocaleString()}`,
                        originalPrice: discountLabel ? `\u09F3 ${mrp.toLocaleString()}` : "",
                        discount: discountLabel,
                        images: product.image_paths && product.image_paths.length > 0
                            ? product.image_paths
                            : [product.image_path, product.image_path1, product.image_path2].filter(Boolean),
                        sizes,
                        unavailableSizes,
                        color: product.color || "Default",
                        colorCode: product.color_code || null,
                        rating: product.review_summary?.average_rating || 0,
                        reviews: product.review_summary?.total_reviews || 0,
                        rawPrice: finalPrice,
                        rawDiscount,
                    };
                });

                setProducts(transformedProducts);

                // Handle pagination if API supports it, otherwise client-side (slice in render or filtered)
                // The API call seems to return all (or a set limit). 
                // If response has pagination metadata:
                if (response.pagination) {
                    setTotalPages(response.pagination.last_page);
                } else if (response.data?.last_page) {
                    setTotalPages(response.data.last_page);
                }
            } catch (error) {
                console.error("Error fetching new arrivals:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [filters.attributeValues]);

    // Apply filters and sorting
    const filteredAndSortedProducts = useMemo(() => {
        let result = [...products];

        // Apply brand filter
        if (filters.brands.length > 0) {
            result = result.filter(p => filters.brands.includes(p.brand));
        }

        // Apply price range filter
        result = result.filter(p =>
            p.rawPrice >= filters.priceRange[0] &&
            p.rawPrice <= filters.priceRange[1]
        );

        // Apply color filter
        if (filters.colors.length > 0) {
            result = result.filter(p => filters.colors.includes(p.color));
        }

        // Apply size filter
        if (filters.sizes.length > 0) {
            result = result.filter(p =>
                p.sizes.some(size => filters.sizes.includes(size))
            );
        }

        // Apply discount filter
        if (filters.discount > 0) {
            result = result.filter(p => p.rawDiscount >= filters.discount);
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
                result.reverse(); // Assuming API returns newest first, or we have a date field (not used here)
                // If we want detailed sort, we might need a created_at field, but here we just reverse
                break;
            case "recommended":
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
            categories: [], // Intentionally empty as we are on "New Arrivals" not a specific category
            brands: [],
            priceRange: [0, 1000000],
            colors: [],
            sizes: [],
            discount: 0,
            bundle: 'single',
            country: 'all',
        });
    };

    // Pagination Logic (Client Side if API doesn't support page arg)
    // Assuming API returns all items for now as I didn't see page arg in api.js getNewArrivalsFromServer
    const ITEMS_PER_PAGE = 20;
    const paginatedProducts = useMemo(() => {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAndSortedProducts, page]);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE));
    }, [filteredAndSortedProducts]);


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
                            <span className="text-gray-900 font-medium">New Arrivals</span>

                            {/* Item count on mobile */}
                            <span className="lg:hidden text-gray-400 ml-1">
                                ({loading ? "..." : filteredAndSortedProducts.length})
                            </span>
                        </div>

                        {/* Filter & Sort - Mobile only in breadcrumb */}
                        <div className="flex items-center gap-2 lg:hidden">
                            <button
                                onClick={() => setMobileFiltersOpen(true)}
                                className="flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-200 rounded-full hover:bg-gray-50 bg-white text-xs font-medium transition-colors"
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
                            <div className="relative" ref={sortDropdownRef}>
                                <button
                                    onClick={() => setMobileSortOpen(!mobileSortOpen)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                >
                                    <span>
                                        {sortBy === "recommended" ? "Sort" :
                                            sortBy === "newest" ? "New" :
                                                sortBy === "price-low" ? "Low" :
                                                    sortBy === "price-high" ? "High" : "Sort"}
                                    </span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${mobileSortOpen ? 'rotate-180' : ''}`}>
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </button>

                                {mobileSortOpen && (
                                    <>
                                        <div className="fixed inset-0 bg-black/50 z-[100] md:hidden" onClick={() => setMobileSortOpen(false)}></div>
                                        <div className="fixed inset-x-0 bottom-0 z-[101] w-full rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-xl md:rounded-lg md:absolute md:top-full md:left-0 md:right-auto md:bottom-auto md:w-56 md:mt-2 bg-white border-t md:border border-gray-100 py-2 pb-20 md:pb-2 max-h-[60vh] md:max-h-96 overflow-y-auto">
                                            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 md:hidden">
                                                <span className="font-bold text-gray-900">Sort By</span>
                                                <button onClick={() => setMobileSortOpen(false)} className="p-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSortBy("recommended");
                                                    setMobileSortOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 md:py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${sortBy === "recommended" ? 'text-[var(--brand-royal-red)] font-bold' : 'text-gray-700'
                                                    }`}
                                            >
                                                Recommended
                                                {sortBy === "recommended" && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--brand-royal-red)]">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSortBy("newest");
                                                    setMobileSortOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 md:py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${sortBy === "newest" ? 'text-[var(--brand-royal-red)] font-bold' : 'text-gray-700'
                                                    }`}
                                            >
                                                Newest First
                                                {sortBy === "newest" && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--brand-royal-red)]">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSortBy("price-low");
                                                    setMobileSortOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 md:py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${sortBy === "price-low" ? 'text-[var(--brand-royal-red)] font-bold' : 'text-gray-700'
                                                    }`}
                                            >
                                                Price: Low to High
                                                {sortBy === "price-low" && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--brand-royal-red)]">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSortBy("price-high");
                                                    setMobileSortOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 md:py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${sortBy === "price-high" ? 'text-[var(--brand-royal-red)] font-bold' : 'text-gray-700'
                                                    }`}
                                            >
                                                Price: High to Low
                                                {sortBy === "price-high" && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--brand-royal-red)]">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Filters - Mobile */}
            <div className="md:hidden bg-white border-b border-gray-100 px-4">
                <CategoryTopFilters
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
                            categories={allCategories}
                        // Pass all categories as specific categories selection
                        // Usually FilterSidebar takes 'categories' and renders checkboxes if provided
                        // If we want to navigate like category page, we might just use links or update filters.categories
                        />
                    </div>

                    {/* Products Section */}
                    <div className="flex-1">
                        {/* Header with Filters and Sort - Desktop */}
                        <div className="hidden md:flex items-center justify-between mb-6 gap-4 border-b border-gray-200 pb-4">
                            {/* Left: Filters */}
                            <div className="flex-1">
                                <CategoryTopFilters
                                    availableSizes={availableSizes}
                                    selectedSizes={filters.sizes}
                                    onSizeChange={(size) => {
                                        const newSizes = filters.sizes.includes(size)
                                            ? filters.sizes.filter(s => s !== size)
                                            : [...filters.sizes, size];
                                        handleFilterChange('sizes', newSizes);
                                    }}
                                    selectedBundle={filters.bundle || 'single'}
                                    onBundleChange={(val) => handleFilterChange('bundle', val)}
                                    selectedCountry={filters.country || 'all'}
                                    onCountryChange={(val) => handleFilterChange('country', val)}
                                    className="ml-0"
                                    selectedAttributeValues={filters.attributeValues}
                                    onAttributeChange={(values) => handleFilterChange('attributeValues', values)}
                                />
                            </div>

                            {/* Right: Sort Dropdown */}
                            <div className="flex-shrink-0">
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
                        ) : paginatedProducts.length > 0 ? (
                            <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
                                {paginatedProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-gray-500 text-lg">No products found.</p>
                                <button
                                    onClick={handleClearAll}
                                    className="mt-4 text-[var(--brand-royal-red)] font-semibold hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-12">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="text-gray-700">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
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
                    <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto pb-20">
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
                            categories={allCategories}
                        />
                    </div>
                </div>
            )}
        </div>

    );
}

