// src/components/CategoryMegaMenu.tsx
// Site-wide "browse by category" bar rendered directly under Navbar (see Navbar.tsx's
// header). Top-level categories (parentId null) each become a bar item; hovering one
// that has subcategories opens a multi-column flyout — one column per direct child,
// with that child's own children listed underneath it. Clicking any node navigates
// straight to its product page (/categories/:id) — CategoryProductPage.tsx already
// refetches both products and the AttributeFilterPanel's attributes whenever the
// category id in the URL changes, so "the products and filter attributes change based
// on the item selected" falls out of normal route navigation with no extra wiring.
//
// Content is fully derived from live Category data (GET /user/shop/categories, the
// same endpoint CategoryProductPage.tsx already uses) — there is no separate curated
// menu structure to keep in sync. The only admin control is per-top-level-category
// `showInNav` / `navOrder`, set from Homepage Manager (see HomepageManager.tsx's
// Navigation tab) and applied server-side (product-user.controller.ts's
// getAllCategories already filters/orders by them).

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "../utils/api";

interface FlatCategory {
  id: string;
  name: string;
  parentId: string | null;
  showInNav?: boolean;
}

const CategoryMegaMenu: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [openTopId, setOpenTopId] = useState<string | null>(null);
  // Position for the flyout, captured from the trigger button's own bounding rect
  // (see openMenu) — the flyout is portaled to document.body rather than rendered
  // as an absolute-positioned child of the scroll row below, because a horizontally
  // scrollable container (overflow-x: auto) forces its OTHER axis to clip too (a CSS
  // spec quirk, not a bug) — any dropdown nested inside it would get its vertical
  // overflow silently cut off. Same fix already used for the admin product list's
  // action menu.
  const [menuPos, setMenuPos] = useState<{ left: number; top: number } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: "smooth" });
  };

  useEffect(() => {
    api
      .get("/user/shop/categories")
      .then((res) => {
        const raw = res.data.categories || [];
        const normalized: FlatCategory[] = raw.map((c: any) => ({
          id: String(c.id ?? c._id),
          name: c.name,
          parentId: c.parentId ? String(c.parentId) : null,
          showInNav: c.showInNav !== false,
        }));
        setCategories(normalized);
      })
      .catch(() => setCategories([]));
  }, []);

  const childrenOf = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  // Server already orders by navOrder/name and filters isActive, but showInNav needs
  // applying client-side same as any other display concern — it only ever matters for
  // top-level items, a subcategory has no independent nav slot of its own.
  const topLevel = categories.filter((c) => !c.parentId && c.showInNav !== false);

  // Recompute arrow visibility once the real (possibly overflowing) row has painted,
  // and again on resize — the number of top-level items is data-driven, so whether it
  // overflows at all depends on viewport width, not just item count.
  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [topLevel.length]);

  if (topLevel.length === 0) return null;

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openMenu = (id: string, triggerEl: HTMLElement) => {
    cancelClose();
    const rect = triggerEl.getBoundingClientRect();
    setMenuPos({ left: rect.left, top: rect.bottom });
    setOpenTopId(id);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenTopId(null), 150);
  };

  const goTo = (id: string) => {
    setOpenTopId(null);
    navigate(`/categories/${id}`);
  };

  const openTop = topLevel.find((t) => t.id === openTopId) ?? null;
  const openColumns = openTop ? childrenOf(openTop.id) : [];

  return (
    <div className="relative z-10 w-full bg-white/90 backdrop-blur-xl border-b border-black/5">
      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {canScrollLeft && (
          <>
            <div className="hidden lg:block pointer-events-none absolute left-4 sm:left-6 lg:left-8 top-0 bottom-0 w-10 bg-gradient-to-r from-white to-transparent z-10" />
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              aria-label="Scroll categories left"
              className="hidden lg:flex items-center justify-center absolute left-0 top-0 bottom-0 z-20 w-6 text-slate-500 hover:text-black cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}

        <nav
          ref={scrollRef}
          onScroll={updateScrollState}
          onMouseLeave={scheduleClose}
          className="hidden lg:flex items-center gap-1 xl:gap-2 overflow-x-auto flex-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {topLevel.map((top) => {
            const columns = childrenOf(top.id);
            const hasMenu = columns.length > 0;
            const isOpen = openTopId === top.id;

            return (
              <div
                key={top.id}
                className="relative shrink-0"
                onMouseEnter={(e) => hasMenu && openMenu(top.id, e.currentTarget)}
              >
                <button
                  type="button"
                  onClick={() => goTo(top.id)}
                  className={`px-3 py-2 xl:px-4 xl:py-2.5 text-xs xl:text-sm font-bold tracking-tight whitespace-nowrap transition-colors duration-200 cursor-pointer ${
                    isOpen ? "text-black" : "text-slate-600 hover:text-black"
                  }`}
                >
                  {top.name}
                </button>
              </div>
            );
          })}
        </nav>

        {canScrollRight && (
          <>
            <div className="hidden lg:block pointer-events-none absolute right-4 sm:right-6 lg:right-8 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent z-10" />
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              aria-label="Scroll categories right"
              className="hidden lg:flex items-center justify-center absolute right-0 top-0 bottom-0 z-20 w-6 text-slate-500 hover:text-black cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Flyout is portaled to document.body (position: fixed, anchored to the trigger's
          own rect captured in openMenu) rather than living inside the scrollable <nav>
          above — overflow-x: auto on that row forces its vertical axis to clip too (see
          the comment on menuPos), which would cut this panel off. */}
      {openTop && openColumns.length > 0 && menuPos &&
        createPortal(
          <div
            className="fixed z-50 pt-2"
            style={{ left: menuPos.left, top: menuPos.top }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            <div className="flex gap-8 rounded-2xl border border-black/5 bg-white shadow-2xl shadow-black/10 px-6 py-5 min-w-[420px]">
              {openColumns.map((col) => {
                const grandchildren = childrenOf(col.id);
                return (
                  <div key={col.id} className="min-w-[140px]">
                    <button
                      type="button"
                      onClick={() => goTo(col.id)}
                      className="block text-left text-xs font-bold uppercase tracking-wide text-gray-900 hover:text-black mb-2 cursor-pointer whitespace-nowrap"
                    >
                      {col.name}
                    </button>
                    {grandchildren.length > 0 && (
                      <ul className="space-y-1.5">
                        {grandchildren.map((leaf) => (
                          <li key={leaf.id}>
                            <button
                              type="button"
                              onClick={() => goTo(leaf.id)}
                              className="text-left text-xs text-gray-500 hover:text-black transition-colors cursor-pointer whitespace-nowrap"
                            >
                              {leaf.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default CategoryMegaMenu;
