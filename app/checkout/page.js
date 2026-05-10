"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { saveSalesOrder, getCouponList, applyCoupon } from "@/lib/api";
import { MapPin, CreditCard, ShoppingBag, Shield, Truck, User, Phone, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import AddressSelect from "@/components/AddressSelect/AddressSelect";
import { trackBeginCheckout, trackPurchase } from "@/lib/gtm";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

export default function CheckoutPage() {
    const { cartItems: allCartItems, getSubtotal, deliveryFee, updateDeliveryFee, clearCart } = useCart();

    const cartItems = allCartItems.filter(item => item.selected);
    const { user, openAuthDrawer } = useAuth();
    const router = useRouter();

    const subTotal = getSubtotal();

    const formatPrice = (amount) => {
        return `৳ ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);

    const [formData, setFormData] = useState({
        firstName: "",
        phone: "",
        email: "",
        address: "",
    });

    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState("");
    const [donationAmount, setDonationAmount] = useState(0);
    const [acceptedCheckoutPolicies, setAcceptedCheckoutPolicies] = useState(false);
    const [checkoutValidationMessage, setCheckoutValidationMessage] = useState("");

    const formRef = useRef(null);
    const hasTrackedBeginCheckoutRef = useRef(false);

    useEffect(() => {
        const savedDetails = localStorage.getItem("asiaticFashionCheckoutDetails");
        if (savedDetails) {
            try {
                const parsed = JSON.parse(savedDetails);
                setFormData(prev => ({
                    ...prev,
                    firstName: parsed.firstName || prev.firstName,
                    phone: parsed.phone || prev.phone,
                    email: parsed.email || prev.email,
                    address: parsed.address || prev.address,
                }));
                if (parsed.district) setSelectedDistrict(parsed.district);
                if (parsed.city) setSelectedCity(parsed.city);
            } catch (e) {
                console.error("Failed to parse saved checkout details", e);
            }
        }
    }, []);

    useEffect(() => {
        if (user) {
            setFormData((prev) => ({
                ...prev,
                firstName: user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user.name || prev.firstName,
                phone: user.mobile_number || user.phone || prev.phone,
                email: user.email || prev.email,
                address: user.address || prev.address,
            }));
        }
    }, [user]);

    useEffect(() => {
        if (!selectedDistrict && !selectedCity) {
            updateDeliveryFee(0);
            return;
        }
        let fee = 130; 
        if (
            selectedCity === "Demra" ||
            selectedCity?.includes("Savar") ||
            selectedDistrict === "Gazipur" ||
            selectedCity?.includes("Keraniganj")
        ) {
            fee = 90;
        } else if (selectedDistrict === "Dhaka") {
            fee = 70;
        } else {
            fee = 130;
        }
        updateDeliveryFee(fee);
    }, [selectedDistrict, selectedCity, updateDeliveryFee]);

    const grandTotal = subTotal + deliveryFee - couponDiscount + donationAmount;

    useEffect(() => {
        if (hasTrackedBeginCheckoutRef.current) return;
        if (!Array.isArray(cartItems) || cartItems.length === 0) return;

        trackBeginCheckout({
            items: cartItems,
            currency: "BDT",
            coupon: appliedCoupon?.coupon_code || couponCode || undefined,
        });

        hasTrackedBeginCheckoutRef.current = true;
    }, [cartItems, appliedCoupon, couponCode]);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError("Please enter a coupon code");
            return;
        }

        setCouponLoading(true);
        setCouponError("");

        try {
            const response = await getCouponList();

            if (response.success && response.data) {
                const matchingCoupon = response.data.find(
                    coupon => coupon.coupon_code.toUpperCase() === couponCode.trim().toUpperCase()
                );

                if (matchingCoupon) {
                    const now = new Date();
                    const expireDate = new Date(matchingCoupon.expire_date);

                    if (expireDate < now) {
                        setCouponError("This coupon has expired");
                        setCouponDiscount(0);
                        setAppliedCoupon(null);
                        return;
                    }

                    const minOrderAmount = parseFloat(matchingCoupon.minimum_order_amount) || 0;
                    if (minOrderAmount > 0 && subTotal < minOrderAmount) {
                        setCouponError(`Minimum order amount is ${formatPrice(minOrderAmount)}`);
                        setCouponDiscount(0);
                        setAppliedCoupon(null);
                        return;
                    }

                    const couponAmount = parseFloat(matchingCoupon.amount) || 0;
                    const amountLimit = parseFloat(matchingCoupon.amount_limit) || 0;
                    let discount = 0;

                    if (matchingCoupon.coupon_amount_type === "percentage") {
                        discount = Math.round(subTotal * (couponAmount / 100));
                    } else {
                        discount = couponAmount;
                    }

                    if (amountLimit > 0 && discount > amountLimit) {
                        discount = amountLimit;
                    }

                    discount = Math.min(discount, subTotal);

                    setCouponDiscount(discount);
                    setAppliedCoupon(matchingCoupon);
                    toast.success(`Coupon applied! You saved ${formatPrice(discount)}`);
                } else {
                    setCouponError("Invalid coupon code");
                    setCouponDiscount(0);
                    setAppliedCoupon(null);
                }
            } else {
                setCouponError("Unable to validate coupon");
                setCouponDiscount(0);
                setAppliedCoupon(null);
            }
        } catch (error) {
            console.error("Coupon error:", error);
            setCouponError("Failed to apply coupon");
            setCouponDiscount(0);
            setAppliedCoupon(null);
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setCouponCode("");
        setCouponDiscount(0);
        setAppliedCoupon(null);
        setCouponError("");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (checkoutValidationMessage) {
            setCheckoutValidationMessage("");
        }
    };

    const handleSubmit = async () => {
        const failCheckout = (message) => {
            setCheckoutValidationMessage(message);
            toast.error(message);
        };

        if (!formData.firstName?.trim()) {
            failCheckout("Please enter your full name.");
            return;
        }

        if (!formData.address?.trim()) {
            failCheckout("Please enter your detailed address.");
            return;
        }

        if (!user) {
            failCheckout("Please log in to place your order.");
            openAuthDrawer('login');
            return;
        }

        if (!acceptedCheckoutPolicies) {
            failCheckout("Please accept Terms, Privacy, Return and Shipping policies");
            return;
        }

        if (!selectedDistrict || !selectedCity) {
            failCheckout("Please select both District and Area");
            return;
        }

        const phoneRegex = /^01[3-9]\d{8}$/;
        if (!phoneRegex.test(formData.phone)) {
            failCheckout("Please enter a valid 11-digit Bangladeshi phone number");
            return;
        }

        setCheckoutValidationMessage("");
        processOrder();
    };

    const processOrder = async () => {
        setIsSubmitting(true);

        try {
            const detailsToSave = {
                firstName: formData.firstName,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                district: selectedDistrict,
                city: selectedCity
            };
            localStorage.setItem("asiaticFashionCheckoutDetails", JSON.stringify(detailsToSave));
        } catch (error) {
            console.error("Failed to save checkout details to local storage", error);
        }

        const normalizedDonationAmount = Math.max(0, Number(donationAmount) || 0);

        const orderPayload = {
            pay_mode: paymentMethod,
            paid_amount: 0,
            user_id: process.env.NEXT_PUBLIC_USER_ID, 
            sub_total: subTotal,
            donation_amount: normalizedDonationAmount,
            donation: normalizedDonationAmount,
            vat: 0,
            tax: 0, 
            discount: 0, 
            product: cartItems.map((item) => ({
                product_id: item.id,
                product_variant_id: item.variantId || null,
                product_child_variant_id: item.childVariantId || null,
                qty: item.quantity,
                price: item.price,
                mode: 1, 
                size: item.selectedSize || "Free Size", 
                sales_id: process.env.NEXT_PUBLIC_USER_ID,
            })),
            delivery_method_id: 1, 
            delivery_info_id: 1, 
            delivery_customer_name: formData.firstName,
            delivery_customer_address: `${formData.address}, ${selectedCity}, ${selectedDistrict}`,
            delivery_customer_phone: formData.phone,
            delivery_fee: deliveryFee,
            variants: [],
            imeis: [null], 
            created_at: new Date().toISOString(),
            customer_id: user?.id || null,
            customer_name: formData.firstName,
            customer_phone: formData.phone,
            sales_id: process.env.NEXT_PUBLIC_USER_ID,
            wholeseller_id: 1, 
            status: 1, 
            delivery_city: selectedCity, 
            delivery_district: selectedDistrict, 
            detailed_address: formData.address, 
        };

        try {
            if (appliedCoupon && couponCode) {
                try {
                    await applyCoupon(couponCode);
                } catch (couponError) {
                    console.warn("Error tracking coupon usage:", couponError);
                }
            }

            const response = await saveSalesOrder(orderPayload);

            if (response.success) {
                const invoiceId = response.data?.invoice_id || response.invoice_id || "INV-" + Date.now();

                trackPurchase({
                    transactionId: invoiceId,
                    items: cartItems,
                    value: grandTotal,
                    tax: 0,
                    shipping: deliveryFee,
                    discount: couponDiscount,
                    coupon: appliedCoupon?.coupon_code || couponCode || undefined,
                    currency: "BDT",
                    userData: {
                        customer_id: user?.id || null,
                        name: formData.firstName || user?.name || null,
                        email: formData.email || user?.email || null,
                        phone: formData.phone || user?.mobile_number || user?.phone || null,
                        address: formData.address || user?.address || null,
                        city: selectedCity || null,
                        district: selectedDistrict || null,
                        country: "BD",
                    },
                    orderMeta: {
                        payment_method: paymentMethod,
                        status: "placed",
                        delivery_city: selectedCity || null,
                        delivery_district: selectedDistrict || null,
                    },
                });

                clearCart();
                toast.success("Order placed successfully!");
                router.push(`/order-success?invoice=${invoiceId}`);
            } else {
                toast.error("Failed to place order. Please try again.");
                console.error("Order failed:", response);
            }
        } catch (error) {
            console.error("Error submitting order:", error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <>
                <Header />
                <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#F8F8F6]">
                    <div className="text-center">
                        <ShoppingBag className="mx-auto h-16 w-16 text-[#999999]" />
                        <h2 className="mt-4 text-2xl font-bold text-[#1A1A1A] tracking-widest uppercase">
                            Your cart is empty
                        </h2>
                        <p className="mt-2 text-sm text-[#666666]">
                            Add some items to start your checkout.
                        </p>
                        <Link
                            href="/category/16167"
                            className="mt-8 inline-block px-8 py-3 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-[#F8F8F6]">
                <div className="pt-8 pb-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
                        <div className="mb-8 border-b border-[#E5E5E5] pb-4">
                            <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-widest uppercase">Checkout</h1>
                            <p className="mt-2 text-xs text-[#999999] tracking-widest uppercase">
                                Complete your order by providing your delivery and payment details.
                            </p>
                        </div>

                        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1.5fr_1fr]">
                            {/* Left Column: Forms */}
                            <div className="space-y-8">
                                {/* Delivery Information */}
                                <section className="border border-[#E5E5E5] bg-white p-6 md:p-8">
                                    <div className="mb-6 flex items-center gap-3 border-b border-[#E5E5E5] pb-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8F8F6] text-[#1A1A1A]">
                                            <MapPin className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-[#1A1A1A] text-sm uppercase tracking-widest">
                                                Delivery Address
                                            </h2>
                                        </div>
                                    </div>

                                    <form
                                        id="checkout-form"
                                        ref={formRef}
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            void handleSubmit();
                                        }}
                                        className="space-y-6"
                                    >
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-[#999999] uppercase tracking-widest">
                                                    Full Name
                                                </label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <User className="h-4 w-4 text-[#999999]" />
                                                    </div>
                                                    <input
                                                        required
                                                        type="text"
                                                        name="firstName"
                                                        value={formData.firstName}
                                                        onChange={handleChange}
                                                        className="block w-full h-12 border border-[#E5E5E5] bg-transparent pl-10 pr-3 text-sm text-[#1A1A1A] placeholder:text-[#999999] focus:border-[#1A1A1A] focus:outline-none transition-colors"
                                                        placeholder="John Doe"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-[#999999] uppercase tracking-widest">
                                                    Phone Number <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <Phone className="h-4 w-4 text-[#999999]" />
                                                    </div>
                                                    <input
                                                        required
                                                        type="tel"
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleChange}
                                                        className="block w-full h-12 border border-[#E5E5E5] bg-transparent pl-10 pr-3 text-sm text-[#1A1A1A] placeholder:text-[#999999] focus:border-[#1A1A1A] focus:outline-none transition-colors"
                                                        placeholder="01XXXXXXXXX"
                                                    />
                                                </div>
                                                {formData.phone && !/^01[3-9]\d{8}$/.test(formData.phone) && (
                                                    <p className="text-[10px] tracking-widest text-red-500 uppercase">
                                                        Invalid format
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-[#999999] uppercase tracking-widest">
                                                Email <span className="text-gray-400 font-normal">(Optional)</span>
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="block w-full h-12 border border-[#E5E5E5] bg-transparent px-4 text-sm text-[#1A1A1A] placeholder:text-[#999999] focus:border-[#1A1A1A] focus:outline-none transition-colors"
                                                placeholder="email@example.com"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <AddressSelect
                                                selectedDistrict={selectedDistrict}
                                                setSelectedDistrict={setSelectedDistrict}
                                                selectedCity={selectedCity}
                                                setSelectedCity={setSelectedCity}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-[#999999] uppercase tracking-widest">
                                                Detailed Address
                                            </label>
                                            <textarea
                                                required
                                                name="address"
                                                rows={3}
                                                value={formData.address}
                                                onChange={handleChange}
                                                className="block w-full border border-[#E5E5E5] bg-transparent p-4 text-sm text-[#1A1A1A] placeholder:text-[#999999] focus:border-[#1A1A1A] focus:outline-none transition-colors resize-none"
                                                placeholder="Street address, house number, landmarks..."
                                            />
                                        </div>
                                    </form>
                                </section>

                                {/* Payment Method */}
                                <section className="border border-[#E5E5E5] bg-white p-6 md:p-8">
                                    <div className="mb-6 flex items-center gap-3 border-b border-[#E5E5E5] pb-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8F8F6] text-[#1A1A1A]">
                                            <CreditCard className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-[#1A1A1A] text-sm uppercase tracking-widest">
                                                Payment Method
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label
                                            className={`relative flex cursor-pointer border p-6 transition-all hover:border-[#1A1A1A] ${paymentMethod === "Cash"
                                                ? "border-[#1A1A1A] bg-[#F8F8F6]"
                                                : "border-[#E5E5E5]"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="Cash"
                                                className="sr-only"
                                                checked={paymentMethod === "Cash"}
                                                onChange={() => setPaymentMethod("Cash")}
                                            />
                                            <div className="flex w-full items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${paymentMethod === "Cash" ? "border-[#1A1A1A]" : "border-[#E5E5E5]"}`}>
                                                        {paymentMethod === "Cash" && (
                                                            <div className="h-3 w-3 rounded-full bg-[#1A1A1A]" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-[#1A1A1A] uppercase tracking-widest text-xs">Cash on Delivery</span>
                                                        <span className="text-[10px] text-[#999999] uppercase tracking-widest">Pay when you receive the package</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column: Order Summary */}
                            <div className="space-y-8">
                                <section className="border border-[#E5E5E5] bg-white p-6 md:p-8 sticky top-24">
                                    <h2 className="mb-6 font-bold text-[#1A1A1A] text-sm uppercase tracking-widest border-b border-[#E5E5E5] pb-4">
                                        Order Summary
                                    </h2>

                                    {/* Order Items */}
                                    <div className="mb-6 max-h-[300px] overflow-y-auto pr-2 space-y-4">
                                        {cartItems.map((item, idx) => (
                                            <div key={idx} className="flex gap-4">
                                                <div className="relative h-20 w-16 flex-shrink-0 bg-[#F8F8F6]">
                                                    {item.image ? (
                                                        <Image
                                                            src={typeof item.image === 'string' ? item.image : '/placeholder.png'}
                                                            alt={item.name || 'Product'}
                                                            fill
                                                            unoptimized
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[8px] text-[#999999] uppercase tracking-widest text-center px-1">
                                                            No Image
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-1 flex-col justify-center">
                                                    <p className="text-xs font-bold text-[#1A1A1A] uppercase tracking-widest truncate max-w-[180px]">
                                                        {item.name}
                                                    </p>
                                                    {(item.selectedSize || item.selectedColor) && (
                                                        <p className="text-[10px] text-[#999999] mt-1 uppercase tracking-widest">
                                                            {item.selectedSize && `Size: ${item.selectedSize}`}
                                                            {item.selectedSize && item.selectedColor && " | "}
                                                            {item.selectedColor && `Color: ${item.selectedColor}`}
                                                        </p>
                                                    )}
                                                    <div className="mt-2 flex items-center justify-between text-xs">
                                                        <span className="text-[#666666]">Qty: {item.quantity}</span>
                                                        <span className="font-bold text-[#1A1A1A]">
                                                            {formatPrice(item.price * item.quantity)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Coupon Section */}
                                    <div className="mb-6 border-y border-[#E5E5E5] py-4">
                                        <label className="mb-2 block text-[10px] font-bold text-[#999999] uppercase tracking-widest">
                                            Gift Card or Discount Code
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                disabled={!!appliedCoupon || couponLoading}
                                                placeholder="Enter code"
                                                className="block w-full h-10 border border-[#E5E5E5] px-3 text-xs focus:border-[#1A1A1A] focus:outline-none uppercase"
                                            />
                                            {appliedCoupon ? (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveCoupon}
                                                    className="h-10 bg-[#F8F8F6] px-4 text-[10px] font-bold text-red-600 uppercase tracking-widest hover:bg-[#E5E5E5] transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleApplyCoupon}
                                                    disabled={!couponCode.trim() || couponLoading}
                                                    className="h-10 bg-[#1A1A1A] px-4 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-[#333] transition-colors disabled:opacity-50"
                                                >
                                                    {couponLoading ? "Applying..." : "Apply"}
                                                </button>
                                            )}
                                        </div>
                                        {couponError && <p className="mt-2 text-[10px] text-red-500 uppercase tracking-widest">{couponError}</p>}
                                        {appliedCoupon && (
                                            <p className="mt-2 text-[10px] text-green-600 uppercase tracking-widest">
                                                Coupon applied successfully!
                                            </p>
                                        )}
                                    </div>

                                    {/* Cost Breakdown */}
                                    <div className="mb-6 space-y-3 text-xs text-[#666666]">
                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span className="font-medium text-[#1A1A1A]">{formatPrice(subTotal)}</span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="flex items-center gap-1">
                                                Delivery Fee
                                            </span>
                                            <span className="font-medium text-[#1A1A1A]">
                                                {deliveryFee > 0 ? formatPrice(deliveryFee) : "Calculated at next step"}
                                            </span>
                                        </div>

                                        {couponDiscount > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span>Discount ({appliedCoupon?.coupon_code})</span>
                                                <span>-{formatPrice(couponDiscount)}</span>
                                            </div>
                                        )}
                                        
                                        <div className="border-t border-[#E5E5E5] pt-4 mt-4 flex justify-between text-base font-bold text-[#1A1A1A]">
                                            <span>Total</span>
                                            <span>{formatPrice(grandTotal)}</span>
                                        </div>
                                    </div>

                                    {/* Checkbox Policies */}
                                    <div className="mb-6 rounded-md bg-[#F8F8F6] p-4 text-[10px] text-[#666666] uppercase tracking-wide">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={acceptedCheckoutPolicies}
                                                onChange={(e) => setAcceptedCheckoutPolicies(e.target.checked)}
                                                className="mt-0.5 rounded border-[#E5E5E5] text-[#1A1A1A] focus:ring-[#1A1A1A] h-4 w-4"
                                            />
                                            <span>
                                                I agree to the <Link href="/terms-of-service" className="underline hover:text-[#1A1A1A]">Terms of Service</Link>, <Link href="/privacy-policy" className="underline hover:text-[#1A1A1A]">Privacy Policy</Link>, and <Link href="/returns" className="underline hover:text-[#1A1A1A]">Return Policy</Link>.
                                            </span>
                                        </label>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !acceptedCheckoutPolicies}
                                        className="flex h-12 w-full items-center justify-center bg-[#1A1A1A] text-xs font-bold text-white uppercase tracking-widest transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            "Confirm Order"
                                        )}
                                    </button>
                                    
                                    {checkoutValidationMessage && (
                                        <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold tracking-widest uppercase text-center">
                                            {checkoutValidationMessage}
                                        </div>
                                    )}

                                    {/* Trust Badges */}
                                    <div className="mt-6 flex items-center justify-center gap-4 border-t border-[#E5E5E5] pt-6">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#999999] tracking-widest uppercase">
                                            <Shield className="h-4 w-4" />
                                            <span>Secure</span>
                                        </div>
                                        <div className="h-4 w-px bg-[#E5E5E5]" />
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#999999] tracking-widest uppercase">
                                            <Truck className="h-4 w-4" />
                                            <span>Fast Delivery</span>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Toaster position="top-center" toastOptions={{
                style: {
                    borderRadius: '0',
                    background: '#1A1A1A',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                }
            }} />
            <Footer />
        </>
    );
}
