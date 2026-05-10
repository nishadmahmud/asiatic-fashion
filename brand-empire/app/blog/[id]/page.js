"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getBlogs } from "@/lib/api";

export default function BlogDetailPage() {
    const params = useParams();
    const blogId = params.id;

    const [blog, setBlog] = useState(null);
    const [relatedBlogs, setRelatedBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                setLoading(true);
                const response = await getBlogs();

                if (response.success && response.data) {
                    const foundBlog = response.data.find(b => b.id == blogId);
                    if (foundBlog) {
                        setBlog(foundBlog);
                        // Get other blogs as related
                        const others = response.data
                            .filter(b => b.id != blogId && b.status === 1)
                            .slice(0, 3);
                        setRelatedBlogs(others);
                    }
                }
            } catch (error) {
                console.error("Error fetching blog:", error);
            } finally {
                setLoading(false);
            }
        };

        if (blogId) {
            fetchBlog();
        }
    }, [blogId]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const stripHtml = (html) => {
        if (!html) return "";
        return html.replace(/<[^>]*>/g, "").trim();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-royal-red)]"></div>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
                <p className="text-gray-500 text-lg mb-4">Blog post not found</p>
                <Link href="/blog" className="text-[var(--brand-royal-red)] font-semibold hover:underline">
                    ← Back to Blog
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Image */}
            {blog.image && (
                <div className="relative h-64 md:h-96 w-full">
                    <Image
                        src={blog.image}
                        alt={blog.title}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-[900px] mx-auto px-4 md:px-8 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                    <Link href="/" className="hover:text-[var(--brand-royal-red)]">Home</Link>
                    <span>/</span>
                    <Link href="/blog" className="hover:text-[var(--brand-royal-red)]">Blog</Link>
                    <span>/</span>
                    <span className="text-gray-900 font-medium truncate">{blog.title}</span>
                </div>

                {/* Article */}
                <article className="bg-white rounded-xl shadow-sm p-6 md:p-10">
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span>{formatDate(blog.created_at)}</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                        {blog.title}
                    </h1>

                    {/* Content - Render HTML safely */}
                    <div
                        className="prose prose-lg max-w-none text-gray-700 leading-relaxed
                            prose-p:my-4 
                            prose-headings:text-gray-900 
                            prose-headings:font-bold
                            prose-a:text-[var(--brand-royal-red)]
                            prose-a:no-underline
                            hover:prose-a:underline
                            prose-img:rounded-lg
                            prose-img:shadow-md"
                        dangerouslySetInnerHTML={{ __html: blog.description }}
                    />
                </article>

                {/* Back Button */}
                <div className="mt-8">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-[var(--brand-royal-red)] font-semibold hover:underline"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to All Posts
                    </Link>
                </div>

                {/* Related Posts */}
                {relatedBlogs.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">More Posts</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {relatedBlogs.map((relatedBlog) => (
                                <Link
                                    key={relatedBlog.id}
                                    href={`/blog/${relatedBlog.id}`}
                                    className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
                                >
                                    <div className="relative h-32 overflow-hidden">
                                        {relatedBlog.image ? (
                                            <Image
                                                src={relatedBlog.image}
                                                alt={relatedBlog.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-gray-400">📝</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 group-hover:text-[var(--brand-royal-red)] transition-colors line-clamp-2">
                                            {relatedBlog.title}
                                        </h3>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
