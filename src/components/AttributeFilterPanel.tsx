// src/components/AttributeFilterPanel.tsx
// Shared attribute-based product filter panel — used by both the customer storefront
// (cart/CategoryProductPage.tsx) and the admin catalog browser's embedded product list
// (products/Listproducts.tsx). Sourced from the subtree-aware filters endpoint so it
// works correctly regardless of how deep in the category tree it's mounted (attributes
// are defined per-leaf-category only — see backend/src/controllers/product-user
// .controller.ts's getProductFilters, which aggregates them across every leaf
// descendant of `categoryId`).
//
// TEXT/NUMBER/DATE attributes are deliberately not filterable here (they never made it
// past the UI before this rewrite either) — they stay enterable/visible at the product
// level, just not part of this panel. The backend already excludes them from its response.
//
// Two layouts, same underlying selection state, different commit behavior:
//   - "sidebar" (default): each attribute is a full-width, always-expanded block,
//     stacked vertically (the storefront usage). STAGED — selections only take effect
//     when applied, so browsing several options doesn't refetch the product grid on
//     every click. There's no Apply button *inside* this component in sidebar mode —
//     it sits in a sidebar alongside other built-in filters (price, rating), which all
//     commit together behind ONE shared Apply button in the parent (see
//     CategoryProductPage.tsx's FilterControls). Sidebar-mode callers get an
//     imperative `applyNow()` via ref to trigger that commit.
//   - "toolbar": each attribute collapses into a compact popover trigger, all of them
//     sitting in a wrapping horizontal row (the admin catalog view, Listproducts.tsx —
//     a vertical stack of full-width blocks breaks down fast in a horizontal strip once
//     there's more than one or two attributes). INSTANT — applies on every click, no
//     button, since an admin quick-filtering the catalog wants immediate feedback.

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Popover } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import api from "../utils/api";
import type { AttributeType } from "../constants/attributeTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterValue {
  value: string;
  /** One displayed value can map to several underlying CategoryAttributeValue ids —
   * e.g. the same "Red" defined independently on two sibling leaf categories. */
  ids: string[];
}

interface FilterAttribute {
  name: string;
  type: AttributeType;
  values: FilterValue[];
}

export interface ActiveFilters {
  attributeValueIds: string[];
}

interface Props {
  categoryId: string;
  onFiltersChange: (filters: ActiveFilters) => void;
  resetKey?: number; // increment to reset all selections
  layout?: "sidebar" | "toolbar";
}

