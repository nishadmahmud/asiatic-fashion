"use client";

import { getCategoryWiseProducts, getProductsBySubcategory } from "@/lib/api";

const CATEGORY_CACHE_TTL_MS = 5 * 60 * 1000;
const SESSION_KEY = "brand_empire_category_pages_cache_v1";
const inMemoryCache = new Map();
const inFlightMap = new Map();

const getNow = () => Date.now();
const isBrowser = () => typeof window !== "undefined";

const getCacheKey = (slug, subcategoryId = null) =>
    `${String(slug)}::${subcategoryId ? String(subcategoryId) : "root"}`;

const parsePayload = (payload) => {
    if (!payload || typeof payload !== "object") return null;
    const updatedAt = Number(payload.updatedAt || 0);
    const pages = payload.pages && typeof payload.pages === "object" ? payload.pages : {};
    const brandBanners = payload.brandBanners || null;
    const totalPagesKnown = Number(payload.totalPagesKnown || 1);
    return {
        updatedAt,
        pages,
        brandBanners,
        totalPagesKnown: Number.isNaN(totalPagesKnown) ? 1 : Math.max(1, totalPagesKnown),
    };
};

const isFresh = (payload, ttl = CATEGORY_CACHE_TTL_MS) =>
    payload && payload.updatedAt > 0 && getNow() - payload.updatedAt < ttl;

const readSessionStore = () => {
    if (!isBrowser()) return {};
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
};

const writeSessionStore = (store) => {
    if (!isBrowser()) return;
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(store));
    } catch {
        // Ignore quota/storage errors; memory cache still works.
    }
};

const extractDataBatch = (res) => {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
};

const extractTotalPages = (res) => {
    const a = Number(res?.pagination?.last_page || 0);
    const b = Number(res?.data?.last_page || 0);
    if (a > 0) return a;
    if (b > 0) return b;
    return 1;
};

export const normalizeCategoryProductForCard = (product) => {
    const mrp = Number(product?.retails_price || 0);
    const discount = Number(product?.discount || 0);
    const discountType = product?.discount_type ? String(product.discount_type).toLowerCase() : "percentage";

    let finalPrice = mrp;
    let discountLabel = "";
    if (discount > 0) {
        if (discountType === "amount") {
            finalPrice = Math.max(0, mrp - discount);
            discountLabel = `৳${discount} OFF`;
        } else {
            finalPrice = Math.max(0, Math.round(mrp * (1 - discount / 100)));
            discountLabel = `${discount}% OFF`;
        }
    }

    return {
        id: product?.id,
        brand: product?.brand_name || product?.brands?.name || "BRAND",
        name: product?.name || "",
        price: `৳ ${Number(finalPrice || 0).toLocaleString()}`,
        originalPrice: discountLabel ? `৳ ${Number(mrp || 0).toLocaleString()}` : "",
        discount: discountLabel,
        images: Array.isArray(product?.image_paths) && product.image_paths.length > 0
            ? product.image_paths
            : [product?.image_path, product?.image_path1, product?.image_path2].filter(Boolean),
        sizes: Array.isArray(product?.product_variants) && product.product_variants.length > 0
            ? product.product_variants.map((v) => v.name).filter(Boolean)
            : ["S", "M", "L", "XL"],
        unavailableSizes: Array.isArray(product?.product_variants) && product.product_variants.length > 0
            ? product.product_variants.filter((v) => Number(v.quantity || 0) === 0).map((v) => v.name)
            : [],
        color: product?.color || "gray",
        colorCode: product?.color_code || product?.colorCode || product?.colour_code || null,
        rating: product?.review_summary?.average_rating || 0,
        reviews: product?.review_summary?.total_reviews || 0,
        rawPrice: Number(finalPrice || 0),
        rawDiscount: discount,
        categoryId: product?.category_id ?? null,
        subcategoryId: product?.sub_category_id ?? product?.subcategory_id ?? null,
        childCategoryId: product?.child_category_id ?? product?.childcategory_id ?? null,
    };
};

