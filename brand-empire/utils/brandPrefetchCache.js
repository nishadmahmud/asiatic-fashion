"use client";

const BRAND_CACHE_TTL_MS = 5 * 60 * 1000;
const SESSION_KEY = "brand_empire_brand_pages_cache_v1";
const memoryCache = new Map();

const isBrowser = () => typeof window !== "undefined";
const now = () => Date.now();

const getKey = (brandId, scope = "default") => `${String(brandId)}::${String(scope || "default")}`;

const readStore = () => {
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

const writeStore = (store) => {
    if (!isBrowser()) return;
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(store));
    } catch {
        // Ignore storage write failures.
    }
};

const isFresh = (payload, ttl = BRAND_CACHE_TTL_MS) =>
    payload && payload.updatedAt && now() - Number(payload.updatedAt) < ttl;

const parsePayload = (payload) => {
    if (!payload || typeof payload !== "object") return null;
    return {
        updatedAt: Number(payload.updatedAt || 0),
        pages: payload.pages && typeof payload.pages === "object" ? payload.pages : {},
        totalPagesKnown: Math.max(1, Number(payload.totalPagesKnown || 1)),
        bannerImage: payload.bannerImage || null,
        brandName: payload.brandName || "",
    };
};

export const readBrandPagesCache = (brandId, scope = "default", options = {}) => {
    const ttl = options.ttlMs || BRAND_CACHE_TTL_MS;
    const key = getKey(brandId, scope);

    const mem = parsePayload(memoryCache.get(key));
    if (mem && isFresh(mem, ttl)) return mem;

    const store = readStore();
    const sessionPayload = parsePayload(store[key]);
    if (sessionPayload && isFresh(sessionPayload, ttl)) {
        memoryCache.set(key, sessionPayload);
        return sessionPayload;
    }
    return null;
};

export const writeBrandPagesCache = (
    brandId,
    scope = "default",
    { pages = {}, totalPagesKnown = 1, bannerImage = null, brandName = "" }
) => {
    const key = getKey(brandId, scope);
    const payload = {
        updatedAt: now(),
        pages,
        totalPagesKnown: Math.max(1, Number(totalPagesKnown || 1)),
        bannerImage,
        brandName,
    };
    memoryCache.set(key, payload);
    const store = readStore();
    store[key] = payload;
    writeStore(store);
    return payload;
};

export const writeBrandPage = (
    brandId,
    scope = "default",
    page,
    products = [],
    { totalPagesKnown, bannerImage, brandName } = {}
) => {
    const existing = readBrandPagesCache(brandId, scope, { ttlMs: Infinity }) || {
        pages: {},
        totalPagesKnown: 1,
        bannerImage: null,
        brandName: "",
    };
    const nextPages = { ...existing.pages, [String(page)]: products };
    return writeBrandPagesCache(brandId, scope, {
        pages: nextPages,
        totalPagesKnown: totalPagesKnown ?? existing.totalPagesKnown ?? 1,
        bannerImage: bannerImage ?? existing.bannerImage ?? null,
        brandName: brandName ?? existing.brandName ?? "",
    });
};

export const trimBrandPages = (brandId, scope = "default", maxPage) => {
    const existing = readBrandPagesCache(brandId, scope, { ttlMs: Infinity });
    if (!existing) return null;
    const pages = {};
    Object.entries(existing.pages).forEach(([k, v]) => {
        if (Number(k) <= Number(maxPage)) pages[k] = v;
    });
    return writeBrandPagesCache(brandId, scope, {
        pages,
        totalPagesKnown: Math.max(1, Number(maxPage || 1)),
        bannerImage: existing.bannerImage || null,
        brandName: existing.brandName || "",
    });
};

export const mergeBrandCachedPages = (pages = {}) => {
    const keys = Object.keys(pages)
        .map(Number)
        .filter((n) => !Number.isNaN(n))
        .sort((a, b) => a - b);
    const merged = [];
    keys.forEach((k) => {
        merged.push(...(pages[String(k)] || []));
    });
    return merged.filter((item, index, self) => index === self.findIndex((t) => t.id === item.id));
};