export interface AttributeFilterPanelHandle {
  /** Commits the currently staged selection. No-op if there's nothing pending —
   * safe for the parent's shared Apply button to always call unconditionally. */
  applyNow: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const keyOf = (attr: FilterAttribute, value: string) => `${attr.type}::${attr.name}::${value}`;

const AttributeFilterPanel = forwardRef<AttributeFilterPanelHandle, Props>(({ categoryId, onFiltersChange, resetKey, layout = "sidebar" }, ref) => {
  const [attributes, setAttributes] = useState<FilterAttribute[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  // Track last emitted value to avoid calling onFiltersChange with identical data
  const lastEmittedRef = useRef<string>("");

  // Reset internal state when resetKey changes (parent clicked "Clear")
  useEffect(() => {
    if (resetKey === undefined) return;
    setSelectedKeys(new Set());
  }, [resetKey]);

  // Fetch filterable attributes for this category's subtree
  useEffect(() => {
    if (!categoryId) return;
    setSelectedKeys(new Set());

    api
      .get(`/user/shop/categories/${categoryId}/filters`)
      .then((res) => setAttributes(res.data.attributes ?? []))
      .catch(() => setAttributes([]));
  }, [categoryId]);

  const computeIds = () =>
    attributes
      .flatMap((attr) => attr.values.filter((v) => selectedKeys.has(keyOf(attr, v.value))).flatMap((v) => v.ids))
      .sort();

  // Toolbar mode only: propagate on every change, instantly. Sidebar mode stages the
  // selection instead — see applyNow, wired to the "Apply Filter" button below.
  useEffect(() => {
    if (layout !== "toolbar") return;
    const ids = computeIds();
    const key = ids.join(",");
    if (key === lastEmittedRef.current) return; // nothing changed
    lastEmittedRef.current = key;
    onFiltersChange({ attributeValueIds: ids });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKeys, attributes, layout]);

  const applyNow = () => {
    const ids = computeIds();
    lastEmittedRef.current = ids.join(",");
    onFiltersChange({ attributeValueIds: ids });
  };

  useImperativeHandle(ref, () => ({ applyNow }));

  if (attributes.length === 0) return null;

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Single-pick semantics (SELECT/BOOLEAN both use this): deselect every other value
  // under the same attribute, then select this one (or clear it if re-clicked).
  const pickSingle = (attr: FilterAttribute, key: string) => {
    const isActive = selectedKeys.has(key);
    const next = new Set(
      Array.from(selectedKeys).filter((k) => !attr.values.some((av) => keyOf(attr, av.value) === k)),
    );
    if (!isActive) next.add(key);
    setSelectedKeys(next);
  };

  const selectedCountOf = (attr: FilterAttribute) =>
    attr.values.filter((v) => selectedKeys.has(keyOf(attr, v.value))).length;

  const selectedLabelOf = (attr: FilterAttribute) => {
    const selected = attr.values.filter((v) => selectedKeys.has(keyOf(attr, v.value)));
    if (selected.length === 0) return attr.name;
    if (selected.length === 1) return `${attr.name}: ${selected[0].value}`;
    return `${attr.name} (${selected.length})`;
  };

  // The interactive control for one attribute — identical markup regardless of which
  // layout it's mounted in, just a different container around it.
  const renderControl = (attr: FilterAttribute) => (
    <>
      {attr.type === "SELECT" && (
        <div className="space-y-2">
          {attr.values.map((v) => {
            const key = keyOf(attr, v.value);
            return (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name={`attr-${attr.type}-${attr.name}`}
                  checked={selectedKeys.has(key)}
                  onChange={() => pickSingle(attr, key)}
                  className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  {v.value}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {attr.type === "MULTISELECT" && (
        <div className="flex flex-wrap gap-2">
          {attr.values.map((v) => {
            const key = keyOf(attr, v.value);
            const active = selectedKeys.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleKey(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  active
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {v.value}
              </button>
            );
          })}
        </div>
      )}

      {/* BOOLEAN — same single-pick semantics as SELECT, styled as a compact
          pill pair. Backed by real CategoryAttributeValue rows the backend seeds
          automatically (see attribute.controller.ts's seedBooleanValues), so this
          maps over attr.values directly instead of guessing at "true"/"false". */}
      {attr.type === "BOOLEAN" && (
        <div className="flex gap-3">
          {attr.values.map((v) => {
            const key = keyOf(attr, v.value);
            const active = selectedKeys.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => pickSingle(attr, key)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  active
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {v.value}
              </button>
            );
          })}
        </div>
      )}
    </>
  );

  if (layout === "toolbar") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {attributes.map((attr) => {
          const count = selectedCountOf(attr);
          return (
            <Popover key={`${attr.type}::${attr.name}`} className="relative">
              <Popover.Button
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer focus:outline-none ${
                  count > 0
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                <span className="truncate max-w-40">{selectedLabelOf(attr)}</span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </Popover.Button>
              <Popover.Panel className="absolute left-0 top-full z-30 mt-2 w-56 max-h-72 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-3 shadow-xl ring-1 ring-black/5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {renderControl(attr)}
              </Popover.Panel>
            </Popover>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 border-t border-gray-200">
      {attributes.map((attr) => (
        <div key={`${attr.type}::${attr.name}`}>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
            {attr.name}
          </h4>
          {renderControl(attr)}
        </div>
      ))}
    </div>
  );
});

AttributeFilterPanel.displayName = "AttributeFilterPanel";

export default AttributeFilterPanel;
