"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { getBlogs } from "@/lib/api";

export default function BlogListClient() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await getBlogs();
        if (response.success && response.data) {
          const activeBlogs = response.data.filter((blog) => blog.status === 1);
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
      <>
        <Header />
        <main className="flex min-h-[50vh] items-center justify-center bg-[#FAFAF8]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E5E5E5] border-t-[#1A1A1A]" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FAFAF8]">
        <div className="border-b border-[#E5E5E5] bg-[#1A1A1A] py-10 text-white md:py-14">
          <div className="mx-auto max-w-[1600px] px-4 text-center md:px-12">
            <h1 className="text-2xl font-bold uppercase tracking-[0.18em] md:text-4xl md:tracking-[0.14em]">Our blog</h1>
            <p className="mt-2 text-sm text-white/80 md:text-base">Stories, updates, and happy customers</p>
          </div>
        </div>

        <div className="border-b border-[#E5E5E5] bg-white">
          <div className="mx-auto max-w-[1600px] px-4 py-3 md:px-12">
            <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#999999]">
              <Link href="/" className="transition-colors hover:text-[#1A1A1A]">
                Home
              </Link>
              <span className="text-[#E5E5E5]">/</span>
              <span className="text-[#1A1A1A]">Blog</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-12 md:py-12">
          {blogs.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[#6B6B6B]">No blog posts available.</p>
              <Link
                href="/"
                className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-[#1A1A1A] underline underline-offset-4"
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blogs.map((blog) => (
                <Link
                  key={blog.id}
                  href={`/blog/${blog.id}`}
                  className="group overflow-hidden rounded-lg border border-[#E5E5E5] bg-white shadow-sm transition-all hover:border-[#1A1A1A] hover:shadow-md"
                >
                  <div className="relative h-52 overflow-hidden">
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
                        <span className="text-5xl text-[#999999]" aria-hidden>
                          📝
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#999999]">
                      {formatDate(blog.created_at)}
                    </p>
                    <h2 className="mb-3 line-clamp-2 text-lg font-bold text-[#1A1A1A] transition-colors group-hover:text-[#666666]">
                      {blog.title}
                    </h2>
                    <p className="mb-4 line-clamp-3 text-sm text-[#6B6B6B]">{truncate(blog.description, 120)}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[#1A1A1A] transition-transform group-hover:translate-x-1">
                      Read more
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
