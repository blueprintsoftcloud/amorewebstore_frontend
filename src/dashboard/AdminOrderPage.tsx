import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  UserPlusIcon,
  ShoppingCartIcon,
  MapPinIcon,
  CreditCardIcon,
  CheckCircleIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  MinusIcon,
  DocumentTextIcon,
  TruckIcon,
  PhoneIcon,
  EnvelopeIcon,
  XMarkIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import ShipOrderModal, { ShipOrderPayload } from "./ShipOrderModal";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Customer {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
}

interface ProductVariant {
  id: string;
  options: Record<string, string>;
  stock: number;
  priceOverride: number | null;
  discountOverride?: number | null;
}

interface Product {
  id: string;
  name: string;
  code: string;
  image?: string;
  price: number;
  stock: number;
  category?: { id: string; name: string };
  /** Active option combinations (Storage/Color, Weight, ...) this product is sold
   * in — see backend's ProductVariant. Empty for a plain single-SKU product. A
   * product with any entries here can't be added without picking one, same rule
   * the storefront's own add-to-cart already enforces (cart.controller.ts's cartAdd). */
  variants?: ProductVariant[];
}

interface CartItem {
  product: Product;
  variantId?: string | null;
  variantOptions?: Record<string, string> | null;
  /** Snapshot of the effective unit price at the moment this line was added —
   * either the picked variant's priceOverride or the product's own price. Stored
   * here (not recomputed from `products`) because the product list can page/search
   * away from what's already in the cart. */
  unitPrice: number;
  /** Stock ceiling for the quantity stepper — the variant's own stock once one is
   * picked (Product.stock is meaningless for a variant product), else the product's. */
  maxStock: number;
  quantity: number;
}

interface Address {
  fullAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface AppliedCoupon {
  couponId: string;
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  discountAmount: number;
}

type PaymentMethod = "CASH" | "POD";

type Step = "customer" | "products" | "address" | "payment" | "confirm";

const STEPS: { id: Step; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { id: "customer", label: "Customer", icon: UserCircleIcon },
  { id: "products", label: "Products", icon: ShoppingCartIcon },
  { id: "address", label: "Address", icon: MapPinIcon },
  { id: "payment", label: "Payment", icon: CreditCardIcon },
  { id: "confirm", label: "Confirm", icon: CheckCircleIcon },
];

const STEP_ORDER: Step[] = ["customer", "products", "address", "payment", "confirm"];

// ─── Customer avatar / match-highlight helpers ──────────────────────────────
const AVATAR_PALETTE = [
  "bg-indigo-100 text-indigo-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
];

const avatarClass = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};

