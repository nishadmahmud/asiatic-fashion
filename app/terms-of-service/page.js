"use client";

import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

export default function TermsOfServicePage() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-white py-16 md:py-24">
        <div className="max-w-[800px] mx-auto px-4 md:px-12">
          <h1 className="text-2xl md:text-3xl font-bold tracking-widest uppercase text-[#1A1A1A] mb-4 text-center">
            Terms of Service
          </h1>
          <p className="text-xs text-[#999999] tracking-widest uppercase text-center mb-16 border-b border-[#E5E5E5] pb-8">
            The rules and guidelines for using our services.
          </p>

          <div className="space-y-8 text-sm text-[#666666] leading-relaxed">
            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using our website, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily download one copy of the materials (information or software) on our website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-4">3. Disclaimer</h2>
              <p>
                The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-4">4. Limitations</h2>
              <p>
                In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
