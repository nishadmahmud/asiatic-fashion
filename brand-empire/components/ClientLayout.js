"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import MobileBottomNav from "./MobileBottomNav";
import Navbar from "./Navbar";
import TopMarquee from "./TopMarquee";
import Footer from "./Footer";
import AuthModal from "./AuthModal";
import CartModal from "./CartModal";
import FloatingIcons from "./FloatingIcons";
import FloatingIconsMobile from "./FloatingIconsMobile";
import GTMPageViewTracker from "./GTMPageViewTracker";
import { Toaster } from "react-hot-toast";

export default function ClientLayout({ children }) {
    const pathname = usePathname();
    const [marqueeActive, setMarqueeActive] = useState(false);
    const [isMarqueeClosed, setIsMarqueeClosed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // State for Mobile Sidebar

    // Pages where marquee should be hidden
    const noMarqueeRoutes = ["/checkout", "/order-success", "/track-order"];
    const shouldShowMarquee = !noMarqueeRoutes.includes(pathname);

    // Dynamic padding logic to avoid gaps or overlaps
    // Navbar only shifts down if marquee is supposed to be shown AND it is actually active (loaded) AND not closed by user
    const finalMarqueeVisible = shouldShowMarquee && marqueeActive && !isMarqueeClosed;

    return (
        <div className="flex flex-col min-h-screen">
            <GTMPageViewTracker />
            {shouldShowMarquee && !isMarqueeClosed && (
                <TopMarquee
                    onReady={() => setMarqueeActive(true)}
                    onClose={() => {
                        setIsMarqueeClosed(true);
                        setMarqueeActive(false);
                    }}
                />
            )}

            {/* Global Floating Elements */}
            <CartModal />
            <AuthModal />
            
            {/* Desktop Floating Icon - Hidden on Mobile */}
            <div className="hidden lg:block">
                <FloatingIcons />
            </div>
            
            {/* Mobile Floating Icon - Hidden on Desktop */}
            <div className="lg:hidden">
                <FloatingIconsMobile />
            </div>

            <Navbar
                marqueeVisible={finalMarqueeVisible}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
            />
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        zIndex: 10000,
                    },
                }}
                containerStyle={{
                    top: 88,
                    right: 16,
                    zIndex: 10000,
                }}
            />
            <main
                className={`flex-grow transition-all duration-300 pb-20 lg:pb-0 ${finalMarqueeVisible ? 'pt-[106px] md:pt-[106px]' : 'pt-[60px] md:pt-[70px]'}`}
            >
                {children}
            </main>
            <Footer />
            <MobileBottomNav onOpenCategories={() => setMobileMenuOpen(true)} />
        </div>
    );
}
