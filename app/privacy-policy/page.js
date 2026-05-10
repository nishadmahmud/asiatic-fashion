"use client";

import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-white py-16 md:py-24">
        <div className="max-w-[800px] mx-auto px-4 md:px-12">
          <h1 className="text-2xl md:text-3xl font-bold tracking-widest uppercase text-[#1A1A1A] mb-4 text-center">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#999999] tracking-widest uppercase text-center mb-16 border-b border-[#E5E5E5] pb-8">
            How we collect, use, and protect your data.
          </p>

          <div className="space-y-8 text-sm text-[#666666] leading-relaxed">
            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-4">1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, and other information you choose to provide.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-4">2. How We Use Your Information</h2>
              <p>
                We may use the information we collect about you to: Provide, maintain, and improve our services; process transactions and send related information; send you technical notices, updates, security alerts, and support and administrative messages; respond to your comments, questions, and requests.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-4">3. Data Security</h2>
              <p>
                We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction. However, no data transmission over the internet or information storage technology can be guaranteed to be 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-4">4. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at support@asiaticfashion.com.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
