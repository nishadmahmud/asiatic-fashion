"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { trackAddToCart } from "@/lib/gtm";

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [deliveryFee, setDeliveryFee] = useState(60); // Default Dhaka delivery

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('brand_empire_cart');
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (error) {
                console.error('Error loading cart:', error);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('brand_empire_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Add item to cart
    const addToCart = (product, quantity = 1, selectedSize = null, selectedColor = null, variantId = null, childVariantId = null) => {
        trackAddToCart({
            product,
            quantity,
            size: selectedSize,
            currency: "BDT",
        });

        setCartItems(prevItems => {
            // Check if item already exists with same size, color, and variant IDs
            const existingItemIndex = prevItems.findIndex(
                item => item.id === product.id &&
                    item.selectedSize === selectedSize &&
                    item.selectedColor === selectedColor &&
                    item.variantId === variantId &&
                    item.childVariantId === childVariantId
            );

            if (existingItemIndex > -1) {
                // Update quantity of existing item AND refresh product data
                const updatedItems = [...prevItems];
                const item = updatedItems[existingItemIndex];

                // Calculate stock limit
                let maxLimit = item.maxStock || 99;
                if (item.variantStockMap && item.selectedSize && item.variantStockMap[item.selectedSize] !== undefined) {
                    maxLimit = item.variantStockMap[item.selectedSize];
                }

                // Check if adding quantity would exceed limit
                if (item.quantity + quantity <= maxLimit) {
                    item.quantity += quantity;
                } else {
                    item.quantity = maxLimit; // Capped at max
                }

                // Update other product properties from the latest product data
                item.return_delivery_days = product.return_delivery_days || item.return_delivery_days || null;
                item.price = parseFloat(product.price);
                item.originalPrice = product.originalPrice ? parseFloat(product.originalPrice) : null;
                item.discount = product.discount || null;
                item.image = product.images?.[0] || product.image;
                item.brand = product.brand || item.brand;
                item.maxStock = product.currentStock || item.maxStock || 99;
                item.variantStockMap = product.variantStockMap || item.variantStockMap || {};
                item.availableSizes = product.sizes || item.availableSizes || [];

                return updatedItems;
            } else {
                // Add new item
                return [...prevItems, {
                    id: product.id,
                    name: product.name,
                    price: parseFloat(product.price),
                    originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : null,
                    discount: product.discount || null,
                    image: product.images?.[0] || product.image,
                    quantity: quantity,
                    selectedSize: selectedSize,
                    selectedColor: selectedColor,
                    variantId: variantId,
                    childVariantId: childVariantId,
                    brand: product.brand || null,
                    maxStock: product.currentStock || 99,
                    variantStockMap: product.variantStockMap || {},
                    availableSizes: product.sizes || [],
                    return_delivery_days: product.return_delivery_days || null,
                    selected: true
                }];
            }
        });
    };

    // Remove item from cart
    const removeFromCart = (productId, selectedSize = null, selectedColor = null, variantId = null, childVariantId = null) => {
        setCartItems(prevItems =>
            prevItems.filter(item =>
                !(item.id === productId &&
                    item.selectedSize === selectedSize &&
                    item.selectedColor === selectedColor &&
                    item.variantId === variantId &&
                    item.childVariantId === childVariantId)
            )
        );
    };

    // Update item quantity
    const updateQuantity = (productId, quantity, selectedSize = null, selectedColor = null, variantId = null, childVariantId = null) => {
        if (quantity <= 0) {
            removeFromCart(productId, selectedSize, selectedColor, variantId, childVariantId);
            return;
        }

        setCartItems(prevItems =>
            prevItems.map(item => {
                if (item.id === productId &&
                    item.selectedSize === selectedSize &&
                    item.selectedColor === selectedColor &&
                    item.variantId === variantId &&
                    item.childVariantId === childVariantId) {

                    // Calculate stock limit
                    let maxLimit = item.maxStock || 99;
                    if (item.variantStockMap && item.selectedSize && item.variantStockMap[item.selectedSize] !== undefined) {
                        maxLimit = item.variantStockMap[item.selectedSize];
                    }

                    return {
                        ...item,
                        quantity: Math.min(quantity, maxLimit)
                    };
                }
                return item;
            })
        );
    };

    // Update item size (Critical for Cart Page)
    const updateSize = (itemId, oldSize, newSize, selectedColor, oldVariantId, oldChildVariantId, newVariantId, newChildVariantId) => {
        setCartItems(prevItems => {
            // Check if there is ALREADY an item with the NEW size and IDs
            const targetItemIndex = prevItems.findIndex(
                item => item.id === itemId &&
                    item.selectedSize === newSize &&
                    item.selectedColor === selectedColor &&
                    item.variantId === newVariantId &&
                    item.childVariantId === newChildVariantId
            );

            const sourceItemIndex = prevItems.findIndex(
                item => item.id === itemId &&
                    item.selectedSize === oldSize &&
                    item.selectedColor === selectedColor &&
                    item.variantId === oldVariantId &&
                    item.childVariantId === oldChildVariantId
            );

            if (sourceItemIndex === -1) return prevItems;

            if (targetItemIndex > -1) {
                // Merge quantities
                const updatedItems = [...prevItems];
                const sourceItem = updatedItems[sourceItemIndex];
                const targetItem = updatedItems[targetItemIndex];

                // Calculate stock limit for target size
                let maxLimit = targetItem.maxStock || 99;
                if (targetItem.variantStockMap && targetItem.selectedSize && targetItem.variantStockMap[targetItem.selectedSize] !== undefined) {
                    maxLimit = targetItem.variantStockMap[targetItem.selectedSize];
                }

                const totalQty = targetItem.quantity + sourceItem.quantity;
                updatedItems[targetItemIndex].quantity = Math.min(totalQty, maxLimit);

                // Remove the old item
                updatedItems.splice(sourceItemIndex, 1);
                return updatedItems;
            } else {
                // Just update the size of the existing item
                const updatedItems = [...prevItems];
                const item = updatedItems[sourceItemIndex];

                // Calculate stock limit for NEW size
                let maxLimit = item.maxStock || 99;
                if (item.variantStockMap && newSize && item.variantStockMap[newSize] !== undefined) {
                    maxLimit = item.variantStockMap[newSize];
                }

                updatedItems[sourceItemIndex] = {
                    ...item,
                    selectedSize: newSize,
                    variantId: newVariantId,
                    childVariantId: newChildVariantId,
                    quantity: Math.min(item.quantity, maxLimit)
                };
                return updatedItems;
            }
        });
    };

    // Clear entire cart
    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem('brand_empire_cart');
    };

    // Toggle item selection
    const toggleItemSelection = (itemId, selectedSize, selectedColor, variantId, childVariantId) => {
        setCartItems(prevItems =>
            prevItems.map(item => {
                if (item.id === itemId &&
                    item.selectedSize === selectedSize &&
                    item.selectedColor === selectedColor &&
                    item.variantId === variantId &&
                    item.childVariantId === childVariantId) {
                    return { ...item, selected: !item.selected };
                }
                return item;
            })
        );
    };

    // Select or Deselect All
    const selectAllItems = (select = true) => {
        setCartItems(prevItems =>
            prevItems.map(item => ({ ...item, selected: select }))
        );
    };

    // Get total number of items (Physical count)
    const getCartCount = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    // Get total number of SELECTED items (Force Reload)
    const getSelectedCount = () => {
        return cartItems.reduce((total, item) => item.selected ? total + item.quantity : total, 0);
    };

    // Calculate subtotal (Selected only)
    const getSubtotal = () => {
        return cartItems.reduce((total, item) => item.selected ? total + (item.price * item.quantity) : total, 0);
    };

    // Calculate total (Selected only)
    const getTotal = () => {
        const subtotal = getSubtotal();
        return subtotal > 0 ? subtotal + deliveryFee : 0;
    };

    // Update delivery fee based on location
    const updateDeliveryFee = (fee) => {
        setDeliveryFee(fee);
    };

    // Toggle cart modal
    const toggleCart = () => {
        setIsCartOpen(!isCartOpen);
    };

    const value = {
        cartItems,
        isCartOpen,
        deliveryFee,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateSize,
        toggleItemSelection,
        selectAllItems,
        getSelectedCount,
        clearCart,
        getCartCount,
        getSubtotal,
        getTotal,
        updateDeliveryFee,
        toggleCart,
        setIsCartOpen
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
