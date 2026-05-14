"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { getBlogs } from "@/lib/api";

export default function BlogDetailClient() {
  const params = useParams();
  const blogId = params?.id;

  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const response = await getBlogs();

        if (response.success && response.data) {
          const foundBlog = response.data.find((b) => String(b.id) === String(blogId));
          if (foundBlog) {
            setBlog(foundBlog);
            const others = response.data
              .filter((b) => String(b.id) !== String(blogId) && b.status === 1)
              .slice(0, 3);
            setRelatedBlogs(others);
          } else {
            setBlog(null);
            setRelatedBlogs([]);
          }
        }
      } catch (error) {
        console.error("Error fetching blog:", error);
      } finally {
        setLoading(false);
      }
    };

    if (blogId) fetchBlog();
  }, [blogId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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

  if (!blog) {
    return (
      <>
        <Header />
        <main className="flex min-h-[60vh] flex-col items-center justify-center bg-[#FAFAF8] px-4">
          <p className="mb-4 text-[#6B6B6B]">Blog post not found.</p>
          <Link href="/blog" className="text-sm font-bold uppercase tracking-widest text-[#1A1A1A] underline underline-offset-4">
            ← Back to blog
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FAFAF8]">
        {blog.image && (
          <div className="relative h-64 w-full md:h-96">
            <Image src={blog.image} alt={blog.title} fill className="object-cover" unoptimized priority />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
          </div>
        )}

        <div className="mx-auto max-w-[900px] px-4 py-8 md:px-8">
          <nav className="mb-6 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#999999]">
            <Link href="/" className="transition-colors hover:text-[#1A1A1A]">
              Home
            </Link>
            <span className="text-[#E5E5E5]">/</span>
            <Link href="/blog" className="transition-colors hover:text-[#1A1A1A]">
              Blog
            </Link>
            <span className="text-[#E5E5E5]">/</span>
            <span className="max-w-[200px] truncate text-[#1A1A1A] md:max-w-none">{blog.title}</span>
          </nav>

          <article className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-sm md:p-10">
            <div className="mb-4 text-sm text-[#999999]">{formatDate(blog.created_at)}</div>
            <h1 className="mb-6 text-2xl font-bold leading-tight text-[#1A1A1A] md:text-4xl">{blog.title}</h1>
            <div
              className="html-content text-[#4A4A4A]"
              dangerouslySetInnerHTML={{ __html: blog.description || "" }}
            />
          </article>

          <div className="mt-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#1A1A1A] transition-opacity hover:opacity-70"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to all posts
            </Link>
          </div>

          {relatedBlogs.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-6 text-lg font-bold uppercase tracking-[0.14em] text-[#1A1A1A]">More posts</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {relatedBlogs.map((relatedBlog) => (
                  <Link
                    key={relatedBlog.id}
                    href={`/blog/${relatedBlog.id}`}
                    className="group overflow-hidden rounded-lg border border-[#E5E5E5] bg-white shadow-sm transition-all hover:border-[#1A1A1A]"
                  >
                    <div className="relative h-32 overflow-hidden">
                      {relatedBlog.image ? (
                        <Image
                          src={relatedBlog.image}
                          alt={relatedBlog.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#F0F0EE]">
                          <span className="text-[#999999]" aria-hidden>
                            📝
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 font-semibold text-[#1A1A1A] transition-colors group-hover:text-[#666666]">
                        {relatedBlog.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
