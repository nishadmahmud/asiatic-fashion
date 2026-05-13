"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

const NAV_LINKS = [
  { label: "Dashboard", href: "/profile" },
  { label: "Order History", href: "/profile/orders" },
  { label: "Track Order", href: "/profile/track-order" },
  { label: "Returns & Refunds", href: "/profile/returns" },
  { label: "Wishlist", href: "/profile/wishlist" },
  { label: "Settings", href: "/profile/settings" },
];

export default function ProfileLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8F8F6] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E5E5E5] border-t-[#1A1A1A] rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold tracking-widest uppercase text-[#999999]">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col">
      <Header />
      
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-12 py-6 md:py-20 flex flex-col md:flex-row gap-6 md:gap-12">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="mb-4 md:mb-8">
            <h1 className="text-xl font-bold tracking-tight uppercase text-[#1A1A1A]">My Account</h1>
            <p className="text-sm text-[#6B6B6B] mt-2">Welcome back, {user.first_name || user.name || "Guest"}</p>
          </div>
          
          <nav className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap px-4 py-3 text-xs font-bold tracking-widest uppercase transition-colors border-l-2 md:whitespace-normal ${
                    isActive 
                      ? "border-[#1A1A1A] bg-white text-[#1A1A1A]" 
                      : "border-transparent text-[#999999] hover:bg-white hover:text-[#1A1A1A]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
              <button
                onClick={logout}
                className="whitespace-nowrap px-4 py-3 text-xs font-bold tracking-widest uppercase text-left transition-colors border-l-2 border-transparent text-[#999999] hover:bg-white hover:text-red-600 md:mt-4"
              >
                Sign Out
              </button>
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 bg-white border border-[#E5E5E5] p-4 md:p-10">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
