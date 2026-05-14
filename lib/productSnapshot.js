/**
 * Client-side PDP cache: instant paint from listing or last full fetch,
 * then background revalidate + write-back (sessionStorage).
 */

const SNAPSHOT_V = 1;

export function pdpSnapshotStorageKey(productId) {
  return `asiatic_pdp_snapshot_${productId}`;
}

function inferSaleRuleFromListing(originalPrice, price, discountLabel) {
  const mrp = Number(originalPrice) || 0;
  const final = Number(price) || 0;
  if (mrp > 0 && final > 0 && final < mrp) {
    const label = String(discountLabel || "");
    const pctMatch = label.match(/(\d+)\s*%/);
    if (pctMatch) {
      return { kind: "percent", value: Number(pctMatch[1]) };
    }
    const fixedMatch = label.match(/৳\s*([\d,]+)/);
    if (fixedMatch) {
      const amt = Number(fixedMatch[1].replace(/,/g, ""));
      if (!Number.isNaN(amt) && amt > 0) return { kind: "fixed", value: amt };
    }
    return { kind: "fixed", value: Math.max(0, mrp - final) };
  }
  return { kind: "none", value: 0 };
}

/**
 * Map ProductCard / listing product into the PDP shape (may omit long HTML until API returns).
 */
export function buildPartialPdpFromListingProduct(product) {
  if (!product?.id) return null;

  const images = (() => {
    if (Array.isArray(product.images) && product.images.length > 0) return product.images;
    if (Array.isArray(product.image_paths) && product.image_paths.length > 0) return product.image_paths;
    if (product.image) return [product.image];
    return ["/placeholder.png"];
  })();

  const price = typeof product.price === "number" ? product.price : 0;
  const originalPrice =
    typeof product.originalPrice === "number" && product.originalPrice > 0
      ? product.originalPrice
      : price;
  const discountLabel = product.discount || "";
  const saleRule = inferSaleRuleFromListing(originalPrice, price, discountLabel);

  const variantMap = {};
  const unavailableSizes = [];
  (product.product_variants || []).forEach((v) => {
    if (!v?.name) return;
    variantMap[v.name] = { ...v, children: v.child_variants || [] };
    if (v.child_variants && v.child_variants.length > 0) {
      if (v.child_variants.every((c) => c.quantity === 0)) unavailableSizes.push(v.name);
    } else if (v.quantity === 0) {
      unavailableSizes.push(v.name);
    }
  });

  const colorSwatch = (product.colors && product.colors[0]) || product.color_code || "#1A1A1A";
  const colorLabel = product.colorName || product.color || "Default";

  return {
    id: product.id,
    name: product.name || "",
    sku: String(product.id),
    brand: product.brand || "ASIATIC",
    category_name: product.category_name || "",
    retails_price: originalPrice,
    price,
    discount: 0,
    discountLabel,
    saleRule,
    image_paths: images,
    color: [colorLabel],
    color_code: colorSwatch,
    product_variants: Array.isArray(product.product_variants) ? product.product_variants : [],
    variants: variantMap,
    unavailableSizes,
    specifications: [],
    description: "",
    short_description: "",
    materialCare: { material: null, wash: null },
    manufacturerDetails: null,
    packerDetails: null,
    importerDetails: null,
    sellerDetails: null,
    countryOfOrigin: null,
    size_chart_category: null,
    current_stock: product.current_stock ?? 0,
    isOutOfStock: product.isOutOfStock === true,
  };
}

export function readPdpSnapshot(productId) {
  if (typeof window === "undefined" || productId == null) return null;
  try {
    const raw = sessionStorage.getItem(pdpSnapshotStorageKey(productId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== SNAPSHOT_V || !parsed.pdp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writePdpSnapshot(productId, pdp, meta = { complete: true }) {
  if (typeof window === "undefined" || productId == null || !pdp) return;
  try {
    const payload = {
      v: SNAPSHOT_V,
      updatedAt: Date.now(),
      meta: { complete: meta.complete !== false },
      pdp: JSON.parse(JSON.stringify(pdp)),
    };
    sessionStorage.setItem(pdpSnapshotStorageKey(productId), JSON.stringify(payload));
  } catch (e) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("writePdpSnapshot failed:", e);
    }
  }
}

/**
 * Before navigating from a listing card: store a partial PDP unless we already have a complete cache for this id.
 */
export function persistListingSnapshotOnNavigate(listingProduct) {
  if (typeof window === "undefined" || listingProduct?.id == null) return;
  try {
    const id = listingProduct.id;
    const existing = readPdpSnapshot(id);
    if (existing?.meta?.complete && String(existing.pdp?.id) === String(id)) {
      return;
    }
    const partial = buildPartialPdpFromListingProduct(listingProduct);
    if (partial) writePdpSnapshot(id, partial, { complete: false });
  } catch (e) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("persistListingSnapshotOnNavigate failed:", e);
    }
  }
}
