import CuratedCollectionPage from "@/components/CuratedCollectionPage/CuratedCollectionPage";

export const metadata = {
  title: "New Arrivals | Asiatic Fashion",
  description: "Browse every new arrival in one place.",
};

export default function NewArrivalsPage() {
  return <CuratedCollectionPage mode="new-arrivals" />;
}
