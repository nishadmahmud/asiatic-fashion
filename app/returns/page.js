"use client";

import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import Link from "next/link";

export default function ReturnsPage() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-white py-16 md:py-24">
        <div className="max-w-[800px] mx-auto px-4 md:px-12">
          <h1 className="text-2xl md:text-3xl font-bold tracking-widest uppercase text-[#1A1A1A] mb-4 text-center">
            Returns & Exchange
          </h1>
          <p className="text-xs text-[#999999] tracking-widest uppercase text-center mb-16 border-b border-[#E5E5E5] pb-8">
            How to return or exchange your recent purchase.
          </p>

          <div className="space-y-12">
            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-4">Our Policy</h2>
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                We gladly accept returns and exchanges within 14 days of the delivery date. Items must be in their original condition: unworn, unwashed, and with all original tags attached. We reserve the right to refuse returns that do not meet these criteria.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-4">How to Initiate a Return</h2>
              <ul className="list-decimal pl-5 text-sm text-[#666666] space-y-4">
                <li>Log in to your <Link href="/profile" className="text-[#1A1A1A] underline hover:text-[#E8611A]">Profile</Link> and navigate to the <strong>Orders</strong> section.</li>
                <li>Select the order containing the item you wish to return and click "Request Return".</li>
                <li>Fill out the brief return form stating the reason.</li>
                <li>You will receive an email with a return shipping label and instructions on how to drop off the package.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-4">Refund Processing</h2>
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                Once we receive your returned item, our quality assurance team will inspect it. If approved, refunds are processed within 5-7 business days to the original payment method. You can track your refund status via the <strong>Returns</strong> tab in your profile.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
