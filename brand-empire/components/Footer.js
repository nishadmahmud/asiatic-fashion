"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCategoriesFromServer } from "@/lib/api";

const Footer = () => {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await getCategoriesFromServer();
                if (response.success && response.data) {
                    setCategories(response.data.slice(0, 5)); // Limit to first 5 for footer
                }
            } catch (error) {
                console.error("Error fetching categories for footer:", error);
            }
        };

        fetchCategories();
    }, []);

    return (
        <footer className="bg-[#111111] text-white pt-16 md:pt-20 pb-24 md:pb-0 border-t-4 border-[var(--brand-royal-red)]">
            <div className="section-content pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

                    {/* Column 1: Brand & Socials */}
                    <div className="space-y-6">
                        <Link href="/" className="block">
                            <Image
                                src="/logo.png"
                                alt="Brand Empire"
                                width={140}
                                height={45}
                            />
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                            Experience the epitome of style with Brand Empire. We bring you premium fashion that defines elegance and sophistication.
                        </p>

                        {/* Social Media */}
                        <div className="flex gap-4 pt-2">
                            {/* Facebook */}
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-[#1877F2] hover:text-white transition-all transform hover:-translate-y-1">
                                <span className="sr-only">Facebook</span>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                                </svg>
                            </a>

                            {/* Instagram */}
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-[#E4405F] hover:text-white transition-all transform hover:-translate-y-1">
                                <span className="sr-only">Instagram</span>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 014.185 3.362c.636-.247 1.363-.416 2.427-.465C7.674 2.012 8.029 2 10.457 2h.63c2.43 0 2.784.013 3.808.06.54.024 1.02.13.43.5.21.37.03 1.04.05.02.01.01.02.01.03 0 .01-.01.03-.02 2.68-.12.55-1.06.78-1.58.25-.52.02.97.23 1.48.64 1.6 1.02 1.83 2 1.87 2.05.05 1.06.06 1.41.06 4.13v.08c0 2.64-.01 2.99-.06 4.04-.05 1.06-.22 1.79-.47 2.43-.25.64-.61 1.15-1.15 1.69-.54.54-1.05.91-1.69 1.15-.64.25-1.37.42-2.43.47-1.02.05-1.38.06-3.81.06h-.63c-2.43 0-2.78-.01-3.81-.06-1.06-.05-1.79-.22-2.43-.47-.64-.25-1.15-.61-1.69-1.15-.54-.54-.91-1.05-1.15-1.69-.25-.64-.42-1.37-.47-2.43-.05-1.02-.06-1.38-.06-3.81v-.63c0-2.43.01-2.78.06-3.81.05-1.06.22-1.79.47-2.43.25-.64.61-1.15 1.15-1.69.54-.54 1.05-.91 1.69-1.15.64-.25 1.37-.42 2.43-.47 1.02-.05 1.38-.06 3.81-.06h.63zm0 2.2a2.001 2.001 0 011.415 3.414 2 2 0 11-2.829-2.828A1.996 1.996 0 0112.315 4.2zm-5.74 5.74a5.74 5.74 0 110 11.48 5.74 5.74 0 010-11.48zm0 2.15a3.59 3.59 0 100 7.18 3.59 3.59 0 000-7.18z" clipRule="evenodd" />
                                </svg>
                            </a>

                            {/* Twitter / X */}
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all transform hover:-translate-y-1">
                                <span className="sr-only">Twitter</span>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>

                            {/* LinkedIn */}
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-[#0A66C2] hover:text-white transition-all transform hover:-translate-y-1">
                                <span className="sr-only">LinkedIn</span>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Shop */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6 relative inline-block">
                            Shop Collections
                            <span className="absolute -bottom-2 left-0 w-12 h-1 bg-[var(--brand-royal-red)] rounded-full"></span>
                        </h3>
                        <ul className="space-y-3">
                            {categories.length > 0 ? categories.map((cat) => (
                                <li key={cat.category_id}>
                                    <Link href={`/category/${cat.category_id}`} className="text-gray-400 hover:text-[var(--brand-royal-red)] hover:pl-2 transition-all flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-royal-red)] opacity-0 transition-opacity group-hover:opacity-100"></span>
                                        {cat.name}
                                    </Link>
                                </li>
                            )) : (
                                <li><span className="text-gray-500 italic">Loading collections...</span></li>
                            )}
                            <li>
                                <Link href="/#new-arrivals" className="text-gray-400 hover:text-[var(--brand-royal-red)] hover:pl-2 transition-all font-medium">
                                    New Arrivals
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Information */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6 relative inline-block">
                            Information
                            <span className="absolute -bottom-2 left-0 w-12 h-1 bg-[var(--brand-royal-red)] rounded-full"></span>
                        </h3>
                        <ul className="space-y-3">
                            {[
                                { name: 'Track Order', href: '/track-order' },
                                { name: 'Blogs', href: '/blogs' },
                                { name: 'About Us', href: '/about' },
                                { name: 'Contact Us', href: '/contact' },
                                { name: 'Careers', href: '/careers' },
                                { name: 'Shipping Policy', href: '/shipping' },
                                { name: 'Returns & Exchange', href: '/returns' },
                                { name: 'Terms & Conditions', href: '/terms' },
                                { name: 'Privacy Policy', href: '/privacy' },
                            ].map((item) => (
                                <li key={item.name}>
                                    <Link href={item.href} className="text-gray-400 hover:text-[var(--brand-royal-red)] hover:pl-2 transition-all">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 4: Contact Info (New) */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6 relative inline-block">
                            Contact Us
                            <span className="absolute -bottom-2 left-0 w-12 h-1 bg-[var(--brand-royal-red)] rounded-full"></span>
                        </h3>
                        <div className="space-y-5">
                            <div className="flex items-start gap-4 group">
                                <div className="p-3 bg-gray-800 rounded-lg text-[var(--brand-royal-red)] group-hover:bg-[var(--brand-royal-red)] group-hover:text-white transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-white text-sm mb-1">Our Location</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Level 3, Block- C, Shop- 42B,<br />
                                        Jamuna Future Park, Dhaka
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 group">
                                <div className="p-3 bg-gray-800 rounded-lg text-[var(--brand-royal-red)] group-hover:bg-[var(--brand-royal-red)] group-hover:text-white transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.12 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm mb-1">Phone Number</h4>
                                    <a href="tel:+8801814111716" className="text-gray-400 text-sm hover:text-[var(--brand-royal-red)] transition-colors">
                                        +880 1814-111716
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 group">
                                <div className="p-3 bg-gray-800 rounded-lg text-[var(--brand-royal-red)] group-hover:bg-[var(--brand-royal-red)] group-hover:text-white transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm mb-1">Email Address</h4>
                                    <a href="mailto:info@brandempirebd.com" className="text-gray-400 text-sm hover:text-[var(--brand-royal-red)] transition-colors">
                                        info@brandempirebd.com
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Sub-Footer: Payment & Copyright */}
                <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-gray-500 text-sm text-center md:text-left">
                        &copy; {new Date().getFullYear()} <strong className="text-white">Brand Empire</strong>. All rights reserved.
                    </p>

                    <div className="flex items-center gap-3">
                        <div className="bg-white rounded px-2 py-1 h-8 flex items-center">
                            <span className="text-[10px] font-bold text-blue-800">VISA</span>
                        </div>
                        <div className="bg-white rounded px-2 py-1 h-8 flex items-center">
                            <span className="text-[10px] font-bold text-red-600">Mastercard</span>
                        </div>
                        <div className="bg-white rounded px-2 py-1 h-8 flex items-center">
                            <span className="text-[10px] font-bold text-blue-500">Amex</span>
                        </div>
                        <div className="bg-white rounded px-2 py-1 h-8 flex items-center">
                            <span className="text-[10px] font-bold text-pink-600">bKash</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
