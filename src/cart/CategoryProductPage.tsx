import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Popover } from "@headlessui/react";
import {
  ShoppingBag,
  ArrowRight,
  Filter,
  ArrowLeft,
  X,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
  Star,
} from "lucide-react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

// Components
import Navbar from "../components/Navbar";
import FooterSection from "../components/FooterSection";
import PageSeo from "../components/seo/PageSeo";
import { BreadcrumbJsonLd } from "../components/seo/JsonLd";
import api from "../utils/api";
import { normalizeProduct } from "../utils/product";
import AttributeFilterPanel, {
  type ActiveFilters as DynFilters,
  type AttributeFilterPanelHandle,
} from "../components/AttributeFilterPanel";
import PriceRangeSlider from "../components/PriceRangeSlider";

interface CategoryProduct {
  id: string;
  name: string;
  brand?: string;
  price: number;
  image?: string;
  stock?: number;
  sizes?: string[];
  size?: string;
  color?: string;
  discount?: number;
  category?: { name?: string } | string;
  categoryName?: string;
  /** Set when this card represents one specific active variant of a product with
   * options (e.g. Storage/Color) instead of a plain single-SKU product — see backend's
   * expandProductsWithVariants. Null/absent for a plain product. */
  variantId?: string | null;
  variantOptions?: Record<string, string> | null;
}

interface SelectedFilters {
  size: string[];
  color: string[];
  discount: boolean;
  inStock: boolean;
}

interface FlatCategory {
  id: string;
  name: string;
  parentId: string | null;
}

// --- CUSTOM HOOKS ---
const useInfiniteScroll = (callback: () => void) => {
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 500
      ) {
        callback();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [callback]);
};

