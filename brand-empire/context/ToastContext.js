"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import Image from 'next/image';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);

    // Polymorphic showToast
    // - If passed a product object (has 'images' or 'name' but NOT 'message'), show "Added to Bag"
    // - If passed { message, type }, show generic toast
    const showToast = useCallback((payload) => {
        setToast(payload);
        setTimeout(() => {
            setToast(null);
        }, 3000);
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    // Determine toast type
    const isMessageToast = toast && toast.message && toast.type;
    const isProductToast = toast && !toast.message && (toast.images || toast.name);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}

            {/* Generic Message Toast */}
            {isMessageToast && (
                <div className="fixed top-32 right-6 z-[200] animate-slideInRight">
                    <div className={`text-white rounded-lg shadow-2xl flex items-center gap-3 px-4 py-3 min-w-[300px] ${toast.type === 'success' ? 'bg-[#1a1a1a]' : toast.type === 'error' ? 'bg-[var(--brand-royal-red)]' : toast.type === 'info' ? 'bg-[#1a1a1a]' : 'bg-[#1a1a1a]'}`}>
                        {/* Icon */}
                        <div className={`flex-shrink-0 ${toast.type === 'success' ? 'text-green-400' : toast.type === 'info' ? 'text-[var(--brand-royal-red)]' : 'text-white'}`}>
                            {toast.type === 'success' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                            )}
                            {toast.type === 'error' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                            )}
                            {toast.type === 'info' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                            )}
                        </div>

                        {/* Text */}
                        <div className="flex-1">
                            <p className="font-bold text-sm">{toast.message}</p>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={hideToast}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Product "Added to Bag" Toast */}
            {isProductToast && (
                <div className="fixed top-32 right-6 z-[200] animate-slideInRight">
                    <div className="bg-[#2d3436] text-white rounded-lg shadow-2xl flex items-center gap-3 px-4 py-3 min-w-[300px]">
                        {/* Product Image */}
                        <div className="w-12 h-12 bg-white rounded flex-shrink-0 overflow-hidden">
                            <Image
                                src={toast.images?.[0] || '/api/placeholder/48/48'}
                                alt={toast.name || "Product Image"}
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                            />
                        </div>

                        {/* Text */}
                        <div className="flex-1">
                            <p className="font-bold text-sm">Added to bag</p>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={hideToast}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                .animate-slideInRight {
                    animation: slideInRight 0.3s ease-out;
                }
            `}</style>
        </ToastContext.Provider>
    );
};

