"use client";

import { useState } from "react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { trackOrder } from "@/lib/api";
import { Search, MapPin, Truck, CheckCircle2, ClipboardList, PackageCheck } from "lucide-react";

export default function PublicTrackOrderPage() {
  const [invoiceId, setInvoiceId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
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
    if (!invoiceId.trim() || !phoneNumber.trim()) {
      setError("Please enter both Invoice ID and Phone Number.");
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
        const inputPhone = normalizePhone(phoneNumber);

        if (!orderPhone || !inputPhone || orderPhone !== inputPhone) {
          setError("Sorry, the phone number does not match the order records.");
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
    { id: 3, label: "Processing", icon: Truck },
    { id: 4, label: "Delivered", icon: CheckCircle2 },
  ];

  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-white py-16 md:py-24">
        <div className="max-w-[800px] mx-auto px-4 md:px-12">
          <h1 className="text-2xl md:text-3xl font-bold tracking-widest uppercase text-[#1A1A1A] mb-4 text-center">
            Track Order
          </h1>
          <p className="text-xs text-[#999999] tracking-widest uppercase text-center mb-16 border-b border-[#E5E5E5] pb-8">
            Enter your Invoice ID and Phone Number to check your order status.
          </p>

          <div className="bg-[#F8F8F6] border border-[#E5E5E5] p-6 md:p-8 mb-10">
            <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999999] mb-2">Invoice ID</label>
                <input 
                  type="text" 
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  placeholder="e.g. INV-12345"
                  className="w-full h-12 border border-[#E5E5E5] bg-white px-4 text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999999] mb-2">Phone Number</label>
                <input 
                  type="text" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 01712345678"
                  className="w-full h-12 border border-[#E5E5E5] bg-white px-4 text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors"
                />
              </div>
              <div className="w-full md:w-auto">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="h-12 w-full md:w-auto px-8 bg-[#1A1A1A] text-white text-xs font-bold tracking-widest uppercase hover:bg-[#333] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                  {loading ? "Tracking..." : "Track"}
                </button>
              </div>
            </form>
            {error && (
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-red-600">{error}</p>
            )}
          </div>

          {orderData && (
            <div className="border border-[#E5E5E5] bg-white p-6 md:p-8 animate-in fade-in duration-500">
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
              <div className="relative mb-12 hidden sm:block">
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
      </main>
      <Footer />
    </>
  );
}
