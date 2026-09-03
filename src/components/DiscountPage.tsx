// src/components/DiscountPage.tsx
//
// Template-aware like HeroSection.tsx — activeTemplate picks which hand-built layout
// renders the SAME DISCOUNT_PANEL rows (see companySettings.controller.ts's
// SECTION_TEMPLATE_KEYS: this section has no per-template content, only layout).
// Template1 below is byte-for-byte the left/right split-grid layout that existed before
// this split.

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

// Fallback local images used when no banners are configured in the backend
import image20 from "../assets/1020.jpeg";
import image21 from "../assets/1021.jpeg";
import image22 from "../assets/1022.jpeg";
import image23 from "../assets/1023.jpeg";

interface Banner {
  id: string;
  title: string;
  image: string;
  discount: string | null;
  description: string | null;
}

const FALLBACK_BANNERS: Banner[] = [
  { id: "f1", title: "Women's Collection", image: image20, discount: "20% OFF", description: "Elegant kurtas and dresses designed for comfort, grace, and everyday style" },
  { id: "f2", title: "Mohey Women's Festive Saree", image: image21, discount: "20% OFF", description: "Smart casuals and everyday essentials crafted for comfort and confidence." },
  { id: "f3", title: "Moda Women's Rapido Sarees", image: image23, discount: "25% OFF", description: null },
  { id: "f4", title: "Featured Collection", image: image22, discount: "25% OFF", description: "Our most-loved designs chosen for comfort." },
];

const FALLBACK_HEADER = {
  title: "SHOP NOW AND SAVE 30%",
  subtitle: "Grace at a Great Price! Sarees on Discount",
};

const ShopNowButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="px-6 py-2 border border-white text-white text-sm font-semibold uppercase tracking-wider hover:bg-white hover:text-black transition-colors duration-300"
  >
    Shop Now
  </button>
);

interface TemplateProps {
  banners: Banner[];
  header: typeof FALLBACK_HEADER;
  handleShopNow: () => void;
}

