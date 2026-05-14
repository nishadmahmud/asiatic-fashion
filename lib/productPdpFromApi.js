/**
 * Build the PDP `product` object from a raw API product (single source for API → PDP + session snapshot).
 */

function decodeAndNormalizeHtml(html) {
  return String(html || "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function isFixedDiscountType(type) {
  const normalized = String(type || "").toLowerCase();
  return normalized === "amount" || normalized === "fixed";
}

export function getDefaultVariantSelection(apiProduct) {
  const variants = apiProduct?.product_variants;
  if (!Array.isArray(variants) || variants.length === 0) {
    return { selectedSize: "", selectedLength: null };
  }
  const firstAvailable = variants.find((v) => Number(v.quantity) > 0);
  if (firstAvailable) {
    return {
      selectedSize: firstAvailable.name || "",
      selectedLength: firstAvailable.child_variants?.[0]?.name || null,
    };
  }
  const first = variants[0];
  return {
    selectedSize: first?.name || "",
    selectedLength: null,
  };
}

/**
 * @param {object} apiProduct - Raw product from getProductById
 * @returns {object} Shape consumed by `app/product/[id]/page.js`
 */
export function buildPdpProductFromApi(apiProduct) {
  let mrp = Number(apiProduct.retails_price || 0);
  if (mrp === 0 && apiProduct.product_variants?.length > 0) {
    const firstVariant = apiProduct.product_variants[0];
    if (firstVariant.price && parseFloat(firstVariant.price) > 0) {
      mrp = parseFloat(firstVariant.price);
    }
  }

  let finalPrice = mrp;
  let discountLabel = "";
  let saleRule = { kind: "none", value: 0 };

  if (apiProduct.campaigns && apiProduct.campaigns.length > 0) {
    const campaign = apiProduct.campaigns[0];
    const discountType = String(campaign.discount_type || "amount").toLowerCase();
    if (isFixedDiscountType(discountType)) {
      const amt = Number(campaign.discount) || 0;
      saleRule = { kind: "fixed", value: amt };
      finalPrice = Math.max(0, mrp - amt);
      discountLabel = `৳${campaign.discount} OFF`;
    } else {
      const pct = Number(campaign.discount) || 0;
      saleRule = { kind: "percent", value: pct };
      finalPrice = Math.max(0, Math.round(mrp * (1 - pct / 100)));
      discountLabel = `${campaign.discount}% OFF`;
    }
  } else if (apiProduct.discount > 0) {
    const discountType = String(apiProduct.discount_type || "percentage").toLowerCase();
    if (isFixedDiscountType(discountType)) {
      const amt = Number(apiProduct.discount) || 0;
      saleRule = { kind: "fixed", value: amt };
      finalPrice = Math.max(0, mrp - amt);
      discountLabel = `৳${apiProduct.discount} OFF`;
    } else {
      const pct = Number(apiProduct.discount) || 0;
      saleRule = { kind: "percent", value: pct };
      finalPrice = Math.max(0, Math.round(mrp * (1 - pct / 100)));
      discountLabel = `${apiProduct.discount}% OFF`;
    }
  }

  const variantMap = {};
  const unavailableSizes = [];
  (apiProduct.product_variants || []).forEach((v) => {
    variantMap[v.name] = { ...v, children: v.child_variants || [] };
    if (v.child_variants && v.child_variants.length > 0) {
      if (v.child_variants.every((c) => c.quantity === 0)) unavailableSizes.push(v.name);
    } else if (v.quantity === 0) {
      unavailableSizes.push(v.name);
    }
  });

  const images =
    Array.isArray(apiProduct.image_paths) && apiProduct.image_paths.length > 0
      ? apiProduct.image_paths
      : [apiProduct.image_path, apiProduct.image_path1, apiProduct.image_path2].filter(
          (img) => typeof img === "string" && img.trim() !== ""
        );

  const specsArray = Array.isArray(apiProduct.specifications) ? apiProduct.specifications : [];
  const resolvedDescription = decodeAndNormalizeHtml(
    apiProduct.description || apiProduct.short_description || ""
  );
  const materialSpec =
    specsArray.find((s) => String(s?.name || "").toLowerCase().includes("fabric"))?.description ||
    specsArray.find((s) => String(s?.name || "").toLowerCase().includes("material"))?.description ||
    null;
  const washSpec =
    specsArray.find((s) => String(s?.name || "").toLowerCase().includes("wash"))?.description ||
    specsArray.find((s) => String(s?.name || "").toLowerCase().includes("care"))?.description ||
    null;

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    sku: String(apiProduct.id),
    brand: apiProduct.brand?.name || apiProduct.brand_name || "ASIATIC",
    category_name: apiProduct.category?.name || apiProduct.category_name || "",
    retails_price: mrp,
    price: finalPrice,
    discount: apiProduct.discount || 0,
    discountLabel,
    saleRule,
    image_paths: images,
    color: [apiProduct.color || "Default"],
    color_code: apiProduct.color_code || "#1A1A1A",
    product_variants: apiProduct.product_variants || [],
    variants: variantMap,
    unavailableSizes,
    specifications: specsArray,
    description: resolvedDescription,
    short_description: decodeAndNormalizeHtml(apiProduct.short_description || ""),
    materialCare: {
      material: materialSpec,
      wash: washSpec,
    },
    manufacturerDetails: apiProduct.manufacturer_details || null,
    packerDetails: apiProduct.packer_details || null,
    importerDetails: apiProduct.importer_details || null,
    sellerDetails: apiProduct.seller_details || null,
    countryOfOrigin: apiProduct.country_of_origin || apiProduct.country || null,
    size_chart_category: apiProduct.size_chart_category || null,
    current_stock: apiProduct.current_stock || 0,
    isOutOfStock: apiProduct.current_stock === 0,
  };
}
