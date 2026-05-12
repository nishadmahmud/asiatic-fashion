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
    <section className="py-16 md:py-24 border-t border-[#E5E5E5] bg-[#F8F8F6]" id="newsletter-section">
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] mb-4 tracking-tight uppercase">
            Join The Club
          </h2>
          <p className="text-sm text-[#6B6B6B] mb-8 leading-relaxed">
            Sign up to receive early access to new arrivals, exclusive offers, and editorial content.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-stretch gap-0 max-w-md mx-auto border border-[#1A1A1A]"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="YOUR EMAIL ADDRESS"
              required
              className="flex-1 min-h-14 w-full px-5 py-3.5 text-sm tracking-widest bg-white text-[#1A1A1A] placeholder-[#999999] focus:outline-none sm:min-h-12 sm:py-0 sm:text-xs"
              id="newsletter-email"
            />
            <button
              type="submit"
              className="flex w-full min-h-14 items-center justify-center px-8 py-3.5 text-sm font-bold tracking-widest text-white uppercase transition-colors duration-300 sm:w-auto sm:min-h-12 sm:py-0 sm:text-xs bg-[#1A1A1A] hover:bg-[#333333] border-t border-[#1A1A1A] sm:border-t-0 sm:border-l sm:border-[#1A1A1A]"
              id="newsletter-submit"
            >
              {submitted ? "Subscribed" : "Subscribe"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