const Template1 = ({ banners, header, handleShopNow }: TemplateProps) => {
  // Panels: first two fill left/center columns; rest fill right column
  const leftPanels = banners.slice(0, 2);
  const rightPanels = banners.slice(2);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* --- HEADER SECTION --- */}
        <div className="mb-10">
          <h4 className="text-[var(--theme-accent)] font-bold uppercase tracking-wider text-sm mb-2">
            Discount
          </h4>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {header.title}
          </h2>
          <p className="text-gray-500 max-w-xl text-lg">{header.subtitle}</p>
        </div>

        {/* --- GRID LAYOUT --- */}
        {banners.length > 0 ? (
          <div
            className={`grid gap-6 h-auto lg:h-[600px] ${
              rightPanels.length === 0
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {/* Left panels (positions 0, 1) */}
            {leftPanels.map((panel, i) => (
              <div
                key={panel.id}
                className="relative group overflow-hidden h-[500px] lg:h-full rounded-none"
              >
                <img
                  src={panel.image}
                  alt={panel.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-10 left-8 text-white">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-2">
                    {panel.title}
                  </h3>
                  {panel.discount && (
                    <div className="text-5xl font-bold mb-4">{panel.discount}</div>
                  )}
                  {panel.description && (
                    <p className="text-gray-200 text-sm mb-6 max-w-[200px]">
                      {panel.description}
                    </p>
                  )}
                  <ShopNowButton onClick={handleShopNow} />
                </div>
              </div>
            ))}

            {/* Right column panels (positions 2+) */}
            {rightPanels.length > 0 && (
              <div className="flex flex-col gap-6 h-[600px] lg:h-full">
                {rightPanels.map((panel, i) => (
                  <div
                    key={panel.id}
                    className="relative group overflow-hidden flex-1 w-full"
                  >
                    <img
                      src={panel.image}
                      alt={panel.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                    <div
                      className={`absolute inset-0 flex flex-col justify-center px-8 text-white ${
                        i % 2 === 1 ? "items-end text-right" : ""
                      }`}
                    >
                      <h3 className="text-sm font-bold uppercase tracking-wider mb-1">
                        {panel.title}
                      </h3>
                      {panel.discount && (
                        <div className="text-4xl font-bold mb-3">{panel.discount}</div>
                      )}
                      {panel.description && (
                        <p className="text-gray-200 text-xs mb-5 max-w-[200px]">
                          {panel.description}
                        </p>
                      )}
                      <div>
                        <ShopNowButton onClick={handleShopNow} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 max-w-3xl mx-auto mt-8 px-6">
            <div className="w-16 h-16 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Active Promotions</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
              We don't have any active discount events right now. Please check back later or explore our regular collections.
            </p>
            <button
              onClick={handleShopNow}
              className="px-6 py-2.5 bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] text-sm font-semibold uppercase tracking-wider hover:bg-[var(--theme-primary-hover)] transition-colors rounded-xl shadow-md cursor-pointer"
            >
              Explore Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Shared header block — every new template below uses the identical header, only the
// panel grid underneath differs.
const DiscountHeader = ({ header }: { header: typeof FALLBACK_HEADER }) => (
  <div className="mb-10">
    <h4 className="text-[var(--theme-accent)] font-bold uppercase tracking-wider text-sm mb-2">
      Discount
    </h4>
    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{header.title}</h2>
    <p className="text-gray-500 max-w-xl text-lg">{header.subtitle}</p>
  </div>
);

// ─── Template 2: Masonry ────────────────────────────────────────────────────────
// Varied-height cards in a masonry column layout — a more organic, less rigidly-gridded
// feel than Template1's fixed left/right split.
const Template2 = ({ banners, header, handleShopNow }: TemplateProps) => (
  <div className="min-h-screen bg-white font-sans text-gray-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <DiscountHeader header={header} />
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
        {banners.map((panel, i) => (
          <div
            key={panel.id}
            className="relative group overflow-hidden rounded-2xl mb-6 break-inside-avoid"
            style={{ aspectRatio: i % 3 === 0 ? "3/4" : i % 3 === 1 ? "1/1" : "4/5" }}
          >
            <img
              src={panel.image}
              alt={panel.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-1">{panel.title}</h3>
              {panel.discount && <div className="text-3xl font-bold mb-2">{panel.discount}</div>}
              <ShopNowButton onClick={handleShopNow} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Template 3: Ticker Strip ───────────────────────────────────────────────────
// A single horizontal row of compact cards — the simplest, most condensed treatment,
// good for a store running many small promotions rather than a few hero-sized ones.
const Template3 = ({ banners, header, handleShopNow }: TemplateProps) => (
  <div className="min-h-screen bg-white font-sans text-gray-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <DiscountHeader header={header} />
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: "none" }}>
        {banners.map((panel) => (
          <div
            key={panel.id}
            className="relative group overflow-hidden rounded-xl shrink-0 w-56 sm:w-64 aspect-[3/4]"
          >
            <img
              src={panel.image}
              alt={panel.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h3 className="text-[11px] font-bold uppercase tracking-wider truncate">{panel.title}</h3>
              {panel.discount && <div className="text-xl font-bold mt-1">{panel.discount}</div>}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handleShopNow}
        className="mt-8 px-6 py-2.5 bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] text-sm font-semibold uppercase tracking-wider hover:bg-[var(--theme-primary-hover)] transition-colors rounded-xl shadow-md"
      >
        Shop All Offers
      </button>
    </div>
  </div>
);

// ─── Template 4: Badge Grid ─────────────────────────────────────────────────────
// Uniform square cards, each with a large prominent discount badge in the corner —
// clean, catalog-style e-commerce grid rather than photo-led editorial panels.
const Template4 = ({ banners, header, handleShopNow }: TemplateProps) => (
  <div className="min-h-screen bg-white font-sans text-gray-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <DiscountHeader header={header} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {banners.map((panel) => (
          <button
            key={panel.id}
            onClick={handleShopNow}
            className="relative group overflow-hidden rounded-2xl aspect-square text-left cursor-pointer"
          >
            <img
              src={panel.image}
              alt={panel.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors" />
            {panel.discount && (
              <span
                className="absolute top-3 right-3 rounded-full px-3 py-1.5 text-xs font-black shadow-md"
                style={{ background: "var(--theme-accent)", color: "var(--theme-accent-ink)" }}
              >
                {panel.discount}
              </span>
            )}
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-white text-xs font-bold uppercase tracking-wider truncate">{panel.title}</h3>
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

const DiscountPage = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [header, setHeader] = useState(FALLBACK_HEADER);
  const [loaded, setLoaded] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(1);

  useEffect(() => {
    api
      .get("/home-banners?type=DISCOUNT_PANEL")
      .then(({ data }) => {
        const activeBanners: Banner[] = (data.banners ?? []).filter(
          (b: any) => b.isActive,
        );
        setBanners(activeBanners);
        if (data.discountSection) {
          setHeader(data.discountSection);
        }
      })
      .catch(() => {
        setBanners([]);
      })
      .finally(() => setLoaded(true));

    api
      .get("/home-banners/homepage-config")
      .then(({ data }) => {
        if (typeof data?.discountTemplate === "number") {
          setActiveTemplate(data.discountTemplate);
        }
      })
      .catch(() => { });
  }, []);

  const handleShopNow = () => navigate("/products");

  if (!loaded) return null; // avoid layout shift while loading

  if (banners.length === 0) return null;

  switch (activeTemplate) {
    case 2:
      return <Template2 banners={banners} header={header} handleShopNow={handleShopNow} />;
    case 3:
      return <Template3 banners={banners} header={header} handleShopNow={handleShopNow} />;
    case 4:
      return <Template4 banners={banners} header={header} handleShopNow={handleShopNow} />;
    default:
      return <Template1 banners={banners} header={header} handleShopNow={handleShopNow} />;
  }
};

export default DiscountPage;
