import CuratedCollectionPage from "@/components/CuratedCollectionPage/CuratedCollectionPage";

export const metadata = {
  title: "Best Deals | Asiatic Fashion",
  description: "Browse every best deal in one place.",
};

export default function BestDealsPage() {
  return <CuratedCollectionPage mode="best-deals" />;
}
