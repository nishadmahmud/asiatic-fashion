"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { getNewArrivalsFromServer, getCampaigns } from "@/lib/api";

// Dummy products as fallback
const dummyProducts = [
    {
        id: 101,
        brand: "JACKETS",
        name: "Men Black Solid Casual Jacket",
        price: "৳ 4,999",
        originalPrice: "",
        discount: "",
        images: [
            "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1559551409-dadc959f76b8?q=80&w=1000&auto=format&fit=crop",
        ],
        sizes: ["M", "L", "XL", "XXL"],
        unavailableSizes: [],
        color: "black",
    },
    {
        id: 102,
        brand: "JACKETS",
        name: "Men Off White Solid Casual Jacket",
        price: "৳ 4,999",
        originalPrice: "",
        discount: "",
        images: [
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop",
        ],
        sizes: ["S", "M", "L", "XL"],
        unavailableSizes: ["S"],
        color: "beige",
    },
    {
        id: 103,
        brand: "REGULAR STRAIGHT FIT JEANS",
        name: "Men Blue Mid Wash Jeans",
        price: "৳ 2,135",
        originalPrice: "৳ 2,399",
        discount: "11% OFF",
        images: [
            "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop",
        ],
        sizes: ["30", "32", "34", "36"],
        unavailableSizes: [],
        color: "blue",
    },
    {
        id: 104,
        brand: "FORMAL TROUSERS",
        name: "Men Brown Solid Formal Trousers",
        price: "৳ 2,499",
        originalPrice: "",
        discount: "",
        images: [
            "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=1000&auto=format&fit=crop",
        ],
        sizes: ["30", "32", "34", "36"],
        unavailableSizes: [],
        color: "brown",
    },
];

const NewArrivals = () => {
    const [products, setProducts] = useState(dummyProducts); // Start with dummy data
    const [loading, setLoading] = useState(true);

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

        return { mrp, finalPrice, discountLabel };
    };

    useEffect(() => {
        const fetchNewArrivals = async () => {
            try {
                const response = await getNewArrivalsFromServer();

                if (response.success && response.data && response.data.data && response.data.data.length > 0) {
                    let campaignDiscountsMap = {};
                    try {
                        const campaignsResponse = await getCampaigns();
                        if (campaignsResponse?.success && Array.isArray(campaignsResponse?.campaigns?.data)) {
                            const activeCampaigns = campaignsResponse.campaigns.data.filter((campaign) => campaign?.status === "active");
                            campaignDiscountsMap = buildCampaignDiscountMap(activeCampaigns);
                        }
                    } catch (campaignError) {
                        console.error("Error fetching campaigns for homepage new arrivals discount overlay:", campaignError);
                    }

                    // Transform API data to match ProductCard structure
                    const apiProducts = response.data.data.map(product => {
                        const { mrp, finalPrice, discountLabel } = getProductPricing(product, campaignDiscountsMap);
                        const { sizes, unavailableSizes } = getSizeDataFromVariants(product);

                        return {
                            id: product.id,
                            brand: product.brands?.name || product.category_name || "BRAND",
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
                        };
                    });

                    setProducts(apiProducts);
                }
            } catch (error) {
                console.error("Error fetching new arrivals:", error);
                // Keep dummy products on error
            } finally {
                setLoading(false);
            }
        };

        fetchNewArrivals();
    }, []);

    return (
        <section className="py-12 bg-white">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                        NEW ARRIVALS
                    </h2>
                    <Link href="/new-arrivals" className="text-sm font-semibold text-[var(--brand-royal-red)] hover:underline uppercase tracking-wide">
                        View All →
                    </Link>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {products.slice(0, 8).map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default NewArrivals;

