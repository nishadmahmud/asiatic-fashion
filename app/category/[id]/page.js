"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
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
import { transformProduct, buildCampaignDiscountMap } from "@/lib/transformProduct";

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const categoryId = params.id;
  const subcategoryId = searchParams.get("subcategory");
  const childId = searchParams.get("child");

  const [products, setProducts] = useState([]);
  const [rawProducts, setRawProducts] = useState([]); // keep raw for filter extraction
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [bannerImage, setBannerImage] = useState(null);
  const [sortBy, setSortBy] = useState("recommended");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

            if (subcategoryId && category.sub_category) {
              const subcat = category.sub_category.find(
                (s) => String(s.id) === String(subcategoryId)
              );
              if (subcat) {
                setSubcategoryName(subcat.name);
                if (subcat.banner) setBannerImage(subcat.banner);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching category data:", error);
      }
    };
    if (categoryId) fetchCategoryData();
  }, [categoryId, subcategoryId]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Fetch campaigns for discount overlay
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

        // Fetch products based on route context
        let response;
        if (childId) {
          response = await getProductsByChildCategory(childId, currentPage);
        } else if (subcategoryId) {
          response = await getProductsBySubcategory(subcategoryId, currentPage);
        } else {
          response = await getCategoryWiseProducts(categoryId, currentPage);
        }

        if (response?.success && response?.data) {
          let rawList = [];
          if (Array.isArray(response.data)) {
            rawList = response.data;
          } else if (Array.isArray(response.data.data)) {
            rawList = response.data.data;
          }

          const lastPage = Number(
            response?.pagination?.last_page || response?.data?.last_page || 1
          );
          setTotalPages(lastPage);
          setRawProducts(rawList);

          const transformed = rawList.map((p) => transformProduct(p, campaignMap));
          setProducts(transformed);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) fetchProducts();
  }, [categoryId, subcategoryId, childId, currentPage]);

  // Extract available filter options from raw data
  const filterOptions = useMemo(() => {
    const sizes = new Set();
    const colors = new Map();
    const brands = new Set();
    let minP = Infinity, maxP = 0;
    rawProducts.forEach((p) => {
      if (p.product_variants) p.product_variants.forEach((v) => { if (v.name) sizes.add(v.name); });
      if (p.color) colors.set(p.color, p.color_code || "#999");
      const brand = p.brand_name || p.brands?.name;
      if (brand) brands.add(brand);
      const price = Number(p.retails_price || 0);
      if (price > 0) { if (price < minP) minP = price; if (price > maxP) maxP = price; }
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
  }, [rawProducts]);

  // Sync price bounds when data loads
  useEffect(() => {
    if (filterOptions.priceMax > 0) {
      setPriceMin(filterOptions.priceMin);
      setPriceMax(filterOptions.priceMax);
    }
  }, [filterOptions.priceMin, filterOptions.priceMax]);

  // Filter + sort products client-side
  const sortedProducts = useMemo(() => {
    let result = [...products];

    // Out of stock filter
    if (!showOutOfStock) {
      const inStockIds = new Set(rawProducts.filter((r) => r.current_stock > 0).map((r) => r.id));
      result = result.filter((p) => inStockIds.has(p.id));
    }

    // Size filter: match products whose sizes array has overlap
    if (selectedSizes.length > 0) {
      result = result.filter((p) => p.sizes?.some((s) => selectedSizes.includes(s)));
    }
    // Color filter: match on color name from raw data
    if (selectedColors.length > 0) {
      const colorIds = new Set(selectedColors);
      const matchingIds = new Set(rawProducts.filter((r) => colorIds.has(r.color)).map((r) => r.id));
      result = result.filter((p) => matchingIds.has(p.id));
    }
    // Brand filter
    if (selectedBrands.length > 0) {
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
  }, [products, rawProducts, sortBy, selectedSizes, selectedColors, selectedBrands, priceMin, priceMax, filterOptions.priceMin, filterOptions.priceMax, showOutOfStock]);

  const activeFilterCount = selectedSizes.length + selectedColors.length + selectedBrands.length;

  const toggleFilter = (key) => setExpandedFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleCheckbox = (value, selected, setter) => {
    setter((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]);
  };
  const clearAllFilters = () => { setSelectedSizes([]); setSelectedColors([]); setSelectedBrands([]); setPriceMin(filterOptions.priceMin); setPriceMax(filterOptions.priceMax); setShowOutOfStock(true); };

  const displayName = subcategoryName || categoryName || "Collection";

  return (
    <>
      <Header />

      <main className="w-full bg-white relative">
        {/* Hero Banner */}
        <div className="relative w-full h-[50vh] md:h-[60vh] bg-[#F8F8F6]">
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

        {/* Sub Header Bar */}
        <div className="w-full border-b border-[#E5E5E5]">
          <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-4 flex items-center justify-between text-xs font-bold tracking-widest uppercase text-[#1A1A1A]">
            <span>SS.26</span>
            <span>{displayName}</span>
          </div>
        </div>

        {/* Collection Title & Filter Bar */}
        <div className="max-w-[1600px] mx-auto px-4 md:px-12">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-8 sm:gap-y-16">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-8 sm:gap-y-16">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-[#999999] text-sm tracking-widest uppercase">
                No products found in this category.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-20 text-xs font-medium text-[#1A1A1A]">
              {currentPage > 1 && (
                <button
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="cursor-pointer text-[#999999] hover:text-[#1A1A1A] mr-2 flex items-center gap-1"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  Prev
                </button>
              )}
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={
                      currentPage === page
                        ? "cursor-pointer border-b border-[#1A1A1A]"
                        : "cursor-pointer text-[#999999] hover:text-[#1A1A1A]"
                    }
                  >
                    {page}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="text-[#999999]">...</span>}
              {currentPage < totalPages && (
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="cursor-pointer text-[#999999] hover:text-[#1A1A1A] ml-2 flex items-center gap-1"
                >
                  Next
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              )}
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
              {expandedFilters.price && filterOptions.priceMax > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-4">
                    <span>৳{priceMin.toLocaleString()}</span>
                    <span>৳{priceMax.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-4">
                    <label className="text-[10px] text-[#999] uppercase tracking-widest">Min Price
                      <input type="range" min={filterOptions.priceMin} max={filterOptions.priceMax} value={priceMin}
                        onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax))}
                        className="w-full mt-1 accent-[#1A1A1A]" />
                    </label>
                    <label className="text-[10px] text-[#999] uppercase tracking-widest">Max Price
                      <input type="range" min={filterOptions.priceMin} max={filterOptions.priceMax} value={priceMax}
                        onChange={(e) => setPriceMax(Math.max(Number(e.target.value), priceMin))}
                        className="w-full mt-1 accent-[#1A1A1A]" />
                    </label>
                  </div>
                </div>
              )}
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
                  {filterOptions.brands.map((brand) => (
                    <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                      <span className={`w-4 h-4 border flex items-center justify-center transition-all ${
                        selectedBrands.includes(brand) ? 'bg-[#1A1A1A] border-[#1A1A1A]' : 'border-[#E5E5E5] group-hover:border-[#1A1A1A]'
                      }`}>{selectedBrands.includes(brand) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}</span>
                      <span className="text-xs text-[#1A1A1A]" onClick={() => toggleCheckbox(brand, selectedBrands, setSelectedBrands)}>{brand}</span>
                    </label>
                  ))}
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
