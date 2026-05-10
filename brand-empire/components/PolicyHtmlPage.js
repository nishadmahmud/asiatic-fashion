"use client";

import React, { useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { getInvoiceSettings } from "@/lib/api";

export default function PolicyHtmlPage({ title, subtitle, settingKey }) {
    const [htmlContent, setHtmlContent] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchPolicy = async () => {
            setLoading(true);
            try {
                const response = await getInvoiceSettings();
                const settings = response?.data || {};
                const rawHtml = settings?.[settingKey] || "";
                if (!cancelled) {
                    // Replace &nbsp; with regular spaces to allow natural line wrapping
                    const processedHtml = rawHtml.replace(/&nbsp;/g, " ");
                    setHtmlContent(processedHtml);
                }
            } catch (error) {
                console.error(`Failed to fetch ${settingKey}`, error);
                if (!cancelled) {
                    setHtmlContent("");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchPolicy();

        return () => {
            cancelled = true;
        };
    }, [settingKey]);

    return (
        <div className="section-full py-12 md:py-20 bg-white">
            <div className="section-content max-w-4xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">{title}</h1>
                {subtitle && <p className="text-gray-500 mb-10">{subtitle}</p>}

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--brand-royal-red)]"></div>
                    </div>
                ) : htmlContent ? (
                    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 md:p-8 overflow-hidden">
                        <div
                            className="html-content max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
                        />
                    </div>
                ) : (
                    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-6 text-gray-600">
                        Policy content is not available right now.
                    </div>
                )}
            </div>
        </div>
    );
}
