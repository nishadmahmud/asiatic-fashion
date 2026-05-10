"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { sizeChartData, inchesToCm, detectProductType } from "@/data/sizeChartData";

const SizeChartModal = ({ isOpen, onClose, product }) => {
    const [activeTab, setActiveTab] = useState("chart"); // "chart" or "measure"
    const [unit, setUnit] = useState("in"); // "in" or "cm"
    const [productType, setProductType] = useState("generic");

    // Detect product type when product changes (fallback for static data or "How to Measure" text)
    useEffect(() => {
        if (product) {
            const type = detectProductType(product.name || "", product.category || "", product.subcategory || "");
            setProductType(type);
        }
    }, [product]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Prepare Data Logic
    let displayColumns = [];
    let displayRows = [];
    let howToMeasure = [];

    // Check if dynamic data exists
    if (product?.size_chart_category?.size_chart_values?.length > 0) {
        const apiValues = product.size_chart_category.size_chart_values;
        const potentialKeys = [
            { key: 'chest', label: 'Chest' },
            { key: 'waist', label: 'Waist' },
            { key: 'hip', label: 'Hip' },
            { key: 'length', label: 'Length' },
            { key: 'shoulder', label: 'Shoulder' },
            { key: 'inseam', label: 'Inseam' },
            { key: 'foot_length', label: 'Foot Length' },
            { key: 'bust', label: 'Bust' },
        ];

        // Determine active columns (keys that have at least one non-null value)
        const activeKeys = potentialKeys.filter(k =>
            apiValues.some(v => v[k.key] !== null && v[k.key] !== undefined && v[k.key] !== "")
        );

        // Generate headers matching the active keys
        displayColumns = ["Size", ...activeKeys.map(k => `${k.label} (${unit})`)];

        // Generate rows
        displayRows = apiValues.map(v => {
            const values = activeKeys.map(k => {
                let val = v[k.key];
                if (val == null || val === "") return "-";
                // API values are strings/numbers representing inches. Convert if unit is cm.
                if (unit === "cm") return inchesToCm(parseFloat(val));
                return val;
            });
            return {
                label: v.size_label,
                values: values
            };
        });

        // For "How to Measure", use static data based on detected type as API doesn't seem to provide instructions yet
        const staticData = sizeChartData[productType] || sizeChartData.generic;
        howToMeasure = staticData.howToMeasure;

    } else {
        // Fallback to static data
        const staticData = sizeChartData[productType] || sizeChartData.generic;
        displayColumns = unit === "in" ? staticData.columns : staticData.columnsCm;
        howToMeasure = staticData.howToMeasure;

        displayRows = staticData.rows.map(row => {
            // Extract values excluding the first 'size' key
            const values = Object.values(row).slice(1);
            const convertedValues = unit === "cm"
                ? values.map(val => typeof val === "number" ? inchesToCm(val) : val)
                : values;
            return {
                label: row.size,
                values: convertedValues
            };
        });
    }

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed top-0 right-0 w-full sm:w-[500px] h-full bg-white z-[101] shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">
                        Size Chart {product?.size_chart_category?.name ? `- ${product.size_chart_category.name}` : ""}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Product Info */}
                {product && (
                    <div className="flex gap-4 p-4 border-b border-gray-100 bg-gray-50">
                        {product.images && product.images[0] && (
                            <div className="relative w-20 h-24 flex-shrink-0 bg-white rounded overflow-hidden">
                                <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm">{product.brand}</h3>
                            <p className="text-sm text-gray-600 truncate">{product.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="font-bold text-gray-900">৳{product.price}</span>
                                {product.discount && (
                                    <>
                                        <span className="text-sm text-gray-400 line-through">৳{product.mrp}</span>
                                        <span className="text-sm text-[var(--brand-royal-red)] font-bold">({product.discount})</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab("chart")}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === "chart"
                            ? "text-[var(--brand-royal-red)] border-b-2 border-[var(--brand-royal-red)]"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Size Chart
                    </button>
                    <button
                        onClick={() => setActiveTab("measure")}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === "measure"
                            ? "text-[var(--brand-royal-red)] border-b-2 border-[var(--brand-royal-red)]"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        How to Measure
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === "chart" ? (
                        <>
                            {/* Unit Toggle */}
                            <div className="flex justify-end mb-4">
                                <div className="inline-flex bg-gray-100 rounded-full p-1">
                                    <button
                                        onClick={() => setUnit("in")}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${unit === "in"
                                            ? "bg-gray-800 text-white"
                                            : "text-gray-600 hover:text-gray-800"
                                            }`}
                                    >
                                        in
                                    </button>
                                    <button
                                        onClick={() => setUnit("cm")}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${unit === "cm"
                                            ? "bg-gray-800 text-white"
                                            : "text-gray-600 hover:text-gray-800"
                                            }`}
                                    >
                                        cm
                                    </button>
                                </div>
                            </div>

                            {/* Size Chart Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            {displayColumns.map((col, index) => (
                                                <th
                                                    key={index}
                                                    className="py-3 px-3 text-left font-bold text-gray-700 whitespace-nowrap"
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayRows.length > 0 ? (
                                            displayRows.map((row, rowIndex) => (
                                                <tr
                                                    key={rowIndex}
                                                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="py-3 px-3 font-medium text-gray-900">
                                                        {row.label}
                                                    </td>
                                                    {row.values.map((val, valIndex) => (
                                                        <td key={valIndex} className="py-3 px-3 text-gray-600">
                                                            {val}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={displayColumns.length} className="py-4 text-center text-gray-500">
                                                    No size chart data available.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <p className="text-xs text-gray-500 mt-4">
                                * Measurements may vary slightly based on fit type
                            </p>
                        </>
                    ) : (
                        /* How to Measure */
                        <div className="space-y-6">
                            <p className="text-sm text-gray-600">
                                Follow these tips to get accurate measurements:
                            </p>
                            {howToMeasure.map((item, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[var(--brand-royal-red)] text-white flex items-center justify-center font-bold flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">{item.part}</h4>
                                        <p className="text-sm text-gray-600">{item.instruction}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer note */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-500 text-center">
                        Need help? <a href="/contact" className="text-[var(--brand-royal-red)] font-medium hover:underline">Contact Us</a>
                    </p>
                </div>
            </div>
        </>
    );
};

export default SizeChartModal;
