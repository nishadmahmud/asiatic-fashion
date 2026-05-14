"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SizeChartModal from "@/components/SizeChartModal";
import ProductImageLightbox from "@/components/ProductImageLightbox";

import ProductCard from "@/components/ProductCard/ProductCard";
import { getProductById, getRelatedProduct, getCampaigns } from "@/lib/api";
import { transformProduct, buildCampaignDiscountMap } from "@/lib/transformProduct";
import { buildPdpProductFromApi, getDefaultVariantSelection } from "@/lib/productPdpFromApi";
import { readPdpSnapshot, writePdpSnapshot } from "@/lib/productSnapshot";
import { useCart } from "@/context/CartContext";

function applyPriceSaleRule(mrp, saleRule) {
  if (!mrp || mrp <= 0) return 0;
  if (!saleRule || saleRule.kind === "none") return mrp;
  if (saleRule.kind === "fixed") return Math.max(0, mrp - (Number(saleRule.value) || 0));
  const pct = Number(saleRule.value) || 0;
  return Math.max(0, Math.round(mrp * (1 - pct / 100)));
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  
  const { addToCart } = useCart();

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedLength, setSelectedLength] = useState(null);
  const [openAccordions, setOpenAccordions] = useState({
    description: true,
    materialCare: false,
    specs: false,
    additionalInfo: false,
  });
  const [currentMobileImage, setCurrentMobileImage] = useState(0);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const toggleAccordion = (section) => {
    setOpenAccordions((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Instant paint from session snapshot (listing or last full PDP), then API revalidates.
  useLayoutEffect(() => {
    if (!productId) return;
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate from sessionStorage before first paint */
    const snap = readPdpSnapshot(productId);
    if (snap?.pdp && String(snap.pdp.id) === String(productId)) {
      setProduct(snap.pdp);
      const sel = getDefaultVariantSelection({ product_variants: snap.pdp.product_variants || [] });
      setSelectedSize(sel.selectedSize);
      setSelectedLength(sel.selectedLength);
      setLoading(false);
    } else {
      setProduct(null);
      setLoading(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [productId]);

  // Always revalidate in background; write full PDP back to sessionStorage for next visit.
  useEffect(() => {
    if (!productId) return;

    let cancelled = false;
    const snap = readPdpSnapshot(productId);
    const hadUsableCache = !!(snap?.pdp && String(snap.pdp.id) === String(productId));

    const fetchProduct = async () => {
      if (!hadUsableCache) setLoading(true);
      try {
        const data = await getProductById(productId);

        if (cancelled) return;

        if (data.success && data.data) {
          const apiProduct = data.data;
          const transformed = buildPdpProductFromApi(apiProduct);
          setProduct(transformed);
          const sel = getDefaultVariantSelection(apiProduct);
          setSelectedSize(sel.selectedSize);
          setSelectedLength(sel.selectedLength);
          writePdpSnapshot(productId, transformed, { complete: true });
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  // Fetch related products
  useEffect(() => {
    if (!productId || !product) return;

    let cancelled = false;

    const fetchRelated = async () => {
      await Promise.resolve();
      if (cancelled) return;
      setRelatedProducts([]);
      try {
        let campaignMap = {};
        try {
          const campaignsRes = await getCampaigns();
          if (campaignsRes?.success && Array.isArray(campaignsRes?.campaigns?.data)) {
            const active = campaignsRes.campaigns.data.filter((c) => c?.status === "active");
            campaignMap = buildCampaignDiscountMap(active);
          }
        } catch (e) {}

        const response = await getRelatedProduct(productId);
        let relatedData = [];
        if (Array.isArray(response)) relatedData = response;
        else if (response.success && Array.isArray(response.data)) relatedData = response.data;

        if (relatedData.length > 0) {
          const transformed = relatedData
            .filter((item) => String(item.id) !== String(productId))
            .slice(0, 4)
            .map((p) => transformProduct(p, campaignMap));
          if (!cancelled) setRelatedProducts(transformed);
        }
      } catch (error) {
        console.error("Error fetching related products:", error);
      }
    };

    fetchRelated();
    return () => {
      cancelled = true;
    };
    // Only re-fetch when product id changes, not when the same product object is replaced after API refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- use product?.id on purpose
  }, [productId, product?.id]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (!cancelled) setCurrentMobileImage(0);
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  // MRP for selected variant (or product base); discount applied in getDisplayPrice via saleRule
  const getVariantMrp = () => {
    if (!product) return 0;
    if (selectedSize && product.variants?.[selectedSize]) {
      const variant = product.variants[selectedSize];
      let target = variant;
      if (selectedLength && variant.children) {
        const child = variant.children.find((c) => c.name === selectedLength);
        if (child) target = child;
      }
      const vPrice = target.price != null ? parseFloat(target.price) : 0;
      if (vPrice > 0) return vPrice;
    }
    return Number(product.retails_price) || 0;
  };

  const getDisplayPrice = () => {
    if (!product) return 0;
    const mrp = getVariantMrp();
    const rule = product.saleRule || { kind: "none", value: 0 };
    if (!rule || rule.kind === "none") {
      return mrp > 0 ? mrp : product.price;
    }
    return applyPriceSaleRule(mrp, rule);
  };

  const displayMrp = product ? getVariantMrp() : 0;
  const displayPrice = getDisplayPrice();

  const totalImages = Array.isArray(product?.image_paths) ? product.image_paths.length : 0;
  const hasMultipleImages = totalImages > 1;
  const goPrevMobileImage = () => {
    setCurrentMobileImage((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };
  const goNextMobileImage = () => {
    setCurrentMobileImage((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  };

  const openLightbox = (index) => {
    const i = Math.max(0, Math.min(index, totalImages > 0 ? totalImages - 1 : 0));
    setLightboxIndex(i);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setCurrentMobileImage(lightboxIndex);
    setLightboxOpen(false);
  };

  // Loading skeleton
  if (loading || !product) {
    return (
      <>
        <Header />
        <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12 py-10 bg-white">
          <div className="flex flex-col lg:flex-row gap-10 xl:gap-20 animate-pulse">
            <div className="w-full lg:w-[65%] flex flex-col gap-8">
              <div className="aspect-[3/4] bg-[#F8F8F6]"></div>
              <div className="aspect-[3/4] bg-[#F8F8F6]"></div>
            </div>
            <div className="w-full lg:w-[35%] space-y-4">
              <div className="h-8 bg-[#F8F8F6] w-3/4"></div>
              <div className="h-4 bg-[#F8F8F6] w-1/3"></div>
              <div className="h-6 bg-[#F8F8F6] w-1/4 mt-6"></div>
              <div className="h-12 bg-[#F8F8F6] w-full mt-6"></div>
              <div className="h-12 bg-[#F8F8F6] w-full"></div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const activeVariant = product.product_variants?.find((v) => v.name === selectedSize);
  const childVariants = activeVariant?.child_variants || [];
  const activeChildVariant = childVariants.find((v) => v.name === selectedLength);

  const handleAddToCart = () => {
    if (product.product_variants?.length > 0 && !selectedSize) {
      alert("Please select a size first.");
      return;
    }
    
    // We update the product object's price to the dynamic price so Cart uses the right price
    const productToAdd = {
      ...product,
      price: getDisplayPrice(),
    };

    addToCart(
      productToAdd,
      1,
      selectedSize,
      null, // selectedColor
      activeVariant?.id || null,
      activeChildVariant?.id || null
    );
  };

  const handleBuyNow = () => {
    if (product.product_variants?.length > 0 && !selectedSize) {
      alert("Please select a size first.");
      return;
    }
    
    const productToAdd = {
      ...product,
      price: getDisplayPrice(),
    };

    addToCart(
      productToAdd,
      1,
      selectedSize,
      null,
      activeVariant?.id || null,
      activeChildVariant?.id || null
    );

    router.push('/checkout');
  };

  return (
    <>
      <Header />
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12 py-6 md:py-10 bg-white">
        {/* Breadcrumbs */}
        <nav className="flex text-xs md:text-sm text-[#6B6B6B] mb-6 md:mb-10 font-medium tracking-wide">
          <ol className="flex items-center space-x-2">
            <li><Link href="/" className="hover:text-[#1A1A1A] transition-colors">Home</Link></li>
            <li><span className="mx-1 md:mx-2 text-[#E5E5E5]">{">"}</span></li>
            {product.category_name && (
              <>
                <li><span className="hover:text-[#1A1A1A] transition-colors">{product.category_name}</span></li>
                <li><span className="mx-1 md:mx-2 text-[#E5E5E5]">{">"}</span></li>
              </>
            )}
            <li className="text-[#1A1A1A] truncate max-w-[120px] sm:max-w-none">{product.name}</li>
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row gap-10 xl:gap-20 items-start">
          {/* Left Column: Image Gallery */}
          <div className="w-full lg:w-[65%] flex flex-col md:flex-row gap-4 md:gap-8">
            {/* Thumbnails (Sticky on Desktop) */}
            <div className="hidden md:flex flex-col gap-4 w-16 lg:w-20 shrink-0 sticky top-[130px] h-fit max-h-[80vh] overflow-y-auto scrollbar-hide">
              {product.image_paths.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => openLightbox(index)}
                  className="relative w-full aspect-[3/4] shrink-0 border border-transparent hover:border-[#1A1A1A] transition-all duration-300"
                >
                  <Image src={img} alt={`Thumbnail ${index + 1}`} fill unoptimized className="object-cover" />
                </button>
              ))}
            </div>

            {/* Main Scrolling Images */}
            <div className="flex-1 flex flex-col gap-4 md:gap-8 w-full">
              {/* Mobile carousel */}
              <div className="relative md:hidden w-full pb-4">
                <button
                  type="button"
                  onClick={() => openLightbox(currentMobileImage)}
                  className="relative block w-full cursor-zoom-in text-left aspect-[3/4] bg-[#F8F8F6]"
                  aria-label="View image full screen"
                >
                  <Image
                    src={product.image_paths[currentMobileImage]}
                    alt={`${product.name} - Image ${currentMobileImage + 1}`}
                    fill
                    priority={currentMobileImage === 0}
                    unoptimized
                    className="object-contain object-center pointer-events-none"
                    sizes="100vw"
                  />
                </button>
                {hasMultipleImages && (
                  <>
                    <button
                      type="button"
                      onClick={goPrevMobileImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center bg-white/90 text-[#1A1A1A] shadow-sm"
                      aria-label="Previous image"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={goNextMobileImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center bg-white/90 text-[#1A1A1A] shadow-sm"
                      aria-label="Next image"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Desktop vertical stacked images */}
              <div className="hidden md:flex flex-col gap-8 w-full">
                {product.image_paths.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    id={`product-image-${index}`}
                    onClick={() => openLightbox(index)}
                    className="relative block w-full cursor-zoom-in text-left aspect-[3/4] bg-[#F8F8F6] scroll-mt-[130px]"
                    aria-label={`View image ${index + 1} full screen`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} - Image ${index + 1}`}
                      fill
                      priority={index === 0}
                      unoptimized
                      className="object-contain object-center pointer-events-none"
                      sizes="(max-width: 1024px) 100vw, 65vw"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Product Details */}
          <div className="w-full lg:w-[35%] flex flex-col lg:sticky lg:top-[130px]">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-medium text-[#1A1A1A] mb-2 tracking-tight">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B6B6B] mb-6 tracking-widest uppercase">
                <span>{product.brand}</span>
                <span>SKU: {product.sku}</span>
              </div>

              {/* Price */}
              <div className="flex items-end gap-3 mb-8">
                <span className="text-xl sm:text-2xl font-medium text-[#1A1A1A]">
                  ৳{displayPrice.toLocaleString()}
                </span>
                {displayMrp > displayPrice && (
                  <span className="text-base text-[#999999] line-through font-normal">
                    ৳{displayMrp.toLocaleString()}
                  </span>
                )}
                {product.discountLabel && (
                  <span className="text-xs font-bold text-[#1A1A1A] bg-[#F8F8F6] px-2 py-1 tracking-wider">
                    {product.discountLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Color */}
            <div className="mb-8">
              <h4 className="text-sm text-[#1A1A1A] mb-3">
                Color: <span className="text-[#6B6B6B] capitalize">{product.color[0]}</span>
              </h4>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border border-[#1A1A1A] p-0.5">
                  <div className="w-full h-full" style={{ backgroundColor: product.color_code }}></div>
                </div>
              </div>
            </div>

            {/* Size */}
            {product.product_variants?.length > 0 && (() => {
              const selectedVariantForSize = product.product_variants.find(
                (v) => v.name === selectedSize
              );
              const selectedChildForSize =
                selectedVariantForSize?.child_variants?.find(
                  (c) => c.name === selectedLength
                );
              const availableQty = selectedChildForSize
                ? Number(selectedChildForSize.quantity) || 0
                : Number(selectedVariantForSize?.quantity) || 0;

              return (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm text-[#1A1A1A]">
                      {selectedSize ? (
                        <>
                          Size: <span className="text-[#6B6B6B]">{selectedSize}</span>
                          {availableQty > 0 && (
                            <span className="ml-2 text-xs text-[#6B6B6B]">
                              ({availableQty} available)
                            </span>
                          )}
                        </>
                      ) : (
                        "Select Size"
                      )}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsSizeChartOpen(true)}
                      className="text-xs text-[#1A1A1A] underline underline-offset-4 hover:text-[#6B6B6B] transition-colors"
                    >
                      Size Guide
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {product.product_variants.map((variant) => {
                      const isSelected = selectedSize === variant.name;
                      const isUnavailable = variant.quantity <= 0;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          disabled={isUnavailable}
                          onClick={() => {
                            setSelectedSize(variant.name);
                            setSelectedLength(variant.child_variants?.[0]?.name || null);
                          }}
                          className={`min-w-[3rem] px-4 h-11 flex items-center justify-center text-sm transition-all border relative
                            ${
                              isSelected
                                ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                                : "border-[#E5E5E5] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]"
                            }
                            ${
                              isUnavailable
                                ? "opacity-40 cursor-not-allowed line-through hover:border-[#E5E5E5]"
                                : ""
                            }
                          `}
                          aria-pressed={isSelected}
                          aria-label={`Size ${variant.name}${isUnavailable ? " (Out of Stock)" : ""}`}
                        >
                          {variant.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Length (Child Variants) */}
            {childVariants.length > 0 && (
              <div className="mb-10">
                <h4 className="text-sm text-[#1A1A1A] mb-3">Length</h4>
                <div className="flex flex-wrap gap-2">
                  {childVariants.map((lengthVariant) => (
                    <button
                      key={lengthVariant.id}
                      onClick={() => setSelectedLength(lengthVariant.name)}
                      className={`min-w-[3rem] px-4 h-10 flex items-center justify-center text-sm transition-all border
                        ${
                          selectedLength === lengthVariant.name
                            ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                            : "border-[#E5E5E5] bg-transparent text-[#1A1A1A] hover:border-[#1A1A1A]"
                        }
                      `}
                    >
                      {lengthVariant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 mb-10">
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={product.isOutOfStock}
                  onClick={handleAddToCart}
                  className="w-full bg-white text-[#1A1A1A] border border-[#1A1A1A] h-12 text-[10px] font-bold tracking-widest uppercase hover:bg-gray-50 transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {product.isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </button>
                <button
                  disabled={product.isOutOfStock}
                  onClick={handleBuyNow}
                  className="w-full bg-[#1A1A1A] text-white h-12 text-[10px] font-bold tracking-widest uppercase hover:bg-[#333333] transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {product.isOutOfStock ? "Out of Stock" : "Buy Now"}
                </button>
              </div>
              <button className="w-full bg-white text-[#1A1A1A] h-12 text-xs font-medium tracking-widest uppercase border border-[#1A1A1A] hover:bg-gray-50 transition-colors duration-300 flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                Wishlist
              </button>
            </div>

            {/* Info Accordions */}
            <div className="border-t border-[#E5E5E5]">
              <div className="py-4 border-b border-[#E5E5E5]">
                <button
                  onClick={() => toggleAccordion("description")}
                  className="w-full flex items-center justify-between text-sm text-[#1A1A1A]"
                >
                  <span className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    Description
                  </span>
                  <span>{openAccordions.description ? "−" : "+"}</span>
                </button>
                {openAccordions.description && product.description && (
                  <div className="mt-4 html-content">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: (product.description || "").replace(/&nbsp;/g, " "),
                      }}
                    />
                  </div>
                )}
              </div>

              {(product.materialCare?.material || product.materialCare?.wash) && (
                <div className="py-4 border-b border-[#E5E5E5]">
                  <button
                    onClick={() => toggleAccordion("materialCare")}
                    className="w-full flex items-center justify-between text-sm text-[#1A1A1A]"
                  >
                    <span className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 6h16M4 12h16M4 18h16"></path>
                      </svg>
                      Material & Care
                    </span>
                    <span>{openAccordions.materialCare ? "−" : "+"}</span>
                  </button>
                  {openAccordions.materialCare && (
                    <div className="mt-4 space-y-2 text-xs">
                      {product.materialCare?.material && (
                        <p className="text-[#1A1A1A]">
                          <span className="text-[#6B6B6B]">Material: </span>
                          {product.materialCare.material}
                        </p>
                      )}
                      {product.materialCare?.wash && (
                        <p className="text-[#1A1A1A]">
                          <span className="text-[#6B6B6B]">Care: </span>
                          {product.materialCare.wash}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {product.specifications?.length > 0 && (
                <div className="py-4 border-b border-[#E5E5E5]">
                  <button
                    onClick={() => toggleAccordion("specs")}
                    className="w-full flex items-center justify-between text-sm text-[#1A1A1A]"
                  >
                    <span className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                      Specifications
                    </span>
                    <span>{openAccordions.specs ? "−" : "+"}</span>
                  </button>
                  {openAccordions.specs && (
                    <div className="mt-4 space-y-2 text-xs">
                      {product.specifications.map((spec, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-[#6B6B6B]">{spec.name}</span>
                          <span className="text-[#1A1A1A]">{spec.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(product.manufacturerDetails ||
                product.packerDetails ||
                product.importerDetails ||
                product.sellerDetails ||
                product.countryOfOrigin ||
                product.sku) && (
                <div className="py-4 border-b border-[#E5E5E5]">
                  <button
                    onClick={() => toggleAccordion("additionalInfo")}
                    className="w-full flex items-center justify-between text-sm text-[#1A1A1A]"
                  >
                    <span className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                      Additional Information
                    </span>
                    <span>{openAccordions.additionalInfo ? "−" : "+"}</span>
                  </button>
                  {openAccordions.additionalInfo && (
                    <div className="mt-4 space-y-2 text-xs">
                      {product.manufacturerDetails && (
                        <p className="text-[#1A1A1A]"><span className="text-[#6B6B6B]">Manufacturer: </span>{product.manufacturerDetails}</p>
                      )}
                      {product.packerDetails && (
                        <p className="text-[#1A1A1A]"><span className="text-[#6B6B6B]">Packer: </span>{product.packerDetails}</p>
                      )}
                      {product.importerDetails && (
                        <p className="text-[#1A1A1A]"><span className="text-[#6B6B6B]">Importer: </span>{product.importerDetails}</p>
                      )}
                      {product.sellerDetails && (
                        <p className="text-[#1A1A1A]"><span className="text-[#6B6B6B]">Seller: </span>{product.sellerDetails}</p>
                      )}
                      {product.countryOfOrigin && (
                        <p className="text-[#1A1A1A]"><span className="text-[#6B6B6B]">Country of origin: </span>{product.countryOfOrigin}</p>
                      )}
                      {product.sku && (
                        <p className="text-[#1A1A1A]"><span className="text-[#6B6B6B]">Product code: </span>{product.sku}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="bg-white border-t border-[#E5E5E5] pb-10 mt-10">
          <section className="w-full max-w-[1600px] mx-auto px-4 md:px-12 py-10 md:py-16">
            <div className="mb-8 pb-4 border-b border-[#E5E5E5]">
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A]">
                Similar Products
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-8 sm:gap-y-16">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        </div>
      )}


      <Footer />
      <SizeChartModal
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
        product={product}
      />
      <ProductImageLightbox
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        images={product.image_paths}
        currentIndex={lightboxIndex}
        onIndexChange={setLightboxIndex}
        productName={product.name}
      />
    </>
  );
}
