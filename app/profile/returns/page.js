"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getCustomerRefunds } from "@/lib/api";
import { RefreshCcw, Package } from "lucide-react";

export default function ReturnsPage() {
  const { user, token, logout } = useAuth();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRefunds = async () => {
      if (!user || !token) return;
      setLoading(true);
      try {
        const customerId = user.id || user.customer_id;
        const res = await getCustomerRefunds(token, customerId);
        
        if (res.success) {
          const data = res.data?.data || res.data || [];
          setRefunds(Array.isArray(data) ? data : []);
        } else {
          setRefunds([]);
          if (String(res.message).toLowerCase().includes("unauthenticated")) {
            logout();
          }
        }
      } catch (error) {
        console.error("Failed to fetch refunds:", error);
        setRefunds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRefunds();
  }, [user, token, logout]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatPrice = (price) => `৳ ${Number(price || 0).toLocaleString()}`;

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-lg font-bold tracking-widest uppercase text-[#1A1A1A] mb-8 border-b border-[#E5E5E5] pb-4">
        Returns & Refunds
      </h2>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#999999]">
          <div className="w-6 h-6 border-2 border-[#E5E5E5] border-t-[#1A1A1A] rounded-full animate-spin mb-4"></div>
          <span className="text-xs font-bold uppercase tracking-widest">Loading Records...</span>
        </div>
      ) : refunds.length === 0 ? (
        <div className="text-center py-20 bg-[#F8F8F6] border border-[#E5E5E5] border-dashed">
          <RefreshCcw className="w-8 h-8 text-[#999999] mx-auto mb-4" />
          <p className="text-sm text-[#6B6B6B]">You have no active returns or refund requests.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {refunds.map((refund) => (
            <div key={refund.id} className="border border-[#E5E5E5] bg-white">
              <div className="p-5 border-b border-[#E5E5E5] bg-[#F8F8F6] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest mb-1">Refund ID</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">#{refund.id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest mb-1">Order Ref</p>
                  <p className="text-sm text-[#6B6B6B]">#{refund.order_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest mb-1">Date Requested</p>
                  <p className="text-sm text-[#6B6B6B]">{formatDate(refund.created_at)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest mb-1">Refund Amount</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">{formatPrice(refund.amount || refund.total_amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-white text-[10px] font-bold uppercase tracking-widest ${
                    String(refund.status).toLowerCase() === 'approved' ? 'bg-green-600' :
                    String(refund.status).toLowerCase() === 'rejected' ? 'bg-red-600' :
                    'bg-[#1A1A1A]'
                  }`}>
                    {refund.status || 'Pending'}
                  </span>
                </div>
              </div>
              
              {refund.reason && (
                <div className="p-5 text-sm text-[#6B6B6B]">
                  <p className="font-medium text-[#1A1A1A] mb-1">Reason for Return:</p>
                  <p>{refund.reason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
