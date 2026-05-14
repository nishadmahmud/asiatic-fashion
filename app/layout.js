import { Inter, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartProvider } from "@/context/CartContext";
import { CategoriesProvider } from "@/context/CategoriesContext";
import AuthDrawer from "@/components/AuthDrawer/AuthDrawer";
import CartSidebar from "@/components/CartSidebar/CartSidebar";
import MobileBottomNav from "@/components/MobileBottomNav/MobileBottomNav";
import WelcomePopup from "@/components/WelcomePopup/WelcomePopup";
import ScrollToTop from "@/components/ScrollToTop/ScrollToTop";
import FloatingWhatsApp from "@/components/FloatingWhatsApp/FloatingWhatsApp";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Asiatic Fashion | Premium Clothing & Fashion Brand",
  description:
    "Discover quality fashion that reflects your style. Shop the latest collections of men's, women's and children's clothing at Asiatic Fashion.",
  keywords: "fashion, clothing, Asiatic Fashion, men, women, children, style",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="pb-16 md:pb-0">
        <AuthProvider>
          <WishlistProvider>
            <CategoriesProvider>
              <CartProvider>
                <ScrollToTop />
                {children}
                <AuthDrawer />
                <CartSidebar />
                <MobileBottomNav />
                <FloatingWhatsApp />
                <WelcomePopup />
              </CartProvider>
            </CategoriesProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
