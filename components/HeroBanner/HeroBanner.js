import Image from "next/image";

export default function HeroBanner() {
  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 py-4 md:py-6" id="hero-section">
      <div className="relative rounded-2xl overflow-hidden bg-gray-100 min-h-[300px] md:min-h-[480px] lg:min-h-[520px]">
        {/* Hero Image */}
        <Image
          src="/images/hero/hero_desktop.png"
          alt="Summer fashion collection - stylish man in beige suit"
          fill
          unoptimized
          priority
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1280px"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center h-full min-h-[300px] md:min-h-[480px] lg:min-h-[520px] p-6 md:p-12 lg:p-16">
          <div className="max-w-lg">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Summer Arrival
              <br />
              of Outfit
            </h1>
            <p className="mt-3 md:mt-4 text-sm md:text-base text-white/80 max-w-md leading-relaxed">
              Discover quality fashion that reflects your style and makes
              everyday enjoyable.
            </p>
            <a
              href="#products"
              className="inline-flex items-center gap-2 mt-5 md:mt-8 px-6 py-3 md:px-8 md:py-3.5 bg-[#E8611A] hover:bg-[#E8611A]-hover text-white text-sm md:text-base font-semibold rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-[#E8611A]/30 hover:-translate-y-0.5 group"
              id="hero-cta"
            >
              EXPLORE PRODUCT
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <svg
                  width="14"
                  height="14"
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
      </div>
    </section>
  );
}
