import CuratedCollectionPage from "@/components/CuratedCollectionPage/CuratedCollectionPage";

export const metadata = {
  title: "Best Sellers | Asiatic Fashion",
  description: "Browse every best seller in one place.",
};

export default function BestSellersPage() {
  return <CuratedCollectionPage mode="best-sellers" />;
}
