"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { trackOrder } from "@/lib/api";
import { Search, MapPin, Truck, CheckCircle2, ClipboardList, PackageCheck } from "lucide-react";

export default function TrackOrderPage() {
  const { user } = useAuth();
  const [invoiceId, setInvoiceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderData, setOrderData] = useState(null);

  const normalizePhone = (phone) => {
    if (!phone) return "";
    let digits = String(phone).replace(/\D/g, "");
    if (digits.startsWith("880")) digits = digits.slice(2);
    else if (digits.startsWith("88") && digits.length > 11) digits = digits.slice(2);
    if (digits.length === 10) digits = `0${digits}`;
    return digits;
  };

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
        const foundOrder = response.data.data[0];
        const orderPhone = normalizePhone(foundOrder.delivery_customer_phone || foundOrder.customer_phone);
        const userPhone = normalizePhone(user?.mobile_number || user?.phone);

        if (!orderPhone || !userPhone || orderPhone !== userPhone) {
          setError("Sorry, we cannot verify this order with your account details.");
        } else {
          setOrderData(foundOrder);
        }
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

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-lg font-bold tracking-widest uppercase text-[#1A1A1A] mb-8 border-b border-[#E5E5E5] pb-4">
        Track Your Order
      </h2>

      <div className="bg-[#F8F8F6] border border-[#E5E5E5] p-6 mb-10">
        <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999999] mb-2">Invoice ID</label>
            <input 
              type="text" 
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="e.g. INV-12345"
              className="w-full h-12 border border-[#E5E5E5] bg-white px-4 text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors"
            />
          </div>
          <div className="md:self-end">
            <button 
              type="submit" 
              disabled={loading}
              className="h-12 w-full md:w-auto px-8 bg-[#1A1A1A] text-white text-xs font-bold tracking-widest uppercase hover:bg-[#333] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {loading ? "Tracking..." : "Track Order"}
            </button>
          </div>
        </form>
        {error && (
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-red-600">{error}</p>
        )}
      </div>

      {orderData && (
        <div className="border border-[#E5E5E5] bg-white p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-10 border-b border-[#E5E5E5] pb-6">
            <div>
              <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest mb-1">Order Summary</p>
              <h3 className="text-xl font-bold text-[#1A1A1A]">#{orderData.invoice_id}</h3>
            </div>
            <div className="text-right">
              <span className="inline-block px-4 py-2 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-widest">
                ৳ {Number(orderData.payable_amount || orderData.grand_total).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative mb-12">
            <div className="absolute left-0 right-0 top-6 h-0.5 bg-[#E5E5E5]" />
            <div 
              className="absolute left-0 top-6 h-0.5 bg-[#1A1A1A] transition-all duration-1000"
              style={{ width: `${((Math.min(getStatusNumber(orderData.status), 4) - 1) / 3) * 100}%` }}
            />
            
            <div className="flex justify-between relative z-10">
              {timelineStages.map((stage) => {
                const status = getStatusNumber(orderData.status);
                const isCompleted = status >= stage.id;
                const isCurrent = status === stage.id;
                const Icon = stage.icon;

                return (
                  <div key={stage.id} className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted 
                        ? "bg-[#1A1A1A] text-white border-2 border-[#1A1A1A]" 
                        : "bg-white border-2 border-[#E5E5E5] text-[#999999]"
                    } ${isCurrent ? "ring-4 ring-[#E5E5E5]" : ""}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className={`mt-4 text-[10px] uppercase tracking-widest font-bold text-center w-24 ${
                      isCompleted ? "text-[#1A1A1A]" : "text-[#999999]"
                    }`}>
                      {stage.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#F8F8F6] p-6 border border-[#E5E5E5]">
            <div>
              <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest mb-3 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Delivery Address
              </p>
              <p className="text-sm font-medium text-[#1A1A1A]">{orderData.delivery_customer_name || orderData.customer_name}</p>
              <p className="text-sm text-[#6B6B6B] mt-1">{orderData.delivery_address || orderData.customer_address}</p>
              <p className="text-sm text-[#6B6B6B] mt-1">{orderData.delivery_customer_phone || orderData.customer_phone}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest mb-3">Shipping Info</p>
              <p className="text-sm text-[#6B6B6B]"><span className="text-[#1A1A1A] font-medium">Method:</span> Home Delivery</p>
              <p className="text-sm text-[#6B6B6B] mt-1"><span className="text-[#1A1A1A] font-medium">Charge:</span> ৳ {orderData.shipping_charge || 0}</p>
              {orderData.courier_name && (
                <p className="text-sm text-[#6B6B6B] mt-1"><span className="text-[#1A1A1A] font-medium">Courier:</span> {orderData.courier_name}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
