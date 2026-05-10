import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";

const ProductCard = ({ product, tag, categoryId, onClick }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { user, openAuthModal } = useAuth();
    const router = useRouter();
    const inWishlist = isInWishlist(product.id);

    const handleAddToCart = (e) => {
        e.preventDefault(); // Prevent Link navigation
        addToCart(product, 1);
    };

    const handleCardClick = (e) => {
        try {
            if (product?.id) {
                const snapshot = {
                    id: product.id,
                    name: product.name,
                    brand: product.brand,
                    price: product.price,
                    originalPrice: product.originalPrice,
                    discount: product.discount,
                    images: product.images || [],
                    sizes: product.sizes || [],
                    unavailableSizes: product.unavailableSizes || [],
                    color: product.color || null,
                    colorCode: product.colorCode || null,
                    rating: product.rating || 0,
                    reviews: product.reviews || 0,
                    reviewCount: product.reviewCount || product.reviews || 0,
                    product_variants: product.product_variants || [],
                    specifications: product.specifications || [],
                    category_id: product.categoryId || product.category_id || null,
                    category_name: product.category_name || null,
                };
                sessionStorage.setItem(`product_snapshot_${product.id}`, JSON.stringify(snapshot));
            }
        } catch (error) {
            console.error("Failed to cache product snapshot:", error);
        }

        if (onClick) onClick(e);
    };


    useEffect(() => {
        let interval;
        const validImages = (product.images || []).filter(img => img && img.trim() !== '');
        if (isHovered && validImages.length > 1) {
            interval = setInterval(() => {
                setCurrentImageIndex((prev) => (prev + 1) % validImages.length);
            }, 1500); // Smooth sliding appreciation
        } else {
            setCurrentImageIndex(0);
        }
        return () => clearInterval(interval);
    }, [isHovered, product.images]);

    // Build product URL with optional category parameter
    const productUrl = categoryId
        ? `/product/${product.id}?category=${categoryId}`
        : `/product/${product.id}`;

    // Price Fallback Logic
    let displayPrice = product.price;
    const rawPrice = String(product.price).replace(/[^0-9.]/g, '');
    const isPriceZero = !product.price || parseFloat(rawPrice) === 0;

    if (isPriceZero && product.product_variants && product.product_variants.length > 0) {
        const vPrice = product.product_variants[0].price;
        // Ensure formatting matches (if product.price was just number, keep it number. If it had "TK", add it?)
        // Assuming if passed as number string "3199.00", we just show it. 
        // But usually cards show "TK 3199.00".
        // If input product.price was "TK 0.00", we should probably output "TK 3199.00".
        // Let's assume we maintain the prefix if it existed, or just output the value if uncertain.
        // Safer: If original has "TK", add "TK ".
        const hasTK = String(product.price).includes("TK");
        displayPrice = hasTK ? `TK ${parseFloat(vPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : vPrice;
    }

    return (
        <Link href={productUrl} onClick={handleCardClick}>
            <div
                className="group relative cursor-pointer w-full" // Removed min-w for better mobile grid
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Image Container */}
                <div className="relative h-[350px] sm:h-[400px] w-full overflow-hidden bg-gray-100 rounded-sm">

                    {/* Tag Badge (e.g., JUST IN) */}
                    {tag && (
                        <div className="absolute top-0 left-0 bg-white/90 backdrop-blur-sm px-2 py-1 z-10">
                            <span className="text-[10px] font-bold tracking-wider uppercase text-black">{tag}</span>
                        </div>
                    )}

                    {/* Sliding Track */}
                    <div
                        className="absolute top-0 left-0 w-full h-full flex transition-transform duration-700 ease-in-out"
                        style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                    >
                        {(product.images || []).filter(img => img && img.trim() !== '').map((img, index) => (
                            <div key={index} className="relative w-full h-full flex-shrink-0">
                                <Image
                                    src={img}
                                    alt={`${product.name} view ${index + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Wishlist Icon */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation(); // detailed prevents navigation
                            if (!user) {
                                openAuthModal('login');
                                return;
                            }
                            toggleWishlist(product);
                        }}
                        className={`absolute top-2 right-2 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-300 z-10 hover:scale-110 ${inWishlist ? "opacity-100 text-[var(--brand-royal-red)]" : "opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[var(--brand-royal-red)]"
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={inWishlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>

                    {/* Add to Cart Button */}
                    <button
                        onClick={handleAddToCart}
                        className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm py-3 font-bold uppercase text-sm tracking-wider text-black hover:bg-[var(--brand-royal-red)] hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-full group-hover:translate-y-0 z-10"
                    >
                        Add to Cart
                    </button>
                    {/* Size Overlay - Clean Professional Look */}
                    {product.sizes && product.sizes.length > 0 && (
                        <div className={`absolute bottom-2 left-2 right-2 bg-white shadow-md px-4 py-3 transform transition-all duration-300 ease-out z-10 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
                            <div className="flex flex-wrap justify-center items-center gap-1.5 px-1">
                                {product.sizes.map((size, index) => {
                                    const isUnavailable = product.unavailableSizes?.includes(size);
                                    return (
                                        <span
                                            key={`size-${index}-${size}`}
                                            className={`relative text-sm font-medium ${isUnavailable ? 'text-gray-300 cursor-not-allowed' : 'text-gray-800 hover:text-[var(--brand-royal-red)] cursor-pointer'}`}
                                        >
                                            {size}
                                            {/* Strikethrough for unavailable */}
                                            {isUnavailable && (
                                                <span className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-300 -rotate-45 transform origin-center"></span>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Product Details */}
                <div className="mt-3 px-1">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{product.brand}</h4>
                    <h3 className="text-sm font-medium text-gray-900 truncate mb-1" title={product.name}>{product.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-extrabold text-gray-900" style={{ fontWeight: 800 }}>{displayPrice}</span>
                        {product.originalPrice && (
                            <span className="text-xs text-gray-400 line-through">{product.originalPrice}</span>
                        )}
                        {product.discount && (
                            <span className="text-xs text-[var(--brand-royal-red)] font-bold">({product.discount})</span>
                        )}
                    </div>

                    {/* Color Dot - Hide if Default */}
                    {product.color && product.color !== 'Default' && (
                        <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border border-gray-200 p-[2px]`}>
                                <div
                                    className="w-full h-full rounded-full"
                                    style={{ backgroundColor: product.colorCode || product.color }}
                                    title={product.color}
                                ></div>
                            </div>
                            <span className="text-[10px] text-gray-500 uppercase">{product.color}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
