// src/components/BannerCarousel.tsx
//
// Template-aware like HeroSection.tsx — activeTemplate picks which hand-built layout
// renders the SAME PROMO_BANNER rows (see companySettings.controller.ts's
// SECTION_TEMPLATE_KEYS: this section has no per-template content, only layout).
// Template1 below is byte-for-byte the auto-scrolling marquee that existed before this
// split — its scroll-measurement/hover-pause logic is specific to that one presentation,
// so it lives inside Template1 rather than the outer data-fetching component.

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "../utils/api";

interface PromoBanner {
  id: string;
  image: string;
  title: string;
  discount?: string | null;
  description?: string | null;
}

interface TemplateProps {
  banners: PromoBanner[];
}

const Template1 = ({ banners }: TemplateProps) => {
  const [scrollWidth, setScrollWidth] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (banners.length === 0) return;

    const measure = () => {
      if (trackRef.current && trackRef.current.children.length > banners.length) {
        const first = trackRef.current.children[0] as HTMLElement;
        const target = trackRef.current.children[banners.length] as HTMLElement;
        if (first && target) {
          setScrollWidth(target.offsetLeft - first.offsetLeft);
        }
      }
    };

    const frameId = requestAnimationFrame(() => {
      measure();
    });
    const timeoutId = setTimeout(measure, 100);

    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
      window.removeEventListener("resize", measure);
    };
  }, [banners]);

  const repeated = [...banners, ...banners, ...banners, ...banners, ...banners, ...banners];
  const duration = Math.max(banners.length * 6, 16);

  return (
    <section className="w-full py-6 sm:py-8 bg-white overflow-hidden">
      <style>{`
        @keyframes banner-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(var(--scroll-width, 0px)); }
        }
        .banner-scroll-track {
          display: flex;
          will-change: transform;
        }
      `}</style>

      <div className="overflow-hidden w-[90vw] mx-auto">
        <div
          ref={trackRef}
          className="banner-scroll-track"
          onMouseEnter={() => {
            if (!window.matchMedia("(pointer: coarse)").matches) {
              setIsHovered(true);
            }
          }}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
          onTouchCancel={() => setIsHovered(false)}
          style={{
            display: "flex",
            animationName: scrollWidth > 0 ? "banner-scroll" : "none",
            animationDuration: `${duration}s`,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationPlayState: isHovered ? "paused" : "running",
            "--scroll-width": `-${scrollWidth}px`,
          } as React.CSSProperties}
        >
          {repeated.map((b, i) => (
            <div
              key={`${b.id}-${i}`}
              className="flex-none overflow-hidden bg-gray-100 rounded-xl shrink-0 w-[140px] sm:w-[220px] md:w-[280px] lg:w-[380px] h-[90px] sm:h-[130px] md:h-[160px] lg:h-[220px] mr-3"
            >
              <img
                src={b.image}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Template 2: Static Grid ────────────────────────────────────────────────────
// A calm responsive grid instead of a continuously-scrolling marquee — each card shows
// title/discount as a text overlay (the marquee never surfaced this data at all).
const Template2 = ({ banners }: TemplateProps) => (
  <section className="w-full py-8 sm:py-10 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {banners.map((b) => (
          <div key={b.id} className="relative overflow-hidden rounded-xl bg-gray-100 aspect-[4/5] group">
            <img src={b.image} alt={b.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            {(b.title || b.discount) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-3">
                {b.title && <p className="text-white text-xs font-bold uppercase tracking-wide truncate">{b.title}</p>}
                {b.discount && <p className="text-white/90 text-[11px] font-semibold mt-0.5">{b.discount}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Template 3: Full-bleed Slider ──────────────────────────────────────────────
// One large banner at a time, auto-advancing, with dot indicators and manual arrows —
// a more immersive/dramatic treatment than the small-thumbnail marquee.
const Template3 = ({ banners }: TemplateProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const banner = banners[index];
  if (!banner) return null;

  return (
    <section className="w-full py-6 sm:py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative w-full aspect-[16/7] min-h-[220px] rounded-2xl overflow-hidden bg-gray-100">
          <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
          {(banner.title || banner.discount || banner.description) && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex flex-col justify-end p-6 sm:p-10">
              {banner.title && <h3 className="text-white text-xl sm:text-3xl font-bold tracking-tight">{banner.title}</h3>}
              {banner.discount && <p className="text-white/90 text-sm sm:text-base font-semibold mt-1">{banner.discount}</p>}
              {banner.description && <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-md">{banner.description}</p>}
            </div>
          )}

          {banners.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
                aria-label="Previous banner"
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-gray-900 hover:bg-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % banners.length)}
                aria-label="Next banner"
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-gray-900 hover:bg-white transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Show banner ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

// ─── Template 4: Split Showcase ────────────────────────────────────────────────
// Two large side-by-side cards instead of many small ones — an editorial feel for
// stores running just a couple of hero-worthy promotions rather than many small ones.
const Template4 = ({ banners }: TemplateProps) => {
  const shown = banners.slice(0, 2);
  return (
    <section className="w-full py-8 sm:py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid gap-5 ${shown.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
          {shown.map((b) => (
            <div key={b.id} className="relative overflow-hidden rounded-2xl bg-gray-100 aspect-[4/3] group">
              <img src={b.image} alt={b.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              {(b.title || b.discount || b.description) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent flex flex-col justify-end p-6">
                  {b.title && <h3 className="text-white text-lg sm:text-xl font-bold tracking-tight">{b.title}</h3>}
                  {b.discount && <p className="text-white/90 text-sm font-semibold mt-1">{b.discount}</p>}
                  {b.description && <p className="text-white/70 text-xs mt-1 max-w-xs">{b.description}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default function BannerCarousel() {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState(1);

  useEffect(() => {
    api
      .get("/home-banners?type=PROMO_BANNER")
      .then(({ data }) => {
        const active: PromoBanner[] = (data.banners ?? [])
          .filter((b: any) => b.isActive)
          .map((b: any) => ({
            id: b.id,
            image: b.image,
            title: b.title,
            discount: b.discount,
            description: b.description,
          }));
        setBanners(active);
      })
      .catch(() => { })
      .finally(() => setLoading(false));

    api
      .get("/home-banners/homepage-config")
      .then(({ data }) => {
        if (typeof data?.carouselTemplate === "number") {
          setActiveTemplate(data.carouselTemplate);
        }
      })
      .catch(() => { });
  }, []);

  if (loading || banners.length === 0) return null;

  switch (activeTemplate) {
    case 2:
      return <Template2 banners={banners} />;
    case 3:
      return <Template3 banners={banners} />;
    case 4:
      return <Template4 banners={banners} />;
    default:
      return <Template1 banners={banners} />;
  }
}
