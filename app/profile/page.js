"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { ArrowRight, Package, Heart, RefreshCcw } from "lucide-react";

export default function ProfileDashboard() {
  const { user } = useAuth();

  const QUICK_LINKS = [
    { label: "Order History", href: "/profile/orders", icon: Package, desc: "Track, return, or view orders" },
    { label: "Wishlist", href: "/profile/wishlist", icon: Heart, desc: "View your saved items" },
    { label: "Returns", href: "/profile/returns", icon: RefreshCcw, desc: "Manage your refunds" },
  ];

  if (!user) return null;

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-lg font-bold tracking-widest uppercase text-[#1A1A1A] mb-8 border-b border-[#E5E5E5] pb-4">
        Dashboard Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {QUICK_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="p-6 border border-[#E5E5E5] hover:border-[#1A1A1A] transition-colors group flex flex-col items-start bg-[#F8F8F6] hover:bg-white"
            >
              <Icon className="w-6 h-6 text-[#1A1A1A] mb-4" />
              <h3 className="text-xs font-bold tracking-widest uppercase text-[#1A1A1A] mb-2">{item.label}</h3>
              <p className="text-[11px] text-[#6B6B6B] leading-relaxed mb-4 flex-1">{item.desc}</p>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] flex items-center gap-1 group-hover:gap-2 transition-all">
                View <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Profile Summary */}
        <div>
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-6">Account Details</h3>
          <div className="space-y-4 text-sm text-[#6B6B6B]">
            <div className="grid grid-cols-3 gap-4 pb-4 border-b border-[#E5E5E5]">
              <span className="font-medium text-[#1A1A1A]">Name</span>
              <span className="col-span-2">{user.first_name} {user.last_name}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 pb-4 border-b border-[#E5E5E5]">
              <span className="font-medium text-[#1A1A1A]">Email</span>
              <span className="col-span-2 truncate">{user.email}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 pb-4 border-b border-[#E5E5E5]">
              <span className="font-medium text-[#1A1A1A]">Phone</span>
              <span className="col-span-2">{user.mobile_number || user.phone || 'Not provided'}</span>
            </div>
          </div>
          <Link 
            href="/profile/settings"
            className="inline-block mt-6 text-xs font-bold uppercase tracking-widest text-[#1A1A1A] border-b border-[#1A1A1A] pb-1 hover:text-[#6B6B6B] hover:border-[#6B6B6B] transition-colors"
          >
            Edit Profile
          </Link>
        </div>

        {/* Primary Address */}
        <div>
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-6">Default Address</h3>
          {user.address ? (
            <div className="text-sm text-[#6B6B6B] leading-relaxed bg-[#F8F8F6] p-6 border border-[#E5E5E5]">
              <p className="font-medium text-[#1A1A1A] mb-2">{user.first_name} {user.last_name}</p>
              <p>{user.address}</p>
              <p className="mt-4">{user.mobile_number || user.phone}</p>
            </div>
          ) : (
            <div className="text-sm text-[#999999] bg-[#F8F8F6] p-6 border border-[#E5E5E5] border-dashed text-center">
              No default address saved.
            </div>
          )}
          <Link 
            href="/profile/settings"
            className="inline-block mt-6 text-xs font-bold uppercase tracking-widest text-[#1A1A1A] border-b border-[#1A1A1A] pb-1 hover:text-[#6B6B6B] hover:border-[#6B6B6B] transition-colors"
          >
            Manage Addresses
          </Link>
        </div>
      </div>
    </div>
  );
}
