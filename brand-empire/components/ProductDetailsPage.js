"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import ProductCard from "./ProductCard";
import { dummyProduct, similarProducts, customersAlsoLiked } from "@/data/productData";
import { searchLocation } from "@/data/deliveryData";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/context/ToastContext";
import { getProductById, getRelatedProduct, getProducts, getCategoriesFromServer, saveProductReview, getProductReviews, getCouponList } from "@/lib/api";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SizeChartModal from "./SizeChartModal";
import WriteReviewModal from "./WriteReviewModal";
import DOMPurify from 'isomorphic-dompurify';
import { trackViewItem } from "@/lib/gtm";

const ProductDetailsPage = ({ productId }) => {
    const searchParams = useSearchParams();
    const categoryIdFromUrl = searchParams.get('category');
    const subcategoryIdFromUrl = searchParams.get('subcategory');
    const childIdFromUrl = searchParams.get('child');

    // Breadcrumb state
    const [categoryName, setCategoryName] = useState("");
    const [subcategoryName, setSubcategoryName] = useState("");
    const [childName, setChildName] = useState("");

    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState("");
    const [selectedChildSize, setSelectedChildSize] = useState(""); // New state for child variant
    const [pincode, setPincode] = useState("");
    const [showOffers, setShowOffers] = useState(false);
    const [showLightbox, setShowLightbox] = useState(false);
    const [showSizeChart, setShowSizeChart] = useState(false);
    const [sizeError, setSizeError] = useState(false);
    const [product, setProduct] = useState(dummyProduct); // Start with dummy data
    const [loading, setLoading] = useState(true);
    const [relatedProducts, setRelatedProducts] = useState([]);

    const [categoryProducts, setCategoryProducts] = useState([]);

    // Coupons state for Best Offers section
    const [coupons, setCoupons] = useState([]);
    const viewedProductIdRef = useRef(null);

    const { user, openAuthModal } = useAuth();
    const router = useRouter();

    // Delivery autocomplete states
    const [deliveryQuery, setDeliveryQuery] = useState("");
    const [deliveryResults, setDeliveryResults] = useState([]);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [showDeliveryDropdown, setShowDeliveryDropdown] = useState(false);

    // Cart functionality
    const { addToCart, setIsCartOpen } = useCart();

    const { toggleWishlist, isInWishlist } = useWishlist();
    const { showToast } = useToast();

    const toNumber = (value) => {
        if (typeof value === "number") return value;
        if (typeof value === "string") {
            const parsed = parseFloat(value.replace(/[^0-9.]/g, ""));
            return Number.isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    };

    const buildProductFromSnapshot = (snapshot) => {
        const variantMap = {};
        const unavailableSizes = [];
        (snapshot.product_variants || []).forEach((v) => {
            variantMap[v.name] = { ...v, children: v.child_variants || [] };
            if ((v.quantity || 0) === 0) unavailableSizes.push(v.name);
        });

        const specsArray = Array.isArray(snapshot.specifications) ? snapshot.specifications : [];
        const specsObj = specsArray.reduce((acc, spec) => {
            if (spec?.name) acc[spec.name] = spec.description || "";
            return acc;
        }, {});

        const currentPrice = toNumber(snapshot.price);
        const currentMrp = snapshot.originalPrice ? toNumber(snapshot.originalPrice) : currentPrice;
        const fitSpec = specsArray.find((s) => String(s?.name || "").toLowerCase() === "fit")?.description || null;
        const washSpec = specsArray.find((s) => String(s?.name || "").toLowerCase().includes("wash"))?.description || null;
        const fabricSpec = specsArray.find((s) => String(s?.name || "").toLowerCase().includes("fabric"))?.description || null;

        return {
            ...dummyProduct,
            id: snapshot.id,
            code: String(snapshot.id),
            name: snapshot.name || dummyProduct.name,
            category: snapshot.category_name || "",
            price: currentPrice,
            mrp: currentMrp,
            discount: snapshot.discount || "",
            rating: snapshot.rating || 0,
            reviewCount: snapshot.reviewCount || snapshot.reviews || 0,
            brand: snapshot.brand || "Unknown Brand",
            images: (snapshot.images || []).filter((img) => typeof img === "string" && img.trim() !== ""),
            sizes: snapshot.sizes || [],
            variants: variantMap,
            unavailableSizes: snapshot.unavailableSizes?.length ? snapshot.unavailableSizes : unavailableSizes,
            currentStock: 0,
            stockStatus: "In Stock",
            isOutOfStock: false,
            color: snapshot.color || null,
            colorCode: snapshot.colorCode || null,
            details: { fit: fitSpec },
            materialCare: { material: fabricSpec, wash: washSpec },
            specifications: specsObj,
            manufacturerDetails: null,
            packerDetails: null,
            importerDetails: null,
            sellerDetails: null,
            return_delivery_days: null,
            offers: [],
            reviews: [],
            ratings: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            size_chart_category: null
        };
    };

    // Hydrate quickly from listing-card snapshot, then fetch full details in background.
    useEffect(() => {
        if (!productId) return;
        try {
            const raw = sessionStorage.getItem(`product_snapshot_${productId}`);
            if (!raw) return;
            const snapshot = JSON.parse(raw);
            const quickProduct = buildProductFromSnapshot(snapshot);
            if (quickProduct?.id) {
                setProduct(quickProduct);
                setLoading(false);
            }
        } catch (error) {
            console.error("Failed to hydrate product from snapshot:", error);
        }
    }, [productId]);

    // Fetch category names for breadcrumb
    useEffect(() => {
        const fetchCategoryNames = async () => {
            if (!categoryIdFromUrl) return;

            try {
                const response = await getCategoriesFromServer();
                if (response.success && response.data) {
                    const category = response.data.find(c => c.category_id == categoryIdFromUrl);
                    if (category) {
                        setCategoryName(category.name);

                        if (subcategoryIdFromUrl && category.sub_category) {
                            const subcat = category.sub_category.find(s => s.id == subcategoryIdFromUrl);
                            if (subcat) {
                                setSubcategoryName(subcat.name);

                                if (childIdFromUrl && subcat.child_categories) {
                                                                    const child = subcat.child_categories.find(c => c.id == childIdFromUrl);
                                    if (child) {
                                        setChildName(child.name);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching category names:", error);
            }
        };

        fetchCategoryNames();
    }, [categoryIdFromUrl, subcategoryIdFromUrl, childIdFromUrl]);

    // Fetch product data from API
    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) return;

            try {
                // Fetch product details
                const data = await getProductById(productId);

                // Fetch product reviews (New addition)
                let reviewsData = { summary: null, data: [] };
                try {
                    const reviewsRes = await getProductReviews(productId);
                    if (reviewsRes.success) {
                        reviewsData = reviewsRes;
                    }
                } catch (reviewErr) {
                    console.error("Error fetching reviews:", reviewErr);
                }

                if (data.success && data.data) {
                    const apiProduct = data.data;

                    // Transform API data to match our component's expected structure
                    let mrp = apiProduct.retails_price || 0;

                    // Fallback to variant price if MRP is 0
                    if (mrp === 0 && apiProduct.product_variants && apiProduct.product_variants.length > 0) {
                        const firstVariant = apiProduct.product_variants[0];
                        if (firstVariant.price && parseFloat(firstVariant.price) > 0) {
                            mrp = parseFloat(firstVariant.price);
                        }
                    }

                    let finalPrice = mrp;
                    let discountLabel = "";
                    let appliedDiscountType = null;
                    let appliedDiscountValue = 0;

                    // Check for Campaign first
                    if (apiProduct.campaigns && apiProduct.campaigns.length > 0) {
                        const campaign = apiProduct.campaigns[0];
                        let discountAmount = 0;
                        const discountType = campaign.discount_type ? String(campaign.discount_type).toLowerCase() : 'amount';
                        appliedDiscountType = discountType;
                        appliedDiscountValue = Number(campaign.discount || 0);

                        if (discountType === 'amount') {
                            discountAmount = campaign.discount;
                            discountLabel = `৳${campaign.discount} OFF`;
                        } else if (discountType === 'percentage') {
                            discountAmount = (mrp * campaign.discount) / 100;
                            discountLabel = `${campaign.discount}% OFF`;
                        }

                        finalPrice = mrp - discountAmount;
                        if (finalPrice < 0) finalPrice = 0;
                    } else if (apiProduct.discount > 0) {
                        const discountType = apiProduct.discount_type ? String(apiProduct.discount_type).toLowerCase() : 'percentage';
                        appliedDiscountType = discountType;
                        appliedDiscountValue = Number(apiProduct.discount || 0);

                        if (discountType === 'amount') {
                            finalPrice = mrp - apiProduct.discount;
                            discountLabel = `৳${apiProduct.discount} OFF`;
                        } else {
                            finalPrice = Math.round(mrp * (1 - apiProduct.discount / 100));
                            discountLabel = `${apiProduct.discount}% OFF`;
                        }
                        if (finalPrice < 0) finalPrice = 0;
                    }

                    // Check if product is out of stock
                    const isOutOfStock = apiProduct.current_stock === 0 || apiProduct.status === "Stock Out";

                    // Get variant stock info and structure
                    const variantMap = {}; // Map size name to variant object
                    const unavailableSizes = [];

                    if (apiProduct.product_variants) {
                        apiProduct.product_variants.forEach(v => {
                            // Store full variant info
                            variantMap[v.name] = {
                                ...v,
                                children: v.child_variants || []
                            };

                            // Check stock availability
                            if (v.child_variants && v.child_variants.length > 0) {
                                const allChildrenNoStock = v.child_variants.every(c => c.quantity === 0);
                                if (allChildrenNoStock) unavailableSizes.push(v.name);
                            } else {
                                if (v.quantity === 0) unavailableSizes.push(v.name);
                            }
                        });
                    }

                    const productCodeFromUrl = String(productId || "").replace(/\D/g, "");

                    const transformedProduct = {
                        id: apiProduct.id,
                        code: productCodeFromUrl || String(productId || apiProduct.id || ""),
                        name: apiProduct.name,
                        category: apiProduct.category?.name || apiProduct.category_name || "",
                        price: finalPrice,
                        mrp: mrp,
                        discount: discountLabel,
                        discountType: appliedDiscountType,
                        discountValue: appliedDiscountValue,
                        rating: reviewsData.summary?.average_rating || apiProduct.rating || 0,
                        reviewCount: reviewsData.summary?.total_reviews || 0,
                        brand: apiProduct.brand?.name || apiProduct.brand_name || "Unknown Brand",
                        images: (Array.isArray(apiProduct.image_paths) && apiProduct.image_paths.length > 0
                            ? apiProduct.image_paths
                            : Array.isArray(apiProduct.images) && apiProduct.images.length > 0
                                ? apiProduct.images
                                : apiProduct.gallery ? JSON.parse(apiProduct.gallery) : [apiProduct.image])
                            .filter(img => typeof img === 'string' && img.trim() !== ""),
                        sizes: apiProduct.product_variants ? apiProduct.product_variants.map(v => v.name).filter(Boolean) : [],
                        variants: variantMap,
                        unavailableSizes: unavailableSizes,
                        currentStock: apiProduct.current_stock || 0,
                        stockStatus: apiProduct.status || "In Stock",
                        isOutOfStock: isOutOfStock,
                        description: apiProduct.description,
                        details: {
                            fit: apiProduct.specifications?.find(s => s.name === "Fit")?.description || null
                        },
                        materialCare: {
                            material: apiProduct.specifications?.find(s => s.name?.toLowerCase().includes('fabric'))?.description || null,
                            wash: apiProduct.specifications?.find(s => s.name?.toLowerCase().includes('wash') || s.name?.toLowerCase().includes('care'))?.description || null
                        },
                        specifications: apiProduct.specifications && apiProduct.specifications.length > 0
                            ? apiProduct.specifications.reduce((acc, spec) => {
                                acc[spec.name] = spec.description;
                                return acc;
                            }, {})
                            : {},
                        manufacturerDetails: apiProduct.manufacturer_details || null,
                        packerDetails: apiProduct.packer_details || null,
                        importerDetails: apiProduct.importer_details || null,
                        sellerDetails: apiProduct.seller_details || null,
                        country: apiProduct.country_of_origin || apiProduct.country || null,
                        return_delivery_days: apiProduct.return_delivery_days || null,
                        offers: apiProduct.offers || [],
                        reviews: reviewsData.data || [],
                        ratings: reviewsData.summary?.rating_counts || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                        size_chart_category: apiProduct.size_chart_category || null
                    };

                    setProduct(transformedProduct);
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    useEffect(() => {
        if (loading || !product?.id) return;
        if (String(viewedProductIdRef.current) === String(product.id)) return;

        trackViewItem({
            product,
            currency: "BDT",
        });

        viewedProductIdRef.current = product.id;
    }, [loading, product]);

    // Fetch related products
    useEffect(() => {
        let isCancelled = false;

        const getVariantSizeData = (variants = []) => {
            const safeVariants = Array.isArray(variants) ? variants : [];
            const sizes = [...new Set(
                safeVariants.map((variant) => variant?.name).filter(Boolean)
            )];

            const unavailableSizes = [...new Set(
                safeVariants
                    .filter((variant) => {
                        if (Array.isArray(variant?.child_variants) && variant.child_variants.length > 0) {
                            return variant.child_variants.every((child) => Number(child?.quantity || 0) <= 0);
                        }
                        return Number(variant?.quantity || 0) <= 0;
                    })
                    .map((variant) => variant?.name)
                    .filter(Boolean)
            )];

            return { sizes, unavailableSizes };
        };

        const fetchRelatedProducts = async () => {
            if (!productId || loading) return;

            try {
                const response = await getRelatedProduct(productId);
                let relatedData = [];
                if (Array.isArray(response)) {
                    relatedData = response;
                } else if (response.success && Array.isArray(response.data)) {
                    relatedData = response.data;
                }

                if (relatedData.length > 0) {
                    const transformedRelated = relatedData
                        .filter(item => item.id != productId)
                        .map(item => {
                            const mrp = item.retails_price || 0;
                            let finalPrice = mrp;
                            let discountLabel = "";
                            if (item.discount > 0) {
                                const discountType = item.discount_type ? String(item.discount_type).toLowerCase() : 'percentage';
                                if (discountType === 'amount') {
                                    finalPrice = mrp - item.discount;
                                    discountLabel = `৳${item.discount} OFF`;
                                } else {
                                    finalPrice = Math.round(mrp * (1 - item.discount / 100));
                                    discountLabel = `${item.discount}% OFF`;
                                }
                                if (finalPrice < 0) finalPrice = 0;
                            }
                            return {
                                id: item.id,
                                brand: item.brand_name || item.brands?.name || "BRAND",
                                name: item.name,
                                price: `৳ ${finalPrice.toLocaleString()}`,
                                originalPrice: item.discount > 0 ? `৳ ${mrp.toLocaleString()}` : "",
                                discount: discountLabel,
                                images: (Array.isArray(item.image_paths) && item.image_paths.length > 0
                                    ? item.image_paths
                                    : [item.image_path, item.image_path1, item.image_path2])
                                    .filter(img => typeof img === 'string' && img.trim() !== ''),
                                ...getVariantSizeData(item.product_variants),
                                color: item.color || "gray",
                                rating: item.review_summary?.average_rating || 0,
                                reviews: item.review_summary?.total_reviews || 0,
                            };
                        });

                    if (isCancelled) return;
                    setRelatedProducts(transformedRelated);

                    transformedRelated.forEach((relatedProduct) => {
                        const hasSizes = Array.isArray(relatedProduct.sizes) && relatedProduct.sizes.length > 0;
                        if (hasSizes) return;

                        getProductById(relatedProduct.id)
                            .then((detailResponse) => {
                                const detailProduct = detailResponse?.success ? detailResponse?.data : null;
                                const { sizes, unavailableSizes } = getVariantSizeData(detailProduct?.product_variants);
                                if (isCancelled || sizes.length === 0) return;

                                setRelatedProducts((prevProducts) =>
                                    prevProducts.map((productItem) =>
                                        productItem.id === relatedProduct.id
                                            ? { ...productItem, sizes, unavailableSizes }
                                            : productItem
                                    )
                                );
                            })
                            .catch((detailError) => {
                                console.error(`Error fetching related product details for ${relatedProduct.id}:`, detailError);
                            });
                    });
                } else {
                    if (!isCancelled) setRelatedProducts([]);
                }
            } catch (error) {
                console.error("Error fetching related products:", error);
                if (!isCancelled) setRelatedProducts([]);
            }
        };
        const deferHandle = setTimeout(() => {
            fetchRelatedProducts();
        }, 0);

        return () => {
            isCancelled = true;
            clearTimeout(deferHandle);
        };
    }, [productId, loading]);

    // Fetch coupons
    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const response = await getCouponList();
                if (response.success && response.data) setCoupons(response.data);
            } catch (error) {
                console.error("Error fetching coupons:", error);
                setCoupons([]);
            }
        };
        fetchCoupons();
    }, []);

    // Fetch customers also liked
    useEffect(() => {
        const fetchCategoryProducts = async () => {
            const categoryToUse = categoryIdFromUrl || product.categoryId;
            if (!categoryToUse) return;

            try {
                const response = await getProducts(1, categoryToUse);
                if (response.success && response.data && response.data.length > 0) {
                    const transformedCategory = response.data
                        .filter(item => item.id != productId)
                        .slice(0, 4)
                        .map(item => {
                            const mrp = item.retails_price || 0;
                            let finalPrice = mrp;
                            let discountLabel = "";
                            if (item.discount > 0) {
                                const discountType = item.discount_type ? String(item.discount_type).toLowerCase() : 'percentage';
                                if (discountType === 'amount') {
                                    finalPrice = mrp - item.discount;
                                    discountLabel = `৳${item.discount} OFF`;
                                } else {
                                    finalPrice = Math.round(mrp * (1 - item.discount / 100));
                                    discountLabel = `${item.discount}% OFF`;
                                }
                                if (finalPrice < 0) finalPrice = 0;
                            }
                            return {
                                id: item.id,
                                brand: item.brand_name || item.brands?.name || "BRAND",
                                name: item.name,
                                price: `৳ ${finalPrice.toLocaleString()}`,
                                originalPrice: item.discount > 0 ? `৳ ${mrp.toLocaleString()}` : "",
                                discount: discountLabel,
                                images: (Array.isArray(item.image_paths) && item.image_paths.length > 0
                                    ? item.image_paths
                                    : [item.image_path, item.image_path1, item.image_path2])
                                    .filter(img => typeof img === 'string' && img.trim() !== ''),
                                sizes: item.product_variants && item.product_variants.length > 0
                                    ? item.product_variants.map(v => v.name)
                                    : ["S", "M", "L", "XL"],
                                unavailableSizes: item.product_variants && item.product_variants.length > 0
                                    ? item.product_variants.filter(v => v.quantity === 0).map(v => v.name)
                                    : [],
                                color: item.color || "gray",
                                rating: item.review_summary?.average_rating || 0,
                                reviews: item.review_summary?.total_reviews || 0,
                            };
                        })
                        .filter(item => item.images && item.images.length > 0);
                    setCategoryProducts(transformedCategory);
                }
            } catch (error) {
                console.error("Error fetching category products:", error);
                setCategoryProducts([]);
            }
        };
        fetchCategoryProducts();
    }, [categoryIdFromUrl, productId]);

    // Handle Add to Bag
    const handleAddToBag = () => {
        if (!selectedSize) {
            setSizeError(true);
            document.getElementById('size-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const selectedVariant = product.variants?.[selectedSize];
        if (selectedVariant?.children?.length > 0 && !selectedChildSize) {
            setSizeError(true);
            return;
        }

        setSizeError(false);

        let sizeName = selectedSize;
        let variantId = selectedVariant?.id || null;
        let childVariantId = null;

        if (selectedChildSize && selectedVariant?.children) {
            const child = selectedVariant.children.find(c => c.name === selectedChildSize);
            if (child) {
                childVariantId = child.id;
                sizeName = `${selectedSize} - ${selectedChildSize}`;
            }
        }

        addToCart(product, 1, sizeName, null, variantId, childVariantId);
        showToast(product);
    };

    const handleOrderNow = () => {
        if (!selectedSize) {
            setSizeError(true);
            document.getElementById('size-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const selectedVariant = product.variants?.[selectedSize];
        if (selectedVariant?.children?.length > 0 && !selectedChildSize) {
            setSizeError(true);
            return;
        }

        setSizeError(false);

        let sizeName = selectedSize;
        let variantId = selectedVariant?.id || null;
        let childVariantId = null;

        if (selectedChildSize && selectedVariant?.children) {
            const child = selectedVariant.children.find(c => c.name === selectedChildSize);
            if (child) {
                childVariantId = child.id;
                sizeName = `${selectedSize} - ${selectedChildSize}`;
            }
        }

        addToCart(product, 1, sizeName, null, variantId, childVariantId);
        router.push('/checkout');
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!showLightbox) return;
            if (e.key === 'Escape') setShowLightbox(false);
            else if (e.key === 'ArrowLeft') setSelectedImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
            else if (e.key === 'ArrowRight') setSelectedImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showLightbox, product.images.length]);

    useEffect(() => {
        if (showLightbox) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [showLightbox]);

    // Inline details toggle state
    const [activeTab, setActiveTab] = useState('details');

    // Calculate dynamic price based on selection
    let currentPrice = product.price;
    let currentMrp = product.mrp;
    let currentDiscount = product.discount;

    if (selectedSize && product.variants) {
        const variant = product.variants[selectedSize];
        if (variant) {
            let targetVariant = variant;
            if (selectedChildSize && variant.children) {
                const child = variant.children.find(c => c.name === selectedChildSize);
                if (child) targetVariant = child;
            }

            // Check for variant specific price
            const vPrice = targetVariant.price ? parseFloat(targetVariant.price) : 0;
            if (vPrice > 0) {
                const vMrp = targetVariant.retails_price ? parseFloat(targetVariant.retails_price) : 0;
                currentMrp = vMrp > 0 ? vMrp : vPrice;

                // Product-level discount applies to all variants.
                if (product.discountType && Number(product.discountValue) > 0) {
                    if (product.discountType === "amount") {
                        currentPrice = Math.max(0, currentMrp - Number(product.discountValue));
                    } else {
                        currentPrice = Math.max(0, Math.round(currentMrp * (1 - Number(product.discountValue) / 100)));
                    }
                    currentDiscount = product.discount;
                } else {
                    currentPrice = vPrice;
                    if (currentMrp > currentPrice) {
                        const diff = currentMrp - currentPrice;
                        const percent = Math.round((diff / currentMrp) * 100);
                        currentDiscount = `${percent}% OFF`;
                    }
                }
            }
        }
    }
    
    // Dynamic Size Label Logic
    const isAllNumericSizes = product.sizes.length > 0 && product.sizes.every(size => !isNaN(parseFloat(size)));
    const productContext = (product.name + " " + (categoryName || "") + " " + (subcategoryName || "")).toLowerCase();
    const isBottoms = productContext.includes("pant") || productContext.includes("trouser") || productContext.includes("jeans") || productContext.includes("pajama") || productContext.includes("chinos") || productContext.includes("legging");
    const isTops = productContext.includes("shirt") || productContext.includes("t-shirt") || productContext.includes("polo") || productContext.includes("jacket") || productContext.includes("top") || productContext.includes("kurta") || productContext.includes("sweatshirt") || productContext.includes("hoodie");

    let sizeLabel = "Size";
    if (isAllNumericSizes) {
        if (isBottoms) sizeLabel = "Waist Size";
        else if (isTops) sizeLabel = "Chest Size";
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--brand-royal-red)]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="w-[90%] max-w-[1600px] mx-auto py-4 border-b border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                    <a href="/" className="hover:text-black">Home</a>
                    {categoryName && (
                        <><span>/</span><a href={`/category/${categoryIdFromUrl}`} className="hover:text-black">{categoryName}</a></>
                    )}
                    {subcategoryName && (
                        <><span>/</span><a href={`/category/${categoryIdFromUrl}?subcategory=${subcategoryIdFromUrl}`} className="hover:text-black">{subcategoryName}</a></>
                    )}
                    {childName && (
                        <><span>/</span><a href={`/category/${categoryIdFromUrl}?subcategory=${subcategoryIdFromUrl}&child=${childIdFromUrl}`} className="hover:text-black">{childName}</a></>
                    )}
                    <span>/</span>
                    <span className="text-black font-medium truncate max-w-[200px]">{product.name}</span>
                </div>
            </div>

            <div className="w-[90%] max-w-[1600px] mx-auto py-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Images */}
                    <div className="relative md:hidden w-full h-[500px]">
                        <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full w-full" onScroll={(e) => setSelectedImage(Math.round(e.currentTarget.scrollLeft / e.currentTarget.offsetWidth))}>
                            {product.images.map((img, index) => (
                                <div key={index} className="w-full h-full flex-shrink-0 snap-center relative bg-gray-100" onClick={() => { setSelectedImage(index); setShowLightbox(true); }}>
                                    <Image src={img} alt={`${product.name} view ${index + 1}`} fill className="object-cover" draggable={false} />
                                </div>
                            ))}
                        </div>
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                            {product.images.map((_, index) => (
                                <div key={index} className={`w-2 h-2 rounded-full transition-all ${selectedImage === index ? 'bg-[var(--brand-royal-red)] w-4' : 'bg-gray-300'}`}></div>
                            ))}
                        </div>
                    </div>
                    <div className="hidden md:grid grid-cols-2 gap-0.5 h-fit">
                        {product.images.map((img, index) => (
                            <div key={index} className="relative w-full h-[500px] bg-gray-100 cursor-zoom-in overflow-hidden group" onClick={() => { setSelectedImage(index); setShowLightbox(true); }}>
                                <Image src={img} alt={`${product.name} view ${index + 1}`} fill className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105" draggable={false} />
                            </div>
                        ))}
                    </div>

                    {/* Right: Info */}
                    <div className="space-y-6 sticky top-24 h-fit">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-1">{product.brand}</h2>
                            <div className="flex items-center gap-3">
                                <h1 className="text-lg text-gray-600 flex-1">{product.name}</h1>
                                <button onClick={() => { if (!user) openAuthModal('login'); else toggleWishlist(product); }} className={`p-2 rounded-full transition-colors flex-shrink-0 ${isInWishlist(product.id) ? 'text-[var(--brand-royal-red)] bg-red-50' : 'text-gray-400 hover:text-[var(--brand-royal-red)] hover:bg-red-50'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isInWishlist(product.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pb-6 border-b border-gray-200">
                            <div className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm font-bold"><span>{product.rating}</span><span>★</span></div>
                            <span className="text-sm text-gray-600">{product.reviewCount} Ratings</span>
                        </div>

                        <div className="flex items-center gap-3 pb-6 border-b border-gray-200">
                            <span className="text-2xl font-bold text-gray-900">৳{currentPrice?.toLocaleString()}</span>
                            {currentMrp > currentPrice && (
                                <><span className="text-lg text-gray-400 line-through">MRP ৳{currentMrp?.toLocaleString()}</span>{currentDiscount && <span className="text-[var(--brand-royal-red)] font-bold">({currentDiscount})</span>}</>
                            )}
                        </div>
                        <p className="text-xs text-green-600 font-medium -mt-4">inclusive of all taxes</p>

                        {product.isOutOfStock && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                <span className="text-red-600 font-semibold">Currently Out of Stock</span>
                            </div>
                        )}

                        {/* Size Selector */}
                        <div id="size-selector" className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold uppercase">Select {sizeLabel}</h3>
                                <button onClick={() => setShowSizeChart(true)} className="text-sm text-[var(--brand-royal-red)] font-bold hover:underline flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12V4h16v16h-8"></path><path d="M4 8h16"></path><path d="M4 16h8"></path><path d="M8 4v4"></path><path d="M12 4v4"></path><path d="M16 4v4"></path><path d="M8 12v4"></path></svg>
                                    SIZE CHART
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
                                {product.sizes.map((size, index) => {
                                    const isOutOfStock = product.unavailableSizes?.includes(size) || product.isOutOfStock;
                                    return (
                                        <button key={`size-${index}-${size}`} onClick={() => { if (!isOutOfStock) { setSelectedSize(size); setSelectedChildSize(""); setSizeError(false); } }} disabled={isOutOfStock} className={`min-w-11 h-11 sm:min-w-14 sm:h-14 px-3 sm:px-4 rounded-full border-2 font-bold text-xs sm:text-sm transition-all relative flex items-center justify-center whitespace-nowrap ${selectedSize === size ? 'border-[var(--brand-royal-red)] text-[var(--brand-royal-red)]' : isOutOfStock ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>
                                            {size}
                                            {isOutOfStock && <span className="absolute inset-0 flex items-center justify-center"><span className="w-full h-[2px] bg-gray-300 rotate-45 absolute"></span></span>}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Child Variant Selector (e.g. Length) */}
                            {selectedSize && product.variants?.[selectedSize]?.children?.length > 0 && (
                                <div className="mt-6 animate-fade-in">
                                    <h3 className="text-sm font-bold uppercase mb-4">
                                        {product.variants[selectedSize].children[0]?.variant_group?.name || "Select Length"}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 sm:gap-3">
                                        {product.variants[selectedSize].children.map((child, idx) => {
                                            const isChildOutOfStock = child.quantity === 0;
                                            const isLength = (child.variant_group?.name || "").toLowerCase().includes("length");
                                            
                                            return (
                                                <button 
                                                    key={`child-${idx}-${child.name}`} 
                                                    onClick={() => !isChildOutOfStock && setSelectedChildSize(child.name)} 
                                                    disabled={isChildOutOfStock} 
                                                    className={`min-w-14 px-4 h-12 flex items-center justify-center font-bold text-sm transition-all border-2 relative ${
                                                        selectedChildSize === child.name 
                                                            ? 'border-black bg-black text-white' 
                                                            : isChildOutOfStock 
                                                                ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50' 
                                                                : 'border-gray-300 text-gray-700 hover:border-black'
                                                    } ${isLength ? 'rounded-none' : 'rounded-lg'}`}
                                                >
                                                    {child.name}
                                                    {isChildOutOfStock && <span className="absolute inset-0 flex items-center justify-center"><span className="w-full h-[1px] bg-gray-300 rotate-45 absolute"></span></span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {sizeError && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-red-700 text-sm animate-shake"><span className="font-medium">Please select an option</span></div>}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={handleAddToBag} disabled={product.isOutOfStock} className={`flex-1 py-4 rounded font-bold text-sm uppercase transition-colors flex items-center justify-center gap-2 ${product.isOutOfStock ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[var(--brand-royal-red)] text-white hover:bg-[#a01830]'}`}>
                                {product.isOutOfStock ? 'Out of Stock' : 'Add to Bag'}
                            </button>
                            <button onClick={handleOrderNow} disabled={product.isOutOfStock} className={`flex-1 px-6 py-4 border-2 rounded font-bold text-sm uppercase transition-colors flex items-center justify-center gap-2 ${product.isOutOfStock ? 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed' : 'border-[var(--brand-royal-red)] text-[var(--brand-royal-red)] bg-red-50 hover:bg-red-100'}`}>
                                {product.isOutOfStock ? 'Unavailable' : 'Order Now'}
                            </button>
                        </div>

                        {/* Delivery */}
                        <div className="pb-6 border-b border-gray-200">
                            <h3 className="text-sm font-bold uppercase mb-4">Delivery Options</h3>
                            <div className="relative">
                                <div className="flex gap-2">
                                    <input type="text" placeholder="Enter your district or area" value={deliveryQuery} onChange={(e) => { setDeliveryQuery(e.target.value); if (e.target.value.length >= 2) { setDeliveryResults(searchLocation(e.target.value)); setShowDeliveryDropdown(true); } else { setDeliveryResults([]); setShowDeliveryDropdown(false); } }} onFocus={() => { if (deliveryResults.length > 0) setShowDeliveryDropdown(true); }} className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[var(--brand-royal-red)]" />
                                    <button onClick={() => { if (deliveryResults.length > 0) { setSelectedDelivery(deliveryResults[0]); setShowDeliveryDropdown(false); } }} className="px-6 py-2 text-[var(--brand-royal-red)] font-bold border border-[var(--brand-royal-red)] rounded hover:bg-red-50 transition-colors">Check</button>
                                </div>
                                {showDeliveryDropdown && deliveryResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                                        {deliveryResults.map((result, index) => (
                                            <button key={index} onClick={() => { setSelectedDelivery(result); setDeliveryQuery(result.name); setShowDeliveryDropdown(false); }} className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0">
                                                <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-900">{result.name}</p><p className="text-xs text-gray-500">{result.deliveryTime} • ৳{result.deliveryCharge}</p></div></div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {selectedDelivery && (
                                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1"><h4 className="font-bold text-sm text-gray-900 mb-2">Delivery Available</h4><p className="text-sm">Estimated: <strong className="text-green-700">{selectedDelivery.deliveryTime}</strong></p></div>
                                    </div>
                                </div>
                            )}
                            {product.return_delivery_days && (
                                <div className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                                    <span>{product.return_delivery_days}</span>
                                </div>
                            )}
                        </div>

                        {/* Offers */}
                        <div className="pb-6 border-b border-gray-200">
                            <button onClick={() => setShowOffers(!showOffers)} className="w-full flex items-center justify-between text-sm font-bold uppercase mb-4"><span>Best Offers</span></button>
                            {showOffers && (
                                <div className="space-y-3">
                                    {(() => {
                                        const validCoupons = coupons.filter((coupon) => {
                                            const offerText = coupon?.title || coupon?.name || coupon?.code || coupon?.description;
                                            return typeof offerText === "string" && offerText.trim().length > 0;
                                        });

                                        if (validCoupons.length === 0) {
                                            return <p className="text-sm text-gray-500">No offers available at the moment.</p>;
                                        }

                                        return validCoupons.map((coupon, index) => {
                                            const offerText = coupon.title || coupon.name || coupon.code || coupon.description;
                                            return (
                                                <div key={coupon.id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-200"><p className="text-sm">{offerText}</p></div>
                                            );
                                        });
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Details Sections */}
                        <details open className="border-b border-gray-200 pb-6 group">
                            <summary className="text-sm font-bold uppercase cursor-pointer flex items-center justify-between list-none">
                                <span>Product Details</span>
                                <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </summary>
                            <div className="mt-4 html-content">
                                <div dangerouslySetInnerHTML={{ __html: (product.description || "").replace(/&nbsp;/g, " ") }} />
                                {product.details?.fit && <div className="mt-4"><h4 className="font-bold mb-2">Size & Fit</h4><p>{product.details.fit}</p></div>}
                            </div>
                        </details>

                        {(product.materialCare?.material || product.materialCare?.wash) && (
                            <details open className="border-b border-gray-200 pb-6 group">
                                <summary className="text-sm font-bold uppercase cursor-pointer flex items-center justify-between list-none">
                                    <span>Material & Care</span>
                                    <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </summary>
                                <div className="mt-4 text-sm text-gray-700">{product.materialCare.material && <p>{product.materialCare.material}</p>}{product.materialCare.wash && <p>{product.materialCare.wash}</p>}</div>
                            </details>
                        )}

                        {product.specifications && Object.keys(product.specifications).length > 0 && (
                            <details open className="border-b border-gray-200 py-6 group">
                                <summary className="text-sm font-bold uppercase cursor-pointer flex items-center justify-between list-none">
                                    <span>Specifications</span>
                                    <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </summary>
                                <div className="mt-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                        {Object.entries(product.specifications).slice(0, activeTab === 'all_specs' ? undefined : 6).map(([key, value]) => (
                                            <div key={key} className="border-b border-gray-100 pb-2"><p className="text-xs text-gray-500 mb-1">{key}</p><p className="text-base font-medium text-gray-900 leading-tight">{value}</p></div>
                                        ))}
                                    </div>
                                    {Object.keys(product.specifications).length > 6 && <button onClick={() => setActiveTab(activeTab === 'all_specs' ? 'details' : 'all_specs')} className="text-[var(--brand-royal-red)] text-sm font-bold uppercase hover:underline mt-2">{activeTab === 'all_specs' ? 'See Less' : 'See More'}</button>}
                                </div>
                            </details>
                        )}

                        {/* Additional Information */}
                        {(product.manufacturerDetails || product.packerDetails || product.importerDetails || product.sellerDetails) && (
                            <details className="border-b border-gray-200 py-6 group">
                                <summary className="text-sm font-bold uppercase cursor-pointer flex items-center justify-between list-none">
                                    <span>Additional Information</span>
                                    <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </summary>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4">
                                    {product.manufacturerDetails && (
                                        <div className="border-b border-gray-100 pb-2">
                                            <p className="text-xs text-gray-500 mb-1">Manufacturer Details</p>
                                            <p className="text-sm font-medium text-gray-900 leading-tight">{product.manufacturerDetails}</p>
                                        </div>
                                    )}
                                    {product.packerDetails && (
                                        <div className="border-b border-gray-100 pb-2">
                                            <p className="text-xs text-gray-500 mb-1">Packer Details</p>
                                            <p className="text-sm font-medium text-gray-900 leading-tight">{product.packerDetails}</p>
                                        </div>
                                    )}
                                    {product.importerDetails && (
                                        <div className="border-b border-gray-100 pb-2">
                                            <p className="text-xs text-gray-500 mb-1">Importer Details</p>
                                            <p className="text-sm font-medium text-gray-900 leading-tight">{product.importerDetails}</p>
                                        </div>
                                    )}
                                    {product.code && (
                                        <div className="border-b border-gray-100 pb-2">
                                            <p className="text-xs text-gray-500 mb-1">Product Code</p>
                                            <p className="text-sm font-medium text-gray-900 leading-tight">{product.code}</p>
                                        </div>
                                    )}
                                    {product.country && (
                                        <div className="border-b border-gray-100 pb-2">
                                            <p className="text-xs text-gray-500 mb-1">Country of Origin</p>
                                            <p className="text-sm font-medium text-gray-900 leading-tight">{product.country}</p>
                                        </div>
                                    )}
                                    {product.sellerDetails && (
                                        <div className="md:col-span-2 border-b border-gray-100 pb-2">
                                            <p className="text-xs text-gray-500 mb-1">Seller Details</p>
                                            <p className="text-sm font-medium text-gray-900 leading-tight">{product.sellerDetails}</p>
                                        </div>
                                    )}
                                </div>
                            </details>
                        )}

                        <RatingsSection product={product} />
                    </div>
                </div>

                {relatedProducts.length > 0 && <SimilarProductsSection products={relatedProducts} />}
                {categoryProducts.length > 0 && <CustomersAlsoLikedSection products={categoryProducts} />}
            </div>

            {/* Image Lightbox */}
            {showLightbox && (
                <div
                    className="fixed inset-0 bg-white md:bg-gray-900/60 md:backdrop-blur-[3px] z-[100] flex items-center justify-center p-0 md:p-8"
                    onClick={() => setShowLightbox(false)}
                >
                    {/* Shrink-wrapped Content Container */}
                    <div className="relative w-full h-full md:w-auto md:h-auto md:inline-block flex items-center justify-center bg-white md:bg-transparent" onClick={(e) => e.stopPropagation()}>

                        {/* Close Button - Mobile: Top Left, Desktop: Top Right */}
                        <button
                            onClick={() => setShowLightbox(false)}
                            className="absolute top-4 left-4 md:left-auto md:right-2 z-50 md:z-40 text-black md:bg-white/90 md:hover:bg-white md:text-gray-900 p-2 rounded-full transition-colors md:shadow-lg"
                            aria-label="Close"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>

                        {/* Previous Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
                            }}
                            className="absolute left-2 md:-left-14 top-1/2 -translate-y-1/2 z-40 bg-white/80 md:bg-white hover:bg-gray-100 text-gray-900 p-3 rounded-full transition-colors shadow-lg"
                            aria-label="Previous image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>

                        {/* Next Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
                            }}
                            className="absolute right-2 md:-right-14 top-1/2 -translate-y-1/2 z-40 bg-white/80 md:bg-white hover:bg-gray-100 text-gray-900 p-3 rounded-full transition-colors shadow-lg"
                            aria-label="Next image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>

                        {/* Thumbnail Strip - Vertical Overlay Top Left (Desktop Only) */}
                        <div
                            className="hidden md:flex absolute left-4 top-4 z-30 flex-col max-h-[80vh] overflow-y-auto no-scrollbar"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {product.images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`relative w-14 h-16 flex-shrink-0 overflow-hidden transition-all ${selectedImage === index
                                        ? 'opacity-100 z-10'
                                        : 'opacity-70 hover:opacity-100'
                                        }`}
                                >
                                    <Image
                                        src={img}
                                        alt={`Thumbnail ${index + 1}`}
                                        width={56}
                                        height={64}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>

                        {/* Main Image */}
                        <div className="relative w-full h-full md:w-auto md:h-auto flex items-center justify-center">
                            <Image
                                src={product.images[selectedImage]}
                                alt={product.name}
                                width={1400}
                                height={1800}
                                className="w-full h-auto max-h-full md:h-[95vh] md:w-auto md:max-w-[90vw] object-contain md:rounded md:shadow-2xl"
                            />
                        </div>
                    </div>
                </div>
            )}

            <SizeChartModal isOpen={showSizeChart} onClose={() => setShowSizeChart(false)} product={product} />
        </div>
    );
};

const RatingsSection = ({ product }) => {
    const { user, openAuthModal } = useAuth();
    const [showReviewModal, setShowReviewModal] = useState(false);
    return (
        <details open className="border-b border-gray-200 pb-6">
            <summary className="text-sm font-bold uppercase cursor-pointer flex items-center gap-2"><span>Ratings & Reviews</span></summary>
            <div className="mt-6">
                <div className="mb-8 p-8 bg-gray-50 rounded-lg text-center">
                    <h4 className="font-bold text-lg mb-2">Have you used this product?</h4>
                    <button onClick={() => { if (!user) openAuthModal('login'); else setShowReviewModal(true); }} className="bg-[var(--brand-royal-red)] text-white px-8 py-3 rounded font-bold text-sm uppercase">Write a Review</button>
                </div>
                <div className="flex items-start gap-8 mb-8">
                    <div className="text-center"><div className="text-4xl font-bold mb-1">{product.rating} ★</div><p className="text-sm text-gray-600">{product.reviewCount} Verified Buyers</p></div>
                </div>
                <div className="space-y-8">
                    {product.reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-8 last:border-0">
                            <div className="flex items-start justify-between mb-3"><div className="flex items-center gap-3"><p className="text-sm font-bold text-gray-900">{review.customer?.name || review.author}</p></div></div>
                            <div className="html-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((review.comment || review.text || "").replace(/&nbsp;/g, " ")) }} />
                        </div>
                    ))}
                </div>
            </div>
            <WriteReviewModal product={product} productId={product.id} open={showReviewModal} onClose={() => setShowReviewModal(false)} />
        </details>
    );
};

const SimilarProductsSection = ({ products }) => (
    <div className="mt-12 border-t border-gray-200 pt-8"><h3 className="text-xl font-bold mb-6 uppercase">Similar Products</h3><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div></div>
);

const CustomersAlsoLikedSection = ({ products }) => (
    <div className="mt-12 border-t border-gray-200 pt-8"><h3 className="text-xl font-bold mb-6 uppercase">Customers Also Liked</h3><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div></div>
);

export default ProductDetailsPage;
