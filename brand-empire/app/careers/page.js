"use client";

import React from "react";
import { Briefcase, MapPin, ArrowRight } from "lucide-react";

export default function Careers() {
    const jobs = [
        {
            title: "Digital Marketing Specialist",
            department: "Marketing",
            location: "Dhaka, Bangladesh",
            type: "Full-time",
            description: "Plan and execute digital campaigns across social, ads, and content channels."
        },
        {
            title: "SEO Specialist",
            department: "Marketing",
            location: "Dhaka, Bangladesh",
            type: "Full-time",
            description: "Improve search rankings, traffic quality, and on-page/off-page SEO performance."
        },
        {
            title: "Graphics Designer",
            department: "Creative",
            location: "Dhaka, Bangladesh",
            type: "Full-time",
            description: "Create campaign visuals, product creatives, and brand assets for digital platforms."
        },
        {
            title: "Video Editor",
            department: "Creative",
            location: "Dhaka, Bangladesh",
            type: "Full-time",
            description: "Edit short-form and long-form videos for ads, social content, and product storytelling."
        },
        {
            title: "Customer Support & Data Entry Operator",
            department: "Operations",
            location: "Dhaka, Bangladesh",
            type: "Full-time",
            description: "Handle customer support queries and maintain accurate operational data records."
        }
    ];

    return (
        <div className="section-full py-12 md:py-20 bg-gray-50/50">
            <div className="section-content max-w-5xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="text-[var(--brand-royal-red)] font-bold tracking-wider uppercase text-sm">Join Our Team</span>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mt-2 mb-6">Build the Future of Fashion</h1>
                    <p className="text-gray-600 text-lg">
                        At Brand Empire, we are always looking for passionate, creative, and driven individuals to join our family.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Why Work With Us?</h3>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Competitive Salary & Benefits
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Employee Discounts on all products
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Creative & Inclusive Work Environment
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                fast-track Career Growth
                            </li>
                        </ul>
                    </div>
                    <div className="bg-[var(--brand-royal-red)] p-8 rounded-2xl shadow-lg text-white flex flex-col justify-center items-center text-center">
                        <h3 className="text-2xl font-bold mb-4">Don't see a role for you?</h3>
                        <p className="text-red-100 mb-6">We are always hiring great talent. Send us your CV and we will keep it on file.</p>
                        <a href="mailto:careers@brandempire.com" className="bg-white text-[var(--brand-royal-red)] px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition">Email Your CV</a>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-8">Open Positions</h2>
                <div className="space-y-4">
                    {jobs.map((job, idx) => (
                        <div key={idx} className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 hover:border-[var(--brand-royal-red)] hover:shadow-md transition group cursor-pointer">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-[var(--brand-royal-red)] transition-colors">{job.title}</h3>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                                        <span className="flex items-center gap-1"><Briefcase size={16} /> {job.department}</span>
                                        <span className="flex items-center gap-1"><MapPin size={16} /> {job.location}</span>
                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-semibold uppercase">{job.type}</span>
                                    </div>
                                    <p className="text-gray-600 mt-3 text-sm">{job.description}</p>
                                </div>
                                <div className="flex-shrink-0">
                                    <span className="inline-flex items-center gap-2 text-[var(--brand-royal-red)] font-bold text-sm">
                                        Apply Now <ArrowRight size={16} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
