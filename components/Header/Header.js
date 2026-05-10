"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCategoriesFromServer, searchProducts } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const router = useRouter();
  const { user, openAuthDrawer } = useAuth();

  // Fetch categories for navigation
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategoriesFromServer();
        if (response.success && response.data) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

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
              <Link href={categories.length > 0 ? `/category/${categories[0].category_id}` : "/category/16167"} className="hover:text-[#999999] transition-colors">
                Categories
              </Link>
              <Link href="/category/16167" className="hover:text-[#999999] transition-colors">
                New Product
              </Link>
            </nav>

            <div className="flex items-center gap-4 border-l border-[#E5E5E5] pl-6 ml-2">
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

              {/* Cart Icon */}
              <button className="hover:opacity-70 transition-opacity relative" aria-label="Cart">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#1A1A1A] text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  0
                </span>
              </button>

              {/* User Icon */}
              <button 
                onClick={() => user ? router.push('/profile') : openAuthDrawer('login')}
                className="hover:opacity-70 transition-opacity" 
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

      {/* Sub Navigation (Categories Row) - Dynamic */}
      <div 
        className="hidden md:flex border-t border-[#E5E5E5] bg-[#F8F8F6] relative"
        onMouseLeave={() => setActiveMegaMenu(null)}
      >
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12 flex items-center justify-center gap-10 h-10 overflow-x-auto">
          {categories.length > 0
            ? categories.map((cat) => (
                <div 
                  key={cat.category_id} 
                  className="h-full flex items-center"
                  onMouseEnter={() => setActiveMegaMenu(cat.category_id)}
                >
                  <Link href={`/category/${cat.category_id}`}>
                    <button className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors whitespace-nowrap h-full flex items-center">
                      {cat.name}
                    </button>
                  </Link>
                </div>
              ))
            : ["Men", "Children", "Brands"].map((cat) => (
                <Link key={cat} href="/category/16167">
                  <button className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors h-full flex items-center">
                    {cat}
                  </button>
                </Link>
              ))
          }
        </div>

        {/* Mega Menu Dropdown */}
        {activeMegaMenu && categories.find(c => c.category_id === activeMegaMenu)?.sub_category?.length > 0 && (
          <div className="absolute top-full left-0 w-full bg-[#1A1A1A] shadow-2xl z-[100] border-t border-[#333]">
            <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12 py-12 flex justify-center gap-16 xl:gap-24">
              {categories.find(c => c.category_id === activeMegaMenu).sub_category.map((sub) => (
                <div key={sub.id} className="flex flex-col min-w-[140px]">
                  <Link 
                    href={`/category/${activeMegaMenu}?subcategory=${sub.id}`}
                    onClick={() => setActiveMegaMenu(null)}
                    className="text-[10px] font-bold tracking-widest uppercase text-white mb-6 hover:text-[#E5E5E5] transition-colors"
                  >
                    {sub.name}
                  </Link>
                  {sub.child_categories && sub.child_categories.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {sub.child_categories.map((child) => (
                        <Link
                          key={child.id}
                          href={`/category/${activeMegaMenu}?child=${child.id}`}
                          onClick={() => setActiveMegaMenu(null)}
                          className="text-[11px] text-[#999999] hover:text-white transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-[85%] max-w-sm h-full bg-[#F8F8F6] shadow-2xl flex flex-col">
            <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-widest uppercase">Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-6 overflow-y-auto">
              {categories.length > 0
                ? categories.map((cat) => (
                    <Link
                      key={cat.category_id}
                      href={`/category/${cat.category_id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A]"
                    >
                      {cat.name}
                    </Link>
                  ))
                : ["Men", "Children", "Brands"].map((cat) => (
                    <Link
                      key={cat}
                      href="/category/16167"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A]"
                    >
                      {cat}
                    </Link>
                  ))
              }
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
