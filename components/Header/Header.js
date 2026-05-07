"use client";

import { useState } from "react";
import Image from "next/image";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navCategories = ["Men", "Women", "Children", "Brands"];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5]">
      {/* Top Bar */}
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
            id="menu-toggle"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>

          {/* Logo */}
          <a href="/" className="flex items-center">
            <Image
              src="/asiatic_fashion_logo.png"
              alt="Asiatic Fashion Logo"
              width={160}
              height={40}
              unoptimized
              priority
              className="w-auto h-8 md:h-9 object-contain"
            />
          </a>

          {/* Right Nav (Desktop) */}
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#6B6B6B]">
              <a
                href="#"
                className="hover:text-[#1A1A1A] transition-colors relative group"
              >
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#E8611A] group-hover:w-full transition-all duration-300" />
              </a>
              <a
                href="#"
                className="hover:text-[#1A1A1A] transition-colors relative group"
              >
                FAQs
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#E8611A] group-hover:w-full transition-all duration-300" />
              </a>
            </nav>

            {/* Search Icon (Mobile) */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
              aria-label="Search"
              id="search-toggle-mobile"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>

            {/* Cart Icon */}
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
              aria-label="Cart"
              id="cart-button"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#E8611A] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                0
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub Navigation (Desktop) */}
      <div className="hidden md:block border-t border-[#E5E5E5]">
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex items-center gap-4 h-12">
            {/* Dropdowns */}
            <div className="flex items-center gap-1 text-sm text-[#6B6B6B] cursor-pointer hover:text-[#1A1A1A] transition-colors">
              <span>Categories</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            <div className="flex items-center gap-1 text-sm text-[#6B6B6B] cursor-pointer hover:text-[#1A1A1A] transition-colors">
              <span>New Product</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-xs relative">
              <input
                type="text"
                placeholder="Search"
                className="w-full h-8 pl-3 pr-9 text-sm bg-gray-50 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8611A]/20 focus:border-[#E8611A] transition-all"
                id="desktop-search"
              />
              <svg
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#999999]"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 ml-auto">
              {navCategories.map((cat) => (
                <button
                  key={cat}
                  className="px-4 py-1.5 text-sm font-medium border border-[#E5E5E5] rounded-full hover:bg-[#E8611A] hover:text-white hover:border-[#E8611A] transition-all duration-300"
                  id={`nav-pill-${cat.toLowerCase()}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {searchOpen && (
        <div className="md:hidden border-t border-[#E5E5E5] p-3 animate-fade-in-up">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full h-10 pl-4 pr-10 text-sm bg-gray-50 border border-[#E5E5E5] rounded-full focus:outline-none focus:ring-2 focus:ring-[#E8611A]/20 focus:border-[#E8611A] transition-all"
              autoFocus
              id="mobile-search"
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999]"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 w-72 h-full bg-white z-50 shadow-2xl md:hidden animate-slide-in-left">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <span className="font-semibold text-lg">Asiatic Fashion</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <nav className="space-y-1">
                {["Categories", "New Products", ...navCategories, "About", "FAQs"].map(
                  (item, i) => (
                    <a
                      key={item}
                      href="#"
                      className="flex items-center justify-between px-3 py-3 text-sm font-medium text-[#1A1A1A] hover:bg-[#E8611A]-light rounded-lg transition-colors"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      {item}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </a>
                  )
                )}
              </nav>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
