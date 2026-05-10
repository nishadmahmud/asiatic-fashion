"use client";

import { createContext, useContext, useState, useEffect } from "react";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("wishlist");
    if (stored) {
      setWishlist(JSON.parse(stored));
    }
  }, []);

  const addToWishlist = (product) => {
    setWishlist((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev;
      const updated = [...prev, product];
      localStorage.setItem("wishlist", JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist((prev) => {
      const updated = prev.filter((item) => item.id !== productId);
      localStorage.setItem("wishlist", JSON.stringify(updated));
      return updated;
    });
  };

  const isInWishlist = (productId) => wishlist.some((item) => item.id === productId);

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
