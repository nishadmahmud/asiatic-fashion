"use client";

import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCustomerOrders, getCustomerCoupons, getCouponList, collectCoupon, trackOrder, uploadSingleFile, getCustomerRefunds, getProductReviews, getProductById, getInvoiceSettings, updateCustomerPassword } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { Home, Package, Heart, Tag, User, LogOut, ChevronDown, Clock, CheckCircle, Truck, PackageCheck, XCircle, CheckCircle2, PauseCircle, ClipboardList, DollarSign, MapPin, RotateCcw, AlertTriangle, Eye, EyeOff } from "lucide-react";
import ReturnCancelModal from "@/components/ReturnCancelModal";
import WriteReviewModal from "@/components/WriteReviewModal";
import DOMPurify from "isomorphic-dompurify";

// Timeline stages configuration
const timelineStages = [
    { id: 1, label: "Order Received", icon: ClipboardList },
    { id: 2, label: "Order Confirmed", icon: PackageCheck },
    { id: 3, label: "Delivery Processing", icon: Truck },
    { id: 4, label: "Order Delivered", icon: Home },
];
const TAKA_SYMBOL = "৳";
const formatTaka = (amount) => `${TAKA_SYMBOL} ${Number(amount || 0).toLocaleString("en-US")}`;

const OrderTimeline = ({ currentStatus }) => {
    const status = Number(currentStatus);

    return (
        <div className="py-6 px-4">
            {/* Desktop Timeline */}
            <div className="hidden sm:block">
                <div className="relative flex items-center justify-between">
                    {/* Progress Line Background */}
                    <div className="absolute left-0 right-0 top-5 h-1 bg-gray-200 rounded-full" />
                    {/* Progress Line Active */}
                    <div
                        className="absolute left-0 top-5 h-1 bg-gradient-to-r from-[var(--brand-royal-red)] to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${((Math.min(status, 4) - 1) / 3) * 100}%` }}
                    />

                    {timelineStages.map((stage, index) => {
                        const isCompleted = status >= stage.id;
                        const isCurrent = status === stage.id;
                        const StageIcon = stage.icon;

                        return (
                            <div key={stage.id} className="relative flex flex-col items-center z-10">
                                {/* Circle */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted
                                    ? "bg-gradient-to-br from-[var(--brand-royal-red)] to-purple-600 text-white shadow-lg"
                                    : "bg-white border-2 border-gray-300 text-gray-400"
                                    } ${isCurrent ? "ring-4 ring-purple-100 scale-110" : ""}`}>
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                    ) : (
                                        <span className="text-sm font-medium">{stage.id}</span>
                                    )}
                                </div>

                                {/* Icon & Label */}
                                <div className={`mt-4 flex flex-col items-center ${isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                                    <StageIcon className={`w-6 h-6 mb-1 ${isCompleted ? "text-[var(--brand-royal-red)]" : ""}`} />
                                    <span className={`text-xs font-medium text-center max-w-[80px] ${isCurrent ? "font-bold" : ""}`}>
                                        {stage.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Timeline - Vertical */}
            <div className="sm:hidden space-y-4">
                {timelineStages.map((stage, index) => {
                    const isCompleted = status >= stage.id;
                    const isCurrent = status === stage.id;
                    const StageIcon = stage.icon;
                    const isLast = index === timelineStages.length - 1;

                    return (
                        <div key={stage.id} className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted
                                    ? "bg-gradient-to-br from-[var(--brand-royal-red)] to-purple-600 text-white"
                                    : "bg-white border-2 border-gray-300 text-gray-400"
                                    } ${isCurrent ? "ring-2 ring-purple-100" : ""}`}>
                                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">{stage.id}</span>}
                                </div>
                                {!isLast && (
                                    <div className={`w-0.5 h-8 ${isCompleted ? "bg-[var(--brand-royal-red)]" : "bg-gray-200"}`} />
                                )}
                            </div>
                            <div className={`flex items-center gap-2 pt-1 ${isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                                <StageIcon className={`w-5 h-5 ${isCompleted ? "text-[var(--brand-royal-red)]" : ""}`} />
                                <span className={`text-sm ${isCurrent ? "font-bold" : "font-medium"}`}>{stage.label}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const SpecialStatusUI = ({ status }) => {
    const isCanceled = Number(status) === 5;
    const isOnHold = Number(status) === 6;

    return (
        <div className={`py-8 px-6 text-center rounded-xl ${isCanceled ? "bg-red-50" : "bg-orange-50"
            }`}>
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${isCanceled ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                }`}>
                {isCanceled ? <XCircle className="w-8 h-8" /> : <PauseCircle className="w-8 h-8" />}
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isCanceled ? "text-red-700" : "text-orange-700"}`}>
                {isCanceled ? "Order Canceled" : "Order On Hold"}
            </h3>
            <p className={`text-sm ${isCanceled ? "text-red-600" : "text-orange-600"}`}>
                {isCanceled
                    ? "This order has been canceled. If you have any questions, please contact support."
                    : "This order is currently on hold. We will update you soon with more information."}
            </p>
        </div>
    );
};


const ORDER_TABS = [
    { id: "1", label: "Order Processing", Icon: Clock },
    { id: "2", label: "Order Confirmed", Icon: CheckCircle },
    { id: "3", label: "Delivery Processing", Icon: Truck },
    { id: "4", label: "Delivery Completed", Icon: PackageCheck },
    { id: "5", label: "Delivery Canceled", Icon: XCircle },
];

const SUPPORT_WHATSAPP_BASE = "https://wa.me/8801814111716";
const SUPPORT_FACEBOOK_INBOX = "https://www.facebook.com/brandempirebd";

export default function ProfileDashboard() {
    const { user, logout, loading, token, updateProfile, openAuthModal } = useAuth();
    const { wishlist, removeFromWishlist } = useWishlist();
    const { showToast } = useToast();
    const router = useRouter();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [ordersExpanded, setOrdersExpanded] = useState(true);
    const [activeSection, setActiveSection] = useState("dashboard");
    const [activeOrderTab, setActiveOrderTab] = useState("1");
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [refunds, setRefunds] = useState([]);
    const [refundsLoading, setRefundsLoading] = useState(false);
    const [refundProductMap, setRefundProductMap] = useState({});
    const [coupons, setCoupons] = useState([]);
    const [couponsLoading, setCouponsLoading] = useState(false);
    const [invoiceSettings, setInvoiceSettings] = useState(null);
    const [invoiceSettingsLoading, setInvoiceSettingsLoading] = useState(false);

    // Profile editing states
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        id: "",
        first_name: "",
        last_name: "",
        email: "",
        mobile_number: "",
        birthday_date: "",
        address: "",
        address_one: "",
        address_two: "",
        primary_address_field: "address"
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [settingPrimaryAddressField, setSettingPrimaryAddressField] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
    });
    const [passwordVisibility, setPasswordVisibility] = useState({
        current_password: false,
        new_password: false,
        new_password_confirmation: false,
    });
    const [passwordError, setPasswordError] = useState("");

    // Track order states
    const [trackInvoiceId, setTrackInvoiceId] = useState("");
    const [trackOrderData, setTrackOrderData] = useState(null);
    const [trackLoading, setTrackLoading] = useState(false);
    const [trackHasSearched, setTrackHasSearched] = useState(false);
    const [trackAccessDenied, setTrackAccessDenied] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(false);

    // Initial Auth Check
    useEffect(() => {
        const checkAuth = async () => {
            if (!user || !token) return;
            setIsCheckingAuth(true);
            try {
                // Try a small authed call to verify token
                const customerId = user.id || user.customer_id;
                const data = await getCustomerOrders(token, customerId, "1");
                
                // If it explicitly says unauthenticated
                if (data && data.success === false && 
                    (String(data.message).toLowerCase().includes("unauthenticated") || 
                     String(data.message).toLowerCase().includes("token"))) {
                    logout();
                }
            } catch (err) {
                // In this specific app, authed fetch failures (TypeError/CORS) 
                // typically mean a 302 redirect to an unauth page which fails CORS.
                console.error("Auth verification failed:", err);
                logout();
            } finally {
                setIsCheckingAuth(false);
            }
        };
        checkAuth();
    }, []); // Run once on mount

    // Order details modal state
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [reviewModal, setReviewModal] = useState({ open: false, productId: null, product: null });
    const [reviewedProductMap, setReviewedProductMap] = useState({});
    const [overviewDeliveredOrders, setOverviewDeliveredOrders] = useState([]);
    const [overviewDeliveredLoading, setOverviewDeliveredLoading] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/");
        } else if (user) {
            let first = user.first_name || "";
            let last = user.last_name || "";
            if (!first && user.name) {
                const parts = user.name.split(" ");
                first = parts[0];
                last = parts.slice(1).join(" ");
            }

            setFormData({
                id: user.id || user.customer_id,
                first_name: first,
                last_name: last,
                email: user.email || "",
                mobile_number: user.mobile_number || user.phone || "",
                birthday_date: (user.birthday_date || "").split("T")[0],
                address: user.address || "",
                address_one: user.address_one || "",
                address_two: user.address_two || "",
                primary_address_field: "address"
            });
            setPasswordForm({
                current_password: "",
                new_password: "",
                new_password_confirmation: "",
            });
            setPasswordVisibility({
                current_password: false,
                new_password: false,
                new_password_confirmation: false,
            });
            setPasswordError("");
            setShowPasswordFields(false);
        }
    }, [user, loading, router]);

    // Auth Guard
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-6 max-w-sm w-full animate-in fade-in zoom-in duration-500">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-red-50 rounded-full"></div>
                        <div className="absolute top-0 w-20 h-20 border-4 border-[var(--brand-royal-red)] border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <User className="w-8 h-8 text-[var(--brand-royal-red)] animate-pulse" />
                        </div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Finding your profile...</h3>
                        <p className="text-gray-500 text-sm">Please wait while we secure your session</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const normalizePhone = (phone) => {
        if (!phone) return "";
        let digits = String(phone).replace(/\D/g, "");

        if (digits.startsWith("880")) {
            digits = digits.slice(2);
        } else if (digits.startsWith("88") && digits.length > 11) {
            digits = digits.slice(2);
        }

        if (digits.length === 10) {
            digits = `0${digits}`;
        }

        return digits;
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsUpdating(true);

        try {
            let imageUrl = user?.image || null;


            // Step 1: Upload profile image if selected
            if (profileImage) {
                setImageUploading(true);
                const imageFormData = new FormData();
                imageFormData.append("file_name", profileImage);
                imageFormData.append("user_id", String(process.env.NEXT_PUBLIC_USER_ID));

                const uploadRes = await uploadSingleFile(imageFormData, token);

                if (uploadRes?.success && uploadRes?.path) {
                    imageUrl = uploadRes.path;
                } else {
                    toast.error("Failed to upload image. Please try again.");
                    setIsUpdating(false);
                    setImageUploading(false);
                    return;
                }
                setImageUploading(false);
            }

            // Step 2: Update profile with image URL
            const trimmedAddress = formData.address?.trim() || "";
            const trimmedAddressOne = formData.address_one?.trim() || "";
            const trimmedAddressTwo = formData.address_two?.trim() || "";

            const profileData = {
                id: formData.id,
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.mobile_number, // Backend requires 'phone' key
                birthday_date: formData.birthday_date || null,
                address: trimmedAddress || null,
                address_one: trimmedAddressOne || null,
                address_two: trimmedAddressTwo || null,
                image: imageUrl
            };

            const result = await updateProfile(profileData);
            if (result.success) {
                toast.success("Profile updated successfully!");
                setIsEditing(false);
                setProfileImage(null);
                setProfileImagePreview(null);
            } else {
                toast.error(result.message || "Failed to update profile");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Something went wrong");
        } finally {
            setIsUpdating(false);
            setImageUploading(false);
        }
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordError("");
        setPasswordForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        if (!user?.email) {
            showToast({ message: "User email is not available.", type: "error" });
            return;
        }

        if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.new_password_confirmation) {
            setPasswordError("Please fill in all password fields.");
            showToast({ message: "Please fill in all password fields.", type: "error" });
            return;
        }

        if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
            setPasswordError("New password and confirm password do not match.");
            showToast({ message: "New password and confirm password do not match.", type: "error" });
            return;
        }

        setPasswordError("");
        setIsChangingPassword(true);

        try {
            const result = await updateCustomerPassword(token, {
                email: user.email,
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password,
                new_password_confirmation: passwordForm.new_password_confirmation,
            });

            if (result?.success) {
                showToast({ message: result.message || "Password changed successfully!", type: "success" });
                setPasswordForm({
                    current_password: "",
                    new_password: "",
                    new_password_confirmation: "",
                });
                setPasswordVisibility({
                    current_password: false,
                    new_password: false,
                    new_password_confirmation: false,
                });
                setPasswordError("");
                setShowPasswordFields(false);
                return;
            }

            setPasswordError(result?.message || "Failed to update password.");
            showToast({ message: result?.message || "Failed to update password.", type: "error" });
        } catch (error) {
            console.error("Error updating password:", error);
            setPasswordError("Failed to update password. Please try again.");
            showToast({ message: "Failed to update password. Please try again.", type: "error" });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const swapPrimaryAddressInForm = (field) => {
        setFormData((prev) => {
            if (field !== "address_one" && field !== "address_two") return prev;

            const nextAddress = prev[field] || "";
            if (!nextAddress.trim()) return prev;

            return {
                ...prev,
                address: nextAddress,
                [field]: prev.address || "",
                primary_address_field: "address",
            };
        });
    };

    const handleSetPrimaryFromView = async (field) => {
        const chosenAddressRaw = field === "address_one" ? (user?.address_one || "") : (user?.address_two || "");
        const chosenAddress = chosenAddressRaw.trim();
        if (!chosenAddress) {
            toast.error("Address is empty");
            return;
        }

        const currentPrimaryRaw = user?.address || "";
        if (currentPrimaryRaw.trim() === chosenAddress) {
            toast.success("Already set as primary address");
            return;
        }

        let first = user?.first_name || "";
        let last = user?.last_name || "";
        if (!first && user?.name) {
            const parts = user.name.split(" ");
            first = parts[0];
            last = parts.slice(1).join(" ");
        }

        setSettingPrimaryAddressField(field);
        try {
            const profileData = {
                id: user?.id || user?.customer_id,
                first_name: first,
                last_name: last,
                email: user?.email || "",
                phone: user?.mobile_number || user?.phone || "",
                birthday_date: (user?.birthday_date || "").split("T")[0] || null,
                address: chosenAddressRaw.trim() || null,
                address_one: field === "address_one"
                    ? (currentPrimaryRaw.trim() || null)
                    : (user?.address_one?.trim() || null),
                address_two: field === "address_two"
                    ? (currentPrimaryRaw.trim() || null)
                    : (user?.address_two?.trim() || null),
                image: user?.image || null
            };

            const result = await updateProfile(profileData);
            if (result.success) {
                toast.success("Primary address switched");
            } else {
                toast.error(result.message || "Failed to update primary address");
            }
        } catch (error) {
            console.error("Error setting primary address:", error);
            toast.error("Something went wrong");
        } finally {
            setSettingPrimaryAddressField(null);
        }
    };

    // Return / Cancel modal state
    const [returnModal, setReturnModal] = useState({ open: false, order: null, mode: "return" });

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user || !token || activeSection !== "orders") return;

            setOrdersLoading(true);
            try {
                const customerId = user.id || user.customer_id;

                const [ordersData, refundsData] = await Promise.all([
                    getCustomerOrders(token, customerId, activeOrderTab),
                    getCustomerRefunds(token, customerId)
                ]);

                if (ordersData.success) {
                    let orderList = ordersData.data?.data || ordersData.data || [];
                    orderList = Array.isArray(orderList) ? orderList : [];

                    if (refundsData.success) {
                        const refundList = refundsData.data?.data || refundsData.data || [];
                    }

                    setOrders(orderList);
                } else {
                    setOrders([]);
                    // Check for auth failure in response
                    if (String(ordersData.message).toLowerCase().includes("unauthenticated")) {
                        logout();
                    }
                }
            } catch (err) {
                console.error("Failed to fetch orders or refunds", err);
                setOrders([]);
                // If we have a token but fetch failed (likely CORS error from redirect)
                if (token) {
                    logout();
                }
            } finally {
                setOrdersLoading(false);
            }
        };

        fetchOrders();
    }, [user, token, activeSection, activeOrderTab]);

    useEffect(() => {
        const fetchRefunds = async () => {
            if (!user || !token || !["dashboard", "orders", "refunds", "returns"].includes(activeSection)) return;

            setRefundsLoading(true);
            try {
                const customerId = user.id || user.customer_id;
                const data = await getCustomerRefunds(token, customerId);

                if (data.success) {
                    const refundList = data.data?.data || data.data || [];
                    setRefunds(Array.isArray(refundList) ? refundList : []);
                } else {
                    setRefunds([]);
                    if (String(data.message).toLowerCase().includes("unauthenticated")) {
                        logout();
                    }
                }
            } catch (err) {
                console.error("Failed to fetch refunds", err);
                setRefunds([]);
                if (token) {
                    logout();
                }
            } finally {
                setRefundsLoading(false);
            }
        };

        fetchRefunds();
    }, [user, token, activeSection]);

    useEffect(() => {
        const fetchCoupons = async () => {
            if (!user || activeSection !== "coupons") return;

            setCouponsLoading(true);
            try {
                const customerId = user.id || user.customer_id;
                const data = await getCustomerCoupons(customerId);

                if (data.success && data.data) {
                    setCoupons(Array.isArray(data.data) ? data.data : []);
                } else {
                    setCoupons([]);
                }
            } catch (err) {
                console.error("Failed to fetch coupons", err);
                setCoupons([]);
            } finally {
                setCouponsLoading(false);
            }
        };

        fetchCoupons();
    }, [user, activeSection]);

    useEffect(() => {
        const fetchInvoiceSettings = async () => {
            if (!["terms", "privacy"].includes(activeSection)) return;
            if (invoiceSettings) return;

            setInvoiceSettingsLoading(true);
            try {
                const response = await getInvoiceSettings();
                setInvoiceSettings(response?.data || {});
            } catch (error) {
                console.error("Failed to fetch invoice settings", error);
                setInvoiceSettings({});
            } finally {
                setInvoiceSettingsLoading(false);
            }
        };

        fetchInvoiceSettings();
    }, [activeSection, invoiceSettings]);

    useEffect(() => {
        if (!refunds || refunds.length === 0) return;

        const productIds = [...new Set(
            refunds
                .flatMap((refund) => (refund?.refund_details || []).map((item) => Number(item?.product_id)))
                .filter((id) => Number.isFinite(id) && id > 0)
        )];

        const missingProductIds = productIds.filter((id) => !refundProductMap[id]);
        if (missingProductIds.length === 0) return;

        let cancelled = false;

        const fetchRefundProducts = async () => {
            try {
                const entries = await Promise.all(
                    missingProductIds.map(async (productId) => {
                        try {
                            const response = await getProductById(productId);
                            const product = response?.data || {};
                            const image = product?.image_path
                                || (Array.isArray(product?.image_paths) ? product.image_paths[0] : null)
                                || null;

                            return [productId, { id: productId, name: product?.name || null, image }];
                        } catch (err) {
                            console.error(`Failed to fetch product details for refund item ${productId}`, err);
                            return [productId, { id: productId, name: null, image: null }];
                        }
                    })
                );

                if (cancelled) return;
                setRefundProductMap((prev) => {
                    const next = { ...prev };
                    entries.forEach(([id, data]) => {
                        next[id] = data;
                    });
                    return next;
                });
            } catch (err) {
                console.error("Failed to fetch refund product data", err);
            }
        };

        fetchRefundProducts();

        return () => {
            cancelled = true;
        };
    }, [refunds, refundProductMap]);

    useEffect(() => {
        const fetchOverviewDeliveredOrders = async () => {
            if (!user || !token || activeSection !== "dashboard") return;

            setOverviewDeliveredLoading(true);
            try {
                const customerId = user.id || user.customer_id;
                const [ordersData, refundsData] = await Promise.all([
                    getCustomerOrders(token, customerId, "4"),
                    getCustomerRefunds(token, customerId)
                ]);

                if (ordersData.success) {
                    let deliveredList = ordersData.data?.data || ordersData.data || [];
                    deliveredList = Array.isArray(deliveredList) ? deliveredList : [];

                    if (refundsData.success) {
                        const refundList = refundsData.data?.data || refundsData.data || [];
                        deliveredList = removeRefundedItemsFromOrders(deliveredList, refundList);
                    }

                    setOverviewDeliveredOrders(deliveredList);
                } else {
                    setOverviewDeliveredOrders([]);
                }
            } catch (err) {
                console.error("Failed to fetch delivered overview orders", err);
                setOverviewDeliveredOrders([]);
            } finally {
                setOverviewDeliveredLoading(false);
            }
        };

        fetchOverviewDeliveredOrders();
    }, [user, token, activeSection]);

    const handleTrackOrder = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error("Please login to track your order");
            openAuthModal("login");
            return;
        }

        if (!trackInvoiceId.trim()) {
            toast.error("Please enter Invoice ID");
            return;
        }

        setTrackLoading(true);
        setTrackOrderData(null);
        setTrackHasSearched(true);
        setTrackAccessDenied(false);

        try {
            const response = await trackOrder({ invoice_id: trackInvoiceId });
            if (response.success && response.data?.data && response.data.data.length > 0) {
                const foundOrder = response.data.data[0];
                const orderPhone = normalizePhone(foundOrder.delivery_customer_phone || foundOrder.customer_phone);
                const userPhone = normalizePhone(user.mobile_number || user.phone);

                if (!orderPhone || !userPhone || orderPhone !== userPhone) {
                    setTrackAccessDenied(true);
                    setTrackOrderData(null);
                    toast.error("Sorry, we can't share this order details with you.");
                    return;
                }

                setTrackOrderData(foundOrder);
                toast.success("Order found!");
            } else {
                toast.error("Order not found");
                setTrackOrderData(null);
            }
        } catch (error) {
            console.error("Error tracking order:", error);
            toast.error("Something went wrong");
            setTrackOrderData(null);
        } finally {
            setTrackLoading(false);
        }
    };

    const getStatusLabel = (status) => {
        switch (Number(status)) {
            case 1: return "Order Received";
            case 2: return "Order Confirmed";
            case 3: return "Delivery Processing";
            case 4: return "Order Delivered";
            case 5: return "Canceled";
            case 6: return "On Hold";
            default: return "Pending";
        }
    };

    const getRefundedSaleDetailIdSet = (refundsList) => {
        const ids = new Set();
        (refundsList || []).forEach(refund => {
            const status = String(refund?.status ?? "").toLowerCase();
            const isRejected = status === "rejected" || status === "2";
            if (isRejected) return;

            (refund.refund_details || []).forEach(item => {
                const saleDetailId = Number(item.sale_details_id);
                if (Number.isFinite(saleDetailId) && saleDetailId > 0) {
                    ids.add(saleDetailId);
                }
            });
        });
        return ids;
    };

    const TAKA_SYMBOL = "Tk";

    // Derived State for Order List
    const refundedSaleDetailIds = getRefundedSaleDetailIdSet(refunds);
    const filteredOrders = (orders || []).filter(order => {
        const orderItems = order?.sales_details || [];
        const isFullyCanceled = orderItems.length > 0 && orderItems.every(item => refundedSaleDetailIds.has(Number(item.id)));
        if (activeOrderTab === "5") return isFullyCanceled;
        return !isFullyCanceled;
    });

    const getStatusColor = (status) => {
        const s = Number(status);
        if (s === 1) return "bg-blue-50 text-blue-700 border-blue-100";
        if (s === 2) return "bg-indigo-50 text-indigo-700 border-indigo-100";
        if (s === 3) return "bg-purple-50 text-purple-700 border-purple-100";
        if (s === 4) return "bg-green-50 text-green-700 border-green-100";
        if (s === 5) return "bg-red-50 text-red-700 border-red-100";
        if (s === 6) return "bg-orange-50 text-orange-700 border-orange-100";
        return "bg-gray-100 text-gray-800";
    };

    const getOrderStatus = (order) => Number(order?.tran_status ?? order?.status ?? 0);

    const formatOrderDateTime = (value) => {
        if (!value) return "Date unavailable";
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return "Date unavailable";

        return parsed.toLocaleString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const parseReturnDaysFromText = (text) => {
        if (!text || typeof text !== "string") return 0;
        const match = text.match(/(\d+)/);
        return match ? Number(match[1]) : 0;
    };

    const getOrderReturnWindowDays = (order) => {
        const daysList = (order?.sales_details || [])
            .map((item) => parseReturnDaysFromText(item?.product_info?.return_delivery_days))
            .filter((days) => Number.isFinite(days) && days > 0);

        if (daysList.length === 0) return 0;
        return Math.max(...daysList);
    };

    const isRefundEligibleForDeliveredOrder = (order) => {
        const status = getOrderStatus(order);
        if (status !== 4) return false;

        const returnWindowDays = getOrderReturnWindowDays(order);
        if (returnWindowDays <= 0) return false;

        const deliveredAt = order?.updated_at || order?.created_at;
        const deliveredTime = new Date(deliveredAt).getTime();
        if (!Number.isFinite(deliveredTime)) return false;

        const elapsedMs = Date.now() - deliveredTime;
        const windowMs = returnWindowDays * 24 * 60 * 60 * 1000;
        return elapsedMs >= 0 && elapsedMs <= windowMs;
    };

    const getProductIdFromSaleItem = (saleItem) => {
        const rawId = saleItem?.product_id ?? saleItem?.product_info?.id;
        const numeric = Number(rawId);
        return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
    };

    const overviewDeliveredItems = (overviewDeliveredOrders || []).flatMap((order) => {
        const orderStatus = getOrderStatus(order);
        if (orderStatus !== 4) return [];

        return (order?.sales_details || []).map((item, idx) => {
            const productId = getProductIdFromSaleItem(item);
            return {
                key: `${order?.id || order?.invoice_id || "order"}-${item?.id || idx}`,
                order,
                item,
                productId,
                quantity: Number(item?.qty || item?.quantity || 1),
                name: item?.product_info?.name || "Product",
                image: item?.product_info?.image_path || null,
            };
        });
    });

    useEffect(() => {
        if (!user || !token) return;
        const customerIds = [user?.customer_id, user?.id]
            .filter((id) => id !== null && id !== undefined && String(id).trim() !== "")
            .map((id) => String(id));

        const deliveredOrderItems = (orders || []).flatMap((order) => {
            if (getOrderStatus(order) !== 4) return [];
            return (order?.sales_details || []).map((item) => getProductIdFromSaleItem(item)).filter(Boolean);
        });

        const overviewItems = (overviewDeliveredOrders || []).flatMap((order) => {
            if (getOrderStatus(order) !== 4) return [];
            return (order?.sales_details || []).map((item) => getProductIdFromSaleItem(item)).filter(Boolean);
        });

        const uniqueProductIds = [...new Set([...deliveredOrderItems, ...overviewItems])];
        const missingProductIds = uniqueProductIds.filter((productId) => reviewedProductMap[productId] === undefined);
        if (missingProductIds.length === 0) return;

        let cancelled = false;

        const fetchReviewStatus = async () => {
            try {
                const statusPairs = await Promise.all(
                    missingProductIds.map(async (productId) => {
                        try {
                            const response = await getProductReviews(productId);
                            const reviews = response?.data || [];
                            const hasReviewed = (Array.isArray(reviews) ? reviews : []).some((review) => {
                                const reviewCustomerIds = [
                                    review?.customer_id,
                                    review?.customer?.id,
                                    review?.customer?.customer_id,
                                    review?.customer?.user_id
                                ]
                                    .filter((id) => id !== null && id !== undefined && String(id).trim() !== "")
                                    .map((id) => String(id));

                                return reviewCustomerIds.some((id) => customerIds.includes(id));
                            });
                            return [productId, hasReviewed];
                        } catch (err) {
                            console.error(`Failed to fetch review status for product ${productId}`, err);
                            return [productId, false];
                        }
                    })
                );

                if (cancelled) return;
                setReviewedProductMap((prev) => {
                    const next = { ...prev };
                    statusPairs.forEach(([productId, hasReviewed]) => {
                        next[productId] = hasReviewed;
                    });
                    return next;
                });
            } catch (err) {
                console.error("Failed to fetch review statuses", err);
            }
        };

        fetchReviewStatus();

        return () => {
            cancelled = true;
        };
    }, [user, token, orders, overviewDeliveredOrders, reviewedProductMap]);

    const openReviewForItem = (item) => {
        const productId = getProductIdFromSaleItem(item);
        if (!productId) {
            toast.error("Product is not available for review.");
            return;
        }

        setReviewModal({
            open: true,
            productId,
            product: {
                id: productId,
                name: item?.product_info?.name || "Product",
                images: item?.product_info?.image_path ? [item.product_info.image_path] : []
            }
        });
    };


    const roundAmount = (amount) => Math.round(Number(amount || 0));
    const getDonationAmount = (order) => Math.max(0, Number(order?.donation_amount ?? order?.donation ?? 0));
    const walletBalance = Number(user?.wallet_balance || 0);
    const loyaltyPoints = Math.round(walletBalance);
    const membershipTiers = [
        { name: "Basic", threshold: 0, color: "bg-green-500" },
        { name: "Silver", threshold: 3000, color: "bg-slate-400" },
        { name: "Gold", threshold: 15000, color: "bg-amber-500" },
        { name: "VIP", threshold: 30000, color: "bg-purple-600" },
    ];
    const currentTierIndex = membershipTiers.reduce((activeIndex, tier, index) => (
        loyaltyPoints >= tier.threshold ? index : activeIndex
    ), 0);
    const currentTier = membershipTiers[currentTierIndex];
    const nextTier = membershipTiers[currentTierIndex + 1] || null;
    const pointsToNextTier = nextTier ? Math.max(0, nextTier.threshold - loyaltyPoints) : 0;
    const tierProgress = nextTier
        ? Math.min(
            100,
            ((loyaltyPoints - currentTier.threshold) / Math.max(1, nextTier.threshold - currentTier.threshold)) * 100
        )
        : 100;



    const removeRefundedItemsFromOrders = (orderList = [], refundList = []) => {
        const refundedSaleDetailIds = getRefundedSaleDetailIdSet(refundList);
        if (refundedSaleDetailIds.size === 0) return Array.isArray(orderList) ? orderList : [];

        return (Array.isArray(orderList) ? orderList : [])
            .map((order) => {
                const salesDetails = Array.isArray(order?.sales_details) ? order.sales_details : [];
                const remainingSalesDetails = salesDetails.filter((item) => !refundedSaleDetailIds.has(Number(item?.id)));
                return { ...order, sales_details: remainingSalesDetails };
            })
            .filter((order) => (order?.sales_details || []).length > 0);
    };

    const CANCEL_REASONS = [
        "Ordered wrong item",
        "Changed my mind",
        "Found a better price elsewhere",
        "Duplicate order",
        "Delivery taking too long",
    ];

    const renderRefundReturnCards = (requestType = "return") => {
        const filteredRefunds = refunds.filter((refund) => {
            const isCancelReason = CANCEL_REASONS.includes(refund.reason);
            const isPreDelivery = refund.sale && Number(refund.sale.tran_status || refund.sale.status) < 4;
            const isCancellation = isCancelReason || isPreDelivery;

            if (requestType === "return") {
                return !isCancellation;
            }
            return true;
        });

        return (
            <div className="space-y-6">
                {filteredRefunds.map((refund) => {
                    const isRefundRequestTab = requestType === "refund";
                    const isPending = String(refund.status).toLowerCase() === "0" || String(refund.status).toLowerCase() === "pending";
                    const isApproved = String(refund.status).toLowerCase() === "1" || String(refund.status).toLowerCase() === "approved";
                    const statusLabel = isPending ? "Pending Review" : (isApproved ? "Approved" : "Rejected");
                const statusColor = isPending ? "bg-orange-50 text-orange-600 border-orange-200" : (isApproved ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200");
                const refundItems = (refund.refund_details || []).map((item, idx) => {
                    const matchedSaleItem = refund.sale?.sales_details?.find((sd) => sd.id == item.sale_details_id);
                    const productId = Number(item.product_id || matchedSaleItem?.product_id || 0);
                    const fallbackMeta = refundProductMap[productId] || {};
                    const productName = matchedSaleItem?.product_info?.name || fallbackMeta?.name || `Product #${item.product_id}`;
                    const imageUrl = matchedSaleItem?.product_info?.image_path
                        || (Array.isArray(matchedSaleItem?.product_info?.image_paths) ? matchedSaleItem.product_info.image_paths[0] : null)
                        || fallbackMeta?.image
                        || null;

                    return {
                        key: `${item.sale_details_id || item.product_id || idx}-${idx}`,
                        item,
                        matchedSaleItem,
                        productId,
                        productName,
                        imageUrl,
                    };
                });

                return (
                    <div key={refund.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 group overflow-hidden">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-5 border-b border-gray-100 pb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        {isRefundRequestTab ? "Refund Request" : "Return Request"}
                                    </span>
                                    <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${statusColor}`}>
                                        {statusLabel}
                                    </div>
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">#{refund.invoice_id}</h3>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {new Date(refund.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                            </div>
                            {refund.sale && (
                                <div className="text-right bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-0.5">Total amount</p>
                                    <p className="text-lg font-bold text-[var(--brand-royal-red)]">{TAKA_SYMBOL}{roundAmount(refund.sale.sub_total)}</p>
                                </div>
                            )}
                        </div>

                        {refundItems.length > 0 && (
                            <div className="mb-5">
                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Products</h4>
                                <div className="flex flex-wrap gap-2">
                                    {refundItems.map(({ key, productId, productName, imageUrl }) => (
                                        productId ? (
                                            <a
                                                key={key}
                                                href={`/product/${productId}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="h-12 w-12 rounded-lg overflow-hidden border border-gray-200 bg-white hover:border-[var(--brand-royal-red)] transition-colors"
                                                title={productName}
                                            >
                                                {imageUrl ? (
                                                    <Image src={imageUrl} alt={productName} width={48} height={48} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                        <Package className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </a>
                                        ) : (
                                            <div
                                                key={key}
                                                className="h-12 w-12 rounded-lg overflow-hidden border border-gray-200 bg-white"
                                                title={productName}
                                            >
                                                {imageUrl ? (
                                                    <Image src={imageUrl} alt={productName} width={48} height={48} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                        <Package className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Request Details</h4>

                                    <div className="space-y-3 text-sm">
                                        {!isRefundRequestTab && (
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm text-gray-400 group-hover:text-blue-500 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <span className="block text-xs font-semibold text-gray-500 mb-0.5">Reason for Return</span>
                                                    <span className="text-gray-900 font-medium">{refund.reason}</span>
                                                    {refund.reason_note && (
                                                        <span className="block text-gray-500 text-xs mt-1 italic leading-relaxed bg-white/60 p-2 rounded-lg border border-gray-100/50">"{refund.reason_note}"</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm text-gray-400 group-hover:text-green-500 transition-colors">
                                                <span className="font-bold">Tk</span>
                                            </div>
                                            <div>
                                                <span className="block text-xs font-semibold text-gray-500 mb-0.5">Preferred Refund Method</span>
                                                <span className="text-gray-900 font-medium capitalize">{refund.refund_method?.replace(/_/g, " ")}</span>
                                            </div>
                                        </div>

                                        {!isRefundRequestTab && (
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm text-gray-400 group-hover:text-orange-500 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <span className="block text-xs font-semibold text-gray-500 mb-0.5">Courier Info</span>
                                                    <span className="text-gray-900 font-medium capitalize">{refund.courier_info || "Not Specified"}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {refundItems.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                                            {isRefundRequestTab ? "Order Items" : "Items Included"}
                                        </h4>
                                        <div className="space-y-3">
                                            {refundItems.map(({ key, item, matchedSaleItem, productId, productName, imageUrl }) => {
                                                return (
                                                    <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            {productId ? (
                                                                <a
                                                                    href={`/product/${productId}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="w-10 h-10 bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center text-gray-400 flex-shrink-0"
                                                                >
                                                                    {imageUrl ? (
                                                                        <Image src={imageUrl} alt={productName} width={40} height={40} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <Package className="w-5 h-5" />
                                                                    )}
                                                                </a>
                                                            ) : (
                                                                <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center text-gray-400 flex-shrink-0">
                                                                    {imageUrl ? (
                                                                        <Image src={imageUrl} alt={productName} width={40} height={40} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <Package className="w-5 h-5" />
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                {productId ? (
                                                                    <a
                                                                        href={`/product/${productId}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-sm font-semibold text-gray-900 hover:text-[var(--brand-royal-red)] line-clamp-1"
                                                                    >
                                                                        {productName}
                                                                    </a>
                                                                ) : (
                                                                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{productName}</p>
                                                                )}
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-xs text-gray-500">Qty: {item.qty}</span>
                                                                    {matchedSaleItem?.size && (
                                                                        <>
                                                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                                            <span className="text-xs text-gray-500">Size: {matchedSaleItem.size}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-gray-900">{TAKA_SYMBOL}{roundAmount(item.price)}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {!isRefundRequestTab && refund.attachment && (
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Attachment Provided</h4>
                                        <a href={refund.attachment} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 p-2 pr-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all group/attach">
                                            <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 overflow-hidden relative">
                                                <Image src={refund.attachment} alt="Attachment" fill className="object-cover group-hover/attach:scale-110 transition-transform duration-300" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 group-hover/attach:text-[var(--brand-royal-red)]">View Attachment</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            </div>
        );
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--brand-royal-red)]"></div>
            </div>
        );
    }

    const userName = user.first_name || user.name?.split(" ")[0] || "User";

    return (
        <div className="min-h-screen bg-gray-50 pt-4 md:pt-6">
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[65] lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-6">
                {/* Mobile Menu Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden mb-4 flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50"
                >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                    <span className="font-medium text-sm">Menu</span>
                </button>

                <div className="flex gap-6 items-start">
                    {/* Sidebar - Hidden on mobile, overlay when opened */}
                    <aside className={`
                        fixed lg:static
                        top-0 lg:top-auto left-0 lg:left-auto
                        w-72
                        bg-white
                        z-[70] lg:z-auto
                        transform lg:transform-none transition-transform duration-300
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                        lg:block
                        flex-shrink-0
                        h-screen lg:h-auto
                    `}>
                        <div className="bg-white lg:rounded-2xl shadow-lg lg:sticky lg:top-24 h-full lg:h-auto flex flex-col overflow-hidden">
                            {/* Mobile Close Button */}
                            <div className="lg:hidden flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex-shrink-0">
                                <span className="font-bold">Menu</span>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>

                            {/* Desktop Header with Logo */}
                            <div className="p-5 bg-gradient-to-r from-gray-900 to-gray-800 hidden lg:block">
                                <Link href="/" className="flex items-center">
                                    <div className="relative h-10 w-36">
                                        <Image src="/logo.png" alt="Brand Empire" fill className="object-contain" />
                                    </div>
                                </Link>
                            </div>

                            <nav className="p-4 flex-1 overflow-y-auto pb-20 lg:pb-4 bg-gray-50/50">
                                {/* Overview - Active indicator */}
                                <button onClick={() => { setActiveSection("dashboard"); setSidebarOpen(false); }}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-3 ${activeSection === "dashboard"
                                        ? "bg-gradient-to-r from-[var(--brand-royal-red)] to-red-500 text-white shadow-lg shadow-red-500/30"
                                        : "text-gray-700 hover:bg-white hover:shadow-md"}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    Overview
                                </button>

                                {/* ORDERS Section */}
                                <div className="mt-6">
                                    <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Orders</p>
                                    <button onClick={() => { setActiveSection("orders"); setSidebarOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3 ${activeSection === "orders"
                                            ? "bg-white text-[var(--brand-royal-red)] font-semibold shadow-sm"
                                            : "text-gray-600 hover:bg-white hover:text-gray-900"}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        My Orders
                                    </button>
                                    <button onClick={() => { setActiveSection("refunds"); setSidebarOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3 ${activeSection === "refunds"
                                            ? "bg-white text-[var(--brand-royal-red)] font-semibold shadow-sm"
                                            : "text-gray-600 hover:bg-white hover:text-gray-900"}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                        My Refunds
                                    </button>
                                    <button onClick={() => { setActiveSection("returns"); setSidebarOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3 ${activeSection === "returns"
                                            ? "bg-white text-[var(--brand-royal-red)] font-semibold shadow-sm"
                                            : "text-gray-600 hover:bg-white hover:text-gray-900"}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
                                        </svg>
                                        My Returns
                                    </button>
                                    <button onClick={() => { setActiveSection("tracking"); setSidebarOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3 ${activeSection === "tracking"
                                            ? "bg-white text-[var(--brand-royal-red)] font-semibold shadow-sm"
                                            : "text-gray-600 hover:bg-white hover:text-gray-900"}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                        </svg>
                                        Track Order
                                    </button>
                                </div>

                                {/* CREDITS Section */}
                                <div className="mt-6">
                                    <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Credits</p>
                                    <button onClick={() => { setActiveSection("coupons"); setSidebarOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3 ${activeSection === "coupons"
                                            ? "bg-white text-[var(--brand-royal-red)] font-semibold shadow-sm"
                                            : "text-gray-600 hover:bg-white hover:text-gray-900"}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        Coupons
                                    </button>
                                    <button onClick={() => { setActiveSection("benefits"); setSidebarOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3 ${activeSection === "benefits"
                                            ? "bg-white text-[var(--brand-royal-red)] font-semibold shadow-sm"
                                            : "text-gray-600 hover:bg-white hover:text-gray-900"}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                        My Points
                                    </button>
                                </div>

                                {/* ACCOUNT Section */}
                                <div className="mt-6">
                                    <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Account</p>
                                    <button onClick={() => { setActiveSection("profile"); setSidebarOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3 ${activeSection === "profile"
                                            ? "bg-white text-[var(--brand-royal-red)] font-semibold shadow-sm"
                                            : "text-gray-600 hover:bg-white hover:text-gray-900"}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Profile
                                    </button>
                                    <button onClick={() => { setActiveSection("wishlist"); setSidebarOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3 justify-between ${activeSection === "wishlist"
                                            ? "bg-white text-[var(--brand-royal-red)] font-semibold shadow-sm"
                                            : "text-gray-600 hover:bg-white hover:text-gray-900"}`}>
                                        <div className="flex items-center gap-3">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                            Wishlist
                                        </div>
                                        {wishlist.length > 0 && <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{wishlist.length}</span>}
                                    </button>
                                    <button onClick={() => { setActiveSection("addresses"); setSidebarOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3 ${activeSection === "addresses"
                                            ? "bg-white text-[var(--brand-royal-red)] font-semibold shadow-sm"
                                            : "text-gray-600 hover:bg-white hover:text-gray-900"}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Addresses
                                    </button>
                                </div>

                                {/* LEGAL Section */}
                                <div className="mt-6">
                                    <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Legal</p>
                                    <button onClick={() => { setActiveSection("terms"); setSidebarOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3 ${activeSection === "terms"
                                            ? "bg-white text-[var(--brand-royal-red)] font-semibold shadow-sm"
                                            : "text-gray-600 hover:bg-white hover:text-gray-900"}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Terms of Use
                                    </button>
                                    <button onClick={() => { setActiveSection("privacy"); setSidebarOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3 ${activeSection === "privacy"
                                            ? "bg-white text-[var(--brand-royal-red)] font-semibold shadow-sm"
                                            : "text-gray-600 hover:bg-white hover:text-gray-900"}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        Privacy Center
                                    </button>
                                </div>

                                {/* Logout */}
                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <button onClick={logout} className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center gap-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content Area - Full width on mobile */}
                    <div className="flex-1 w-full lg:w-auto min-w-0">
                        {/* Dashboard / Overview */}
                        {activeSection === "dashboard" && (
                            <>
                                {/* User Profile Header - Premium Design */}
                                <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-4 md:p-6 mb-4 md:mb-6 flex items-center gap-4 md:gap-6 shadow-xl">
                                    {/* Avatar with ring */}
                                    <div className="relative">
                                        <div className="w-14 h-14 md:w-20 md:h-20 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-white/30 ring-offset-2 ring-offset-gray-900">
                                            {user?.image ? (
                                                <Image
                                                    src={user.image}
                                                    alt="Profile"
                                                    width={80}
                                                    height={80}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <svg className="w-7 h-7 md:w-10 md:h-10 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                </svg>
                                            )}
                                        </div>
                                        {/* Online indicator */}
                                        <div className="absolute bottom-0 right-0 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                                    </div>
                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-base md:text-xl font-bold text-white truncate">{userName}</h1>
                                        <p className="text-white/60 text-xs md:text-sm truncate">{user?.email || user?.mobile_number || ""}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 bg-[var(--brand-royal-red)] text-white text-[10px] md:text-xs font-bold rounded-full">VIP MEMBER</span>
                                        </div>
                                    </div>
                                    {/* Edit Button */}
                                    <button
                                        onClick={() => { setActiveSection("profile"); setIsEditing(true); }}
                                        className="px-3 py-1.5 md:px-5 md:py-2.5 bg-white text-gray-900 hover:bg-gray-100 rounded-lg text-xs md:text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0 shadow-lg"
                                    >
                                        Edit Profile
                                    </button>
                                </div>

                                {/* Action Cards Grid - Premium Design */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
                                    {/* Orders Card */}
                                    <button
                                        onClick={() => setActiveSection("orders")}
                                        className="bg-white rounded-2xl p-4 md:p-6 text-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                                    >
                                        <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm md:text-base mb-0.5">Orders</h3>
                                        <p className="text-[10px] md:text-xs text-gray-500">Check your order status</p>
                                    </button>

                                    {/* Refunds Card */}
                                    <button
                                        onClick={() => setActiveSection("refunds")}
                                        className="bg-white rounded-2xl p-4 md:p-6 text-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                                    >
                                        <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm md:text-base mb-0.5">Refunds</h3>
                                        <p className="text-[10px] md:text-xs text-gray-500">Track return requests</p>
                                    </button>

                                    {/* Wishlist Card */}
                                    <button
                                        onClick={() => setActiveSection("wishlist")}
                                        className="bg-white rounded-2xl p-4 md:p-6 text-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                                    >
                                        <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm md:text-base mb-0.5">Wishlist</h3>
                                        <p className="text-[10px] md:text-xs text-gray-500">All your saved products</p>
                                    </button>

                                    {/* Coupons Card */}
                                    <button
                                        onClick={() => setActiveSection("coupons")}
                                        className="bg-white rounded-2xl p-4 md:p-6 text-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                                    >
                                        <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm md:text-base mb-0.5">Coupons</h3>
                                        <p className="text-[10px] md:text-xs text-gray-500">Your available discounts</p>
                                    </button>

                                    {/* My Points Card */}
                                    <button
                                        onClick={() => setActiveSection("benefits")}
                                        className="bg-white rounded-2xl p-4 md:p-6 text-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                                    >
                                        <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm md:text-base mb-0.5">My Points</h3>
                                        <p className="text-[10px] md:text-xs text-gray-500">Manage your rewards</p>
                                    </button>

                                    {/* Track Order Card */}
                                    <button
                                        onClick={() => setActiveSection("tracking")}
                                        className="bg-white rounded-2xl p-4 md:p-6 text-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                                    >
                                        <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm md:text-base mb-0.5">Track Order</h3>
                                        <p className="text-[10px] md:text-xs text-gray-500">Track your shipments</p>
                                    </button>

                                    {/* Profile Card */}
                                    <button
                                        onClick={() => { setActiveSection("profile"); setIsEditing(true); }}
                                        className="bg-white rounded-2xl p-4 md:p-6 text-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                                    >
                                        <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm md:text-base mb-0.5">Profile</h3>
                                        <p className="text-[10px] md:text-xs text-gray-500">Edit your account</p>
                                    </button>
                                </div>

                                <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                        <h3 className="text-lg font-bold text-gray-900">Delivered Products</h3>
                                        <p className="text-xs text-gray-500 mt-1">Leave a review for products you received</p>
                                    </div>

                                    <div className="p-5">
                                        {overviewDeliveredLoading ? (
                                            <div className="flex justify-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--brand-royal-red)]"></div>
                                            </div>
                                        ) : overviewDeliveredItems.length > 0 ? (
                                            <div className="space-y-3">
                                                {overviewDeliveredItems.map(({ key, order, item, productId, quantity, name, image }) => {
                                                    const alreadyReviewed = !!(productId && reviewedProductMap[productId]);

                                                    return (
                                                        <div key={key} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:shadow-sm transition-all">
                                                            <div className="h-14 w-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                                                                {image ? (
                                                                    <Image
                                                                        src={image}
                                                                        alt={name}
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                                        <Package size={18} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                {productId ? (
                                                                    <Link
                                                                        href={`/product/${productId}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="block text-sm font-semibold text-gray-900 line-clamp-1 hover:text-[var(--brand-royal-red)] transition-colors"
                                                                    >
                                                                        {name}
                                                                    </Link>
                                                                ) : (
                                                                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{name}</p>
                                                                )}
                                                                <p className="text-xs text-gray-500">Order #{order?.invoice_id} - Qty: {quantity}</p>
                                                            </div>
                                                            {alreadyReviewed ? (
                                                                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full bg-green-50 text-green-700 border border-green-200">
                                                                    Reviewed
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => openReviewForItem(item)}
                                                                    className="px-3 py-2 text-xs font-semibold rounded-lg bg-[var(--brand-royal-red)] text-white hover:bg-[#a01830] transition-colors"
                                                                >
                                                                    Leave a Review
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No delivered products found yet.</p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Orders with Tabs */}
                        {activeSection === "orders" && (
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800">
                                    <h2 className="text-2xl font-bold text-white">My Orders</h2>
                                    <p className="text-white/60 text-sm mt-1">Track and manage your orders</p>
                                </div>

                                <div className="border-b overflow-x-auto bg-gray-50">
                                    <div className="flex">
                                        {ORDER_TABS.map(tab => {
                                            const IconComponent = tab.Icon;
                                            return (
                                                <button key={tab.id} onClick={() => setActiveOrderTab(tab.id)}
                                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${activeOrderTab === tab.id
                                                        ? "border-[var(--brand-royal-red)] text-[var(--brand-royal-red)] bg-white"
                                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50"}`}>
                                                    <IconComponent size={18} />
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="p-6">
                                    {ordersLoading ? (
                                        <div className="flex justify-center py-20">
                                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--brand-royal-red)]"></div>
                                        </div>
                                    ) : orders.length > 0 ? (
                                        <div className="space-y-4">
                                            {filteredOrders.length === 0 ? (
                                                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                    <p className="text-gray-500 text-sm">No orders matching this status.</p>
                                                </div>
                                            ) : (
                                                filteredOrders.map(order => {
                                                    const orderStatus = getOrderStatus(order);
                                                    const orderItems = order?.sales_details || [];
                                                    const isFullyCanceled = orderItems.length > 0 && orderItems.every(item => refundedSaleDetailIds.has(Number(item.id)));
                                                    
                                                    const showCancelAndRefund = orderStatus === 1 && !isFullyCanceled;
                                                    const showRefund = isRefundEligibleForDeliveredOrder(order);
                                                    const showOrderConfirmedSupport = orderStatus === 2;
                                                    const orderDonationAmount = getDonationAmount(order);
                                                    const whatsappSupportUrl = `${SUPPORT_WHATSAPP_BASE}?text=${encodeURIComponent(`Hi, I have a query regarding my order #${order?.invoice_id || ""}.`)}`;

                                                return (
                                                    <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 group">
                                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                                            <div>
                                                                <div className="flex justify-between items-start gap-4">
                                                                    <div>
                                                                        <h3 className="font-semibold text-gray-900 text-sm md:text-base line-clamp-1 mb-1">
                                                                            {`Order #${order.invoice_id}`}
                                                                        </h3>
                                                                        <p className="text-[11px] text-gray-500">{formatOrderDateTime(order.created_at)}</p>
                                                                        <p className="text-[11px] text-gray-500 mt-1">{orderItems.length} item{orderItems.length > 1 ? "s" : ""}</p>
                                                                    </div>
                                                                    <div className="text-right flex-shrink-0">
                                                                        <p className="text-2xl font-bold text-[var(--brand-royal-red)]">
                                                                            {TAKA_SYMBOL}{(Number(order.sub_total ?? order.total ?? 0) + Number(order.delivery_fee ?? 0) - Number(order.discount ?? 0) + orderDonationAmount)}
                                                                        </p>
                                                                        {orderDonationAmount > 0 && (
                                                                            <p className="text-[11px] text-gray-500 mt-1">
                                                                                Donation: +{TAKA_SYMBOL}{orderDonationAmount}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                                                                <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                                <p className="truncate">
                                                                    {order.delivery_customer_address || "No address provided"}
                                                                </p>
                                                            </div>

                                                            {orderItems.length > 0 && (
                                                                <div className="mt-3 space-y-2">
                                                                    {orderItems.map((item, idx) => {
                                                                        const productId = getProductIdFromSaleItem(item);
                                                                        const canReviewItem = orderStatus === 4 && !!productId && !reviewedProductMap[productId];
                                                                        const isItemCanceled = refundedSaleDetailIds.has(Number(item.id));
                                                                        const itemImage = item?.product_info?.image_path
                                                                            || (Array.isArray(item?.product_info?.image_paths) ? item.product_info.image_paths[0] : null)
                                                                            || null;
                                                                        const itemName = item?.product_info?.name || `Product #${item?.product_id || "N/A"}`;

                                                                        return (
                                                                            <div key={item?.id || idx} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                                                                                <div className="min-w-0 flex items-center gap-3">
                                                                                    <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 relative">
                                                                                        {itemImage ? (
                                                                                            <Image
                                                                                                src={itemImage}
                                                                                                alt={itemName}
                                                                                                fill
                                                                                                className="object-cover"
                                                                                            />
                                                                                        ) : (
                                                                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                                                <Package className="w-4 h-4" />
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="min-w-0">
                                                                                        {productId ? (
                                                                                            <Link
                                                                                                href={`/product/${productId}`}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="block text-xs font-semibold text-gray-900 line-clamp-1 hover:text-[var(--brand-royal-red)] transition-colors"
                                                                                            >
                                                                                                {itemName}
                                                                                            </Link>
                                                                                        ) : (
                                                                                            <p className="text-xs font-semibold text-gray-900 line-clamp-1">
                                                                                                {itemName}
                                                                                            </p>
                                                                                        )}
                                                                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                                                                            Qty: {item?.qty || item?.quantity || 1}{item?.size ? ` - Size: ${item.size}` : ""}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex flex-col items-end gap-1.5">
                                                                                    {isItemCanceled && (
                                                                                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
                                                                                            Returned
                                                                                        </span>
                                                                                    )}
                                                                                    {(orderStatus === 4 && productId && reviewedProductMap[productId]) && (
                                                                                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">
                                                                                            Reviewed
                                                                                        </span>
                                                                                    )}
                                                                                    {(!isItemCanceled && canReviewItem) && (
                                                                                        <button
                                                                                            onClick={() => openReviewForItem(item)}
                                                                                            className="px-3 py-1.5 bg-[var(--brand-royal-red)] hover:bg-[#a01830] text-white text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap"
                                                                                        >
                                                                                            Leave a Review
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}

                                                            {/* Action Buttons */}
                                                            <div className="mt-3 flex gap-2">
                                                                <button
                                                                    onClick={() => setSelectedOrder(order)}
                                                                    className="flex-1 py-2 px-3 bg-gray-100 hover:bg-[var(--brand-royal-red)] hover:text-white text-gray-700 text-xs font-semibold rounded-lg transition-all duration-200"
                                                                >
                                                                    View Details
                                                                </button>
                                                                {showCancelAndRefund && (
                                                                    <button
                                                                        onClick={() => setReturnModal({ open: true, order, mode: "cancel" })}
                                                                        className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-600 text-xs font-semibold rounded-lg border border-orange-200 hover:border-orange-500 transition-all duration-200"
                                                                    >
                                                                        <AlertTriangle size={12} />
                                                                        Cancel and Refund
                                                                    </button>
                                                                )}
                                                                {showRefund && (
                                                                    <button
                                                                        onClick={() => setReturnModal({ open: true, order, mode: "return" })}
                                                                        className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 text-xs font-semibold rounded-lg border border-blue-200 hover:border-blue-600 transition-all duration-200"
                                                                    >
                                                                        <RotateCcw size={12} />
                                                                        Refund
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {showOrderConfirmedSupport && (
                                                                <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-2.5">
                                                                    <p className="text-[11px] font-semibold text-emerald-900 mb-2">
                                                                        Do you have any queries regarding this order?
                                                                    </p>
                                                                    <div className="flex gap-2">
                                                                        <a
                                                                            href={whatsappSupportUrl}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="flex-1 text-center py-2 px-3 bg-[#25D366] hover:bg-[#1fb157] text-white text-xs font-semibold rounded-lg transition-colors"
                                                                        >
                                                                            Contact on WhatsApp
                                                                        </a>
                                                                        <a
                                                                            href={SUPPORT_FACEBOOK_INBOX}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="flex-1 text-center py-2 px-3 bg-[#1877F2] hover:bg-[#0f63d6] text-white text-xs font-semibold rounded-lg transition-colors"
                                                                        >
                                                                            Facebook Inbox
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                    ) : (
                                        <div className="text-center py-20">
                                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-lg mb-2">No orders found</h3>
                                            <p className="text-gray-500 text-sm">Orders will appear here once you make a purchase</p>
                                        </div>
                                    )}
                                </div>

                                {/* Return / Cancel Modal */}
                                <ReturnCancelModal
                                    open={returnModal.open}
                                    onClose={() => setReturnModal({ open: false, order: null, mode: "return" })}
                                    order={returnModal.order}
                                    mode={returnModal.mode}
                                    refundedItemIds={refundedSaleDetailIds}
                                />

                                {/* Order Details Modal */}
                                {selectedOrder && (
                                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
                                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                                            {/* Modal Header */}
                                            <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 sticky top-0 z-10">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white">Order Details</h3>
                                                        <p className="text-white/60 text-sm mt-1">#{selectedOrder.invoice_id}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedOrder(null)}
                                                        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                                                    >
                                                        <XCircle size={20} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Modal Content */}
                                            <div className="p-6 space-y-6">
                                                {/* Order Status & Date */}
                                                <div className="flex flex-wrap gap-4 justify-between items-center p-4 bg-gray-50 rounded-xl">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Order Date</p>
                                                        <p className="font-semibold text-gray-900">
                                                            {new Date(selectedOrder.created_at).toLocaleDateString("en-US", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.tran_status || selectedOrder.status)}`}>
                                                        {getStatusLabel(selectedOrder.tran_status || selectedOrder.status)}
                                                    </div>
                                                </div>

                                                {/* Products List */}
                                                <div>
                                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                        <Package size={18} />
                                                        Products ({selectedOrder.sales_details?.length || 0})
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {selectedOrder.sales_details?.map((item, index) => (
                                                            <Link
                                                                key={index}
                                                                href={`/product/${item.product_id || item.product_info?.id}`}
                                                                className="flex gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 hover:shadow-sm transition-all cursor-pointer group"
                                                            >
                                                                <div className="h-16 w-16 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden relative">
                                                                    {item.product_info?.image_path ? (
                                                                        <Image
                                                                            src={item.product_info.image_path}
                                                                            alt={item.product_info?.name || "Product"}
                                                                            fill
                                                                            className="object-cover group-hover:scale-105 transition-transform"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                                                                            <Package size={20} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium text-gray-900 text-sm line-clamp-1 group-hover:text-[var(--brand-royal-red)] transition-colors">{item.product_info?.name || "Product"}</p>
                                                                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                                                                        <span>Qty: {item.qty}</span>
                                                                        {item.size && <span>- Size: {item.size}</span>}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-bold text-[var(--brand-royal-red)]">{TAKA_SYMBOL}{item.price * item.qty}</p>
                                                                    <p className="text-xs text-gray-400">{TAKA_SYMBOL}{item.price} each</p>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Delivery Info */}
                                                <div className="p-4 bg-blue-50 rounded-xl">
                                                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                        <Truck size={18} />
                                                        Delivery Information
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-gray-500 text-xs mb-1">Customer Name</p>
                                                            <p className="font-medium text-gray-900">{selectedOrder.delivery_customer_name || "N/A"}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 text-xs mb-1">Phone</p>
                                                            <p className="font-medium text-gray-900">{selectedOrder.delivery_customer_phone || "N/A"}</p>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <p className="text-gray-500 text-xs mb-1">Address</p>
                                                            <p className="font-medium text-gray-900">{selectedOrder.delivery_customer_address || "N/A"}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Price Breakdown */}
                                                <div className="p-4 bg-gray-50 rounded-xl">
                                                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                        <span className="text-sm font-bold">Tk</span>
                                                        Price Breakdown
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Subtotal</span>
                                                            <span className="font-medium">{TAKA_SYMBOL}{selectedOrder.sub_total || 0}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Delivery Fee</span>
                                                            <span className="font-medium">{TAKA_SYMBOL}{selectedOrder.delivery_fee || 0}</span>
                                                        </div>
                                                        {selectedOrder.discount > 0 && (
                                                            <div className="flex justify-between text-green-600">
                                                                <span>Discount</span>
                                                                <span>-{TAKA_SYMBOL}{selectedOrder.discount}</span>
                                                            </div>
                                                        )}
                                                        {getDonationAmount(selectedOrder) > 0 && (
                                                            <div className="flex justify-between text-[var(--brand-royal-red)]">
                                                                <span>Donation</span>
                                                                <span>+{TAKA_SYMBOL}{getDonationAmount(selectedOrder)}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between pt-3 border-t border-gray-200 text-lg font-bold">
                                                            <span>Total</span>
                                                            <span className="text-[var(--brand-royal-red)]">
                                                                {TAKA_SYMBOL}{(Number(selectedOrder.sub_total || 0) + Number(selectedOrder.delivery_fee || 0) - Number(selectedOrder.discount || 0) + getDonationAmount(selectedOrder))}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Payment Info */}
                                                <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                                                        <p className="font-semibold text-gray-900">{selectedOrder.pay_mode || "Cash on Delivery"}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500 mb-1">Paid Amount</p>
                                                        <p className="font-semibold text-gray-900">{TAKA_SYMBOL}{selectedOrder.paid_amount || 0}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* My Refunds */}
                        {activeSection === "refunds" && (
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800">
                                    <h2 className="text-2xl font-bold text-white">My Refunds</h2>
                                    <p className="text-white/60 text-sm mt-1">Track your return and refund requests</p>
                                </div>

                                <div className="p-6">
                                    {refundsLoading ? (
                                        <div className="flex justify-center py-20">
                                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--brand-royal-red)]"></div>
                                        </div>
                                    ) : refunds.length > 0 ? (
                                        renderRefundReturnCards("refund")
                                    ) : (
                                        <div className="text-center py-20">
                                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                                                <RotateCcw className="w-10 h-10 text-white" />
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-lg mb-2">No refunds found</h3>
                                            <p className="text-gray-500 text-sm">You haven't submitted any refund requests yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* My Returns */}
                        {activeSection === "returns" && (
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800">
                                    <h2 className="text-2xl font-bold text-white">My Returns</h2>
                                    <p className="text-white/60 text-sm mt-1">Returned items overview</p>
                                </div>

                                <div className="p-6">
                                    {refundsLoading ? (
                                        <div className="flex justify-center py-20">
                                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--brand-royal-red)]"></div>
                                        </div>
                                    ) : refunds.length > 0 ? (
                                        renderRefundReturnCards("return")
                                    ) : (
                                        <div className="text-center py-20">
                                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                                                <RotateCcw className="w-10 h-10 text-white" />
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-lg mb-2">No returns found</h3>
                                            <p className="text-gray-500 text-sm">You don't have any returned items yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Order Tracking */}
                        {activeSection === "tracking" && (
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800">
                                    <h2 className="text-2xl font-bold text-white">Track Your Order</h2>
                                    <p className="text-white/60 text-sm mt-1">Enter your invoice ID to track shipment</p>
                                </div>

                                <div className="p-6">
                                    {!user ? (
                                        <div className="max-w-xl mx-auto text-center mb-8">
                                            <p className="text-gray-700 mb-4">Please login to track your order.</p>
                                            <button
                                                type="button"
                                                onClick={() => openAuthModal("login")}
                                                className="inline-flex items-center justify-center py-2.5 px-5 rounded-lg text-sm font-medium text-white bg-[var(--brand-royal-red)] hover:bg-red-700 transition-colors"
                                            >
                                                Login to Track Order
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleTrackOrder} className="mb-8">
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    value={trackInvoiceId}
                                                    onChange={(e) => setTrackInvoiceId(e.target.value)}
                                                    placeholder="Enter Invoice ID (e.g., INV-12345)"
                                                    className="flex-1 px-4 py-3.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-[var(--brand-royal-red)] focus:outline-none text-gray-900 placeholder:text-gray-400"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={trackLoading}
                                                    className="px-8 py-3.5 bg-gradient-to-r from-[var(--brand-royal-red)] to-red-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-50 transition-all duration-200"
                                                >
                                                    {trackLoading ? "Searching..." : "Track"}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {trackOrderData && (
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in mt-6">
                                            {/* Header */}
                                            <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 p-6">
                                                <div className="flex flex-wrap items-center justify-between gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Order</p>
                                                        <h2 className="text-xl font-bold text-[var(--brand-royal-red)]">
                                                            #{trackOrderData.invoice_id}
                                                        </h2>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500 mb-1">Order Date</p>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {new Date(trackOrderData.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Timeline or Special Status */}
                                            <div className="border-b border-gray-100 bg-white">
                                                {Number(trackOrderData.tran_status) >= 5 ? (
                                                    <SpecialStatusUI status={trackOrderData.tran_status} />
                                                ) : (
                                                    <OrderTimeline currentStatus={trackOrderData.tran_status} />
                                                )}
                                            </div>

                                            {/* Order Details */}
                                            <div className="p-6 sm:p-8 space-y-6">
                                                {/* Info Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Customer Info */}
                                                    {trackOrderData.delivery_customer_name && (
                                                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                                            <div className="bg-green-100 p-2.5 rounded-lg text-green-600">
                                                                <Truck className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900">Customer</p>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    {trackOrderData.delivery_customer_name}
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    {trackOrderData.delivery_customer_phone}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Delivery Address */}
                                                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                                        <div className="bg-purple-100 p-2.5 rounded-lg text-purple-600">
                                                            <MapPin className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">Delivery Address</p>
                                                            <p className="text-sm text-gray-600 mt-1">{trackOrderData.delivery_customer_address}</p>
                                                            {trackOrderData.delivery_district && (
                                                                <p className="text-xs text-gray-400 mt-1">{trackOrderData.delivery_district}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Total Amount */}
                                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[var(--brand-royal-red)]/5 to-purple-50 rounded-xl border border-[var(--brand-royal-red)]/10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-[var(--brand-royal-red)]/10 p-2.5 rounded-lg text-[var(--brand-royal-red)]">
                                                            <span className="font-bold">Tk</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-semibold text-gray-900">Total Amount</span>
                                                            {getDonationAmount(trackOrderData) > 0 && (
                                                                <p className="text-xs text-gray-500">Includes donation: {TAKA_SYMBOL}{getDonationAmount(trackOrderData)}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-xl font-bold text-[var(--brand-royal-red)]">
                                                        {TAKA_SYMBOL}{(Number(trackOrderData.sub_total || trackOrderData.total || 0) + Number(trackOrderData.delivery_fee || 0) - Number(trackOrderData.discount || 0) + getDonationAmount(trackOrderData))}
                                                    </span>
                                                </div>

                                                {/* Products List */}
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                                                        Order Items
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {trackOrderData.sales_details?.map((item, index) => (
                                                            <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                                                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white relative">
                                                                    {item.product_info?.image_path ? (
                                                                        <Image
                                                                            src={item.product_info.image_path}
                                                                            alt={item.product_info.name || "Product"}
                                                                            fill
                                                                            className="object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                                                                            <Package className="h-6 w-6" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                                        {item.product_info?.name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        Qty: {item.qty} {item.size ? ` · Size: ${item.size}` : ""}
                                                                    </p>
                                                                </div>
                                                                <div className="text-sm font-bold text-gray-900">
                                                                    {TAKA_SYMBOL}{item.price * item.qty}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {trackAccessDenied && !trackOrderData && (
                                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-red-200">
                                            <div className="mx-auto h-12 w-12 text-red-300 mb-3">
                                                <XCircle className="h-full w-full" />
                                            </div>
                                            <h3 className="mt-2 text-sm font-medium text-red-700">Access Denied</h3>
                                            <p className="mt-1 text-sm text-red-500">Sorry, we can&apos;t share this order details with you.</p>
                                        </div>
                                    )}

                                    {trackHasSearched && !trackLoading && !trackOrderData && !trackAccessDenied && (
                                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                            <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                                                <Package className="h-full w-full" />
                                            </div>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No Order Found</h3>
                                            <p className="mt-1 text-sm text-gray-500">Could not find an order with that Invoice ID.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* My Benefits */}
                        {activeSection === "benefits" && (
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="p-4 md:p-6 bg-gradient-to-r from-gray-900 to-gray-800">
                                    <h2 className="text-lg md:text-2xl font-bold text-white">My Points & Benefits</h2>
                                    <p className="text-white/60 text-xs md:text-sm mt-0.5">Wallet-based points and live membership status</p>
                                </div>
                                <div className="p-3 md:p-6 space-y-4 md:space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                                        <div className="bg-white rounded-xl shadow-sm border p-3 md:p-6">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <div className="bg-[var(--brand-royal-red)] p-2 md:p-3 rounded-lg md:rounded-xl">
                                                    <svg width="18" height="18" className="md:w-6 md:h-6" fill="white" stroke="white" strokeWidth="2">
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                                    </svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] md:text-xs text-gray-500">Available Points</p>
                                                    <p className="text-lg md:text-3xl font-bold text-gray-900">{loyaltyPoints.toLocaleString("en-US")}</p>
                                                    <p className="text-[10px] md:text-xs text-gray-500">Equivalent to {formatTaka(walletBalance)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <Link href="/" className="hidden md:flex bg-gradient-to-br from-[var(--brand-royal-red)] to-red-600 rounded-xl shadow-sm p-6 flex-col items-center justify-center">
                                            <div className="bg-white p-3 rounded-xl mb-3">
                                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="9" cy="21" r="1"></circle>
                                                    <circle cx="20" cy="21" r="1"></circle>
                                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                                </svg>
                                            </div>
                                            <span className="text-white text-sm font-semibold">Shop now</span>
                                        </Link>

                                        <div className="bg-white rounded-xl shadow-sm border p-3 md:p-6">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <div className="bg-blue-600 p-2 md:p-3 rounded-lg md:rounded-xl">
                                                    <svg width="18" height="18" className="md:w-6 md:h-6" fill="white" stroke="white" strokeWidth="2">
                                                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                                        <line x1="1" y1="10" x2="23" y2="10"></line>
                                                    </svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] md:text-xs text-gray-500">Wallet Balance</p>
                                                    <p className="text-lg md:text-3xl font-bold text-gray-900">{formatTaka(walletBalance)}</p>
                                                    <p className="text-[10px] md:text-xs text-gray-500">{user?.is_member ? "Membership active" : "Membership inactive"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
                                        <h3 className="font-bold text-base md:text-lg mb-4 md:mb-6">Membership Tier</h3>
                                        <div className="relative">
                                            <div className="flex justify-between items-start mb-4">
                                                {membershipTiers.map((tier, i) => {
                                                    const isUnlocked = loyaltyPoints >= tier.threshold;
                                                    return (
                                                        <div key={i} className="flex flex-col items-center flex-1">
                                                            <div className={`w-12 h-12 rounded-full ${isUnlocked ? tier.color : "bg-gray-300"} flex items-center justify-center mb-2 relative z-10`}>
                                                                {isUnlocked ? (
                                                                    <svg width="24" height="24" fill="white" stroke="white" strokeWidth="2">
                                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                                    </svg>
                                                                ) : (
                                                                    <svg width="24" height="24" fill="white" stroke="white" strokeWidth="2">
                                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <p className="font-semibold text-sm text-gray-900">{tier.name}</p>
                                                            <p className="text-xs text-gray-500">{tier.threshold.toLocaleString("en-US")} points</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-0">
                                                <div className="h-full bg-blue-600" style={{ width: `${tierProgress}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Current Tier</p>
                                                    <p className="text-lg font-bold text-gray-900">{currentTier.name}</p>
                                                </div>
                                                {nextTier ? (
                                                    <div className="text-right">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Next Tier</p>
                                                        <p className="text-sm font-bold text-[var(--brand-royal-red)]">{nextTier.name} in {pointsToNextTier.toLocaleString("en-US")} points</p>
                                                    </div>
                                                ) : (
                                                    <div className="text-right">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
                                                        <p className="text-sm font-bold text-green-600">Top tier unlocked</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm border">
                                        <details className="group" open>
                                            <summary className="flex items-center justify-between p-6 cursor-pointer">
                                                <h3 className="font-bold text-lg">My Points Summary</h3>
                                                <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            </summary>
                                            <div className="px-6 pb-6 space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Available Points</span>
                                                    <span className="font-bold text-gray-900">{loyaltyPoints.toLocaleString("en-US")}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Wallet Balance</span>
                                                    <span className="font-bold text-gray-900">{formatTaka(walletBalance)}</span>
                                                </div>
                                                <div className="flex justify-between pt-3 border-t">
                                                    <span className="font-semibold text-gray-900">Member Status</span>
                                                    <span className="font-bold text-blue-600 text-lg">{user?.is_member ? "Active" : "Inactive"}</span>
                                                </div>
                                            </div>
                                        </details>
                                    </div>
                                </div>
                            </div>
                        )}
                        {false && activeSection === "benefits" && (
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="p-4 md:p-6 bg-gradient-to-r from-gray-900 to-gray-800">
                                    <h2 className="text-lg md:text-2xl font-bold text-white">My Points & Benefits</h2>
                                    <p className="text-white/60 text-xs md:text-sm mt-0.5">Track your rewards and membership tier</p>
                                </div>
                                <div className="p-3 md:p-6 space-y-4 md:space-y-6">
                                    {/* Points & Credit - 2 on mobile, 3 on desktop */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                                        {/* Your Points */}
                                        <div className="bg-white rounded-xl shadow-sm border p-3 md:p-6">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <div className="bg-[var(--brand-royal-red)] p-2 md:p-3 rounded-lg md:rounded-xl">
                                                    <svg width="18" height="18" className="md:w-6 md:h-6" fill="white" stroke="white" strokeWidth="2">
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                                    </svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] md:text-xs text-gray-500">Your Points</p>
                                                    <p className="text-lg md:text-3xl font-bold text-gray-900">283K</p>
                                                    <p className="text-[10px] md:text-xs text-gray-500">+ {TAKA_SYMBOL}1,504</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Shop Now - Hidden on mobile */}
                                        <Link href="/" className="hidden md:flex bg-gradient-to-br from-[var(--brand-royal-red)] to-red-600 rounded-xl shadow-sm p-6 flex-col items-center justify-center">
                                            <div className="bg-white p-3 rounded-xl mb-3">
                                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="9" cy="21" r="1"></circle>
                                                    <circle cx="20" cy="21" r="1"></circle>
                                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                                </svg>
                                            </div>
                                            <span className="text-white text-sm font-semibold">Shop now</span>
                                        </Link>

                                        {/* Your Credit */}
                                        <div className="bg-white rounded-xl shadow-sm border p-3 md:p-6">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <div className="bg-blue-600 p-2 md:p-3 rounded-lg md:rounded-xl">
                                                    <svg width="18" height="18" className="md:w-6 md:h-6" fill="white" stroke="white" strokeWidth="2">
                                                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                                        <line x1="1" y1="10" x2="23" y2="10"></line>
                                                    </svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] md:text-xs text-gray-500">Your Credit</p>
                                                    <p className="text-lg md:text-3xl font-bold text-gray-900">{TAKA_SYMBOL}500</p>
                                                    <p className="text-[10px] md:text-xs text-gray-500">📅 Expires Dec 2026</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Membership Tier Progress */}
                                    <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
                                        <h3 className="font-bold text-base md:text-lg mb-4 md:mb-6">Membership Tier</h3>
                                        <div className="relative">
                                            <div className="flex justify-between items-start mb-4">
                                                {[
                                                    { name: "Basic", points: "0", active: true, color: "bg-green-500" },
                                                    { name: "Silver", points: "3,000", active: true, color: "bg-green-500" },
                                                    { name: "Gold", points: "15,000", active: true, color: "bg-blue-600" },
                                                    { name: "VIP", points: "30,000", active: false, color: "bg-gray-300" },
                                                ].map((tier, i) => (
                                                    <div key={i} className="flex flex-col items-center flex-1">
                                                        <div className={`w-12 h-12 rounded-full ${tier.color} flex items-center justify-center mb-2 relative z-10`}>
                                                            {tier.active ? (
                                                                <svg width="24" height="24" fill="white" stroke="white" strokeWidth="2">
                                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                                </svg>
                                                            ) : (
                                                                <svg width="24" height="24" fill="white" stroke="white" strokeWidth="2">
                                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <p className="font-semibold text-sm text-gray-900">{tier.name}</p>
                                                        <p className="text-xs text-gray-500">{tier.points} points</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-0">
                                                <div className="h-full bg-blue-600" style={{ width: "66%" }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Featured Coupons */}
                                    <div className="bg-white rounded-xl shadow-sm border p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-lg">Featured Coupons</h3>
                                            <button onClick={() => setActiveSection("coupons")} className="text-sm text-[var(--brand-royal-red)] font-semibold hover:underline">View All</button>
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                            {[
                                                { name: "Delivery", discount: "10%", amount: `${TAKA_SYMBOL}100`, badge: "Renewal", expiry: "Dec 25", color: "bg-green-500" },
                                                { name: "Basic", discount: "75%", amount: `${TAKA_SYMBOL}750`, badge: "New", expiry: "Dec 25", color: "bg-blue-600" },
                                                { name: "Login", discount: "50%", amount: `${TAKA_SYMBOL}500`, badge: "New", expiry: "Dec 25", color: "bg-indigo-700" },
                                                { name: "Premium", discount: "50%", amount: `${TAKA_SYMBOL}500`, badge: "Renewal", expiry: "Dec 25", color: "bg-orange-500" },
                                            ].map((coupon, i) => (
                                                <div key={i} className={`${coupon.color} rounded-lg md:rounded-xl p-2.5 md:p-4 text-white`}>
                                                    <div className="flex items-center justify-between mb-1 md:mb-2">
                                                        <span className="bg-white/20 px-1.5 md:px-2 py-0.5 md:py-1 rounded text-[9px] md:text-xs font-semibold">{coupon.badge}</span>
                                                        <span className="text-[8px] md:text-xs opacity-90">{coupon.expiry}</span>
                                                    </div>
                                                    <h4 className="font-bold text-xs md:text-base mb-1 md:mb-2">{coupon.name}</h4>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xl md:text-3xl font-bold">{coupon.discount}</span>
                                                        <span className="text-[10px] md:text-sm opacity-90">{coupon.amount}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* My Points Summary */}
                                    <div className="bg-white rounded-xl shadow-sm border">
                                        <details className="group">
                                            <summary className="flex items-center justify-between p-6 cursor-pointer">
                                                <h3 className="font-bold text-lg">My Points Summary</h3>
                                                <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            </summary>
                                            <div className="px-6 pb-6 space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Total Points Earned</span>
                                                    <span className="font-bold text-gray-900">283,000</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Points Used</span>
                                                    <span className="font-bold text-gray-900">0</span>
                                                </div>
                                                <div className="flex justify-between pt-3 border-t">
                                                    <span className="font-semibold text-gray-900">Available Balance</span>
                                                    <span className="font-bold text-blue-600 text-lg">283,000</span>
                                                </div>
                                            </div>
                                        </details>
                                    </div>

                                    {/* How to Earn Club Points */}
                                    <div className="bg-white rounded-xl shadow-sm border">
                                        <details className="group">
                                            <summary className="flex items-center justify-between p-6 cursor-pointer">
                                                <h3 className="font-bold text-lg">How to Earn Club Points</h3>
                                                <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            </summary>
                                            <div className="px-6 pb-6 grid md:grid-cols-2 gap-4">
                                                <div className="flex gap-3">
                                                    <div className="bg-blue-50 p-3 rounded-lg h-fit">
                                                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="9" cy="21" r="1"></circle>
                                                            <circle cx="20" cy="21" r="1"></circle>
                                                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 mb-1">Make Purchases</p>
                                                        <p className="text-sm text-gray-600">Earn 1 point per {TAKA_SYMBOL}1 spent</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="bg-pink-50 p-3 rounded-lg h-fit">
                                                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                            <path d="M9 11l3 3L22 4"></path>
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 mb-1">Complete Surveys</p>
                                                        <p className="text-sm text-gray-600">Earn up to 100 points</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="bg-purple-50 p-3 rounded-lg h-fit">
                                                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                            <circle cx="8.5" cy="7" r="4"></circle>
                                                            <polyline points="17 11 19 13 23 9"></polyline>
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 mb-1">Refer Friends</p>
                                                        <p className="text-sm text-gray-600">Get 500 points per referral</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="bg-orange-50 p-3 rounded-lg h-fit">
                                                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 mb-1">Special Events</p>
                                                        <p className="text-sm text-gray-600">Bonus points during promotions</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </details>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Wishlist */}
                        {activeSection === "wishlist" && (
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800">
                                    <h2 className="text-2xl font-bold text-white">My Wishlist</h2>
                                    <p className="text-white/60 text-sm mt-1">Products you've saved for later</p>
                                </div>
                                <div className="p-6">
                                    {wishlist.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {wishlist.map((product) => (
                                                <div key={product.id} className="relative group/wishcard">
                                                    {/* Remove Button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            removeFromWishlist(product.id);
                                                        }}
                                                        className="absolute top-2 right-2 z-20 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover/wishcard:opacity-100"
                                                        title="Remove from wishlist"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                                        </svg>
                                                    </button>
                                                    <Link href={`/product/${product.id}`} className="group">
                                                        <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                                            <div className="relative aspect-square bg-gray-100">
                                                                {product.images?.[0] ? (
                                                                    <Image
                                                                        src={product.images[0]}
                                                                        alt={product.name || "Product"}
                                                                        fill
                                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                                                                        <Heart className="h-8 w-8" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="p-3">
                                                                <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
                                                                    {product.name}
                                                                </h3>
                                                                <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-sm text-[var(--brand-royal-red)]">{TAKA_SYMBOL}{product.price}</span>
                                                                    {product.originalPrice && (
                                                                        <span className="text-xs text-gray-400 line-through">{TAKA_SYMBOL}{product.originalPrice}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20">
                                            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/30">
                                                <Heart size={40} className="text-white" />
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-lg mb-2">Your Wishlist is Empty</h3>
                                            <p className="text-gray-500 mb-6">Save items you love to your wishlist</p>
                                            <Link href="/" className="inline-block bg-gradient-to-r from-[var(--brand-royal-red)] to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/30 transition-all duration-200">
                                                Start Shopping
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Coupons */}
                        {activeSection === "coupons" && (
                            <CouponsSection
                                user={user}
                                myCoupons={coupons}
                                myCouponsLoading={couponsLoading}
                            />
                        )}

                        {/* Profile */}
                        {activeSection === "profile" && (
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
                                        <p className="text-white/60 text-sm mt-1">Manage your account information</p>
                                    </div>
                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-5 py-2.5 bg-white text-gray-900 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                                        >
                                            Edit Profile
                                        </button>
                                    )}
                                </div>

                                <div className="p-6 space-y-6">

                                    {isEditing ? (
                                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                                            {/* Profile Picture Upload */}
                                            <div className="flex items-center gap-6 pb-6 border-b">
                                                <div className="relative">
                                                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                                        {profileImagePreview || user?.image ? (
                                                            <Image
                                                                src={profileImagePreview || user.image}
                                                                alt="Profile"
                                                                width={96}
                                                                height={96}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    {imageUploading && (
                                                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-gray-900 mb-1">Profile Picture</h3>
                                                    <p className="text-sm text-gray-500 mb-3">Upload a new profile picture</p>
                                                    <div className="flex gap-2">
                                                        <label className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        setProfileImage(file);
                                                                        setProfileImagePreview(URL.createObjectURL(file));
                                                                    }
                                                                }}
                                                            />
                                                            Choose Image
                                                        </label>
                                                        {(profileImagePreview || user?.image) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setProfileImage(null);
                                                                    setProfileImagePreview(null);
                                                                }}
                                                                className="px-4 py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                                    <input
                                                        type="text"
                                                        name="first_name"
                                                        value={formData.first_name}
                                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-royal-red)] focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                                    <input
                                                        type="text"
                                                        name="last_name"
                                                        value={formData.last_name}
                                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-royal-red)] focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-royal-red)] focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                                    <input
                                                        type="tel"
                                                        name="mobile_number"
                                                        value={formData.mobile_number}
                                                        onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-royal-red)] focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                                                    <input
                                                        type="date"
                                                        name="birthday_date"
                                                        value={formData.birthday_date}
                                                        onChange={(e) => setFormData({ ...formData, birthday_date: e.target.value })}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-royal-red)] focus:border-transparent"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="block text-sm font-medium text-gray-700">Primary Address</label>
                                                        {formData.primary_address_field === "address" ? (
                                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                                                Primary
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, primary_address_field: "address" })}
                                                                disabled={!formData.address.trim()}
                                                                className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Set as Primary
                                                            </button>
                                                        )}
                                                    </div>
                                                    <textarea
                                                        name="address"
                                                        rows={3}
                                                        value={formData.address}
                                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-royal-red)] focus:border-transparent"
                                                    />
                                                </div>
                                                <div className="md:col-span-2 border rounded-xl p-4 bg-gray-50 space-y-4">
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-900">Additional Addresses</h4>
                                                        <p className="text-xs text-gray-500 mt-1">You can add up to two additional addresses.</p>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <label className="block text-sm font-medium text-gray-700">Additional Address 1</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => swapPrimaryAddressInForm("address_one")}
                                                                disabled={!formData.address_one.trim()}
                                                                className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Set as Primary
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            name="address_one"
                                                            rows={3}
                                                            value={formData.address_one}
                                                            onChange={(e) => setFormData({ ...formData, address_one: e.target.value })}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-royal-red)] focus:border-transparent"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <label className="block text-sm font-medium text-gray-700">Additional Address 2</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => swapPrimaryAddressInForm("address_two")}
                                                                disabled={!formData.address_two.trim()}
                                                                className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Set as Primary
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            name="address_two"
                                                            rows={3}
                                                            value={formData.address_two}
                                                            onChange={(e) => setFormData({ ...formData, address_two: e.target.value })}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-royal-red)] focus:border-transparent"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 pt-4 border-t">
                                                <button
                                                    type="submit"
                                                    disabled={isUpdating}
                                                    className="px-6 py-2.5 bg-[var(--brand-royal-red)] text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                                >
                                                    {isUpdating ? "Saving..." : "Save Changes"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(false)}
                                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Profile Picture Display */}
                                            <div className="flex items-center gap-4 pb-6 border-b">
                                                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                                    {user?.image ? (
                                                        <Image
                                                            src={user.image}
                                                            alt="Profile"
                                                            width={80}
                                                            height={80}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{user.first_name ? `${user.first_name} ${user.last_name || ""}` : user.name || "User"}</h3>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                                                    <p className="text-gray-900">{user.first_name ? `${user.first_name} ${user.last_name || ""}` : user.name || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                                                    <p className="text-gray-900">{user.email || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                                                    <p className="text-gray-900">{user.mobile_number || user.phone || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-500 mb-1">Primary Address</label>
                                                    <p className="text-gray-900">{user.address || "No address provided"}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                                                    <p className="text-gray-900">
                                                        {user.birthday_date
                                                            ? new Date(user.birthday_date).toLocaleDateString()
                                                            : "N/A"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="border-t pt-6">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-4">Additional Addresses</h4>
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <label className="block text-sm font-medium text-gray-500">Address 1</label>
                                                            {(user?.address || "").trim() === (user?.address_one || "").trim() && (user?.address_one || "").trim() ? (
                                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                                                    Primary Address
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSetPrimaryFromView("address_one")}
                                                                    disabled={!user?.address_one?.trim() || settingPrimaryAddressField === "address_two" || settingPrimaryAddressField === "address_one"}
                                                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {settingPrimaryAddressField === "address_one" ? "Setting..." : "Set as Primary"}
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-gray-900">{user.address_one || "N/A"}</p>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <label className="block text-sm font-medium text-gray-500">Address 2</label>
                                                            {(user?.address || "").trim() === (user?.address_two || "").trim() && (user?.address_two || "").trim() ? (
                                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                                                    Primary Address
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSetPrimaryFromView("address_two")}
                                                                    disabled={!user?.address_two?.trim() || settingPrimaryAddressField === "address_one" || settingPrimaryAddressField === "address_two"}
                                                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {settingPrimaryAddressField === "address_two" ? "Setting..." : "Set as Primary"}
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-gray-900">{user.address_two || "N/A"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="border rounded-2xl p-5 bg-gray-50">
                                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                                                <p className="text-sm text-gray-500 mt-1">Update your account password securely.</p>
                                            </div>
                                            {!showPasswordFields && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswordFields(true)}
                                                    className="px-5 py-2.5 bg-[var(--brand-royal-red)] text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                                                >
                                                    Change Password
                                                </button>
                                            )}
                                        </div>

                                        {showPasswordFields && (
                                            <form onSubmit={handlePasswordUpdate} className="mt-5 space-y-4">
                                                {passwordError && (
                                                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                                        {passwordError}
                                                    </div>
                                                )}
                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                                        <div className="relative">
                                                            <input
                                                                type={passwordVisibility.current_password ? "text" : "password"}
                                                                name="current_password"
                                                                value={passwordForm.current_password}
                                                                onChange={handlePasswordInputChange}
                                                                className={`w-full rounded-lg border px-4 py-2.5 pr-11 focus:ring-2 focus:ring-[var(--brand-royal-red)] focus:border-transparent ${passwordError ? "border-red-300" : "border-gray-300"}`}
                                                                placeholder="Enter current password"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setPasswordVisibility((prev) => ({ ...prev, current_password: !prev.current_password }))}
                                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                                                                aria-label={passwordVisibility.current_password ? "Hide current password" : "Show current password"}
                                                            >
                                                                {passwordVisibility.current_password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                                        <div className="relative">
                                                            <input
                                                                type={passwordVisibility.new_password ? "text" : "password"}
                                                                name="new_password"
                                                                value={passwordForm.new_password}
                                                                onChange={handlePasswordInputChange}
                                                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-11 focus:ring-2 focus:ring-[var(--brand-royal-red)] focus:border-transparent"
                                                                placeholder="Enter new password"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setPasswordVisibility((prev) => ({ ...prev, new_password: !prev.new_password }))}
                                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                                                                aria-label={passwordVisibility.new_password ? "Hide new password" : "Show new password"}
                                                            >
                                                                {passwordVisibility.new_password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                                                        <div className="relative">
                                                            <input
                                                                type={passwordVisibility.new_password_confirmation ? "text" : "password"}
                                                                name="new_password_confirmation"
                                                                value={passwordForm.new_password_confirmation}
                                                                onChange={handlePasswordInputChange}
                                                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-11 focus:ring-2 focus:ring-[var(--brand-royal-red)] focus:border-transparent"
                                                                placeholder="Confirm new password"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setPasswordVisibility((prev) => ({ ...prev, new_password_confirmation: !prev.new_password_confirmation }))}
                                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                                                                aria-label={passwordVisibility.new_password_confirmation ? "Hide confirm password" : "Show confirm password"}
                                                            >
                                                                {passwordVisibility.new_password_confirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 pt-2">
                                                    <button
                                                        type="submit"
                                                        disabled={isChangingPassword}
                                                        className="px-5 py-2.5 bg-[var(--brand-royal-red)] text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {isChangingPassword ? "Updating..." : "Update Password"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowPasswordFields(false);
                                                            setPasswordError("");
                                                            setPasswordForm({
                                                                current_password: "",
                                                                new_password: "",
                                                                new_password_confirmation: "",
                                                            });
                                                            setPasswordVisibility({
                                                                current_password: false,
                                                                new_password: false,
                                                                new_password_confirmation: false,
                                                            });
                                                        }}
                                                        className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-white transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Addresses Section */}
                        {activeSection === "addresses" && (
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800">
                                    <h2 className="text-2xl font-bold text-white">My Addresses</h2>
                                    <p className="text-white/60 text-sm mt-1">Manage your delivery addresses</p>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="bg-gray-50 rounded-xl p-5">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Default</span>
                                                </div>
                                                <h3 className="font-semibold text-gray-900 mb-1">Delivery Address</h3>
                                                <p className="text-gray-600 text-sm">{user?.address || "No address saved"}</p>
                                                <p className="text-gray-600 text-sm mt-1">{user?.mobile_number || user?.phone || ""}</p>
                                            </div>
                                            <button
                                                onClick={() => { setActiveSection("profile"); setIsEditing(true); }}
                                                className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors shadow-sm"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-gray-500 text-sm">To update your address, please edit your profile.</p>
                                </div>
                            </div>
                        )}
                        {/* Terms of Use Section */}
                        {activeSection === "terms" && (
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800">
                                    <h2 className="text-2xl font-bold text-white">Terms & Conditions</h2>
                                    <p className="text-white/60 text-sm mt-1">Updated from company policy settings</p>
                                </div>
                                <div className="p-6">
                                    {invoiceSettingsLoading ? (
                                        <div className="flex justify-center py-16">
                                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--brand-royal-red)]"></div>
                                        </div>
                                    ) : invoiceSettings?.terms_condition ? (
                                        <div
                                            className="html-content max-w-none text-gray-700"
                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((invoiceSettings.terms_condition || "").replace(/&nbsp;/g, " ")) }}
                                        />
                                    ) : (
                                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">Terms content is not available right now.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Privacy Center Section */}
                        {activeSection === "privacy" && (
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800">
                                    <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
                                    <p className="text-white/60 text-sm mt-1">Updated from company policy settings</p>
                                </div>
                                <div className="p-6">
                                    {invoiceSettingsLoading ? (
                                        <div className="flex justify-center py-16">
                                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--brand-royal-red)]"></div>
                                        </div>
                                    ) : invoiceSettings?.privacy_policy ? (
                                        <div
                                            className="html-content max-w-none text-gray-700"
                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((invoiceSettings.privacy_policy || "").replace(/&nbsp;/g, " ")) }}
                                        />
                                    ) : (
                                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">Privacy content is not available right now.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        <WriteReviewModal
                            product={reviewModal.product}
                            productId={reviewModal.productId}
                            open={reviewModal.open}
                            onClose={() => setReviewModal({ open: false, productId: null, product: null })}
                            onSubmitted={(submittedProductId) => {
                                if (!submittedProductId) return;
                                setReviewedProductMap((prev) => ({ ...prev, [submittedProductId]: true }));
                                setReviewModal({ open: false, productId: null, product: null });
                            }}
                        />
                    </div>
                </div>
            </div>
        </div >
    );
}

// CouponsSection Component with All Coupons and My Coupons tabs
function CouponsSection({ user, myCoupons, myCouponsLoading }) {
    const [activeTab, setActiveTab] = useState("all");
    const [allCoupons, setAllCoupons] = useState([]);
    const [allCouponsLoading, setAllCouponsLoading] = useState(true);
    const [collectingId, setCollectingId] = useState(null);
    const [collectedCoupons, setCollectedCoupons] = useState([]); // Track locally collected coupons

    // Fetch all available coupons
    useEffect(() => {
        const fetchAllCoupons = async () => {
            try {
                const data = await getCouponList();
                if (data.success && data.data) {
                    setAllCoupons(Array.isArray(data.data) ? data.data : []);
                }
            } catch (error) {
                console.error("Error fetching coupons:", error);
            } finally {
                setAllCouponsLoading(false);
            }
        };
        fetchAllCoupons();
    }, []);

    // Check if coupon is already collected (from API or locally)
    const isAlreadyCollected = (couponCode) => {
        return myCoupons.some(c => c.coupon_code === couponCode) ||
            collectedCoupons.includes(couponCode);
    };

    // Handle coupon collection
    const handleCollect = async (coupon) => {
        if (!user) {
            toast.error("Please login to collect coupons");
            return;
        }

        setCollectingId(coupon.id);
        try {
            const customerId = user.id || user.customer_id;
            const result = await collectCoupon(coupon.coupon_code, customerId);

            if (result.success) {
                toast.success("Coupon collected successfully!");
                // Add to local collected list instead of page reload
                setCollectedCoupons(prev => [...prev, coupon.coupon_code]);
            } else {
                toast.error(result.message || "Failed to collect coupon");
            }
        } catch (error) {
            console.error("Error collecting coupon:", error);
            toast.error("Something went wrong");
        } finally {
            setCollectingId(null);
        }
    };

    // Filter coupons expiring in 5 days or less
    const expiringSoonCoupons = allCoupons.filter(coupon => {
        const now = new Date();
        const expireDate = new Date(coupon.expire_date);
        const diffTime = expireDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 5;
    });

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Premium Header */}
            <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800">
                <h2 className="text-2xl font-bold text-white">My Coupons</h2>
                <p className="text-white/60 text-sm mt-1">Discover and collect discount codes</p>
            </div>
            {/* Tabs */}
            <div className="border-b overflow-x-auto bg-gray-50">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`flex-1 py-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap px-4 ${activeTab === "all"
                            ? "border-[var(--brand-royal-red)] text-[var(--brand-royal-red)] bg-white"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50"
                            }`}
                    >
                        All Coupons
                    </button>
                    <button
                        onClick={() => setActiveTab("expiring")}
                        className={`flex-1 py-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap px-4 ${activeTab === "expiring"
                            ? "border-[var(--brand-royal-red)] text-[var(--brand-royal-red)] bg-white"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50"
                            }`}
                    >
                        Expires Soon {expiringSoonCoupons.length > 0 && `(${expiringSoonCoupons.length})`}
                    </button>
                    <button
                        onClick={() => setActiveTab("my")}
                        className={`flex-1 py-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap px-4 ${activeTab === "my"
                            ? "border-[var(--brand-royal-red)] text-[var(--brand-royal-red)] bg-white"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50"
                            }`}
                    >
                        My Coupons ({myCoupons.length})
                    </button>
                </div>
            </div>

            <div className="p-6">
                {/* All Coupons Tab */}
                {activeTab === "all" && (
                    <>
                        {allCouponsLoading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--brand-royal-red)]"></div>
                            </div>
                        ) : allCoupons.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-4">
                                {allCoupons.map(coupon => {
                                    const collected = isAlreadyCollected(coupon.coupon_code);
                                    const expired = new Date(coupon.expire_date) < new Date();

                                    return (
                                        <div
                                            key={coupon.id}
                                            className={`border rounded-lg p-5 relative overflow-hidden ${collected ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                                }`}
                                        >
                                            {/* Discount Badge */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <p className="text-2xl font-bold text-[var(--brand-royal-red)]">
                                                        {coupon.coupon_amount_type === 'percentage'
                                                            ? `${parseFloat(coupon.amount)}% OFF`
                                                            : `${formatTaka(parseFloat(coupon.amount))} OFF`
                                                        }
                                                    </p>
                                                    <p className="text-sm text-gray-600 font-medium">{coupon.coupon_name}</p>
                                                </div>
                                                {collected && (
                                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-medium">
                                                        Collected
                                                    </span>
                                                )}
                                            </div>

                                            {/* Coupon Code */}
                                            <div className="bg-white rounded border border-dashed border-gray-300 px-3 py-2 mb-3">
                                                <p className="font-mono text-sm font-bold text-center text-gray-800">
                                                    {coupon.coupon_code}
                                                </p>
                                            </div>

                                            {/* Details */}
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                                {parseFloat(coupon.minimum_order_amount) > 0 && (
                                                    <span>Min. order: {formatTaka(parseFloat(coupon.minimum_order_amount))}</span>
                                                )}
                                                <span>
                                                    Expires: {new Date(coupon.expire_date).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {/* Collect Button */}
                                            {!collected && !expired && (
                                                <button
                                                    onClick={() => handleCollect(coupon)}
                                                    disabled={collectingId === coupon.id}
                                                    className="w-full py-2.5 bg-[var(--brand-royal-red)] text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                                >
                                                    {collectingId === coupon.id ? "Collecting..." : "Collect Coupon"}
                                                </button>
                                            )}
                                            {expired && (
                                                <p className="text-center text-sm text-red-500 font-medium">Expired</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                <p className="text-4xl mb-4">🎫</p>
                                <p>No coupons available right now</p>
                            </div>
                        )}
                    </>
                )}

                {/* Expires Soon Tab */}
                {activeTab === "expiring" && (
                    <>
                        {allCouponsLoading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--brand-royal-red)]"></div>
                            </div>
                        ) : expiringSoonCoupons.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-4">
                                {expiringSoonCoupons.map(coupon => {
                                    const collected = isAlreadyCollected(coupon.coupon_code);
                                    const expireDate = new Date(coupon.expire_date);
                                    const diffDays = Math.ceil((expireDate - new Date()) / (1000 * 60 * 60 * 24));

                                    return (
                                        <div
                                            key={coupon.id}
                                            className={`border rounded-lg p-5 relative overflow-hidden ${collected ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
                                                }`}
                                        >
                                            {/* Urgency Badge */}
                                            <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs px-2 py-1 rounded-bl font-medium">
                                                ⏰ {diffDays} day{diffDays !== 1 ? 's' : ''} left
                                            </div>

                                            {/* Discount Badge */}
                                            <div className="flex items-start justify-between mb-3 mt-2">
                                                <div>
                                                    <p className="text-2xl font-bold text-[var(--brand-royal-red)]">
                                                        {coupon.coupon_amount_type === 'percentage'
                                                            ? `${parseFloat(coupon.amount)}% OFF`
                                                            : `${formatTaka(parseFloat(coupon.amount))} OFF`
                                                        }
                                                    </p>
                                                    <p className="text-sm text-gray-600 font-medium">{coupon.coupon_name}</p>
                                                </div>
                                                {collected && (
                                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-medium">
                                                        Collected
                                                    </span>
                                                )}
                                            </div>

                                            {/* Coupon Code */}
                                            <div className="bg-white rounded border border-dashed border-gray-300 px-3 py-2 mb-3">
                                                <p className="font-mono text-sm font-bold text-center text-gray-800">
                                                    {coupon.coupon_code}
                                                </p>
                                            </div>

                                            {/* Details */}
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                                {parseFloat(coupon.minimum_order_amount) > 0 && (
                                                    <span>Min. order: {formatTaka(parseFloat(coupon.minimum_order_amount))}</span>
                                                )}
                                                <span className="text-orange-600 font-medium">
                                                    Expires: {expireDate.toLocaleDateString()}
                                                </span>
                                            </div>

                                            {/* Collect Button */}
                                            {!collected && (
                                                <button
                                                    onClick={() => handleCollect(coupon)}
                                                    disabled={collectingId === coupon.id}
                                                    className="w-full py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                                                >
                                                    {collectingId === coupon.id ? "Collecting..." : "Collect Before It's Gone!"}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p>No coupons expiring soon</p>
                                <p className="text-sm mt-1">Check back later for time-sensitive offers!</p>
                            </div>
                        )}
                    </>
                )}

                {/* My Coupons Tab */}
                {activeTab === "my" && (
                    <>
                        {myCouponsLoading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--brand-royal-red)]"></div>
                            </div>
                        ) : myCoupons.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-4">
                                {myCoupons.map(coupon => (
                                    <div key={coupon.customer_coupon_id} className="border-2 border-dashed border-[var(--brand-royal-red)] rounded-lg p-5 bg-red-50/30">
                                        <p className="text-2xl font-bold text-[var(--brand-royal-red)] mb-1">{formatTaka(coupon.amount)} OFF</p>
                                        <p className="text-xs text-gray-600 mb-3">
                                            {parseFloat(coupon.minimum_order_amount) > 0
                                                ? `Min. order: ${formatTaka(coupon.minimum_order_amount)}`
                                                : 'No minimum order'
                                            }
                                        </p>
                                        <div className="bg-white rounded px-4 py-2 border mb-3">
                                            <p className="font-mono text-sm font-bold text-center">{coupon.coupon_code}</p>
                                        </div>
                                        <p className="text-xs text-gray-600">Expires: {new Date(coupon.expire_date).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                <p className="text-4xl mb-4">🎫</p>
                                <p className="mb-2">You haven't collected any coupons yet</p>
                                <button
                                    onClick={() => setActiveTab("all")}
                                    className="text-[var(--brand-royal-red)] font-medium hover:underline"
                                >
                                    Browse available coupons
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}







