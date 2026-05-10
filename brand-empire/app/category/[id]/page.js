"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import FilterSidebar from "@/components/FilterSidebar";
import ProductCard from "@/components/ProductCard";
import CategoryTopFilters from "@/components/CategoryTopFilters";
import { getProducts, getProductsBySubcategory, getProductsByChildCategory, getCategoriesFromServer, getCategoryWiseProducts, filterProductsByAttributes, getAttributes, getCampaigns, prefetchCategoryTreeProducts } from "@/lib/api";
import { readCategoryMetaBySlug, writeCategoryMetaList } from "@/utils/categoryMetaCache";
import { readCategoryPagesCache, writeCategoryPage, trimCategoryPages } from "@/utils/categoryPrefetchCache";

export default function CategoryPage() {
    const UI_PRODUCTS_PER_PAGE = 40;
    const API_PRODUCTS_PER_PAGE = 20;
    const CATEGORY_PREFETCH_API_PAGE_LIMIT = 4;

    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const categoryId = params.id;
    const subcategoryId = searchParams.get('subcategory');
    const childId = searchParams.get('child');
    const pageParam = searchParams.get("page");
    const parsedPage = Number.parseInt(pageParam || "1", 10);
    const pageFromUrl = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [localPage, setLocalPage] = useState(pageFromUrl);
    const [apiTotalPages, setApiTotalPages] = useState(1);
    const [loadedCategoryPages, setLoadedCategoryPages] = useState(1);
    const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [sortBy, setSortBy] = useState("recommended");
    const [mobileSortOpen, setMobileSortOpen] = useState(false);
    const sortDropdownRef = useRef(null);
    const campaignMapRef = useRef({});

    // Breadcrumb data
    const [categoryName, setCategoryName] = useState("");
    const [subcategoryName, setSubcategoryName] = useState("");
    const [currentCategoryData, setCurrentCategoryData] = useState(null);

    const [childName, setChildName] = useState("");
    const [bannerImage, setBannerImage] = useState(null);
    const [attributes, setAttributes] = useState([]); // Dynamic attributes for filters

    const [filters, setFilters] = useState({
        categories: [],
        brands: [],
        priceRange: [0, 1000000], // High max to not filter out expensive products by default
        colors: [],
        sizes: [],
        discount: 0,
        attributeValues: [], // Selected attribute value IDs for top filters
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

    // Fetch attributes for filters
    useEffect(() => {
        const fetchAttributes = async () => {
            try {
                const data = await getAttributes();
                let attrArray = [];
                if (Array.isArray(data)) {
                    attrArray = data;
                } else if (data.success && Array.isArray(data.data)) {
                    attrArray = data.data;
                }
                const filtered = attrArray
                    .filter(attr => attr.status === 'active')
                    .map(attr => ({
                        ...attr,
                        values: (attr.values || []).filter(v => v.status === 'active')
                    }))
                    .filter(attr => attr.values.length > 0);
                setAttributes(filtered);
            } catch (error) {
                console.error("Error fetching attributes:", error);
            }
        };
        fetchAttributes();
    }, []);

    // Fetch category names and data for filters
    useEffect(() => {
        const fetchCategoryNames = async () => {
            const cachedMeta = readCategoryMetaBySlug(categoryId);
            if (cachedMeta) {
                setCategoryName(cachedMeta.name || "");
                setCurrentCategoryData(cachedMeta);
                let cachedBanner = cachedMeta.banner || null;
                if (subcategoryId && cachedMeta.sub_category) {
                    const subcat = cachedMeta.sub_category.find((s) => String(s.id) === String(subcategoryId));
                    if (subcat) {
                        setSubcategoryName(subcat.name || "");
                        cachedBanner = subcat.banner || subcat.banners?.[0] || cachedBanner;
                        if (childId && subcat.child_categories) {
                            const child = subcat.child_categories.find((c) => String(c.id) === String(childId));
                            if (child) {
                                setChildName(child.name || "");
                                cachedBanner = child.banner || cachedBanner;
                            }
                        }
                    }
                }
                setBannerImage(cachedBanner);
            }

            try {
                const response = await getCategoriesFromServer();
                if (response.success && response.data) {
                    writeCategoryMetaList(response.data);
                    const category = response.data.find(c => c.category_id == categoryId);
                    if (category) {
                        setCategoryName(category.name);
                        setCurrentCategoryData(category);
                        let currentBanner = category.banner;

                        if (subcategoryId && category.sub_category) {
                            const subcat = category.sub_category.find(s => s.id == subcategoryId);
                            if (subcat) {
                                setSubcategoryName(subcat.name);
                                if (subcat.banner) {
                                    currentBanner = subcat.banner;
                                } else if (subcat.banners && subcat.banners.length > 0) {
                                    currentBanner = subcat.banners[0];
                                }

                                if (childId && subcat.child_categories) {
                                    const child = subcat.child_categories.find(c => c.id == childId);
                                    if (child) {
                                        setChildName(child.name);
                                        if (child.banner) {
                                            currentBanner = child.banner;
                                        }
                                    }
                                }
                            }
                        }
                        setBannerImage(currentBanner);
                    }
                }
            } catch (error) {
                console.error("Error fetching category names:", error);
            }
        };

        if (categoryId) {
            fetchCategoryNames();
        }
    }, [categoryId, subcategoryId, childId]);

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

    const transformProduct = (product, campaignDiscountsMap = {}) => {
        const mrp = product.retails_price || 0;
        let finalPrice = mrp;
        let discountLabel = "";
        let rawDiscount = product.discount || 0;

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

        const campaignDiscount = campaignDiscountsMap[product.id];
        if (campaignDiscount && mrp > 0) {
            const campaignFinalPrice = campaignDiscount.discountType === "amount"
                ? Math.max(0, mrp - campaignDiscount.discountValue)
                : Math.max(0, Math.round(mrp * (1 - campaignDiscount.discountValue / 100)));

            if (!product.discount || campaignFinalPrice < finalPrice) {
                finalPrice = campaignFinalPrice;
                rawDiscount = campaignDiscount.discountValue;
                discountLabel = campaignDiscount.discountType === "amount"
                    ? `৳${campaignDiscount.discountValue} OFF`
                    : `${campaignDiscount.discountValue}% OFF`;
            }
        }

        return {
            id: product.id,
            brand: product.brand_name || product.brands?.name || "BRAND",
            name: product.name,
            price: `৳ ${finalPrice.toLocaleString()}`,
            originalPrice: discountLabel ? `৳ ${mrp.toLocaleString()}` : "",
            discount: discountLabel,
            images: product.image_paths && product.image_paths.length > 0
                ? product.image_paths
                : [product.image_path, product.image_path1, product.image_path2].filter(Boolean),
            sizes: product.product_variants && product.product_variants.length > 0
                ? product.product_variants.map(v => v.name)
                : ["S", "M", "L", "XL"],
            unavailableSizes: product.product_variants && product.product_variants.length > 0
                ? product.product_variants.filter(v => v.quantity === 0).map(v => v.name)
                : [],
            color: product.color ||
                (product.name.toLowerCase().includes("black") ? "black" :
                    product.name.toLowerCase().includes("blue") ? "blue" :
                        product.name.toLowerCase().includes("white") ? "white" : "gray"),
            colorCode: product.color_code || product.colorCode || product.colour_code || null,
            rating: product.review_summary?.average_rating || 0,
            reviews: product.review_summary?.total_reviews || 0,
            rawPrice: finalPrice,
            rawDiscount,
            categoryId: product.category_id ?? product.categoryId ?? null,
            subcategoryId: product.sub_category_id ?? product.subcategory_id ?? product.sub_category?.id ?? product.subcategory?.id ?? null,
            childCategoryId: product.child_category_id ?? product.childcategory_id ?? product.child_category?.id ?? product.childCategory?.id ?? null,
        };
    };

    // Background fetch products
    useEffect(() => {
        const getDataBatch = (res) => {
            if (Array.isArray(res?.data)) return res.data;
            if (Array.isArray(res?.data?.data)) return res.data.data;
            return [];
        };

        const getLastPage = (res) => {
            const fromPagination = Number(res?.pagination?.last_page || 0);
            const fromData = Number(res?.data?.last_page || 0);
            if (fromPagination > 0) return fromPagination;
            if (fromData > 0) return fromData;
            return 1;
        };

        const fetchProducts = async () => {
            try {
                const cacheScope = childId
                    ? `${subcategoryId || "root"}::child:${childId}`
                    : (subcategoryId || null);

                setLoadedCategoryPages(1);

                const mergeCachedPages = (cachedPages) => {
                    const orderedKeys = Object.keys(cachedPages || {})
                        .map(Number)
                        .filter((n) => !Number.isNaN(n))
                        .sort((a, b) => a - b);
                    const merged = [];
                    orderedKeys.forEach((key) => {
                        const items = cachedPages[String(key)] || [];
                        merged.push(...items);
                    });
                    return merged.filter((item, index, self) =>
                        index === self.findIndex((t) => t.id === item.id)
                    );
                };

                const cached = readCategoryPagesCache(categoryId, cacheScope);
                if (cached?.pages && Object.keys(cached.pages).length > 0) {
                    setProducts(mergeCachedPages(cached.pages));
                    setApiTotalPages(cached.totalPagesKnown || 1);
                    const pageNums = Object.keys(cached.pages)
                        .map(Number)
                        .filter((n) => !Number.isNaN(n));
                    setLoadedCategoryPages(pageNums.length ? Math.max(...pageNums) : 1);
                    setLoading(false);
                } else {
                    setLoading(true);
                }

                const campaignMap = await getActiveCampaignsMap();
                campaignMapRef.current = campaignMap;
                const selectedCategoryIds = filters.categories || [];

                // Multi-select category filter should drive API fetching.
                // If URL has subcategory => selected ids are child categories.
                const fetchAllPagesForTarget = async (targetId, useChildFetch = false) => {
                    const firstRes = useChildFetch
                        ? await getProductsByChildCategory(targetId, 1)
                        : await getProductsBySubcategory(targetId, 1);
                    if (!firstRes?.success || !firstRes?.data) return [];

                    const firstItems = getDataBatch(firstRes);
                    let merged = firstItems.map((p) => transformProduct(p, campaignMap));

                    const lastPage = getLastPage(firstRes);
                    for (let p = 2; p <= Math.min(lastPage, CATEGORY_PREFETCH_API_PAGE_LIMIT); p++) {
                        const pageRes = useChildFetch
                            ? await getProductsByChildCategory(targetId, p)
                            : await getProductsBySubcategory(targetId, p);
                        if (pageRes?.success && pageRes?.data) {
                            const pageItems = getDataBatch(pageRes);
                            merged = [...merged, ...pageItems.map((item) => transformProduct(item, campaignMap))];
                        }
                    }
                    return merged;
                };

                if (selectedCategoryIds.length > 0) {
                    const useChildFetch = Boolean(subcategoryId);
                    const collected = [];
                    for (const id of selectedCategoryIds) {
                        const items = await fetchAllPagesForTarget(id, useChildFetch);
                        collected.push(...items);
                    }
                    const unique = collected.filter((item, index, self) =>
                        index === self.findIndex((t) => t.id === item.id)
                    );
                    setApiTotalPages(1);
                    setProducts(unique);
                    setIsBackgroundLoading(false);
                    setLoading(false);
                    return;
                }

                // Default route-driven fetching (no sidebar category selection)
                let response;
                if (filters.attributeValues.length > 0) {
                    response = await filterProductsByAttributes(filters.attributeValues, 1, { categoryId });
                } else if (childId) {
                    response = await getProductsByChildCategory(childId, 1);
                } else if (subcategoryId) {
                    response = await getProductsBySubcategory(subcategoryId, 1);
                } else {
                    response = await getCategoryWiseProducts(categoryId, 1);
                }

                if (!response?.success || !response?.data) {
                    setProducts([]);
                    setLoadedCategoryPages(1);
                    setLoading(false);
                    return;
                }

                const dataBatch = getDataBatch(response);
                setApiTotalPages(getLastPage(response));

                const initialTransformed = dataBatch.map((p) => transformProduct(p, campaignMap));
                setProducts(initialTransformed);
                writeCategoryPage(categoryId, cacheScope, 1, initialTransformed, null, getLastPage(response));
                setLoading(false); // Show first page immediately

                // 2. Background Fetch remaining pages if any
                const totalPages = getLastPage(response);
                if (totalPages > 1) {
                    setIsBackgroundLoading(true);
                    void (async () => {
                        try {
                            await fetchAllPages(
                                Math.min(totalPages, CATEGORY_PREFETCH_API_PAGE_LIMIT),
                                campaignMap,
                                initialTransformed,
                                cacheScope,
                                totalPages
                            );
                        } finally {
                            setIsBackgroundLoading(false);
                        }
                    })();
                } else {
                    setLoadedCategoryPages(1);
                    setIsBackgroundLoading(false);
                }

                // If API now reports fewer pages than cache, trim stale pages.
                if (cached?.totalPagesKnown && cached.totalPagesKnown > totalPages) {
                    trimCategoryPages(categoryId, cacheScope, totalPages);
                }
            } catch (error) {
                console.error("Error fetching products:", error);
                setLoadedCategoryPages(1);
                setLoading(false);
            }
        };

        const getActiveCampaignsMap = async () => {
            try {
                const campaignsResponse = await getCampaigns();
                if (campaignsResponse?.success && Array.isArray(campaignsResponse?.campaigns?.data)) {
                    const activeCampaigns = campaignsResponse.campaigns.data.filter((campaign) => campaign?.status === "active");
                    return buildCampaignDiscountMap(activeCampaigns);
                }
            } catch (err) {
                console.error("Campaign fetch error:", err);
            }
            return {};
        };

        const fetchAllPages = async (
            prefetchUpToApiPage,
            campaignMap,
            baseProducts = [],
            cacheScope = null,
            knownTotalPages = 1
        ) => {
            let merged = [...baseProducts];
            for (let p = 2; p <= prefetchUpToApiPage; p++) {
                try {
                    let res;
                    if (filters.attributeValues.length > 0) {
                        res = await filterProductsByAttributes(filters.attributeValues, p, { categoryId });
                    } else if (childId) {
                        res = await getProductsByChildCategory(childId, p);
                    } else if (subcategoryId) {
                        res = await getProductsBySubcategory(subcategoryId, p);
                    } else {
                        res = await getCategoryWiseProducts(categoryId, p);
                    }

                    if (res?.success && res?.data) {
                        const newItems = getDataBatch(res);
                        const transformed = newItems.map(item => transformProduct(item, campaignMap));
                        merged = [...merged, ...transformed];
                        const uniqueProgressive = merged.filter((item, index, self) =>
                            index === self.findIndex((t) => t.id === item.id)
                        );
                        setProducts(uniqueProgressive);
                        writeCategoryPage(categoryId, cacheScope, p, transformed, null, knownTotalPages);
                    }
                } catch (err) {
                    console.error(`Error fetching page ${p}:`, err);
                }
            }
            const unique = merged.filter((item, index, self) =>
                index === self.findIndex((t) => t.id === item.id)
            );
            setProducts(unique);
            setLoadedCategoryPages(prefetchUpToApiPage);
        };

        if (categoryId) {
            fetchProducts();
        }
    }, [categoryId, subcategoryId, childId, filters.attributeValues, filters.categories]);

    const filteredAndSortedProducts = useMemo(() => {
        let result = [...products];

        const hasAnyCategoryIds = result.some((p) =>
            p.categoryId != null || p.subcategoryId != null || p.childCategoryId != null
        );

        if (filters.categories.length > 0 && hasAnyCategoryIds) {
            const selectedCategoryIds = filters.categories.map(String);
            result = result.filter((p) =>
                selectedCategoryIds.includes(String(p.categoryId)) ||
                selectedCategoryIds.includes(String(p.subcategoryId)) ||
                selectedCategoryIds.includes(String(p.childCategoryId))
            );
        }

        if (filters.brands.length > 0) {
            result = result.filter(p => filters.brands.includes(p.brand));
        }

        result = result.filter(p =>
            p.rawPrice >= filters.priceRange[0] &&
            p.rawPrice <= filters.priceRange[1]
        );

        if (filters.colors.length > 0) {
            result = result.filter(p => filters.colors.includes(p.color));
        }

        if (filters.sizes.length > 0) {
            result = result.filter(p =>
                p.sizes.some(size => filters.sizes.includes(size))
            );
        }

        if (filters.discount > 0) {
            result = result.filter(p => p.rawDiscount >= filters.discount);
        }

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

    const paginatedProducts = useMemo(() => {
        const startIndex = (localPage - 1) * UI_PRODUCTS_PER_PAGE;
        return filteredAndSortedProducts.slice(startIndex, startIndex + UI_PRODUCTS_PER_PAGE);
    }, [filteredAndSortedProducts, localPage]);

    const pageSlicePending = useMemo(() => {
        if (loading) return false;
        if (paginatedProducts.length > 0) return false;
        if ((filters.categories || []).length > 0) return false;
        const requiredApiPages = Math.ceil((localPage * UI_PRODUCTS_PER_PAGE) / API_PRODUCTS_PER_PAGE);
        const pagesStillAvailable = Math.min(requiredApiPages, apiTotalPages);
        return loadedCategoryPages < pagesStillAvailable;
    }, [
        loading,
        paginatedProducts.length,
        localPage,
        apiTotalPages,
        loadedCategoryPages,
        filters.categories?.length,
    ]);

    const totalPages = useMemo(() => {
        return Math.max(
            Math.ceil((apiTotalPages * API_PRODUCTS_PER_PAGE) / UI_PRODUCTS_PER_PAGE),
            Math.ceil(filteredAndSortedProducts.length / UI_PRODUCTS_PER_PAGE),
            1
        );
    }, [filteredAndSortedProducts, apiTotalPages]);

    useEffect(() => {
        setLocalPage(pageFromUrl);
    }, [pageFromUrl]);

    const syncPageInUrl = (nextPage) => {
        const params = new URLSearchParams(searchParams.toString());
        if (nextPage <= 1) {
            params.delete("page");
        } else {
            params.set("page", String(nextPage));
        }
        router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
    };

    const ensureCategoryPageLoaded = async (targetUiPage) => {
        const requiredApiPages = Math.ceil((targetUiPage * UI_PRODUCTS_PER_PAGE) / API_PRODUCTS_PER_PAGE);
        if (requiredApiPages <= loadedCategoryPages) return;
        if (!categoryId) return;
        if ((filters.categories || []).length > 0) return;

        const cacheScope = childId
            ? `${subcategoryId || "root"}::child:${childId}`
            : (subcategoryId || null);

        let current = loadedCategoryPages;
        const campaignMap = campaignMapRef.current;

        const batchFromResponse = (res) => {
            if (Array.isArray(res?.data)) return res.data;
            if (Array.isArray(res?.data?.data)) return res.data.data;
            return [];
        };

        while (current < requiredApiPages) {
            const nextPage = current + 1;
            if (nextPage > apiTotalPages) break;

            let res;
            if (filters.attributeValues.length > 0) {
                res = await filterProductsByAttributes(filters.attributeValues, nextPage, { categoryId });
            } else if (childId) {
                res = await getProductsByChildCategory(childId, nextPage);
            } else if (subcategoryId) {
                res = await getProductsBySubcategory(subcategoryId, nextPage);
            } else {
                res = await getCategoryWiseProducts(categoryId, nextPage);
            }
            if (!res?.success || !res?.data) break;
            const pageItems = batchFromResponse(res);
            if (pageItems.length === 0) break;

            const transformed = pageItems.map((item) => transformProduct(item, campaignMap));
            setProducts((prev) =>
                [...prev, ...transformed].filter((item, index, self) =>
                    index === self.findIndex((t) => t.id === item.id)
                )
            );
            setLoadedCategoryPages(nextPage);
            writeCategoryPage(categoryId, cacheScope, nextPage, transformed, null, apiTotalPages);
            current = nextPage;
        }
    };

    useEffect(() => {
        if (!categoryId || loading) return;
        if ((filters.categories || []).length > 0) return;

        (async () => {
            await ensureCategoryPageLoaded(pageFromUrl);
        })();
    }, [
        categoryId,
        loading,
        pageFromUrl,
        apiTotalPages,
        loadedCategoryPages,
        subcategoryId,
        childId,
        filters.categories?.length,
        JSON.stringify([...(filters.attributeValues || [])].map(String).sort()),
    ]);

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
        setLocalPage(1);
        syncPageInUrl(1);
    };

    const handleClearAll = () => {
        setFilters({
            categories: [],
            brands: [],
            priceRange: [0, 1000000],
            colors: [],
            sizes: [],
            discount: 0,
            attributeValues: [],
        });
        setLocalPage(1);
        syncPageInUrl(1);
    };

    const handleSubCategoryChange = (subId) => {
        const params = new URLSearchParams(searchParams);
        if (subId) {
            params.set('subcategory', subId);
        } else {
            params.delete('subcategory');
        }
        params.delete('child');
        params.delete('page');
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleChildCategoryChange = (childId) => {
        const params = new URLSearchParams(searchParams);
        if (childId) {
            params.set('child', childId);
        } else {
            params.delete('child');
        }
        params.delete('page');
        router.push(`${pathname}?${params.toString()}`);
    };

    const subCategories = currentCategoryData?.sub_category || [];
    const nestedCategoryTree = currentCategoryData
        ? [{
            id: currentCategoryData.category_id,
            name: currentCategoryData.name,
            sub_category: currentCategoryData.sub_category || [],
        }]
        : [];
    const childCategories = subcategoryId
        ? currentCategoryData?.sub_category?.find(s => s.id == subcategoryId)?.child_categories || []
        : [];

    useEffect(() => {
        if (!currentCategoryData?.sub_category?.length) return;
        const subcategoryIds = currentCategoryData.sub_category.map((sub) => sub.id);
        const childCategoryIds = currentCategoryData.sub_category.flatMap((sub) =>
            (sub.child_categories || []).map((child) => child.id)
        );
        prefetchCategoryTreeProducts({
            subcategoryIds,
            childCategoryIds,
            includeAllPages: true
        }).catch((error) => console.error("Category prefetch failed:", error));
    }, [currentCategoryData]);

    return (
        <div className="min-h-screen bg-gray-50 pt-0 md:pt-4">
            <div className="w-full h-[200px] md:h-[300px] relative bg-gray-100 overflow-hidden">
                {bannerImage ? (
                    <Image src={bannerImage} alt={categoryName || "Category Banner"} fill className="object-cover" />
                ) : loading ? (
                    <div className="w-full h-full animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-gray-50 to-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm md:text-lg font-semibold">{categoryName || "Category"}</span>
                    </div>
                )}
            </div>
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-2 md:py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 flex-wrap">
                            <a href="/" className="hover:text-[var(--brand-royal-red)]">Home</a>
                            <span>/</span>
                            {categoryName && (
                                <>
                                    <a href={`/category/${categoryId}`} className={`hover:text-[var(--brand-royal-red)] ${!subcategoryName ? 'text-gray-900 font-medium' : ''}`}>
                                        {categoryName}
                                    </a>
                                    {subcategoryName && (
                                        <>
                                            <span>/</span>
                                            <a href={`/category/${categoryId}?subcategory=${subcategoryId}`} className={`hover:text-[var(--brand-royal-red)] ${!childName ? 'text-gray-900 font-medium' : ''}`}>
                                                {subcategoryName}
                                            </a>
                                        </>
                                    )}
                                    {childName && (
                                        <>
                                            <span>/</span>
                                            <span className="text-gray-900 font-medium">{childName}</span>
                                        </>
                                    )}
                                </>
                            )}
                            <span className="text-gray-400 ml-1">
                                - {loading ? "..." : filteredAndSortedProducts.length} items
                            </span>
                        </div>
                        <div className="flex items-center gap-2 lg:hidden">
                            <button onClick={() => setMobileFiltersOpen(true)} className="flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-200 rounded-full hover:bg-gray-50 bg-white text-xs font-medium transition-colors">
                                <span>Filter</span>
                            </button>
                            <div className="relative" ref={sortDropdownRef}>
                                <button onClick={() => setMobileSortOpen(!mobileSortOpen)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap bg-white text-gray-700 border-gray-200 hover:bg-gray-50">
                                    <span>
                                        {sortBy === "recommended" ? "Sort" : sortBy === "newest" ? "New" : sortBy === "price-low" ? "Low" : sortBy === "price-high" ? "High" : "Sort"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-2 md:py-6">
                <div className="flex gap-6">
                    <div className="hidden lg:block w-64 flex-shrink-0">
                        <FilterSidebar
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearAll={handleClearAll}
                            products={products}
                            brandSubcategories={nestedCategoryTree}
                            hideCategoryRoot={true}
                            categories={subcategoryId ? childCategories : subCategories}
                        />
                    </div>
                    <div className="flex-1">
                        <div className="hidden md:flex items-start justify-between mb-6 gap-4 border-b border-gray-200 pb-4">
                            <div className="flex-1">
                                <CategoryTopFilters
                                    availableSizes={availableSizes}
                                    selectedSizes={filters.sizes}
                                    onSizeChange={(size) => {
                                        const newSizes = filters.sizes.includes(size) ? filters.sizes.filter(s => s !== size) : [...filters.sizes, size];
                                        handleFilterChange('sizes', newSizes);
                                    }}
                                    selectedAttributeValues={filters.attributeValues}
                                    onAttributeChange={(values) => handleFilterChange('attributeValues', values)}
                                    className="ml-0"
                                    hiddenAttributeNames={[categoryName, subcategoryName, childName].filter(Boolean)}
                                />
                            </div>
                            <div className="flex-shrink-0">
                                <div className="relative">
                                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-royal-red)] appearance-none font-medium pr-8">
                                        <option value="recommended">Recommended</option>
                                        <option value="newest">Newest First</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        {loading || pageSlicePending ? (
                            <div className="flex flex-col justify-center items-center py-20 gap-3">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-royal-red)]"></div>
                                {pageSlicePending && !loading && (
                                    <p className="text-sm text-gray-500">Loading products for this page…</p>
                                )}
                            </div>
                        ) : paginatedProducts.length > 0 ? (
                            <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
                                {paginatedProducts.map((product) => <ProductCard key={product.id} product={product} categoryId={categoryId} />)}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-gray-500 text-lg">No products found matching your filters.</p>
                                <button onClick={handleClearAll} className="mt-4 text-[var(--brand-royal-red)] font-semibold hover:underline">Clear all filters</button>
                            </div>
                        )}
                        {totalPages > 1 && (
                            <div className="relative z-[65] mt-12 mb-2 flex justify-center items-center gap-4 lg:z-auto">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextPage = Math.max(1, localPage - 1);
                                        setLocalPage(nextPage);
                                        syncPageInUrl(nextPage);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={localPage === 1}
                                    className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <div className="flex flex-col items-center">
                                    <span className="text-gray-700 font-medium">Page {localPage} of {totalPages}</span>
                                    {(isBackgroundLoading || pageSlicePending) && (
                                        <span className="text-[10px] text-[var(--brand-royal-red)] animate-pulse uppercase font-bold tracking-tight">Loading more…</span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextPage = Math.min(totalPages, localPage + 1);
                                        void ensureCategoryPageLoaded(nextPage);
                                        setLocalPage(nextPage);
                                        syncPageInUrl(nextPage);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={localPage >= totalPages}
                                    className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {mobileFiltersOpen && (
                <div className="fixed inset-0 z-[70] lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)}></div>
                    <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto pb-32">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-bold">Filters</h2>
                            <button onClick={() => setMobileFiltersOpen(false)}>X</button>
                        </div>
                        <FilterSidebar
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearAll={handleClearAll}
                            products={products}
                            brandSubcategories={nestedCategoryTree}
                            hideCategoryRoot={true}
                            categories={subcategoryId ? childCategories : subCategories}
                            attributes={attributes}
                            selectedAttributeValues={filters.attributeValues}
                            onAttributeChange={(values) => handleFilterChange('attributeValues', values)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
