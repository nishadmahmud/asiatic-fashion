import Image from "next/image";

export default function OffersBanner() {
  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12" id="offers-section">
      <div className="relative rounded-2xl overflow-hidden min-h-[200px] md:min-h-[280px]">
        {/* Background Image */}
        <Image
          src="/images/offers/offers_bg.png"
          alt="Fashion offers background"
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1280px"
        />

        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-pink-700/50" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center h-full min-h-[200px] md:min-h-[280px] p-6 md:p-12">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full mb-4 border border-white/30">
            Offers
          </span>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight max-w-2xl">
            EXCLUSIVE FASHION
            <br />
            OFFERS AWAIT FOR YOU
          </h2>
          <a
            href="#"
            className="inline-flex items-center gap-2 mt-6 md:mt-8 px-6 py-3 bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white text-sm font-semibold rounded-full border border-white/30 transition-all duration-300 hover:-translate-y-0.5 group"
            id="offers-cta"
          >
            CHECK IT NOW
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
