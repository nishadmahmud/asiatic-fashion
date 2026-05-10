"use client";

import { useState } from "react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

const faqs = [
  {
    question: "How long does shipping take?",
    answer: "For domestic orders, shipping usually takes 2-5 business days. International orders may take 7-14 business days depending on the destination.",
  },
  {
    question: "What is your return policy?",
    answer: "We accept returns within 14 days of delivery. The item must be unworn, unwashed, and have all original tags attached.",
  },
  {
    question: "How can I track my order?",
    answer: "Once your order is shipped, you will receive an email with a tracking number. You can also track your order using the 'Track Order' page in our footer.",
  },
  {
    question: "Do you ship internationally?",
    answer: "Yes, we ship to most countries worldwide. Shipping costs will be calculated at checkout based on your location.",
  },
  {
    question: "How do I determine my size?",
    answer: "Each product page features a detailed size guide. We recommend measuring yourself and comparing it to our chart before placing an order.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-white py-16 md:py-24">
        <div className="max-w-[800px] mx-auto px-4 md:px-12">
          <h1 className="text-2xl md:text-3xl font-bold tracking-widest uppercase text-[#1A1A1A] mb-4 text-center">
            Frequently Asked Questions
          </h1>
          <p className="text-xs text-[#999999] tracking-widest uppercase text-center mb-16">
            Find answers to common questions about our products and services.
          </p>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="border border-[#E5E5E5] overflow-hidden"
              >
                <button
                  className="w-full px-6 py-4 flex items-center justify-between bg-[#F8F8F6] hover:bg-[#E5E5E5] transition-colors text-left"
                  onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                >
                  <span className="text-xs font-bold tracking-widest uppercase text-[#1A1A1A] pr-4">
                    {faq.question}
                  </span>
                  <svg 
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`transform transition-transform duration-300 ${openIndex === index ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                
                <div 
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                    openIndex === index ? "max-h-48 py-4" : "max-h-0"
                  }`}
                >
                  <p className="text-sm text-[#666666] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
