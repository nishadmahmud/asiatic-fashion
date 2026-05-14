"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Next.js App Router + `scroll-behavior: smooth` on `html` can leave the window
 * partway down after client navigations. Force top-of-page on every route change.
 */
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const el = document.documentElement;
    el.style.setProperty("scroll-behavior", "auto");
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    el.scrollTop = 0;
    el.style.removeProperty("scroll-behavior");
  }, [pathname]);

  return null;
}
