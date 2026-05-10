"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { saveSalesOrder, getCouponList, applyCoupon, requestCustomerOtp, verifyCustomerOtp } from "../../lib/api";
import {
    MapPin,
    CreditCard,
    ShoppingBag,
    Shield,
    Truck,
    User,
    Phone,
    Loader2,
    CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import AddressSelect from "../../components/AddressSelect";
import { trackBeginCheckout, trackPurchase } from "@/lib/gtm";

export default function CheckoutPage() {
    const PHONE_VERIFICATION_STORAGE_KEY = "brandEmpireCheckoutPhoneVerification";
    const { cartItems: allCartItems, getSubtotal, deliveryFee, updateDeliveryFee, clearCart } =
        useCart();

    // Filter to get only selected items for checkout
    const cartItems = allCartItems.filter(item => item.selected);
    const { user, openAuthModal } = useAuth();
    const router = useRouter();

    const subTotal = getSubtotal();

    // Format price helper function
    const formatPrice = (amount) => {
        return `TK ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // We'll manage district/city separately now
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

    // OTP States
    const [isOtpSending, setIsOtpSending] = useState(false);
    const [isOtpVerifying, setIsOtpVerifying] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
    const [otpResendCooldown, setOtpResendCooldown] = useState(0);
    const [otpVerified, setOtpVerified] = useState(false);
    const [verifiedPhone, setVerifiedPhone] = useState("");
    const [otpSuccessInModal, setOtpSuccessInModal] = useState(false);
    const [otpNotice, setOtpNotice] = useState("");
    const [otpErrorMessage, setOtpErrorMessage] = useState("");

    const formRef = useRef(null);
    const hasTrackedBeginCheckoutRef = useRef(false);

    // Prefill form with user data
    // Load saved details on mount
    useEffect(() => {
        const savedDetails = localStorage.getItem("brandEmpireCheckoutDetails");
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

    // Restore verified phone for this browser/session so user doesn't need OTP again for same number.
    useEffect(() => {
        try {
            const raw = localStorage.getItem(PHONE_VERIFICATION_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed?.verified && parsed?.phone) {
                setVerifiedPhone(String(parsed.phone));
            }
        } catch (e) {
            console.error("Failed to parse saved phone verification", e);
        }
    }, []);

    // Keep verification state tied to the current phone input.
    useEffect(() => {
        if (!formData.phone) {
            setOtpVerified(false);
            return;
        }
        setOtpVerified(verifiedPhone === formData.phone);
    }, [formData.phone, verifiedPhone]);

    // Prefill form with user data (User data takes precedence if available/loaded later, 
    // unless you want LS to win. Currently letting User win if fields match, but LS fills gaps)
    // Actually, usually we want User Profile to be the source of truth if logged in.
    // If the user modifies it and saves, it's in LS for next time.
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

    // OTP Resend Cooldown Timer
    useEffect(() => {
        if (otpResendCooldown <= 0) return;
        const timer = setInterval(() => {
            setOtpResendCooldown((prev) => Math.max(prev - 1, 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [otpResendCooldown]);

    // Auto-focus first OTP input when modal opens
    useEffect(() => {
        if (!showOtpModal) return;
        const focusTimer = setTimeout(() => {
            const firstInput = document.getElementById("checkout-otp-0");
            if (firstInput) firstInput.focus();
        }, 80);
        return () => clearTimeout(focusTimer);
    }, [showOtpModal]);

    // Update delivery fee based on selection
    useEffect(() => {
        if (!selectedDistrict && !selectedCity) {
            updateDeliveryFee(0);
            return;
        }

        let fee = 130; // Default: Outside Dhaka

        // Priority: specific city rules first
        if (
            selectedCity === "Demra" ||
            selectedCity?.includes("Savar") ||
            selectedDistrict === "Gazipur" ||
            selectedCity?.includes("Keraniganj")
        ) {
            fee = 90;
        }
        // Then district-specific rules
        else if (selectedDistrict === "Dhaka") {
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

    // Handle coupon application
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
                // Find matching coupon (case-insensitive)
                const matchingCoupon = response.data.find(
                    coupon => coupon.coupon_code.toUpperCase() === couponCode.trim().toUpperCase()
                );

                if (matchingCoupon) {
                    // Check if coupon is expired
                    const now = new Date();
                    const expireDate = new Date(matchingCoupon.expire_date);

                    if (expireDate < now) {
                        setCouponError("This coupon has expired");
                        setCouponDiscount(0);
                        setAppliedCoupon(null);
                        return;
                    }

                    // Check minimum order amount
                    const minOrderAmount = parseFloat(matchingCoupon.minimum_order_amount) || 0;
                    if (minOrderAmount > 0 && subTotal < minOrderAmount) {
                        setCouponError(`Minimum order amount is ${formatPrice(minOrderAmount)}`);
                        setCouponDiscount(0);
                        setAppliedCoupon(null);
                        return;
                    }

                    // Calculate discount based on coupon_amount_type
                    const couponAmount = parseFloat(matchingCoupon.amount) || 0;
                    const amountLimit = parseFloat(matchingCoupon.amount_limit) || 0;
                    let discount = 0;

                    if (matchingCoupon.coupon_amount_type === "percentage") {
                        discount = Math.round(subTotal * (couponAmount / 100));
                    } else {
                        // fixed amount
                        discount = couponAmount;
                    }

                    // Cap discount by amount_limit if it's set (greater than 0)
                    if (amountLimit > 0 && discount > amountLimit) {
                        discount = amountLimit;
                    }

                    // Don't let discount exceed subtotal
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

    // Remove applied coupon
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

    // OTP Handlers
    const requestOtp = async (phone) => {
        const normalizedPhone = String(phone || "").trim();
        const phoneRegex = /^01[3-9]\d{8}$/;
        if (!phoneRegex.test(normalizedPhone)) {
            toast.error("Please enter a valid 11-digit Bangladeshi phone number first.");
            return;
        }

        setIsOtpSending(true);
        try {
            const response = await requestCustomerOtp(normalizedPhone);
            
            if (response?.success === false) {
                throw new Error(response?.message || "Failed to send OTP. Please try again.");
            }
            // Reset states and show modal
            setOtpDigits(["", "", "", ""]);
            setOtpSuccessInModal(false);
            setOtpErrorMessage("");
            setOtpNotice("");
            setShowOtpModal(true);
            setOtpResendCooldown(30);
            toast.success("OTP sent to your phone number.");
        } catch (otpError) {
            toast.error(otpError.message || "Could not send OTP.");
        } finally {
            setIsOtpSending(false);
        }
    };

    const handleOtpDigitChange = (index, value) => {
        const numericValue = value.replace(/\D/g, "").slice(0, 1);
        let nextOtp = [];
        setOtpDigits((prev) => {
            const next = [...prev];
            next[index] = numericValue;
            nextOtp = next;
            return next;
        });
        // Auto-focus next input
        if (numericValue && index < 3) {
            const nextInput = document.getElementById(`checkout-otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
        // Auto-verify on last digit
        if (numericValue && index === 3) {
            const joined = nextOtp.join("");
            if (joined.length === 4 && !isOtpVerifying) {
                setTimeout(() => handleVerifyOtp(joined), 120);
            }
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
        if (!pasted) return;
        const nextOtp = ["", "", "", ""];
        pasted.split("").forEach((digit, idx) => {
            if (idx < 4) nextOtp[idx] = digit;
        });
        setOtpDigits(nextOtp);
        const focusIndex = Math.min(pasted.length, 4) - 1;
        if (focusIndex >= 0) {
            const input = document.getElementById(`checkout-otp-${focusIndex}`);
            if (input) input.focus();
        }
        // Auto-verify if 4 digits pasted
        if (pasted.length === 4 && !isOtpVerifying) {
            setTimeout(() => handleVerifyOtp(nextOtp.join("")), 120);
        }
    };

    const handleVerifyOtp = async (forcedOtpCode = null) => {
        let otpCode = forcedOtpCode || otpDigits.join("");
        
        if (otpCode.length !== 4) {
            toast.error("Please enter the 4-digit OTP.");
            setOtpErrorMessage("Please enter the 4-digit OTP.");
            return;
        }

        setIsOtpVerifying(true);
        setOtpErrorMessage("");
        setOtpNotice("Verifying OTP...");
        try {
            const response = await verifyCustomerOtp(formData.phone, Number(otpCode));
            
            if (response?.success === false) {
                throw new Error(response?.message || "Invalid OTP. Please try again.");
            }
            setOtpVerified(true);
            setVerifiedPhone(formData.phone);
            setOtpSuccessInModal(true);
            setOtpNotice("OTP verified successfully. You can now complete your order.");
            setCheckoutValidationMessage("");
            localStorage.setItem(
                PHONE_VERIFICATION_STORAGE_KEY,
                JSON.stringify({
                    phone: formData.phone,
                    verified: true,
                    verifiedAt: new Date().toISOString(),
                })
            );
            toast.success("Phone number verified.");
            
            // Verification only: user must still click Complete Order manually.
            setTimeout(() => {
                setShowOtpModal(false);
            }, 800);
        } catch (otpError) {
            const message = otpError?.message || "OTP verification failed.";
            setOtpNotice("");
            setOtpErrorMessage(message);
            toast.error(message);
        } finally {
            setIsOtpVerifying(false);
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
            openAuthModal('login');
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

        // Phone number validation for Bangladesh (01[3-9]XXXXXXXX)
        const phoneRegex = /^01[3-9]\d{8}$/;
        if (!phoneRegex.test(formData.phone)) {
            failCheckout("Please enter a valid 11-digit Bangladeshi phone number");
            return;
        }

        // Force explicit phone verification from phone field action.
        if (!otpVerified || verifiedPhone !== formData.phone) {
            failCheckout("Please verify your phone number first to place order.");
            return;
        }

        setCheckoutValidationMessage("");
        // If already verified, process the order
        processOrder();
    };

    const processOrder = async () => {
        setIsSubmitting(true);

        // Save details to Local Storage for future autofill
        try {
            const detailsToSave = {
                firstName: formData.firstName,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                district: selectedDistrict,
                city: selectedCity
            };
            localStorage.setItem("brandEmpireCheckoutDetails", JSON.stringify(detailsToSave));
        } catch (error) {
            console.error("Failed to save checkout details to local storage", error);
        }

        const normalizedDonationAmount = Math.max(0, Number(donationAmount) || 0);

        // Construct the payload as per user requirements
        const orderPayload = {
            pay_mode: paymentMethod,
            paid_amount: 0,
            user_id: process.env.NEXT_PUBLIC_USER_ID, // Store/Sales ID
            sub_total: subTotal,
            donation_amount: normalizedDonationAmount,
            donation: normalizedDonationAmount,
            vat: 0,
            tax: 0, // Assuming 0 for now
            discount: 0, // Coupon discount if any
            product: cartItems.map((item) => ({
                product_id: item.id,
                product_variant_id: item.variantId || null,
                product_child_variant_id: item.childVariantId || null,
                qty: item.quantity,
                price: item.price,
                mode: 1, // Assuming fixed mode
                size: item.selectedSize || "Free Size", // Pass size string directly. Fallback if empty.
                sales_id: process.env.NEXT_PUBLIC_USER_ID,
            })),
            delivery_method_id: 1, // Default to Standard Delivery
            delivery_info_id: 1, // Default ID, could be dynamic
            delivery_customer_name: formData.firstName,
            delivery_customer_address: `${formData.address}, ${selectedCity}, ${selectedDistrict}`,
            delivery_customer_phone: formData.phone,
            delivery_fee: deliveryFee,
            variants: [],
            imeis: [null], // As per example
            created_at: new Date().toISOString(),
            customer_id: user?.id || null,
            customer_name: formData.firstName,
            customer_phone: formData.phone,
            sales_id: process.env.NEXT_PUBLIC_USER_ID,
            wholeseller_id: 1, // Hardcoded as per request
            status: 1, // Order Received
            delivery_city: selectedCity, // Added for completeness
            delivery_district: selectedDistrict, // Added for completeness
            detailed_address: formData.address, // Sending the text area address too
        };

        try {
            // If a coupon is applied, call the apply-coupon API to track usage
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
            <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
                <div className="text-center">
                    <ShoppingBag className="mx-auto h-16 w-16 text-gray-300" />
                    <h2 className="mt-4 text-2xl font-bold text-gray-900">
                        Your cart is empty
                    </h2>
                    <p className="mt-2 text-gray-600">
                        Add some items to start your checkout.
                    </p>
                    <Link
                        href="/"
                        className="mt-6 inline-block rounded-md bg-black px-6 py-3 text-white transition hover:bg-gray-800"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="pt-0 lg:pt-8 pb-8 lg:pb-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Complete your order by providing your delivery and payment details.
                        </p>
                    </div>

                    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1.5fr_1fr]">
                        {/* Left Column: Forms */}
                        <div className="space-y-8">
                            {/* Delivery Information */}
                            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                                <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-gray-900">
                                            Delivery Address
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Where should we send your order?
                                        </p>
                                    </div>
                                </div>

                                <form
                                    id="checkout-form"
                                    ref={formRef}
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        void handleSubmit();
                                    }}
                                    className="space-y-5"
                                >
                                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                Full Name
                                            </label>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input
                                                    required
                                                    type="text"
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                                                    placeholder="John Doe"
                                                    style={{ fontSize: '16px' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                Phone Number <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <Phone className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input
                                                    required
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-28 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                                                    placeholder="01XXXXXXXXX"
                                                    style={{ fontSize: '16px' }}
                                                />
                                                {otpVerified && verifiedPhone === formData.phone ? (
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-700">
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => requestOtp(formData.phone)}
                                                        disabled={isOtpSending || !/^01[3-9]\d{8}$/.test(formData.phone)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-[var(--brand-royal-red)] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {isOtpSending ? "Sending..." : "Verify"}
                                                    </button>
                                                )}
                                            </div>
                                            {formData.phone && !/^01[3-9]\d{8}$/.test(formData.phone) && (
                                                <p className="text-xs text-red-500">
                                                    Invalid phone number format.
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">
                                                Format: 01XXXXXXXXX (11 digits, starting with 01)
                                            </p>
                                        </div>
                                    </div>

                                    {/* Optional Email Field */}
                                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                Email <span className="text-gray-400 font-normal">(Optional)</span>
                                            </label>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                        <polyline points="22,6 12,13 2,6"></polyline>
                                                    </svg>
                                                </div>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                                                    placeholder="email@example.com"
                                                    style={{ fontSize: '16px' }}
                                                />
                                            </div>
                                        </div>
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
                                        <label className="text-sm font-medium text-gray-700">
                                            Detailed Address
                                        </label>
                                        <div className="relative">
                                            <textarea
                                                required
                                                name="address"
                                                rows={3}
                                                value={formData.address}
                                                onChange={handleChange}
                                                className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-3 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                                                placeholder="Street address, house number, landmarks..."
                                                style={{ fontSize: '16px' }}
                                            />
                                        </div>
                                    </div>
                                </form>
                            </section>

                            {/* Payment Method */}
                            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                                <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-gray-900">
                                            Payment Method
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Select how you want to pay
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <label
                                        className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm transition-all hover:border-black ${paymentMethod === "Cash"
                                            ? "border-black ring-1 ring-black"
                                            : "border-gray-200"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="Cash"
                                            className="sr-only"
                                            checked={paymentMethod === "Cash"}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <div className="flex flex-1 flex-col">
                                            <span className="flex items-center gap-2 font-medium text-gray-900">
                                                <Truck className="h-4 w-4 text-gray-500" />
                                                Cash on Delivery
                                            </span>
                                            <span className="mt-1 text-xs text-gray-500">
                                                Pay when you receive
                                            </span>
                                        </div>
                                        {paymentMethod === "Cash" && (
                                            <div className="absolute right-4 top-4 text-black">
                                                <div className="h-3 w-3 rounded-full bg-black" />
                                            </div>
                                        )}
                                    </label>

                                    <label className="relative flex cursor-not-allowed rounded-xl border border-gray-100 p-4 opacity-60">
                                        <div className="flex flex-1 flex-col">
                                            <span className="flex items-center gap-2 font-medium text-gray-400">
                                                <CreditCard className="h-4 w-4" />
                                                Online Payment
                                            </span>
                                            <span className="mt-1 text-xs text-gray-400">
                                                Coming soon
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Order Summary */}
                        <div className="h-fit space-y-6 lg:sticky lg:top-24">
                            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                                <h2 className="mb-6 font-semibold text-gray-900">
                                    Order Summary
                                </h2>

                                <div className="mb-6 max-h-[300px] space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200">
                                    {cartItems.map((item, index) => (
                                        <div
                                            key={`${item.id}-${item.selectedSize || index}`}
                                            role="link"
                                            tabIndex={0}
                                            onClick={() => router.push(`/product/${item.id}`)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    router.push(`/product/${item.id}`);
                                                }
                                            }}
                                            className="group flex gap-4 cursor-pointer"
                                        >
                                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-100 bg-gray-50">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex flex-1 flex-col justify-between">
                                                <div className="flex justify-between">
                                                    <p className="line-clamp-1 text-sm font-medium text-gray-900 transition-colors group-hover:text-[var(--brand-royal-red)]">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {formatPrice(item.price * item.quantity)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <p>
                                                        Qty: {item.quantity} · Size: {item.selectedSize}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mb-6 space-y-3 border-t border-gray-100 pt-4">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(subTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Delivery ({
                                            // Show method name nicely
                                            selectedCity ? (selectedCity === "Demra" || selectedCity?.includes("Savar") || selectedDistrict === "Gazipur" || selectedCity?.includes("Keraniganj"))
                                                ? "Special Area"
                                                : selectedDistrict === "Dhaka"
                                                    ? "Inside Dhaka"
                                                    : "Outside Dhaka"
                                                : "Pending"
                                        })</span>
                                        <span>{formatPrice(deliveryFee)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Discount</span>
                                        <span className="text-red-500">-{formatPrice(couponDiscount)}</span>
                                    </div>
                                    {donationAmount > 0 && (
                                        <div className="flex justify-between text-sm text-[var(--brand-royal-red)] font-medium">
                                            <span>Donation</span>
                                            <span>+{formatPrice(donationAmount)}</span>
                                        </div>
                                    )}
                                    {/* Coupon Input UI */}
                                    <div className="pt-2">
                                        {appliedCoupon ? (
                                            <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-green-700">
                                                        🎉 {couponCode} applied
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={handleRemoveCoupon}
                                                    className="text-xs text-red-600 hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Coupon Code"
                                                    value={couponCode}
                                                    onChange={(e) => {
                                                        setCouponCode(e.target.value.toUpperCase());
                                                        setCouponError("");
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !couponLoading && couponCode.trim()) {
                                                            e.preventDefault();
                                                            handleApplyCoupon();
                                                        }
                                                    }}
                                                    className={`flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none ${couponError
                                                        ? "border-red-300 bg-red-50 focus:border-red-500"
                                                        : "border-gray-200 bg-gray-50 focus:border-black"
                                                        }`}
                                                    style={{ fontSize: '16px' }}
                                                />
                                                <button
                                                    onClick={handleApplyCoupon}
                                                    disabled={couponLoading}
                                                    className="rounded-md bg-[var(--brand-royal-red)] px-4 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                                                >
                                                    {couponLoading ? "..." : "Apply"}
                                                </button>
                                            </div>
                                        )}
                                        {couponError && (
                                            <p className="mt-1 text-xs text-red-600">{couponError}</p>
                                        )}
                                    </div>

                                    {/* Discount Line */}
                                    {couponDiscount > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Coupon Discount</span>
                                            <span>-{formatPrice(couponDiscount)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Donation Section */}
                                <div className="mb-6 rounded-lg bg-white p-4 border border-gray-200 shadow-sm">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="p-2 bg-red-50 rounded-full text-[var(--brand-royal-red)] shadow-sm">
                                            <ShoppingBag size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-sm">Donation</h3>
                                            <p className="text-xs text-gray-500">Your donated money will be distributed among the poor and needy.</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {[0, 10, 20, 30, 50].map((amount) => (
                                            <button
                                                type="button"
                                                key={amount}
                                                onClick={() => setDonationAmount(amount)}
                                                className={`px-3 py-1 text-xs rounded-full border transition-all ${donationAmount === amount
                                                    ? "bg-[var(--brand-royal-red)] text-white border-[var(--brand-royal-red)]"
                                                    : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600"
                                                    }`}
                                            >
                                                {amount === 0 ? "Tk Not now" : `Tk ${amount}`}
                                            </button>
                                        ))}
                                    </div>

                                    <input
                                        type="number"
                                        placeholder="Enter custom amount"
                                        value={donationAmount > 0 ? donationAmount : ''}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setDonationAmount(isNaN(val) ? 0 : val);
                                        }}
                                        className="w-full text-xs rounded-full border border-gray-200 px-4 py-2 focus:outline-none focus:border-[var(--brand-royal-red)]"
                                    />
                                </div>

                                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                    <span className="text-base font-bold text-gray-900">
                                        Grand Total
                                    </span>
                                    <span className="text-xl font-bold text-gray-900">
                                        {formatPrice(grandTotal)}
                                    </span>
                                </div>

                                <label className="mt-4 flex items-start gap-2 text-xs text-gray-600 leading-relaxed cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={acceptedCheckoutPolicies}
                                        onChange={(e) => setAcceptedCheckoutPolicies(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <span className="mt-0.5 h-4 w-4 rounded border border-gray-300 bg-white flex items-center justify-center transition-colors peer-checked:bg-[var(--brand-royal-red)] peer-checked:border-[var(--brand-royal-red)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--brand-royal-red)]/30">
                                        {acceptedCheckoutPolicies && (
                                            <svg
                                                viewBox="0 0 16 16"
                                                className="h-3 w-3 text-white"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </span>
                                    <span>
                                        I accept <Link href="/terms" className="text-[var(--brand-royal-red)] hover:underline">Terms & Conditions</Link>, <Link href="/privacy" className="text-[var(--brand-royal-red)] hover:underline">Privacy Policy</Link>, <Link href="/returns" className="text-[var(--brand-royal-red)] hover:underline">Return Policy</Link> and <Link href="/shipping" className="text-[var(--brand-royal-red)] hover:underline">Shipping Policy</Link>.
                                    </span>
                                </label>

                                <button
                                    type="button"
                                    onClick={() => void handleSubmit()}
                                    disabled={isSubmitting}
                                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-royal-red)] px-6 py-4 text-sm font-bold text-white shadow-lg transition hover:opacity-90 hover:translate-y-[-1px] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {isSubmitting ? (
                                        <>Processing...</>
                                    ) : (
                                        <>
                                            Complete Order
                                            <Truck className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                                {checkoutValidationMessage && (
                                    <p className="mt-2 text-center text-xs font-medium text-red-600">
                                        {checkoutValidationMessage}
                                    </p>
                                )}

                                {!user && (
                                    <p className="mt-3 text-center text-xs text-gray-500">
                                        Please <button type="button" onClick={() => openAuthModal('login')} className="text-[var(--brand-royal-red)] hover:underline font-semibold">log in</button> to place your order.
                                    </p>
                                )}

                                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                                    <Shield className="h-3 w-3" />
                                    Secure checkout powered by SSL encryption
                                </div>
                            </section>

                            <div className="flex justify-center items-center gap-6 mt-8">
                                {/* Delivery Partner Logos (Inline SVG for reliability) */}
                                {/* Pathao Logo */}
                                <svg viewBox="0 0 120 30" className="h-7 w-auto opacity-70 grayscale transition hover:grayscale-0 hover:opacity-100">
                                    <text x="0" y="20" fontFamily="sans-serif" fontWeight="900" fontStyle="italic" fontSize="24" fill="#E11220">Pathao</text>
                                </svg>

                                {/* FedEx Logo */}
                                <svg viewBox="0 0 110 30" className="h-7 w-auto opacity-70 grayscale transition hover:grayscale-0 hover:opacity-100">
                                    <text x="0" y="20" fontFamily="sans-serif" fontWeight="900" fontSize="24" fill="#4D148C">Fed</text>
                                    <text x="42" y="20" fontFamily="sans-serif" fontWeight="900" fontSize="24" fill="#FF6600">Ex</text>
                                </svg>

                                {/* DHL Logo */}
                                <svg viewBox="0 0 80 30" className="h-7 w-auto opacity-70 grayscale transition hover:grayscale-0 hover:opacity-100">
                                    <rect width="60" height="24" fill="#FFCC00" rx="2" className="hidden" /> {/* Optional background */}
                                    <text x="0" y="20" fontFamily="sans-serif" fontWeight="900" fontStyle="italic" fontSize="26" fill="#D40511">DHL</text>
                                </svg>
                            </div>

                            <div className="text-center text-xs text-gray-400">
                                <Link href="/terms" className="hover:underline">Terms</Link> · <Link href="/privacy" className="hover:underline">Privacy</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* OTP Verification Modal */}
            {showOtpModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => !isOtpVerifying && setShowOtpModal(false)}
                    />
                    <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
                        {/* Header Decoration */}
                        <div className="h-2 bg-[var(--brand-royal-red)] w-full" />
                        
                        <div className="p-8">
                            {otpSuccessInModal ? (
                                <div className="text-center py-4">
                                    <div className="mx-auto h-20 w-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
                                        <CheckCircle className="h-10 w-10 text-green-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Verified!</h3>
                                    <p className="text-gray-600 mb-8">{otpNotice || "Your phone number has been verified successfully."}</p>
                                    <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Placing your order...
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="text-center mb-8">
                                        <div className="mx-auto h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                                            <Shield className="h-8 w-8 text-[var(--brand-royal-red)]" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">Verify Your Phone</h3>
                                        <p className="mt-2 text-sm text-gray-500">
                                            We've sent a 4-digit verification code to <span className="font-semibold text-gray-900">{formData.phone}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-center gap-3 mb-8">
                                        {otpDigits.map((digit, idx) => (
                                            <input
                                                key={`otp-${idx}`}
                                                id={`checkout-otp-${idx}`}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                                                onPaste={idx === 0 ? handleOtpPaste : undefined}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
                                                        const prevInput = document.getElementById(`checkout-otp-${idx - 1}`);
                                                        if (prevInput) prevInput.focus();
                                                    }
                                                }}
                                                className="h-14 w-14 rounded-2xl border-2 border-gray-100 bg-gray-50 text-center text-2xl font-bold text-gray-900 transition-all focus:border-[var(--brand-royal-red)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--brand-royal-red)]/10"
                                            />
                                        ))}
                                    </div>

                                    {otpNotice && (
                                        <p className="mb-4 text-center text-sm font-medium text-[var(--brand-royal-red)] animate-pulse">{otpNotice}</p>
                                    )}
                                    {otpErrorMessage && (
                                        <p className="mb-4 text-center text-sm font-medium text-red-600">{otpErrorMessage}</p>
                                    )}

                                    <div className="text-center mb-8">
                                        <button
                                            type="button"
                                            disabled={otpResendCooldown > 0 || isOtpSending}
                                            onClick={() => requestOtp(formData.phone)}
                                            className="text-sm font-semibold text-[var(--brand-royal-red)] hover:underline disabled:text-gray-400 disabled:no-underline flex items-center justify-center gap-2 mx-auto"
                                        >
                                            {isOtpSending && <Loader2 className="h-3 w-3 animate-spin" />}
                                            {otpResendCooldown > 0 ? `Resend code in ${otpResendCooldown}s` : "Didn't receive code? Resend"}
                                        </button>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowOtpModal(false)}
                                            disabled={isOtpVerifying}
                                            className="flex-1 rounded-2xl border-2 border-gray-100 bg-white py-4 text-sm font-bold text-gray-600 transition hover:bg-gray-50 hover:border-gray-200 disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleVerifyOtp()}
                                            disabled={isOtpVerifying}
                                            className="flex-1 rounded-2xl bg-[var(--brand-royal-red)] py-4 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:opacity-90 hover:translate-y-[-1px] disabled:opacity-60 flex items-center justify-center gap-2"
                                        >
                                            {isOtpVerifying ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                "Verify & Order"
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
