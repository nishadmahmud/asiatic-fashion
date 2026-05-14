/**
 * Build a campaign discount map from active campaigns.
 * Maps product IDs to their best campaign discount.
 * @param {Array} campaigns - Array of active campaign objects
 * @returns {Object} Map of productId -> { discountType, discountValue, savings }
 */
export function buildCampaignDiscountMap(campaigns = []) {
    const discountMap = {};
    campaigns.forEach((campaign) => {
        const campaignProducts = Array.isArray(campaign?.products) ? campaign.products : [];
        campaignProducts.forEach((product) => {
            const productId = product?.id;
            const mrp = Number(product?.retails_price || 0);
            if (!productId || mrp <= 0) return;

            const discountType = String(product?.pivot?.discount_type || campaign?.discount_type || "percentage").toLowerCase();
            const discountValue = Number(product?.pivot?.discount ?? campaign?.discount ?? 0);
            if (discountValue <= 0) return;

            const discountedPrice = discountType === "amount"
                ? Math.max(0, mrp - discountValue)
                : Math.max(0, Math.round(mrp * (1 - discountValue / 100)));
            const savings = Math.max(0, mrp - discountedPrice);

            const existing = discountMap[productId];
            if (!existing || savings > existing.savings) {
                discountMap[productId] = {
                    discountType,
                    discountValue,
                    savings,
                };
            }
        });
    });
    return discountMap;
}

/**
 * Collect human-readable size labels from whatever the API sends (parent variants,
 * child variants, or legacy `items[].size`). Listing payloads often omit variants;
 * when present, include child names so filters match detail pages.
 * @param {Object} apiProduct
 * @returns {string[]}
 */
export function collectProductSizeLabels(apiProduct) {
    const out = [];
    const push = (v) => {
        const s = String(v ?? "").trim();
        if (s) out.push(s);
    };
    const variants = Array.isArray(apiProduct?.product_variants) ? apiProduct.product_variants : [];
    for (const v of variants) {
        push(v?.name);
        const children = Array.isArray(v?.child_variants) ? v.child_variants : [];
        for (const c of children) push(c?.name);
    }
    const items = Array.isArray(apiProduct?.items) ? apiProduct.items : [];
    for (const it of items) push(it?.size);
    return [...new Set(out)];
}

/**
 * Transform a raw API product object into our ProductCard shape.
 * @param {Object} apiProduct - Raw product from the API
 * @param {Object} campaignDiscountsMap - Optional campaign discount map
 * @returns {Object} Transformed product for our ProductCard component
 */
export function transformProduct(apiProduct, campaignDiscountsMap = {}) {
    const mrp = Number(apiProduct.retails_price || 0);
    let finalPrice = mrp;
    let discountLabel = "";
    const isFixedDiscountType = (type) => {
        const normalized = String(type || "").toLowerCase();
        return normalized === "amount" || normalized === "fixed";
    };

    // 1. Product-level discount
    if (apiProduct.discount > 0) {
        const discountType = apiProduct.discount_type
            ? String(apiProduct.discount_type).toLowerCase()
            : "percentage";
        if (isFixedDiscountType(discountType)) {
            finalPrice = mrp - apiProduct.discount;
            discountLabel = `৳${apiProduct.discount} OFF`;
        } else {
            finalPrice = Math.round(mrp * (1 - apiProduct.discount / 100));
            discountLabel = `${apiProduct.discount}% OFF`;
        }
        if (finalPrice < 0) finalPrice = 0;
    }

    // 2. Campaign discount (override if better deal)
    const campaignDiscount = campaignDiscountsMap[apiProduct.id];
    if (campaignDiscount && mrp > 0) {
        const campaignFinalPrice =
            isFixedDiscountType(campaignDiscount.discountType)
                ? Math.max(0, mrp - campaignDiscount.discountValue)
                : Math.max(0, Math.round(mrp * (1 - campaignDiscount.discountValue / 100)));

        if (!apiProduct.discount || campaignFinalPrice < finalPrice) {
            finalPrice = campaignFinalPrice;
            discountLabel =
                isFixedDiscountType(campaignDiscount.discountType)
                    ? `৳${campaignDiscount.discountValue} OFF`
                    : `${campaignDiscount.discountValue}% OFF`;
        }
    }

    // 3. Resolve images
    const images =
        Array.isArray(apiProduct.image_paths) && apiProduct.image_paths.length > 0
            ? apiProduct.image_paths
            : [apiProduct.image_path, apiProduct.image_path1, apiProduct.image_path2].filter(
                  (img) => typeof img === "string" && img.trim() !== ""
              );

    // 4. Build our ProductCard shape
    return {
        id: apiProduct.id,
        name: apiProduct.name,
        brand: apiProduct.brand_name || apiProduct.brands?.name || "ASIATIC",
        price: finalPrice,
        originalPrice: discountLabel ? mrp : null,
        discount: discountLabel,
        image: images[0] || "/placeholder.png",
        images: images,
        image_paths: images,
        colors: [apiProduct.color_code || "#1A1A1A"],
        color_code: apiProduct.color_code || "#1A1A1A",
        colorName: apiProduct.color || null,
        // Extra data for category/product pages + PDP session snapshot
        sizes: collectProductSizeLabels(apiProduct),
        categoryId: apiProduct.category_id ?? null,
        category_name: apiProduct.category?.name || apiProduct.category_name || "",
        product_variants: Array.isArray(apiProduct.product_variants) ? apiProduct.product_variants : [],
        current_stock: apiProduct.current_stock,
        isOutOfStock: apiProduct.current_stock === 0,
        rating: apiProduct.review_summary?.average_rating || 0,
        reviews: apiProduct.review_summary?.total_reviews || 0,
    };
}
