"use client";

import React from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function ContactUs() {
    return (
        <div className="section-full py-12 md:py-20 bg-gray-50">
            <div className="section-content">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Get in Touch</h1>
                    <p className="text-gray-600">We'd love to hear from you. Whether you have a question about an order, a product, or just want to say hello, we're here to help.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 transition hover:shadow-md">
                            <div className="p-3 bg-red-50 text-[var(--brand-royal-red)] rounded-lg">
                                <Phone size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">Phone</h3>
                                <p className="text-gray-600 text-sm mb-2">Mon-Sat from 9am to 6pm</p>
                                <a href="tel:+8801814111716" className="text-[var(--brand-royal-red)] font-semibold hover:underline">+880 1814-111716</a>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 transition hover:shadow-md">
                            <div className="p-3 bg-red-50 text-[var(--brand-royal-red)] rounded-lg">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">Email</h3>
                                <p className="text-gray-600 text-sm mb-2">Our team will get back to you within 24 hours.</p>
                                <a href="mailto:info@brandempirebd.com" className="text-[var(--brand-royal-red)] font-semibold hover:underline">info@brandempirebd.com</a>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 transition hover:shadow-md">
                            <div className="p-3 bg-red-50 text-[var(--brand-royal-red)] rounded-lg">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">Office</h3>
                                <p className="text-gray-600 text-sm">
                                    Level 3, Block- C, Shop- 42B,<br />
                                    Jamuna Future Park,<br />
                                    Dhaka
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                        <input type="text" id="name" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[var(--brand-royal-red)] transition-all" placeholder="John Doe" />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                        <input type="email" id="email" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[var(--brand-royal-red)] transition-all" placeholder="you@example.com" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                                    <input type="text" id="subject" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[var(--brand-royal-red)] transition-all" placeholder="How can we help?" />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                    <textarea id="message" rows="5" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[var(--brand-royal-red)] transition-all" placeholder="Write your message here..."></textarea>
                                </div>
                                <button type="submit" className="w-full md:w-auto px-8 py-3 bg-[var(--brand-royal-red)] text-white font-bold rounded-lg hover:bg-red-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