function classNames(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

// MODERN SKELETON LOADER
const SkeletonCard = () => (
  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-gray-100 animate-pulse">
    <div className="absolute top-4 right-4 h-10 w-10 rounded-full bg-gray-200" />
    <div className="absolute bottom-4 left-4 right-4 h-20 rounded-2xl bg-gray-200" />
  </div>
);

// MODERN PRODUCT CARD
// Wishlist/add-to-cart both require a specific variant selection (size/color/etc), so
// they live only on the product detail page's variant picker — this listing card is
// just a "browse and open" surface, one card per product (see paginateListingRows'
// per-product collapse on the backend).
const ModernProductCard = React.memo(function ModernProductCard({ product }: { product: CategoryProduct }) {
  const navigate = useNavigate();

  const imageUrl =
    product.image || "https://placehold.co/600x800?text=No+Image";

  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
  };

  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : product.category || product.categoryName;

  const finalPrice =
    (product.discount ?? 0) > 0
      ? product.price * (1 - (product.discount ?? 0) / 100)
      : product.price;

  return (
    <div
      onClick={handleCardClick}
      className="group relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-3xl bg-gray-50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
    >
      {/* Product Image */}
      <img
        src={imageUrl}
        alt={product.name}
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        loading="lazy"
      />

      {/* Gradient Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/10 opacity-60 transition-opacity duration-300 group-hover:opacity-80" />

      {/* Top Badge */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <span className="pointer-events-auto rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-900 shadow-sm backdrop-blur-md">
          {categoryName || "Collection"}
        </span>
      </div>

      {/* Bottom Floating Info Card */}
      <div className="absolute bottom-3 left-3 right-3 transition-transform duration-300 group-hover:-translate-y-1">
        <div className="flex items-center justify-between rounded-2xl bg-white/90 p-3.5 shadow-lg backdrop-blur-md border border-white/40">
          <div className="flex flex-col truncate pr-2">
            {product.brand && (
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1 truncate">
                {product.brand}
              </span>
            )}
            <h3 className="truncate text-xs font-bold text-gray-900">
              {product.name}
            </h3>
            {product.variantOptions && Object.keys(product.variantOptions).length > 0 && (
              <span className="truncate text-[9px] font-medium text-gray-500">
                {Object.entries(product.variantOptions)
                  .map(([axis, value]) => `${axis}: ${value}`)
                  .join(" · ")}
              </span>
            )}

            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-extrabold text-gray-900">
                ₹{finalPrice.toFixed(0)}
              </span>
              {(product.discount ?? 0) > 0 && (
                <>
                  <span className="text-[10px] text-gray-400 line-through">
                    ₹{product.price?.toFixed(0)}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    {product.discount}% OFF
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-900 group-hover:bg-black group-hover:text-white transition-colors duration-300">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
});

// Every threshold implicitly includes everything above it (4★ & above already covers
// 5★), so checking several boxes is redundant except for the LOOSEST one checked —
// e.g. checking both "3★ & above" and "1★ & above" only ever needs minRating=1, since
// that already covers everything the 3★ box would. Multi-checkbox "OR of nested
// ranges" collapses to a single min() — see applyAllFilters below.
const RATING_THRESHOLDS = [4, 3, 2, 1];

const RatingsFilterSection = ({
  selected,
  onToggle,
}: {
  selected: Set<number>;
  onToggle: (threshold: number) => void;
}) => (
  <div className="pt-5">
    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
      Customer Ratings
    </h4>
    <div className="space-y-2.5">
      {RATING_THRESHOLDS.map((t) => (
        <label key={t} className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={selected.has(t)}
            onChange={() => onToggle(t)}
            className="w-4 h-4 rounded text-[var(--theme-primary)] border-gray-300 focus:ring-[var(--theme-primary)]"
          />
          <span className="flex items-center gap-1 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
            {t}
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            &amp; above
          </span>
        </label>
      ))}
    </div>
  </div>
);

// FILTER CONTROL COMPONENT
//
// The in-page subcategory tree that used to live here was removed — the site-wide
// CategoryMegaMenu (see Navbar.tsx) now owns category browsing everywhere. What's left
// — Price, Customer Ratings (both built-in, every product has them), and Attributes
// like Fabric/Color (category-specific, admin-defined) — is shown to shoppers purely
// as "Filters"; "Attribute" is backend/admin schema terminology, not something a
// customer needs to know. Everything here is staged, not instant: nothing refetches
// the product grid until the single "Apply Filters" button at the bottom is pressed,
// so dragging the price slider or browsing several attribute options doesn't fire a
// request per pixel/click.
const FilterControls = ({
  resetFilters,
  onApply,
  ratingsSection,
  priceSection,
  attributesSection,
}: {
  resetFilters: () => void;
  onApply: () => void;
  ratingsSection?: React.ReactNode;
  priceSection?: React.ReactNode;
  attributesSection?: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-gray-900 font-bold">
          <SlidersHorizontal className="w-4 h-4 text-gray-700" />
          <span className="text-sm uppercase tracking-wider">Filters</span>
        </div>
        <button
          onClick={resetFilters}
          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          Clear
        </button>
      </div>

      {ratingsSection}
      {priceSection}
      {attributesSection}

      <div className="pt-6">
        <button
          type="button"
          onClick={onApply}
          className="w-full py-3.5 bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-[var(--theme-primary-hover)] transition-all shadow-md active:scale-98 cursor-pointer"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const CategoryProductsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Page title is the top-level ancestor of whatever category `slug` resolves to
  // (itself when the slug already is a root category) — see the effect below.
  const [categoryName, setCategoryName] = useState("");
  const [sortType, setSortType] = useState("featured");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Dynamic attribute filters (AttributeFilterPanel)
  const [activeAttrValueIds, setActiveAttrValueIds] = useState<string[]>([]);
  const attrIdsKey = activeAttrValueIds.slice().sort().join(",");
  const [dynFilterResetKey, setDynFilterResetKey] = useState(0);

  const handleDynFiltersChange = useCallback((f: DynFilters) => {
    setActiveAttrValueIds((prev) => {
      const next = f.attributeValueIds.slice().sort();
      const cur = prev.slice().sort();
      if (next.join(",") === cur.join(",")) return prev;
      return next;
    });
    // AttributeFilterPanel's sidebar layout only fires this on an explicit "Apply
    // Filter" press (see its applyNow) — on mobile that's the moment to dismiss the
    // drawer and reveal the (now filtering) product grid. A no-op on desktop, where
    // this state is never true.
    setIsMobileFilterOpen(false);
  }, []);

  const [activeFilters, setActiveFilters] = useState<SelectedFilters>({
    size: [],
    color: [],
    discount: false,
    inStock: false,
  });

  // Built-in Price + Customer Rating filters — every product has these, unlike
  // Fabric/Color which are category-specific admin-defined attributes. Staged the
  // same way as AttributeFilterPanel's sidebar mode: "pending" tracks in-progress
  // slider drags/checkbox clicks, "applied" is what's actually sent to the backend,
  // and the two only sync when the shared "Apply Filters" button fires (see
  // applyAllFilters below).
  const [priceBounds, setPriceBounds] = useState<{ min: number; max: number } | null>(null);
  const [pendingPriceRange, setPendingPriceRange] = useState<[number, number] | null>(null);
  const [appliedPriceRange, setAppliedPriceRange] = useState<[number, number] | null>(null);
  const [pendingRatingThresholds, setPendingRatingThresholds] = useState<Set<number>>(new Set());
  const [appliedMinRating, setAppliedMinRating] = useState<number | null>(null);

  // Desktop and mobile drawer each mount their OWN AttributeFilterPanel instance with
  // independent internal selection state, so each needs its own ref for the shared
  // Apply button to commit the co-located instance.
  const desktopAttrPanelRef = useRef<AttributeFilterPanelHandle>(null);
  const mobileAttrPanelRef = useRef<AttributeFilterPanelHandle>(null);

  // Fetch the price bounds for this category's subtree (backend already computes this
  // in getProductFilters — see product-user.controller.ts — it was just unused here
  // until now) and seed the pending range to the full bounds on first load / category
  // switch.
  useEffect(() => {
    if (!slug) return;
    api
      .get(`/user/shop/categories/${slug}/filters`)
      .then((res) => {
        const range = res.data.priceRange;
        if (range && typeof range.min === "number" && typeof range.max === "number") {
          setPriceBounds({ min: Math.floor(range.min), max: Math.ceil(range.max) });
        } else {
          setPriceBounds(null);
        }
      })
      .catch(() => setPriceBounds(null));
  }, [slug]);

  useEffect(() => {
    if (!priceBounds) return;
    setPendingPriceRange([priceBounds.min, priceBounds.max]);
  }, [priceBounds]);

  const toggleRatingThreshold = (threshold: number) => {
    setPendingRatingThresholds((prev) => {
      const next = new Set(prev);
      next.has(threshold) ? next.delete(threshold) : next.add(threshold);
      return next;
    });
  };

  // Desktop and mobile drawer each mount their OWN AttributeFilterPanel instance
  // (see desktopAttrPanelRef/mobileAttrPanelRef above) — both stay mounted at all
  // times (the drawer/aside are only CSS-hidden, not unmounted), so calling
  // applyNow() on BOTH refs unconditionally would let whichever one the user *didn't*
  // touch (still sitting at its empty default selection) clobber the real one right
  // after it applies. Only the ref the caller identifies as "the one the user actually
  // used" gets applied.
  const applyAllFilters = (panelRef: React.RefObject<AttributeFilterPanelHandle | null>) => {
    setAppliedPriceRange(pendingPriceRange);
    setAppliedMinRating(
      pendingRatingThresholds.size > 0 ? Math.min(...pendingRatingThresholds) : null
    );
    panelRef.current?.applyNow();
    setIsMobileFilterOpen(false);
  };

  const fetchProductsByCategory = useCallback(
    async (pageNum = 1, reset = false) => {
      if (!slug) return;
      if (reset) {
        setLoading(true);
      }

      try {
        setError(null);
        const params: Record<string, string | number> = {
          sort: sortType,
          page: pageNum,
          limit: 12,
        };

        if (activeFilters.size.length > 0) {
          params.sizes = activeFilters.size.join(",");
        }
        if (activeFilters.inStock) {
          params.inStock = "true";
        }
        if (activeFilters.discount) {
          params.onSale = "true";
        }
        if (activeAttrValueIds.length > 0) {
          params.attributeValueIds = activeAttrValueIds.join(",");
        }
        if (appliedPriceRange && priceBounds) {
          // Only send bounds the user actually narrowed — an untouched slider at its
          // full extent shouldn't add a redundant min/maxPrice query param.
          const [lo, hi] = appliedPriceRange;
          if (lo > priceBounds.min) params.minPrice = lo;
          if (hi < priceBounds.max) params.maxPrice = hi;
        }
        if (appliedMinRating !== null) {
          params.minRating = appliedMinRating;
        }

        const res = await api.get(`/user/shop/categories/${slug}`, { params });
        const newProducts = (res.data.getProducts || []).map(normalizeProduct);

        if (reset) {
          setProducts(newProducts);
        } else {
          setProducts((prev) => [...prev, ...newProducts]);
        }

        // Page title comes from the resolved root category (see the effect below),
        // not from the products themselves — a subcategory's products still carry
        // their own (sub)category name, which would otherwise override the top-level
        // title we deliberately show instead.

        setHasMore(newProducts.length === 12);
        setPage(pageNum);
      } catch (err) {
        setError("Unable to load products at this time");
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [slug, sortType, activeFilters, activeAttrValueIds, appliedPriceRange, appliedMinRating, priceBounds]
  );

  // Client-side real-time product filtering based on search query
  const displayedProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const pName = p.name?.toLowerCase() || "";
      const pBrand = p.brand?.toLowerCase() || "";
      const pCat =
        typeof p.category === "object"
          ? p.category?.name?.toLowerCase() || ""
          : String(p.category || "").toLowerCase();
      return pName.includes(q) || pBrand.includes(q) || pCat.includes(q);
    });
  }, [products, searchQuery]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchProductsByCategory(page + 1, false);
    }
  }, [loading, hasMore, page, fetchProductsByCategory]);

  const priceRangeKey = appliedPriceRange ? appliedPriceRange.join(",") : "";

  useEffect(() => {
    fetchProductsByCategory(1, true);
  }, [slug, sortType, activeFilters, attrIdsKey, priceRangeKey, appliedMinRating]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setInitialLoading(true);
    setProducts([]);

    if (slug) {
      api
        .get("/user/shop/categories")
        .then((res) => {
          const rawList = res.data.categories || [];
          const normalized: FlatCategory[] = rawList.map((c: any) => ({
            id: String(c.id ?? c._id),
            name: c.name,
            parentId: c.parentId ? String(c.parentId) : null,
          }));

          const matched = rawList.find(
            (c: any) =>
              String(c.id) === String(slug) ||
              String(c._id) === String(slug) ||
              String(c.code).toLowerCase() === String(slug).toLowerCase() ||
              String(c.name).toLowerCase() === String(slug).toLowerCase()
          );
          if (!matched) return;

          const matchedId = String(matched.id ?? matched._id);

          // Walk up parentId pointers to the top-level ancestor — that's the name the
          // page titles itself with, regardless of how deep the actual slug's
          // subcategory sits.
          let rootNode = normalized.find((c) => c.id === matchedId) ?? null;
          while (rootNode?.parentId) {
            const parent = normalized.find((c) => c.id === rootNode!.parentId);
            if (!parent) break;
            rootNode = parent;
          }

          if (rootNode?.name && isNaN(Number(rootNode.name.trim()))) {
            setCategoryName(rootNode.name);
          }
        })
        .catch(() => {});
    }
  }, [slug]);

  useInfiniteScroll(loadMore);

  const resetFilters = () => {
    const empty: SelectedFilters = {
      size: [],
      color: [],
      discount: false,
      inStock: false,
    };
    setActiveFilters(empty);
    setActiveAttrValueIds([]);
    setSearchQuery("");
    setDynFilterResetKey((k) => k + 1);
    setPendingRatingThresholds(new Set());
    setAppliedMinRating(null);
    setPendingPriceRange(priceBounds ? [priceBounds.min, priceBounds.max] : null);
    setAppliedPriceRange(null);
    setIsMobileFilterOpen(false);
  };

  const hasActiveFilters =
    activeFilters.size.length > 0 ||
    activeFilters.color.length > 0 ||
    activeFilters.discount ||
    activeFilters.inStock ||
    activeAttrValueIds.length > 0 ||
    appliedMinRating !== null ||
    (appliedPriceRange !== null &&
      priceBounds !== null &&
      (appliedPriceRange[0] > priceBounds.min || appliedPriceRange[1] < priceBounds.max));
  const isCategoryEmpty = products.length === 0 && !hasActiveFilters && !loading;

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-24 bg-gradient-to-r from-gray-50 to-white" />
        <div className="max-w-7xl mx-auto px-4 py-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchProductsByCategory(1, true)}
            className="px-6 py-3 bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] rounded-lg hover:bg-[var(--theme-primary-hover)] transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
      <PageSeo
        title={categoryName || "Shop"}
        description={categoryName ? `Shop ${categoryName} — browse the full collection.` : undefined}
        path={`/categories/${slug}`}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: categoryName || "Category", path: `/categories/${slug}` },
        ]}
      />
      <main className={`max-w-7xl mx-auto px-4 pt-4 pb-16 mt-(--app-header-h) w-full flex-1 flex flex-col ${isCategoryEmpty ? "justify-center min-h-[calc(100vh-10rem)]" : ""}`}>
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors mb-4 mt-5 shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 transform transition-transform group-hover:-translate-x-1" />
          <span>Go Back</span>
        </button>

        {/* --- CENTERED HEADING WITH UNDERLINE --- */}
        {!isCategoryEmpty && (
          <div className="text-center mb-6">
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold tracking-tight sm:text-4xl font-sans text-black capitalize"
            >
              {categoryName && isNaN(Number(categoryName.trim()))
                ? categoryName
                : "Collection"}
            </motion.h2>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "60px" }}
              transition={{ duration: 0.8 }}
              className="h-1 bg-[var(--theme-primary)] mx-auto mt-2 rounded-full"
            />
          </div>
        )}

        {/* --- COMPACT CONTROLS BAR (SEARCH & SORT) --- */}
        {!isCategoryEmpty && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
            {/* Search Box with Embedded Clear (X) Button */}
            <div className="relative w-full sm:w-64 md:w-72">
              
            </div>

            {/* Right Controls: Sort & Mobile Filter */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Popover className="relative w-full sm:w-auto">
                <Popover.Button className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-1 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 rounded-full text-xs font-medium text-gray-700 focus:outline-none cursor-pointer transition-colors">
                  <span className="truncate">
                    {sortType === "featured" && "Sort By: Featured"}
                    {sortType === "newest" && "Sort By: Newest"}
                    {sortType === "price-asc" && "Price: Low to High"}
                    {sortType === "price-desc" && "Price: High to Low"}
                    {sortType === "popular" && "Most Popular"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-gray-400 shrink-0" />
                </Popover.Button>
                <Popover.Panel className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl p-1.5 z-30 ring-1 ring-black/5">
                  {({ close }) => (
                    <div className="flex flex-col gap-0.5">
                      {[
                        { label: "Featured", value: "featured" },
                        { label: "Newest Arrivals", value: "newest" },
                        { label: "Price: Low to High", value: "price-asc" },
                        { label: "Price: High to Low", value: "price-desc" },
                        { label: "Most Popular", value: "popular" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={classNames(
                            sortType === option.value
                              ? "bg-slate-100 text-gray-900 font-bold"
                              : "text-gray-700 hover:bg-gray-50",
                            "block w-full px-3 py-1.5 text-left text-xs rounded-xl transition-colors cursor-pointer"
                          )}
                          onClick={() => {
                            setSortType(option.value);
                            close();
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </Popover.Panel>
              </Popover>

              {/* Mobile Filters Button */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <Filter className="h-3.5 w-3.5" /> Filters
              </button>
            </div>
          </div>
        )}

        <div className={isCategoryEmpty ? "my-auto flex-1 flex flex-col justify-center" : ""}>
          {isCategoryEmpty ? (
            <div className="flex flex-col items-center justify-center py-12 text-center my-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                No products available
              </h3>
              <p className="text-xs text-gray-500 max-w-xs mb-6 font-medium">
                We are currently curating new styles for this collection. Please check back soon!
              </p>
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[var(--theme-primary-hover)] transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div>
              {/* Results Counter */}
              <div className="mb-4 text-xs text-gray-500 text-right">
                Showing <strong className="text-gray-900">{displayedProducts.length}</strong> items
              </div>

              {/* MAIN CONTENT GRID */}
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* DESKTOP SIDEBAR */}
                <aside className="lg:w-64 flex-shrink-0 hidden lg:block">
                  <div className="sticky top-24 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <FilterControls
                      resetFilters={resetFilters}
                      onApply={() => applyAllFilters(desktopAttrPanelRef)}
                      ratingsSection={
                        <RatingsFilterSection
                          selected={pendingRatingThresholds}
                          onToggle={toggleRatingThreshold}
                        />
                      }
                      priceSection={
                        priceBounds && pendingPriceRange ? (
                          <div className="pt-5">
                            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                              Price
                            </h4>
                            <PriceRangeSlider
                              bounds={priceBounds}
                              value={pendingPriceRange}
                              onChange={setPendingPriceRange}
                            />
                          </div>
                        ) : undefined
                      }
                      attributesSection={
                        slug ? (
                          <AttributeFilterPanel
                            ref={desktopAttrPanelRef}
                            categoryId={slug}
                            onFiltersChange={handleDynFiltersChange}
                            resetKey={dynFilterResetKey}
                          />
                        ) : undefined
                      }
                    />
                  </div>
                </aside>

                {/* PRODUCTS GRID */}
                <div className="flex-1 w-full">
                  {displayedProducts.length === 0 && !loading ? (
                    <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        No products found
                      </h3>
                      <p className="text-gray-500 mb-6 max-w-sm mx-auto text-xs">
                        We couldn't find any products matching your search or filters.
                      </p>
                      <button
                        onClick={resetFilters}
                        className="px-6 py-2 bg-white border border-gray-300 text-gray-900 text-xs font-bold rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div
                      className={classNames(
                        "transition-opacity duration-200",
                        loading ? "opacity-50 pointer-events-none" : "opacity-100"
                      )}
                    >
                      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                        {displayedProducts.map((product) => (
                          <ModernProductCard key={product.id} product={product} />
                        ))}
                      </div>

                      {hasMore && !searchQuery && (
                        <div className="text-center mt-12">
                          <button
                            onClick={loadMore}
                            disabled={loading}
                            className="px-8 py-3 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[var(--theme-primary)] hover:text-[var(--theme-primary-ink)] hover:border-[var(--theme-primary)] transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {loading
                              ? "Loading more styles..."
                              : "Load More Products"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MOBILE FILTER DRAWER */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-xs bg-white p-6 shadow-2xl flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <h3 className="text-base font-bold text-gray-900">Filters</h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <FilterControls
                  resetFilters={resetFilters}
                  onApply={() => applyAllFilters(mobileAttrPanelRef)}
                  ratingsSection={
                    <RatingsFilterSection
                      selected={pendingRatingThresholds}
                      onToggle={toggleRatingThreshold}
                    />
                  }
                  priceSection={
                    priceBounds && pendingPriceRange ? (
                      <div className="pt-5">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                          Price
                        </h4>
                        <PriceRangeSlider
                          bounds={priceBounds}
                          value={pendingPriceRange}
                          onChange={setPendingPriceRange}
                        />
                      </div>
                    ) : undefined
                  }
                  attributesSection={
                    slug ? (
                      <AttributeFilterPanel
                        ref={mobileAttrPanelRef}
                        categoryId={slug}
                        onFiltersChange={handleDynFiltersChange}
                        resetKey={dynFilterResetKey}
                      />
                    ) : undefined
                  }
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!isCategoryEmpty && <FooterSection />}
    </div>
  );
};

export default CategoryProductsPage;