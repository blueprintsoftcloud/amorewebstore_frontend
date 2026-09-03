// src/utils/occasionPresets.ts
//
// One-click "occasion" bundles for Homepage Manager (see HomepageManager.tsx's
// Occasions tab) — each preset just sets the same fields an admin could already set by
// hand (theme + each section's template + a bit of prefilled copy), applied together in
// one click instead of one at a time. Deliberately NOT a new backend concept: applying a
// preset fires the exact same PUT endpoints Homepage Manager's individual pickers
// already use (see applyOccasionPreset in HomepageManager.tsx), so a preset can never do
// anything an admin couldn't already do manually — no new failure mode to worry about.
//
// Every text field here (hero title/subtitle/CTA/badge, announcement text, footer
// tagline) is just the STARTING point — HomepageManager's confirm step shows them in an
// editable form before anything is saved, so an admin can tweak the wording for their
// own store without touching this file. Only the theme/template choices are fixed by
// the preset itself.
//
// Template numbers reference HeroSection.tsx (1-9), FooterSection.tsx (1-6), and the
// presentation-only pickers in AnnouncementBar.tsx/BannerCarousel.tsx/DiscountPage.tsx/
// FeaturedProducts.tsx (1-4 each). themeId references utils/themes.ts.

export interface HeroContentOverride {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  accentText?: string;
  badgeText?: string;
  highlightText?: string;
  bgImage?: string;
}

export interface OccasionPreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  themeId: string;
  heroTemplate: number;
  /** Merged over that template's own defaults — only the fields worth customizing for
   * this occasion need to be listed, everything else keeps the template's normal copy.
   * All editable in the Apply dialog before anything saves. */
  heroContentOverride?: HeroContentOverride;
  footerTemplate: number;
  /** Replaces the active footer template's tagline. Editable in the Apply dialog. */
  footerTaglineOverride?: string;
  announcementTemplate: number;
  /** Pipe-delimited, same format as the Announcement Bar tab's own textarea. Editable in
   * the Apply dialog. Applying this requires admin-level access (see saveAnnouncement's
   * role gate) — a staff member applying a preset will still get every other field, just
   * not this one. */
  announcementTextOverride?: string;
  carouselTemplate: number;
  discountTemplate: number;
  featuredTemplate: number;
}

