"use client";

import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

export default function ShippingInfoPage() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-white py-16 md:py-24">
        <div className="max-w-[800px] mx-auto px-4 md:px-12">
          <h1 className="text-2xl md:text-3xl font-bold tracking-widest uppercase text-[#1A1A1A] mb-4 text-center">
            Shipping Information
          </h1>
          <p className="text-xs text-[#999999] tracking-widest uppercase text-center mb-16 border-b border-[#E5E5E5] pb-8">
            Everything you need to know about delivery times and costs.
          </p>

          <div className="space-y-12">
            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-4">Domestic Shipping</h2>
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                We offer standard and express shipping options for all domestic orders. Orders are processed within 1-2 business days.
              </p>
              <ul className="list-disc pl-5 text-sm text-[#666666] space-y-2">
                <li><strong>Standard Shipping:</strong> Delivery in 2-5 business days. Free for orders over ৳5000.</li>
                <li><strong>Express Shipping:</strong> Delivery in 1-2 business days. Flat rate of ৳150.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-4">International Shipping</h2>
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                We ship worldwide! International shipping rates and delivery times vary by destination. Please note that international orders may be subject to customs duties and taxes, which are the responsibility of the recipient.
              </p>
              <ul className="list-disc pl-5 text-sm text-[#666666] space-y-2">
                <li><strong>Standard International:</strong> 7-14 business days.</li>
                <li><strong>Express International:</strong> 3-5 business days.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-4">Order Tracking</h2>
              <p className="text-sm text-[#666666] leading-relaxed">
                Once your order has been dispatched, you will receive a tracking link via email. You can also monitor the status of your shipment via our <a href="/track-order" className="text-[#1A1A1A] underline underline-offset-4 hover:text-[#E8611A]">Track Order</a> page.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
