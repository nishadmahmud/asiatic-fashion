"use client";

import React, { useState, useMemo, useEffect } from "react";

const FilterSidebar = ({
    filters,
    onFilterChange,
    onClearAll,
    products,
    hideBrandFilter = false,
    categories = [],
    selectedCategoryId,
    onCategoryChange,
    // Brand subcategory props
    brandSubcategories,
    hideCategoryRoot = false,
    selectedSubcategoryId,
    onSubcategoryChange,
    selectedChildCategoryId,
    onChildCategoryChange,
    // Attribute filter props
    attributes = [],
    selectedAttributeValues = [],
    onAttributeChange
}) => {
    const MAX_VISIBLE_FILTER_ITEMS = 5;
    const [brandSearch, setBrandSearch] = useState("");
    const [priceRange, setPriceRange] = useState(filters.priceRange || [0, 10000]);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [showAllBrands, setShowAllBrands] = useState(false);
    const [showAllColors, setShowAllColors] = useState(false);
    const [showAllRootlessCategories, setShowAllRootlessCategories] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [expandedSubcategories, setExpandedSubcategories] = useState({});
    const [showAllNestedSubcategories, setShowAllNestedSubcategories] = useState({});

    useEffect(() => {
        if (!brandSubcategories || brandSubcategories.length === 0) {
            setExpandedCategories({});
            setExpandedSubcategories({});
            setShowAllNestedSubcategories({});
            setShowAllRootlessCategories(false);
        }
    }, [brandSubcategories]);

    useEffect(() => {
        if (!hideCategoryRoot && brandSubcategories && brandSubcategories.length > 0 && Object.keys(expandedCategories).length === 0) {
            setExpandedCategories({ [brandSubcategories[0].id]: true });
        }
    }, [brandSubcategories, expandedCategories, hideCategoryRoot]);

    // Extract unique brands from products
    const availableBrands = useMemo(() => {
        const brands = products
            .map(p => p.brand)
            .filter(Boolean)
            .filter((brand, index, self) => self.indexOf(brand) === index)
            .sort();
        return brands;
    }, [products]);



    // Extract unique colors from products, keeping their color codes when available.
    const availableColors = useMemo(() => {
        const colorMap = new Map();

        products.forEach((p) => {
            const colorName = p.color;
            if (!colorName) return;

            if (!colorMap.has(colorName)) {
                colorMap.set(colorName, p.colorCode || null);
            }
        });

        return Array.from(colorMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, code]) => ({ name, code }));
    }, [products]);

    // Calculate price range from products
    const productPriceRange = useMemo(() => {
        if (products.length === 0) return { min: 0, max: 10000 };
        const prices = products.map(p => p.rawPrice || 0);
        return {
            min: Math.floor(Math.min(...prices) / 100) * 100,
            max: Math.ceil(Math.max(...prices) / 100) * 100
        };
    }, [products]);

    const filteredBrands = availableBrands.filter(brand =>
        brand.toLowerCase().includes(brandSearch.toLowerCase())
    );

    const handlePriceChange = (e, index) => {
        const newRange = [...priceRange];
        newRange[index] = parseInt(e.target.value);
        setPriceRange(newRange);
        onFilterChange('priceRange', newRange);
    };

    const discountRanges = [
        { value: 0, label: "All" },
        { value: 10, label: "10% and above" },
        { value: 20, label: "20% and above" },
        { value: 30, label: "30% and above" },
        { value: 40, label: "40% and above" },
        { value: 50, label: "50% and above" },
    ];

    const visibleCategories = showAllCategories ? categories : categories.slice(0, MAX_VISIBLE_FILTER_ITEMS);
    const visibleBrands = showAllBrands ? filteredBrands : filteredBrands.slice(0, MAX_VISIBLE_FILTER_ITEMS);
    const visibleColors = showAllColors ? availableColors : availableColors.slice(0, MAX_VISIBLE_FILTER_ITEMS);

    return (
        <div className="w-full bg-white border-r border-gray-200 p-6 pb-20 h-full">
            {/* Header with Clear All */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-sm font-bold uppercase tracking-wider">Filters</h3>
                <button
                    onClick={onClearAll}
                    className="text-xs text-[var(--brand-royal-red)] font-bold uppercase hover:underline"
                >
                    Clear All
                </button>
            </div>

            {/* Categories - Dynamic List (flat or nested subcategory mode) */}
            {/* Nested Subcategory Mode (for brand pages) */}
            {brandSubcategories && brandSubcategories.length > 0 && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-4">Categories</h4>
                    <div className="space-y-1">
                        {(
                            (hideCategoryRoot && brandSubcategories.length === 1
                                ? brandSubcategories[0].sub_category || []
                                : brandSubcategories
                            ).slice(
                                0,
                                hideCategoryRoot && brandSubcategories.length === 1 && !showAllRootlessCategories
                                    ? MAX_VISIBLE_FILTER_ITEMS
                                    : undefined
                            )
                        ).map((category) => (
                            <div key={category.id}>
                                {!hideCategoryRoot && (
                                    <button
                                        onClick={() =>
                                            setExpandedCategories((prev) => ({
                                                ...prev,
                                                [category.id]: !prev[category.id],
                                            }))
                                        }
                                        className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-800 hover:text-black transition-colors"
                                    >
                                        <span>{category.name}</span>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                            className={`transition-transform duration-200 text-gray-400 ${expandedCategories[category.id] ? 'rotate-180' : ''}`}
                                        >
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    </button>
                                )}
                                {(hideCategoryRoot || expandedCategories[category.id]) && ((hideCategoryRoot ? [category] : category.sub_category || []).length > 0) && (
                                    <div className="pl-3 pb-2 space-y-2 animate-fade-in border-l-2 border-gray-100 ml-1">
                                        {(showAllNestedSubcategories[category.id]
                                            ? (hideCategoryRoot ? [category] : category.sub_category || [])
                                            : (hideCategoryRoot ? [category] : category.sub_category || []).slice(0, MAX_VISIBLE_FILTER_ITEMS)
                                        ).map((sub) => {
                                            const isSelected = selectedSubcategoryId != null
                                                ? selectedSubcategoryId == sub.id
                                                : (filters?.categories || []).includes(sub.id);
                                            const hasChildren = Array.isArray(sub.child_categories) && sub.child_categories.length > 0;
                                            const isSubExpanded = !!expandedSubcategories[sub.id];
                                            return (
                                                <div key={sub.id}>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <label className="flex items-center cursor-pointer group flex-1">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => {
                                                                    if (onSubcategoryChange) {
                                                                        onSubcategoryChange(isSelected ? null : sub.id);
                                                                    } else if (onFilterChange) {
                                                                        const currentCategories = filters?.categories || [];
                                                                        const newCategories = currentCategories.includes(sub.id)
                                                                            ? currentCategories.filter((id) => id !== sub.id)
                                                                            : [...currentCategories, sub.id];
                                                                        onFilterChange('categories', newCategories);
                                                                    }
                                                                }}
                                                                className="w-4 h-4 text-[var(--brand-royal-red)] border-gray-300 rounded focus:ring-[var(--brand-royal-red)]"
                                                            />
                                                            <span className={`ml-3 text-sm group-hover:text-black ${isSelected ? 'text-[var(--brand-royal-red)] font-medium' : 'text-gray-600'}`}>
                                                                {sub.name}
                                                            </span>
                                                        </label>
                                                        {hasChildren && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedSubcategories((prev) => ({ ...prev, [sub.id]: !prev[sub.id] }))}
                                                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                                                aria-label={isSubExpanded ? "Collapse subcategory" : "Expand subcategory"}
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    width="14"
                                                                    height="14"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    className={`transition-transform duration-200 ${isSubExpanded ? 'rotate-180' : ''}`}
                                                                >
                                                                    <path d="m6 9 6 6 6-6" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>

                                                    {hasChildren && isSubExpanded && (
                                                        <div className="pl-7 mt-2 space-y-2">
                                                            {sub.child_categories.map((child) => {
                                                                const isChildSelected = selectedChildCategoryId != null
                                                                    ? selectedChildCategoryId == child.id
                                                                    : (filters?.categories || []).includes(child.id);
                                                                return (
                                                                    <label key={`${sub.id}-${child.id}`} className="flex items-center cursor-pointer group">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isChildSelected}
                                                                            onChange={() => {
                                                                                if (onChildCategoryChange) {
                                                                                    onChildCategoryChange(isChildSelected ? null : child.id, sub.id);
                                                                                } else if (onFilterChange) {
                                                                                    const currentCategories = filters?.categories || [];
                                                                                    const newCategories = currentCategories.includes(child.id)
                                                                                        ? currentCategories.filter((id) => id !== child.id)
                                                                                        : [...currentCategories, child.id];
                                                                                    onFilterChange('categories', newCategories);
                                                                                }
                                                                            }}
                                                                            className="w-3.5 h-3.5 text-[var(--brand-royal-red)] border-gray-300 rounded focus:ring-[var(--brand-royal-red)]"
                                                                        />
                                                                        <span className={`ml-2.5 text-xs group-hover:text-black ${isChildSelected ? 'text-[var(--brand-royal-red)] font-medium' : 'text-gray-500'}`}>
                                                                            {child.name}
                                                                        </span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {!hideCategoryRoot && (category.sub_category || []).length > MAX_VISIBLE_FILTER_ITEMS && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowAllNestedSubcategories((prev) => ({
                                                        ...prev,
                                                        [category.id]: !prev[category.id],
                                                    }))
                                                }
                                                className="text-sm text-[var(--brand-royal-red)] mt-1 hover:underline font-medium"
                                            >
                                                {showAllNestedSubcategories[category.id]
                                                    ? "Show less"
                                                    : `+ ${(category.sub_category || []).length - MAX_VISIBLE_FILTER_ITEMS} more`}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {hideCategoryRoot && brandSubcategories.length === 1 && (brandSubcategories[0].sub_category || []).length > MAX_VISIBLE_FILTER_ITEMS && (
                        <button
                            type="button"
                            onClick={() => setShowAllRootlessCategories((prev) => !prev)}
                            className="text-sm text-[var(--brand-royal-red)] mt-3 hover:underline font-medium"
                        >
                            {showAllRootlessCategories
                                ? "Show less"
                                : `+ ${(brandSubcategories[0].sub_category || []).length - MAX_VISIBLE_FILTER_ITEMS} more`}
                        </button>
                    )}
                </div>
            )}

            {/* Flat Category Mode (for category pages) */}
            {!brandSubcategories && categories && categories.length > 0 && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-4">Categories</h4>
                    <div className="space-y-3">
                        {visibleCategories.map((category, index) => {
                            // Support both filters.categories array (multi-select) and selectedCategoryId (single-select)
                            const categoryId = category.id || category.category_id;
                            const isChecked = filters?.categories?.includes(categoryId) || selectedCategoryId == categoryId;

                            return (
                                <label key={`${categoryId}-${index}`} className="flex items-center cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                            if (onCategoryChange) {
                                                // Single select mode
                                                onCategoryChange(categoryId === selectedCategoryId ? null : categoryId);
                                            } else if (onFilterChange) {
                                                // Multi-select mode via filters
                                                const currentCategories = filters?.categories || [];
                                                const newCategories = currentCategories.includes(categoryId)
                                                    ? currentCategories.filter(id => id !== categoryId)
                                                    : [...currentCategories, categoryId];
                                                onFilterChange('categories', newCategories);
                                            }
                                        }}
                                        className="w-4 h-4 text-[var(--brand-royal-red)] border-gray-300 rounded focus:ring-[var(--brand-royal-red)]"
                                    />
                                    <span className="ml-3 text-sm text-gray-700 group-hover:text-black">
                                        {category.name}
                                        {typeof category.products_count === 'number' && (
                                            <span className="text-gray-400 ml-1">({category.products_count})</span>
                                        )}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                    {categories.length > MAX_VISIBLE_FILTER_ITEMS && (
                        <button
                            onClick={() => setShowAllCategories(!showAllCategories)}
                            className="text-sm text-[var(--brand-royal-red)] mt-3 hover:underline font-medium"
                        >
                            {showAllCategories ? "Show less" : `+ ${categories.length - MAX_VISIBLE_FILTER_ITEMS} more`}
                        </button>
                    )}
                </div>
            )}


            {/* Brand - Hidden on brand pages */}
            {!hideBrandFilter && availableBrands.length > 0 && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-4">Brand</h4>

                    {/* Search Input */}
                    {availableBrands.length > MAX_VISIBLE_FILTER_ITEMS && (
                        <div className="mb-3">
                            <input
                                type="text"
                                placeholder="Search brands..."
                                value={brandSearch}
                                onChange={(e) => setBrandSearch(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[var(--brand-royal-red)]"
                            />
                        </div>
                    )}

                    <div className="space-y-3">
                        {visibleBrands.map((brand, index) => (
                            <label key={`${brand}-${index}`} className="flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.brands.includes(brand)}
                                    onChange={(e) => {
                                        const newBrands = e.target.checked
                                            ? [...filters.brands, brand]
                                            : filters.brands.filter(b => b !== brand);
                                        onFilterChange('brands', newBrands);
                                    }}
                                    className="w-4 h-4 text-[var(--brand-royal-red)] border-gray-300 rounded focus:ring-[var(--brand-royal-red)]"
                                />
                                <span className="ml-3 text-sm text-gray-700 group-hover:text-black">{brand}</span>
                            </label>
                        ))}
                    </div>
                    {filteredBrands.length > MAX_VISIBLE_FILTER_ITEMS && (
                        <button
                            onClick={() => setShowAllBrands(!showAllBrands)}
                            className="text-sm text-[var(--brand-royal-red)] mt-3 hover:underline font-medium"
                        >
                            {showAllBrands ? "Show less" : `+ ${filteredBrands.length - MAX_VISIBLE_FILTER_ITEMS} more`}
                        </button>
                    )}
                </div>
            )}

            {/* Price Range */}
            <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-4">Price</h4>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">৳{priceRange[0]}</span>
                        <span className="text-sm text-gray-400">-</span>
                        <span className="text-sm text-gray-600">৳{priceRange[1]}</span>
                    </div>
                    <div className="relative">
                        <input
                            type="range"
                            min={productPriceRange.min}
                            max={productPriceRange.max}
                            step="100"
                            value={priceRange[0]}
                            onChange={(e) => handlePriceChange(e, 0)}
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--brand-royal-red)]"
                        />
                        <input
                            type="range"
                            min={productPriceRange.min}
                            max={productPriceRange.max}
                            step="100"
                            value={priceRange[1]}
                            onChange={(e) => handlePriceChange(e, 1)}
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--brand-royal-red)] mt-2"
                        />
                    </div>
                </div>
            </div>



            {/* Color */}
            {availableColors.length > 0 && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-4">Color</h4>
                    <div className="space-y-3">
                        {visibleColors.map(({ name, code }) => (
                            <label key={name} className="flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.colors.includes(name)}
                                    onChange={(e) => {
                                        const newColors = e.target.checked
                                            ? [...filters.colors, name]
                                            : filters.colors.filter(c => c !== name);
                                        onFilterChange('colors', newColors);
                                    }}
                                    className="w-4 h-4 text-[var(--brand-royal-red)] border-gray-300 rounded focus:ring-[var(--brand-royal-red)]"
                                />
                                <div className="ml-3 flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded-full border border-gray-300"
                                        style={{ backgroundColor: code || name }}
                                    ></div>
                                    <span className="text-sm text-gray-700 group-hover:text-black capitalize">{name}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                    {availableColors.length > MAX_VISIBLE_FILTER_ITEMS && (
                        <button
                            type="button"
                            onClick={() => setShowAllColors((prev) => !prev)}
                            className="text-sm text-[var(--brand-royal-red)] mt-3 hover:underline font-medium"
                        >
                            {showAllColors ? "Show less" : `+ ${availableColors.length - MAX_VISIBLE_FILTER_ITEMS} more`}
                        </button>
                    )}
                </div>
            )}

            {/* Dynamic Attribute Filters - Hidden on mobile since shown in top bar */}
            {attributes && attributes.length > 0 && attributes.map((attribute) => (
                <div key={attribute.id} className="hidden lg:block mb-6 pb-6 border-b border-gray-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-4">{attribute.name}</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                        {attribute.values?.map((value) => {
                            const isSelected = selectedAttributeValues.includes(value.id);
                            return (
                                <label key={value.id} className="flex items-center cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {
                                            if (onAttributeChange) {
                                                const newValues = isSelected
                                                    ? selectedAttributeValues.filter(id => id !== value.id)
                                                    : [...selectedAttributeValues, value.id];
                                                onAttributeChange(newValues);
                                            }
                                        }}
                                        className="w-4 h-4 text-[var(--brand-royal-red)] border-gray-300 rounded focus:ring-[var(--brand-royal-red)]"
                                    />
                                    <span className="ml-3 text-sm text-gray-700 group-hover:text-black">
                                        {value.value}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Discount Range */}
            <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-4">Discount Range</h4>
                <div className="space-y-3">
                    {discountRanges.map((range) => (
                        <label key={range.value} className="flex items-center cursor-pointer group">
                            <input
                                type="radio"
                                name="discount"
                                value={range.value}
                                checked={filters.discount === range.value}
                                onChange={(e) => onFilterChange('discount', parseInt(e.target.value))}
                                className="w-4 h-4 text-[var(--brand-royal-red)] border-gray-300 focus:ring-[var(--brand-royal-red)]"
                            />
                            <span className="ml-3 text-sm text-blue-600 group-hover:text-blue-800">{range.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FilterSidebar;
