"use client";

import { use } from "react";
import ProductDetailsPage from "@/components/ProductDetailsPage";

export default function ProductDetails({ params }) {
    const { id } = use(params);

    return (
        <div className="pt-0 md:pt-4 transition-all duration-300">
            <ProductDetailsPage productId={id} />
        </div>
    );
}