export const OCCASION_PRESETS: OccasionPreset[] = [
  {
    id: "diwali",
    name: "Diwali",
    emoji: "🪔",
    description: "Festival of Lights — warm reds and gold, diagonal sale banner, festive accent footer.",
    themeId: "vermillion-utsav",
    heroTemplate: 6,
    heroContentOverride: {
      title: "Celebrate Diwali With Us",
      subtitle: "Festive collections, radiant savings.",
      ctaText: "Shop The Diwali Sale",
      accentText: "Festival Of Lights",
      badgeText: "30%\nOFF FESTIVE PICKS",
    },
    footerTemplate: 5,
    footerTaglineOverride: "Wishing you a Diwali full of light, joy, and new beginnings.",
    announcementTemplate: 4,
    announcementTextOverride: "Happy Diwali! | Festive offers inside | Free gift wrapping | Shop the celebration",
    carouselTemplate: 3,
    discountTemplate: 4,
    featuredTemplate: 1,
  },
  {
    id: "holi",
    name: "Holi",
    emoji: "🎨",
    description: "Festival of Colors — vibrant sale spotlight, bright accent band footer.",
    themeId: "vermillion-utsav",
    heroTemplate: 8,
    heroContentOverride: {
      title: "Splash Into The Holi Sale",
      subtitle: "Vibrant styles for the festival of colors.",
      ctaText: "Shop The Sale",
      accentText: "Festival Of Colors",
      badgeText: "40%\nOFF",
    },
    footerTemplate: 5,
    footerTaglineOverride: "Wishing you a Holi as vibrant as our new collection.",
    announcementTemplate: 2,
    announcementTextOverride: "Happy Holi! | Colorful new arrivals | Limited time offers",
    carouselTemplate: 2,
    discountTemplate: 2,
    featuredTemplate: 1,
  },
  {
    id: "eid",
    name: "Eid",
    emoji: "🌙",
    description: "Eid Mubarak — rich green & gold heritage tones, diagonal sale banner.",
    themeId: "emerald-heritage",
    heroTemplate: 6,
    heroContentOverride: {
      title: "Eid Mubarak — Celebrate In Style",
      subtitle: "Elegant festive wear for the celebration.",
      ctaText: "Shop Eid Collection",
      accentText: "Eid Mubarak",
      badgeText: "25%\nOFF FESTIVE WEAR",
    },
    footerTemplate: 5,
    footerTaglineOverride: "Wishing you joy, peace, and new beginnings this Eid.",
    announcementTemplate: 4,
    announcementTextOverride: "Eid Mubarak! | Festive collection now live | Special Eid offers inside",
    carouselTemplate: 3,
    discountTemplate: 4,
    featuredTemplate: 1,
  },
  {
    id: "onam",
    name: "Onam",
    emoji: "🌼",
    description: "Harvest festival — earthy artisan tones, product-spotlight hero.",
    themeId: "terra-loom",
    heroTemplate: 4,
    heroContentOverride: {
      title: "Happy Onam — Celebrate The Harvest",
      subtitle: "Traditional wear for a season of abundance.",
      ctaText: "Shop The Onam Collection",
      accentText: "Onam Special",
      highlightText: "Onam",
      badgeText: "20%\nOFF TRADITIONAL WEAR",
    },
    footerTemplate: 4,
    footerTaglineOverride: "Celebrating tradition, togetherness, and a season of abundance.",
    announcementTemplate: 1,
    announcementTextOverride: "Happy Onam! | Onam special collection | Free shipping this festive season",
    carouselTemplate: 2,
    discountTemplate: 2,
    featuredTemplate: 1,
  },
  {
    id: "christmas-new-year",
    name: "Christmas & New Year",
    emoji: "🎄",
    description: "Winter holidays — dark luxury palette with gold accents, festive sale banner.",
    themeId: "midnight-atelier",
    heroTemplate: 6,
    heroContentOverride: {
      title: "Season's Greetings, Special Savings",
      subtitle: "Ring in the new year in style.",
      ctaText: "Shop The Holiday Sale",
      accentText: "Holiday Collection",
      badgeText: "35%\nOFF EVERYTHING",
    },
    footerTemplate: 5,
    footerTaglineOverride: "Wishing you a joyful holiday season and a bright new year.",
    announcementTemplate: 4,
    announcementTextOverride: "Happy Holidays! | New Year sale now live | Free gift wrapping on all orders",
    carouselTemplate: 3,
    discountTemplate: 4,
    featuredTemplate: 3,
  },
  {
    id: "wedding-season",
    name: "Wedding Season",
    emoji: "💍",
    description: "Bridal & ethnic wear push — soft pastel palette, editorial hero and footer.",
    themeId: "blush-atelier",
    heroTemplate: 1,
    heroContentOverride: {
      title: "The Wedding Edit",
      subtitle: "Exquisite ethnic wear for your big celebrations.",
      ctaText: "Shop Wedding Collection",
    },
    footerTemplate: 6,
    footerTaglineOverride: "Curated for every ceremony, from the sangeet to the reception.",
    announcementTemplate: 2,
    announcementTextOverride: "Wedding season is here | Exclusive bridal collection | Book a styling consultation",
    carouselTemplate: 4,
    discountTemplate: 1,
    featuredTemplate: 4,
  },
  {
    id: "republic-day",
    name: "Republic Day Sale",
    emoji: "🇮🇳",
    description: "Patriotic sale push — premium indigo & gold tones, giant discount spotlight.",
    themeId: "indigo-mustard",
    heroTemplate: 8,
    heroContentOverride: {
      title: "Republic Day Sale",
      subtitle: "Celebrating India with special savings.",
      ctaText: "Shop The Sale",
      accentText: "Republic Day Special",
      badgeText: "26%\nOFF STOREWIDE",
    },
    footerTemplate: 5,
    footerTaglineOverride: "Proud to celebrate Republic Day with you.",
    announcementTemplate: 4,
    announcementTextOverride: "Happy Republic Day | Special 26% off storewide | Celebrate with savings",
    carouselTemplate: 3,
    discountTemplate: 4,
    featuredTemplate: 1,
  },
  {
    id: "valentines",
    name: "Valentine's Day",
    emoji: "💝",
    description: "Romance & gifting push — soft pastel palette, gift-focused copy.",
    themeId: "blush-atelier",
    heroTemplate: 6,
    heroContentOverride: {
      title: "Love Is In The Details",
      subtitle: "Curated gifts and styles for the ones you love.",
      ctaText: "Shop Valentine's Edit",
      accentText: "Valentine's Day",
      badgeText: "20%\nOFF GIFT PICKS",
    },
    footerTemplate: 4,
    footerTaglineOverride: "For the ones you love — this Valentine's and always.",
    announcementTemplate: 2,
    announcementTextOverride: "Valentine's Day is coming | Shop gifts for someone special | Free gift wrapping",
    carouselTemplate: 2,
    discountTemplate: 2,
    featuredTemplate: 2,
  },
  {
    id: "sale-event",
    name: "Big Sale Event",
    emoji: "🏷️",
    description: "Black Friday / End-of-Season — bold monochrome, giant discount numeral, urgency-led copy.",
    themeId: "charcoal-form",
    heroTemplate: 8,
    heroContentOverride: {
      title: "Everything Must Go",
      subtitle: "Our biggest markdowns of the year — while stock lasts.",
      ctaText: "Shop The Sale",
      accentText: "Sale Ends Soon",
      badgeText: "70%\nOFF",
    },
    footerTemplate: 5,
    footerTaglineOverride: "Don't miss out — our biggest prices of the year.",
    announcementTemplate: 4,
    announcementTextOverride: "Mega Sale Live Now | Up to 70% off | While stocks last",
    carouselTemplate: 3,
    discountTemplate: 4,
    featuredTemplate: 3,
  },
  {
    id: "summer-coastal",
    name: "Summer / Coastal",
    emoji: "🌴",
    description: "Breezy resort-summer palette, full-bleed photo hero, calm grid layouts throughout.",
    themeId: "coral-tide",
    heroTemplate: 9,
    heroContentOverride: {
      title: "The Summer Edit",
      subtitle: "Light fabrics, bright colors, endless sunshine.",
      ctaText: "Shop Summer",
      accentText: "New In",
    },
    footerTemplate: 4,
    footerTaglineOverride: "Effortless style for long, sunny days.",
    announcementTemplate: 1,
    announcementTextOverride: "Summer collection now live | Free shipping over ₹999 | Beat the heat in style",
    carouselTemplate: 2,
    discountTemplate: 1,
    featuredTemplate: 2,
  },
];
