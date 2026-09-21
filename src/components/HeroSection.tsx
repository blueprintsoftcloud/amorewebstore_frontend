import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { PulseLoader } from "react-spinners";
import api from "../utils/api";


// Fallback images (same pool as the original hero)
import image1 from "../assets/1000.jpeg";
import image2 from "../assets/1001.jpeg";
import image3 from "../assets/1002.jpeg";
import image4 from "../assets/1003.jpeg";
import image5 from "../assets/1004.jpeg";
import image6 from "../assets/1005.jpeg";
import image7 from "../assets/1006.jpeg";
import image8 from "../assets/1007.jpeg";
import image9 from "../assets/1008.jpeg";
import bg1 from "../assets/White and Teal Corporate Job Offer Letter A4.png"

const FALLBACK_IMAGES = [
  image1,
  image2,
  image3,
  image4,
  image5,
  image6,
  image7,
  image8,
  image9,
];

interface HeroTemplateData {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  bgImage?: string;
  accentText?: string;
  images?: string[];
  highlightText?: string;
  badgeText?: string;
}

interface HeroConfig {
  activeTemplate: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  templates: Record<string, HeroTemplateData>;
}

const DEFAULT_CONFIG: HeroConfig = {
  activeTemplate: 1,
  templates: {
    "1": {
      title: "Summer styles are finally here",
      subtitle:
        "This year, our new summer collection will shelter you from the harsh elements of a world that doesn't care if you live or die.",
      ctaText: "Shop Collection",
      ctaLink: "/products",
    },
    "2": {
      title: "New Arrivals Just Dropped",
      subtitle: "Discover our latest curated pieces.",
      ctaText: "Explore Now",
      ctaLink: "/products",
      bgImage: "",
    },
    "3": {
      title: "Elegance Redefined",
      subtitle: "Timeless. Modern. Yours.",
      ctaText: "Shop Now",
      ctaLink: "/products",
      accentText: "New Season",
    },
    "4": {
      title: "Lets Create your Own Style",
      subtitle:
        "It is a long established fact that a reader will be distracted by the readable content of a page.",
      ctaText: "Shop Now",
      ctaLink: "/products",
      accentText: "Trendy Collections",
      highlightText: "Create",
      badgeText: "25%\nDiscount on Everything",
      bgImage: "",
    },
    "5": {
      title: "Elevate Your Style With Bold Fashion",
      subtitle: "Discover our latest curated pieces for the season.",
      ctaText: "Explore Collections",
      ctaLink: "/products",
      accentText: "New Season / Avant-Garde Collection",
      images: [
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=400",
      ],
    },
    "6": {
      title: "Big Style. Bigger Savings.",
      subtitle: "Our biggest collection drop of the season, at prices you'll love.",
      ctaText: "Shop The Sale",
      ctaLink: "/products",
      accentText: "Limited Time",
      highlightText: "",
      badgeText: "50%\nOFF SELECTED",
      bgImage: "",
    },
    "7": {
      title: "Simplicity Is The Ultimate Sophistication",
      subtitle: "Considered pieces, made to last. No noise — just great design.",
      ctaText: "Shop Now",
      ctaLink: "/products",
      accentText: "The Collection",
    },
    "8": {
      title: "Everything Must Go",
      subtitle: "Our biggest markdowns of the year — while stock lasts.",
      ctaText: "Shop The Sale",
      ctaLink: "/products",
      accentText: "Sale Ends Soon",
      badgeText: "70%\nOFF",
    },
    "9": {
      title: "The New Season Edit",
      subtitle: "Fresh arrivals, curated for right now.",
      ctaText: "Shop Now",
      ctaLink: "/products",
      accentText: "New In",
      bgImage: "",
    },
  },
};

// ─── Template 1: Editorial Split ──────────────────────────────────────────────
// Text left, asymmetric image grid right — modernised original