export const readCategoryPagesCache = (slug, subcategoryId = null, options = {}) => {
    const ttl = options.ttlMs || CATEGORY_CACHE_TTL_MS;
    const key = getCacheKey(slug, subcategoryId);

    const memoryPayload = parsePayload(inMemoryCache.get(key));
    if (memoryPayload && isFresh(memoryPayload, ttl)) return memoryPayload;

    const store = readSessionStore();
    const sessionPayload = parsePayload(store[key]);
    if (sessionPayload && isFresh(sessionPayload, ttl)) {
        inMemoryCache.set(key, sessionPayload);
        return sessionPayload;
    }
    return null;
};

export const writeCategoryPagesCache = (
    slug,
    subcategoryId = null,
    { pages = {}, brandBanners = null, totalPagesKnown = 1 }
) => {
    const key = getCacheKey(slug, subcategoryId);
    const payload = {
        updatedAt: getNow(),
        pages,
        brandBanners,
        totalPagesKnown: Math.max(1, Number(totalPagesKnown || 1)),
    };
    inMemoryCache.set(key, payload);
    const store = readSessionStore();
    store[key] = payload;
    writeSessionStore(store);
    return payload;
};

export const writeCategoryPage = (
    slug,
    subcategoryId = null,
    page,
    products,
    brandBanners = null,
    totalPagesKnown
) => {
    const existing = readCategoryPagesCache(slug, subcategoryId, { ttlMs: Infinity }) || {
        updatedAt: 0,
        pages: {},
        brandBanners: null,
        totalPagesKnown: 1,
    };
    const nextPages = { ...existing.pages, [String(page)]: products || [] };
    return writeCategoryPagesCache(slug, subcategoryId, {
        pages: nextPages,
        brandBanners: brandBanners ?? existing.brandBanners ?? null,
        totalPagesKnown: totalPagesKnown ?? existing.totalPagesKnown ?? 1,
    });
};

export const trimCategoryPages = (slug, subcategoryId = null, maxPage, brandBanners = null) => {
    const existing = readCategoryPagesCache(slug, subcategoryId, { ttlMs: Infinity });
    if (!existing) return null;
    const trimmedPages = {};
    Object.entries(existing.pages).forEach(([pageKey, pageProducts]) => {
        if (Number(pageKey) <= Number(maxPage)) {
            trimmedPages[pageKey] = pageProducts;
        }
    });
    return writeCategoryPagesCache(slug, subcategoryId, {
        pages: trimmedPages,
        brandBanners: brandBanners ?? existing.brandBanners ?? null,
        totalPagesKnown: Math.max(1, Number(maxPage || 1)),
    });
};

export const prefetchCategoryFirstPage = async (slug, subcategoryId = null) => {
    const cached = readCategoryPagesCache(slug, subcategoryId);
    if (cached?.pages?.["1"]?.length) return cached;

    const inflightKey = getCacheKey(slug, subcategoryId);
    if (inFlightMap.has(inflightKey)) {
        return inFlightMap.get(inflightKey);
    }

    const promise = (async () => {
        const res = subcategoryId
            ? await getProductsBySubcategory(subcategoryId, 1)
            : await getCategoryWiseProducts(slug, 1);

        if (!res?.success || !res?.data) return null;
        const batch = extractDataBatch(res).map(normalizeCategoryProductForCard);
        const totalPages = extractTotalPages(res);
        return writeCategoryPagesCache(slug, subcategoryId, {
            pages: { "1": batch },
            brandBanners: null,
            totalPagesKnown: totalPages,
        });
    })();

    inFlightMap.set(inflightKey, promise);
    try {
        return await promise;
    } finally {
        inFlightMap.delete(inflightKey);
    }
};

// Backward-compatible first-page helpers
export const readCategoryFirstPageCache = (slug, subcategoryId = null) => {
    const cached = readCategoryPagesCache(slug, subcategoryId);
    if (!cached) return null;
    return {
        products: cached.pages?.["1"] || [],
        brandBanners: cached.brandBanners || null,
        totalPagesKnown: cached.totalPagesKnown || 1,
    };
};

export const writeCategoryFirstPageCache = (
    slug,
    subcategoryId = null,
    products = [],
    brandBanners = null,
    totalPagesKnown = 1
) => {
    return writeCategoryPagesCache(slug, subcategoryId, {
        pages: { "1": products },
        brandBanners,
        totalPagesKnown,
    });
};

