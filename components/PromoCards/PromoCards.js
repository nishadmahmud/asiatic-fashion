import Image from "next/image";

const cards = [
  {
    title: "Where dreams meet couture",
    bg: "bg-[#F5EDDA]",
    image: "/images/promo/promo_couture.png",
    alt: "Elegant couture fashion",
  },
  {
    title: "Enchanting styles for every women",
    bg: "bg-[#F8E4E4]",
    image: "/images/promo/promo_women.png",
    alt: "Smart casual fashion style",
  },
];

export default function PromoCards() {
  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 py-4 md:py-6" id="promo-section">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`${card.bg} rounded-2xl overflow-hidden flex items-stretch min-h-[180px] md:min-h-[220px] group cursor-pointer hover:shadow-lg transition-shadow duration-300`}
          >
            {/* Text */}
            <div className="flex flex-col justify-end p-5 md:p-7 flex-1">
              <h3
                className="text-xl md:text-2xl lg:text-[26px] font-bold text-[#1A1A1A] leading-snug max-w-[200px]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {card.title}
              </h3>
              <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-[#1A1A1A] text-xs font-semibold rounded-full border border-[#E5E5E5] hover:bg-[#1A1A1A] hover:text-white transition-all duration-300 w-fit">
                Shop Now
              </button>
            </div>

            {/* Image */}
            <div className="relative w-[45%] min-w-[140px]">
              <Image
                src={card.image}
                alt={card.alt}
                fill
                unoptimized
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 45vw, 25vw"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