function Template1({ data }: { data: HeroTemplateData }) {
  const navigate = useNavigate();
  const gridImages = (() => {
    if (data.images && data.images.length > 0) {
      const filled = [...data.images, ...FALLBACK_IMAGES];
      return filled.filter(Boolean).slice(0, 9);
    }
    return FALLBACK_IMAGES.slice(0, 9);
  })();

  return (
    <div 
      style={{ minHeight: "calc(100vh - 4rem)" }}
      className="relative overflow-hidden w-full bg-white mt-35 sm:mt-20 lg:mt-24"
    >
      {/* --- ADDED FULL SECTION BACKGROUND IMAGE HERE --- */}
      {/* <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none"
        style={{ backgroundImage: `url(${data.images?.[0] || FALLBACK_IMAGES[0]})` }}
      /> */}
      
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-gray-100 via-transparent to-transparent opacity-70 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
        {/* Vertically centers everything on desktop screens */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full lg:w-1/2 text-center lg:text-left z-20 mb-12 lg:mb-0"
          >
            {/* Changed font weight to font-black and bumped the size scale up */}
            <h1 className="text-3xl sm:text-6xl lg:text-5xl font-bold font-sans text-black spacing pb-3 uppercase">
              {data.title}
            </h1>
            {/* Enhanced body text size and font weight for visibility against the heavy heading */}
            <p className="mt-2 text-xs sm:text-lg font-semibold text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-serif line-clamp-2 sm:line-clamp-none">
              {data.subtitle}
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(data.ctaLink || "/products")}

              className="mt-10 inline-flex items-center gap-3 bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] px-8 py-4 rounded-xl text-base font-bold tracking-wide hover:opacity-90 transition-opacity shadow-lg"
            >
              {data.ctaText || "Shop Collection"}
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </motion.button>
          </motion.div>

          {/* Right: Masonry image grid — 2 | 3 | 2 column layout */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="flex gap-2 sm:gap-3">
              {/* Left column — 2 images */}
              <div className="flex flex-col gap-2 sm:gap-3 flex-1">
                {[gridImages[0], gridImages[1]].map((src, i) => (
                  <motion.div
                    key={i}
                    whileHover={{
                      scale: 1.03,
                      zIndex: 10,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden rounded-2xl"
                    style={{ aspectRatio: i === 0 ? "3/4" : "2/3" }}
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>

              {/* Center column — 3 images */}
              <div className="flex flex-col gap-2 sm:gap-3 flex-1">
                {[gridImages[2], gridImages[3], gridImages[4]].map((src, i) => (
                  <motion.div
                    key={i}
                    whileHover={{
                      scale: 1.03,
                      zIndex: 10,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden rounded-2xl"
                    style={{ aspectRatio: i === 1 ? "1/1" : "3/4" }}
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>

              {/* Right column — 2 images */}
              <div className="flex flex-col gap-2 sm:gap-3 flex-1">
                {[gridImages[5], gridImages[6]].map((src, i) => (
                  <motion.div
                    key={i}
                    whileHover={{
                      scale: 1.03,
                      zIndex: 10,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden rounded-2xl"
                    style={{ aspectRatio: i === 0 ? "2/3" : "3/4" }}
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}



// ─── Template 2: Cinematic Full-width ─────────────────────────────────────────
// Full-width image background with overlay text
function Template2({ data }: { data: HeroTemplateData }) {
  const navigate = useNavigate();
  const bgSrc = data.bgImage || image1;

  return (
    // Changed to a clean neutral background color to beautifully frame the high-quality asset layout
    <div 
      style={{ minHeight: "calc(100vh + 6rem)" }}
      className="relative w-full bg-neutral-950 mt-16 sm:mt-20 lg:mt-24 flex items-center overflow-hidden"
    >
      
      {/* Desktop Split View / Mobile Full Screen Context Frame */}
      <div className="absolute inset-0 w-full h-full lg:left-1/3 lg:w-2/3">
       
         <img 
          src={bgSrc} 
          alt="" 
          className="w-full h-full object-cover lg:object-cover origin-center opacity-70 lg:opacity-90" 
        />
        {/* Layered vignette masks to prevent hard edges on the image assets */}
         <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950 lg:hidden" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/40 to-transparent hidden lg:block" />
      </div> 


    

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <span className="inline-block text-xs font-bold tracking-[0.3em] uppercase text-white/60 mb-4">
            New Collection
          </span>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-none tracking-tighter mb-6">
            {data.title}
          </h1>
          <p className="text-white/70 text-sm sm:text-lg leading-relaxed mb-10 max-w-md line-clamp-2 sm:line-clamp-none">
            {data.subtitle}
          </p>
          <div className="flex flex-wrap gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(data.ctaLink || "/products")}
              className="inline-flex items-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-full text-base font-bold hover:bg-gray-100 transition-colors shadow-xl"
            >
              {data.ctaText || "Explore Now"}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/products")}
              className="inline-flex items-center gap-2 border border-white/40 text-white px-8 py-4 rounded-full text-base font-medium hover:bg-white/10 transition-colors"
            >
              View All
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Template 3: Dark Minimal Centered ────────────────────────────────────────



function Template3({ data }: { data: HeroTemplateData }) {
  const navigate = useNavigate();
  const accentImages = (() => {
    if (data.images && data.images.length > 0) {
      const filled = [...data.images, ...FALLBACK_IMAGES];
      return filled.filter(Boolean).slice(0, 4);
    }
    return FALLBACK_IMAGES.slice(0, 4);
  })();

  return (
    <div 
      style={{ minHeight: "calc(100vh - 4rem)" }}
      className="relative w-full mt-16 sm:mt-20 lg:mt-24 bg-[#0c0c0c] overflow-hidden"
    >
      {/* Background noise texture */}
      <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      {/* Centered gradient glow behind content */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-20 lg:py-32">
        {/* Fully centered stacked layout container */}
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          
          {/* Text & CTA Block */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full flex flex-col items-center"
          >
            {data.accentText && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.25em] uppercase text-[var(--theme-accent)] mb-6"
              >
                <span className="inline-block w-6 h-px bg-[var(--theme-accent)]" />
                {data.accentText}
                <span className="inline-block w-6 h-px bg-[var(--theme-accent)]" />
              </motion.span>
            )}

            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-none tracking-tighter mb-8 max-w-4xl">
              {data.title.split(" ").map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 + 0.3 }}
                  className={`inline-block mx-2 ${i % 2 === 1 ? "text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-accent)]" : ""}`}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <p className="text-white/50 text-sm sm:text-lg leading-relaxed mb-10 max-w-xl">
              {data.subtitle}
            </p>

            <motion.button
              whileHover={{
                scale: 1.03,
                boxShadow: "0 0 40px rgba(99,102,241,0.4)",
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(data.ctaLink || "/products")}
              className="inline-flex items-center gap-3 bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] px-10 py-4 rounded-full text-base font-bold hover:opacity-95 transition shadow-lg mb-20"
            >
              {data.ctaText || "Shop Now"}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Perfectly Evenly-Aligned 4-Image Grid Strip */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              {accentImages.map((src, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.04, y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden rounded-2xl border border-white/10 aspect-square bg-neutral-900 shadow-xl"
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

// ─── Template 4: Modern Product Spotlight ────────────────────────────────────
// White bg, text left, single product image right with decorative circles + badge
// function Template4({ data }: { data: HeroTemplateData }) {
//   const navigate = useNavigate();
//   const bgSrc = data.bgImage || image1;

//   const titleParts = (() => {
//     if (data.highlightText && data.title.includes(data.highlightText)) {
//       const idx = data.title.indexOf(data.highlightText);
//       return {
//         before: data.title.slice(0, idx),
//         highlight: data.highlightText,
//         after: data.title.slice(idx + data.highlightText.length),
//       };
//     }
//     return { before: data.title, highlight: "", after: "" };
//   })();

//   const badgeParts = data.badgeText ? data.badgeText.split("\n") : [];

//   return (
//     <div className="relative overflow-hidden w-full bg-white mt-16 sm:mt-20 lg:mt-24">
//       <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
//         <div className="flex flex-col lg:flex-row lg:items-center lg:gap-8">
//           {/* Left: Text */}
//           <motion.div
//             initial={{ opacity: 0, x: -40 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.7, ease: "easeOut" }}
//             className="w-full lg:w-1/2 text-center lg:text-left z-20 mb-12 lg:mb-0"
//           >
//             {data.accentText && (
//               <p className="text-sm text-gray-400 tracking-widest uppercase mb-4">
//                 {data.accentText}
//               </p>
//             )}
//             <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-gray-900 mb-6">
//               {titleParts.before}
//               {titleParts.highlight && (
//                 <span className="text-rose-500">{titleParts.highlight}</span>
//               )}
//               {titleParts.after}
//             </h1>
//             <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto lg:mx-0 line-clamp-2 sm:line-clamp-none">
//               {data.subtitle}
//             </p>
//             <motion.button
//               whileHover={{ scale: 1.03 }}
//               whileTap={{ scale: 0.97 }}
//               onClick={() => navigate(data.ctaLink || "/products")}
//               className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-8 py-3.5 rounded-full text-base font-semibold transition-colors shadow-lg shadow-rose-200/50"
//             >
//               {data.ctaText || "Shop Now"}
//               <ArrowRight className="w-5 h-5" />
//             </motion.button>
//           </motion.div>

//           {/* Right: Product image with decorative shapes */}
//           <motion.div
//             initial={{ opacity: 0, x: 40 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
//             className="w-full lg:w-1/2 relative flex items-center justify-center min-h-[380px] sm:min-h-[480px]"
//           >
//             {/* Decorative circles */}
//             <div
//               className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-purple-100 opacity-70"
//               style={{ right: "8%", top: "50%", transform: "translateY(-50%)" }}
//             />
//             <div
//               className="absolute w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-pink-100 opacity-60"
//               style={{ right: "2%", top: "10%" }}
//             />
//             <div
//               className="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full border-4 border-purple-200/50"
//               style={{ left: "10%", bottom: "15%" }}
//             />
//             <div
//               className="absolute w-8 h-8 rounded-full bg-rose-300/40"
//               style={{ left: "20%", top: "20%" }}
//             />

//             {/* Product image */}
//             <div className="relative z-10 h-[360px] sm:h-[440px] flex items-end justify-center">
//               <img
//                 src={bgSrc}
//                 alt=""
//                 className="h-full w-auto object-contain object-bottom"
//                 style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.15))" }}
//               />
//               {/* Floating badge */}
//               {badgeParts.length > 0 && (
//                 <motion.div
//                   initial={{ opacity: 0, scale: 0.8, y: 10 }}
//                   animate={{ opacity: 1, scale: 1, y: 0 }}
//                   transition={{ delay: 0.7, duration: 0.5 }}
//                   className="absolute top-8 right-0 bg-white shadow-2xl rounded-2xl px-4 py-3 text-center min-w-[100px]"
//                   style={{
//                     boxShadow:
//                       "0 10px 40px rgba(244,63,94,0.15), 0 4px 20px rgba(0,0,0,0.1)",
//                   }}
//                 >
//                   <p className="text-2xl sm:text-3xl font-black text-rose-500 leading-none">
//                     {badgeParts[0]}
//                   </p>
//                   {badgeParts[1] && (
//                     <p className="text-[11px] text-gray-400 mt-1 leading-tight">
//                       {badgeParts[1]}
//                     </p>
//                   )}
//                 </motion.div>
//               )}
//             </div>
//           </motion.div>
//         </div>
//       </div>
//     </div>
//   );
// }









function Template4({ data }: { data: HeroTemplateData }) {
  const navigate = useNavigate();
  const bgSrc = data.bgImage || image1;

  const titleParts = (() => {
    if (data.highlightText && data.title.includes(data.highlightText)) {
      const idx = data.title.indexOf(data.highlightText);
      return {
        before: data.title.slice(0, idx),
        highlight: data.highlightText,
        after: data.title.slice(idx + data.highlightText.length),
      };
    }
    return { before: data.title, highlight: "", after: "" };
  })();

  const badgeParts = data.badgeText ? data.badgeText.split("\n") : [];

  return (
    <div 
      style={{ minHeight: "calc(100vh - 4rem)" }}
      className="relative overflow-hidden w-full bg-[#fafafa] selection:bg-rose-500 selection:text-white mt-16 sm:mt-20 lg:mt-24"
    >
      {/* Soft elegant ambient illumination highlights */}
      <div className="absolute right-0 top-1/4 w-[600px] h-[400px] bg-rose-500/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute left-10 bottom-0 w-[400px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 pt-24 pb-16 lg:pt-36 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left: Content Block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start"
          >
            {/* NEW UI: Elegant inline announcement container */}
            {badgeParts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 text-[11px] font-bold tracking-wide text-[var(--theme-accent)] mb-6 shadow-sm"
              >
                {/* <Sparkles className="w-3.5 h-3.5 text-rose-500" /> */}
                <span>{badgeParts[0]}</span>
                {badgeParts[1] && (
                  <span className="text-[var(--theme-accent)]/70 font-normal border-l border-[var(--theme-accent)]/30 pl-2 ml-1">
                    {badgeParts[1]}
                  </span>
                )}
              </motion.div>
            )}

            {data.accentText && (
              <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-4">
                {data.accentText}
              </p>
            )}

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-neutral-900 mb-6">
              {titleParts.before}
              {titleParts.highlight && (
                <span className="text-[var(--theme-accent)]">{titleParts.highlight}</span>
              )}
              {titleParts.after}
            </h1>

            <p className="text-neutral-500 text-base sm:text-lg leading-relaxed mb-10 max-w-xl">
              {data.subtitle}
            </p>

            <motion.button
              whileHover={{ y: -2, boxShadow: "0 12px 30px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(data.ctaLink || "/products")}
              className="group inline-flex items-center gap-2.5 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-ink)] px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-200 shadow-xl shadow-neutral-950/10"
            >
              {data.ctaText || "Shop Now"}
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </motion.button>
          </motion.div>

          {/* Right: Clean, Unobstructed Product Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="w-full lg:col-span-5 relative flex items-center justify-center min-h-[380px] sm:min-h-[460px]"
          >
            <img
              src={bgSrc}
              alt=""
              className="max-h-[420px] w-auto object-contain transition-transform duration-500 hover:scale-[1.02]"
              style={{ filter: "drop-shadow(0 25px 35px rgba(0,0,0,0.06))" }}
            />
          </motion.div>

        </div>
      </div>
    </div>
  );
}
// ─── Template 5: Fashion Collage Gallery ──────────────────────────────────────
const TEMPLATE5_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=400"
];

// function Template5({ data }: { data: HeroTemplateData }) {
//   const navigate = useNavigate();
//   const images = (() => {
//     if (data.images && data.images.length > 0) {
//       const filled = [...data.images];
//       for (let i = 0; i < 7; i++) {
//         if (!filled[i]) {
//           filled[i] = TEMPLATE5_FALLBACK_IMAGES[i];
//         }
//       }
//       return filled.slice(0, 7);
//     }
//     return TEMPLATE5_FALLBACK_IMAGES;
//   })();

//   return (
//     <div className="relative w-full mt-16 sm:mt-20 lg:mt-24 bg-white font-sans px-6 py-12 md:py-16 lg:py-24 flex flex-col items-center justify-center gap-10 md:gap-16 select-none min-h-[calc(100vh-4rem)]">
//       {/* --- TOP HEADER SECTION --- */}
//       <motion.div 
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8 }}
//         className="w-full flex flex-col justify-center items-center"
//       >
//         {/* Center Main Heading */}
//         <h1 className="text-5xl md:text-7xl lg:text-7xl font-bold text-neutral-950 text-center max-w-5xl  leading-[1.05] mx-4">
//           {data.title}
//         </h1>
//       </motion.div>

//       {/* --- GRID GALLERY SECTION --- */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end max-w-[1400px] mx-auto w-full ">
        
//         {/* Column 1: Orange Suit & Kid */}
//         <motion.div 
//           initial={{ opacity: 0, y: 40 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8, delay: 0.1 }}
//           className="flex flex-col gap-4 h-full justify-end"
//         >
//           <div className="relative bg-[#FF6A13] rounded-[2rem] overflow-hidden aspect-[3/4] md:h-[280px]">
//             <img src={images[0]} alt="Fashion model" className="w-full h-full object-cover mix-blend-multiply" />
//           </div>
//           <div className="bg-[#FFB03A] rounded-[2rem] overflow-hidden aspect-[4/3] md:h-[130px]">
//             <img src={images[1]} alt="Kid model" className="w-full h-full object-cover mix-blend-multiply object-top" />
//           </div>
//         </motion.div>

//         {/* Column 2: Green Coat Woman (Tall) */}
//         <motion.div 
//           initial={{ opacity: 0, y: 40 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8, delay: 0.2 }}
//           className="h-full flex flex-col justify-end"
//         >
//           <div className="bg-[#A4E0A4] rounded-t-[3rem] rounded-b-[2rem] overflow-hidden aspect-[1/2] md:h-[430px]">
//             <img src={images[2]} alt="Woman in green coat" className="w-full h-full object-cover object-center mix-blend-multiply" />
//           </div>
//         </motion.div>

//         {/* Column 3: Yellow Hat Portrait & CTA Button */}
//         <motion.div 
//           initial={{ opacity: 0, y: 40 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8, delay: 0.3 }}
//           className="flex flex-col gap-4 items-center justify-center h-full my-auto"
//         >
//           <div className="bg-[#FFC72C] rounded-[2rem] overflow-hidden aspect-square w-full md:h-[260px]">
//             <img src={images[3]} alt="Man in yellow hat" className="w-full h-full object-cover mix-blend-multiply" />
//           </div>
//           <button 
//             onClick={() => navigate(data.ctaLink || "/products")}
//             className="w-full bg-[#111111] text-white py-4 px-6 rounded-full flex items-center justify-center gap-2 font-medium tracking-wide shadow-lg hover:bg-zinc-900 transition-all group cursor-pointer"
//           >
//             <span className="text-sm">{data.ctaText || "Explore Collections"}</span>
//             <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
//           </button>
//         </motion.div>

//         {/* Column 4: White Cargo Suit Man */}
//         <motion.div 
//           initial={{ opacity: 0, y: 40 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8, delay: 0.4 }}
//           className="h-full flex flex-col justify-end"
//         >
//           <div className="bg-[#6BB7E7] rounded-t-[3rem] rounded-b-[2rem] overflow-hidden aspect-[1/2] md:h-[390px]">
//             <img src={images[4]} alt="Man in white suit" className="w-full h-full object-cover mix-blend-multiply" />
//           </div>
//         </motion.div>

//         {/* Column 5: Red Glasses Woman & Green Suit Man */}
//         <motion.div 
//           initial={{ opacity: 0, y: 40 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8, delay: 0.5 }}
//           className="flex flex-col gap-4 h-full justify-end"
//         >
//           <div className="bg-[#8FE3B2] rounded-t-[3rem] rounded-b-[2rem] overflow-hidden aspect-[4/3] md:h-[235px]">
//             <img src={images[5]} alt="Woman in heart sunglasses" className="w-full h-full object-cover mix-blend-multiply" />
//           </div>
//           <div className="bg-[#1D794E] rounded-[2rem] overflow-hidden aspect-[4/3] md:h-[130px]">
//             <img src={images[6]} alt="Man in green suit" className="w-full h-full object-cover mix-blend-multiply object-center" />
//           </div>
//         </motion.div>

//       </div>
//     </div>
//   );
// }








function Template5({ data }: { data: HeroTemplateData }) {
  const navigate = useNavigate();
  const images = (() => {
    if (data.images && data.images.length > 0) {
      const filled = [...data.images];
      for (let i = 0; i < 7; i++) {
        if (!filled[i]) {
          filled[i] = TEMPLATE5_FALLBACK_IMAGES[i];
        }
      }
      return filled.slice(0, 7);
    }
    return TEMPLATE5_FALLBACK_IMAGES;
  })();

  return (
    <div className="relative w-full mt-16 sm:mt-20 lg:mt-24 bg-white font-sans px-6 py-12 md:py-16 lg:py-20 flex flex-col items-center justify-center gap-12 md:gap-20 select-none min-h-[calc(100vh-4rem)]">
      {/* --- TOP HEADER SECTION --- */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full flex flex-col justify-center items-center text-center space-y-3"
      >
        {/* Editorial Overline Label */}
        {data.accentText && (
          <span className="text-xs font-serif uppercase tracking-[0.25em] text-neutral-500 font-semibold block">
            {data.accentText}
          </span>
        )}
        
        {/* Center Main Heading */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-light tracking-wide text-neutral-900 text-center max-w-4xl leading-[1.1] mx-4">
  {data.title}
</h1>
      </motion.div>

      {/* --- GRID GALLERY SECTION --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end max-w-[1400px] mx-auto w-full ">
        
        {/* Column 1: Orange Suit & Kid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="flex flex-col gap-4 h-full justify-end"
        >
          <div className="relative bg-[#FF6A13] rounded-[2rem] overflow-hidden aspect-[3/4] md:h-[280px]">
            <img src={images[0]} alt="Fashion model" className="w-full h-full object-cover mix-blend-multiply" />
          </div>
          <div className="bg-[#FFB03A] rounded-[2rem] overflow-hidden aspect-[4/3] md:h-[130px]">
            <img src={images[1]} alt="Kid model" className="w-full h-full object-cover mix-blend-multiply object-top" />
          </div>
        </motion.div>

        {/* Column 2: Green Coat Woman (Tall) */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="h-full flex flex-col justify-end"
        >
          <div className="bg-[#A4E0A4] rounded-t-[3rem] rounded-b-[2rem] overflow-hidden aspect-[1/2] md:h-[430px]">
            <img src={images[2]} alt="Woman in green coat" className="w-full h-full object-cover object-center mix-blend-multiply" />
          </div>
        </motion.div>

        {/* Column 3: Yellow Hat Portrait & CTA Button */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col gap-4 items-center justify-center h-full my-auto"
        >
          <div className="bg-[#FFC72C] rounded-[2rem] overflow-hidden aspect-square w-full md:h-[260px]">
            <img src={images[3]} alt="Man in yellow hat" className="w-full h-full object-cover mix-blend-multiply" />
          </div>
          <button
            onClick={() => navigate(data.ctaLink || "/products")}
            className="w-full bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-ink)] py-4 px-6 rounded-full flex items-center justify-center gap-2 font-medium tracking-wide shadow-lg transition-all group cursor-pointer"
          >
            <span className="text-sm">{data.ctaText || "Explore Collections"}</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </motion.div>

        {/* Column 4: White Cargo Suit Man */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="h-full flex flex-col justify-end"
        >
          <div className="bg-[#6BB7E7] rounded-t-[3rem] rounded-b-[2rem] overflow-hidden aspect-[1/2] md:h-[390px]">
            <img src={images[4]} alt="Man in white suit" className="w-full h-full object-cover mix-blend-multiply" />
          </div>
        </motion.div>

        {/* Column 5: Red Glasses Woman & Green Suit Man */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col gap-4 h-full justify-end"
        >
          <div className="bg-[#8FE3B2] rounded-t-[3rem] rounded-b-[2rem] overflow-hidden aspect-[4/3] md:h-[235px]">
            <img src={images[5]} alt="Woman in heart sunglasses" className="w-full h-full object-cover mix-blend-multiply" />
          </div>
          <div className="bg-[#1D794E] rounded-[2rem] overflow-hidden aspect-[4/3] md:h-[130px]">
            <img src={images[6]} alt="Man in green suit" className="w-full h-full object-cover mix-blend-multiply object-center" />
          </div>
        </motion.div>

      </div>
    </div>
  );
}

// ─── Template 6: Diagonal Split ────────────────────────────────────────────────
// Bold two-tone panel with a diagonal seam — a solid theme-primary panel carries the
// headline/CTA, a photo panel sits behind a clipped diagonal edge, and an oversized
// circular badge (highlightText/badgeText — same fields Template4 already uses) floats
// on the seam. Reads as a sale/festive banner without needing any new content fields.
function Template6({ data }: { data: HeroTemplateData }) {
  const navigate = useNavigate();
  const bgSrc = data.bgImage || image1;
  const badgeParts = data.badgeText ? data.badgeText.split("\n") : [];

  return (
    <div
      style={{ minHeight: "calc(100vh - 4rem)" }}
      className="relative overflow-hidden w-full bg-[var(--theme-primary)] mt-16 sm:mt-20 lg:mt-24"
    >
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-4rem)]">
        {/* Left: solid theme-primary panel */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-20 lg:py-0 text-center lg:text-left"
        >
          {data.accentText && (
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--theme-primary-ink)]/70 mb-4">
              {data.accentText}
            </p>
          )}
          <h1 className="text-4xl sm:text-6xl lg:text-6xl font-black tracking-tight leading-[1.05] text-[var(--theme-primary-ink)] mb-6">
            {data.title}
          </h1>
          <p className="text-[var(--theme-primary-ink)]/80 text-base sm:text-lg leading-relaxed mb-10 max-w-md mx-auto lg:mx-0">
            {data.subtitle}
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(data.ctaLink || "/products")}
            className="mx-auto lg:mx-0 inline-flex items-center gap-3 bg-[var(--theme-primary-ink)] text-[var(--theme-primary)] px-8 py-4 rounded-xl text-base font-bold tracking-wide hover:opacity-90 transition-opacity shadow-lg w-fit"
          >
            {data.ctaText || "Shop Now"}
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </motion.button>
        </motion.div>

        {/* Right: photo panel behind a diagonal clip */}
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative min-h-[320px] lg:min-h-0"
          style={{
            clipPath: "polygon(12% 0, 100% 0, 100% 100%, 0% 100%)",
          }}
        >
          <img
            src={bgSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/10" />
        </motion.div>

        {/* Badge floating on the seam — hidden on mobile where the seam isn't visible */}
        {badgeParts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="hidden lg:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex-col items-center justify-center text-center w-36 h-36 rounded-full bg-[var(--theme-accent)] text-[var(--theme-accent-ink)] shadow-2xl"
          >
            <span className="text-2xl font-black leading-none">{badgeParts[0]}</span>
            {badgeParts[1] && (
              <span className="text-[10px] font-semibold uppercase tracking-wide mt-1 px-3 leading-tight">
                {badgeParts[1]}
              </span>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Template 7: Minimal Statement ─────────────────────────────────────────────
// Oversized type-only hero, no imagery at all — the safest template for a store that
// doesn't have (or doesn't want to use) hero photography, and one that can never clash
// with any theme's palette since there's no image to color-match. bgImage is unused.
function Template7({ data }: { data: HeroTemplateData }) {
  const navigate = useNavigate();

  return (
    <div
      style={{ minHeight: "calc(100vh - 4rem)" }}
      className="relative overflow-hidden w-full bg-white mt-16 sm:mt-20 lg:mt-24 flex items-center"
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span
          className="text-[28vw] font-black leading-none whitespace-nowrap"
          style={{ color: "var(--theme-surface-alt)" }}
        >
          {data.accentText || data.title.split(" ")[0]}
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center py-24">
        {data.accentText && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-xs font-bold tracking-[0.3em] uppercase mb-6"
            style={{ color: "var(--theme-primary)" }}
          >
            {data.accentText}
          </motion.p>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-neutral-900 mb-8"
          style={{ fontFamily: "var(--theme-font-heading)" }}
        >
          {data.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-neutral-500 text-base sm:text-lg leading-relaxed mb-10 max-w-lg mx-auto"
        >
          {data.subtitle}
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(data.ctaLink || "/products")}
          className="inline-flex items-center gap-3 bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] px-9 py-4 rounded-full text-base font-bold tracking-wide hover:bg-[var(--theme-primary-hover)] transition-colors shadow-lg"
        >
          {data.ctaText || "Shop Now"}
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </motion.button>
      </div>
    </div>
  );
}

// ─── Template 8: Sale Spotlight ─────────────────────────────────────────────────
// The badge text (same "50%\nOFF SELECTED" field Template4/6 use) becomes the hero's
// dominant visual element instead of a small corner badge — built for sale-event
// occasions where the discount itself IS the headline. bgImage is unused.
function Template8({ data }: { data: HeroTemplateData }) {
  const navigate = useNavigate();
  const badgeParts = data.badgeText ? data.badgeText.split("\n") : [];

  return (
    <div
      style={{ minHeight: "calc(100vh - 4rem)" }}
      className="relative overflow-hidden w-full bg-neutral-950 mt-16 sm:mt-20 lg:mt-24 flex items-center"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[160px] pointer-events-none opacity-30" style={{ background: "var(--theme-primary)" }} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: giant discount numeral */}
          {badgeParts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-center lg:text-left order-2 lg:order-1"
            >
              <span
                className="block text-[7rem] sm:text-[10rem] lg:text-[11rem] font-black leading-none tracking-tighter"
                style={{ color: "var(--theme-accent)" }}
              >
                {badgeParts[0]}
              </span>
              {badgeParts[1] && (
                <span className="block text-lg sm:text-2xl font-bold uppercase tracking-[0.15em] text-white/70 -mt-2 sm:-mt-4">
                  {badgeParts[1]}
                </span>
              )}
            </motion.div>
          )}

          {/* Right: headline, subtitle, CTA */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-center lg:text-left order-1 lg:order-2"
          >
            {data.accentText && (
              <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/50 mb-4">
                {data.accentText}
              </p>
            )}
            <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight tracking-tight mb-6">
              {data.title}
            </h1>
            <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-10 max-w-md mx-auto lg:mx-0">
              {data.subtitle}
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(data.ctaLink || "/products")}
              className="inline-flex items-center gap-3 bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] px-8 py-4 rounded-xl text-base font-bold tracking-wide hover:bg-[var(--theme-primary-hover)] transition-colors shadow-lg"
            >
              {data.ctaText || "Shop The Sale"}
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Template 9: Full-bleed with Frosted Info Bar ─────────────────────────────
// A full-bleed background photo with a frosted-glass bar anchored to the bottom edge —
// a different treatment from Template2's centered-overlay full-width look.
function Template9({ data }: { data: HeroTemplateData }) {
  const navigate = useNavigate();
  const bgSrc = data.bgImage || image1;

  return (
    <div
      style={{ minHeight: "calc(100vh - 4rem)" }}
      className="relative overflow-hidden w-full mt-16 sm:mt-20 lg:mt-24"
    >
      <img src={bgSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/10" />

      <div style={{ minHeight: "calc(100vh - 4rem)" }} className="relative z-10 flex flex-col justify-end">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mx-4 sm:mx-8 lg:mx-12 mb-6 sm:mb-10 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 px-6 sm:px-10 py-8 sm:py-10"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="max-w-xl">
              {data.accentText && (
                <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/70 mb-3">
                  {data.accentText}
                </p>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight mb-3">
                {data.title}
              </h1>
              <p className="text-white/70 text-sm sm:text-base leading-relaxed">
                {data.subtitle}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(data.ctaLink || "/products")}
              className="shrink-0 inline-flex items-center gap-3 bg-white text-gray-900 px-7 py-3.5 rounded-xl text-sm font-bold tracking-wide hover:bg-gray-100 transition-colors shadow-lg w-fit"
            >
              {data.ctaText || "Shop Now"}
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const HERO_CACHE_KEY = "crm_hero_config_cache";

function readHeroCache(): HeroConfig | null {
  try {
    const raw = localStorage.getItem(HERO_CACHE_KEY);
    return raw ? (JSON.parse(raw) as HeroConfig) : null;
  } catch {
    return null;
  }
}

// ─── Main HeroSection component ───────────────────────────────────────────────
export default function HeroSection({ onReady }: { onReady?: () => void }) {
  const cached = readHeroCache();
  const [config, setConfig] = useState<HeroConfig>(cached ?? DEFAULT_CONFIG);
  const [ready, setReady] = useState(false);

  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    let isMounted = true;
    api
      .get("/home-banners/homepage-config")
      .then(({ data }) => {
        if (!isMounted) return;
        let fresh: HeroConfig = config;
        if (data?.heroConfig) {
          fresh = {
            activeTemplate:
              data.heroConfig.activeTemplate ?? DEFAULT_CONFIG.activeTemplate,
            templates: {
              "1": {
                ...DEFAULT_CONFIG.templates["1"],
                ...data.heroConfig.templates?.["1"],
              },
              "2": {
                ...DEFAULT_CONFIG.templates["2"],
                ...data.heroConfig.templates?.["2"],
              },
              "3": {
                ...DEFAULT_CONFIG.templates["3"],
                ...data.heroConfig.templates?.["3"],
              },
              "4": {
                ...DEFAULT_CONFIG.templates["4"],
                ...data.heroConfig.templates?.["4"],
              },
              "5": {
                ...DEFAULT_CONFIG.templates["5"],
                ...data.heroConfig.templates?.["5"],
              },
              "6": {
                ...DEFAULT_CONFIG.templates["6"],
                ...data.heroConfig.templates?.["6"],
              },
              "7": {
                ...DEFAULT_CONFIG.templates["7"],
                ...data.heroConfig.templates?.["7"],
              },
              "8": {
                ...DEFAULT_CONFIG.templates["8"],
                ...data.heroConfig.templates?.["8"],
              },
              "9": {
                ...DEFAULT_CONFIG.templates["9"],
                ...data.heroConfig.templates?.["9"],
              },
            },
          };
          setConfig(fresh);
          try {
            localStorage.setItem(HERO_CACHE_KEY, JSON.stringify(fresh));
          } catch {
            // ignore
          }
        }

        const activeTpl = fresh.activeTemplate;
        if (activeTpl === 2 || activeTpl === 4 || activeTpl === 5 || activeTpl === 6 || activeTpl === 9) {
          const templateData = fresh.templates[String(activeTpl)];
          const bgSrc = activeTpl === 5
            ? (templateData?.images?.[0] || TEMPLATE5_FALLBACK_IMAGES[0])
            : (templateData?.bgImage || image1);
          if (bgSrc && typeof bgSrc === "string") {
            const img = new Image();
            img.src = bgSrc;
            img.onload = () => {
              if (!isMounted) return;
              setReady(true);
              if (onReadyRef.current) onReadyRef.current();
            };
            img.onerror = () => {
              if (!isMounted) return;
              setReady(true);
              if (onReadyRef.current) onReadyRef.current();
            };
          } else {
            setReady(true);
            if (onReadyRef.current) onReadyRef.current();
          }
        } else {
          setReady(true);
          if (onReadyRef.current) onReadyRef.current();
        }
      })
      .catch(() => {
        if (!isMounted) return;
        const activeTpl = config.activeTemplate;
        if (activeTpl === 2 || activeTpl === 4 || activeTpl === 5 || activeTpl === 6 || activeTpl === 9) {
          const templateData = config.templates[String(activeTpl)];
          const bgSrc = activeTpl === 5
            ? (templateData?.images?.[0] || TEMPLATE5_FALLBACK_IMAGES[0])
            : (templateData?.bgImage || image1);
          if (bgSrc && typeof bgSrc === "string") {
            const img = new Image();
            img.src = bgSrc;
            img.onload = () => {
              if (!isMounted) return;
              setReady(true);
              if (onReadyRef.current) onReadyRef.current();
            };
            img.onerror = () => {
              if (!isMounted) return;
              setReady(true);
              if (onReadyRef.current) onReadyRef.current();
            };
          } else {
            setReady(true);
            if (onReadyRef.current) onReadyRef.current();
          }
        } else {
          setReady(true);
          if (onReadyRef.current) onReadyRef.current();
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);


  const active = String(config.activeTemplate);
  const templateData = config.templates[active] ?? config.templates["1"];

  // ── Determine skeleton styles that EXACTLY match the target template ──────
  // This prevents any height/background jump when transitioning loading → template.
  const skeletonBg =
    config.activeTemplate === 2 || config.activeTemplate === 8 || config.activeTemplate === 9
      ? "bg-neutral-950"
      : config.activeTemplate === 4
      ? "bg-[#fafafa]"
      : config.activeTemplate === 6
      ? "bg-[var(--theme-primary)]"
      : "bg-white";

  const skeletonStyle: React.CSSProperties = {
    minHeight:
      config.activeTemplate === 2
        ? "calc(100vh + 6rem)"
        : "calc(100vh - 4rem)",
  };

  const skeletonMargin =
    config.activeTemplate === 1
      ? "mt-35 sm:mt-20 lg:mt-24"
      : "mt-16 sm:mt-20 lg:mt-24";

  const loaderColor =
    config.activeTemplate === 2 || config.activeTemplate === 8 || config.activeTemplate === 9
      ? "#ffffff"
      : "#8aca8d";

  // ── Render skeleton overlay if not ready ─────────────────────────────────
  if (!ready)
    return (
      <div
        style={skeletonStyle}
        className={`w-full ${skeletonBg} ${skeletonMargin} flex items-center justify-center`}
      >
        <div className="flex flex-col items-center gap-3">
          <PulseLoader color="#000000" />
        </div>
      </div>
    );

  if (config.activeTemplate === 2) return <Template2 data={templateData} />;
  if (config.activeTemplate === 3) return <Template3 data={templateData} />;
  if (config.activeTemplate === 4) return <Template4 data={templateData} />;
  if (config.activeTemplate === 5) return <Template5 data={templateData} />;
  if (config.activeTemplate === 6) return <Template6 data={templateData} />;
  if (config.activeTemplate === 7) return <Template7 data={templateData} />;
  if (config.activeTemplate === 8) return <Template8 data={templateData} />;
  if (config.activeTemplate === 9) return <Template9 data={templateData} />;
  return <Template1 data={templateData} />;
}
