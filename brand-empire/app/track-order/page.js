"use client";

import { useState } from "react";
import { trackOrder } from "../../lib/api";
import Link from "next/link";
import Image from "next/image";
import { Search, Package, Calendar, DollarSign, MapPin, Truck, CheckCircle2, Clock, XCircle, PauseCircle, ClipboardList, PackageCheck, Home } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

export default function TrackOrderPage() {
    const { user, openAuthModal } = useAuth();
    const [formData, setFormData] = useState({
        invoice_id: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [orderData, setOrderData] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);

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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error("Please login to track your order");
            openAuthModal("login");
            return;
        }

        if (!formData.invoice_id) {
            toast.error("Please enter Invoice ID");
            return;
        }

        setIsLoading(true);
        setOrderData(null);
        setHasSearched(true);
        setAccessDenied(false);

        try {
            const response = await trackOrder(formData);

            if (response.success && response.data && response.data.data && response.data.data.length > 0) {
                const foundOrder = response.data.data[0];
                const orderPhone = normalizePhone(foundOrder.delivery_customer_phone || foundOrder.customer_phone);
                const userPhone = normalizePhone(user.mobile_number || user.phone);

                if (!orderPhone || !userPhone || orderPhone !== userPhone) {
                    setAccessDenied(true);
                    setOrderData(null);
                    toast.error("Sorry, we can't share this order details with you.");
                    return;
                }

                setOrderData(foundOrder);
                toast.success("Order details found!");
            } else {
                toast.error("Order not found. Please check your Invoice ID.");
                setOrderData(null);
            }
        } catch (error) {
            console.error("Error tracking order:", error);
            toast.error("Something went wrong. Please try again.");
            setOrderData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
        });
    };
    const TAKA_SYMBOL = "\u09F3";
    const orderDonationAmount = Math.max(0, Number(orderData?.donation_amount ?? orderData?.donation ?? 0));
    const orderSubtotalAmount = Number(orderData?.sub_total || 0);
    const orderDeliveryAmount = Number(orderData?.delivery_fee || 0);
    const orderDiscountAmount = Number(orderData?.discount || 0);
    const orderTotalAmount = orderSubtotalAmount + orderDeliveryAmount - orderDiscountAmount + orderDonationAmount;

    // Timeline stages configuration
    const timelineStages = [
        { id: 1, label: "Order Received", icon: ClipboardList },
        { id: 2, label: "Order Confirmed", icon: PackageCheck },
        { id: 3, label: "Delivery Processing", icon: Truck },
        { id: 4, label: "Order Delivered", icon: Home },
    ];

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

    // Timeline Component
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

    // Canceled/On Hold UI
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 pt-4 md:pt-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                            Track Your Order
                        </h1>
                        <p className="mt-4 text-lg text-gray-600">
                            Enter your invoice ID to see the current status of your order.
                        </p>
                    </div>

                    {/* Tracking Form */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-10 mb-8 border border-gray-100">
                        {!user ? (
                            <div className="max-w-xl mx-auto text-center">
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
                            <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Invoice ID
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Package className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="invoice_id"
                                            value={formData.invoice_id}
                                            onChange={handleChange}
                                            placeholder="INV-2024-XXX"
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-black focus:border-black transition-colors"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[var(--brand-royal-red)] hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-royal-red)] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                >
                                    {isLoading ? "Searching..." : "Track Order"}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Results Section */}
                    {orderData ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
                            {/* Header */}
                            <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 p-6">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Order</p>
                                        <h2 className="text-xl font-bold text-[var(--brand-royal-red)]">
                                            #{orderData.invoice_id}
                                        </h2>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 mb-1">Order Date</p>
                                        <p className="text-sm font-medium text-gray-900">{formatDate(orderData.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline or Special Status */}
                            <div className="border-b border-gray-100 bg-white">
                                {Number(orderData.tran_status) >= 5 ? (
                                    <SpecialStatusUI status={orderData.tran_status} />
                                ) : (
                                    <OrderTimeline currentStatus={orderData.tran_status} />
                                )}
                            </div>

                            {/* Order Details */}
                            <div className="p-6 sm:p-8 space-y-6">
                                {/* Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Customer Info */}
                                    {orderData.delivery_customer_name && (
                                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                            <div className="bg-green-100 p-2.5 rounded-lg text-green-600">
                                                <Truck className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">Customer</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {orderData.delivery_customer_name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {orderData.delivery_customer_phone}
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
                                            <p className="text-sm text-gray-600 mt-1">{orderData.delivery_customer_address}</p>
                                            {orderData.delivery_district && (
                                                <p className="text-xs text-gray-400 mt-1">{orderData.delivery_district}</p>
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
                                            {orderDonationAmount > 0 && (
                                                <p className="text-xs text-gray-500">Includes donation: {TAKA_SYMBOL}{orderDonationAmount}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xl font-bold text-[var(--brand-royal-red)]">
                                        {TAKA_SYMBOL}{orderTotalAmount}
                                    </span>
                                </div>

                                {/* Products List */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                                        Order Items
                                    </h3>
                                    <div className="space-y-3">
                                        {orderData.sales_details?.map((item, index) => (
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
                                                        Qty: {item.qty} {item.size ? `· Size: ${item.size}` : ""}
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
                    ) : accessDenied ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-red-200">
                            <div className="mx-auto h-12 w-12 text-red-300 mb-3">
                                <XCircle className="h-full w-full" />
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-red-700">Access Denied</h3>
                            <p className="mt-1 text-sm text-red-500">Sorry sir, we can&apos;t share this order details with you.</p>
                        </div>
                    ) : hasSearched && !isLoading ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                            <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                                <Search className="h-full w-full" />
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No Order Found</h3>
                            <p className="mt-1 text-sm text-gray-500">Could not find an order with that Invoice ID.</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

