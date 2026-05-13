"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchProducts } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useCategories } from "@/context/CategoriesContext";
import CategoryNavBar from "@/components/CategoryNavBar/CategoryNavBar";

export default function Header({ initialCategories = [] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedSubcategory, setExpandedSubcategory] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const { user, openAuthDrawer } = useAuth();
  const { wishlist } = useWishlist();
  const { getCartCount, toggleCart } = useCart();
  const { categories, seedCategories } = useCategories();


  // Fetch categories for navigation
  useEffect(() => {
    seedCategories(initialCategories);
  }, [initialCategories, seedCategories]);
  // Search handler with debounce
  useEffect(() => {
    let ignore = false;

    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    const timer = setTimeout(async () => {
      try {
        const response = await searchProducts(searchQuery);
        if (ignore) return;

        if (response.success) {
          const resultsArray = response.data?.data || response.data || [];
          if (Array.isArray(resultsArray)) {
            setSearchResults(resultsArray.slice(0, 6));
          } else {
            setSearchResults([]);
          }
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        if (!ignore) console.error("Search error:", error);
      } finally {
        if (!ignore) setIsSearching(false);
      }
    }, 400);
    
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E5E5] transition-all">
      {/* Top Bar */}
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12">
        <div className="flex items-center justify-between h-[72px]">
          {/* Hamburger (Mobile) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-2 hover:opacity-70 transition-opacity md:hidden"
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="8" x2="20" y2="8" />
                  <line x1="4" y1="16" x2="20" y2="16" />
                </>
              )}
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold tracking-tighter text-[#1A1A1A] uppercase">
              ASIATIC FASHION
            </h1>
          </Link>

          {/* Right Nav */}
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8 text-xs font-bold tracking-widest uppercase text-[#1A1A1A]">
              <Link href="/track-order" className="hover:text-[#999999] transition-colors">
                Track Order
              </Link>
              <Link href="/#new-arrivals" className="hover:text-[#999999] transition-colors">
                New Products
              </Link>
            </nav>

            <div className="flex items-center gap-4 md:border-l md:border-[#E5E5E5] md:pl-6 md:ml-2">
              {/* Search Icon */}
              <button
                onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(""); setSearchResults([]); }}
                className="hover:opacity-70 transition-opacity"
                aria-label="Search"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>

              {/* Wishlist Icon */}
              <Link href="/wishlist" className="hidden md:flex hover:opacity-70 transition-opacity relative" aria-label="Wishlist">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#1A1A1A] text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              </Link>

              {/* Cart Icon */}
              <button onClick={toggleCart} className="hidden md:flex hover:opacity-70 transition-opacity relative" aria-label="Cart">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#1A1A1A] text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {getCartCount()}
                </span>
              </button>

              {/* User Icon */}
              <button 
                onClick={() => user ? router.push('/profile') : openAuthDrawer('login')}
                className="hidden md:flex hover:opacity-70 transition-opacity" 
                aria-label="User Account"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <CategoryNavBar categories={categories} variant="header" />


      {/* Search Bar Dropdown */}
      {searchOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-[#E5E5E5] py-4 shadow-xl z-40">
          <div className="max-w-[1600px] mx-auto px-4 md:px-12 relative">
            <input
              type="text"
              placeholder="SEARCH PRODUCTS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 border-b border-[#1A1A1A] bg-transparent text-sm tracking-widest uppercase text-[#1A1A1A] placeholder-[#999999] focus:outline-none"
              autoFocus
            />
            <button className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2" onClick={() => setSearchOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          {/* Search Loading State */}
          {isSearching && (
            <div className="max-w-[1600px] mx-auto px-4 md:px-12 mt-6 flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5 text-[#1A1A1A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-xs font-bold tracking-widest uppercase text-[#1A1A1A]">SEARCHING...</p>
            </div>
          )}

          {/* Search Empty State */}
          {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="max-w-[1600px] mx-auto px-4 md:px-12 mt-6 flex justify-center">
              <p className="text-xs font-bold tracking-widest uppercase text-[#999999]">NO PRODUCTS FOUND</p>
            </div>
          )}

          {/* Search Results */}
          {!isSearching && searchResults.length > 0 && (
            <div className="max-w-[1600px] mx-auto px-4 md:px-12 mt-4 space-y-3 max-h-[400px] overflow-y-auto">
              {searchResults.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  className="flex items-center gap-4 p-3 hover:bg-[#F8F8F6] transition-colors"
                >
                  <div className="w-14 h-14 bg-[#F8F8F6] relative shrink-0 overflow-hidden">
                    <Image
                      src={product.image_paths?.[0] || product.image_path || ""}
                      alt={product.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1A1A1A] truncate">{product.name}</p>
                    <p className="text-xs text-[#999999]">৳{Number(product.retails_price || 0).toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <div className="relative w-[85%] max-w-[320px] h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#F0F0F0] flex items-center justify-between bg-white sticky top-0 z-10">
              <h1 className="text-sm font-black tracking-tighter text-[#1A1A1A] uppercase">
                ASIATIC FASHION
              </h1>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F8F8F6] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-white">
              {/* Auth Section */}
              <div className="p-6 bg-[#F8F8F6] border-b border-[#F0F0F0]">
                {user ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-lg font-bold">
                        {user.name?.[0] || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1A1A1A] truncate">{user.name}</p>
                        <p className="text-[10px] text-[#999999] truncate uppercase tracking-widest">{user.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link 
                        href="/profile" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center h-9 bg-white border border-[#E5E5E5] text-[10px] font-bold tracking-widest uppercase text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-all"
                      >
                        Profile
                      </Link>
                      <button 
                        onClick={() => { useAuth().logout(); setMobileMenuOpen(false); }}
                        className="flex items-center justify-center h-9 bg-white border border-[#E5E5E5] text-[10px] font-bold tracking-widest uppercase text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-[#999999] mb-1">Account</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { openAuthDrawer('login'); setMobileMenuOpen(false); }}
                        className="flex-1 h-10 bg-[#1A1A1A] text-white text-[10px] font-bold tracking-widest uppercase transition-opacity hover:opacity-90"
                      >
                        Log In
                      </button>
                      <button 
                        onClick={() => { openAuthDrawer('register'); setMobileMenuOpen(false); }}
                        className="flex-1 h-10 border border-[#1A1A1A] text-[#1A1A1A] text-[10px] font-bold tracking-widest uppercase hover:bg-[#1A1A1A] hover:text-white transition-all"
                      >
                        Sign Up
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Categories */}
              <div className="px-6 py-4">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#999999] mb-4">Categories</p>
                <div className="grid grid-cols-1 gap-2">
                  {categories.map((cat) => {
                    const subcategories = Array.isArray(cat.sub_category) ? cat.sub_category : [];
                    const hasSubcategories = subcategories.length > 0;
                    const isCategoryExpanded = String(expandedCategory) === String(cat.category_id);

                    return (
                      <div key={cat.category_id} className="rounded-sm bg-[#F8F8F6]">
                        <div className="flex items-center justify-between px-3 py-2.5">
                          <Link
                            href={`/category/${cat.category_id}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="min-w-0 flex-1"
                          >
                            <span className="block truncate text-[11px] font-bold tracking-widest uppercase text-[#1A1A1A]">
                              {cat.name}
                            </span>
                          </Link>

                          {hasSubcategories && (
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedCategory((prev) =>
                                  String(prev) === String(cat.category_id) ? null : cat.category_id
                                );
                                setExpandedSubcategory(null);
                              }}
                              className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center text-[#1A1A1A]"
                              aria-label={`Toggle ${cat.name} subcategories`}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className={`transition-transform ${isCategoryExpanded ? "rotate-90" : ""}`}
                              >
                                <path d="m9 18 6-6-6-6" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {hasSubcategories && isCategoryExpanded && (
                          <div className="border-t border-[#E5E5E5] px-3 py-2 space-y-1">
                            {subcategories.map((sub) => {
                              const children = Array.isArray(sub.child_categories) ? sub.child_categories : [];
                              const hasChildren = children.length > 0;
                              const subKey = `${cat.category_id}-${sub.id}`;
                              const isSubExpanded = expandedSubcategory === subKey;

                              return (
                                <div key={sub.id}>
                                  <div className="flex items-center justify-between py-1.5">
                                    <Link
                                      href={`/category/${cat.category_id}?subcategory=${sub.id}`}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="min-w-0 flex-1"
                                    >
                                      <span className="block truncate text-[10px] font-bold tracking-wide uppercase text-[#1A1A1A]">
                                        {sub.name}
                                      </span>
                                    </Link>

                                    {hasChildren && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedSubcategory((prev) => (prev === subKey ? null : subKey))
                                        }
                                        className="ml-3 flex h-5 w-5 shrink-0 items-center justify-center text-[#6B6B6B]"
                                        aria-label={`Toggle ${sub.name} child categories`}
                                      >
                                        <svg
                                          width="10"
                                          height="10"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          className={`transition-transform ${isSubExpanded ? "rotate-90" : ""}`}
                                        >
                                          <path d="m9 18 6-6-6-6" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>

                                  {hasChildren && isSubExpanded && (
                                    <div className="pl-3 pb-1 space-y-1">
                                      {children.map((child) => (
                                        <Link
                                          key={child.id}
                                          href={`/category/${cat.category_id}?subcategory=${sub.id}&child=${child.id}`}
                                          onClick={() => setMobileMenuOpen(false)}
                                          className="block py-1"
                                        >
                                          <span className="text-[10px] uppercase tracking-wide text-[#6B6B6B]">
                                            {child.name}
                                          </span>
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Main Navigation */}
              <div className="px-6 py-4 border-t border-[#F0F0F0] space-y-1">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#999999] mb-4">Shop & Explore</p>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 group"
                >
                  <span className="text-xs font-bold tracking-widest uppercase text-[#1A1A1A] group-hover:translate-x-1 transition-transform">Home</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
                <Link
                  href="/track-order"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 group"
                >
                  <span className="text-xs font-bold tracking-widest uppercase text-[#1A1A1A] group-hover:translate-x-1 transition-transform">Track Order</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
                <Link
                  href="/#new-arrivals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 group"
                >
                  <span className="text-xs font-bold tracking-widest uppercase text-[#1A1A1A] group-hover:translate-x-1 transition-transform">New Arrivals</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
              </div>

              {/* Company Info */}
              <div className="px-6 py-6 bg-[#F8F8F6]/50 border-t border-[#F0F0F0]">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#999999] mb-4">Company</p>
                <div className="flex flex-col gap-4">
                  <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Contact Us</Link>
                  <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">FAQs</Link>
                  <Link href="/shipping" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Shipping & Delivery</Link>
                  <Link href="/returns" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Returns & Exchanges</Link>
                  <Link href="/privacy-policy" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Privacy Policy</Link>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-[#F0F0F0] bg-white">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#999999]">© 2024 ASIATIC</p>
                <div className="flex gap-4">
                  <a href="#" className="text-[#1A1A1A] hover:opacity-60 transition-opacity"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
                  <a href="#" className="text-[#1A1A1A] hover:opacity-60 transition-opacity"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
