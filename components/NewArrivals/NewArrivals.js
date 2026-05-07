import Image from "next/image";

const arrivals = [
  {
    id: 1,
    name: "Urban Explorer Hoodie",
    price: 85,
    image: "/images/products/hoodie.png",
    isNew: true,
  },
  {
    id: 2,
    name: "Classic Leather Loafers",
    price: 145,
    image: "/images/products/watch.png",
    isNew: true,
  },
  {
    id: 3,
    name: "Minimalist Linen Shirt",
    price: 65,
    image: "/images/products/casual_shirt.png",
    isNew: true,
  },
  {
    id: 4,
    name: "Oversized Denim Jacket",
    price: 115,
    image: "/images/products/jacket.png",
    isNew: true,
  },
];

export default function NewArrivals() {
  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 py-10 md:py-16">
      <div className="flex items-end justify-between mb-8 md:mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            New Arrivals
          </h2>
          <p className="text-[#6B6B6B] text-sm md:text-base">
            Discover the latest trends straight from the runway.
          </p>
        </div>
        <a href="#" className="hidden sm:flex items-center gap-1 text-[#E8611A] font-semibold hover:gap-2 transition-all">
          View All Collection
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {arrivals.map((product) => (
          <div key={product.id} className="group cursor-pointer">
            <div className="relative aspect-[3/4] bg-[#F8F8F6] rounded-2xl overflow-hidden mb-4">
              <Image
                src={product.image}
                alt={product.name}
                fill
                unoptimized
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
              {product.isNew && (
                <div className="absolute top-4 left-4 bg-[#1A1A1A] text-white text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider z-10">
                  NEW
                </div>
              )}
              
              {/* Quick Add overlay */}
              <div className="absolute inset-x-4 bottom-4 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
                <button className="w-full bg-white/90 backdrop-blur-sm text-[#1A1A1A] font-semibold py-3 rounded-xl hover:bg-[#E8611A] hover:text-white transition-colors shadow-lg">
                  Quick Add
                </button>
              </div>
            </div>
            
            <h3 className="font-medium text-[#1A1A1A] text-lg mb-1 group-hover:text-[#E8611A] transition-colors">
              {product.name}
            </h3>
            <p className="font-bold text-[#6B6B6B]">${product.price}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
