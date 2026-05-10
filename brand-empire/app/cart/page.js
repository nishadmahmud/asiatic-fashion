"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getProductById } from "@/lib/api";

const CartPage = () => {
    const {
        cartItems,
        removeFromCart,
        updateQuantity,
        updateSize,
        toggleItemSelection,
        selectAllItems,
        getSelectedCount,
        getSubtotal,
        deliveryFee,
        getTotal
    } = useCart();

    const { user, openAuthModal } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [openSizeModal, setOpenSizeModal] = React.useState(null); // stores item ID to show modal for
    const [fetchedProducts, setFetchedProducts] = React.useState({});

    // Temporary selection state for the modal
    const [tempSelection, setTempSelection] = React.useState({
        size: "",
        childSize: "",
        variantId: null,
        childVariantId: null
    });

    // Fetch full product details for items in bag to handle size/variant changes
    React.useEffect(() => {
        const fetchDetails = async () => {
            let updated = false;
            const newFetched = { ...fetchedProducts };
            
            for (const item of cartItems) {
                if (!newFetched[item.id]) {
                    try {
                        const res = await getProductById(item.id);
                        if (res.success && res.data) {
                            newFetched[item.id] = res.data;
                            updated = true;
                        }
                    } catch (err) {
                        console.error("Error fetching product details for cart:", err);
                    }
                }
            }
            
            if (updated) {
                setFetchedProducts(newFetched);
            }
        };

        if (cartItems.length > 0) {
            fetchDetails();
        }
    }, [cartItems, fetchedProducts]);

    const handleOpenSizeModal = (item) => {
        setOpenSizeModal(item);
        
        // Try to parse the name if it's combined "Size - Child"
        let size = item.selectedSize || "";
        let childSize = "";
        if (size.includes(" - ")) {
            [size, childSize] = size.split(" - ");
        }

        setTempSelection({
            size: size,
            childSize: childSize,
            variantId: item.variantId,
            childVariantId: item.childVariantId
        });
    };

    const handleUpdateSize = () => {
        if (!openSizeModal) return;

        let finalSizeName = tempSelection.size;
        if (tempSelection.childSize) {
            finalSizeName = `${tempSelection.size} - ${tempSelection.childSize}`;
        }

        updateSize(
            openSizeModal.id, 
            openSizeModal.selectedSize, 
            finalSizeName, 
            openSizeModal.selectedColor, 
            openSizeModal.variantId, 
            openSizeModal.childVariantId, 
            tempSelection.variantId, 
            tempSelection.childVariantId
        );
        
        setOpenSizeModal(null);
    };

    // Format price helper function
    const formatPrice = (amount) => {
        return `TK ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Helper to calculate total MRP (Selected Items Only)
    const getTotalMRP = () => {
        return cartItems.reduce((total, item) => {
            if (!item.selected) return total;
            const price = item.originalPrice || item.price;
            return total + (price * item.quantity);
        }, 0);
    };

    const totalMRP = getTotalMRP();
    const subTotal = getSubtotal();
    const totalDiscount = totalMRP - subTotal;
    const selectedCount = getSelectedCount();
    const allSelected = cartItems.length > 0 && cartItems.every(item => item.selected);

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 pb-10">
                <div className="text-center max-w-md px-4">
                    <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--brand-royal-red)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Your Bag is Empty</h2>
                    <p className="text-gray-500 mb-8 text-sm">
                        Looks like you haven&apos;t added anything to your bag yet.
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-12 py-3 bg-[var(--brand-royal-red)] text-white font-bold uppercase text-xs tracking-wider rounded shadow hover:bg-red-700 transition-colors"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    // Modal data helpers
    const currentProductDetails = openSizeModal ? fetchedProducts[openSizeModal.id] : null;
    const selectedVariant = currentProductDetails?.product_variants?.find(v => v.name === tempSelection.size);
    const hasChildVariants = selectedVariant?.child_variants?.length > 0;
    const isChildRequired = hasChildVariants;

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <div className="max-w-[1000px] mx-auto px-4 pt-6">

                {/* Header Row */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={(e) => selectAllItems(e.target.checked)}
                                className="w-4 h-4 text-[var(--brand-royal-red)] border-gray-300 rounded focus:ring-[var(--brand-royal-red)]"
                            />
                            <span className="text-sm font-bold text-gray-700 uppercase">
                                {selectedCount} / {cartItems.length} ITEMS SELECTED
                            </span>
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-6">
                    {/* Left Column: Items */}
                    <div className="space-y-4">

                        {/* Login Banner */}
                        {!user && (
                            <div className="bg-white p-4 rounded border border-gray-200 flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Login to see items from your existing bag and wishlist.</p>
                                </div>
                                <button
                                    onClick={() => openAuthModal('login')}
                                    className="text-[var(--brand-royal-red)] font-bold text-xs uppercase hover:underline"
                                >
                                    Login Now
                                </button>
                            </div>
                        )}

                        {/* Items List */}
                        <div className="space-y-3">
                            {cartItems.map((item, index) => (
                                <div
                                    key={`${item.id}-${item.selectedSize}-${item.selectedColor}-${item.variantId || ''}-${item.childVariantId || ''}-${index}`}
                                    role="link"
                                    tabIndex={0}
                                    onClick={() => router.push(`/product/${item.id}`)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            router.push(`/product/${item.id}`);
                                        }
                                    }}
                                    className={`relative bg-white border rounded p-3 shadow-sm group transition-colors cursor-pointer ${item.selected ? 'border-gray-200' : 'border-gray-100 bg-gray-50 opacity-75'}`}
                                >

                                    {/* Checkbox */}
                                    <div className="absolute top-3 left-3 z-10">
                                        <input
                                            type="checkbox"
                                            checked={item.selected || false}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={() => toggleItemSelection(item.id, item.selectedSize, item.selectedColor, item.variantId, item.childVariantId)}
                                            className="w-4 h-4 text-[var(--brand-royal-red)] border-gray-300 rounded focus:ring-[var(--brand-royal-red)] cursor-pointer"
                                        />
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFromCart(item.id, item.selectedSize, item.selectedColor, item.variantId, item.childVariantId);
                                        }}
                                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-900 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>

                                    <div className="flex gap-4 pl-8">
                                        {/* Image */}
                                        <div className="w-28 h-36 flex-shrink-0 bg-gray-100 rounded overflow-hidden relative">
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        {/* info */}
                                        <div className="flex-1 min-w-0 py-1">
                                            <h3 className="font-bold text-sm text-gray-900 mb-1">{item.brand || "Brand Empire"}</h3>
                                            <p className="block truncate mb-2 text-sm text-gray-500 group-hover:text-[var(--brand-royal-red)] transition-colors">
                                                {item.name}
                                            </p>

                                            {/* Selectors Row */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenSizeModal(item);
                                                        }}
                                                        className="bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs font-bold text-gray-800 flex items-center gap-1"
                                                    >
                                                        Size: {item.selectedSize || 'N/A'}
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="6 9 12 15 18 9"></polyline>
                                                        </svg>
                                                    </button>
                                                </div>

                                                <div className="relative">
                                                    <div className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-800 flex items-center gap-2">
                                                        <span>Qty:</span>
                                                        <button
                                                            className="hover:text-[var(--brand-royal-red)]"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateQuantity(item.id, item.quantity - 1, item.selectedSize, item.selectedColor, item.variantId, item.childVariantId);
                                                            }}
                                                        >-</button>
                                                        <span>{item.quantity}</span>
                                                        <button
                                                            className="hover:text-[var(--brand-royal-red)]"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const maxLimit = item.variantStockMap?.[item.selectedSize] ?? item.maxStock ?? 99;
                                                                if (item.quantity >= maxLimit) {
                                                                    const sizeMsg = item.selectedSize ? ` for Size ${item.selectedSize}` : '';
                                                                    showToast({ message: `Only ${maxLimit} is in stock${sizeMsg}`, type: 'error' });
                                                                    return;
                                                                }
                                                                updateQuantity(item.id, item.quantity + 1, item.selectedSize, item.selectedColor, item.variantId, item.childVariantId);
                                                            }}
                                                        >+</button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Price */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-sm text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                                                {item.originalPrice && (
                                                    <span className="text-xs text-gray-400 line-through">{formatPrice(item.originalPrice * item.quantity)}</span>
                                                )}
                                                {item.discount && (
                                                    <span className="text-xs text-[var(--brand-royal-red)] font-bold">{item.discount}</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                                <span>{item.return_delivery_days || "7-Days Return Available"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Price Details */}
                    <div className="h-fit space-y-4">
                        <div className="bg-white border border-gray-200 rounded p-4 shadow-sm sticky top-28">
                            <h2 className="text-xs font-bold text-gray-500 uppercase mb-4">Price Details ({selectedCount} Selected)</h2>

                            <div className="space-y-3 mb-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total MRP</span>
                                    <span className="text-gray-900">{formatPrice(totalMRP)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Discount on MRP</span>
                                    <span className="text-green-600">-{formatPrice(totalDiscount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Delivery Fee</span>
                                    <span className="text-sm text-[var(--brand-royal-red)] font-medium">Calculated at Checkout</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-900">Total Amount</span>
                                    <span className="font-bold text-gray-900 text-lg">{formatPrice(subTotal)}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (selectedCount === 0) {
                                        alert("Please select at least one item to proceed.");
                                        return;
                                    }
                                    router.push('/checkout');
                                }}
                                className={`block w-full py-3 text-center font-bold text-sm uppercase rounded shadow-md transition-colors ${selectedCount > 0 ? 'bg-[var(--brand-royal-red)] text-white hover:bg-red-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                disabled={selectedCount === 0}
                            >
                                Checkout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Size Selection Modal */}
            {openSizeModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setOpenSizeModal(null)}
                >
                    <div
                        className="bg-white rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 uppercase">Edit Variation</h3>
                            <button onClick={() => setOpenSizeModal(null)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg mb-6">
                            <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden relative border border-gray-200">
                                <Image
                                    src={openSizeModal.image}
                                    alt={openSizeModal.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-gray-900">{openSizeModal.brand}</p>
                                <p className="text-xs text-gray-500 line-clamp-1">{openSizeModal.name}</p>
                                <p className="font-bold text-sm mt-1">{formatPrice(openSizeModal.price)}</p>
                            </div>
                        </div>

                        {/* Step 1: Size Selection */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">
                                    Select Size
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(openSizeModal.availableSizes && openSizeModal.availableSizes.length > 0
                                        ? openSizeModal.availableSizes
                                        : ['S', 'M', 'L', 'XL', 'XXL']).map((size, index) => {
                                            const isSelected = tempSelection.size === size;
                                            return (
                                                <button
                                                    key={`size-${index}-${size}`}
                                                    onClick={() => {
                                                        const productDetails = fetchedProducts[openSizeModal.id];
                                                        const variant = productDetails?.product_variants?.find(v => v.name === size);
                                                        setTempSelection({
                                                            ...tempSelection,
                                                            size: size,
                                                            variantId: variant?.id || null,
                                                            childSize: "", // Reset child selection on size change
                                                            childVariantId: null
                                                        });
                                                    }}
                                                    className={`h-10 rounded-md border font-bold text-xs transition-all ${isSelected ? 'bg-[var(--brand-royal-red)] text-white border-[var(--brand-royal-red)]' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'}`}
                                                >
                                                    {size}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>

                            {/* Step 2: Child Variant Selection (e.g. Length) */}
                            {selectedVariant?.child_variants?.length > 0 && (
                                <div className="pt-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">
                                        Select Option (e.g. Length)
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {selectedVariant.child_variants.map((child, index) => {
                                            const isSelected = tempSelection.childSize === child.name;
                                            return (
                                                <button
                                                    key={`child-${index}-${child.name}`}
                                                    onClick={() => {
                                                        setTempSelection({
                                                            ...tempSelection,
                                                            childSize: child.name,
                                                            childVariantId: child.id
                                                        });
                                                    }}
                                                    className={`h-10 rounded-md border font-bold text-xs transition-all ${isSelected ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'}`}
                                                >
                                                    {child.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Bar */}
                        <div className="mt-8">
                            <button
                                onClick={handleUpdateSize}
                                disabled={isChildRequired && !tempSelection.childSize}
                                className={`w-full py-3 rounded-lg font-bold text-sm uppercase shadow-sm transition-all ${isChildRequired && !tempSelection.childSize ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[var(--brand-royal-red)] text-white hover:bg-red-700 shadow-md'}`}
                            >
                                {isChildRequired && !tempSelection.childSize ? "Select an Option" : "Update Bag"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CartPage;
