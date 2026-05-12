"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Desktop category row; mega menu only when variant is "header" (not under hero).
 * @param {"header" | "hero-attach"} variant
 */
export default function CategoryNavBar({ categories = [], variant = "header" }) {
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const megaEnabled = variant === "header";

  if (!Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  const firstCategoryId = categories[0]?.category_id;
  const shopHref = firstCategoryId ? `/category/${firstCategoryId}` : "/#new-arrivals";

  const isHeroAttach = variant === "hero-attach";

  /** Hero strip: visible on all breakpoints (was hidden on mobile — users expect it under the slider). */
  const outerClass = isHeroAttach
    ? "flex w-full bg-white relative z-20 border-t border-[#E5E5E5]"
    : "hidden md:flex border-t border-[#E5E5E5] bg-[#F8F8F6] relative";

  const innerRowClass = isHeroAttach
    ? "relative mx-auto flex min-h-11 w-full max-w-[1600px] items-stretch md:min-h-14"
    : "w-full max-w-[1600px] mx-auto px-4 md:px-12 flex items-center justify-center gap-10 h-10 overflow-x-auto";

  return (
    <div className={outerClass} onMouseLeave={() => megaEnabled && setActiveMegaMenu(null)}>
      {isHeroAttach ? (
        <div className={innerRowClass}>
          <Link
            href={shopHref}
            className="relative z-20 flex shrink-0 items-center justify-center px-4 sm:px-8 md:px-12 bg-[#E8E8E8] text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A] transition-colors hover:bg-[#DDDDDD] sm:text-[10px] sm:tracking-[0.25em] md:text-[11px]"
            style={{
              clipPath: "polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%)",
            }}
          >
            Shop Now
          </Link>
          <div className="flex min-h-11 min-w-0 flex-1 items-center justify-center overflow-x-auto px-2 scrollbar-hide md:justify-start md:px-4 md:pl-8 md:pr-12 lg:pl-10">
            <div className="flex shrink-0 items-center justify-center gap-x-[clamp(1rem,7vw,4.5rem)] md:justify-start md:gap-x-5 lg:gap-x-9">
              {categories.map((cat) => (
                <div key={cat.category_id} className="flex h-full shrink-0 items-center">
                  <Link href={`/category/${cat.category_id}`}>
                    <span className="cursor-pointer whitespace-nowrap text-[10px] font-bold tracking-[0.2em] text-[#1A1A1A] uppercase transition-colors hover:text-[#666666] md:text-[12px] md:font-extrabold md:tracking-[0.28em] lg:text-[13px] lg:tracking-[0.3em]">
                      {cat.name}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={innerRowClass}>
          {categories.map((cat) => (
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
        categories.find((c) => c.category_id === activeMegaMenu)?.sub_category?.length > 0 && (
        <div className="absolute top-full left-0 w-full bg-[#1A1A1A] shadow-2xl z-[100] border-t border-[#333]">
          <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12 py-12 flex justify-center gap-16 xl:gap-24">
            {categories.find((c) => c.category_id === activeMegaMenu).sub_category.map((sub) => (
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
