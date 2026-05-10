"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getBlogs } from "@/lib/api";

export default function BlogListPage() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const response = await getBlogs();
                if (response.success && response.data) {
                    const activeBlogs = response.data.filter(blog => blog.status === 1);
                    setBlogs(activeBlogs);
                }
            } catch (error) {
                console.error("Error fetching blogs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    const stripHtml = (html) => {
        if (!html) return "";
        return html.replace(/<[^>]*>/g, "").trim();
    };

    const truncate = (text, maxLength = 120) => {
        if (!text) return "";
        const stripped = stripHtml(text);
        return stripped.length > maxLength
            ? stripped.substring(0, maxLength) + "..."
            : stripped;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-royal-red)]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--brand-royal-red)] to-red-700 text-white py-10 md:py-16">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold mb-2">Our Blog</h1>
                    <p className="text-lg opacity-90">Stories, updates, and happy customers</p>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Link href="/" className="hover:text-[var(--brand-royal-red)]">Home</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Blog</span>
                    </div>
                </div>
            </div>

            {/* Blog Grid */}
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
                {blogs.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">No blog posts available.</p>
                        <Link href="/" className="text-[var(--brand-royal-red)] font-semibold hover:underline mt-4 inline-block">
                            Continue Shopping →
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {blogs.map((blog) => (
                            <Link
                                key={blog.id}
                                href={`/blog/${blog.id}`}
                                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                            >
                                {/* Blog Image */}
                                <div className="relative h-52 overflow-hidden">
                                    {blog.image ? (
                                        <Image
                                            src={blog.image}
                                            alt={blog.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                            <span className="text-gray-400 text-5xl">📝</span>
                                        </div>
                                    )}
                                </div>

                                {/* Blog Content */}
                                <div className="p-5">
                                    <p className="text-xs text-gray-400 mb-2">
                                        {formatDate(blog.created_at)}
                                    </p>
                                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-[var(--brand-royal-red)] transition-colors line-clamp-2 mb-3">
                                        {blog.title}
                                    </h2>
                                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                                        {truncate(blog.description, 120)}
                                    </p>
                                    <span className="inline-flex items-center gap-1 text-[var(--brand-royal-red)] text-sm font-semibold group-hover:translate-x-1 transition-transform">
                                        Read More
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
