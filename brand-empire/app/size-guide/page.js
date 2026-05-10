"use client";

import React, { useState } from "react";

export default function SizeGuide() {
    const [activeTab, setActiveTab] = useState("men");

    const tabs = [
        { id: "men", label: "Men" },
        { id: "women", label: "Women" },
        { id: "kids", label: "Kids" },
    ];

    return (
        <div className="section-full py-12 md:py-20 bg-gray-50/50">
            <div className="section-content max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Size Guide</h1>
                    <p className="text-gray-600">Find your perfect fit. Refer to our size charts below.</p>
                </div>

                <div className="flex justify-center mb-10">
                    <div className="inline-flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                                        ? "bg-[var(--brand-royal-red)] text-white shadow-md"
                                        : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Men's Size Chart */}
                    {activeTab === "men" && (
                        <div className="p-8 md:p-10">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Men's Topwear (T-Shirts, Shirts, Jackets)</h3>
                            <div className="overflow-x-auto mb-10">
                                <table className="w-full text-center border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-700 font-bold text-xs uppercase">
                                            <th className="p-3 border">Size</th>
                                            <th className="p-3 border">Chest (inches)</th>
                                            <th className="p-3 border">Length (inches)</th>
                                            <th className="p-3 border">Shoulder (inches)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm text-gray-600">
                                        <tr><td className="p-3 border font-bold">S</td><td className="p-3 border">36-38</td><td className="p-3 border">27</td><td className="p-3 border">17</td></tr>
                                        <tr><td className="p-3 border font-bold">M</td><td className="p-3 border">38-40</td><td className="p-3 border">28</td><td className="p-3 border">17.5</td></tr>
                                        <tr><td className="p-3 border font-bold">L</td><td className="p-3 border">40-42</td><td className="p-3 border">29</td><td className="p-3 border">18.5</td></tr>
                                        <tr><td className="p-3 border font-bold">XL</td><td className="p-3 border">42-44</td><td className="p-3 border">30</td><td className="p-3 border">19.5</td></tr>
                                        <tr><td className="p-3 border font-bold">XXL</td><td className="p-3 border">44-46</td><td className="p-3 border">31</td><td className="p-3 border">20.5</td></tr>
                                    </tbody>
                                </table>
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Men's Bottomwear (Jeans, Trousers)</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-center border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-700 font-bold text-xs uppercase">
                                            <th className="p-3 border">Size Label</th>
                                            <th className="p-3 border">Waist (inches)</th>
                                            <th className="p-3 border">Inseam (inches)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm text-gray-600">
                                        <tr><td className="p-3 border font-bold">30</td><td className="p-3 border">30-31</td><td className="p-3 border">32</td></tr>
                                        <tr><td className="p-3 border font-bold">32</td><td className="p-3 border">32-33</td><td className="p-3 border">32</td></tr>
                                        <tr><td className="p-3 border font-bold">34</td><td className="p-3 border">34-35</td><td className="p-3 border">32</td></tr>
                                        <tr><td className="p-3 border font-bold">36</td><td className="p-3 border">36-37</td><td className="p-3 border">32</td></tr>
                                        <tr><td className="p-3 border font-bold">38</td><td className="p-3 border">38-39</td><td className="p-3 border">32</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Women's Size Chart */}
                    {activeTab === "women" && (
                        <div className="p-8 md:p-10">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Women's Topwear (Kurtis, Tops)</h3>
                            <div className="overflow-x-auto mb-10">
                                <table className="w-full text-center border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-700 font-bold text-xs uppercase">
                                            <th className="p-3 border">Size</th>
                                            <th className="p-3 border">Bust (inches)</th>
                                            <th className="p-3 border">Waist (inches)</th>
                                            <th className="p-3 border">Hip (inches)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm text-gray-600">
                                        <tr><td className="p-3 border font-bold">XS</td><td className="p-3 border">32</td><td className="p-3 border">26</td><td className="p-3 border">34</td></tr>
                                        <tr><td className="p-3 border font-bold">S</td><td className="p-3 border">34</td><td className="p-3 border">28</td><td className="p-3 border">36</td></tr>
                                        <tr><td className="p-3 border font-bold">M</td><td className="p-3 border">36</td><td className="p-3 border">30</td><td className="p-3 border">38</td></tr>
                                        <tr><td className="p-3 border font-bold">L</td><td className="p-3 border">38</td><td className="p-3 border">32</td><td className="p-3 border">40</td></tr>
                                        <tr><td className="p-3 border font-bold">XL</td><td className="p-3 border">40</td><td className="p-3 border">34</td><td className="p-3 border">42</td></tr>
                                        <tr><td className="p-3 border font-bold">XXL</td><td className="p-3 border">42</td><td className="p-3 border">36</td><td className="p-3 border">44</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Kids Size Chart */}
                    {activeTab === "kids" && (
                        <div className="p-8 md:p-10">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Kid's Clothing (Standard)</h3>
                            <div className="overflow-x-auto mb-10">
                                <table className="w-full text-center border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-700 font-bold text-xs uppercase">
                                            <th className="p-3 border">Age</th>
                                            <th className="p-3 border">Height (cm)</th>
                                            <th className="p-3 border">Weight (kg)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm text-gray-600">
                                        <tr><td className="p-3 border font-bold">2-3 Years</td><td className="p-3 border">92-98</td><td className="p-3 border">13-15</td></tr>
                                        <tr><td className="p-3 border font-bold">3-4 Years</td><td className="p-3 border">98-104</td><td className="p-3 border">15-17</td></tr>
                                        <tr><td className="p-3 border font-bold">4-5 Years</td><td className="p-3 border">104-110</td><td className="p-3 border">17-19</td></tr>
                                        <tr><td className="p-3 border font-bold">5-6 Years</td><td className="p-3 border">110-116</td><td className="p-3 border">19-21</td></tr>
                                        <tr><td className="p-3 border font-bold">7-8 Years</td><td className="p-3 border">122-128</td><td className="p-3 border">22-25</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
