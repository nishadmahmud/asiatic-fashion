"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { getAttributes } from "@/lib/api";

/**
 * Dynamic Category Top Filters - fetches attributes from API
 * Each attribute becomes a dropdown filter button
 */
export default function CategoryTopFilters({
    selectedAttributeValues = [], // Array of selected attribute value IDs
    onAttributeChange, // Callback when attribute values change: (attributeValueIds) => void
    availableSizes = [],
    selectedSizes = [],
    onSizeChange,
    className = "",
    hiddenAttributeNames = [] // Array of attribute names to hide (case-insensitive) - e.g., ["Gender"] when on Men/Women category
}) {
    const [openDropdown, setOpenDropdown] = useState(null);
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const itemsRef = useRef({});
    const portalRef = useRef(null);

    // Set mounted for portal hydration safety
    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch attributes on mount
    useEffect(() => {
        const fetchAttributes = async () => {
            try {
                const data = await getAttributes();
                if (Array.isArray(data)) {
                    // Filter only active attributes with active values
                    const activeAttributes = data
                        .filter(attr => attr.status === 'active')
                        .map(attr => ({
                            ...attr,
                            values: (attr.values || []).filter(v => v.status === 'active')
                        }))
                        .filter(attr => attr.values.length > 0);
                    setAttributes(activeAttributes);
                }
            } catch (error) {
                console.error("Error fetching attributes:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAttributes();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is inside the trigger button
            const isInsideTrigger = openDropdown && itemsRef.current[openDropdown] && itemsRef.current[openDropdown].contains(event.target);
            // Check if click is inside the portal content
            const isInsidePortal = portalRef.current && portalRef.current.contains(event.target);

            if (openDropdown && !isInsideTrigger && !isInsidePortal) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openDropdown]);

    const toggleDropdown = (name) => {
        setOpenDropdown(openDropdown === name ? null : name);
    };

    // Toggle attribute value selection
    const handleValueToggle = (valueId) => {
        const newValues = selectedAttributeValues.includes(valueId)
            ? selectedAttributeValues.filter(id => id !== valueId)
            : [...selectedAttributeValues, valueId];
        onAttributeChange(newValues);
    };

    // Check if any value from an attribute is selected
    const isAttributeActive = (attribute) => {
        return attribute.values.some(v => selectedAttributeValues.includes(v.id));
    };

    // Get count of selected values for an attribute
    const getSelectedCount = (attribute) => {
        return attribute.values.filter(v => selectedAttributeValues.includes(v.id)).length;
    };

    // Check if an attribute should be hidden based on its values matching category names
    const shouldHideAttribute = (attribute) => {
        if (!hiddenAttributeNames || hiddenAttributeNames.length === 0) return false;

        // Filter out empty/null names and convert to lowercase
        const validHiddenNames = hiddenAttributeNames.filter(n => n && n.trim() !== '');
        if (validHiddenNames.length === 0) return false;

        const lowerHiddenNames = validHiddenNames.map(n => n.toLowerCase().trim());

        // Check if any of the attribute values match the hidden names (case-insensitive)
        // Note: API returns `value` property, not `name`
        const shouldHide = attribute.values.some(v => {
            const valueName = v.value || v.name; // Support both property names
            if (!valueName) return false;
            return lowerHiddenNames.includes(valueName.toLowerCase().trim());
        });

    };

    // Filter out hidden attributes
    const visibleAttributes = attributes.filter(attr => !shouldHideAttribute(attr));

    // Temp debug
    if (hiddenAttributeNames && hiddenAttributeNames.length > 0) {
        console.log('Filter hiding check - hiddenNames:', hiddenAttributeNames, 'visible:', visibleAttributes.map(a => a.name));
    }

    if (loading) {
        return (
            <div className={`flex gap-2 md:gap-3 py-2 md:py-0 ${className}`}>
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                ))}
            </div>
        );
    }

    return (
        <div className={`flex md:flex-wrap gap-2 md:gap-3 py-2 md:py-0 relative z-30 overflow-x-auto md:overflow-visible scrollbar-hide ${className}`}>

            {/* Dynamic Attribute Filters */}
            {visibleAttributes.map((attribute) => (
                <div
                    key={attribute.id}
                    className="relative flex-shrink-0"
                    ref={el => itemsRef.current[`attr_${attribute.id}`] = el}
                >
                    <button
                        onClick={() => toggleDropdown(`attr_${attribute.id}`)}
                        className={`flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium border transition-colors whitespace-nowrap ${isAttributeActive(attribute)
                            ? 'bg-gray-100 text-[var(--brand-royal-red)] border-[var(--brand-royal-red)] border-opacity-30'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <span>
                            {attribute.name}
                            {getSelectedCount(attribute) > 0 && ` (${getSelectedCount(attribute)})`}
                        </span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12" height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`transition-transform duration-200 ${openDropdown === `attr_${attribute.id}` ? 'rotate-180' : ''}`}
                        >
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </button>

                    {openDropdown === `attr_${attribute.id}` && (
                        <>
                            {/* Mobile modal - rendered via portal for iOS Safari */}
                            {mounted && createPortal(
                                <div className="md:hidden" ref={portalRef}>
                                    {/* Mobile backdrop */}
                                    <div
                                        className="fixed inset-0 bg-black/50 z-[100]"
                                        onClick={() => setOpenDropdown(null)}
                                    />
                                    {/* Mobile dropdown */}
                                    <div className="fixed inset-x-0 bottom-0 z-[101] w-full rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] bg-white border-t border-gray-100 py-2 pb-20 max-h-[60vh] overflow-y-auto">
                                        {/* Mobile header */}
                                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                                            <span className="font-bold text-gray-900">{attribute.name}</span>
                                            <button onClick={() => setOpenDropdown(null)} className="p-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>
                                        {/* Values list */}
                                        <div className="p-2 space-y-1">
                                            {attribute.values.map((value) => (
                                                <button
                                                    key={value.id}
                                                    onClick={() => handleValueToggle(value.id)}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center gap-2 ${selectedAttributeValues.includes(value.id)
                                                        ? 'text-[var(--brand-royal-red)] font-bold'
                                                        : 'text-gray-700'
                                                        }`}
                                                >
                                                    <div className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${selectedAttributeValues.includes(value.id)
                                                        ? 'border-[var(--brand-royal-red)] bg-[var(--brand-royal-red)] text-white'
                                                        : 'border-gray-300'
                                                        }`}>
                                                        {selectedAttributeValues.includes(value.id) && (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                            </svg>
                                                        )}
                                                    </div>
                                                    {value.value}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>,
                                document.body
                            )}

                            {/* Desktop dropdown - rendered inline */}
                            <div className="hidden md:block absolute top-full left-0 w-56 mt-2 bg-white border border-gray-100 rounded-lg shadow-xl py-2 max-h-96 overflow-y-auto z-50">
                                {/* Values list */}
                                <div className="p-2 space-y-1">
                                    {attribute.values.map((value) => (
                                        <button
                                            key={value.id}
                                            onClick={() => handleValueToggle(value.id)}
                                            className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center gap-2 ${selectedAttributeValues.includes(value.id)
                                                ? 'text-[var(--brand-royal-red)] font-bold'
                                                : 'text-gray-700'
                                                }`}
                                        >
                                            <div className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${selectedAttributeValues.includes(value.id)
                                                ? 'border-[var(--brand-royal-red)] bg-[var(--brand-royal-red)] text-white'
                                                : 'border-gray-300'
                                                }`}>
                                                {selectedAttributeValues.includes(value.id) && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                )}
                                            </div>
                                            {value.value}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            ))}

            {/* Size Filter - Always visible if sizes available */}
            {availableSizes.length > 0 && (
                <div className="relative flex-shrink-0" ref={el => itemsRef.current['size'] = el}>
                    <button
                        onClick={() => toggleDropdown('size')}
                        className={`flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium border transition-colors whitespace-nowrap ${selectedSizes.length > 0
                            ? 'bg-gray-100 text-[var(--brand-royal-red)] border-[var(--brand-royal-red)] border-opacity-30'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <span>Size {selectedSizes.length > 0 ? `(${selectedSizes.length})` : ''}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${openDropdown === 'size' ? 'rotate-180' : ''}`}>
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </button>

                    {openDropdown === 'size' && (
                        <>
                            {/* Mobile modal - rendered via portal for iOS Safari */}
                            {mounted && createPortal(
                                <div className="md:hidden" ref={portalRef}>
                                    <div className="fixed inset-0 bg-black/50 z-[100]" onClick={() => setOpenDropdown(null)}></div>
                                    <div className="fixed inset-x-0 bottom-0 z-[101] w-full rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] bg-white border-t border-gray-100 p-3 pb-20 max-h-[60vh] overflow-y-auto">
                                        <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                                            <span className="font-bold text-gray-900">Select Sizes</span>
                                            <button onClick={() => setOpenDropdown(null)} className="p-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 max-h-80 overflow-y-auto custom-scrollbar">
                                            {availableSizes.map((size, index) => (
                                                <label key={`size-${index}-${size}`} className={`flex items-center justify-center p-2 border rounded cursor-pointer text-xs font-medium transition-all ${selectedSizes.includes(size)
                                                    ? 'bg-[var(--brand-royal-red)] text-white border-[var(--brand-royal-red)]'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSizes.includes(size)}
                                                        onChange={() => onSizeChange(size)}
                                                        className="hidden"
                                                    />
                                                    {size}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>,
                                document.body
                            )}

                            {/* Desktop dropdown - rendered inline */}
                            <div className="hidden md:block absolute top-full left-0 w-[320px] mt-2 bg-white border border-gray-100 rounded-lg shadow-xl p-3 max-h-96 overflow-y-auto z-50">
                                <div className="grid grid-cols-4 gap-2 max-h-80 overflow-y-auto custom-scrollbar">
                                    {availableSizes.map((size, index) => (
                                        <label key={`size-${index}-${size}`} className={`flex items-center justify-center p-2 border rounded cursor-pointer text-xs font-medium transition-all ${selectedSizes.includes(size)
                                            ? 'bg-[var(--brand-royal-red)] text-white border-[var(--brand-royal-red)]'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedSizes.includes(size)}
                                                onChange={() => onSizeChange(size)}
                                                className="hidden"
                                            />
                                            {size}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
