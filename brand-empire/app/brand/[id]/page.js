"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import FilterSidebar from "@/components/FilterSidebar";
import ProductCard from "@/components/ProductCard";
import CategoryTopFilters from "@/components/CategoryTopFilters";
import { getBrandwiseProducts, getTopBrands, filterProductsByAttributes, getCategoriesFromServer, getProductsBySubcategory, getProductsByChildCategory, prefetchCategoryTreeProducts, getCampaigns, getAttributes } from "@/lib/api";
import { readBrandPagesCache, writeBrandPage, trimBrandPages, mergeBrandCachedPages } from "@/utils/brandPrefetchCache";
import { readCategoryMetaList, writeCategoryMetaList } from "@/utils/categoryMetaCache";

export default function BrandPage() {
    const UI_PRODUCTS_PER_PAGE = 40;
    const API_PRODUCTS_PER_PAGE = 20;
    const BRAND_PREFETCH_API_PAGE_LIMIT = 4;

    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const brandId = params.id;
    const pageParam = searchParams.get("page");
    const parsedPage = Number.parseInt(pageParam || "1", 10);
    const pageFromUrl = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [localPage, setLocalPage] = useState(pageFromUrl);
    const [apiTotalPages, setApiTotalPages] = useState(1);
    const [loadedBrandPages, setLoadedBrandPages] = useState(1);
    const [brandPageSize, setBrandPageSize] = useState(API_PRODUCTS_PER_PAGE);
    const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [sortBy, setSortBy] = useState("recommended");
    const [mobileSortOpen, setMobileSortOpen] = useState(false);
    const sortDropdownRef = useRef(null);

    // Brand info
    const [brandName, setBrandName] = useState("");
    const [brandImage, setBrandImage] = useState(null);
    const [bannerImage, setBannerImage] = useState(null);

    const [filters, setFilters] = useState({
        categories: [],
        brands: [],
        priceRange: [0, 1000000],
        colors: [],
        sizes: [],
        discount: 0,
        attributeValues: [],
    });

    const [allCategoriesCatalog, setAllCategoriesCatalog] = useState([]);
    const [genderValueToCategoryName, setGenderValueToCategoryName] = useState({});
    const campaignMapRef = useRef({});

    const buildValidCategoryIdSet = (items) => {
        return new Set(
            items
                .map((p) => p.categoryId)
                .filter((id) => id !== null && id !== undefined && id !== "" && !Number.isNaN(Number(id)))
                .map((id) => String(id))
        );
    };

    const productCategoryIds = useMemo(() => buildValidCategoryIdSet(products), [products]);

    const normalizeName = (value) => String(value || "").trim().toLowerCase();

    const selectedGenderCategoryNames = useMemo(() => {
        return (filters.attributeValues || [])
            .map((valueId) => genderValueToCategoryName[String(valueId)])
            .filter(Boolean);
    }, [filters.attributeValues, genderValueToCategoryName]);

    const brandSubcategories = useMemo(() => {
        if (allCategoriesCatalog.length === 0) return [];

        // Fast path: if Gender top-filter is selected, immediately show matching root categories.
        if (selectedGenderCategoryNames.length > 0) {
            const hintedCategoryNameSet = new Set(selectedGenderCategoryNames.map(normalizeName));
            const hintedCategories = allCategoriesCatalog.filter((cat) =>
                hintedCategoryNameSet.has(normalizeName(cat.name))
            );

            if (hintedCategories.length > 0) {
                return hintedCategories
                    .map((cat) => ({
                        id: cat.category_id,
                        name: cat.name,
                        sub_category: cat.sub_category || []
                    }))
                    .filter((cat) => cat.sub_category.length > 0);
            }
        }

        if (productCategoryIds.size === 0) return [];

        return allCategoriesCatalog
            .filter((cat) => productCategoryIds.has(String(cat.category_id)))
            .map((cat) => ({
                id: cat.category_id,
                name: cat.name,
                sub_category: cat.sub_category || []
            }))
            .filter((cat) => cat.sub_category.length > 0);
    }, [productCategoryIds, allCategoriesCatalog, selectedGenderCategoryNames]);

    const childCategoryIdSet = useMemo(() => {
        const ids = new Set();
        allCategoriesCatalog.forEach((category) => {
            (category.sub_category || []).forEach((sub) => {
                (sub.child_categories || []).forEach((child) => ids.add(String(child.id)));
            });
        });
        return ids;
    }, [allCategoriesCatalog]);

    useEffect(() => {
        const cachedCategories = readCategoryMetaList();
        if (cachedCategories.length > 0) {
            setAllCategoriesCatalog(cachedCategories);
        }

        let cancelled = false;
        const fetchCategories = async () => {
            try {
                const response = await getCategoriesFromServer();
                if (!cancelled && response.success && Array.isArray(response.data)) {
                    writeCategoryMetaList(response.data);
                    setAllCategoriesCatalog(response.data);
                }
            } catch (error) {
                console.error("Error fetching category catalog for brand filter:", error);
            }
        };
        fetchCategories();
        return () => {
            cancelled = true;
        };
    }, []);

    const availableSizes = useMemo(() => {
        const sizes = products
            .flatMap(p => p.sizes || [])
            .filter((size, index, self) => self.indexOf(size) === index)
            .sort((a, b) => {
                const aNum = parseInt(a);
                const bNum = parseInt(b);
                if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                return a.localeCompare(b);
            });
        return sizes;
    }, [products]);

    useEffect(() => {
        let cancelled = false;
        const fetchGenderAttributeMap = async () => {
            try {
                const data = await getAttributes();
                const attributeList = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
                const genderAttribute = attributeList.find((attr) => normalizeName(attr?.name) === "gender");
                const values = Array.isArray(genderAttribute?.values) ? genderAttribute.values : [];
                const allowedCategoryNames = new Set(["men", "women", "kids", "girls"]);
                const nextMap = {};

                values.forEach((value) => {
                    const normalizedValue = normalizeName(value?.value);
                    if (value?.id && allowedCategoryNames.has(normalizedValue)) {
                        nextMap[String(value.id)] = normalizedValue;
                    }
                });

                if (!cancelled) {
                    setGenderValueToCategoryName(nextMap);
                }
            } catch (error) {
                console.error("Error fetching gender attribute map for brand sidebar:", error);
            }
        };

        fetchGenderAttributeMap();
        return () => {
            cancelled = true;
        };
    }, []);

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
        const fetchBrandInfo = async () => {
            try {
                const response = await getTopBrands();
                if (response.success && response.data) {
                    const brand = response.data.find(b => b.id == brandId);
                    if (brand) {
                        setBrandName(brand.name);
                        setBrandImage(brand.image_path);
                    }
                }
            } catch (error) {
                console.error("Error fetching brand info:", error);
            }
        };
        if (brandId) fetchBrandInfo();
    }, [brandId]);

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
                const discountedPrice = discountType === "amount" ? Math.max(0, mrp - discountValue) : Math.max(0, Math.round(mrp * (1 - discountValue / 100)));
                const savings = Math.max(0, mrp - discountedPrice);
                const existing = discountMap[productId];
                if (!existing || savings > existing.savings) {
                    discountMap[productId] = { discountType, discountValue, savings };
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
                discountLabel = `৳${rawDiscount} OFF`;
            } else {
                finalPrice = Math.round(mrp * (1 - rawDiscount / 100));
                discountLabel = `${rawDiscount}% OFF`;
            }
            if (finalPrice < 0) finalPrice = 0;
        }
        const campaignDiscount = campaignDiscountsMap[product.id];
        if (campaignDiscount && mrp > 0) {
            const campaignFinalPrice = campaignDiscount.discountType === "amount" ? Math.max(0, mrp - campaignDiscount.discountValue) : Math.max(0, Math.round(mrp * (1 - campaignDiscount.discountValue / 100)));
            if (rawDiscount <= 0 || campaignFinalPrice < finalPrice) {
                finalPrice = campaignFinalPrice;
                rawDiscount = campaignDiscount.discountValue;
                discountLabel = campaignDiscount.discountType === "amount" ? `৳${campaignDiscount.discountValue} OFF` : `${campaignDiscount.discountValue}% OFF`;
            }
        }
        return { mrp, finalPrice, discountLabel, rawDiscount };
    };

    const transformProduct = (product, campaignDiscountsMap = {}, currentBrandName) => {
        const { mrp, finalPrice, discountLabel, rawDiscount } = getProductPricing(product, campaignDiscountsMap);
        return {
            id: product.id,
            brand: product.brand_name || product.brands?.name || currentBrandName || "BRAND",
            name: product.name,
            price: `৳ ${finalPrice.toLocaleString()}`,
            originalPrice: discountLabel ? `৳ ${mrp.toLocaleString()}` : "",
            discount: discountLabel,
            images: product.image_paths && product.image_paths.length > 0 ? product.image_paths : [product.image_path, product.image_path1, product.image_path2].filter(Boolean),
            sizes: product.product_variants && product.product_variants.length > 0 ? product.product_variants.map(v => v.name) : ["S", "M", "L", "XL"],
            unavailableSizes: product.product_variants && product.product_variants.length > 0 ? product.product_variants.filter(v => v.quantity === 0).map(v => v.name) : [],
            color: product.color || "gray",
            colorCode: product.color_code || null,
            rating: product.review_summary?.average_rating || 0,
            reviews: product.review_summary?.total_reviews || 0,
            rawPrice: finalPrice,
            rawDiscount,
            categoryId: product.category_id ?? product.categoryId ?? product.category?.id ?? product.category?.category_id ?? product.categoryid ?? null,
            subcategoryId: product.sub_category_id ?? product.subcategory_id ?? product.sub_category?.id ?? product.subcategory?.id ?? null,
            childCategoryId: product.child_category_id ?? product.childcategory_id ?? product.child_category?.id ?? product.childCategory?.id ?? null
        };
    };

    const getPaginationMeta = (response) => {
        const responseData = response?.data;
        const lastPage = Number(
            response?.pagination?.last_page ||
            responseData?.last_page ||
            1
        );
        const perPage = Number(responseData?.per_page || 20);
        const safeLastPage = Number.isFinite(lastPage) && lastPage > 0 ? lastPage : 1;
        const safePerPage = Number.isFinite(perPage) && perPage > 0 ? perPage : 20;
        return { lastPage: safeLastPage, perPage: safePerPage };
    };

    const uniqueByProductId = (items) =>
        items.filter((item, index, self) => index === self.findIndex((t) => t.id === item.id));

    // Main background fetcher
    useEffect(() => {
        const fetchAllBrandProducts = async () => {
            try {
                const scope = JSON.stringify({
                    categories: [...(filters.categories || [])].map(String).sort(),
                    attributes: [...(filters.attributeValues || [])].map(String).sort(),
                });
                const cached = readBrandPagesCache(brandId, scope);
                if (cached?.pages && Object.keys(cached.pages).length > 0) {
                    const mergedCached = mergeBrandCachedPages(cached.pages);
                    setProducts(mergedCached);
                    setApiTotalPages(cached.totalPagesKnown || 1);
                    setLoadedBrandPages(Object.keys(cached.pages).length || 1);
                    if (!bannerImage && cached.bannerImage) setBannerImage(cached.bannerImage);
                    if (!brandName && cached.brandName) setBrandName(cached.brandName);
                    setLoading(false);
                } else {
                    setLoading(true);
                    setLoadedBrandPages(1);
                }

                let campaignMap = {};
                try {
                    const campaignsRes = await getCampaigns();
                    if (campaignsRes?.success && Array.isArray(campaignsRes?.campaigns?.data)) {
                        campaignMap = buildCampaignDiscountMap(campaignsRes.campaigns.data.filter(c => c.status === "active"));
                    }
                } catch (e) { console.error(e); }
                campaignMapRef.current = campaignMap;

                const selectedCategoryIds = filters.categories.map(String);
                const isSameBrandProduct = (p) => {
                    const apiBrandId = p.brand_id ?? p.brands?.id ?? p.brand?.id ?? null;
                    if (apiBrandId != null && String(apiBrandId) === String(brandId)) return true;
                    const apiBrandName = String(p.brand_name || p.brands?.name || p.brand?.name || "").toLowerCase();
                    const expectedBrandName = String(brandName || "").toLowerCase();
                    return expectedBrandName ? apiBrandName === expectedBrandName : false;
                };

                // Category selection should fetch by selected sub/child category, then keep only this brand.
                if (selectedCategoryIds.length > 0) {
                    const uniqueById = (items) =>
                        items.filter((item, index, self) => index === self.findIndex((t) => t.id === item.id));

                    // Show first page quickly for selected sub/child categories.
                    const selectedTargets = [];
                    let firstPageMerged = [];
                    for (const selectedId of selectedCategoryIds) {
                        const fetchFn = childCategoryIdSet.has(String(selectedId)) ? getProductsByChildCategory : getProductsBySubcategory;
                        const firstRes = await fetchFn(selectedId, 1);
                        if (!firstRes?.success || !firstRes?.data) continue;

                        const firstItems = Array.isArray(firstRes.data) ? firstRes.data : (firstRes.data.data || []);
                        const firstPageBrandItems = firstItems.filter(isSameBrandProduct).map((p) => transformProduct(p, campaignMap, brandName));
                        firstPageMerged = [...firstPageMerged, ...firstPageBrandItems];

                        selectedTargets.push({
                            id: selectedId,
                            fetchFn,
                            lastPage: firstRes.pagination?.last_page || 1,
                        });
                    }

                    const firstPageUnique = uniqueById(firstPageMerged);
                    setProducts(firstPageUnique);
                    setApiTotalPages(1);
                    setLoadedBrandPages(1);
                    writeBrandPage(brandId, scope, 1, firstPageUnique, { totalPagesKnown: 1, bannerImage, brandName });
                    setLoading(false);

                    // Then fetch remaining pages in background and append.
                    setIsBackgroundLoading(true);
                    let incrementalPage = 1;
                    for (const target of selectedTargets) {
                        for (let p = 2; p <= Math.min(target.lastPage, BRAND_PREFETCH_API_PAGE_LIMIT); p++) {
                            const pageRes = await target.fetchFn(target.id, p);
                            if (!pageRes?.success || !pageRes?.data) continue;

                            const pageItems = Array.isArray(pageRes.data) ? pageRes.data : (pageRes.data.data || []);
                            const pageBrandItems = pageItems
                                .filter(isSameBrandProduct)
                                .map((item) => transformProduct(item, campaignMap, brandName));
                            if (pageBrandItems.length === 0) continue;

                            incrementalPage += 1;
                            const nextList = uniqueById([...firstPageUnique, ...pageBrandItems]);
                            setProducts((prev) => uniqueById([...prev, ...pageBrandItems]));
                            setLoadedBrandPages(Math.max(1, p));
                            writeBrandPage(brandId, scope, incrementalPage, nextList, { totalPagesKnown: incrementalPage, bannerImage, brandName });
                        }
                    }
                    setIsBackgroundLoading(false);
                    return;
                }

                // 1. Fetch First Page
                let response;
                if (filters.attributeValues.length > 0) {
                    response = await filterProductsByAttributes(filters.attributeValues, 1, { brandId });
                } else {
                    response = await getBrandwiseProducts(brandId, 1);
                }

                if (response?.success && response?.data) {
                    const dataBatch = Array.isArray(response.data) ? response.data : (response.data.data || []);
                    const { lastPage, perPage } = getPaginationMeta(response);
                    setApiTotalPages(lastPage);
                    setBrandPageSize(perPage);

                    // Setup Banner/Brand Name from first batch
                    let resolvedBannerImage = bannerImage;
                    let resolvedBrandName = brandName;
                    if (dataBatch.length > 0 && dataBatch[0].brands) {
                        const b = dataBatch[0].brands;
                        if (b.banner_image) {
                            resolvedBannerImage = b.banner_image;
                            setBannerImage(b.banner_image);
                        }
                        if (!brandName && b.name) {
                            resolvedBrandName = b.name;
                            setBrandName(b.name);
                        }
                    }

                    const initialTransformed = dataBatch.map(p => transformProduct(p, campaignMap, brandName));
                    setProducts(initialTransformed);
                    setLoadedBrandPages(1);
                    const totalPageFirst = lastPage;
                    writeBrandPage(brandId, scope, 1, initialTransformed, {
                        totalPagesKnown: totalPageFirst,
                        bannerImage: resolvedBannerImage,
                        brandName: resolvedBrandName,
                    });
                    
                    setLoading(false);

                    // 2. Background fetch more API pages (non-blocking): first batch is already on screen.
                    setIsBackgroundLoading(true);
                    void (async () => {
                        try {
                            if (filters.attributeValues.length > 0) {
                                let mergedTransformed = [...initialTransformed];
                                const prefetchLastPage = Math.min(lastPage, BRAND_PREFETCH_API_PAGE_LIMIT);
                                for (let p = 2; p <= prefetchLastPage; p++) {
                                    const res = await filterProductsByAttributes(filters.attributeValues, p, { brandId });
                                    if (res?.success && res?.data) {
                                        const newItems = Array.isArray(res.data) ? res.data : (res.data.data || []);
                                        const transformed = newItems.map(item => transformProduct(item, campaignMap, brandName));
                                        mergedTransformed = [...mergedTransformed, ...transformed];
                                        setLoadedBrandPages(p);
                                    }
                                }
                                const unique = mergedTransformed.filter((item, index, self) =>
                                    index === self.findIndex((t) => t.id === item.id)
                                );
                                setProducts(unique);
                                if (totalPageFirst > 1) trimBrandPages(brandId, scope, prefetchLastPage);
                                writeBrandPage(brandId, scope, prefetchLastPage, unique, {
                                    totalPagesKnown: lastPage,
                                    bannerImage: resolvedBannerImage,
                                    brandName: resolvedBrandName,
                                });
                            } else {
                                let mergedTransformed = [...initialTransformed];
                                const prefetchLastPage = Math.min(lastPage, BRAND_PREFETCH_API_PAGE_LIMIT);
                                for (let p = 2; p <= prefetchLastPage; p++) {
                                    const res = await getBrandwiseProducts(brandId, p, perPage);
                                    if (!res?.success || !res?.data) break;
                                    const newItems = Array.isArray(res.data) ? res.data : (res.data.data || []);
                                    if (newItems.length === 0) break;

                                    const transformed = newItems.map(item => transformProduct(item, campaignMap, brandName));
                                    mergedTransformed = [...mergedTransformed, ...transformed];
                                    setLoadedBrandPages(p);
                                }
                                const unique = mergedTransformed.filter((item, index, self) =>
                                    index === self.findIndex((t) => t.id === item.id)
                                );
                                setProducts(unique);
                                writeBrandPage(brandId, scope, prefetchLastPage, unique, {
                                    totalPagesKnown: lastPage,
                                    bannerImage: resolvedBannerImage,
                                    brandName: resolvedBrandName,
                                });
                            }
                        } finally {
                            setIsBackgroundLoading(false);
                        }
                    })();
                } else {
                    setProducts([]);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Brand fetch error:", error);
                setLoading(false);
            }
        };

        if (brandId) {
            fetchAllBrandProducts();
        }
    }, [brandId, brandName, filters.attributeValues, filters.categories]);

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
        result = result.filter(p => p.rawPrice >= filters.priceRange[0] && p.rawPrice <= filters.priceRange[1]);
        if (filters.colors.length > 0) result = result.filter(p => filters.colors.includes(p.color));
        if (filters.sizes.length > 0) result = result.filter(p => p.sizes.some(size => filters.sizes.includes(size)));
        if (filters.discount > 0) result = result.filter(p => p.rawDiscount >= filters.discount);
        
        switch (sortBy) {
            case "price-low": result.sort((a, b) => a.rawPrice - b.rawPrice); break;
            case "price-high": result.sort((a, b) => b.rawPrice - a.rawPrice); break;
            case "newest": result.reverse(); break;
        }
        return result;
    }, [products, filters, sortBy]);

    const paginatedProducts = useMemo(() => {
        const start = (localPage - 1) * UI_PRODUCTS_PER_PAGE;
        return filteredAndSortedProducts.slice(start, start + UI_PRODUCTS_PER_PAGE);
    }, [filteredAndSortedProducts, localPage]);

    /** True while API pages for this UI page are still loading (avoids “No products” then a sudden grid). */
    const pageSlicePending = useMemo(() => {
        if (loading) return false;
        if (paginatedProducts.length > 0) return false;
        if ((filters.categories || []).length > 0) return false;
        const requiredApiPages = Math.ceil((localPage * UI_PRODUCTS_PER_PAGE) / brandPageSize);
        const pagesStillAvailable = Math.min(requiredApiPages, apiTotalPages);
        return loadedBrandPages < pagesStillAvailable;
    }, [
        loading,
        paginatedProducts.length,
        localPage,
        brandPageSize,
        apiTotalPages,
        loadedBrandPages,
        filters.categories?.length,
    ]);

    const totalPages = useMemo(
        () => Math.max(
            Math.ceil((apiTotalPages * brandPageSize) / UI_PRODUCTS_PER_PAGE),
            Math.ceil(filteredAndSortedProducts.length / UI_PRODUCTS_PER_PAGE),
            1
        ),
        [apiTotalPages, brandPageSize, filteredAndSortedProducts]
    );

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

    const ensureBrandPageLoaded = async (targetPage) => {
        const requiredApiPages = Math.ceil((targetPage * UI_PRODUCTS_PER_PAGE) / brandPageSize);
        if (requiredApiPages <= loadedBrandPages) return;
        if (!brandId) return;

        const currentBrandName = brandName;
        let currentLoadedPage = loadedBrandPages;

        while (currentLoadedPage < requiredApiPages) {
            const nextPage = currentLoadedPage + 1;
            let res;
            if (filters.attributeValues.length > 0) {
                res = await filterProductsByAttributes(filters.attributeValues, nextPage, { brandId });
            } else {
                res = await getBrandwiseProducts(brandId, nextPage, brandPageSize);
            }
            if (!res?.success || !res?.data) break;

            const pageItems = Array.isArray(res.data) ? res.data : (res.data.data || []);
            if (pageItems.length === 0) break;

            const transformed = pageItems.map((item) => transformProduct(item, campaignMapRef.current, currentBrandName));
            setProducts((prev) => uniqueByProductId([...prev, ...transformed]));
            setLoadedBrandPages(nextPage);
            writeBrandPage(
                brandId,
                JSON.stringify({
                    categories: [...(filters.categories || [])].map(String).sort(),
                    attributes: [...(filters.attributeValues || [])].map(String).sort(),
                }),
                nextPage,
                transformed,
                { totalPagesKnown: apiTotalPages, bannerImage, brandName: currentBrandName }
            );
            currentLoadedPage = nextPage;
        }
    };

    // Deep-linked ?page=N (UI shows 40 per page, API returns 20): prefetch only loads 4 API pages by default,
    // so e.g. page=3 needs API pages 1–6 — fetch the gap when the URL asks for a slice we have not loaded yet.
    useEffect(() => {
        if (!brandId || loading) return;
        if ((filters.categories || []).length > 0) return;

        (async () => {
            await ensureBrandPageLoaded(pageFromUrl);
        })();
    }, [
        brandId,
        loading,
        pageFromUrl,
        brandPageSize,
        loadedBrandPages,
        filters.categories?.length,
        JSON.stringify([...(filters.attributeValues || [])].map(String).sort()),
    ]);

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({ ...prev, [filterType]: value }));
        setLocalPage(1);
        syncPageInUrl(1);
    };

    const handleClearAll = () => {
        setFilters({ categories: [], brands: [], priceRange: [0, 1000000], colors: [], sizes: [], discount: 0, attributeValues: [] });
        setLocalPage(1);
        syncPageInUrl(1);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {bannerImage && (
                <div className="w-full h-[200px] md:h-[300px] relative">
                    <Image src={bannerImage} alt={brandName} fill className="object-cover" />
                </div>
            )}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-2 md:py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 flex-wrap">
                            <Link href="/" className="hover:text-[var(--brand-royal-red)]">Home</Link>
                            <span>/</span>
                            <span className="text-gray-900 font-medium">{brandName || "Brand"}</span>
                            <span className="text-gray-400 ml-1">- {loading ? "..." : filteredAndSortedProducts.length} items</span>
                        </div>
                        <div className="flex items-center gap-2 lg:hidden">
                            <button onClick={() => setMobileFiltersOpen(true)} className="px-3 py-1.5 border border-gray-200 rounded-full bg-white text-xs font-medium">Filter</button>
                            <button onClick={() => setMobileSortOpen(!mobileSortOpen)} className="px-3 py-1.5 border border-gray-200 rounded-full bg-white text-xs font-medium">Sort</button>
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
                            hideBrandFilter={true}
                            brandSubcategories={brandSubcategories}
                        />
                    </div>
                    <div className="flex-1">
                        <div className="hidden md:flex items-center justify-between mb-6 gap-4 border-b border-gray-200 pb-4">
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
                                />
                            </div>
                            <div className="flex-shrink-0">
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm">
                                    <option value="recommended">Recommended</option>
                                    <option value="newest">Newest First</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                </select>
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
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
                                {paginatedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-gray-500">
                                <p className="text-lg">No products found.</p>
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
                                        window.scrollTo({ top: 0 });
                                    }}
                                    disabled={localPage === 1}
                                    className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <div className="flex flex-col items-center">
                                    <span className="text-gray-700 font-medium">Page {localPage} of {totalPages}</span>
                                    {(isBackgroundLoading || pageSlicePending) && (
                                        <span className="text-[10px] text-[var(--brand-royal-red)] animate-pulse uppercase font-bold">Loading more…</span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextPage = Math.min(totalPages, localPage + 1);
                                        void ensureBrandPageLoaded(nextPage);
                                        setLocalPage(nextPage);
                                        syncPageInUrl(nextPage);
                                        window.scrollTo({ top: 0 });
                                    }}
                                    disabled={localPage >= totalPages}
                                    className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
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
                    <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto pb-20">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-bold">Filters</h2>
                            <button onClick={() => setMobileFiltersOpen(false)}>X</button>
                        </div>
                        <FilterSidebar
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearAll={handleClearAll}
                            products={products}
                            hideBrandFilter={true}
                            brandSubcategories={brandSubcategories}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
