"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/gtm";

export default function GTMPageViewTracker() {
    const pathname = usePathname();

    useEffect(() => {
        const search = typeof window !== "undefined" ? window.location.search : "";
        const pagePath = `${pathname}${search || ""}`;

        trackPageView({
            page_path: pagePath,
            page_title: document.title,
            page_location: window.location.href,
        });
    }, [pathname]);

    return null;
}
