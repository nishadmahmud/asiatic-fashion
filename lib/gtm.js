export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-W78N2J4W";

const isClient = () => typeof window !== "undefined";

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeItem = (item = {}) => {
    const rawId = item.id ?? item.product_id ?? item.productId ?? item.code ?? null;
    const rawPrice = item.price ?? item.unit_price ?? item.final_price ?? item.mrp ?? 0;
    const rawQty = item.quantity ?? item.qty ?? 1;

    return {
        item_id: rawId ? String(rawId) : "unknown",
        item_name: item.name || item.title || "Unknown Product",
        item_brand: item.brand || item.brand_name || item.brands?.name || undefined,
        item_variant: item.selectedSize || item.size || undefined,
        item_category: item.category || item.category_name || undefined,
        price: toNumber(rawPrice, 0),
        quantity: Math.max(1, toNumber(rawQty, 1)),
    };
};

export const pushToDataLayer = (payload = {}) => {
    if (!isClient()) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
};

export const trackPageView = ({ page_path, page_title, page_location } = {}) => {
    pushToDataLayer({
        event: "page_view",
        page_path,
        page_title,
        page_location,
    });
};

export const trackViewItem = ({ product, currency = "BDT" } = {}) => {
    if (!product) return;
    const value = toNumber(product.price ?? product.final_price ?? product.mrp, 0);
    const item = normalizeItem({
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: value,
        quantity: 1,
        size: product.selectedSize,
    });

    pushToDataLayer({ ecommerce: null });
    pushToDataLayer({
        event: "view_item",
        ecommerce: {
            currency,
            value,
            items: [item],
        },
    });
};

export const trackAddToCart = ({ product, quantity = 1, size, currency = "BDT" } = {}) => {
    if (!product) return;
    const price = toNumber(product.price ?? product.final_price ?? product.mrp, 0);
    const qty = Math.max(1, toNumber(quantity, 1));
    const item = normalizeItem({
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        price,
        quantity: qty,
        size: size || product.selectedSize || product.size,
    });

    pushToDataLayer({ ecommerce: null });
    pushToDataLayer({
        event: "add_to_cart",
        ecommerce: {
            currency,
            value: price * qty,
            items: [item],
        },
    });
};

export const trackBeginCheckout = ({ items = [], currency = "BDT", coupon } = {}) => {
    if (!Array.isArray(items) || items.length === 0) return;
    const normalizedItems = items.map((item) => normalizeItem(item));
    const value = normalizedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    pushToDataLayer({ ecommerce: null });
    pushToDataLayer({
        event: "begin_checkout",
        ecommerce: {
            currency,
            value,
            coupon: coupon || undefined,
            items: normalizedItems,
        },
    });
};

export const trackPurchase = ({
    transactionId,
    items = [],
    value = 0,
    tax = 0,
    shipping = 0,
    discount = 0,
    coupon,
    currency = "BDT",
    userData = {},
    orderMeta = {},
} = {}) => {
    if (!transactionId || !Array.isArray(items) || items.length === 0) return;

    const normalizedItems = items.map((item) => normalizeItem(item));

    pushToDataLayer({ ecommerce: null });
    pushToDataLayer({
        event: "purchase",
        user_data: {
            customer_id: userData.customer_id || userData.id || null,
            name: userData.name || null,
            email: userData.email || null,
            phone: userData.phone || userData.mobile_number || null,
            address: userData.address || null,
            city: userData.city || null,
            district: userData.district || null,
            country: userData.country || "BD",
        },
        order_meta: {
            payment_method: orderMeta.payment_method || null,
            status: orderMeta.status || null,
            delivery_city: orderMeta.delivery_city || null,
            delivery_district: orderMeta.delivery_district || null,
        },
        ecommerce: {
            transaction_id: String(transactionId),
            value: toNumber(value, 0),
            tax: toNumber(tax, 0),
            shipping: toNumber(shipping, 0),
            discount: toNumber(discount, 0),
            coupon: coupon || undefined,
            currency,
            items: normalizedItems,
        },
    });
};
