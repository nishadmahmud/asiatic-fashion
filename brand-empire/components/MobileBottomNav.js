"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const MobileBottomNav = ({ onOpenCategories }) => {
    const pathname = usePathname();
    const router = useRouter();
    const { user, openAuthModal } = useAuth();

    const isActive = (path) => pathname === path;

    const handleProfileClick = () => {
        if (user) {
            router.push('/profile');
        } else {
            openAuthModal('login');
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[60] lg:hidden h-16 safe-area-pb">
            <div className="grid grid-cols-4 h-full">
                {/* Home */}
                <Link href="/" className={`flex flex-col items-center justify-center gap-1 ${isActive('/') ? 'text-[var(--brand-royal-red)]' : 'text-gray-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive('/') ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <span className="text-[10px] font-bold uppercase">Home</span>
                </Link>

                {/* Categories */}
                <Link href="/categories" className={`flex flex-col items-center justify-center gap-1 ${isActive('/categories') ? 'text-[var(--brand-royal-red)]' : 'text-gray-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive('/categories') ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    <span className="text-[10px] font-bold uppercase">Categories</span>
                </Link>

                {/* Offers/Studio */}
                <Link href="/offers" className={`flex flex-col items-center justify-center gap-1 ${isActive('/offers') ? 'text-[var(--brand-royal-red)]' : 'text-gray-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive('/offers') ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span className="text-[10px] font-bold uppercase">Offers</span>
                </Link>

                {/* Profile */}
                <button
                    onClick={handleProfileClick}
                    className={`flex flex-col items-center justify-center gap-1 ${isActive('/profile') || (user && isActive('/login')) ? 'text-[var(--brand-royal-red)]' : 'text-gray-500'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive('/profile') || isActive('/login') ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span className="text-[10px] font-bold uppercase">{user ? "Profile" : "Login"}</span>
                </button>
            </div>
        </div>
    );
};

export default MobileBottomNav;
