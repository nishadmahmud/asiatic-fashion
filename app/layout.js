import { Inter, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import AuthDrawer from "@/components/AuthDrawer/AuthDrawer";
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
      <body>
        <AuthProvider>
          <WishlistProvider>
            {children}
            <AuthDrawer />
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