const CustomerAvatar = ({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) => (
  <div
    className={`shrink-0 rounded-full flex items-center justify-center font-bold ${avatarClass(name)} ${
      size === "md" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs"
    }`}
  >
    {name.trim().charAt(0).toUpperCase() || "?"}
  </div>
);

const HighlightMatch = ({ text, query }: { text: string; query: string }) => {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-indigo-100 text-indigo-700 rounded-sm px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
};

const CUSTOMER_MODE_TABS: { key: "existing" | "new"; label: string; icon: typeof MagnifyingGlassIcon }[] = [
  { key: "existing", label: "Existing Customer", icon: MagnifyingGlassIcon },
  { key: "new", label: "New Customer", icon: UserPlusIcon },
];

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AdminOrderPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("customer");
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{ id: string; orderNumber?: string } | null>(null);

  // ── Post-order actions (invoice / ship) ──
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [shipSubmitting, setShipSubmitting] = useState(false);
  const [shippedInfo, setShippedInfo] = useState<{ deliveryPartnerName?: string; trackingId?: string } | null>(null);

  // ── Customer state ──
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({ username: "", phone: "", email: "" });
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [customerHighlighted, setCustomerHighlighted] = useState(0);
  const [customerHasSearched, setCustomerHasSearched] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const customerContainerRef = useRef<HTMLDivElement>(null);

  // ── Products state ──
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  // Which variant is currently picked in each variant product's row — a draft choice
  // in the picker, separate from what's actually in the cart (see CartItem above).
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<Record<string, string>>({});
  const productSearchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Coupon state ──
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // ── Address state ──
  const [address, setAddress] = useState<Address>({
    fullAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
  });

  // ── Payment state ──
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentNote, setPaymentNote] = useState("");

  // ─── Customer search ─────────────────────────────────────────────────────
  const handleCustomerSearch = (val: string) => {
    setCustomerSearch(val);
    setCustomerHighlighted(0);
    setCustomerDropdownOpen(true);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!val.trim()) { setCustomerResults([]); setCustomerHasSearched(false); return; }
    searchDebounce.current = setTimeout(async () => {
      setCustomerLoading(true);
      try {
        const { data } = await api.get("/order/admin-order/search-customers", { params: { q: val } });
        setCustomerResults(data.customers ?? []);
      } catch {
        // silent
      } finally {
        setCustomerLoading(false);
        setCustomerHasSearched(true);
      }
    }, 350);
  };

  const selectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerResults([]);
    setCustomerSearch(c.username);
    setCustomerDropdownOpen(false);
  };

  const handleCustomerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!customerDropdownOpen || customerResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCustomerHighlighted((i) => Math.min(i + 1, customerResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCustomerHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked = customerResults[customerHighlighted];
      if (picked) selectCustomer(picked);
    } else if (e.key === "Escape") {
      setCustomerDropdownOpen(false);
    }
  };

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (customerContainerRef.current && !customerContainerRef.current.contains(e.target as Node)) {
        setCustomerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // ─── Product fetch ────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (search: string, page: number) => {
    setProductsLoading(true);
    try {
      const { data } = await api.get("/order/admin-order/products", { params: { search, page, limit: 10 } });
      setProducts(data.products ?? []);
      setProductTotalPages(data.pagination?.totalPages ?? 1);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentStep === "products") fetchProducts(productSearch, productPage);
  }, [currentStep, productPage]);

  const handleProductSearch = (val: string) => {
    setProductSearch(val);
    if (productSearchDebounce.current) clearTimeout(productSearchDebounce.current);
    productSearchDebounce.current = setTimeout(() => {
      setProductPage(1);
      fetchProducts(val, 1);
    }, 350);
  };

  // ─── Cart helpers ─────────────────────────────────────────────────────────
  // A cart line is identified by (productId, variantId) — two different options of
  // the same product (e.g. 128GB vs 256GB) are separate lines, not merged into one,
  // same rule the storefront cart already follows (CartContext.tsx).
  const findCartLine = (productId: string, variantId?: string | null) =>
    cart.find(c => c.product.id === productId && String(c.variantId ?? "") === String(variantId ?? ""));

  const addToCart = (product: Product, variantId?: string | null) => {
    const hasVariants = (product.variants?.length ?? 0) > 0;
    const variant = variantId ? product.variants?.find(v => v.id === variantId) : undefined;
    if (hasVariants && !variant) {
      toast.error(`Select an option for "${product.name}" first`, { id: "admin-order-pick-variant" });
      return;
    }
    const unitPrice = variant?.priceOverride ?? product.price;
    const maxStock = variant ? variant.stock : product.stock;
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id && String(c.variantId ?? "") === String(variantId ?? ""));
      if (existing) {
        return prev.map(c =>
          c === existing ? { ...c, quantity: Math.min(c.quantity + 1, maxStock) } : c,
        );
      }
      return [
        ...prev,
        { product, variantId: variant?.id ?? null, variantOptions: variant?.options ?? null, unitPrice, maxStock, quantity: 1 },
      ];
    });
  };

  const updateQty = (productId: string, variantId: string | null | undefined, qty: number, maxStock: number) => {
    if (qty < 1) { removeFromCart(productId, variantId); return; }
    setCart(prev =>
      prev.map(c =>
        c.product.id === productId && String(c.variantId ?? "") === String(variantId ?? "")
          ? { ...c, quantity: Math.min(qty, maxStock) }
          : c,
      ),
    );
  };

  const removeFromCart = (productId: string, variantId?: string | null) => {
    setCart(prev => prev.filter(c => !(c.product.id === productId && String(c.variantId ?? "") === String(variantId ?? ""))));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);
  const orderTotal = Math.max(cartTotal - (appliedCoupon?.discountAmount ?? 0), 0);

  // A coupon's discount was computed against the subtotal at the moment it was applied —
  // if the cart changes afterwards that preview is stale, so drop it and make the admin
  // re-apply. The backend re-validates independently at final submission regardless.
  useEffect(() => {
    setAppliedCoupon(null);
  }, [cart]);

  // ─── Coupon ───────────────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post("/coupon/validate", { code, orderAmount: cartTotal });
      setAppliedCoupon({
        couponId: data.couponId,
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        discountAmount: data.discountAmount,
      });
      toast.success(
        data.discountType === "PERCENTAGE"
          ? `Coupon applied: ${data.discountValue}% off`
          : `Coupon applied: ₹${data.discountAmount.toLocaleString("en-IN")} off`
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Invalid or expired coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  // ─── Validation helpers ───────────────────────────────────────────────────
  const canProceed = (): boolean => {
    if (currentStep === "customer") {
      if (customerMode === "existing") return !!selectedCustomer;
      return !!(newCustomer.username.trim() && newCustomer.phone.trim());
    }
    if (currentStep === "products") return cart.length > 0;
    if (currentStep === "address") {
      return !!(address.fullAddress.trim() && address.city.trim() && address.state.trim() && address.zipCode.trim());
    }
    return true;
  };

  const goNext = () => {
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx < STEP_ORDER.length - 1) setCurrentStep(STEP_ORDER[idx + 1]);
  };

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx > 0) setCurrentStep(STEP_ORDER[idx - 1]);
  };

  // ─── Place order ──────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const body: Record<string, unknown> = {
        items: cart.map(c => ({ productId: c.product.id, variantId: c.variantId ?? undefined, quantity: c.quantity })),
        address,
        paymentMethod,
        ...(paymentNote.trim() ? { paymentNote: paymentNote.trim() } : {}),
        ...(appliedCoupon ? { couponId: appliedCoupon.couponId } : {}),
      };
      if (customerMode === "existing" && selectedCustomer) {
        body.customerId = selectedCustomer.id;
      } else {
        body.newCustomer = {
          username: newCustomer.username.trim(),
          phone: newCustomer.phone.trim(),
          ...(newCustomer.email.trim() ? { email: newCustomer.email.trim() } : {}),
        };
      }
      const { data } = await api.post("/order/admin-order/place", body);
      toast.success("Order placed successfully!");
      setPlacedOrder({ id: data.order?.id ?? data.orderId ?? "—" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  // ─── Ship order (optional, right after placement) ────────────────────────
  const handleShipOrder = async (payload: ShipOrderPayload) => {
    if (!placedOrder) return;
    setShipSubmitting(true);
    try {
      const { data } = await api.put(`/order/update/${placedOrder.id}`, {
        orderStatus: "SHIPPED",
        ...payload,
      });
      setShippedInfo({
        deliveryPartnerName: data.order?.deliveryPartnerName,
        trackingId: data.order?.trackingId,
      });
      toast.success("Order shipped and customer notified!");
      setShipModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to ship order");
    } finally {
      setShipSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const stepIndex = STEP_ORDER.indexOf(currentStep);

  // ─ Success screen ─
  if (placedOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg p-10">
          <CheckCircleSolid className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h2>
          <p className="text-gray-500 text-sm mb-1">Order ID:</p>
          <p className="font-mono text-indigo-600 font-semibold text-sm break-all mb-6">{placedOrder.id}</p>

          {shippedInfo ? (
            <div className="flex items-center gap-3 p-4 mb-6 bg-blue-50 border border-blue-200 rounded-xl text-left">
              <TruckIcon className="w-6 h-6 text-blue-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Order shipped</p>
                <p className="text-xs text-blue-600">
                  {shippedInfo.deliveryPartnerName ?? "Handled without a courier"}
                  {shippedInfo.trackingId ? ` · ${shippedInfo.trackingId}` : ""}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                type="button"
                onClick={() => navigate(`/invoice/${placedOrder.id}`)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                <DocumentTextIcon className="w-4 h-4" />
                View Invoice
              </button>
              <button
                type="button"
                onClick={() => setShipModalOpen(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                <TruckIcon className="w-4 h-4" />
                Ship Order
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setPlacedOrder(null);
              setShippedInfo(null);
              setShipModalOpen(false);
              setCurrentStep("customer");
              setCustomerMode("existing");
              setSelectedCustomer(null);
              setCustomerSearch("");
              setCustomerResults([]);
              setCustomerDropdownOpen(false);
              setCustomerHasSearched(false);
              setNewCustomer({ username: "", phone: "", email: "" });
              setCart([]);
              setSelectedVariantByProduct({});
              setCouponCode("");
              setAppliedCoupon(null);
              setAddress({ fullAddress: "", city: "", state: "", zipCode: "", country: "India" });
              setPaymentMethod("CASH");
              setPaymentNote("");
            }}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            New Order
          </button>
        </div>

        <ShipOrderModal
          order={shipModalOpen ? placedOrder : null}
          submitting={shipSubmitting}
          onClose={() => setShipModalOpen(false)}
          onConfirm={handleShipOrder}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-5 tracking-tight">
        <h1 className="text-3xl font-bold text-gray-900">Place Order on Behalf of Customer</h1>
        <p className="text-sm text-gray-500 mt-0.5">Walk-in / cash counter order entry</p>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-4">
        <ol className="flex items-center gap-0 overflow-x-auto">
          {STEPS.map((step, i) => {
            const done = STEP_ORDER.indexOf(step.id) < stepIndex;
            const active = step.id === currentStep;
            return (
              <li key={step.id} className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (done) setCurrentStep(step.id);
                  }}
                  disabled={!done && !active}
                  className={`flex flex-col sm:flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                    ${active ? "text-indigo-700 bg-indigo-50" : done ? "text-green-700 cursor-pointer hover:bg-green-50" : "text-gray-400 cursor-default"}`}
                >
                  {done ? (
                    <CheckCircleSolid className="w-5 h-5 text-green-500 shrink-0" />
                  ) : (
                    <step.icon className={`w-5 h-5 shrink-0 ${active ? "text-indigo-600" : "text-gray-400"}`} />
                  )}
                  {step.label}
                </button>
                {i < STEPS.length - 1 && <ChevronRightIcon className="w-4 h-4 text-gray-300 mx-1 shrink-0" />}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Body */}
      <div className="w-full px-8 py-8 space-y-6">

        {/* ── STEP 1: Customer ── */}
        {currentStep === "customer" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Select or Create Customer</h2>
              <p className="text-xs text-gray-400 mt-0.5">Who is this walk-in order for?</p>
            </div>

            {/* Segmented mode switcher */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1 max-w-sm">
              {CUSTOMER_MODE_TABS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setCustomerMode(opt.key);
                    setSelectedCustomer(null);
                    setCustomerSearch("");
                    setCustomerResults([]);
                    setCustomerDropdownOpen(false);
                    setCustomerHasSearched(false);
                  }}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                    customerMode === opt.key ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Existing customer search */}
            {customerMode === "existing" && (
              <div ref={customerContainerRef} className="relative max-w-lg">
                {selectedCustomer ? (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl animate-fadeIn">
                    <div className="flex items-center gap-3 min-w-0">
                      <CustomerAvatar name={selectedCustomer.username} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-emerald-900 truncate">{selectedCustomer.username}</p>
                        <p className="text-xs text-emerald-700">{selectedCustomer.phone ?? "No phone"} · {selectedCustomer.email ?? "No email"}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); setCustomerDropdownOpen(true); }}
                      className="shrink-0 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-white transition px-2.5 py-1.5 rounded-lg"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search by name, phone, or email…"
                        value={customerSearch}
                        onChange={e => handleCustomerSearch(e.target.value)}
                        onFocus={() => customerSearch.trim() && setCustomerDropdownOpen(true)}
                        onKeyDown={handleCustomerKeyDown}
                        className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                      />
                      {customerLoading ? (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
                      ) : customerSearch ? (
                        <button
                          type="button"
                          onClick={() => handleCustomerSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>

                    {customerDropdownOpen && customerSearch.trim() && (
                      <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-900/10 overflow-hidden animate-fadeIn">
                        {customerResults.length > 0 ? (
                          <ul className="max-h-64 overflow-y-auto py-1">
                            {customerResults.map((c, i) => (
                              <li key={c.id}>
                                <button
                                  type="button"
                                  onMouseEnter={() => setCustomerHighlighted(i)}
                                  onClick={() => selectCustomer(c)}
                                  className={`w-full flex items-center gap-3 text-left px-3 py-2.5 transition ${
                                    i === customerHighlighted ? "bg-indigo-50" : ""
                                  }`}
                                >
                                  <CustomerAvatar name={c.username} />
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                      <HighlightMatch text={c.username} query={customerSearch} />
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {c.phone ?? "No phone"} · {c.email ?? "No email"}
                                    </p>
                                  </div>
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : customerLoading ? (
                          <div className="px-3 py-5 text-center text-xs text-gray-400">Searching…</div>
                        ) : customerHasSearched ? (
                          <div className="px-3 py-4 text-center">
                            <p className="text-xs text-gray-400 mb-2">No customer matching "{customerSearch.trim()}"</p>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomerMode("new");
                                setNewCustomer(p => ({ ...p, username: customerSearch.trim() }));
                                setCustomerDropdownOpen(false);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                            >
                              <UserPlusIcon className="w-4 h-4" />
                              Create "{customerSearch.trim()}" as a new customer
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* New customer form */}
            {customerMode === "new" && (
              <div className="max-w-lg space-y-4 animate-fadeIn">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    <UserCircleIcon className="w-3.5 h-3.5" />
                    Full Name <span className="text-blue-500 normal-case">*</span>
                  </label>
                  <input type="text" autoFocus placeholder="Customer name" value={newCustomer.username}
                    onChange={e => setNewCustomer(p => ({ ...p, username: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      <PhoneIcon className="w-3.5 h-3.5" />
                      Phone <span className="text-blue-500 normal-case">*</span>
                    </label>
                    <input type="tel" placeholder="+91 XXXXX XXXXX" value={newCustomer.phone}
                      onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      <EnvelopeIcon className="w-3.5 h-3.5" />
                      Email <span className="normal-case text-gray-400 font-medium">(optional)</span>
                    </label>
                    <input type="email" placeholder="customer@email.com" value={newCustomer.email}
                      onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value.toLowerCase() }))}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition" />
                  </div>
                </div>
                <p className="text-[11px] text-gray-400">This customer will be created and linked to the order.</p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Products ── */}
        {currentStep === "products" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product picker */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Add Products</h2>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products…"
                  value={productSearch}
                  onChange={e => handleProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {productsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {products.map(p => {
                    const hasVariants = (p.variants?.length ?? 0) > 0;
                    const selectedVid = selectedVariantByProduct[p.id] ?? "";
                    const selectedVariant = hasVariants ? p.variants!.find(v => v.id === selectedVid) : undefined;
                    const inCart = hasVariants
                      ? (selectedVariant ? findCartLine(p.id, selectedVariant.id) : undefined)
                      : findCartLine(p.id, null);
                    const rowMaxStock = selectedVariant ? selectedVariant.stock : p.stock;
                    return (
                      <li key={p.id} className="flex items-center gap-3 py-3">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <ShoppingCartIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                          {hasVariants ? (
                            <select
                              value={selectedVid}
                              onChange={e => setSelectedVariantByProduct(prev => ({ ...prev, [p.id]: e.target.value }))}
                              className="mt-1 w-full max-w-xs text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">Select option…</option>
                              {p.variants!.map(v => (
                                <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                                  {Object.entries(v.options).map(([k, val]) => `${k}: ${val}`).join(" / ")}
                                  {" — ₹"}{(v.priceOverride ?? p.price).toLocaleString("en-IN")}
                                  {" "}({v.stock > 0 ? `${v.stock} in stock` : "out of stock"})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-xs text-gray-500">₹{p.price.toLocaleString("en-IN")} · Stock: {p.stock}</p>
                          )}
                        </div>
                        {inCart ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button type="button" onClick={() => updateQty(p.id, inCart.variantId, inCart.quantity - 1, rowMaxStock)}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                              <MinusIcon className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-indigo-700">{inCart.quantity}</span>
                            <button type="button" onClick={() => updateQty(p.id, inCart.variantId, inCart.quantity + 1, rowMaxStock)}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                              <PlusIcon className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(p, hasVariants ? selectedVid : null)}
                            disabled={hasVariants && !selectedVariant}
                            className="flex items-center gap-1 bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                          >
                            <PlusIcon className="w-3.5 h-3.5" /> Add
                          </button>
                        )}
                      </li>
                    );
                  })}
                  {products.length === 0 && !productsLoading && (
                    <li className="py-10 text-center text-gray-400 text-sm">No products found</li>
                  )}
                </ul>
              )}

              {/* Pagination */}
              {productTotalPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button type="button" disabled={productPage <= 1} onClick={() => setProductPage(p => p - 1)}
                    className="flex items-center gap-1 text-xs text-gray-600 disabled:opacity-40 hover:text-indigo-600 transition-colors">
                    <ChevronLeftIcon className="w-4 h-4" /> Prev
                  </button>
                  <span className="text-xs text-gray-500">Page {productPage} / {productTotalPages}</span>
                  <button type="button" disabled={productPage >= productTotalPages} onClick={() => setProductPage(p => p + 1)}
                    className="flex items-center gap-1 text-xs text-gray-600 disabled:opacity-40 hover:text-indigo-600 transition-colors">
                    Next <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Cart summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 h-fit">
              <h2 className="text-base font-bold text-gray-800">Cart ({cart.length})</h2>
              {cart.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No items yet</p>
              ) : (
                <ul className="divide-y divide-gray-100 space-y-0">
                  {cart.map(item => (
                    <li key={`${item.product.id}-${item.variantId ?? "base"}`} className="flex items-center gap-2 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{item.product.name}</p>
                        {item.variantOptions && (
                          <p className="text-[11px] text-gray-400 truncate">
                            {Object.entries(item.variantOptions).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">₹{item.unitPrice.toLocaleString("en-IN")} × {item.quantity}</p>
                      </div>
                      <p className="text-xs font-bold text-indigo-600 shrink-0">₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}</p>
                      <button type="button" onClick={() => removeFromCart(item.product.id, item.variantId)}
                        className="text-red-400 hover:text-red-600 transition-colors shrink-0">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {cart.length > 0 && (
                <>
                  {/* Coupon */}
                  <div className="pt-3 border-t border-gray-100">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl animate-fadeIn">
                        <div className="flex items-center gap-2 min-w-0">
                          <TicketIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-emerald-900 truncate">{appliedCoupon.code}</p>
                            <p className="text-[11px] text-emerald-600">
                              {appliedCoupon.discountType === "PERCENTAGE"
                                ? `${appliedCoupon.discountValue}% off`
                                : `₹${appliedCoupon.discountAmount.toLocaleString("en-IN")} off`}
                            </p>
                          </div>
                        </div>
                        <button type="button" onClick={handleRemoveCoupon}
                          className="shrink-0 text-emerald-700 hover:text-red-600 transition-colors">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <TicketIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Coupon code"
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleApplyCoupon(); } }}
                            className="w-full pl-8 pr-2 py-2 text-xs font-semibold uppercase tracking-wide border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={!couponCode.trim() || couponLoading}
                          className="shrink-0 px-3 py-2 text-xs font-bold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {couponLoading ? "…" : "Apply"}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-200 space-y-1.5">
                    {appliedCoupon && (
                      <>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Subtotal</span>
                          <span>₹{cartTotal.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                          <span>Discount</span>
                          <span>−₹{appliedCoupon.discountAmount.toLocaleString("en-IN")}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-sm font-bold text-gray-800">
                      <span>Total</span>
                      <span>₹{orderTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: Address ── */}
        {currentStep === "address" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="text-lg font-bold text-gray-800">Delivery Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Address <span className="text-red-500">*</span></label>
                <textarea rows={2} placeholder="House no, street, locality…" value={address.fullAddress}
                  onChange={e => setAddress(p => ({ ...p, fullAddress: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">City <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="City" value={address.city}
                    onChange={e => setAddress(p => ({ ...p, city: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">State <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="State" value={address.state}
                    onChange={e => setAddress(p => ({ ...p, state: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Zip / PIN Code <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="600001" value={address.zipCode}
                    onChange={e => setAddress(p => ({ ...p, zipCode: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
                  <input type="text" placeholder="India" value={address.country}
                    onChange={e => setAddress(p => ({ ...p, country: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Payment ── */}
        {currentStep === "payment" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-800">Payment Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-colors
                  ${paymentMethod === "CASH" ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 bg-white"}`}
              >
                <CreditCardIcon className={`w-8 h-8 ${paymentMethod === "CASH" ? "text-indigo-600" : "text-gray-400"}`} />
                <span className={`font-bold text-sm ${paymentMethod === "CASH" ? "text-indigo-700" : "text-gray-600"}`}>Cash Collected</span>
                <span className="text-xs text-gray-500 text-center">Customer paid in cash at the counter</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("POD")}
                className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-colors
                  ${paymentMethod === "POD" ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 bg-white"}`}
              >
                <MapPinIcon className={`w-8 h-8 ${paymentMethod === "POD" ? "text-indigo-600" : "text-gray-400"}`} />
                <span className={`font-bold text-sm ${paymentMethod === "POD" ? "text-indigo-700" : "text-gray-600"}`}>Pay on Delivery</span>
                <span className="text-xs text-gray-500 text-center">Payment will be collected at delivery</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Note <span className="text-gray-400 font-normal">(optional — receipt no, UPI ref, etc.)</span></label>
              <input type="text" placeholder="e.g. Receipt #1234, UPI ref: abc123xyz" value={paymentNote}
                onChange={e => setPaymentNote(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        )}

        {/* ── STEP 5: Confirm ── */}
        {currentStep === "confirm" && (
          <div className="space-y-4">
            {/* Customer summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Customer</h3>
              {customerMode === "existing" && selectedCustomer ? (
                <div>
                  <p className="font-semibold text-gray-800">{selectedCustomer.username}</p>
                  <p className="text-sm text-gray-500">{selectedCustomer.phone ?? "—"} · {selectedCustomer.email ?? "No email"}</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-gray-800">{newCustomer.username} <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">New</span></p>
                  <p className="text-sm text-gray-500">{newCustomer.phone} {newCustomer.email ? `· ${newCustomer.email}` : ""}</p>
                </div>
              )}
            </div>

            {/* Items summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Items ({cart.length})</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-2 text-left font-semibold">Product</th>
                    <th className="pb-2 text-center font-semibold">Qty</th>
                    <th className="pb-2 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cart.map(item => (
                    <tr key={`${item.product.id}-${item.variantId ?? "base"}`}>
                      <td className="py-2 text-gray-700">
                        {item.product.name}
                        {item.variantOptions && (
                          <span className="block text-xs text-gray-400">
                            {Object.entries(item.variantOptions).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-2 text-right font-semibold text-gray-800">₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {appliedCoupon && (
                    <>
                      <tr>
                        <td colSpan={2} className="pt-3 text-gray-500">Subtotal</td>
                        <td className="pt-3 text-right text-gray-600">₹{cartTotal.toLocaleString("en-IN")}</td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="text-emerald-600 font-semibold flex items-center gap-1.5 pt-1">
                          <TicketIcon className="w-3.5 h-3.5" /> {appliedCoupon.code}
                        </td>
                        <td className="text-right text-emerald-600 font-semibold pt-1">−₹{appliedCoupon.discountAmount.toLocaleString("en-IN")}</td>
                      </tr>
                    </>
                  )}
                  <tr className="border-t border-gray-200">
                    <td colSpan={2} className="pt-3 font-bold text-gray-800">Total</td>
                    <td className="pt-3 text-right font-bold text-indigo-700 text-base">₹{orderTotal.toLocaleString("en-IN")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Address summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Delivery Address</h3>
              <p className="text-sm text-gray-700">{address.fullAddress}</p>
              <p className="text-sm text-gray-500">{address.city}, {address.state} {address.zipCode}, {address.country}</p>
            </div>

            {/* Payment summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Payment</h3>
              <div className="flex items-center gap-3">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${paymentMethod === "CASH" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {paymentMethod === "CASH" ? "Cash Collected" : "Pay on Delivery"}
                </span>
                {paymentNote && <span className="text-sm text-gray-500">Ref: {paymentNote}</span>}
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation buttons ── */}
        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" /> Back
          </button>

          {currentStep !== "confirm" ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRightIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={placing}
              className="flex items-center gap-2 px-7 py-2.5 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {placing ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Placing…</>
              ) : (
                <><CheckCircleIcon className="w-4 h-4" /> Place Order</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
