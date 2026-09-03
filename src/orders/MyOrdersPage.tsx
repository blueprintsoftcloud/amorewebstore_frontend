import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../utils/api";
import { motion, Variants } from "framer-motion";
import {
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  ArrowLeft,
  ShoppingBag,
  Package,
  FileText,
} from "lucide-react";

interface OrderProduct {
  id: string;
  name: string;
  image: string;
}

interface OrderItem {
  product: OrderProduct | null;
  quantity: number;
  price: number;
  /** e.g. { Storage: "128GB", Color: "Black" } — the specific option this line item
   * was purchased in, if the product has variants (see mongoose.ts's ProductVariant).
   * null/absent for a plain single-SKU product. */
  variant?: { options: Record<string, string> } | null;
}

interface Order {
  id: string;
  createdAt: string;
  totalAmount: number;
  discountAmount: number;
  shippingCharge: number;
  finalAmount: number;
  orderStatus: string;
  items: OrderItem[];
}

// --- HELPER: Status Badge ---
const STATUS_CFG: Record<string, { cls: string; icon: React.ReactElement }> = {
  Processing: { cls: "bg-amber-400 text-white border-amber-500", icon: <Clock className="w-3.5 h-3.5" /> },
  Confirmed: { cls: "bg-blue-400 text-white border-blue-500", icon: <Clock className="w-3.5 h-3.5" /> },
  Shipped: { cls: "bg-sky-500 text-white border-sky-600", icon: <Truck className="w-3.5 h-3.5" /> },
  Delivered: { cls: "bg-emerald-500 text-white border-emerald-600", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  Cancelled: { cls: "bg-red-500 text-white border-red-600", icon: <XCircle className="w-3.5 h-3.5" /> },
};

const StatusBadge = ({ rawStatus }: { rawStatus: string }) => {
  // Normalise to title-case so "SHIPPED" and "Shipped" both match
  const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
  const cfg = STATUS_CFG[status] ?? { cls: "bg-gray-400 text-white border-gray-500", icon: <Package className="w-3.5 h-3.5" /> };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm ${cfg.cls}`}>
      {cfg.icon} {status}
    </span>
  );
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

// --- ANIMATION VARIANTS ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

// --- Loading skeleton ---
const OrderSkeleton = () => (
  <div className="rounded-3xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="bg-gray-50/70 px-6 py-5 flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-3 w-32 bg-gray-200 rounded" />
        <div className="h-3 w-24 bg-gray-200 rounded" />
      </div>
      <div className="h-7 w-24 bg-gray-200 rounded-full" />
    </div>
    <div className="px-6 py-6 flex items-center gap-4">
      <div className="h-20 w-20 bg-gray-100 rounded-2xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/2 bg-gray-100 rounded" />
        <div className="h-3 w-1/4 bg-gray-100 rounded" />
      </div>
    </div>
  </div>
);

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  // ?orderId= arrives from the notification dropdown (Navbar.tsx) — jump straight to
  // that order instead of leaving the shopper to scroll and find it themselves.
  const [searchParams] = useSearchParams();
  const highlightOrderId = searchParams.get("orderId");
  const highlightedRef = useRef<HTMLDivElement>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/order/myOrders");
      setOrders(res.data.order || []);
    } catch (err) {
      const e = err as any;
      console.error("Error fetching orders:", e);
      if (e.response?.status === 401) {
        setError("Please login to view your orders");
      } else {
        setError("Unable to load your order history.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!highlightOrderId || loading || orders.length === 0) return;
    highlightedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightOrderId, loading, orders.length]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8 bg-gray-50 rounded-3xl border border-gray-100">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
            <XCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Access Error</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110"
            style={{ background: "var(--theme-primary)", color: "var(--theme-primary-ink)" }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white min-h-screen pb-20 pt-(--app-header-h) font-sans overflow-x-hidden">
      {/* Decorative Background Blob — `absolute` (not `fixed`) so overflow-x-hidden
          above actually clips it instead of forcing a page-wide horizontal scrollbar. */}
      <div
        className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full blur-3xl opacity-40 pointer-events-none z-0"
        style={{ background: "color-mix(in srgb, var(--theme-accent) 35%, transparent)" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-6">
        {/* --- Header Section --- */}
        <div className="mb-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors duration-300 mb-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
            Go Back
          </button>

          <div className="flex items-center gap-3">
            <div
              className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm"
              style={{ background: "linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-hover) 100%)" }}
            >
              <ShoppingBag className="w-5.5 h-5.5" style={{ color: "var(--theme-primary-ink)" }} />
            </div>
            <div>
              <h1
                className="text-3xl sm:text-4xl font-bold tracking-tighter text-gray-900"
                style={{ fontFamily: "var(--theme-font-heading)" }}
              >
                Order History
              </h1>
              {!loading && (
                <p className="text-sm text-gray-400 mt-1">
                  {orders.length} order{orders.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* --- Content --- */}
        {loading ? (
          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, i) => <OrderSkeleton key={i} />)}
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "color-mix(in srgb, var(--theme-primary) 10%, white)" }}
            >
              <ShoppingBag className="w-7 h-7" style={{ color: "var(--theme-primary)" }} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
              No orders yet
            </h3>
            <p className="mt-2 text-gray-500 font-light max-w-xs mx-auto">
              You haven't placed any orders yet. Discover our collection to get started.
            </p>
            <button
              onClick={() => navigate("/products")}
              className="mt-6 px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110"
              style={{ background: "var(--theme-primary)", color: "var(--theme-primary-ink)" }}
            >
              Start Shopping
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {orders.map((order) => {
              const isHighlighted = order.id === highlightOrderId;
              return (
              <motion.div
                key={order.id}
                ref={isHighlighted ? highlightedRef : undefined}
                variants={itemVariants}
                className={`group bg-white rounded-3xl border overflow-hidden hover:shadow-xl transition-all duration-500 ${
                  isHighlighted
                    ? "border-[var(--theme-primary)] ring-2 ring-[var(--theme-primary)] ring-offset-2"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                {/* Card Header (Summary) */}
                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                    <span className="text-sm font-bold text-gray-900">{fmtDate(order.createdAt)}</span>
                    <span className="text-xs font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-100">
                      #{order.id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-sm font-bold text-gray-900 tabular-nums">
                      {fmt(order.finalAmount ?? order.totalAmount)}
                    </span>
                    {order.discountAmount > 0 && (
                      <span className="text-[11px] text-emerald-600 font-semibold">
                        Saved {fmt(order.discountAmount)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <StatusBadge rawStatus={order.orderStatus} />
                    <button
                      onClick={() => navigate(`/invoice/${order.id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all shadow-sm bg-white"
                      style={{ borderColor: "var(--theme-primary)", color: "var(--theme-primary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--theme-primary)";
                        e.currentTarget.style.color = "var(--theme-primary-ink)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.color = "var(--theme-primary)";
                      }}
                      title="View Invoice"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Invoice
                    </button>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-6 py-2 divide-y divide-gray-50">
                  {order.items.map((item, index) => {
                    const isUnavailable = item.product === null;
                    const productName = isUnavailable
                      ? "Product Unavailable"
                      : item.product!.name;
                    const productImage = isUnavailable
                      ? undefined
                      : item.product!.image;

                    return (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row items-center py-6 gap-6"
                      >
                        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm group-hover:shadow-md transition-shadow">
                          {isUnavailable ? (
                            <div className="h-full w-full flex items-center justify-center">
                              <XCircle className="h-8 w-8 text-gray-300" />
                            </div>
                          ) : (
                            <img
                              src={productImage}
                              alt={productName}
                              className="h-full w-full object-cover object-center"
                            />
                          )}
                        </div>

                        <div className="flex flex-1 flex-col sm:flex-row sm:items-center justify-between w-full text-center sm:text-left">
                          <div>
                            <h4
                              className={`text-lg font-bold tracking-tight ${isUnavailable ? "text-gray-400 italic" : "text-gray-900"}`}
                            >
                              {productName}
                            </h4>
                            {item.variant?.options && Object.keys(item.variant.options).length > 0 && (
                              <p className="mt-0.5 text-xs font-semibold text-gray-600">
                                {Object.entries(item.variant.options)
                                  .map(([axis, value]) => `${axis}: ${value}`)
                                  .join(" · ")}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500 font-medium uppercase tracking-wide">
                              Qty: <span className="text-gray-900 font-bold">{item.quantity}</span>
                            </p>
                          </div>

                          <div className="mt-4 sm:mt-0 sm:text-right flex flex-col items-center sm:items-end gap-2">
                            <p className="text-base font-bold text-gray-900 tabular-nums">
                              {fmt(item.price * item.quantity)}
                            </p>

                            {!isUnavailable && (
                              <button
                                onClick={() => navigate(`/products/${item.product!.id}`)}
                                className="text-xs font-bold uppercase tracking-wider border-b border-transparent hover:opacity-80 transition-all"
                                style={{ color: "var(--theme-primary)" }}
                              >
                                View Product
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
