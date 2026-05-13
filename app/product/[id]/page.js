"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SizeChartModal from "@/components/SizeChartModal";

import ProductCard from "@/components/ProductCard/ProductCard";
import { getProductById, getRelatedProduct, getCampaigns } from "@/lib/api";
import { transformProduct, buildCampaignDiscountMap } from "@/lib/transformProduct";
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
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [currentMobileImage, setCurrentMobileImage] = useState(0);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  const toggleAccordion = (section) => {
    setOpenAccordions((prev) => ({ ...prev, [section]: !prev[section] }));
  };
  const isFixedDiscountType = (type) => {
    const normalized = String(type || "").toLowerCase();
    return normalized === "amount" || normalized === "fixed";
  };
  const decodeAndNormalizeHtml = (html) =>
    String(html || "")
      .replace(/&nbsp;/g, " ")
      .trim();

  // Fetch product data
  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await getProductById(productId);

        if (data.success && data.data) {
          const apiProduct = data.data;

          // Price calculation
          let mrp = Number(apiProduct.retails_price || 0);
          if (mrp === 0 && apiProduct.product_variants?.length > 0) {
            const firstVariant = apiProduct.product_variants[0];
            if (firstVariant.price && parseFloat(firstVariant.price) > 0) {
              mrp = parseFloat(firstVariant.price);
            }
          }

          let finalPrice = mrp;
          let discountLabel = "";
          /** So variant-level prices get the same fixed / percent discount as the base MRP. */
          let saleRule = { kind: "none", value: 0 };

          // Campaign discount
          if (apiProduct.campaigns && apiProduct.campaigns.length > 0) {
            const campaign = apiProduct.campaigns[0];
            const discountType = String(campaign.discount_type || "amount").toLowerCase();
            if (isFixedDiscountType(discountType)) {
              const amt = Number(campaign.discount) || 0;
              saleRule = { kind: "fixed", value: amt };
              finalPrice = Math.max(0, mrp - amt);
              discountLabel = `৳${campaign.discount} OFF`;
            } else {
              const pct = Number(campaign.discount) || 0;
              saleRule = { kind: "percent", value: pct };
              finalPrice = Math.max(0, Math.round(mrp * (1 - pct / 100)));
              discountLabel = `${campaign.discount}% OFF`;
            }
          } else if (apiProduct.discount > 0) {
            const discountType = String(apiProduct.discount_type || "percentage").toLowerCase();
            if (isFixedDiscountType(discountType)) {
              const amt = Number(apiProduct.discount) || 0;
              saleRule = { kind: "fixed", value: amt };
              finalPrice = Math.max(0, mrp - amt);
              discountLabel = `৳${apiProduct.discount} OFF`;
            } else {
              const pct = Number(apiProduct.discount) || 0;
              saleRule = { kind: "percent", value: pct };
              finalPrice = Math.max(0, Math.round(mrp * (1 - pct / 100)));
              discountLabel = `${apiProduct.discount}% OFF`;
            }
          }

          // Build variant map
          const variantMap = {};
          const unavailableSizes = [];
          (apiProduct.product_variants || []).forEach((v) => {
            variantMap[v.name] = { ...v, children: v.child_variants || [] };
            if (v.child_variants && v.child_variants.length > 0) {
              if (v.child_variants.every((c) => c.quantity === 0)) unavailableSizes.push(v.name);
            } else if (v.quantity === 0) {
              unavailableSizes.push(v.name);
            }
          });

          // Build images
          const images =
            Array.isArray(apiProduct.image_paths) && apiProduct.image_paths.length > 0
              ? apiProduct.image_paths
              : [apiProduct.image_path, apiProduct.image_path1, apiProduct.image_path2].filter(
                  (img) => typeof img === "string" && img.trim() !== ""
                );

          const specsArray = Array.isArray(apiProduct.specifications)
            ? apiProduct.specifications
            : [];
          const resolvedDescription = decodeAndNormalizeHtml(
            apiProduct.description || apiProduct.short_description || ""
          );
          const materialSpec =
            specsArray.find((s) =>
              String(s?.name || "")
                .toLowerCase()
                .includes("fabric")
            )?.description ||
            specsArray.find((s) =>
              String(s?.name || "")
                .toLowerCase()
                .includes("material")
            )?.description ||
            null;
          const washSpec =
            specsArray.find((s) =>
              String(s?.name || "")
                .toLowerCase()
                .includes("wash")
            )?.description ||
            specsArray.find((s) =>
              String(s?.name || "")
                .toLowerCase()
                .includes("care")
            )?.description ||
            null;

          const transformed = {
            id: apiProduct.id,
            name: apiProduct.name,
            sku: String(apiProduct.id),
            brand: apiProduct.brand?.name || apiProduct.brand_name || "ASIATIC",
            category_name: apiProduct.category?.name || apiProduct.category_name || "",
            retails_price: mrp,
            price: finalPrice,
            discount: apiProduct.discount || 0,
            discountLabel,
            saleRule,
            image_paths: images,
            color: [apiProduct.color || "Default"],
            color_code: apiProduct.color_code || "#1A1A1A",
            product_variants: apiProduct.product_variants || [],
            variants: variantMap,
            unavailableSizes,
            specifications: specsArray,
            description: resolvedDescription,
            short_description: decodeAndNormalizeHtml(apiProduct.short_description || ""),
            materialCare: {
              material: materialSpec,
              wash: washSpec,
            },
            manufacturerDetails: apiProduct.manufacturer_details || null,
            packerDetails: apiProduct.packer_details || null,
            importerDetails: apiProduct.importer_details || null,
            sellerDetails: apiProduct.seller_details || null,
            countryOfOrigin: apiProduct.country_of_origin || apiProduct.country || null,
            size_chart_category: apiProduct.size_chart_category || null,
            current_stock: apiProduct.current_stock || 0,
            isOutOfStock: apiProduct.current_stock === 0,
          };

          setProduct(transformed);

          // Set default selected size
          if (apiProduct.product_variants?.length > 0) {
            const firstAvailable = apiProduct.product_variants.find((v) => v.quantity > 0);
            if (firstAvailable) {
              setSelectedSize(firstAvailable.name);
              setSelectedLength(firstAvailable.child_variants?.[0]?.name || null);
            } else {
              setSelectedSize(apiProduct.product_variants[0].name);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Fetch related products
  useEffect(() => {
    if (!productId || loading) return;

    const fetchRelated = async () => {
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
          setRelatedProducts(transformed);
        }
      } catch (error) {
        console.error("Error fetching related products:", error);
      }
    };

    fetchRelated();
  }, [productId, loading]);

  useEffect(() => {
    setCurrentMobileImage(0);
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

  const scrollToImage = (index) => {
    const element = document.getElementById(`product-image-${index}`);
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const totalImages = Array.isArray(product?.image_paths) ? product.image_paths.length : 0;
  const hasMultipleImages = totalImages > 1;
  const goPrevMobileImage = () => {
    setCurrentMobileImage((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };
  const goNextMobileImage = () => {
    setCurrentMobileImage((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
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
            <li><a href="/" className="hover:text-[#1A1A1A] transition-colors">Home</a></li>
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
                  onClick={() => scrollToImage(index)}
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
                <div className="relative w-full aspect-[3/4] bg-[#F8F8F6]">
                  <Image
                    src={product.image_paths[currentMobileImage]}
                    alt={`${product.name} - Image ${currentMobileImage + 1}`}
                    fill
                    priority={currentMobileImage === 0}
                    unoptimized
                    className="object-contain object-center"
                    sizes="100vw"
                  />
                </div>
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
                  <div key={index} id={`product-image-${index}`} className="relative w-full aspect-[3/4] bg-[#F8F8F6] scroll-mt-[130px]">
                    <Image src={img} alt={`${product.name} - Image ${index + 1}`} fill priority={index === 0} unoptimized className="object-contain object-center" sizes="(max-width: 1024px) 100vw, 65vw" />
                  </div>
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
            {product.product_variants.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm text-[#1A1A1A]">Size</h4>
                  <button
                    type="button"
                    onClick={() => setIsSizeChartOpen(true)}
                    className="text-xs text-[#1A1A1A] underline underline-offset-4 hover:text-[#6B6B6B] transition-colors"
                  >
                    Size Guide
                  </button>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                    className="w-full h-12 border border-[#E5E5E5] px-4 text-sm text-[#1A1A1A] bg-transparent flex items-center justify-between hover:border-[#1A1A1A] transition-colors"
                  >
                    <span>{selectedSize || "Select a size"}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`transition-transform duration-300 ${isSizeDropdownOpen ? "rotate-180" : ""}`}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  {isSizeDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#1A1A1A] shadow-xl z-20 max-h-60 overflow-y-auto">
                      {product.product_variants.map((variant) => (
                        <button
                          key={variant.id}
                          disabled={variant.quantity <= 0}
                          onClick={() => {
                            setSelectedSize(variant.name);
                            setSelectedLength(variant.child_variants?.[0]?.name || null);
                            setIsSizeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-[#E5E5E5]/50 last:border-0
                            ${selectedSize === variant.name ? "bg-gray-50 font-medium" : "hover:bg-gray-50"}
                            ${variant.quantity <= 0 ? "opacity-40 cursor-not-allowed" : "text-[#1A1A1A]"}
                          `}
                        >
                          {variant.name} {variant.quantity <= 0 ? "(Out of Stock)" : ""}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

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
                  <div
                    className="mt-4 prose prose-sm max-w-none text-[#6B6B6B] font-light leading-relaxed text-xs"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
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

              {product.specifications.length > 0 && (
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
    </>
  );
}
