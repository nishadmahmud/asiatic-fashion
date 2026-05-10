import Header from "@/components/Header/Header";
import HeroBanner from "@/components/HeroBanner/HeroBanner";
import PromoCards from "@/components/PromoCards/PromoCards";
import CategorySection from "@/components/CategorySection/CategorySection";
import NewArrivals from "@/components/NewArrivals/NewArrivals";
import PopularProducts from "@/components/PopularProducts/PopularProducts";
import BestDeals from "@/components/BestDeals/BestDeals";
import FlashSale from "@/components/FlashSale/FlashSale";
import BrandsSection from "@/components/BrandsSection/BrandsSection";
import Newsletter from "@/components/Newsletter/Newsletter";
import Footer from "@/components/Footer/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroBanner />
        <BrandsSection />
        <PromoCards />
        <CategorySection />
        <NewArrivals />
        <PopularProducts />
        <BestDeals />
        <FlashSale />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
