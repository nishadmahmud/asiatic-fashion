"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Share2, Bookmark, ShoppingBag, ArrowLeft, Play, Pause, Heart } from "lucide-react";
import { getStudioList } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export default function StudioPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudioPosts = async () => {
            try {
                const response = await getStudioList();
                if (response.success && response.data?.data) {
                    // Transform API data to component format
                    const transformedPosts = response.data.data.map((item) => ({
                        id: item.id,
                        user: {
                            name: item.vendor?.name || "Brand Empire",
                            avatar: item.vendor?.vendor_logo || item.vendor?.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.vendor?.name || "BE"),
                            time: formatTimeAgo(item.created_at)
                        },
                        type: "video",
                        content: item.video_link,
                        description: item.description || "",
                        products: item.products?.map(product => ({
                            id: product.id,
                            name: product.name,
                            price: calculateDiscountedPrice(product.retails_price, product.discount),
                            originalPrice: product.retails_price,
                            discount: product.discount,
                            image: product.image_path
                        })) || []
                    }));
                    setPosts(transformedPosts);
                }
            } catch (error) {
                console.error("Error fetching studio posts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudioPosts();
    }, []);

    // Helper function to format time ago
    function formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        return date.toLocaleDateString();
    }

    // Helper function to calculate discounted price
    function calculateDiscountedPrice(price, discount) {
        if (!discount) return price;
        return Math.round(price - (price * discount / 100));
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
                {/* Header */}
                <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
                    <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href="/" className="md:hidden">
                                <ArrowLeft size={24} className="text-gray-700" />
                            </Link>
                            <div className="flex items-baseline gap-1">
                                <h1 className="text-xl font-black text-gray-900 tracking-tight">Brand</h1>
                                <span className="text-[10px] uppercase tracking-widest text-[#ff3f6c] font-bold">Studio</span>
                                <span className="bg-yellow-400 text-[10px] font-bold px-1 rounded text-black ml-1">NEW</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Loading State */}
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="md:columns-2 gap-6 space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden break-inside-avoid mb-6">
                                <div className="aspect-[4/5] bg-gray-200 animate-pulse" />
                                <div className="p-3">
                                    <div className="h-12 bg-gray-100 rounded animate-pulse mb-2" />
                                    <div className="h-16 bg-gray-100 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
                {/* Header */}
                <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
                    <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href="/" className="md:hidden">
                                <ArrowLeft size={24} className="text-gray-700" />
                            </Link>
                            <div className="flex items-baseline gap-1">
                                <h1 className="text-xl font-black text-gray-900 tracking-tight">Brand</h1>
                                <span className="text-[10px] uppercase tracking-widest text-[#ff3f6c] font-bold">Studio</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <ShoppingBag size={40} className="text-gray-300" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Studio Posts Yet</h2>
                    <p className="text-gray-500">Check back later for new style inspiration!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="md:hidden">
                            <ArrowLeft size={24} className="text-gray-700" />
                        </Link>
                        <div className="flex items-baseline gap-1">
                            <h1 className="text-xl font-black text-gray-900 tracking-tight">Brand</h1>
                            <span className="text-[10px] uppercase tracking-widest text-[#ff3f6c] font-bold">Studio</span>
                            <span className="bg-yellow-400 text-[10px] font-bold px-1 rounded text-black ml-1">NEW</span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-colors">
                            <Bookmark size={20} />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-colors">
                            <ShoppingBag size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Feed Content */}
            <div className="max-w-4xl mx-auto px-0 md:px-4 py-4 md:py-6">
                <div className="md:columns-2 gap-6 space-y-6">
                    {posts.map((post) => (
                        <StudioPost key={post.id} post={post} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Single Post Component - Always Open Layout
function StudioPost({ post }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = React.useRef(null);
    const { addToCart, setIsCartOpen } = useCart();
    const { toggleStudioWishlist, isInStudioWishlist } = useWishlist();

    const isWishlisted = isInStudioWishlist(post.id);

    const handleToggleWishlist = (e) => {
        e.stopPropagation();
        toggleStudioWishlist(post);
    };

    const togglePlayPause = (e) => {
        e.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: post.user.name,
                text: post.description,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div className="bg-white md:rounded-xl shadow-sm border-b md:border border-gray-100 overflow-hidden break-inside-avoid mb-6">
            {/* Post Header */}
            <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-gray-100 bg-gray-100">
                        <Image
                            src={post.user.avatar}
                            alt={post.user.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-gray-900">{post.user.name}</h3>
                        <p className="text-[10px] text-gray-500">{post.user.time}</p>
                    </div>
                </div>
            </div>

            {/* Video/Media Area */}
            <div className="relative aspect-[4/5] w-full bg-gray-100">
                {post.type === "video" ? (
                    <video
                        ref={videoRef}
                        src={post.content}
                        className="w-full h-full object-cover"
                        loop
                        muted
                        playsInline
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                    />
                ) : (
                    <Image
                        src={post.content}
                        alt={post.description}
                        fill
                        className="object-cover"
                    />
                )}

                {/* Overlay Action Buttons */}
                <div className="absolute bottom-4 right-4 flex flex-col gap-3">
                    {/* Wishlist Button - Toggles entire post */}
                    <button
                        onClick={handleToggleWishlist}
                        className={`w-10 h-10 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all ${isWishlisted ? 'bg-[var(--brand-royal-red)] text-white' : 'bg-white/90 text-gray-800'}`}
                    >
                        <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
                    </button>
                    {/* Play/Pause Button - Only for videos */}
                    {post.type === "video" && (
                        <button
                            onClick={togglePlayPause}
                            className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        >
                            {isPlaying ? (
                                <Pause size={20} className="text-gray-800" />
                            ) : (
                                <Play size={20} className="text-gray-800 ml-0.5" />
                            )}
                        </button>
                    )}
                    <button
                        onClick={handleShare}
                        className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    >
                        <Share2 size={20} className="text-gray-800" />
                    </button>
                </div>
            </div>

            {/* Products Row - Horizontal Scrollable */}
            {post.products.length > 0 && (
                <div className="px-3 py-2 border-b border-gray-100">
                    <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
                        {/* Shop All Button - Add all products to cart */}
                        <button
                            onClick={() => {
                                post.products.forEach(product => {
                                    addToCart({
                                        id: product.id,
                                        name: product.name,
                                        price: product.price,
                                        originalPrice: product.originalPrice,
                                        discount: product.discount,
                                        image: product.image
                                    }, 1);
                                });
                                setIsCartOpen(true);
                            }}
                            className="flex-shrink-0 w-10 h-10 rounded-full bg-[#ff3f6c]/10 flex items-center justify-center hover:bg-[#ff3f6c]/20 transition-colors"
                        >
                            <ShoppingBag size={18} className="text-[#ff3f6c]" />
                        </button>
                        <span className="text-[10px] text-[#ff3f6c] font-bold uppercase -ml-1">Shop All</span>

                        {/* Product Cards */}
                        {post.products.map((product) => (
                            <Link
                                key={product.id}
                                href={`/product/${product.id}`}
                                className="flex-shrink-0 flex items-center gap-2 bg-gray-50 rounded-lg p-1.5 pr-3 border border-gray-100 hover:border-gray-200 transition-colors"
                            >
                                <div className="relative w-12 h-14 rounded overflow-hidden bg-white">
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="min-w-[70px]">
                                    <p className="text-xs font-medium text-gray-900 truncate max-w-[80px]">{product.name.split(' ').slice(0, 2).join(' ')}</p>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-bold text-gray-900">৳{product.price}</span>
                                        {product.originalPrice > product.price && (
                                            <span className="text-[10px] text-gray-400 line-through">৳{product.originalPrice}</span>
                                        )}
                                    </div>
                                    {product.discount > 0 && (
                                        <span className="text-[10px] font-bold text-[#ff3f6c]">{product.discount}% OFF</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Description */}
            {post.description && (
                <div className="px-3 py-3">
                    <p className="text-sm text-gray-800 leading-relaxed">
                        <span className="font-bold mr-1">{post.user.name}</span>
                        {post.description}
                    </p>
                </div>
            )}
        </div>
    );
}
