"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { uploadReviewMedia, submitRefundRequest, updateEcommerceStatus } from "@/lib/api";
import {
    X, Upload, Loader2, AlertTriangle, RotateCcw,
    ChevronDown, Check, Truck, Package
} from "lucide-react";

// ─── Data ──────────────────────────────────────────────────
const CANCEL_REASONS = [
    "Ordered wrong item",
    "Changed my mind",
    "Found a better price elsewhere",
    "Duplicate order",
    "Delivery taking too long",
    "Other",
];
const RETURN_REASONS = [
    "Item arrived damaged",
    "Wrong item received",
    "Item not as described",
    "Quality issue",
    "Size / fit issue",
    "Item is missing parts",
    "Other",
];
const COURIERS = [
    { value: "pathao", label: "Pathao Courier" },
    { value: "steadfast", label: "Steadfast Courier" },
    { value: "redx", label: "RedX" },
    { value: "paperfly", label: "Paperfly" },
    { value: "sundarban", label: "Sundarban Courier" },
    { value: "other", label: "Other" },
];
const RETURN_METHODS = [
    { value: "drop_off", label: "Drop Off" },
    { value: "courier", label: "Courier" },
];
const DROP_OFF_ADDRESS = "Jamuna Future Park, Level-3, Brand Empire Drop Off Point";
const REFUND_METHODS = [
    { value: "cash", label: "Cash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "bkash", label: "bKash" },
    { value: "nagad", label: "Nagad" },
    { value: "rocket", label: "Rocket" },
    { value: "store_credit", label: "Store Credit" },
];

// ─── Custom Dropdown Component ─────────────────────────────
const CustomDropdown = ({ value, onChange, options, placeholder, icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const selected = options.find((o) => (typeof o === "string" ? o : o.value) === value);
    const label = selected ? (typeof selected === "string" ? selected : selected.label) : null;

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-2 border rounded-xl px-4 py-3 text-sm text-left transition-all duration-200 ${isOpen
                    ? "border-[var(--brand-royal-red)] ring-2 ring-[var(--brand-royal-red)]/20 bg-white"
                    : "border-gray-200 bg-white hover:border-gray-300"
                    } ${!label ? "text-gray-400" : "text-gray-800"}`}
            >
                <span className="flex items-center gap-2 truncate">
                    {icon && <span className="text-gray-400">{icon}</span>}
                    {label || placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="max-h-56 overflow-y-auto py-1">
                        {options.map((opt, idx) => {
                            const optValue = typeof opt === "string" ? opt : opt.value;
                            const optLabel = typeof opt === "string" ? opt : opt.label;
                            const isSelected = optValue === value;

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        onChange(optValue);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${isSelected
                                        ? "bg-red-50 text-[var(--brand-royal-red)] font-semibold"
                                        : "text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected
                                        ? "border-[var(--brand-royal-red)] bg-[var(--brand-royal-red)]"
                                        : "border-gray-300"
                                        }`}>
                                        {isSelected && <Check size={10} className="text-white" />}
                                    </span>
                                    {optLabel}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main Modal ────────────────────────────────────────────
const ReturnCancelModal = ({ open, onClose, order, mode = "return", refundedItemIds = new Set() }) => {
    const { user, token } = useAuth();
    const { showToast } = useToast();

    // Form State
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    const [files, setFiles] = useState([]);
    const [returnMethod, setReturnMethod] = useState("courier");
    const [courier, setCourier] = useState("");
    const [refundMethod, setRefundMethod] = useState("store_wallet");
    const [bankDetails, setBankDetails] = useState({
        accountName: "", accountNumber: "", bankName: "", branch: "",
    });
    const [returnAddress, setReturnAddress] = useState({
        name: "", phone: "", address: "",
    });
    const [selectedRefundItems, setSelectedRefundItems] = useState({});

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isCancel = mode === "cancel";
    const orderStatus = Number(order?.tran_status ?? order?.status ?? 0);
    const hideShippingForCancel = isCancel && orderStatus < 2;
    const isCashOnDelivery = /(cod|cash)/i.test(String(order?.pay_mode || ""));
    const shouldCollectRefundMethod = !(isCancel && orderStatus === 1 && isCashOnDelivery);
    const shouldHideCashRefundOption = !isCancel && orderStatus === 4 && isCashOnDelivery;
    const refundMethodOptions = shouldHideCashRefundOption
        ? REFUND_METHODS.filter((m) => m.value !== "cash")
        : REFUND_METHODS;
    const defaultRefundMethod = shouldHideCashRefundOption
        ? (refundMethodOptions[0]?.value || "store_credit")
        : "cash";
    const reasons = isCancel ? CANCEL_REASONS : RETURN_REASONS;
    const orderItems = Array.isArray(order?.sales_details) ? order.sales_details : [];

    // Auto-fill return address from user profile / order data
    useEffect(() => {
        if (open) {
            const name = user?.first_name
                ? `${user.first_name}${user.last_name ? " " + user.last_name : ""}`
                : order?.delivery_customer_name || "";
            const phone = user?.phone || order?.delivery_customer_phone || "";
            const address = order?.delivery_customer_address || user?.address || "";

            setReturnAddress({ name, phone, address });
            // Reset other fields
            setReason("");
            setDescription("");
            setFiles([]);
            setReturnMethod("courier");
            setCourier("");
            setRefundMethod(defaultRefundMethod);
            setBankDetails({ accountName: "", accountNumber: "", bankName: "", branch: "" });
            setError("");

            const initialSelection = {};
            (Array.isArray(order?.sales_details) ? order.sales_details : []).forEach((item, idx) => {
                const key = String(item?.id ?? `${item?.product_id || "p"}-${idx}`);
                const maxQty = Math.max(1, Number(item?.qty ?? item?.quantity ?? 1));
                const isAlreadyRefunded = refundedItemIds instanceof Set ? refundedItemIds.has(Number(item.id)) : false;
                
                initialSelection[key] = {
                    selected: false,
                    maxQty,
                    isAlreadyRefunded
                };
            });
            setSelectedRefundItems(initialSelection);
        }
    }, [order, mode, open, user, defaultRefundMethod]);

    const toggleRefundItem = (key, checked) => {
        setSelectedRefundItems((prev) => ({
            ...prev,
            [key]: {
                ...(prev[key] || { qty: 1, maxQty: 1 }),
                selected: checked,
            },
        }));
    };

    // File handling
    const handleFileChange = (e) => {
        if (e.target.files) {
            setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
        }
    };
    const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

    // Submit
    const handleSubmit = async () => {
        if (!reason) { setError("Please select a reason."); return; }
        setError("");
        setLoading(true);

        try {
            let attachmentPath = null;
            if (files.length > 0) {
                const formData = new FormData();
                // Send only the first file as requested by user
                formData.append("pictures[]", files[0]);
                formData.append("user_id", String(process.env.NEXT_PUBLIC_USER_ID));

                const uploadRes = await uploadReviewMedia(formData, token);
                if (uploadRes?.success && Array.isArray(uploadRes.path) && uploadRes.path.length > 0) {
                    attachmentPath = uploadRes.path[0].path;
                } else {
                    console.warn("Failed to upload media, proceeding without attachment.");
                }
            }

            // Build item-level refund_details based on selected products + qty
            const refundDetails = orderItems.reduce((acc, item, idx) => {
                const key = String(item?.id ?? `${item?.product_id || "p"}-${idx}`);
                const selection = selectedRefundItems[key];
                const maxQty = Math.max(1, Number(item?.qty ?? item?.quantity ?? 1));
                const isSelected = Boolean(selection?.selected);
                const qty = maxQty;

                if (!isSelected) return acc;

                acc.push({
                    sale_details_id: item.id,
                    product_id: item.product_id,
                    product_item_id: item.product_item_id || null,
                    product_variant_id: item.product_variant_id || null,
                    child_product_variant_id: item.child_product_variant_id || null,
                    qty,
                    price: parseFloat(item.price) || 0,
                });
                return acc;
            }, []);

            if (refundDetails.length === 0) {
                setError("Please select at least one product to continue.");
                setLoading(false);
                return;
            }

            const courierLabel = hideShippingForCancel
                ? "Not Applicable"
                : (returnMethod === "drop_off"
                    ? "Drop Off"
                    : (COURIERS.find(c => c.value === courier)?.label || courier));

            const payload = {
                invoice_id: order?.invoice_id,
                customer_id: user?.customer_id || user?.id,
                reason: reason,
                reason_note: description,
                attachment: attachmentPath,
                courier_info: courierLabel || "Not Specified",
                refund_method: shouldCollectRefundMethod ? refundMethod : null,
                bank_details: shouldCollectRefundMethod && ["bkash", "nagad", "rocket", "bank_transfer"].includes(refundMethod)
                    ? JSON.stringify(bankDetails)
                    : null,
                status: 0,
                refund_details: refundDetails
            };

            try {
                const data = await submitRefundRequest(token, payload);
                if (!data?.success && data?.message) throw new Error(data.message);

                // Update ecommerce status to 11 as requested
                await updateEcommerceStatus(order?.invoice_id, 11);
            } catch (apiErr) {
                throw new Error("Failed to submit request: " + apiErr.message);
            }

            showToast({
                message: isCancel
                    ? "Cancellation request submitted!"
                    : "Return request submitted!",
                type: "success",
            });
            onClose();
        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;
    if (typeof window === "undefined") return null;
    const { createPortal } = require("react-dom");

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center pt-16 sm:pt-0 pb-0 sm:pb-4 p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white w-full h-[calc(100vh-4rem)] sm:h-auto sm:max-h-[88vh] sm:max-w-2xl shadow-2xl flex flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ═══ Header ═══ */}
                <div className={`flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0 ${isCancel
                    ? "bg-gradient-to-r from-orange-50 to-red-50 border-orange-100"
                    : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100"
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isCancel ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"}`}>
                            {isCancel ? <AlertTriangle size={20} /> : <RotateCcw size={20} />}
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-gray-900">
                                {isCancel ? "Cancel & Refund" : "Return & Refund"}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5 font-mono">#{order?.invoice_id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/60 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* ═══ Body ═══ */}
                <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-5">

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
                            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Refund Items */}
                    {orderItems.length > 0 && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                Select Products
                            </label>
                            <div className="space-y-2">
                                {orderItems.map((item, idx) => {
                                    const key = String(item?.id ?? `${item?.product_id || "p"}-${idx}`);
                                    const maxQty = Math.max(1, Number(item?.qty ?? item?.quantity ?? 1));
                                    const productName = item?.product_info?.name || `Product #${item?.product_id || idx + 1}`;
                                    const itemImage = item?.product_info?.image_path
                                        || (Array.isArray(item?.product_info?.image_paths) ? item.product_info.image_paths[0] : null)
                                        || null;
                                    const selected = Boolean(selectedRefundItems[key]?.selected);

                                    return (
                                        <div
                                            key={key}
                                            className={`p-3 rounded-xl border transition-colors ${selected
                                                ? "border-[var(--brand-royal-red)]/30 bg-red-50/30"
                                                : "border-gray-200 bg-white"
                                                } ${selectedRefundItems[key]?.isAlreadyRefunded ? "opacity-60 cursor-not-allowed bg-gray-50" : ""}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    disabled={selectedRefundItems[key]?.isAlreadyRefunded}
                                                    onChange={(e) => toggleRefundItem(key, e.target.checked)}
                                                    className="h-4 w-4 accent-[var(--brand-royal-red)] flex-shrink-0 disabled:opacity-50"
                                                />
                                                <div className="h-12 w-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0 relative">
                                                    {itemImage ? (
                                                        <Image src={itemImage} alt={productName} fill className="object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                            <Package size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{productName}</p>
                                                        {selectedRefundItems[key]?.isAlreadyRefunded && (
                                                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded-full bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
                                                                Returned
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Ordered Qty: {maxQty}{item?.size ? ` - Size: ${item.size}` : ""}
                                                    </p>
                                                </div>
                                                <div className="text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-md px-2.5 py-1 whitespace-nowrap">
                                                    Qty: {maxQty}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Reason ── */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">
                            Reason <span className="text-red-500">*</span>
                        </label>
                        <CustomDropdown
                            value={reason}
                            onChange={setReason}
                            options={reasons}
                            placeholder="Select a reason..."
                        />
                    </div>

                    {/* ── Description ── */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">
                            Additional Details <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the issue in detail..."
                            rows={3}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-royal-red)] focus:border-transparent resize-none transition-all text-gray-700 placeholder-gray-400"
                        />
                    </div>

                    {/* ── Media Upload ── */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">
                            Photos / Videos <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer relative">
                            <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            <div className="flex flex-col items-center gap-2 pointer-events-none">
                                <div className="p-2.5 bg-gray-100 rounded-full text-gray-400"><Upload size={20} /></div>
                                <span className="text-sm font-medium text-gray-700">Click to upload images or videos</span>
                                <span className="text-xs text-gray-400">JPG, PNG, MP4 supported</span>
                            </div>
                        </div>
                        {files.length > 0 && (
                            <div className="mt-3 grid grid-cols-4 sm:grid-cols-5 gap-2">
                                {files.map((file, idx) => (
                                    <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg border border-gray-200 overflow-hidden group">
                                        {file.type.startsWith("video") ? (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-700 text-white text-xs font-medium">Video</div>
                                        ) : (
                                            <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                                        )}
                                        <button onClick={() => removeFile(idx)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Courier Selector ── */}
                    {!hideShippingForCancel && (
                    <>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">
                            Return Method
                        </label>
                        <CustomDropdown
                            value={returnMethod}
                            onChange={setReturnMethod}
                            options={RETURN_METHODS}
                            placeholder="Select return method..."
                            icon={<Truck size={16} />}
                        />
                    </div>

                    {returnMethod === "courier" && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                Preferred Courier
                            </label>
                            <CustomDropdown
                                value={courier}
                                onChange={setCourier}
                                options={COURIERS}
                                placeholder="Select courier service..."
                                icon={<Truck size={16} />}
                            />
                        </div>
                    )}

                    {/* ── Return / Pick-up Address ── */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">
                            {returnMethod === "drop_off" ? "Drop Off Address" : "Return Pick-up Address"}
                        </label>
                        <p className="text-xs text-gray-400 mb-2">
                            {returnMethod === "drop_off"
                                ? "This drop off location is fixed and cannot be edited."
                                : "Auto-filled from your profile. You can edit if needed."}
                        </p>
                        <div className="space-y-2 bg-gray-50 border border-gray-100 rounded-xl p-3">
                            <input type="text" placeholder="Full Name"
                                value={returnAddress.name}
                                disabled={returnMethod === "drop_off"}
                                onChange={(e) => setReturnAddress((p) => ({ ...p, name: e.target.value }))}
                                className={`w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-royal-red)] focus:border-transparent transition-all placeholder-gray-400 ${returnMethod === "drop_off" ? "bg-gray-100 opacity-60 cursor-not-allowed" : ""}`} />
                            <input type="tel" placeholder="Phone Number"
                                value={returnAddress.phone}
                                disabled={returnMethod === "drop_off"}
                                onChange={(e) => setReturnAddress((p) => ({ ...p, phone: e.target.value }))}
                                className={`w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-royal-red)] focus:border-transparent transition-all placeholder-gray-400 ${returnMethod === "drop_off" ? "bg-gray-100 opacity-60 cursor-not-allowed" : ""}`} />
                            <textarea placeholder="Full address including area & district"
                                value={returnMethod === "drop_off" ? DROP_OFF_ADDRESS : returnAddress.address}
                                disabled={returnMethod === "drop_off"}
                                onChange={(e) => setReturnAddress((p) => ({ ...p, address: e.target.value }))}
                                rows={2}
                                className={`w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-royal-red)] focus:border-transparent resize-none transition-all placeholder-gray-400 ${returnMethod === "drop_off" ? "bg-gray-100 text-gray-700 cursor-not-allowed" : ""}`} />
                        </div>
                    </div>
                    </>
                    )}

                    {/* ── Refund Method ── */}
                    {shouldCollectRefundMethod && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Preferred Refund Method</label>
                            <CustomDropdown
                                value={refundMethod}
                                onChange={setRefundMethod}
                                options={refundMethodOptions}
                                placeholder="Select refund method..."
                            />
                        </div>
                    )}

                    {/* ── Bank Details (conditional) ── */}
                    {shouldCollectRefundMethod && refundMethod === "bank_transfer" && (
                        <div className="border border-blue-100 bg-blue-50 rounded-xl p-4 space-y-2 mb-3">
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Bank Details</p>
                            <input type="text" placeholder="Account Holder Name"
                                value={bankDetails.accountName}
                                onChange={(e) => setBankDetails((p) => ({ ...p, accountName: e.target.value }))}
                                className="w-full border border-blue-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all placeholder-gray-400" />
                            <input type="text" placeholder="Account Number"
                                value={bankDetails.accountNumber}
                                onChange={(e) => setBankDetails((p) => ({ ...p, accountNumber: e.target.value }))}
                                className="w-full border border-blue-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all placeholder-gray-400" />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" placeholder="Bank Name"
                                    value={bankDetails.bankName}
                                    onChange={(e) => setBankDetails((p) => ({ ...p, bankName: e.target.value }))}
                                    className="w-full border border-blue-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all placeholder-gray-400" />
                                <input type="text" placeholder="Branch"
                                    value={bankDetails.branch}
                                    onChange={(e) => setBankDetails((p) => ({ ...p, branch: e.target.value }))}
                                    className="w-full border border-blue-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all placeholder-gray-400" />
                            </div>
                        </div>
                    )}

                    {/* ── Mobile Banking Details (conditional) ── */}
                    {shouldCollectRefundMethod && ["bkash", "nagad", "rocket"].includes(refundMethod) && (
                        <div className="border border-[var(--brand-royal-red)] bg-red-50 rounded-xl p-4 space-y-2 mt-3">
                            <p className="text-xs font-bold text-[var(--brand-royal-red)] uppercase tracking-wide mb-2">{refundMethodOptions.find(m => m.value === refundMethod)?.label} Account Details</p>
                            <input type="tel" placeholder={"Enter " + refundMethodOptions.find(m => m.value === refundMethod)?.label + " Number"}
                                value={bankDetails.accountNumber}
                                onChange={(e) => setBankDetails((p) => ({ ...p, accountNumber: e.target.value }))}
                                className="w-full border border-red-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-royal-red)] transition-all placeholder-gray-400" />
                            <CustomDropdown
                                value={bankDetails.accountName || "personal"}
                                onChange={(val) => setBankDetails((p) => ({ ...p, accountName: val }))}
                                options={[{ label: "Personal", value: "personal" }, { label: "Agent", value: "agent" }]}
                                placeholder="Account Type"
                            />
                        </div>
                    )}
                </div>

                {/* ═══ Footer ═══ */}
                <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} disabled={loading}
                        className="px-5 py-2.5 text-gray-700 font-bold hover:bg-gray-200 rounded-xl transition-colors text-sm disabled:opacity-50">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={loading}
                        className={`px-7 py-2.5 font-bold rounded-xl text-white text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95 ${isCancel
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "bg-[var(--brand-royal-red)] hover:bg-[#a01830]"
                            }`}>
                        {loading && <Loader2 size={15} className="animate-spin" />}
                        {loading ? "Submitting..." : isCancel ? "Submit Cancellation" : "Submit Return Request"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ReturnCancelModal;
