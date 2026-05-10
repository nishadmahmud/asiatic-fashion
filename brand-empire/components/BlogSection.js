"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getBlogs } from "@/lib/api";

export default function BlogSection() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const response = await getBlogs();
                if (response.success && response.data) {
                    // Only show active blogs (status === 1)
                    const activeBlogs = response.data.filter(blog => blog.status === 1);
                    setBlogs(activeBlogs.slice(0, 4)); // Show max 4 blogs
                }
            } catch (error) {
                console.error("Error fetching blogs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    // Strip HTML tags for preview
    const stripHtml = (html) => {
        if (!html) return "";
        return html.replace(/<[^>]*>/g, "").trim();
    };

    // Truncate text
    const truncate = (text, maxLength = 100) => {
        if (!text) return "";
        const stripped = stripHtml(text);
        return stripped.length > maxLength
            ? stripped.substring(0, maxLength) + "..."
            : stripped;
    };

    // Format date
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
            <section className="py-12 bg-gray-50">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Our Blog</h2>
                        <p className="text-gray-600 mt-2">Latest news and updates</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                                <div className="h-48 bg-gray-200" />
                                <div className="p-4">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (blogs.length === 0) {
        return null; // Don't show section if no blogs
    }

    return (
        <section className="py-12 bg-gray-50">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Our Blog</h2>
                    <p className="text-gray-600 mt-2">Latest news and customer stories</p>
                </div>

                {/* Blog Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {blogs.map((blog) => (
                        <Link
                            key={blog.id}
                            href={`/blog/${blog.id}`}
                            className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                        >
                            {/* Blog Image */}
                            <div className="relative h-48 overflow-hidden">
                                {blog.image ? (
                                    <Image
                                        src={blog.image}
                                        alt={blog.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                        <span className="text-gray-400 text-4xl">📝</span>
                                    </div>
                                )}
                            </div>

                            {/* Blog Content */}
                            <div className="p-4">
                                <p className="text-xs text-gray-400 mb-2">
                                    {formatDate(blog.created_at)}
                                </p>
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[var(--brand-royal-red)] transition-colors line-clamp-2 mb-2">
                                    {blog.title}
                                </h3>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {truncate(blog.description, 80)}
                                </p>
                                <span className="inline-block mt-3 text-[var(--brand-royal-red)] text-sm font-medium group-hover:translate-x-1 transition-transform">
                                    Read More →
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* View All Link */}
                <div className="text-center mt-8">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--brand-royal-red)] text-white font-semibold rounded-full hover:bg-red-700 transition-colors"
                    >
                        View All Posts
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}
