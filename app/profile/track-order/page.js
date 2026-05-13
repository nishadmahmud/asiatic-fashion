"use client";

import { useState } from "react";
import Image from "next/image";
import { trackOrder } from "@/lib/api";
import { Search, MapPin, Truck, CheckCircle2, ClipboardList, PackageCheck, Package } from "lucide-react";

export default function TrackOrderPage() {
  const [invoiceId, setInvoiceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderData, setOrderData] = useState(null);

  const TAKA_SYMBOL = "\u09F3";

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!invoiceId.trim()) {
      setError("Please enter a valid Invoice ID.");
      return;
    }

    setLoading(true);
    setError("");
    setOrderData(null);

    try {
      const response = await trackOrder({ invoice_id: invoiceId });
      if (response.success && response.data?.data && response.data.data.length > 0) {
        setOrderData(response.data.data[0]);
      } else {
        setError("Order not found. Please check your Invoice ID.");
      }
    } catch (err) {
      console.error("Tracking Error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusNumber = (statusStr) => Number(statusStr) || 1;

  const timelineStages = [
    { id: 1, label: "Order Received", icon: ClipboardList },
    { id: 2, label: "Order Confirmed", icon: PackageCheck },
    { id: 3, label: "Delivery Processing", icon: Truck },
    { id: 4, label: "Order Delivered", icon: CheckCircle2 },
  ];

  const orderItems = orderData?.sales_details || [];
  const orderSubtotalAmount = Number(orderData?.sub_total || 0);
  const orderDeliveryAmount = Number(orderData?.delivery_fee ?? orderData?.shipping_charge ?? 0);
  const orderDiscountAmount = Number(orderData?.discount || 0);
  const orderDonationAmount = Math.max(0, Number(orderData?.donation_amount ?? orderData?.donation ?? 0));
  const orderTotalAmount = Number(
    orderData?.payable_amount ||
      orderData?.grand_total ||
      orderSubtotalAmount + orderDeliveryAmount - orderDiscountAmount + orderDonationAmount
  );

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="mb-8 border-b border-[#E5E5E5] pb-4 text-lg font-bold uppercase tracking-widest text-[#1A1A1A]">
        Track Your Order
      </h2>

      <div className="mb-10 border border-[#E5E5E5] bg-[#F8F8F6] p-6">
        <form onSubmit={handleTrack} className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#999999]">Invoice ID</label>
            <input
              type="text"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="e.g. INV-12345"
              className="h-12 w-full border border-[#E5E5E5] bg-white px-4 text-sm transition-colors focus:border-[#1A1A1A] focus:outline-none"
            />
          </div>
          <div className="md:self-end">
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 bg-[#1A1A1A] px-8 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#333] disabled:opacity-50 md:w-auto"
            >
              <Search className="h-4 w-4" />
              {loading ? "Tracking..." : "Track Order"}
            </button>
          </div>
        </form>
        {error && <p className="mt-4 text-xs font-bold uppercase tracking-wide text-red-600">{error}</p>}
      </div>

      {orderData && (
        <div className="border border-[#E5E5E5] bg-white p-4 md:p-8">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#999999]">Order Summary</p>
              <h3 className="break-all text-lg font-bold text-[#1A1A1A] md:text-xl">#{orderData.invoice_id}</h3>
            </div>
            <div className="text-right">
              <span className="inline-block bg-[#1A1A1A] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">
                {TAKA_SYMBOL} {orderTotalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="relative mb-12 hidden sm:block">
            <div className="absolute left-0 right-0 top-6 h-0.5 bg-[#E5E5E5]" />
            <div
              className="absolute left-0 top-6 h-0.5 bg-[#1A1A1A] transition-all duration-1000"
              style={{ width: `${((Math.min(getStatusNumber(orderData.status || orderData.tran_status), 4) - 1) / 3) * 100}%` }}
            />

            <div className="relative z-10 flex justify-between">
              {timelineStages.map((stage) => {
                const status = getStatusNumber(orderData.status || orderData.tran_status);
                const isCompleted = status >= stage.id;
                const isCurrent = status === stage.id;
                const Icon = stage.icon;

                return (
                  <div key={stage.id} className="flex flex-col items-center">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                        isCompleted
                          ? "border-2 border-[#1A1A1A] bg-[#1A1A1A] text-white"
                          : "border-2 border-[#E5E5E5] bg-white text-[#999999]"
                      } ${isCurrent ? "ring-4 ring-[#E5E5E5]" : ""}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p
                      className={`mt-4 w-24 text-center text-[10px] font-bold uppercase tracking-widest ${
                        isCompleted ? "text-[#1A1A1A]" : "text-[#999999]"
                      }`}
                    >
                      {stage.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-8 space-y-4 sm:hidden">
            {timelineStages.map((stage, index) => {
              const status = getStatusNumber(orderData.status || orderData.tran_status);
              const isCompleted = status >= stage.id;
              const isCurrent = status === stage.id;
              const Icon = stage.icon;
              const isLast = index === timelineStages.length - 1;

              return (
                <div key={stage.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        isCompleted
                          ? "border-2 border-[#1A1A1A] bg-[#1A1A1A] text-white"
                          : "border-2 border-[#E5E5E5] bg-white text-[#999999]"
                      } ${isCurrent ? "ring-2 ring-[#E5E5E5]" : ""}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {!isLast && <div className={`mt-1 h-8 w-0.5 ${isCompleted ? "bg-[#1A1A1A]" : "bg-[#E5E5E5]"}`} />}
                  </div>
                  <p className={`pt-2 text-xs font-bold uppercase tracking-widest ${isCompleted ? "text-[#1A1A1A]" : "text-[#999999]"}`}>
                    {stage.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-8 border border-[#E5E5E5] bg-[#F8F8F6] p-6 md:grid-cols-2">
            <div>
              <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#999999]">
                <MapPin className="h-3 w-3" /> Delivery Address
              </p>
              <p className="text-sm font-medium text-[#1A1A1A]">{orderData.delivery_customer_name || orderData.customer_name}</p>
              <p className="mt-1 text-sm text-[#6B6B6B]">{orderData.delivery_address || orderData.delivery_customer_address || orderData.customer_address}</p>
              <p className="mt-1 text-sm text-[#6B6B6B]">{orderData.delivery_customer_phone || orderData.customer_phone}</p>
            </div>
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#999999]">Shipping Info</p>
              <p className="text-sm text-[#6B6B6B]">
                <span className="font-medium text-[#1A1A1A]">Method:</span> Home Delivery
              </p>
              <p className="mt-1 text-sm text-[#6B6B6B]">
                <span className="font-medium text-[#1A1A1A]">Charge:</span> {TAKA_SYMBOL} {orderDeliveryAmount.toLocaleString()}
              </p>
              {orderData.courier_name && (
                <p className="mt-1 text-sm text-[#6B6B6B]">
                  <span className="font-medium text-[#1A1A1A]">Courier:</span> {orderData.courier_name}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 border border-[#E5E5E5] bg-[#F8F8F6] p-6">
            <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#999999]">Order Items</h4>
            <div className="space-y-3">
              {orderItems.length > 0 ? (
                orderItems.map((item, index) => {
                  const quantity = Number(item?.qty || 0);
                  const unitPrice = Number(item?.price || 0);
                  const lineTotal = unitPrice * quantity;
                  const productName = item?.product_info?.name || item?.product_name || "Product";
                  const imageSrc = item?.product_info?.image_path || item?.image_path || "";

                  return (
                    <div key={`${productName}-${index}`} className="flex items-center gap-4 border border-[#E5E5E5] bg-white p-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-[#E5E5E5] bg-[#F8F8F6]">
                        {imageSrc ? (
                          <Image src={imageSrc} alt={productName} fill unoptimized className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#999999]">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#1A1A1A]">{productName}</p>
                        <p className="mt-1 text-xs text-[#6B6B6B]">
                          Qty: {quantity} {item?.size ? `| Size: ${item.size}` : ""}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-[#1A1A1A]">{TAKA_SYMBOL} {lineTotal.toLocaleString()}</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-[#6B6B6B]">No item details available for this order.</p>
              )}
            </div>

            <div className="mt-6 space-y-2 border-t border-[#E5E5E5] pt-4 text-sm">
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span>Subtotal</span>
                <span>{TAKA_SYMBOL} {orderSubtotalAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span>Delivery</span>
                <span>{TAKA_SYMBOL} {orderDeliveryAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span>Discount</span>
                <span>- {TAKA_SYMBOL} {orderDiscountAmount.toLocaleString()}</span>
              </div>
              {orderDonationAmount > 0 && (
                <div className="flex items-center justify-between text-[#6B6B6B]">
                  <span>Donation</span>
                  <span>{TAKA_SYMBOL} {orderDonationAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-[#E5E5E5] pt-3 font-bold text-[#1A1A1A]">
                <span>Total</span>
                <span>{TAKA_SYMBOL} {orderTotalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
