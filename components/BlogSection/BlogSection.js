"use client";

import { useState, useEffect } from "react";
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
          const activeBlogs = response.data.filter((blog) => blog.status === 1);
          setBlogs(activeBlogs.slice(0, 4));
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

  const truncate = (text, maxLength = 100) => {
    if (!text) return "";
    const stripped = stripHtml(text);
    return stripped.length > maxLength ? `${stripped.substring(0, maxLength)}...` : stripped;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <section className="border-t border-[#E5E5E5] bg-[#FAFAF8] py-12 md:py-16">
        <div className="mx-auto max-w-[1600px] px-4 md:px-12">
          <div className="mb-10 text-center">
            <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-[#1A1A1A] md:text-2xl">Our Blog</h2>
            <p className="mt-2 text-sm text-[#6B6B6B]">Latest news and updates</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
                <div className="h-48 animate-pulse bg-[#F0F0EE]" />
                <div className="p-4">
                  <div className="mb-2 h-3 w-1/4 animate-pulse rounded bg-[#F0F0EE]" />
                  <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-[#F0F0EE]" />
                  <div className="h-3 w-full animate-pulse rounded bg-[#F0F0EE]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (blogs.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-[#E5E5E5] bg-[#FAFAF8] py-12 md:py-16">
      <div className="mx-auto max-w-[1600px] px-4 md:px-12">
        <div className="mb-10 text-center">
          <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-[#1A1A1A] md:text-2xl">Our Blog</h2>
          <p className="mt-2 text-sm text-[#6B6B6B]">Latest news and customer stories</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {blogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/blog/${blog.id}`}
              className="group overflow-hidden rounded-lg border border-[#E5E5E5] bg-white shadow-sm transition-all duration-300 hover:border-[#1A1A1A] hover:shadow-md"
            >
              <div className="relative h-48 overflow-hidden">
                {blog.image ? (
                  <Image
                    src={blog.image}
                    alt={blog.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-[#ECECEA] to-[#D8D8D6]">
                    <span className="text-4xl text-[#999999]" aria-hidden>
                      📝
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#999999]">
                  {formatDate(blog.created_at)}
                </p>
                <h3 className="mb-2 line-clamp-2 text-base font-semibold text-[#1A1A1A] transition-colors group-hover:text-[#666666]">
                  {blog.title}
                </h3>
                <p className="line-clamp-2 text-sm text-[#6B6B6B]">{truncate(blog.description, 80)}</p>
                <span className="mt-3 inline-block text-xs font-bold uppercase tracking-widest text-[#1A1A1A] transition-transform group-hover:translate-x-1">
                  Read more →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 border border-[#1A1A1A] bg-[#1A1A1A] px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-[#1A1A1A]"
          >
            View all posts
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
