"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getCampaigns } from "@/lib/api";
import { transformProduct, buildCampaignDiscountMap } from "@/lib/transformProduct";
import CampaignOfferListingPage from "@/components/CampaignOfferListingPage/CampaignOfferListingPage";

function isAmountType(t) {
  const s = String(t || "").toLowerCase();
  return s === "amount" || s === "fixed";
}

export default function CampaignOfferDetailClient() {
  const params = useParams();
  const campaignId = params?.id;
  const [campaign, setCampaign] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const breadcrumbs = useMemo(
    () => [
      { label: "Home", href: "/" },
      { label: "Offers", href: "/offers" },
      { label: campaign?.name || "Campaign", href: null },
    ],
    [campaign?.name]
  );

  useEffect(() => {
    if (!campaignId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      setCampaign(null);
      setProducts([]);
      try {
        const res = await getCampaigns();
        if (cancelled) return;
        const list = Array.isArray(res?.campaigns?.data) ? res.campaigns.data : [];
        const found = list.find((c) => String(c.id) === String(campaignId));
        if (!found) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (String(found.status || "").toLowerCase() !== "active") {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setCampaign(found);
        const map = buildCampaignDiscountMap([found]);
        const raw = Array.isArray(found.products) ? found.products : [];
        const transformed = raw.map((p) => transformProduct(p, map));
        if (!cancelled) setProducts(transformed);
      } catch (e) {
        console.error("Campaign offer detail:", e);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const bannerExtra = useMemo(() => {
    if (!campaign) return null;
    const n = Array.isArray(campaign.products) ? campaign.products.length : 0;
    const isAmt = isAmountType(campaign.discount_type);
    const d = Number(campaign.discount || 0);
    const line = isAmt ? `Up to ৳${d.toLocaleString()} off` : `Up to ${d}% off`;
    return (
      <p className="text-xs font-light leading-relaxed text-[#6B6B6B] md:text-[13px]">
        {line}
        {n > 0 ? ` · ${n} ${n === 1 ? "style" : "styles"}` : null}
      </p>
    );
  }, [campaign]);

  if (notFound && !loading) {
    return (
      <CampaignOfferListingPage
        title="Offer not found"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Offers", href: "/offers" },
          { label: "Not found", href: null },
        ]}
        products={[]}
        loading={false}
        emptyMessage="This offer is unavailable or has ended."
      />
    );
  }

  return (
    <CampaignOfferListingPage
      title={campaign?.name || "Offer"}
      breadcrumbs={breadcrumbs}
      bannerExtra={bannerExtra}
      products={products}
      loading={loading}
      emptyMessage="No products are linked to this offer yet."
    />
  );
}
