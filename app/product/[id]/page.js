"use client";

import { useState } from "react";
import Image from "next/image";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import RecommendedProducts from "@/components/RecommendedProducts/RecommendedProducts";
import { productData as product } from "./mockData";

export default function ProductDetailsPage() {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.product_variants[0]?.name);
  
  // Find the selected variant to get child variants (length)
  const activeVariant = product.product_variants.find(v => v.name === selectedSize);
  const childVariants = activeVariant?.child_variants || [];
  
  const [selectedLength, setSelectedLength] = useState(childVariants[0]?.name || null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  // Determine actual display price
  const displayPrice = activeVariant ? Number(activeVariant.price) : product.retails_price;

  return (
    <>
      <Header />
      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12 py-6 md:py-10">
        {/* Breadcrumbs */}
        <nav className="flex text-xs md:text-sm text-[#6B6B6B] mb-6 md:mb-10 font-medium">
          <ol className="flex items-center space-x-2">
            <li><a href="/" className="hover:text-[#E8611A] transition-colors">Home</a></li>
            <li><span className="mx-1 md:mx-2 text-[#E5E5E5]">/</span></li>
            <li><a href="#" className="hover:text-[#E8611A] transition-colors">Men</a></li>
            <li><span className="mx-1 md:mx-2 text-[#E5E5E5]">/</span></li>
            <li><a href="#" className="hover:text-[#E8611A] transition-colors">Jeans</a></li>
            <li><span className="mx-1 md:mx-2 text-[#E5E5E5]">/</span></li>
            <li className="text-[#1A1A1A] truncate max-w-[120px] sm:max-w-none">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">
          
          {/* Left Column: Image Gallery (Takes 7 columns on Desktop) */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 md:gap-6 lg:sticky lg:top-24">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto scrollbar-hide shrink-0 pb-2 md:pb-0 w-full md:w-20 xl:w-24">
              {product.image_paths.map((img, index) => (
                <button 
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`relative w-20 md:w-full aspect-[3/4] shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${
                    activeImage === index 
                      ? 'ring-2 ring-[#E8611A] ring-offset-2 opacity-100' 
                      : 'border border-[#E5E5E5] opacity-70 hover:opacity-100 hover:border-[#999999]'
                  }`}
                >
                  <Image src={img} alt={`Thumbnail ${index + 1}`} fill unoptimized className="object-cover" />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="relative w-full aspect-[4/5] md:aspect-[3/4] bg-[#F8F8F6] rounded-2xl overflow-hidden shadow-sm">
              <Image 
                src={product.image_paths[activeImage]} 
                alt={product.name}
                fill
                priority
                unoptimized
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          {/* Right Column: Product Details (Takes 5 columns on Desktop) */}
          <div className="lg:col-span-5 flex flex-col w-full">
            
            {/* Header section */}
            <div className="mb-6">
              <h3 className="text-[#E8611A] font-bold tracking-widest uppercase text-xs mb-3">{product.brand_name}</h3>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1A1A1A] mb-4 leading-[1.2]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {product.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="flex text-[#F59E0B]">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <span className="font-medium text-[#6B6B6B] underline decoration-[#E5E5E5] underline-offset-4">
                    ({product.review_summary.total_reviews} Review)
                  </span>
                </div>
                <span className="w-1 h-1 rounded-full bg-[#E5E5E5]"></span>
                <span className="text-[#999999] font-medium">SKU: {product.sku}</span>
              </div>
            </div>

            {/* Price section */}
            <div className="mb-8 p-5 bg-[#F8F8F6] rounded-2xl border border-[#E5E5E5]/50">
              <div className="flex items-end gap-3 mb-2">
                <span className="text-3xl xl:text-4xl font-black text-[#1A1A1A] tracking-tight">
                  ৳{displayPrice.toLocaleString()}
                </span>
                {product.discount > 0 && (
                  <>
                    <span className="text-xl text-[#999999] line-through font-semibold mb-1">
                      ৳{product.retails_price.toLocaleString()}
                    </span>
                    <span className="bg-[#E8611A] text-white text-xs font-bold px-2.5 py-1 rounded-md mb-1.5 shadow-sm">
                      -{product.discount}%
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8611A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E8611A]"></span>
                </span>
                <p className="text-sm text-[#1A1A1A] font-bold">
                  In Stock <span className="font-medium text-[#6B6B6B]">({activeVariant?.quantity || product.current_stock} available)</span>
                </p>
              </div>
            </div>

            {/* Color */}
            <div className="mb-8 border-b border-[#E5E5E5] pb-8">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wide">
                  Color
                </h4>
                <span className="text-sm font-medium text-[#6B6B6B] capitalize">{product.color[0]}</span>
              </div>
              <div className="flex items-center gap-3">
                <button className="w-12 h-12 rounded-full border-2 border-[#1A1A1A] p-0.5 transition-all outline-none ring-2 ring-offset-2 ring-transparent focus:ring-[#E8611A]">
                  <div className="w-full h-full rounded-full shadow-inner" style={{ backgroundColor: product.color_code }}></div>
                </button>
              </div>
            </div>

            {/* Waist Size */}
            <div className="mb-8 border-b border-[#E5E5E5] pb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wide">
                  Select Waist <span className="text-[#6B6B6B] font-normal lowercase">(inches)</span>
                </h4>
                <button className="text-sm text-[#E8611A] font-bold hover:underline underline-offset-4 transition-all">
                  Size Guide
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 xl:grid-cols-6 gap-3">
                {product.product_variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => {
                      setSelectedSize(variant.name);
                      setSelectedLength(variant.child_variants[0]?.name || null);
                    }}
                    disabled={variant.quantity <= 0}
                    className={`h-12 flex items-center justify-center rounded-xl text-sm font-bold transition-all border
                      ${selectedSize === variant.name 
                        ? "border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-md" 
                        : "border-[#E5E5E5] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]"
                      }
                      ${variant.quantity <= 0 ? "opacity-40 cursor-not-allowed border-dashed bg-gray-50 text-[#999999] hover:border-[#E5E5E5]" : ""}
                    `}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Length Size */}
            {childVariants.length > 0 && (
              <div className="mb-8 border-b border-[#E5E5E5] pb-8">
                <h4 className="text-sm font-bold text-[#1A1A1A] mb-4 uppercase tracking-wide">
                  Select Length <span className="text-[#6B6B6B] font-normal lowercase">(inches)</span>
                </h4>
                <div className="flex flex-wrap gap-3">
                  {childVariants.map((lengthVariant) => (
                    <button
                      key={lengthVariant.id}
                      onClick={() => setSelectedLength(lengthVariant.name)}
                      className={`px-6 h-12 flex items-center justify-center rounded-xl text-sm font-bold transition-all border
                        ${selectedLength === lengthVariant.name 
                          ? "border-[#E8611A] bg-[#FFF3ED] text-[#E8611A] shadow-sm" 
                          : "border-[#E5E5E5] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]"
                        }
                      `}
                    >
                      {lengthVariant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions: Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {/* Quantity */}
              <div className="flex items-center justify-between border-2 border-[#E5E5E5] rounded-xl px-4 h-14 bg-white w-full sm:w-32 shrink-0">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-[#6B6B6B] hover:text-[#E8611A] text-2xl font-light w-8 flex justify-center pb-1 transition-colors"
                >−</button>
                <span className="font-bold text-[#1A1A1A] text-lg">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-[#6B6B6B] hover:text-[#E8611A] text-2xl font-light w-8 flex justify-center pb-1 transition-colors"
                >+</button>
              </div>

              {/* Buttons Container */}
              <div className="flex w-full gap-4">
                {/* Add to Cart */}
                <button className="flex-1 bg-[#1A1A1A] text-white h-14 rounded-xl font-bold text-base hover:bg-[#E8611A] hover:shadow-xl hover:shadow-[#E8611A]/20 transition-all duration-300 flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  Add to Cart
                </button>

                {/* Wishlist */}
                <button className="w-14 h-14 border-2 border-[#E5E5E5] rounded-xl flex items-center justify-center text-[#1A1A1A] hover:bg-[#FFF3ED] hover:text-[#E8611A] hover:border-[#E8611A] transition-all duration-300 shrink-0 group">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:scale-110 transition-transform">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 flex gap-3 shadow-sm hover:border-[#1A1A1A] transition-colors">
                <div className="text-[#E8611A] shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                </div>
                <div>
                  <h5 className="font-bold text-[#1A1A1A] text-sm mb-0.5">Fast Delivery</h5>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed">Estimated in 3-5 days.</p>
                </div>
              </div>
              <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 flex gap-3 shadow-sm hover:border-[#1A1A1A] transition-colors">
                <div className="text-[#E8611A] shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
                <div>
                  <h5 className="font-bold text-[#1A1A1A] text-sm mb-0.5">Return Policy</h5>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed">{product.return_delivery_days}</p>
                </div>
              </div>
            </div>

            {/* Tabs: Description & Specs */}
            <div className="border border-[#E5E5E5] rounded-2xl overflow-hidden bg-white">
              <div className="flex border-b border-[#E5E5E5]">
                <button 
                  onClick={() => setActiveTab("description")}
                  className={`flex-1 py-4 text-sm font-bold transition-all relative ${
                    activeTab === "description" 
                      ? "text-[#1A1A1A]" 
                      : "text-[#999999] hover:text-[#1A1A1A] hover:bg-gray-50"
                  }`}
                >
                  Description
                  {activeTab === "description" && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E8611A]"></span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab("specs")}
                  className={`flex-1 py-4 text-sm font-bold transition-all relative ${
                    activeTab === "specs" 
                      ? "text-[#1A1A1A]" 
                      : "text-[#999999] hover:text-[#1A1A1A] hover:bg-gray-50"
                  }`}
                >
                  Specifications
                  {activeTab === "specs" && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E8611A]"></span>
                  )}
                </button>
              </div>
              
              <div className="p-6 md:p-8 bg-gray-50/50">
                {activeTab === "description" ? (
                  <div 
                    className="prose prose-sm max-w-none text-[#4A4A4A] prose-p:leading-loose marker:text-[#E8611A]"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <div className="space-y-4">
                    {product.specifications.map((spec, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E5E5]/60 last:border-0 last:pb-0 gap-1">
                        <span className="text-[#6B6B6B] font-medium text-sm">{spec.name}</span>
                        <span className="text-[#1A1A1A] font-bold text-sm sm:text-right">{spec.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </main>
      
      {/* Similar Products Section */}
      <div className="bg-[#F8F8F6] border-t border-[#E5E5E5]/50 pb-10">
        <RecommendedProducts />
      </div>

      <Footer />
    </>
  );
}
