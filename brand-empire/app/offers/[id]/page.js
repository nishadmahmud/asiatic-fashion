"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import FilterSidebar from "@/components/FilterSidebar";
import ProductCard from "@/components/ProductCard";
import CategoryTopFilters from "@/components/CategoryTopFilters";
import { getCampaigns, filterProductsByAttributes } from "@/lib/api";

export default function CampaignPage() {
    const params = useParams();
    const campaignId = params.id;

    const [campaign, setCampaign] = useState(null);
    const [campaignCategories, setCampaignCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState("recommended");
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [mobileSortOpen, setMobileSortOpen] = useState(false);
    const sortDropdownRef = useRef(null);

    // Filters
    const [filters, setFilters] = useState({
        categories: [],
        brands: [],
        priceRange: [0, 50000],
        colors: [],
        sizes: [],
        discount: 0,
        attributeValues: [],
    });

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

    // Close sort dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
                setMobileSortOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchCampaign = async () => {
            try {
                setLoading(true);

                // If attribute filters are selected, use the filter-products API
                if (filters.attributeValues.length > 0) {
                    const response = await filterProductsByAttributes(filters.attributeValues, 1);
                    if (response.success && response.data?.data) {
                        const transformedProducts = response.data.data.map(product => {
                            const mrp = product.retails_price || 0;
                            let finalPrice = mrp;
                            let discountLabel = "";

                            if (product.discount > 0) {
                                const discountType = product.discount_type ? String(product.discount_type).toLowerCase() : 'percentage';
                                if (discountType === 'amount') {
                                    finalPrice = mrp - product.discount;
                                    discountLabel = `৳${product.discount} OFF`;
                                } else {
                                    finalPrice = Math.round(mrp * (1 - product.discount / 100));
                                    discountLabel = `${product.discount}% OFF`;
                                }
                                if (finalPrice < 0) finalPrice = 0;
                            }

                            return {
                                id: product.id,
                                brand: product.brand_name || product.brands?.name || "BRAND",
                                categoryId: product.category_id,
                                name: product.name,
                                price: `৳ ${Math.round(finalPrice).toLocaleString()}`,
                                originalPrice: product.discount > 0 ? `৳ ${mrp.toLocaleString()}` : "",
                                discount: discountLabel,
                                images: product.image_paths && product.image_paths.length > 0
                                    ? product.image_paths
                                    : [product.image_path, product.image_path1, product.image_path2].filter(Boolean),
                                sizes: product.product_variants && product.product_variants.length > 0
                                    ? product.product_variants.map(v => v.name)
                                    : ["S", "M", "L", "XL"],
                                unavailableSizes: [],
                                color: product.color || "gray",
                                rating: product.review_summary?.average_rating || 0,
                                reviews: product.review_summary?.total_reviews || 0,
                                rawPrice: Math.round(finalPrice),
                                rawDiscount: product.discount || 0,
                            };
                        });
                        setProducts(transformedProducts);
                    }
                    setLoading(false);
                    return;
                }

                const response = await getCampaigns();

                if (response.success && response.campaigns?.data) {
                    const foundCampaign = response.campaigns.data.find(
                        c => c.id == campaignId
                    );

                    if (foundCampaign) {
                        setCampaign(foundCampaign);

                        // Store campaign categories for filter
                        if (foundCampaign.categories && foundCampaign.categories.length > 0) {
                            setCampaignCategories(foundCampaign.categories);
                        }

                        // Transform products with campaign discounts
                        const transformedProducts = (foundCampaign.products || []).map(product => {
                            const pivotDiscount = product.pivot?.discount || 0;
                            const discountType = product.pivot?.discount_type || 'percentage';

                            let finalPrice = product.retails_price;
                            let discountText = '';

                            if (discountType === 'percentage' && pivotDiscount > 0) {
                                finalPrice = product.retails_price * (1 - pivotDiscount / 100);
                                discountText = `${pivotDiscount}% OFF`;
                            } else if (discountType === 'amount' && pivotDiscount > 0) {
                                finalPrice = product.retails_price - pivotDiscount;
                                discountText = `৳${pivotDiscount} OFF`;
                            }

                            return {
                                id: product.id,
                                brand: product.brands?.name || "BRAND",
                                categoryId: product.category_id,
                                name: product.name,
                                price: `৳ ${Math.round(finalPrice).toLocaleString()}`,
                                originalPrice: pivotDiscount > 0 ? `৳ ${product.retails_price.toLocaleString()}` : "",
                                discount: discountText,
                                images: product.image_paths && product.image_paths.length > 0
                                    ? product.image_paths
                                    : [product.image_path, product.image_path1, product.image_path2].filter(Boolean),
                                sizes: product.items && product.items.length > 0
                                    ? product.items.map(item => {
                                        const sizeAttr = item.attributes?.find(a => a.attribute?.type === 'size');
                                        return sizeAttr?.attribute_value?.value || '';
                                    }).filter(Boolean)
                                    : ["S", "M", "L", "XL"],
                                unavailableSizes: [],
                                color: product.color || "gray",
                                rating: product.review_summary?.average_rating || 0,
                                reviews: product.review_summary?.total_reviews || 0,
                                rawPrice: Math.round(finalPrice),
                                rawDiscount: pivotDiscount,
                            };
                        });

                        setProducts(transformedProducts);
                    }
                }
            } catch (error) {
                console.error("Error fetching campaign:", error);
            } finally {
                setLoading(false);
            }
        };

        if (campaignId) {
            fetchCampaign();
        }
    }, [campaignId, filters.attributeValues]);

    // Apply filters and sorting
    const filteredAndSortedProducts = useMemo(() => {
        let result = [...products];

        // Apply category filter
        if (filters.categories.length > 0) {
            result = result.filter(p => filters.categories.includes(p.categoryId));
        }

        // Apply brand filter
        if (filters.brands.length > 0) {
            result = result.filter(p => filters.brands.includes(p.brand));
        }

        // Apply price range filter
        result = result.filter(p =>
            p.rawPrice >= filters.priceRange[0] &&
            p.rawPrice <= filters.priceRange[1]
        );

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
            case "discount":
                result.sort((a, b) => b.rawDiscount - a.rawDiscount);
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
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-royal-red)]"></div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
                <p className="text-gray-500 text-lg mb-4">Campaign not found</p>
                <Link href="/offers" className="text-[var(--brand-royal-red)] font-semibold hover:underline">
                    ← Back to Offers
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-4 md:pt-4">
            {/* Breadcrumb - with Filter/Sort on mobile */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-2 md:py-3">
                    <div className="flex items-center justify-between">
                        {/* Breadcrumb Links */}
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 flex-wrap">
                            <Link href="/" className="hover:text-[var(--brand-royal-red)]">Home</Link>
                            <span>/</span>
                            <Link href="/offers" className="hover:text-[var(--brand-royal-red)]">Offers</Link>
                            <span>/</span>
                            <span className="text-gray-900 font-medium">{campaign.name}</span>

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
                                                    sortBy === "price-high" ? "High" :
                                                        sortBy === "discount" ? "Discount" : "Sort"}
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
                                            {[
                                                { value: "recommended", label: "Recommended" },
                                                { value: "discount", label: "Highest Discount" },
                                                { value: "newest", label: "Newest First" },
                                                { value: "price-low", label: "Price: Low to High" },
                                                { value: "price-high", label: "Price: High to Low" },
                                            ].map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setSortBy(option.value);
                                                        setMobileSortOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-3 md:py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${sortBy === option.value ? 'text-[var(--brand-royal-red)] font-bold' : 'text-gray-700'}`}
                                                >
                                                    {option.label}
                                                    {sortBy === option.value && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--brand-royal-red)]">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                    )}
                                                </button>
                                            ))}
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
                            categories={campaignCategories}
                            hideBrandFilter={false}
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
                                        <option value="discount">Highest Discount</option>
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
                        {filteredAndSortedProducts.length > 0 ? (
                            <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
                                {filteredAndSortedProducts.map((product) => (
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
                            categories={campaignCategories}
                            hideBrandFilter={false}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
