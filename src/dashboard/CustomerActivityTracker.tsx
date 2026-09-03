// src/dashboard/CustomerActivityTracker.tsx
// Admin page: real-time customer wishlist & cart tracker.
// - Two tabs: Wishlist | Cart
// - Each tab lists unique customers with item counts
// - Clicking a customer opens a detail dialog
// - Real-time updates via socket.io (toggle-able)
// - Gated by CUSTOMER_ACTIVITY_TRACKER feature flag

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import api from "../utils/api";
import socket from "../utils/socket";
import toast from "react-hot-toast";
import {
  HeartIcon,
  ShoppingCartIcon,
  UserCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  SignalIcon,
  SignalSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TagIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { domainUrl } from "../utils/constant";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TrackedCustomer {
  id: string;
  username: string;
  email: string | null;
  phone: string;
  avatar: string | null;
  createdAt: string;
  /** Kept separate per tab, not blended into one "last active" — see
   * getTrackedCustomers. Null when that tab has no rows for this user at all (e.g. a
   * cart-only customer has no lastWishlistActivityAt). */
  lastWishlistActivityAt: string | null;
  lastCartActivityAt: string | null;
  wishlistCount: number;
  cartCount: number;
}

interface ProductItem {
  /** The wishlist/cart row's own id — NOT the product id, since two variants of the
   * same product are two separate rows that would otherwise collapse under one key. */
  id: string;
  productId?: string;
  variantId?: string | null;
  variantOptions?: Record<string, string> | null;
  name: string;
  price: number;
  image: string | null;
  stock: number;
  discount: number;
  sizes: string[];
  code: string;
  category?: { name: string } | null;
  // wishlist-specific
  addedAt?: string;
  // cart-specific
  quantity?: number;
}

type Tab = "wishlist" | "cart";

// ── Helpers ───────────────────────────────────────────────────────────────────
const imgSrc = (img: string | null | undefined) => {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${domainUrl.replace("/api", "")}/${img}`;
};

const timeAgo = (iso: string | null | undefined) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(iso));
};

const formatDate = (d: string | undefined) => {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
};

// ── Customer Row ──────────────────────────────────────────────────────────────
const CustomerRow = ({
  customer,
  tab,
  isNew,
  onClick,
}: {
  customer: TrackedCustomer;
  tab: Tab;
  isNew: boolean;
  onClick: () => void;
}) => {
  const count = tab === "wishlist" ? customer.wishlistCount : customer.cartCount;
  const lastActivityAt = tab === "wishlist" ? customer.lastWishlistActivityAt : customer.lastCartActivityAt;
  const avatar = imgSrc(customer.avatar);

  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all text-left cursor-pointer hover:shadow-md hover:-translate-y-px ${
        isNew ? "border-indigo-300 bg-indigo-50/70" : "border-gray-100 bg-white hover:border-indigo-200"
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {avatar ? (
          <img src={avatar} alt={customer.username} className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center ring-2 ring-white shadow-sm">
            <span className="text-white font-bold text-base">{customer.username.charAt(0).toUpperCase()}</span>
          </div>
        )}
        {isNew && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-indigo-500 ring-2 ring-white" />
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{customer.username}</p>
        <p className="text-xs text-gray-500 truncate">{customer.email ?? "No email on file"}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {customer.phone && (
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-medium">
              <PhoneIcon className="w-3 h-3" />
              {customer.phone}
            </span>
          )}
          {lastActivityAt && (
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-medium">
              <ClockIcon className="w-3 h-3" />
              {timeAgo(lastActivityAt)}
            </span>
          )}
        </div>
      </div>

      {/* Badge */}
      <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
        tab === "wishlist"
          ? "bg-rose-100 text-rose-600"
          : "bg-amber-100 text-amber-700"
      }`}>
        {tab === "wishlist" ? (
          <HeartIcon className="w-3.5 h-3.5" />
        ) : (
          <ShoppingCartIcon className="w-3.5 h-3.5" />
        )}
        {count} {tab === "wishlist" ? "item" : "item"}{count !== 1 ? "s" : ""}
      </span>

      {isNew && (
        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500" />
      )}
    </button>
  );
};

