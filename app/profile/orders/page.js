"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getCustomerOrders } from "@/lib/api";
import { ArrowRight, Package, Truck, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";

const ORDER_TABS = [
  { id: "1", label: "Processing", Icon: Package },
  { id: "2", label: "Confirmed", Icon: CheckCircle2 },
  { id: "3", label: "Shipping", Icon: Truck },
  { id: "4", label: "Delivered", Icon: CheckCircle2 },
  { id: "5", label: "Canceled", Icon: XCircle },
];

export default function OrdersPage() {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("1");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const toggleOrder = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !token) return;
      setLoading(true);
      try {
        const customerId = user.id || user.customer_id;
        const res = await getCustomerOrders(token, customerId, activeTab);
        if (res.success) {
          const data = res.data?.data || res.data || [];
          setOrders(Array.isArray(data) ? data : []);
        } else {
          setOrders([]);
          if (String(res.message).toLowerCase().includes("unauthenticated")) {
            logout();
          }
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, token, activeTab, logout]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusLabel = (status) => {
    switch (Number(status)) {
        case 1: return "Processing";
        case 2: return "Confirmed";
        case 3: return "Shipping";
        case 4: return "Delivered";
        case 5: return "Canceled";
        case 6: return "On Hold";
        default: return "Pending";
    }
  };

  const getOrderTotal = (order) => {
    let amount = Number(order.payable_amount || order.grand_total || 0);
    if (amount > 0) return amount;
    
    const subTotal = Number(order.sub_total || 0);
    const shipping = Number(order.shipping_charge || order.shipping || 0);
    const discount = Number(order.discount || 0);
    
    amount = subTotal + shipping - discount;
    return amount > 0 ? amount : 0;
  };

  const formatPrice = (price) => `৳ ${Number(price || 0).toLocaleString()}`;

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-lg font-bold tracking-widest uppercase text-[#1A1A1A] mb-8 border-b border-[#E5E5E5] pb-4">
        Order History
      </h2>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-[#E5E5E5] pb-4">
        {ORDER_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold tracking-widest uppercase transition-colors border ${
                isActive 
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" 
                  : "bg-white text-[#6B6B6B] border-[#E5E5E5] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#999999]">
          <div className="w-6 h-6 border-2 border-[#E5E5E5] border-t-[#1A1A1A] rounded-full animate-spin mb-4"></div>
          <span className="text-xs font-bold uppercase tracking-widest">Loading Orders...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-[#F8F8F6] border border-[#E5E5E5] border-dashed">
          <Package className="w-8 h-8 text-[#999999] mx-auto mb-4" />
          <p className="text-sm text-[#6B6B6B] mb-2">No orders found in this category.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A] hover:underline underline-offset-4 mt-4"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border border-[#E5E5E5] bg-white hover:border-[#1A1A1A] transition-colors">
              {/* Order Header */}
              <div className="p-5 border-b border-[#E5E5E5] bg-[#F8F8F6] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest mb-1">Order Number</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">#{order.invoice_id || order.id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest mb-1">Date</p>
                  <p className="text-sm text-[#6B6B6B]">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest mb-1">Total Amount</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">{formatPrice(getOrderTotal(order))}</p>
                </div>
              </div>

              {/* Order Body / Items summary */}
              <div 
                className="p-5 flex items-center justify-between cursor-pointer"
                onClick={() => toggleOrder(order.id)}
              >
                <div className="text-sm text-[#6B6B6B]">
                  {order.sales_details ? (
                    <p>{order.sales_details.length} item(s) in this order</p>
                  ) : (
                    <p>Order details loading...</p>
                  )}
                </div>
                
                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1A1A1A] hover:opacity-70 transition-opacity">
                  View Details 
                  {expandedOrder === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Expanded Details */}
              {expandedOrder === order.id && order.sales_details && (
                <div className="p-5 border-t border-[#E5E5E5] bg-white animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-4">
                    {order.sales_details.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 border border-[#E5E5E5] p-3">
                        <div className="w-16 h-20 bg-[#F8F8F6] relative shrink-0">
                          {item.product_info?.image_path ? (
                            <Image 
                              src={item.product_info.image_path}
                              alt={item.product_info?.name || "Product"}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-[#999]">No Image</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A] mb-1">
                            {item.product_info?.name || "Unknown Product"}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6B6B6B]">
                            {item.color_name && <p>Color: {item.color_name}</p>}
                            {item.size_name && <p>Size: {item.size_name}</p>}
                            <p>Qty: {item.qty}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-[#1A1A1A]">{formatPrice(item.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-[#E5E5E5] flex justify-end">
                    <div className="w-full md:w-1/2 space-y-2 text-sm">
                      <div className="flex justify-between text-[#6B6B6B]">
                        <span>Subtotal</span>
                        <span>{formatPrice(order.sub_total)}</span>
                      </div>
                      <div className="flex justify-between text-[#6B6B6B]">
                        <span>Shipping</span>
                        <span>{formatPrice(order.shipping_charge || 0)}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Discount</span>
                          <span>-{formatPrice(order.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-[#1A1A1A] pt-2 border-t border-[#E5E5E5] mt-2">
                        <span>Total</span>
                        <span>{formatPrice(getOrderTotal(order))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
