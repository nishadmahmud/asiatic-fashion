"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);
    const [studioWishlist, setStudioWishlist] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const { showToast } = useToast();

    // Load wishlist from local storage on mount
    useEffect(() => {
        const storedWishlist = localStorage.getItem("wishlist");
        const storedStudioWishlist = localStorage.getItem("studioWishlist");
        
        if (storedWishlist) {
            try { setWishlist(JSON.parse(storedWishlist)); } catch (e) { console.error(e); }
        }
        if (storedStudioWishlist) {
            try { setStudioWishlist(JSON.parse(storedStudioWishlist)); } catch (e) { console.error(e); }
        }
        setIsInitialized(true);
    }, []);

    // Save wishlist to local storage whenever it changes
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem("wishlist", JSON.stringify(wishlist));
            localStorage.setItem("studioWishlist", JSON.stringify(studioWishlist));
        }
    }, [wishlist, studioWishlist, isInitialized]);

    const addToWishlist = (product) => {
        if (!isInWishlist(product.id)) {
            setWishlist((prev) => [...prev, product]);
            showToast({ ...product, message: "Added to Wishlist" });
        }
    };

    const removeFromWishlist = (productId) => {
        setWishlist((prev) => prev.filter((item) => item.id !== productId));
    };

    const toggleWishlist = (product) => {
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };

    const isInWishlist = (productId) => {
        return wishlist.some((item) => item.id === productId);
    };

    // Studio Wishlist logic
    const addToStudioWishlist = (post) => {
        if (!isInStudioWishlist(post.id)) {
            setStudioWishlist((prev) => [...prev, post]);
            showToast({ name: "Studio Post", message: "Added to Favorites" });
        }
    };

    const removeFromStudioWishlist = (postId) => {
        setStudioWishlist((prev) => prev.filter((item) => item.id !== postId));
    };

    const toggleStudioWishlist = (post) => {
        if (isInStudioWishlist(post.id)) {
            removeFromStudioWishlist(post.id);
        } else {
            addToStudioWishlist(post);
        }
    };

    const isInStudioWishlist = (postId) => {
        return studioWishlist.some((item) => item.id === postId);
    };

    return (
        <WishlistContext.Provider
            value={{
                wishlist,
                studioWishlist,
                addToWishlist,
                removeFromWishlist,
                toggleWishlist,
                isInWishlist,
                addToStudioWishlist,
                removeFromStudioWishlist,
                toggleStudioWishlist,
                isInStudioWishlist,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    return useContext(WishlistContext);
};
