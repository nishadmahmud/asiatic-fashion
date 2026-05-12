import Header from "@/components/Header/Header";
import HeroBanner from "@/components/HeroBanner/HeroBanner";
import PromoCards from "@/components/PromoCards/PromoCards";
import NewArrivals from "@/components/NewArrivals/NewArrivals";
import PopularProducts from "@/components/PopularProducts/PopularProducts";
import BestDeals from "@/components/BestDeals/BestDeals";
import FlashSale from "@/components/FlashSale/FlashSale";
import BrandsSection from "@/components/BrandsSection/BrandsSection";
import Newsletter from "@/components/Newsletter/Newsletter";
import Footer from "@/components/Footer/Footer";
import { getCategoriesFromServer } from "@/lib/api";

export default async function Home() {
  let initialCategories = [];
  try {
    const response = await getCategoriesFromServer();
    if (response?.success && Array.isArray(response?.data)) {
      initialCategories = response.data;
    }
  } catch (error) {
    // Keep homepage usable even if category API fails.
    initialCategories = [];
  }

  return (
    <>
      <Header initialCategories={initialCategories} />
      <main>
        <HeroBanner initialCategories={initialCategories} attachCategoryNav />
        <BrandsSection />
        <PromoCards />
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
