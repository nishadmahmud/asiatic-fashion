"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user, openAuthDrawer } = useAuth();
  const { wishlist } = useWishlist();
  const { getCartCount, toggleCart } = useCart();

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: "Wishlist",
      href: "/wishlist",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
      badge: wishlist.length,
    },
    {
      label: "Cart",
      onClick: toggleCart,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
      badge: getCartCount(),
    },
    {
      label: "Profile",
      href: user ? "/profile" : null,
      onClick: user ? null : () => openAuthDrawer("login"),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-[#E5E5E5] px-6 h-16 safe-area-inset-bottom">
      <nav className="flex items-center justify-between h-full max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const content = (
            <div className="relative flex flex-col items-center gap-1">
              <div className={`${isActive ? "text-[#1A1A1A]" : "text-[#999999]"} transition-colors`}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-bold tracking-widest uppercase ${isActive ? "text-[#1A1A1A]" : "text-[#999999]"} transition-colors`}>
                {item.label}
              </span>
              {item.badge > 0 && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-[#1A1A1A] text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              )}
            </div>
          );

          if (item.href) {
            return (
              <Link key={item.label} href={item.href} className="flex-1 flex justify-center py-2">
                {content}
              </Link>
            );
          }

          return (
            <button key={item.label} onClick={item.onClick} className="flex-1 flex justify-center py-2 outline-none">
              {content}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