// ── Detail Dialog ─────────────────────────────────────────────────────────────
const DetailDialog = ({
  customer,
  tab,
  onClose,
}: {
  customer: TrackedCustomer;
  tab: Tab;
  onClose: () => void;
}) => {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [total, setTotal] = useState<string>("0.00");
  const [loading, setLoading] = useState(true);
  const [quickViewItem, setQuickViewItem] = useState<ProductItem | null>(null);

  useEffect(() => {
    const endpoint = tab === "wishlist"
      ? `/admin/tracker/customers/${customer.id}/wishlist`
      : `/admin/tracker/customers/${customer.id}/cart`;

    api.get(endpoint)
      .then((res) => {
        setItems(res.data.items ?? []);
        if (tab === "cart") setTotal(res.data.total ?? "0.00");
      })
      .catch(() => toast.error("Failed to load details"))
      .finally(() => setLoading(false));
  }, [customer.id, tab]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          {tab === "wishlist" ? (
            <div className="p-2 rounded-xl bg-rose-100">
              <HeartIcon className="w-5 h-5 text-rose-600" />
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-amber-100">
              <ShoppingCartIcon className="w-5 h-5 text-amber-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900">{customer.username}'s {tab === "wishlist" ? "Wishlist" : "Cart"}</h3>
            <p className="text-xs text-gray-500 truncate">{customer.email ?? customer.phone}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <UserCircleIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No items in {tab}</p>
            </div>
          ) : (
            items.map((item) => {
              const src = imgSrc(item.image);
              const price = Number(item.price) || 0;
              const discount = Number(item.discount) || 0;
              const stock = Number(item.stock) || 0;
              const discountedPrice = discount > 0
                ? price * (1 - discount / 100)
                : price;

              return (
                <div
                  key={item.id}
                  onClick={() => setQuickViewItem(item)}
                  className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all cursor-pointer"
                >
                  {/* Image */}
                  {src ? (
                    <img src={src} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0 flex items-center justify-center">
                      <ShoppingCartIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.category?.name ?? ""} · {item.code}</p>
                    {item.variantOptions && Object.keys(item.variantOptions).length > 0 && (
                      <p className="text-xs text-indigo-500 font-medium mt-0.5">
                        {Object.entries(item.variantOptions)
                          .map(([axis, value]) => `${axis}: ${value}`)
                          .join(" · ")}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-bold text-gray-900">₹{discountedPrice.toFixed(0)}</span>
                      {discount > 0 && (
                        <>
                          <span className="text-xs text-gray-400 line-through">₹{price.toFixed(0)}</span>
                          <span className="text-xs text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded-full">-{discount}%</span>
                        </>
                      )}
                    </div>
                    {tab === "cart" && item.quantity && (
                      <p className="text-xs text-indigo-600 font-medium mt-0.5">
                        Qty: {item.quantity}
                      </p>
                    )}
                    {tab === "wishlist" && item.addedAt && (
                      <p className="text-xs text-gray-400 mt-0.5">Added {formatDate(item.addedAt)}</p>
                    )}
                  </div>

                  {/* Stock badge */}
                  <span className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                    stock > 0
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}>
                    {stock > 0 ? `${stock} left` : "Out of stock"}
                  </span>
                </div>
              );
            })

          )}
        </div>

        {/* Cart total footer */}
        {tab === "cart" && !loading && items.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">Cart Total</span>
              <span className="text-lg font-bold text-gray-900">₹{total}</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick-view — clicking a row shows the specific product/variant that's
          actually in this customer's wishlist/cart, layered above this dialog rather
          than replacing it so the list stays one click away. */}
      {quickViewItem && (
        <ProductQuickViewModal item={quickViewItem} tab={tab} onClose={() => setQuickViewItem(null)} />
      )}
    </div>
  );
};

// ── Product Quick-View Modal ────────────────────────────────────────────────────
// Read-only — this is an admin monitoring surface, not the catalog editor
// (products/Listproducts.tsx owns actual product edits). Just enough detail to
// identify exactly what the customer saved/added, including which variant.
const ProductQuickViewModal = ({
  item,
  tab,
  onClose,
}: {
  item: ProductItem;
  tab: Tab;
  onClose: () => void;
}) => {
  const src = imgSrc(item.image);
  const price = Number(item.price) || 0;
  const discount = Number(item.discount) || 0;
  const stock = Number(item.stock) || 0;
  const discountedPrice = discount > 0 ? price * (1 - discount / 100) : price;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-white rounded-[28px] shadow-2xl ring-1 ring-black/5 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/95 hover:bg-white shadow-md ring-1 ring-black/5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <XMarkIcon className="w-4.5 h-4.5 text-gray-600" />
        </button>

        {/* Image */}
        <div className="relative w-full aspect-square bg-gradient-to-b from-gray-50 to-gray-100">
          {item.category?.name && (
            <span className="absolute top-4 left-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-900 shadow-sm">
              {item.category.name}
            </span>
          )}
          {src ? (
            <img src={src} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCartIcon className="w-14 h-14 text-gray-300" />
            </div>
          )}
          {/* Soft fade into the content panel below, so the image reads as one
              continuous surface rather than a hard-edged photo pasted on top. */}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="px-6 pt-1 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{item.code}</p>
          <h3 className="font-bold text-gray-900 text-xl leading-snug mt-1 text-balance">{item.name}</h3>

          {item.variantOptions && Object.keys(item.variantOptions).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {Object.entries(item.variantOptions).map(([axis, value]) => (
                <span
                  key={axis}
                  className="text-xs font-semibold text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100 px-2.5 py-1 rounded-full"
                >
                  <span className="text-indigo-400 font-medium">{axis}</span> {value}
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="flex items-end gap-2 mt-5">
            <TagIcon className="w-4 h-4 text-gray-300 mb-1" />
            <span className="text-2xl font-black text-gray-900 tracking-tight">₹{discountedPrice.toFixed(0)}</span>
            {discount > 0 && (
              <>
                <span className="text-sm text-gray-400 line-through mb-0.5">₹{price.toFixed(0)}</span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full mb-0.5">
                  {discount}% OFF
                </span>
              </>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full ${
                stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
              }`}
            >
              {stock > 0 ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <XCircleIcon className="w-3.5 h-3.5" />}
              {stock > 0 ? `${stock} in stock` : "Out of stock"}
            </span>
            {tab === "cart" && item.quantity ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold">
                <ShoppingCartIcon className="w-3.5 h-3.5" />
                Qty {item.quantity}
              </span>
            ) : tab === "wishlist" && item.addedAt ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                <ClockIcon className="w-3.5 h-3.5" />
                {formatDate(item.addedAt)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CustomerActivityTracker() {
  const [tab, setTab] = useState<Tab>("wishlist");
  const [customers, setCustomers] = useState<TrackedCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [newActivityIds, setNewActivityIds] = useState<Set<string>>(new Set());
  const [selectedCustomer, setSelectedCustomer] = useState<TrackedCustomer | null>(null);
  useBodyScrollLock(!!selectedCustomer);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());

  const realtimeRef = useRef(realtimeEnabled);
  realtimeRef.current = realtimeEnabled;

  // ── Fetch all customers ───────────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ customers: TrackedCustomer[] }>("/admin/tracker/customers");
      setCustomers(res.data.customers ?? []);
      setViewedIds(new Set());
    } catch {
      toast.error("Failed to load customer activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ── Socket real-time updates ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handleWishlistUpdate = (data: { userId: string; wishlistCount: number; lastWishlistActivityAt?: string }) => {
      if (!realtimeRef.current) return;

      setCustomers((prev) => {
        const existing = prev.find((c) => c.id === data.userId);
        if (existing) {
          return prev.map((c) =>
            c.id === data.userId
              ? { ...c, wishlistCount: data.wishlistCount, lastWishlistActivityAt: data.lastWishlistActivityAt ?? c.lastWishlistActivityAt }
              : c,
          );
        }
        // New customer — trigger a full refresh to get their info
        fetchCustomers();
        return prev;
      });

      setNewActivityIds((prev) => new Set(prev).add(data.userId));
      setTimeout(() => {
        setNewActivityIds((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }, 8000);
    };

    const handleCartUpdate = (data: { userId: string; cartCount: number; lastCartActivityAt?: string }) => {
      if (!realtimeRef.current) return;

      setCustomers((prev) => {
        const existing = prev.find((c) => c.id === data.userId);
        if (existing) {
          return prev.map((c) =>
            c.id === data.userId
              ? { ...c, cartCount: data.cartCount, lastCartActivityAt: data.lastCartActivityAt ?? c.lastCartActivityAt }
              : c,
          );
        }
        fetchCustomers();
        return prev;
      });

      setNewActivityIds((prev) => new Set(prev).add(data.userId));
      setTimeout(() => {
        setNewActivityIds((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }, 8000);
    };

    socket.on("customer-wishlist-update", handleWishlistUpdate);
    socket.on("customer-cart-update", handleCartUpdate);

    return () => {
      socket.off("customer-wishlist-update", handleWishlistUpdate);
      socket.off("customer-cart-update", handleCartUpdate);
    };
  }, [fetchCustomers]);

  // ── Filtered list by tab ─────────────────────────────────────────────────
  const filteredCustomers = customers.filter((c) =>
    tab === "wishlist" ? c.wishlistCount > 0 : c.cartCount > 0,
  );

  const wishlistTotal = customers.filter((c) => c.wishlistCount > 0 && !viewedIds.has(c.id)).length;
  const cartTotal = customers.filter((c) => c.cartCount > 0 && !viewedIds.has(c.id)).length;
  const totalWishlistItems = customers.reduce((sum, c) => sum + c.wishlistCount, 0);
  const totalCartItems = customers.reduce((sum, c) => sum + c.cartCount, 0);
  const activeCustomerCount = new Set(
    customers.filter((c) => c.wishlistCount > 0 || c.cartCount > 0).map((c) => c.id),
  ).size;

  return (
    <div className="px-8 py-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm shadow-indigo-200">
            <UserCircleIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-950">Customer Activity Tracker</h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitor customer wishlists and carts in real-time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Real-time toggle */}
          <button
            onClick={() => {
              setRealtimeEnabled((v) => !v);
              toast(realtimeEnabled ? "Real-time updates paused" : "Real-time updates enabled", {
                icon: realtimeEnabled ? "⏸" : "▶️",
              });
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
              realtimeEnabled
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
            }`}
            title={realtimeEnabled ? "Disable real-time updates" : "Enable real-time updates"}
          >
            <span className="relative flex h-2 w-2">
              {realtimeEnabled && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${realtimeEnabled ? "bg-emerald-500" : "bg-gray-400"}`} />
            </span>
            {realtimeEnabled ? "Live" : "Paused"}
          </button>

          {/* Refresh button */}
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all cursor-pointer"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-7">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
              <UserCircleIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black text-gray-950 leading-none tabular-nums">{activeCustomerCount}</p>
              <p className="text-xs text-gray-500 font-medium mt-1 truncate">Active customers</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50">
              <HeartIcon className="h-5 w-5 text-rose-500" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black text-gray-950 leading-none tabular-nums">{totalWishlistItems}</p>
              <p className="text-xs text-gray-500 font-medium mt-1 truncate">Wishlist items saved</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
              <ShoppingCartIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black text-gray-950 leading-none tabular-nums">{totalCartItems}</p>
              <p className="text-xs text-gray-500 font-medium mt-1 truncate">Items in active carts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        {(["wishlist", "cart"] as Tab[]).map((t) => {
          const count = t === "wishlist" ? wishlistTotal : cartTotal;
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "wishlist" ? (
                <HeartIcon className={`w-4 h-4 ${isActive ? "text-rose-500" : ""}`} />
              ) : (
                <ShoppingCartIcon className={`w-4 h-4 ${isActive ? "text-amber-500" : ""}`} />
              )}
              <span className="capitalize">{t}</span>
              {count > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-xs font-bold px-1.5 ${
                  isActive
                    ? t === "wishlist" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                    : "bg-gray-200 text-gray-500"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 rounded-xl border border-gray-100 bg-white animate-pulse">
              <div className="h-11 w-11 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-32 rounded bg-gray-200" />
                <div className="h-3 w-44 rounded bg-gray-100" />
              </div>
              <div className="h-6 w-20 rounded-full bg-gray-100 shrink-0" />
            </div>
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl mb-4 ${
            tab === "wishlist" ? "bg-rose-50" : "bg-amber-50"
          }`}>
            {tab === "wishlist" ? (
              <HeartIcon className="w-7 h-7 text-rose-300" />
            ) : (
              <ShoppingCartIcon className="w-7 h-7 text-amber-300" />
            )}
          </div>
          <h3 className="text-base font-bold text-gray-700">No customers with {tab} items</h3>
          <p className="text-sm text-gray-400 mt-1 text-center max-w-xs">
            Customers will appear here as soon as they add products to their {tab}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <CustomerRow
              key={customer.id}
              customer={customer}
              tab={tab}
              isNew={newActivityIds.has(customer.id)}
              onClick={() => {
                setSelectedCustomer(customer);
                setViewedIds((prev) => new Set(prev).add(customer.id));
              }}
            />
          ))}
        </div>
      )}

      {/* Detail dialog */}
      {selectedCustomer && (
        <DetailDialog
          customer={selectedCustomer}
          tab={tab}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}
