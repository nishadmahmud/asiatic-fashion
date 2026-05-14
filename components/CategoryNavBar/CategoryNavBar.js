"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { sortCategoriesForNav } from "@/lib/sortCategoriesForNav";

/**
 * Desktop category row; mega menu only when variant is "header" (not under hero).
 * @param {"header" | "hero-attach"} variant
 */
export default function CategoryNavBar({ categories = [], variant = "header" }) {
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const megaEnabled = variant === "header";

  const orderedCategories = useMemo(() => sortCategoriesForNav(categories), [categories]);

  if (!Array.isArray(orderedCategories) || orderedCategories.length === 0) {
    return null;
  }

  const firstCategoryId = orderedCategories[0]?.category_id;
  const shopHref = firstCategoryId ? `/category/${firstCategoryId}` : "/#new-arrivals";

  const isHeroAttach = variant === "hero-attach";

  /** Hero strip: visible on all breakpoints (was hidden on mobile — users expect it under the slider). */
  const outerClass = isHeroAttach
    ? "flex w-full bg-white relative z-20 border-t border-[#E5E5E5]"
    : "hidden md:flex border-t border-[#E5E5E5] bg-[#F8F8F6] relative";

  const innerRowClass = isHeroAttach
    ? "relative flex w-full max-w-none items-stretch min-h-[3.75rem] md:min-h-[4.25rem] lg:min-h-[4.75rem]"
    : "w-full max-w-[1600px] mx-auto px-4 md:px-12 flex items-center justify-center gap-10 h-10 overflow-x-auto";

  return (
    <div className={outerClass} onMouseLeave={() => megaEnabled && setActiveMegaMenu(null)}>
      {isHeroAttach ? (
        <div className={innerRowClass}>
          <Link
            href={shopHref}
            className="relative z-20 flex shrink-0 items-center justify-center bg-[#D8D8D6] px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#1A1A1A] transition-colors hover:bg-[#CECECC] sm:px-8 sm:text-[11px] sm:tracking-[0.26em] md:min-w-[8.5rem] md:px-10 md:text-xs md:tracking-[0.28em] lg:min-w-[10rem] lg:text-[13px]"
            style={{
              /* Diagonal cut — keep in sync with category row overlap below */
              clipPath: "polygon(0 0, 100% 0, calc(100% - 16px) 100%, 0 100%)",
            }}
          >
            Shop Now
          </Link>
          {/* Negative margin pulls category tiles under the clipped corner (transparent) so no white wedge */}
          <div className="relative z-10 -ml-[18px] flex min-h-0 min-w-0 flex-1 items-stretch md:-ml-5">
            {orderedCategories.map((cat, index) => (
              <Link
                key={cat.category_id}
                href={`/category/${cat.category_id}`}
                className={`flex min-h-0 min-w-0 flex-1 items-center justify-center bg-[#F4F3F1] px-2 py-3 text-center text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#1A1A1A] transition-colors hover:bg-[#EBEAE8] sm:text-xs sm:tracking-[0.22em] md:text-sm md:tracking-[0.24em] lg:text-[15px] lg:tracking-[0.26em] ${
                  index > 0 ? "border-l border-[#DCDAD8]" : ""
                }`}
              >
                <span className="truncate pl-1 md:pl-0">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className={innerRowClass}>
          {orderedCategories.map((cat) => (
            <div
              key={cat.category_id}
              className="h-full flex items-center"
              onMouseEnter={() => megaEnabled && setActiveMegaMenu(cat.category_id)}
            >
              <Link href={`/category/${cat.category_id}`}>
                <button
                  type="button"
                  className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors whitespace-nowrap h-full flex items-center"
                >
                  {cat.name}
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {megaEnabled &&
        activeMegaMenu &&
        orderedCategories.find((c) => c.category_id === activeMegaMenu)?.sub_category?.length > 0 && (
        <div className="absolute top-full left-0 w-full bg-[#1A1A1A] shadow-2xl z-[100] border-t border-[#333]">
          <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12 py-12 flex justify-center gap-16 xl:gap-24">
            {orderedCategories.find((c) => c.category_id === activeMegaMenu).sub_category.map((sub) => (
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
  );
}
