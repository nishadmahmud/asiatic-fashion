"use client";

const META_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SESSION_KEY = "brand_empire_category_meta_cache_v1";
let memoryMetaPayload = null;

const isBrowser = () => typeof window !== "undefined";
const now = () => Date.now();

const isFresh = (payload, ttl = META_CACHE_TTL_MS) =>
    payload && payload.updatedAt && now() - Number(payload.updatedAt) < ttl;

const readSessionMeta = () => {
    if (!isBrowser()) return null;
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return null;
        return parsed;
    } catch {
        return null;
    }
};

const writeSessionMeta = (payload) => {
    if (!isBrowser()) return;
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    } catch {
        // Ignore storage quota failures; memory cache remains.
    }
};

export const writeCategoryMetaList = (categories) => {
    const payload = {
        updatedAt: now(),
        categories: Array.isArray(categories) ? categories : [],
    };
    memoryMetaPayload = payload;
    writeSessionMeta(payload);
    return payload;
};

export const readCategoryMetaBySlug = (slug) => {
    let payload = memoryMetaPayload;
    if (!isFresh(payload)) {
        const fromSession = readSessionMeta();
        payload = isFresh(fromSession) ? fromSession : null;
        memoryMetaPayload = payload;
    }
    if (!payload?.categories?.length) return null;

    const slugStr = String(slug);
    return (
        payload.categories.find((c) => String(c?.category_id) === slugStr) ||
        payload.categories.find((c) => String(c?.slug || "") === slugStr) ||
        null
    );
};

export const readCategoryMetaList = () => {
    let payload = memoryMetaPayload;
    if (!isFresh(payload)) {
        const fromSession = readSessionMeta();
        payload = isFresh(fromSession) ? fromSession : null;
        memoryMetaPayload = payload;
    }
    return Array.isArray(payload?.categories) ? payload.categories : [];
};

