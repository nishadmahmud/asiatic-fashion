"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import ProductCard from "@/components/ProductCard/ProductCard";
import {
  getCategoriesFromServer,
  getCategoryWiseProducts,
  getProductsBySubcategory,
  getProductsByChildCategory,
  getCampaigns,
} from "@/lib/api";
import {
  transformProduct,
  buildCampaignDiscountMap,
  collectProductSizeLabels,
} from "@/lib/transformProduct";

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const categoryId = params.id;
  const subcategoryId = searchParams.get("subcategory");
  const childId = searchParams.get("child");

  const PAGE_SIZE = 20;

  const [products, setProducts] = useState([]);
  const [rawProducts, setRawProducts] = useState([]); // keep raw for filter extraction
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [childCategoryName, setChildCategoryName] = useState("");
  const [bannerImage, setBannerImage] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [mobileListView, setMobileListView] = useState(true);
  const [sortBy, setSortBy] = useState("recommended");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter state
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(100000);
  const [showOutOfStock, setShowOutOfStock] = useState(true);
  const [expandedFilters, setExpandedFilters] = useState({ price: true, size: true, color: false, brand: false });

  // Prevent background scrolling when filter is open
  useEffect(() => {
    if (isFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFilterOpen]);

  // Fetch category names & banner
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const response = await getCategoriesFromServer();
        if (response.success && response.data) {
          const category = response.data.find(
            (c) => String(c.category_id) === String(categoryId)
          );
          if (category) {
            setCategoryName(category.name);
            setBannerImage(category.banner || null);
            setSubcategories(
              Array.isArray(category.sub_category) ? category.sub_category : []
            );

            if (subcategoryId && category.sub_category) {
              const subcat = category.sub_category.find(
                (s) => String(s.id) === String(subcategoryId)
              );
              if (subcat) {
                setSubcategoryName(subcat.name);
                if (subcat.banner) setBannerImage(subcat.banner);
              } else {
                setSubcategoryName("");
              }
            } else {
              setSubcategoryName("");
            }

            setChildCategoryName("");
            if (childId && category.sub_category) {
              for (const sub of category.sub_category) {
                const children = Array.isArray(sub.child_categories) ? sub.child_categories : [];
                const ch = children.find((c) => String(c.id) === String(childId));
                if (ch) {
                  setChildCategoryName(ch.name);
                  break;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching category data:", error);
      }
    };
    if (categoryId) fetchCategoryData();
  }, [categoryId, subcategoryId, childId]);

  // Fetch products: load page 1 fast, then merge every remaining page in parallel.
  // We never paginate the UI — filters are client-side and need the full list.
  useEffect(() => {
    let cancelled = false;
    // Hard cap so a misbehaving backend can't blow up the browser. 25 * 20 = 500 products.
    const MAX_PAGES = 25;

    const fetchPage = (page) => {
      if (childId) return getProductsByChildCategory(childId, page);
      if (subcategoryId) return getProductsBySubcategory(subcategoryId, page);
      return getCategoryWiseProducts(categoryId, page);
    };

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

    const dedupeById = (items) => {
      const seen = new Set();
      const out = [];
      for (const item of items) {
        const id = item?.id;
        if (id == null) {
          out.push(item);
          continue;
        }
        if (seen.has(id)) continue;
        seen.add(id);
        out.push(item);
      }
      return out;
    };

    const run = async () => {
      setLoading(true);
      setIsLoadingMore(false);
      setRawProducts([]);
      setProducts([]);

      let campaignMap = {};
      try {
        const campaignsRes = await getCampaigns();
        if (campaignsRes?.success && Array.isArray(campaignsRes?.campaigns?.data)) {
          const active = campaignsRes.campaigns.data.filter((c) => c?.status === "active");
          campaignMap = buildCampaignDiscountMap(active);
        }
      } catch (e) {
        console.error("Campaign fetch error:", e);
      }

      let firstRes;
      try {
        firstRes = await fetchPage(1);
      } catch (e) {
        console.error("Error fetching products (page 1):", e);
        if (!cancelled) setLoading(false);
        return;
      }
      if (cancelled) return;

      if (!firstRes?.success) {
        setLoading(false);
        return;
      }

      const firstBatch = getDataBatch(firstRes);
      const apiTotalPages = Math.min(getLastPage(firstRes), MAX_PAGES);

      setRawProducts(firstBatch);
      setProducts(firstBatch.map((p) => transformProduct(p, campaignMap)));
      setLoading(false);

      if (apiTotalPages <= 1) return;

      // Background fetch the rest in parallel and merge once.
      setIsLoadingMore(true);
      const remainingPages = [];
      for (let p = 2; p <= apiTotalPages; p++) remainingPages.push(p);

      try {
        const settled = await Promise.allSettled(remainingPages.map((p) => fetchPage(p)));
        if (cancelled) return;

        const extraRaw = [];
        for (const result of settled) {
          if (result.status !== "fulfilled") continue;
          const res = result.value;
          if (!res?.success) continue;
          extraRaw.push(...getDataBatch(res));
        }

        if (extraRaw.length > 0) {
          const mergedRaw = dedupeById([...firstBatch, ...extraRaw]);
          setRawProducts(mergedRaw);
          setProducts(mergedRaw.map((p) => transformProduct(p, campaignMap)));
        }
      } catch (e) {
        console.error("Error fetching additional pages:", e);
      } finally {
        if (!cancelled) setIsLoadingMore(false);
      }
    };

    if (categoryId) run();

    return () => {
      cancelled = true;
    };
  }, [categoryId, subcategoryId, childId]);

  // Extract available filter options from raw data
  const filterOptions = useMemo(() => {
    const sizes = new Set();
    const colors = new Map();
    const brands = new Set();
    rawProducts.forEach((p) => {
      collectProductSizeLabels(p).forEach((name) => sizes.add(name));
      if (p.color) colors.set(p.color, p.color_code || "#999");
      const brand = p.brand_name || p.brands?.name;
      if (brand) brands.add(brand);
    });
    // Price range MUST be derived from the same field the price filter compares
    // against (p.price on transformed products) — otherwise the user can drag the
    // slider into a band that doesn't correspond to any real product.
    // ৳0 products (e.g. stock-out items with no price set) ARE valid lower bounds.
    let minP = Infinity, maxP = 0;
    products.forEach((p) => {
      const raw = p?.price;
      if (raw == null || raw === "") return;
      const price = Number(raw);
      if (!Number.isFinite(price) || price < 0) return;
      if (price < minP) minP = price;
      if (price > maxP) maxP = price;
    });
    if (minP === Infinity) minP = 0;
    // Sort sizes: numbers first (ascending), then letter sizes in order
    const letterOrder = ['XXS','XS','S','M','L','XL','XXL','XXXL','3XL','4XL','5XL'];
    const sortedSizes = [...sizes].sort((a, b) => {
      const aNum = parseFloat(a), bNum = parseFloat(b);
      const aIsNum = !isNaN(aNum), bIsNum = !isNaN(bNum);
      if (aIsNum && bIsNum) return aNum - bNum;
      if (aIsNum) return -1;
      if (bIsNum) return 1;
      const aIdx = letterOrder.indexOf(a.toUpperCase()), bIdx = letterOrder.indexOf(b.toUpperCase());
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });
    return {
      sizes: sortedSizes,
      colors: [...colors.entries()].map(([name, code]) => ({ name, code })),
      brands: [...brands],
      priceMin: minP,
      priceMax: maxP,
    };
  }, [rawProducts, products]);

  // Sync price bounds when data loads (when every product shares one price, extend the
  // upper bound by ৳1 so the dual-range slider still has a movable track).
  useEffect(() => {
    if (filterOptions.priceMax > 0) {
      const lo = filterOptions.priceMin;
      const hi = filterOptions.priceMax;
      setPriceMin(lo);
      setPriceMax(hi > lo ? hi : lo + 1);
    }
  }, [filterOptions.priceMin, filterOptions.priceMax]);

  const allSizesSelected =
    filterOptions.sizes.length > 0 && filterOptions.sizes.every((s) => selectedSizes.includes(s));
  const allColorsSelected =
    filterOptions.colors.length > 0 &&
    filterOptions.colors.every((c) => selectedColors.includes(c.name));
  const allBrandsSelected =
    filterOptions.brands.length > 0 && filterOptions.brands.every((b) => selectedBrands.includes(b));

  // Filter + sort products client-side
  const sortedProducts = useMemo(() => {
    let result = [...products];

    // Out of stock filter
    if (!showOutOfStock) {
      const inStockIds = new Set(rawProducts.filter((r) => r.current_stock > 0).map((r) => r.id));
      result = result.filter((p) => inStockIds.has(p.id));
    }

    // Size filter: OR across selected sizes. Selecting every size in the facet = no size filter
    // (otherwise products with missing variant data on the list API are wrongly excluded).
    if (selectedSizes.length > 0 && !allSizesSelected) {
      result = result.filter((p) => p.sizes?.some((s) => selectedSizes.includes(s)));
    }
    // Color filter
    if (selectedColors.length > 0 && !allColorsSelected) {
      const colorIds = new Set(selectedColors);
      const matchingIds = new Set(rawProducts.filter((r) => colorIds.has(r.color)).map((r) => r.id));
      result = result.filter((p) => matchingIds.has(p.id));
    }
    // Brand filter
    if (selectedBrands.length > 0 && !allBrandsSelected) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }
    // Price filter
    if (priceMin > filterOptions.priceMin || priceMax < filterOptions.priceMax) {
      result = result.filter((p) => p.price >= priceMin && p.price <= priceMax);
    }

    switch (sortBy) {
      case "price-low": result.sort((a, b) => a.price - b.price); break;
      case "price-high": result.sort((a, b) => b.price - a.price); break;
      case "newest": result.reverse(); break;
      default: break;
    }
    return result;
  }, [
    products,
    rawProducts,
    sortBy,
    selectedSizes,
    selectedColors,
    selectedBrands,
    priceMin,
    priceMax,
    filterOptions.priceMin,
    filterOptions.priceMax,
    showOutOfStock,
    allSizesSelected,
    allColorsSelected,
    allBrandsSelected,
  ]);

  const activeFilterCount =
    (selectedSizes.length > 0 && !allSizesSelected ? selectedSizes.length : 0) +
    (selectedColors.length > 0 && !allColorsSelected ? selectedColors.length : 0) +
    (selectedBrands.length > 0 && !allBrandsSelected ? selectedBrands.length : 0);

  // Client-side pagination over the (already filtered + sorted) full list.
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedProducts = useMemo(
    () => sortedProducts.slice(pageStart, pageStart + PAGE_SIZE),
    [sortedProducts, pageStart]
  );

  // Snap currentPage back into range when filters/sort shrink the result set.
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Reset to page 1 whenever filters / sort / category context change.
  useEffect(() => {
    setCurrentPage(1);
  }, [
    categoryId,
    subcategoryId,
    childId,
    sortBy,
    selectedSizes,
    selectedColors,
    selectedBrands,
    priceMin,
    priceMax,
    showOutOfStock,
  ]);

  const goToPage = (page) => {
    const target = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(target);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Build a compact list of page tokens with ellipses: 1 … 4 5 [6] 7 8 … 20
  const pageTokens = (() => {
    const tokens = [];
    const delta = 1;
    const add = (v) => tokens.push(v);
    const range = (from, to) => {
      for (let i = from; i <= to; i++) add(i);
    };
    if (totalPages <= 7) {
      range(1, totalPages);
      return tokens;
    }
    add(1);
    if (safeCurrentPage - delta > 2) add("…");
    range(Math.max(2, safeCurrentPage - delta), Math.min(totalPages - 1, safeCurrentPage + delta));
    if (safeCurrentPage + delta < totalPages - 1) add("…");
    add(totalPages);
    return tokens;
  })();

  const activeSubcategory = useMemo(
    () => subcategories.find((s) => String(s.id) === String(subcategoryId)),
    [subcategories, subcategoryId]
  );

  const pillChildCategories = useMemo(() => {
    if (!activeSubcategory) return [];
    const ch = activeSubcategory.child_categories;
    return Array.isArray(ch) ? ch : [];
  }, [activeSubcategory]);

  /** After picking a subcategory, top row shows its children (not the sub list). */
  const showChildPills = Boolean(subcategoryId && pillChildCategories.length > 0);

  const toggleFilter = (key) => setExpandedFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleCheckbox = (value, selected, setter) => {
    setter((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]);
  };
  const clearAllFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedBrands([]);
    const lo = filterOptions.priceMin;
    const hi = filterOptions.priceMax;
    setPriceMin(lo);
    setPriceMax(hi > lo ? hi : lo + 1);
    setShowOutOfStock(true);
  };

  const displayName =
    childCategoryName || subcategoryName || categoryName || "Collection";

  return (
    <>
      <Header />

      <main className="w-full bg-white relative">
        {/* Hero Banner — desktop only */}
        <div className="hidden md:block relative w-full h-[60vh] bg-[#F8F8F6]">
          {bannerImage ? (
            <Image
              src={bannerImage}
              alt={displayName}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#F8F8F6] to-[#E5E5E5] flex items-center justify-center">
              <span className="text-[#999999] text-lg font-bold tracking-widest uppercase">{displayName}</span>
            </div>
          )}
        </div>

        {/* Mobile: subcategories + title + filter / layout (no banner) */}
        <div className="md:hidden border-b border-[#E5E5E5] bg-white">
          {subcategories.length > 0 && (
            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-1 px-2 pt-4 pb-3">
              <div className="flex justify-center">
                {subcategoryId ? (
                  <Link
                    href={
                      childId
                        ? `/category/${categoryId}?subcategory=${subcategoryId}`
                        : `/category/${categoryId}`
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#F8F8F6] transition-colors"
                    aria-label={childId ? "Back to subcategory" : "Back to all subcategories"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </Link>
                ) : null}
              </div>
              <div className="flex min-w-0 flex-wrap justify-center gap-2">
                {showChildPills
                  ? pillChildCategories.map((child) => {
                      const active = String(childId) === String(child.id);
                      return (
                        <Link
                          key={child.id}
                          href={`/category/${categoryId}?subcategory=${subcategoryId}&child=${child.id}`}
                          className={`shrink-0 rounded-sm border px-3 py-2.5 text-[10px] font-bold tracking-[0.15em] uppercase transition-colors ${
                            active
                              ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                              : "border-[#1A1A1A] text-[#1A1A1A] bg-white hover:bg-[#F8F8F6]"
                          }`}
                        >
                          {child.name}
                        </Link>
                      );
                    })
                  : subcategories.map((sub) => {
                      const active = String(subcategoryId) === String(sub.id);
                      return (
                        <Link
                          key={sub.id}
                          href={`/category/${categoryId}?subcategory=${sub.id}`}
                          className={`shrink-0 rounded-sm border px-3 py-2.5 text-[10px] font-bold tracking-[0.15em] uppercase transition-colors ${
                            active
                              ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                              : "border-[#1A1A1A] text-[#1A1A1A] bg-white hover:bg-[#F8F8F6]"
                          }`}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
              </div>
              <div aria-hidden className="w-9 shrink-0" />
            </div>
          )}
          <h1 className="text-center text-lg font-bold text-[#1A1A1A] tracking-tight px-4 pb-3 capitalize">
            {displayName}
          </h1>
          <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center border-t border-[#E5E5E5] px-2 py-2.5 text-[#1A1A1A]">
            <div className="flex min-w-0 justify-start">
              <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className="flex shrink-0 items-center gap-1 py-1.5 pl-0.5 pr-0.5 text-[10px] font-bold uppercase tracking-wide hover:opacity-70 transition-opacity"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                Filter
              </button>
            </div>
            <div className="flex justify-center">
              <label htmlFor="mobile-category-sort" className="sr-only">
                Sort products
              </label>
              <select
                id="mobile-category-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 w-[118px] shrink-0 border border-[#1A1A1A] bg-white px-1 text-[10px] font-bold uppercase tracking-wide text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]/30"
              >
                <option value="recommended">Recommended</option>
                <option value="price-low">Price, low to high</option>
                <option value="price-high">Price, high to low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
            <div className="flex min-w-0 justify-end">
              <div className="flex shrink-0 items-center overflow-hidden rounded-sm border border-[#1A1A1A]">
                <button
                  type="button"
                  aria-label="Two column grid"
                  onClick={() => setMobileListView(false)}
                  className={`p-2 ${!mobileListView ? "bg-[#1A1A1A] text-white" : "bg-white text-[#1A1A1A]"}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="7" height="7" rx="0.5" />
                    <rect x="14" y="3" width="7" height="7" rx="0.5" />
                    <rect x="3" y="14" width="7" height="7" rx="0.5" />
                    <rect x="14" y="14" width="7" height="7" rx="0.5" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Single column list"
                  onClick={() => setMobileListView(true)}
                  className={`p-2 border-l border-[#1A1A1A] ${mobileListView ? "bg-[#1A1A1A] text-white" : "bg-white text-[#1A1A1A]"}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="6" y="5" width="12" height="14" rx="0.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sub Header Bar — desktop */}
        <div className="hidden md:block w-full border-b border-[#E5E5E5]">
          <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-4 flex items-center justify-between text-xs font-bold tracking-widest uppercase text-[#1A1A1A]">
            <span>SS.26</span>
            <span>{displayName}</span>
          </div>
        </div>

        {/* Collection Title & Filter Bar — desktop */}
        <div className="hidden md:block max-w-[1600px] mx-auto px-4 md:px-12">
          <div className="flex items-center justify-between pb-6 text-xs text-[#1A1A1A] font-medium border-b border-[#E5E5E5] sticky top-[112px] bg-white z-10 pt-4 mt-6">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity uppercase tracking-widest"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
              Filter
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs border border-[#E5E5E5] px-4 py-2 bg-transparent uppercase tracking-widest cursor-pointer focus:outline-none"
            >
              <option value="recommended">Recommended</option>
              <option value="price-low">Price, low to high</option>
              <option value="price-high">Price, high to low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-10">
          {loading ? (
            <div
              className={`grid gap-x-4 gap-y-12 sm:gap-x-8 sm:gap-y-16 ${
                mobileListView
                  ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-[#F8F8F6] mb-4"></div>
                  <div className="h-3 bg-[#F8F8F6] w-1/3 mb-2"></div>
                  <div className="h-3 bg-[#F8F8F6] w-2/3 mb-2"></div>
                  <div className="h-3 bg-[#F8F8F6] w-1/4"></div>
                </div>
              ))}
            </div>
          ) : sortedProducts.length > 0 ? (
            <>
              <div
                className={`grid gap-x-4 gap-y-12 sm:gap-x-8 sm:gap-y-16 ${
                  mobileListView
                    ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
                }`}
              >
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} showMobileArrows={mobileListView} />
                ))}
              </div>

              <div className="mt-10 flex flex-col items-center gap-3 text-[10px] uppercase tracking-widest text-[#6B6B6B]">
                <span>
                  Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, sortedProducts.length)} of{" "}
                  {sortedProducts.length}
                </span>

                {totalPages > 1 && (
                  <div className="flex items-center gap-3 text-xs font-medium text-[#1A1A1A]">
                    <button
                      type="button"
                      onClick={() => goToPage(safeCurrentPage - 1)}
                      disabled={safeCurrentPage <= 1}
                      className="flex items-center gap-1 text-[#999999] hover:text-[#1A1A1A] disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                      Prev
                    </button>

                    {pageTokens.map((token, idx) =>
                      token === "…" ? (
                        <span key={`e-${idx}`} className="text-[#999999]">
                          …
                        </span>
                      ) : (
                        <button
                          key={token}
                          type="button"
                          onClick={() => goToPage(token)}
                          className={
                            safeCurrentPage === token
                              ? "border-b border-[#1A1A1A]"
                              : "text-[#999999] hover:text-[#1A1A1A]"
                          }
                          aria-current={safeCurrentPage === token ? "page" : undefined}
                        >
                          {token}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() => goToPage(safeCurrentPage + 1)}
                      disabled={safeCurrentPage >= totalPages}
                      className="flex items-center gap-1 text-[#999999] hover:text-[#1A1A1A] disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      Next
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-[#999999] text-sm tracking-widest uppercase">
                No products found in this category.
              </p>
            </div>
          )}

          {isLoadingMore && !loading && (
            <div className="mt-6 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-[#999]">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#1A1A1A]" />
              Loading more products…
            </div>
          )}
        </div>

        {/* Filter Drawer */}
        <div
          className={`fixed inset-0 bg-black/30 z-[60] transition-opacity duration-300 ${
            isFilterOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
          onClick={() => setIsFilterOpen(false)}
        />
        <div
          className={`fixed top-0 left-0 h-full w-[350px] max-w-[90vw] bg-[#F8F8F6] z-[70] transform transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] flex flex-col ${
            isFilterOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center gap-3 px-6 h-[72px] border-b border-[#E5E5E5] bg-[#F8F8F6] shrink-0">
            <button onClick={() => setIsFilterOpen(false)} className="p-2 -ml-2 text-[#1A1A1A] hover:opacity-70">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <h2 className="text-sm font-bold uppercase tracking-widest">Filter</h2>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8">
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="text-xs text-[#999] underline underline-offset-4 mb-6 block">Clear all ({activeFilterCount})</button>
            )}

            {/* Out of Stock Toggle */}
            <div className="border-b border-[#E5E5E5] pb-5 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#1A1A1A]">Out of stock</span>
                <div className="flex border border-[#E5E5E5]">
                  <button
                    onClick={() => setShowOutOfStock(true)}
                    className={`px-4 py-1.5 text-xs font-medium transition-all ${
                      showOutOfStock ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#1A1A1A] hover:bg-[#F8F8F6]'
                    }`}
                  >Show</button>
                  <button
                    onClick={() => setShowOutOfStock(false)}
                    className={`px-4 py-1.5 text-xs font-medium transition-all border-l border-[#E5E5E5] ${
                      !showOutOfStock ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#1A1A1A] hover:bg-[#F8F8F6]'
                    }`}
                  >Hide</button>
                </div>
              </div>
            </div>

            {/* Price Filter */}
            <div className="border-b border-[#E5E5E5] pb-5 mb-5">
              <button onClick={() => toggleFilter('price')} className="w-full flex items-center justify-between text-sm font-bold text-[#1A1A1A] mb-4">
                <span>Price</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`transition-transform ${expandedFilters.price ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              {expandedFilters.price && filterOptions.priceMax > 0 && (() => {
                const dataLo = filterOptions.priceMin;
                const dataHi = filterOptions.priceMax;
                const uniform = dataHi <= dataLo;
                const lo = dataLo;
                const hi = uniform ? dataLo + 1 : dataHi;
                const span = Math.max(1, hi - lo);
                const safeMin = Math.max(lo, Math.min(priceMin, hi));
                const safeMax = Math.max(lo, Math.min(priceMax, hi));
                const minPct = ((safeMin - lo) / span) * 100;
                const maxPct = ((safeMax - lo) / span) * 100;
                const step = Math.max(1, Math.round(span / 100));
                const labelMax =
                  uniform && safeMax >= hi ? dataHi : safeMax;
                return (
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-3">
                      <span>৳{safeMin.toLocaleString()}</span>
                      <span>৳{labelMax.toLocaleString()}</span>
                    </div>
                    <div className="dual-range-wrapper">
                      <div className="track" />
                      <div
                        className="track-fill"
                        style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
                      />
                      <input
                        type="range"
                        className="dual-range"
                        min={lo}
                        max={hi}
                        step={step}
                        value={safeMin}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (v <= safeMax - step) setPriceMin(v);
                          else setPriceMin(Math.max(lo, safeMax - step));
                        }}
                        aria-label="Minimum price"
                      />
                      <input
                        type="range"
                        className="dual-range"
                        min={lo}
                        max={hi}
                        step={step}
                        value={safeMax}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (v >= safeMin + step) setPriceMax(v);
                          else setPriceMax(Math.min(hi, safeMin + step));
                        }}
                        aria-label="Maximum price"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Size Filter */}
            <div className="border-b border-[#E5E5E5] pb-5 mb-5">
              <button onClick={() => toggleFilter('size')} className="w-full flex items-center justify-between text-sm font-bold text-[#1A1A1A] mb-4">
                <span>Size {selectedSizes.length > 0 && `(${selectedSizes.length})`}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`transition-transform ${expandedFilters.size ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              {expandedFilters.size && (
                <div className="flex flex-wrap gap-2">
                  {filterOptions.sizes.map((size) => (
                    <button key={size} onClick={() => toggleCheckbox(size, selectedSizes, setSelectedSizes)}
                      className={`min-w-[2.5rem] px-3 py-2 text-xs border transition-all ${
                        selectedSizes.includes(size) ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white text-[#1A1A1A] border-[#E5E5E5] hover:border-[#1A1A1A]'
                      }`}>{size}</button>
                  ))}
                  {filterOptions.sizes.length === 0 && <p className="text-xs text-[#999]">No sizes available</p>}
                </div>
              )}
            </div>

            {/* Color Filter */}
            <div className="border-b border-[#E5E5E5] pb-5 mb-5">
              <button onClick={() => toggleFilter('color')} className="w-full flex items-center justify-between text-sm font-bold text-[#1A1A1A] mb-4">
                <span>Color {selectedColors.length > 0 && `(${selectedColors.length})`}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`transition-transform ${expandedFilters.color ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              {expandedFilters.color && (
                <div className="flex flex-wrap gap-3">
                  {filterOptions.colors.map((c) => (
                    <button key={c.name} onClick={() => toggleCheckbox(c.name, selectedColors, setSelectedColors)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs border transition-all ${
                        selectedColors.includes(c.name) ? 'border-[#1A1A1A] bg-[#F8F8F6]' : 'border-[#E5E5E5] hover:border-[#1A1A1A]'
                      }`}>
                      <span className="w-4 h-4 border border-[#E5E5E5] shrink-0" style={{ backgroundColor: c.code || '#999' }}></span>
                      {c.name}
                    </button>
                  ))}
                  {filterOptions.colors.length === 0 && <p className="text-xs text-[#999]">No colors available</p>}
                </div>
              )}
            </div>

            {/* Brand Filter */}
            <div className="border-b border-[#E5E5E5] pb-5 mb-5">
              <button onClick={() => toggleFilter('brand')} className="w-full flex items-center justify-between text-sm font-bold text-[#1A1A1A] mb-4">
                <span>Brand {selectedBrands.length > 0 && `(${selectedBrands.length})`}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`transition-transform ${expandedFilters.brand ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              {expandedFilters.brand && (
                <div className="flex flex-col gap-3">
                  {filterOptions.brands.map((brand) => {
                    const checked = selectedBrands.includes(brand);
                    return (
                      <label
                        key={brand}
                        className="flex items-center gap-3 cursor-pointer group select-none"
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => toggleCheckbox(brand, selectedBrands, setSelectedBrands)}
                        />
                        <span
                          aria-hidden="true"
                          className={`w-4 h-4 border flex items-center justify-center transition-all ${
                            checked
                              ? "bg-[#1A1A1A] border-[#1A1A1A]"
                              : "border-[#E5E5E5] group-hover:border-[#1A1A1A]"
                          }`}
                        >
                          {checked && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="3"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </span>
                        <span className="text-xs text-[#1A1A1A]">{brand}</span>
                      </label>
                    );
                  })}
                  {filterOptions.brands.length === 0 && <p className="text-xs text-[#999]">No brands available</p>}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-[#E5E5E5] bg-white">
            <button
              onClick={() => setIsFilterOpen(false)}
              className="w-full bg-[#1A1A1A] text-white h-12 text-xs font-medium tracking-widest uppercase hover:bg-[#333333] transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
