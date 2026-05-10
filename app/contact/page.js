"use client";

import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-white py-16 md:py-24">
        <div className="max-w-[1000px] mx-auto px-4 md:px-12">
          <h1 className="text-2xl md:text-3xl font-bold tracking-widest uppercase text-[#1A1A1A] mb-4 text-center">
            Contact Us
          </h1>
          <p className="text-xs text-[#999999] tracking-widest uppercase text-center mb-16 border-b border-[#E5E5E5] pb-8">
            We'd love to hear from you. Get in touch with our team.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
            {/* Contact Form */}
            <div>
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-8">Send a Message</h2>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999999] mb-2">Full Name</label>
                  <input type="text" className="w-full h-12 border border-[#E5E5E5] px-4 focus:outline-none focus:border-[#1A1A1A] transition-colors text-sm" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999999] mb-2">Email Address</label>
                  <input type="email" className="w-full h-12 border border-[#E5E5E5] px-4 focus:outline-none focus:border-[#1A1A1A] transition-colors text-sm" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999999] mb-2">Message</label>
                  <textarea className="w-full border border-[#E5E5E5] p-4 focus:outline-none focus:border-[#1A1A1A] transition-colors text-sm resize-none h-32" placeholder="How can we help you?"></textarea>
                </div>
                <button type="submit" className="w-full h-12 bg-[#1A1A1A] text-white text-xs font-bold tracking-widest uppercase hover:bg-[#333333] transition-colors">
                  Submit Form
                </button>
              </form>
            </div>

            {/* Contact Details */}
            <div className="space-y-12 md:mt-12">
              <div>
                <h3 className="text-[10px] font-bold tracking-widest uppercase text-[#999999] mb-2">Customer Service</h3>
                <p className="text-sm text-[#1A1A1A] font-medium">support@asiaticfashion.com</p>
                <p className="text-sm text-[#1A1A1A] font-medium">+880 1234 567890</p>
                <p className="text-xs text-[#666666] mt-2">Available Mon-Fri, 9am - 6pm (BST)</p>
              </div>

              <div>
                <h3 className="text-[10px] font-bold tracking-widest uppercase text-[#999999] mb-2">Headquarters</h3>
                <p className="text-sm text-[#1A1A1A] leading-relaxed">
                  Asiatic Fashion Ltd.<br />
                  123 Fashion Avenue<br />
                  Banani, Dhaka 1213<br />
                  Bangladesh
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
