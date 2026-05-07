"use client";

import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <section className="py-12 md:py-20" id="newsletter-section">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-6 py-12 md:px-16 md:py-16 text-center">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#E8611A]/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-[#E8611A]/20 text-[#E8611A] text-xs font-semibold rounded-full mb-4">
              NEWSLETTER
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Stay Updated with Asiatic Fashion
            </h2>
            <p className="text-sm md:text-base text-gray-400 max-w-md mx-auto mb-8">
              Subscribe to get the latest trends, exclusive offers, and new
              arrivals directly to your inbox.
            </p>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row items-center gap-3 max-w-lg mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full sm:flex-1 h-12 px-5 text-sm bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E8611A]/50 focus:border-[#E8611A] transition-all"
                id="newsletter-email"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-8 h-12 bg-[#E8611A] hover:bg-[#E8611A]-hover text-white text-sm font-semibold rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-[#E8611A]/30 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                id="newsletter-submit"
              >
                {submitted ? (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Subscribed!
                  </>
                ) : (
                  "Subscribe"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
