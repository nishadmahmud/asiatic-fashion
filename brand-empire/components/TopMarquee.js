"use client";

import React, { useState, useEffect } from "react";
import { getTopbarData } from "@/lib/api";

const TopMarquee = ({ onClose, onReady }) => {
    const [topbarData, setTopbarData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopbarData = async () => {
            try {
                const response = await getTopbarData();

                if (response.success && response.topbars && response.topbars.length > 0) {
                    setTopbarData({
                        messages: response.topbars.filter(item => item.status).map(item => item.title),
                        bgColor: response.settings?.bg_color || "#0066FF"
                    });
                    if (onReady) onReady();
                }
            } catch (error) {
                console.error("Error fetching topbar data:", error);
                // Fallback to default data if API fails
                setTopbarData({
                    messages: ["⚡ FREE SHIPPING AND RETURNS!!"],
                    bgColor: "#0066FF"
                });
                if (onReady) onReady();
            } finally {
                setLoading(false);
            }
        };

        fetchTopbarData();
    }, [onReady]);

    const handleClose = () => {
        if (onClose) onClose();
    };

    if (loading || !topbarData) return null;

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes marquee-scroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .marquee-animation {
                        animation: marquee-scroll 30s linear infinite;
                    }
                    .marquee-animation:hover {
                        animation-play-state: paused;
                    }
                `
            }} />
            <div
                className="fixed top-0 left-0 right-0 w-full text-white z-[60] flex items-center"
                style={{
                    backgroundColor: topbarData.bgColor,
                    height: '36px',
                    minHeight: '36px',
                    maxHeight: '36px',
                    overflow: 'hidden'
                }}
            >
                <div
                    className="relative w-full flex items-center"
                    style={{
                        height: '36px',
                        minHeight: '36px',
                        maxHeight: '36px',
                        overflow: 'hidden'
                    }}
                >
                    <div
                        className="marquee-animation flex items-center"
                        style={{
                            height: '36px',
                            minHeight: '36px',
                            maxHeight: '36px',
                            whiteSpace: 'nowrap',
                            display: 'flex'
                        }}
                    >
                        {/* First set of messages */}
                        <span
                            className="inline-flex items-center uppercase"
                            style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                letterSpacing: '0.5px',
                                height: '36px',
                                lineHeight: '36px'
                            }}
                        >
                            {topbarData.messages.map((message, index) => (
                                <React.Fragment key={`msg-1-${index}`}>
                                    {message}
                                    {index < topbarData.messages.length - 1 && <span className="mx-8">•</span>}
                                </React.Fragment>
                            ))}
                            <span className="mx-8">•</span>
                        </span>
                        {/* Duplicate set for seamless loop */}
                        <span
                            className="inline-flex items-center uppercase"
                            style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                letterSpacing: '0.5px',
                                height: '36px',
                                lineHeight: '36px'
                            }}
                        >
                            {topbarData.messages.map((message, index) => (
                                <React.Fragment key={`msg-2-${index}`}>
                                    {message}
                                    {index < topbarData.messages.length - 1 && <span className="mx-8">•</span>}
                                </React.Fragment>
                            ))}
                            <span className="mx-8">•</span>
                        </span>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/30 rounded-full p-1.5 transition-colors border border-white/30"
                        aria-label="Close banner"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-royal-red)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </>
    );
};

export default TopMarquee;
