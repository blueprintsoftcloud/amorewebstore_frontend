import React, { useEffect, useState, useRef, Fragment } from "react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { createPortal } from "react-dom";
import { Popover, Transition } from "@headlessui/react";
import {
  ChevronUpIcon,
  MapPinIcon,
  TruckIcon,
  CreditCardIcon,
  BanknotesIcon,
  TagIcon,
  XCircleIcon,
  LockClosedIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { ArrowLeft, ArrowRight, CheckCircle, Package, QrCode, UploadCloud, Copy, Trash2, X, Sparkles, AlertCircle, Smartphone } from "lucide-react";
import QRCode from "qrcode";

const validateTransactionId = (val: string) => {
  const cleaned = val.trim().replace(/[\s-]/g, "");
  if (!cleaned) return { isValid: false, message: "", type: "EMPTY" };

  // Pure digits: standard NPCI 12-digit UTR
  if (/^\d+$/.test(cleaned)) {
    if (cleaned.length === 12) {
      return { isValid: true, message: "Valid 12-digit UPI UTR", type: "UTR" };
    }
    return {
      isValid: false,
      message: "UTR must be exactly 12 digits",
      type: "INCOMPLETE_UTR",
    };
  }

  // Alphanumeric UPI Reference ID (10 to 12 chars)
  if (/^[a-zA-Z0-9_-]{10,12}$/.test(cleaned)) {
    return { isValid: true, message: "Valid UPI Reference ID", type: "REF_ID" };
  }

  if (cleaned.length < 10) {
    return {
      isValid: false,
      message: "Min 10 characters or 12-digit UTR required",
      type: "TOO_SHORT",
    };
  }

  return {
    isValid: false,
    message: "Only numbers, letters, hyphens, and underscores allowed",
    type: "INVALID_CHARS",
  };
};
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useBranding } from "../context/BrandingContext";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import CancellationFeedbackModal, { SurveyItemSnapshot } from "../components/CancellationFeedbackModal";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import toast, { Toaster } from "react-hot-toast";
import { trackMetaInitiateCheckout, trackMetaPurchase } from "../utils/metaPixel";

import { motion, AnimatePresence } from "framer-motion";

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});


const GooglePayIcon = ({ className = "h-5.5 w-auto" }: { className?: string }) => (
  <svg viewBox="14 21 91 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M57.5437 26.997V35.9796H63.0833C64.4033 35.9796 65.4945 35.5352 66.3569 34.6486C67.2435 33.7642 67.6879 32.7082 67.6879 31.4872C67.6879 30.2904 67.2435 29.2476 66.3569 28.3588C65.4945 27.4502 64.4033 26.9948 63.0833 26.9948H57.5437V26.997ZM57.5437 39.141V49.5602H54.2349V23.8356H63.0129C65.2415 23.8356 67.1335 24.577 68.6933 26.062C70.2773 27.547 71.0693 29.3554 71.0693 31.4872C71.0693 33.6674 70.2773 35.489 68.6933 36.9476C67.1599 38.4106 65.2635 39.1388 63.0107 39.1388H57.5437V39.141ZM74.4133 44.1724C74.4133 45.0348 74.7785 45.752 75.5111 46.3284C76.2415 46.9004 77.0995 47.1886 78.0807 47.1886C79.4733 47.1886 80.7119 46.6738 81.8031 45.6464C82.8965 44.6146 83.4399 43.4046 83.4399 42.0164C82.4081 41.2024 80.9693 40.7954 79.1235 40.7954C77.7815 40.7954 76.6595 41.121 75.7619 41.7678C74.8621 42.4146 74.4133 43.2132 74.4133 44.1724ZM78.6945 31.3794C81.1409 31.3794 83.0703 32.0328 84.4871 33.3374C85.8995 34.6442 86.6079 36.435 86.6079 38.7098V49.5602H83.4421V47.1182H83.2991C81.9307 49.129 80.1091 50.1366 77.8299 50.1366C75.8895 50.1366 74.2637 49.5602 72.9569 48.4118C71.6501 47.2612 70.9967 45.8246 70.9967 44.0998C70.9967 42.2782 71.6853 40.8306 73.0647 39.7526C74.4441 38.6746 76.2833 38.1356 78.5867 38.1356C80.5491 38.1356 82.1705 38.4942 83.4399 39.2136V38.4568C83.4399 37.3084 82.9845 36.3316 82.0737 35.5308C81.1961 34.7411 80.0531 34.3114 78.8727 34.3274C77.0247 34.3274 75.5639 35.104 74.4837 36.6638L71.5709 34.829C73.1769 32.53 75.5529 31.3794 78.6945 31.3794ZM104.771 31.9558L93.7271 57.3218H90.3105L94.4113 48.447L87.1469 31.9558H90.7439L95.9953 44.6036H96.0657L101.174 31.9536L104.771 31.9558Z"
      fill="#3C4043"
    />
    <path
      d="M44.1722 36.8948C44.1722 35.8542 44.0842 34.8488 43.917 33.8896H29.9602V39.5832H37.955C37.6239 41.4215 36.5557 43.0445 34.9982 44.0756V47.7716H39.77C42.564 45.1976 44.1722 41.3916 44.1722 36.8948Z"
      fill="#4285F4"
    />
    <path
      d="M29.9603 51.34C33.9555 51.34 37.3171 50.031 39.7701 47.7738L34.9983 44.0756C33.6717 44.9688 31.9623 45.4902 29.9603 45.4902C26.1015 45.4902 22.8235 42.8898 21.6531 39.3874H16.7383V43.1956C19.2527 48.1909 24.3678 51.3425 29.9603 51.3422"
      fill="#34A853"
    />
    <path
      d="M21.6529 39.3874C21.0355 37.5518 21.0355 35.5646 21.6529 33.729V29.9208H16.7381C15.6991 31.9782 15.1587 34.2512 15.1606 36.556C15.1606 38.943 15.7327 41.198 16.7381 43.1934L21.6529 39.3852V39.3874Z"
      fill="#FABB05"
    />
    <path
      d="M29.96 27.6262C32.1424 27.6262 34.096 28.3742 35.636 29.8438V29.846L39.86 25.6264C37.2992 23.2416 33.9552 21.7764 29.9622 21.7764C24.3703 21.7757 19.2553 24.9264 16.7402 29.9208L21.655 33.729C22.8254 30.2266 26.1034 27.6262 29.9622 27.6262"
      fill="#E94235"
    />
  </svg>
);

const PhonePeIcon = ({ className = "h-7 w-7" }: { className?: string }) => (
  <svg viewBox="0 0 70 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="35" cy="35" r="32" fill="#5f259f" />
    <path
      d="m 48.431347,27.0768 c 0,-1.168224 -1.001334,-2.169558 -2.169557,-2.169558 h -4.005338 l -9.1789,-10.514013 c -0.834446,-1.001335 -2.169559,-1.335113 -3.504671,-1.001335 l -3.170893,1.001335 c -0.500667,0.166889 -0.667556,0.834445 -0.333778,1.168223 l 10.013345,9.512679 H 20.894648 c -0.500667,0 -0.834445,0.333778 -0.834445,0.834445 v 1.668891 c 0,1.168224 1.001334,2.169558 2.169558,2.169558 h 2.336448 v 8.010676 c 0,6.008008 3.170892,9.512678 8.511343,9.512678 1.668891,0 3.004003,-0.166889 4.672894,-0.834445 v 5.340451 c 0,1.502002 1.168224,2.670225 2.670225,2.670225 h 2.336448 c 0.500667,0 1.001335,-0.500667 1.001335,-1.001334 v -23.86514 h 3.838448 c 0.500667,0 0.834445,-0.333778 0.834445,-0.834445 z M 37.750446,41.429261 c -1.001334,0.500668 -2.336447,0.667557 -3.337781,0.667557 -2.670226,0 -4.005339,-1.335114 -4.005339,-4.339117 v -8.010676 h 7.34312 z"
      fill="#ffffff"
    />
  </svg>
);

const PaytmIcon = ({ className = "h-4.5 w-auto" }: { className?: string }) => (
  <svg viewBox="0 0 16.838 5.285" className={className} xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(0.35277777,0,0,-0.35277777,16.777056,1.5610286)">
      <path
        style={{ fill: "#00BAF2", fillOpacity: 1, fillRule: "nonzero", stroke: "none" }}
        d="M 0,0 C -0.433,1.238 -1.613,2.127 -2.999,2.127 H -3.028 C -3.929,2.127 -4.741,1.752 -5.319,1.15 -5.898,1.752 -6.71,2.127 -7.61,2.127 h -0.029 c -0.792,0 -1.516,-0.29 -2.072,-0.77 V 1.601 C -9.73,1.844 -9.93,2.035 -10.177,2.035 h -2.126 c -0.26,0 -0.47,-0.21 -0.47,-0.471 V -9.981 c 0,-0.261 0.21,-0.471 0.47,-0.471 h 2.126 c 0.237,0 0.432,0.177 0.463,0.406 l -10e-4,8.288 c 0,0.029 10e-4,0.056 0.004,0.083 0.034,0.37 0.305,0.674 0.733,0.712 h 0.079 0.223 0.09 c 0.179,-0.016 0.33,-0.079 0.449,-0.174 0.185,-0.147 0.288,-0.373 0.288,-0.621 l 0.008,-8.247 c 0,-0.261 0.211,-0.472 0.47,-0.472 h 2.126 c 0.251,0 0.455,0.2 0.467,0.449 l -0.001,8.281 c -0.001,0.272 0.125,0.518 0.346,0.664 0.109,0.07 0.24,0.117 0.391,0.131 h 0.079 0.223 0.09 c 0.46,-0.04 0.738,-0.389 0.737,-0.795 l 0.008,-8.236 c 0,-0.261 0.211,-0.471 0.47,-0.471 h 2.126 c 0.259,0 0.47,0.21 0.47,0.471 v 8.858 C 0.161,-0.521 0.093,-0.264 0,0"
      />
    </g>
    <g transform="matrix(0.35277777,0,0,-0.35277777,11.699676,0.85374862)">
      <path
        style={{ fill: "#00BAF2", fillOpacity: 1, fillRule: "nonzero", stroke: "none" }}
        d="m 0,0 h -1.216 v 1.97 0 c 0,0.002 0,0.004 0,0.006 0,0.237 -0.192,0.429 -0.429,0.429 C -1.673,2.405 -1.7,2.401 -1.726,2.396 -3.074,2.026 -2.804,0.159 -5.265,0 H -5.32 -5.504 c -0.036,0 -0.07,-0.005 -0.103,-0.012 h -0.002 l 0.002,-10e-4 C -5.817,-0.06 -5.975,-0.246 -5.975,-0.47 v -2.126 c 0,-0.259 0.211,-0.47 0.471,-0.47 h 1.283 l -0.002,-9.015 c 0,-0.257 0.208,-0.465 0.465,-0.465 h 2.102 c 0.256,0 0.464,0.208 0.464,0.465 l 10e-4,9.015 H 0 c 0.259,0 0.47,0.211 0.47,0.47 V -0.47 C 0.47,-0.211 0.259,0 0,0"
      />
    </g>
    <g transform="matrix(0.35277777,0,0,-0.35277777,9.0012361,0.85374862)">
      <path
        style={{ fill: "#002970", fillOpacity: 1, fillRule: "nonzero", stroke: "none" }}
        d="M 0,0 H -2.126 C -2.385,0 -2.595,-0.211 -2.595,-0.47 V -4.866 C -2.6,-5.138 -2.82,-5.356 -3.093,-5.356 h -0.89 c -0.276,0 -0.499,0.222 -0.499,0.498 L -4.49,-0.47 C -4.49,-0.211 -4.701,0 -4.96,0 h -2.126 c -0.26,0 -0.47,-0.211 -0.47,-0.47 v -4.818 c 0,-1.83 1.305,-3.135 3.136,-3.135 0,0 1.374,0 1.416,-0.008 0.248,-0.028 0.441,-0.236 0.441,-0.492 0,-0.253 -0.189,-0.46 -0.434,-0.491 -0.012,-0.002 -0.023,-0.005 -0.036,-0.007 l -3.109,-0.011 c -0.26,0 -0.47,-0.211 -0.47,-0.47 v -2.125 c 0,-0.26 0.21,-0.47 0.47,-0.47 h 3.476 c 1.832,0 3.136,1.304 3.136,3.135 V -0.47 C 0.47,-0.211 0.26,0 0,0"
      />
    </g>
    <g transform="matrix(0.35277777,0,0,-0.35277777,1.7417071,2.2279886)">
      <path
        style={{ fill: "#002970", fillOpacity: 1, fillRule: "nonzero", stroke: "none" }}
        d="m 0,0 v -0.992 -0.32 c 0,-0.275 -0.223,-0.499 -0.498,-0.499 l -1.349,-0.001 v 2.629 h 1.349 C -0.223,0.817 0,0.595 0,0.319 Z M 0.187,3.896 H -4.46 c -0.255,0 -0.461,-0.207 -0.461,-0.461 V 1.352 c 0,-0.004 0.001,-0.008 0.001,-0.012 0,-0.01 -0.001,-0.02 -0.001,-0.029 V -5.37 -8.117 c 0,-0.256 0.192,-0.465 0.43,-0.471 h 0.04 2.126 c 0.259,0 0.47,0.21 0.47,0.47 l 0.008,3.231 h 2.034 c 1.702,0 2.888,1.181 2.888,2.89 v 2.999 c 0,1.709 -1.186,2.894 -2.888,2.894"
      />
    </g>
    <g transform="matrix(0.35277777,0,0,-0.35277777,4.8535941,3.9887686)">
      <path
        style={{ fill: "#002970", fillOpacity: 1, fillRule: "nonzero", stroke: "none" }}
        d="M 0,0 V -0.332 C 0,-0.359 -0.004,-0.385 -0.008,-0.41 -0.013,-0.434 -0.02,-0.457 -0.028,-0.479 -0.094,-0.665 -0.28,-0.8 -0.501,-0.8 h -0.885 c -0.276,0 -0.501,0.21 -0.501,0.468 v 0.401 c 0,0.005 -10e-4,0.01 -10e-4,0.015 l 10e-4,1.067 v 0.002 0.118 0.214 l 0.001,0.003 c 10e-4,0.257 0.224,0.465 0.5,0.465 h 0.885 C -0.224,1.953 0,1.744 0,1.485 Z m -0.338,8.875 h -2.95 C -3.549,8.875 -3.76,8.677 -3.76,8.434 V 7.607 c 0,-0.005 10e-4,-0.011 10e-4,-0.016 0,-0.006 -10e-4,-0.012 -10e-4,-0.018 V 6.44 c 0,-0.257 0.224,-0.467 0.5,-0.467 h 2.809 c 0.222,-0.035 0.398,-0.197 0.423,-0.45 V 5.249 C -0.053,5.008 -0.227,4.832 -0.439,4.812 H -1.83 c -1.85,0 -3.168,-1.229 -3.168,-2.955 v -2.409 -0.063 c 0,-1.716 1.133,-2.937 2.97,-2.937 h 3.855 c 0.692,0 1.253,0.524 1.253,1.169 v 8.067 c 0,1.956 -1.008,3.191 -3.418,3.191"
      />
    </g>
  </svg>
);

interface AddressState {
  house: string;
  city: string;
  state: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
}

interface Suggestion {
  lat: string;
  lon: string;
  display_name: string;
}

const DEFAULT_MAP_CENTER: [number, number] = [20.5937, 78.9629];

const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.5, 68.0],
  [37.5, 97.5],
];

const isWithinIndiaBoundingBox = (lat: number, lng: number): boolean => {
  return lat >= 6.0 && lat <= 38.0 && lng >= 68.0 && lng <= 98.0;
};

function MapRecenter({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, map, zoom]);

  return null;
}

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (event) => {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

const CheckoutPage = () => {
  const { user } = useAuth();
  const { branding } = useBranding();
  const { cartItems, cartTotal, clearCart, fetchCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackTriggerSource, setFeedbackTriggerSource] = useState("CHECKOUT_CANCELLED");
  const [feedbackOrderId, setFeedbackOrderId] = useState<string | undefined>(undefined);
  const [userProfile, setUserProfile] = useState<{
    username?: string;
    email?: string;
    phone?: string;
  } | null>(null);
  const prefill = location.state as {
    addressPrefill?: {
      fullAddress: string;
      detectedArea?: string;
      city: string;
      state: string;
      zipCode: string;
      lat: number | null;
      lng: number | null;
      isGpsLocked?: boolean;
    };
    shippingCharge?: number;
    buyNowProductId?: string;
    buyNowVariantId?: string | null;
  } | null;
  const buyNowProductId = prefill?.buyNowProductId ?? null;
  const buyNowVariantId = prefill?.buyNowVariantId ?? null;
  const isPaymentSuccess = useRef(false);

  // For Buy Now: only process the specific product, not the entire cart
  const checkoutItems = buyNowProductId
    ? cartItems.filter(
        (i) =>
          i.productId === buyNowProductId &&
          (!buyNowVariantId || (i.variantId ?? null) === buyNowVariantId),
      )
    : cartItems;
  const checkoutSubtotal = checkoutItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0,
  );

  // --- NEW STATE FOR BLUR EFFECT ---
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);

  const [address, setAddress] = useState<AddressState>({
    house: prefill?.addressPrefill?.fullAddress ?? "",
    city: prefill?.addressPrefill?.city ?? "",
    state: prefill?.addressPrefill?.state ?? "",
    pincode: prefill?.addressPrefill?.zipCode ?? "",
    lat: prefill?.addressPrefill?.lat ?? null,
    lng: prefill?.addressPrefill?.lng ?? null,
  });

  const [detectedArea, setDetectedArea] = useState<string>(
    prefill?.addressPrefill?.detectedArea ?? ""
  );

  const [isGpsLocked, setIsGpsLocked] = useState<boolean>(
    !!prefill?.addressPrefill?.isGpsLocked || (!!prefill?.addressPrefill?.lat && !!prefill?.addressPrefill?.lng),
  );

  const [shippingCharge, setShippingCharge] = useState(
    prefill?.shippingCharge ?? 0,
  );
  const [shippingToggles, setShippingToggles] = useState<{
    calculateShippingForCOD: boolean;
    calculateShippingForOnline: boolean;
    calculateShippingForQR: boolean;
  }>({
    calculateShippingForCOD: true,
    calculateShippingForOnline: true,
    calculateShippingForQR: true,
  });
  const [paymentMethod, setPaymentMethod] = useState("Online");
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<[number, number] | null>(
    prefill?.addressPrefill?.lat && prefill?.addressPrefill?.lng
      ? [prefill.addressPrefill.lat, prefill.addressPrefill.lng]
      : null,
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  useBodyScrollLock(showSuccessModal);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponId: string;
    code: string;
    discountAmount: number;
    discountType: string;
    discountValue: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Dismiss any lingering toasts from previous pages on mount
  useEffect(() => {
    toast.dismiss();
  }, []);

  // Track Meta Pixel InitiateCheckout event when checkout loads with items
  useEffect(() => {
    if (checkoutItems.length > 0) {
      trackMetaInitiateCheckout({
        content_ids: checkoutItems.map((i) => String(i.productId)),
        num_items: checkoutItems.reduce((sum, i) => sum + i.quantity, 0),
        value: checkoutSubtotal,
        currency: "INR",
      });
    }
  }, [checkoutItems.length]);

  // Pay with QR state
  const [qrConfig, setQrConfig] = useState<{
    enabled: boolean;
    qrCode: string;
    upiId?: string;
    accountName?: string;
    instructions?: string;
  }>({ enabled: false, qrCode: "" });
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrModalStep, setQrModalStep] = useState<"SCAN" | "SUBMIT">("SCAN");
  useBodyScrollLock(showQrModal);
  const [dynamicQrUrl, setDynamicQrUrl] = useState<string | null>(null);
  const [upiIntentUri, setUpiIntentUri] = useState<string | null>(null);
  const [selectedUpiApp, setSelectedUpiApp] = useState<"gpay" | "phonepe" | "paytm">("gpay");
  const [qrTransactionId, setQrTransactionId] = useState("");
  const [qrScreenshotFile, setQrScreenshotFile] = useState<File | null>(null);
  const [qrScreenshotPreview, setQrScreenshotPreview] = useState<string | null>(null);
  const [qrSubmitting, setQrSubmitting] = useState(false);

  useEffect(() => {
    api.get("/admin/company-settings")
      .then((res) => {
        const s = res.data?.settings;
        if (s) {
          setQrConfig({
            enabled: s.PAYMENT_QR_ENABLED === "true" || s.PAYMENT_QR_ENABLED === "1" || s.PAYMENT_QR_ENABLED === true,
            qrCode: s.PAYMENT_QR_CODE || "",
            upiId: s.PAYMENT_QR_UPI_ID || "",
            accountName: s.PAYMENT_QR_ACCOUNT_NAME || "",
            instructions: s.PAYMENT_QR_INSTRUCTIONS || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  // Fetch logged in customer profile details for accurate activity tracking
  useEffect(() => {
    if (user?.isAuthenticated) {
      api
        .get("/user/profile")
        .then((res) => {
          if (res.data?.users) {
            setUserProfile(res.data.users);
          }
        })
        .catch(() => {});
    }
  }, [user?.isAuthenticated]);

  // Fetch default saved address if no prefill address was provided (e.g. direct checkout from cart)
  useEffect(() => {
    if (!prefill?.addressPrefill && user?.isAuthenticated) {
      api
        .get("/address/default")
        .then((res) => {
          const addr = res.data?.address;
          if (addr) {
            setAddress({
              house: addr.fullAddress || "",
              city: addr.city || "",
              state: addr.state || "",
              pincode: addr.zipCode || "",
              lat: addr.latitude ?? null,
              lng: addr.longitude ?? null,
            });
            if (addr.latitude && addr.longitude) {
              setPosition([addr.latitude, addr.longitude]);
              setIsGpsLocked(true);
            }
          }
        })
        .catch(() => {});
    }
  }, [user?.isAuthenticated, prefill?.addressPrefill]);

  // Fetch shipping toggles so checkout knows if COD, Online, or QR have free shipping configured
  useEffect(() => {
    api.get("/order/shipping-toggles")
      .then((res) => {
        if (res.data?.toggles) {
          setShippingToggles({
            calculateShippingForCOD: res.data.toggles.calculateShippingForCOD !== false,
            calculateShippingForOnline: res.data.toggles.calculateShippingForOnline !== false,
            calculateShippingForQR: res.data.toggles.calculateShippingForQR !== false,
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load shipping toggles", err);
      });
  }, []);

  // Protect route: Redirect to cart if there are no items to checkout
  useEffect(() => {
    if (!showSuccessModal) {
      if (!buyNowProductId && (!cartItems || cartItems.length === 0)) {
        navigate("/cart", { replace: true });
      }
    }
  }, [cartItems, buyNowProductId, showSuccessModal, navigate]);

  // Update shipping charge when state, city, or pincode changes (manual mode)
  useEffect(() => {
    if (isGpsLocked) return;

    if (!address.state.trim() && !address.pincode.trim()) {
      setShippingCharge(0);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await api.post("/address/preview-shipping", {
          manual: true,
          state: address.state.trim(),
          city: address.city.trim(),
          zipCode: address.pincode.trim(),
        });
        setShippingCharge(res.data.shippingCharge);
        if (typeof res.data?.calculateShippingForCOD === "boolean") {
          setShippingToggles({
            calculateShippingForCOD: res.data.calculateShippingForCOD !== false,
            calculateShippingForOnline: res.data.calculateShippingForOnline !== false,
            calculateShippingForQR: res.data.calculateShippingForQR !== false,
          });
        }
      } catch (err) {
        console.error("Error updating shipping charge", err);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [address.state, address.city, address.pincode, isGpsLocked]);

  // Re-verify shipping charge when GPS is locked to ensure rates from DB are fresh
  useEffect(() => {
    if (isGpsLocked && address.lat !== null && address.lng !== null) {
      api.post("/address/preview-shipping", {
        latitude: address.lat,
        longitude: address.lng,
        state: address.state,
        city: address.city,
        zipCode: address.pincode,
      }).then((res) => {
        if (typeof res.data?.shippingCharge === "number") {
          setShippingCharge(res.data.shippingCharge);
        }
        if (typeof res.data?.calculateShippingForCOD === "boolean") {
          setShippingToggles({
            calculateShippingForCOD: res.data.calculateShippingForCOD !== false,
            calculateShippingForOnline: res.data.calculateShippingForOnline !== false,
            calculateShippingForQR: res.data.calculateShippingForQR !== false,
          });
        }
      }).catch((err) => {
        console.error("Error refreshing GPS shipping charge", err);
      });
    }
  }, [isGpsLocked, address.lat, address.lng, address.city, address.state]);


  const handleResetGpsLock = () => {
    setAddress({
      house: "",
      city: "",
      state: "",
      pincode: "",
      lat: null,
      lng: null,
    });
    setShippingCharge(0);
    setPosition(null);
    setIsGpsLocked(false);
    toast.success("Location lock cleared. You can now enter address manually.");
  };

  const handleManualSelect = async (
    lat: number,
    lng: number,
    displayName: string,
  ) => {
    const toastId = toast.loading("Calculating shipping...");

    try {
      const res = await api.post("/address/save-geo", {
        latitude: lat,
        longitude: lng,
      });

      const { address: addr, shippingCharge } = res.data;

      setAddress({
        house: "",
        city: addr.city || "",
        state: addr.state || "",
        pincode: addr.zipCode || "",
        lat,
        lng,
      });
      setDetectedArea(addr.fullAddress || "");

      setShippingCharge(shippingCharge);
      if (typeof res.data?.calculateShippingForCOD === "boolean") {
        setShippingToggles({
          calculateShippingForCOD: res.data.calculateShippingForCOD !== false,
          calculateShippingForOnline: res.data.calculateShippingForOnline !== false,
          calculateShippingForQR: res.data.calculateShippingForQR !== false,
        });
      }
      setPosition([lat, lng]);
      setSuggestions([]);
      setQuery("");
      setIsGpsLocked(true);
      toast.dismiss(toastId);
      toast.success(`Shipping ₹${shippingCharge}`);
    } catch (err: any) {
      toast.dismiss(toastId);
      const msg = err.response?.data?.message || "Failed to calculate shipping for this location.";
      toast.error(msg);
    }
  };

  const handleMapPick = (lat: number, lng: number) => {
    handleManualSelect(lat, lng, "Selected location from map");
  };

  // --- COUPON APPLY ---
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await api.post("/coupon/validate", {
        code: couponCode.trim(),
        orderAmount: Number(checkoutSubtotal),
      });
      setAppliedCoupon(res.data);
      toast.success(
        `Coupon "${res.data.code}" applied! You save ₹${res.data.discountAmount}`,
      );
      setCouponCode("");
    } catch (err: any) {
      console.error("Coupon validation error:", err);
      const message = err.response?.data?.message || err.message || "Invalid coupon code";
      toast.dismiss();
      toast.error(message, { id: "coupon-apply-error" });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  // --- SCRIPT LOADER ---
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // --- ONLINE PAYMENT LOGIC ---
  const startOnlinePayment = async () => {
    setLoading(true);
    isPaymentSuccess.current = false;

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error("Razorpay SDK failed to load.");
        setLoading(false);
        return;
      }

      const shippingAddressPayload = getFinalShippingAddress();
      const res = await api.post("/order/place", {
        couponId: appliedCoupon?.couponId,
        shippingAddress: shippingAddressPayload,
        ...(buyNowProductId
          ? {
              buyNowProductId,
              ...(buyNowVariantId ? { buyNowVariantId } : {}),
            }
          : {}),
      });

      if (!res.data || !res.data.rzpOrder) {
        throw new Error("Invalid response from server");
      }

      const razorpayKey = res.data.razorpay_key_id;
      if (!razorpayKey) {
        toast.error("Payment configuration error. Please contact support.");
        setLoading(false);
        return;
      }

      let orderClosed = false;
      const cancelPendingOrder = async () => {
        if (orderClosed || isPaymentSuccess.current) return;
        orderClosed = true;
        try {
          await api.post(`/order/cancel/${res.data.order.id}`);
        } catch (err) {
          console.error("Cancel failed", err);
        }
      };

      console.log(' razorpayKey',razorpayKey)
      console.log(' responseee',res)
 

      const options = {
        key: razorpayKey,
        amount: res.data.rzpOrder.amount,
        currency: "INR",
        name: branding.companyName || "Store",
        description: "Order payment",
        order_id: res.data.rzpOrder.id,
        method: {
          card: true,
          netbanking: true,
          wallet: true,
          paylater: true,
          upi: true,
        },
        retry: {
          enabled: false,
        },
        timeout: 300,
        handler: async (response: any) => {
          setIsRazorpayOpen(false);
          isPaymentSuccess.current = true;
          toast.success("Payment Successful! Processing...");

          try {
            await api.post("/order/verifyPayment", {
              ...response,
              ...(buyNowProductId
                ? {
                    buyNowProductId,
                    ...(buyNowVariantId ? { buyNowVariantId } : {}),
                  }
                : {}),
            });
          } catch (err) {
            console.error("Verification API Error:", err);
            toast.error(
              "Payment was captured, but verification failed. Please contact support.",
            );
            setLoading(false);
            return;
          }

          if (buyNowProductId) {
            if (fetchCart) await fetchCart();
          } else {
            if (clearCart) clearCart();
          }

          setAddress({
            house: "",
            city: "",
            state: "",
            pincode: "",
            lat: null,
            lng: null,
          });
          setShippingCharge(0);
          setPosition(null);
          setLoading(false);

          trackMetaPurchase({
            content_ids: checkoutItems.map((i) => String(i.productId)),
            num_items: checkoutItems.reduce((sum, i) => sum + i.quantity, 0),
            value: Number(totalAmount),
            currency: "INR",
          });

          setShowSuccessModal(true);
        },
        theme: { color: "#000000" },
        modal: {
          ondismiss: async function () {
            setIsRazorpayOpen(false);
            setLoading(false);

            if (isPaymentSuccess.current) return;
            await cancelPendingOrder();
            toast.error("Payment cancelled.");
            setTimeout(() => {
              setFeedbackTriggerSource("RAZORPAY_CANCELLED");
              setFeedbackOrderId(res.data.order?.id);
              setFeedbackModalOpen(true);
            }, 300);
          },
        },
      };

      console.log(' optionsssss',options)

      const rzp = new (window as any).Razorpay(options);

      rzp.on("payment.failed", async function (response: any) {
        setIsRazorpayOpen(false);
        setLoading(false);

        toast.error("Payment Failed");
        if (!isPaymentSuccess.current) {
          await cancelPendingOrder();
        }
        setTimeout(() => {
          setFeedbackTriggerSource("PAYMENT_FAILED");
          setFeedbackOrderId(res.data.order?.id);
          setFeedbackModalOpen(true);
        }, 300);
      });

      setIsRazorpayOpen(true);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Payment initialization failed");
      setLoading(false);
    }
  };

  // --- GEOLOCATION LOGIC ---
  const handleGetLocation = () => {
    const fallbackToIPGeolocation = async (message: string) => {
      const toastId = toast.loading(message);
      try {
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) throw new Error("IP lookup failed");
        const data = await response.json();
        const { latitude, longitude } = data;
        if (latitude === undefined || longitude === undefined) throw new Error("Invalid coordinates");

        if (!isWithinIndiaBoundingBox(latitude, longitude)) {
          toast.dismiss(toastId);
          toast.error("Detected location is outside India. Delivery is only available within India.");
          return;
        }

        setPosition([latitude, longitude]);

        const res = await api.post("/address/save-geo", {
          latitude,
          longitude,
        });
        const { address: addr, shippingCharge } = res.data;

        setAddress({
          house: "",
          city: addr.city || addr.town || addr.village || addr.county || "",
          state: addr.state || "",
          pincode: addr.zipCode || addr.postcode || "",
          lat: latitude,
          lng: longitude,
        });
        setDetectedArea(addr.fullAddress || "");

        setShippingCharge(shippingCharge);
        if (typeof res.data?.calculateShippingForCOD === "boolean") {
          setShippingToggles({
            calculateShippingForCOD: res.data.calculateShippingForCOD !== false,
            calculateShippingForOnline: res.data.calculateShippingForOnline !== false,
            calculateShippingForQR: res.data.calculateShippingForQR !== false,
          });
        }
        setIsGpsLocked(true);
        toast.dismiss(toastId);
        toast.success(`Location estimated via IP! Shipping: ₹${shippingCharge}`);
      } catch (err: any) {
        toast.dismiss(toastId);
        const msg = err.response?.data?.message || "Could not estimate location. Please enter manually.";
        toast.error(msg);
      }
    };

    if (!navigator.geolocation) {
      fallbackToIPGeolocation("GPS unavailable (requires HTTPS). Estimating location via IP...");
      return;
    }

    const toastId = toast.loading("Fetching location...");
    navigator.geolocation.getCurrentPosition(
      async (geoPosition) => {
        const { latitude, longitude } = geoPosition.coords;
        if (!isWithinIndiaBoundingBox(latitude, longitude)) {
          toast.dismiss(toastId);
          toast.error("Detected location is outside India. Delivery is only available within India.");
          return;
        }

        try {
          setPosition([latitude, longitude]);

          const res = await api.post("/address/save-geo", {
            latitude,
            longitude,
          });
          const { address: addr, shippingCharge } = res.data;

          setAddress({
            house: "",
            city: addr.city || addr.town || addr.village || addr.county || "",
            state: addr.state || "",
            pincode: addr.zipCode || addr.postcode || "",
            lat: latitude,
            lng: longitude,
          });
          setDetectedArea(addr.fullAddress || "");

          setShippingCharge(shippingCharge);
          if (typeof res.data?.calculateShippingForCOD === "boolean") {
            setShippingToggles({
              calculateShippingForCOD: res.data.calculateShippingForCOD !== false,
              calculateShippingForOnline: res.data.calculateShippingForOnline !== false,
              calculateShippingForQR: res.data.calculateShippingForQR !== false,
            });
          }
          setIsGpsLocked(true);
          toast.dismiss(toastId);
          toast.success(`Location set! Shipping: ₹${shippingCharge}`);
        } catch (err: any) {
          toast.dismiss(toastId);
          const msg = err.response?.data?.message || "Failed to get address details.";
          toast.error(msg);
        }
      },
      (err) => {
        toast.dismiss(toastId);
        if (err.code === err.PERMISSION_DENIED) {
          fallbackToIPGeolocation("GPS permission denied. Estimating location via IP...");
        } else {
          fallbackToIPGeolocation("GPS signal weak. Estimating location via IP...");
        }
      },
      { enableHighAccuracy: false },
    );
  };

  const getFinalShippingAddress = () => {
    const enteredStreet = address.house.trim();
    const area = detectedArea.trim();
    let finalFullAddress = enteredStreet;
    if (area && !enteredStreet.toLowerCase().includes(area.toLowerCase())) {
      finalFullAddress = `${enteredStreet}, ${area}`;
    }
    return {
      fullAddress: finalFullAddress,
      city: address.city.trim(),
      state: address.state.trim(),
      zipCode: address.pincode.trim(),
      country: "India",
      lat: address.lat ?? undefined,
      lng: address.lng ?? undefined,
    };
  };

  // --- PLACE ORDER HANDLER ---
  const handlePlaceOrder = async () => {
    if (checkoutItems.length === 0 || Number(checkoutSubtotal) <= 0) {
      toast.error("Your cart is empty. Please add products to continue.", { id: "checkout-empty" });
      navigate("/cart", { replace: true });
      return;
    }

    if (!address.house.trim()) {
      toast.error("Please enter your street address.", { id: "checkout-validate" });
      return;
    }
    if (!address.city.trim()) {
      toast.error("Please enter your city.", { id: "checkout-validate" });
      return;
    }
    if (!address.state.trim()) {
      toast.error("Please enter your state.", { id: "checkout-validate" });
      return;
    }
    if (!address.pincode.trim()) {
      toast.error("Please enter your pincode.", { id: "checkout-validate" });
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(address.pincode.trim())) {
      toast.error("Please enter a valid 6-digit pincode.", { id: "checkout-validate" });
      return;
    }

    const shippingAddressPayload = getFinalShippingAddress();

    // Persist full shipping address with GPS coordinates to user's address record
    try {
      await api.post("/address/save-manual", {
        fullAddress: shippingAddressPayload.fullAddress,
        city: shippingAddressPayload.city,
        state: shippingAddressPayload.state,
        zipCode: shippingAddressPayload.zipCode,
        latitude: shippingAddressPayload.lat,
        longitude: shippingAddressPayload.lng,
      });
    } catch (saveErr) {
      console.error("Failed to save address before order:", saveErr);
    }

    if (paymentMethod === "POD") {
      let toastId;
      try {
        setLoading(true);
        toastId = toast.loading("Processing your order...");

        await api.post("/order/placeOrderPOD", {
          couponId: appliedCoupon?.couponId,
          shippingAddress: shippingAddressPayload,
          ...(buyNowProductId
            ? {
                buyNowProductId,
                ...(buyNowVariantId ? { buyNowVariantId } : {}),
              }
            : {}),
        });

        isPaymentSuccess.current = true;
        if (buyNowProductId) {
          if (fetchCart) await fetchCart();
        } else {
          if (clearCart) clearCart();
        }
        toast.dismiss(toastId);
        toast.success("Order placed successfully!");

        trackMetaPurchase({
          content_ids: checkoutItems.map((i) => String(i.productId)),
          num_items: checkoutItems.reduce((sum, i) => sum + i.quantity, 0),
          value: Number(totalAmount),
          currency: "INR",
        });

        setShowSuccessModal(true);
      } catch (e) {
        if (toastId) toast.dismiss(toastId);
        toast.error("Order failed. Please try again.");
      } finally {
        setLoading(false);
      }
    } else if (paymentMethod === "QR") {
      setQrModalStep("SCAN");
      setShowQrModal(true);
    } else {
      await startOnlinePayment();
    }
  };

  const handleConfirmQrPayment = async () => {
    const cleanTxId = qrTransactionId.trim().replace(/[\s-]/g, "");
    const txValidation = validateTransactionId(qrTransactionId);

    if (qrTransactionId.trim() && !txValidation.isValid) {
      toast.error(txValidation.message);
      return;
    }

    setQrSubmitting(true);
    const toastId = toast.loading("Submitting your order...");

    try {
      const shippingAddressPayload = getFinalShippingAddress();
      const fd = new FormData();
      if (appliedCoupon?.couponId) fd.append("couponId", appliedCoupon.couponId);
      if (buyNowProductId) fd.append("buyNowProductId", buyNowProductId);
      if (buyNowVariantId) fd.append("buyNowVariantId", buyNowVariantId);
      if (cleanTxId) fd.append("transactionId", cleanTxId);
      if (qrScreenshotFile) fd.append("screenshot", qrScreenshotFile);
      fd.append("shippingAddress", JSON.stringify(shippingAddressPayload));

      await api.post("/order/placeOrderQR", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      isPaymentSuccess.current = true;
      if (buyNowProductId) {
        if (fetchCart) await fetchCart();
      } else {
        if (clearCart) clearCart();
      }

      toast.dismiss(toastId);
      toast.success("Order placed successfully with Direct payment!");
      setShowQrModal(false);
      setQrModalStep("SCAN");
      setQrTransactionId("");
      setQrScreenshotFile(null);
      setQrScreenshotPreview(null);

      trackMetaPurchase({
        content_ids: checkoutItems.map((i) => String(i.productId)),
        num_items: checkoutItems.reduce((sum, i) => sum + i.quantity, 0),
        value: Number(totalAmount),
        currency: "INR",
      });

      setShowSuccessModal(true);
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setQrSubmitting(false);
    }
  };

  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const isShippingDisabledForPayment =
    (paymentMethod === "POD" && !shippingToggles.calculateShippingForCOD) ||
    (paymentMethod === "Online" && !shippingToggles.calculateShippingForOnline) ||
    (paymentMethod === "QR" && !shippingToggles.calculateShippingForQR);
  const effectiveShippingCharge = checkoutItems.length === 0
    ? 0
    : isShippingDisabledForPayment
    ? 0
    : Number(shippingCharge || 0);
  const totalAmount = checkoutItems.length === 0
    ? "0.00"
    : Math.max(
        checkoutSubtotal + effectiveShippingCharge - discountAmount,
        0,
      ).toFixed(2);

  // Generate dynamic amount-embedded UPI QR code on the fly
  useEffect(() => {
    if (qrConfig.upiId && totalAmount) {
      const payeeName = qrConfig.accountName?.trim() || "Store";
      const upiUri = `upi://pay?pa=${encodeURIComponent(qrConfig.upiId.trim())}&pn=${encodeURIComponent(
        payeeName
      )}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Order Payment - ${payeeName}`)}`;

      setUpiIntentUri(upiUri);

      QRCode.toDataURL(upiUri, {
        width: 340,
        margin: 1.5,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      })
        .then((url: string) => setDynamicQrUrl(url))
        .catch((err: unknown) => {
          console.error("Failed to generate dynamic UPI QR", err);
          setDynamicQrUrl(null);
        });
    } else {
      setDynamicQrUrl(null);
      setUpiIntentUri(null);
    }
  }, [qrConfig.upiId, qrConfig.accountName, totalAmount]);

  const getUpiDeepLink = (app: "gpay" | "phonepe" | "paytm" | "other") => {
    if (!qrConfig.upiId || !totalAmount) return "";
    const payeeName = qrConfig.accountName?.trim() || "Store";
    const params = `pa=${encodeURIComponent(qrConfig.upiId.trim())}&pn=${encodeURIComponent(
      payeeName
    )}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Order Payment - ${payeeName}`)}`;

    const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
    const isIOS = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

    if (app === "gpay") {
      if (isAndroid) {
        return `intent://pay?${params}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end;`;
      }
      if (isIOS) {
        return `tez://upi/pay?${params}`;
      }
      return `upi://pay?${params}`;
    }

    if (app === "phonepe") {
      if (isAndroid) {
        return `intent://pay?${params}#Intent;scheme=upi;package=com.phonepe.app;end;`;
      }
      if (isIOS) {
        return `phonepe://pay?${params}`;
      }
      return `upi://pay?${params}`;
    }

    if (app === "paytm") {
      if (isAndroid) {
        return `intent://pay?${params}#Intent;scheme=upi;package=net.one97.paytm;end;`;
      }
      if (isIOS) {
        return `paytmmp://pay?${params}`;
      }
      return `upi://pay?${params}`;
    }

    return `upi://pay?${params}`;
  };

  const handleUpiAppClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    appName: string,
    _uri: string
  ) => {
    const isMobile =
      typeof navigator !== "undefined" &&
      /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!isMobile) {
      e.preventDefault();
      toast(
        `To pay with ${appName}, scan the QR code below using your phone camera or ${appName}!`,
        { icon: "📱", id: "desktop-qr-hint" }
      );
      return;
    }
  };

  const upiApps = [
    {
      id: "gpay" as const,
      name: "Google Pay",
      icon: <GooglePayIcon className="h-5 w-auto" />,
      activeBorder: "border-blue-500 bg-blue-50/50 text-blue-950 ring-2 ring-blue-500/20",
      buttonBg: "bg-slate-900 hover:bg-black text-white",
    },
    {
      id: "phonepe" as const,
      name: "PhonePe",
      icon: <PhonePeIcon className="h-7 w-7" />,
      activeBorder: "border-[#5F259F] bg-purple-50/50 text-purple-950 ring-2 ring-[#5F259F]/20",
      buttonBg: "bg-[#5F259F] hover:bg-[#4E1E82] text-white",
    },
    {
      id: "paytm" as const,
      name: "Paytm",
      icon: <PaytmIcon className="h-4.5 w-auto" />,
      activeBorder: "border-[#002E6E] bg-sky-50/50 text-sky-950 ring-2 ring-[#002E6E]/20",
      buttonBg: "bg-[#002E6E] hover:bg-[#001D47] text-white",
    },
  ];

  const currentUpiApp = upiApps.find((a) => a.id === selectedUpiApp) || upiApps[0];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pt-24 pb-24 md:pb-12 relative overflow-x-hidden">
      <style>{`
        .leaflet-container {
          cursor: pointer !important;
        }
      `}</style>
      {/* MAIN WRAPPER DIV */}
      <div
        className={`mx-auto max-w-screen-2xl px-4 sm:px-6 md:px-12 transition-opacity duration-300 ${
          isRazorpayOpen
            ? "pointer-events-none opacity-40"
            : "opacity-100"
        }`}
      >
        {/* --- Header & Back Button --- */}
        <div className="mb-8 mt-10">
          <button
            type="button"
            onClick={() => {
              setFeedbackTriggerSource(paymentMethod === "POD" ? "COD_CHECKOUT_EXIT" : "CHECKOUT_EXIT");
              setFeedbackModalOpen(true);
            }}
            className="group inline-flex items-center gap-2 text-xs font-bold tracking-widest text-slate-400 hover:text-slate-800 transition-colors duration-200 uppercase cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5]" />
            Go Back
          </button>
        </div>

        <div className="md:grid md:grid-cols-12 md:gap-x-8 lg:gap-x-16 xl:gap-x-28 items-start">
          
          {/* ================= LEFT SIDE: FORM ================= */}
          <div className="md:col-span-7 bg-white rounded-3xl md:rounded-[2rem] shadow-sm border border-gray-100 p-4 sm:p-6 md:p-10 mb-8 md:mb-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tighter text-gray-900 sm:text-4xl mb-2">
                Checkout
              </h1>
              <p className="text-gray-500">Complete your purchase securely.</p>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
              {/* Shipping Address */}
              <div className="border-b border-gray-100 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-slate-600" /> Shipping Address
                  </h2>
                  {isGpsLocked ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50/50 text-emerald-700 border border-emerald-100/70">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        GPS Locked
                      </span>
                      <button
                        type="button"
                        onClick={handleResetGpsLock}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/30 text-xs font-semibold transition"
                      >
                        <ArrowPathIcon className="h-3.5 w-3.5" />
                        Reset
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition active:scale-98"
                    >
                      <MapPinIcon className="h-3.5 w-3.5 text-slate-500" />
                      Use Current Location
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-y-5 sm:grid-cols-2 sm:gap-x-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Pincode
                    </label>
                    <div className="relative w-full sm:w-1/2">
                      <input
                        type="text"
                        value={address.pincode}
                        onChange={async (e) => {
                          if (isGpsLocked) return;
                          const val = e.target.value;
                          const cleanPincode = val.replace(/\D/g, "").slice(0, 6);
                          setAddress((prev) => ({ ...prev, pincode: cleanPincode }));

                          if (cleanPincode.length === 6) {
                            try {
                              const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPincode}`);
                              if (res.ok) {
                                const data = await res.json();
                                if (data && data[0] && data[0].Status === "Success") {
                                  const postOffice = data[0].PostOffice[0];
                                  const fetchedState = postOffice.State;
                                  const fetchedCity = postOffice.District || postOffice.Block || postOffice.Name;
                                  setAddress((prev) => ({
                                    ...prev,
                                    state: fetchedState || prev.state,
                                    city: fetchedCity || prev.city,
                                  }));
                                  toast.success(`Pincode resolved to ${fetchedCity}, ${fetchedState}`);
                                }
                              }
                            } catch (err) {
                              console.error("Failed to fetch state/city from pincode", err);
                            }
                          }
                        }}
                        readOnly={isGpsLocked}
                        placeholder="Enter 6-digit Pincode"
                        className={`block w-full rounded-xl border px-4 py-2.5 shadow-sm sm:text-sm transition focus:outline-none pr-10 ${
                          isGpsLocked
                            ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed select-none"
                            : "bg-white border-slate-200 focus:border-black focus:ring-1 focus:ring-black"
                        }`}
                      />
                      {isGpsLocked && (
                        <LockClosedIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2 relative">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Street Address
                    </label>

                    <input
                      type="text"
                      value={address.house}
                      onChange={(e) => {
                        if (isGpsLocked) {
                          setAddress((prev) => ({ ...prev, house: e.target.value }));
                        } else {
                          setAddress({
                            ...address,
                            house: e.target.value,
                            lat: null,
                            lng: null,
                          });
                          setQuery(e.target.value);
                        }
                      }}
                      className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 shadow-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black sm:text-sm transition bg-white"
                      placeholder="e.g. Flat 402, Skyline Apartments"
                    />

                    {suggestions.length > 0 && !isGpsLocked && (
                      <ul className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto">
                        {suggestions.map((s, i) => (
                          <li
                            key={i}
                            className="px-4 py-3 text-sm hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                            onClick={() =>
                                handleManualSelect(
                                  parseFloat(s.lat),
                                  parseFloat(s.lon),
                                  s.display_name,
                                )
                            }
                          >
                            {s.display_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      City
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={address.city}
                        readOnly={true}
                        placeholder="Auto-filled from Pincode"
                        className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 shadow-sm bg-slate-50 text-slate-400 cursor-not-allowed select-none sm:text-sm transition pr-10"
                      />
                      <LockClosedIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      State
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={address.state}
                        readOnly={true}
                        placeholder="Auto-filled from Pincode"
                        className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 shadow-sm bg-slate-50 text-slate-400 cursor-not-allowed select-none sm:text-sm transition pr-10"
                      />
                      <LockClosedIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    </div>
                  </div>
                </div>

                 {/* Map Block Container Wrapper */}
                 <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100 shadow-md isolation-auto">
                   <div className="flex items-center justify-between gap-3 bg-slate-50/70 px-5 py-4 border-b border-slate-100">
                     <div>
                       <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                         Pick delivery point on map
                       </p>
                       <p className="text-[11px] text-slate-400 mt-0.5">
                         Click anywhere on the map to set your address and shipping.
                       </p>
                     </div>
                   </div>
                   <div className="h-48 sm:h-64 w-full relative z-10 overflow-hidden">
                      <div className="h-full w-full">
                        <MapContainer
                          center={position ?? DEFAULT_MAP_CENTER}
                          zoom={position ? 16 : 5}
                          minZoom={4}
                          maxBounds={INDIA_BOUNDS}
                          maxBoundsViscosity={1.0}
                          className="h-full w-full"
                          scrollWheelZoom={true}
                          dragging={true}
                          doubleClickZoom={true}
                          zoomControl={false}
                          style={{ cursor: "pointer" }}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                            referrerPolicy="strict-origin-when-cross-origin"
                          />
                          <MapRecenter
                            center={position ?? DEFAULT_MAP_CENTER}
                            zoom={position ? 16 : 5}
                          />
                          <MapClickHandler onPick={handleMapPick} />
                          {position && <Marker position={position} icon={customIcon} />}
                          <ZoomControl position="topleft" />
                        </MapContainer>
                      </div>
                   </div>
                  <div className="bg-slate-50/70 px-5 py-2 text-[11px] text-slate-400 font-mono border-t border-slate-100 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    {position
                      ? `Pinned: ${position[0].toFixed(5)}, ${position[1].toFixed(5)}`
                      : "No map point selected yet"}
                  </div>
                </div>
              </div>

              {/* Payment Method Option Frame */}
              <div className="pt-10">
                <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5" /> Payment Method
                </h2>

                <div className={`grid grid-cols-1 gap-4 ${qrConfig.enabled && (qrConfig.upiId || qrConfig.qrCode) ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                  <div
                    onClick={() => setPaymentMethod("Online")}
                    className={`relative cursor-pointer rounded-2xl border p-5 shadow-sm transition-all duration-200 ${
                      paymentMethod === "Online"
                        ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] ring-2 ring-[var(--theme-primary)] ring-offset-2"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm uppercase tracking-wide">
                        Pay Online
                      </span>
                      <CreditCardIcon
                        className={`h-6 w-6 ${
                          paymentMethod === "Online" ? "text-gray-300" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <p className={`text-xs ${paymentMethod === "Online" ? "text-gray-400" : "text-gray-500"}`}>
                      Credit Card, UPI, Netbanking
                    </p>
                    {!shippingToggles.calculateShippingForOnline && (
                      <div className="mt-2.5">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          paymentMethod === "Online" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          Free Shipping
                        </span>
                      </div>
                    )}
                  </div>

                  {qrConfig.enabled && (qrConfig.upiId || qrConfig.qrCode) && (
                    <div
                      onClick={() => setPaymentMethod("QR")}
                      className={`relative cursor-pointer rounded-2xl border p-5 shadow-sm transition-all duration-200 ${
                        paymentMethod === "QR"
                          ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] ring-2 ring-[var(--theme-primary)] ring-offset-2"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm uppercase tracking-wide flex items-center gap-1.5">
                          Direct Payment
                        </span>
                        <QrCode
                          className={`h-6 w-6 ${
                            paymentMethod === "QR" ? "text-gray-300" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <p className={`text-xs ${paymentMethod === "QR" ? "text-gray-400" : "text-gray-500"}`}>
                        Scan QR &amp; Pay via UPI
                      </p>
                      {!shippingToggles.calculateShippingForQR && (
                        <div className="mt-2.5">
                          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            paymentMethod === "QR" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            Free Shipping
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    onClick={() => setPaymentMethod("POD")}
                    className={`relative cursor-pointer rounded-2xl border p-5 shadow-sm transition-all duration-200 ${
                      paymentMethod === "POD"
                        ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] ring-2 ring-[var(--theme-primary)] ring-offset-2"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm uppercase tracking-wide">
                        Cash on Delivery
                      </span>
                      <BanknotesIcon
                        className={`h-6 w-6 ${
                          paymentMethod === "POD" ? "text-gray-300" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <p className={`text-xs ${paymentMethod === "POD" ? "text-gray-400" : "text-gray-500"}`}>
                      Pay cash upon delivery
                    </p>
                    {!shippingToggles.calculateShippingForCOD && (
                      <div className="mt-2.5">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          paymentMethod === "POD" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          Free Shipping
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button (Desktop/Tablet layout contexts only) */}
              <div className="mt-10 hidden pt-6 md:block">
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={loading || checkoutItems.length === 0}
                  className="w-full rounded-full bg-[var(--theme-primary)] px-6 py-4 text-sm font-bold uppercase tracking-widest text-[var(--theme-primary-ink)] shadow-lg hover:bg-[var(--theme-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                >
                  {loading
                    ? "Processing..."
                    : checkoutItems.length === 0
                      ? "Cart is Empty"
                      : paymentMethod === "POD"
                        ? `Place Order — ₹${totalAmount}`
                        : paymentMethod === "QR"
                          ? `Direct Payment — ₹${totalAmount}`
                          : `Pay Now — ₹${totalAmount}`}
                </button>
              </div>
            </form>
          </div>

          {/* ================= RIGHT SIDE: SUMMARY (Desktop View Only) ================= */}
          <div className="hidden md:block md:col-span-5">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:sticky md:top-24">
              <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900 mb-6 flex items-center gap-2">
                <Package className="h-5 w-5" /> Order Summary
              </h2>

              {checkoutItems.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 mb-6">
                  <p className="font-semibold text-gray-600">Your cart is empty</p>
                  <button
                    type="button"
                    onClick={() => navigate("/products")}
                    className="mt-2 text-xs font-bold uppercase tracking-wider text-[var(--theme-primary)] hover:underline cursor-pointer"
                  >
                    Start Shopping →
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {checkoutItems.map((item) => (
                    <li key={item._id} className="flex py-4">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <div className="ml-4 flex flex-1 flex-col justify-center">
                        <div className="flex justify-between text-sm font-medium text-gray-900">
                          <h3 className="line-clamp-1">{item.name}</h3>
                          <p className="ml-4 font-bold">
                            ₹{item.price * item.quantity}
                          </p>
                        </div>
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <p
                            className="mt-0.5 text-xs text-gray-500 font-medium line-clamp-2 break-words leading-relaxed cursor-help"
                            title={Object.entries(item.selectedOptions)
                              .map(([axis, value]) => `${axis}: ${value}`)
                              .join(" · ")}
                          >
                            {Object.entries(item.selectedOptions)
                              .map(([axis, value]) => `${axis}: ${value}`)
                              .join(" · ")}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Qty {item.quantity}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-3 pt-6 border-t border-gray-100 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{checkoutSubtotal}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span className="flex items-center gap-1">
                    Shipping <TruckIcon className="h-3 w-3" />
                  </span>
                  <span className="font-medium text-gray-900">
                    {!isGpsLocked && !address.state.trim() && !address.pincode.trim() ? (
                      <span className="text-gray-400 italic">Enter address to calculate</span>
                    ) : effectiveShippingCharge === 0 ? (
                      <span className="text-green-600 font-medium flex items-center gap-1.5">
                        <span>Free</span>
                        {isShippingDisabledForPayment && (
                          <span className="text-[10px] bg-green-100 text-green-800 font-semibold px-1.5 py-0.5 rounded-full">
                            Free for {paymentMethod === "POD" ? "COD" : paymentMethod === "QR" ? "Direct Payment" : "Online"}
                          </span>
                        )}
                      </span>
                    ) : (
                      `₹${effectiveShippingCharge}`
                    )}
                  </span>
                </div>

                {/* Coupon Module Wrapper */}
                <div className="pt-2">
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) =>
                            setCouponCode(e.target.value.toUpperCase())
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
                          placeholder="Coupon code"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-black transition"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2 rounded-xl bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] text-xs font-bold uppercase tracking-wider disabled:opacity-50 hover:bg-[var(--theme-primary-hover)] transition"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <TagIcon className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs font-bold text-green-700">
                            {appliedCoupon.code}
                          </p>
                          <p className="text-xs text-green-600">
                            {appliedCoupon.discountType === "PERCENTAGE"
                              ? `${appliedCoupon.discountValue}% off`
                              : `₹${appliedCoupon.discountValue} off`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">−₹{discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-gray-100 pt-4">
                  <span className="text-base font-bold text-gray-900">
                    Total
                  </span>
                  <span className="text-xl font-bold text-[var(--theme-primary)]">
                    ₹{totalAmount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= INLINE BOTTOM CONTAINER (For Mobile Viewports Only) ================= */}
        {/* Removed 'fixed bottom-0' so it stacks cleanly under the form fields and map naturally */}
        <div
          className={`mt-8 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm md:hidden transition-all duration-300 ${
            isRazorpayOpen ? "blur-md pointer-events-none" : ""
          }`}
        >
          {/* Coupon Input — Mobile (Always Visible) */}
          <div className="mb-4 pt-1">
            {!appliedCoupon ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    placeholder="Coupon code"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-black transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] text-xs font-bold uppercase tracking-wider disabled:opacity-50 hover:bg-[var(--theme-primary-hover)] transition"
                >
                  {couponLoading ? "..." : "Apply"}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs font-bold text-green-700">
                      {appliedCoupon.code}
                    </p>
                    <p className="text-xs text-green-600">
                      {appliedCoupon.discountType === "PERCENTAGE"
                        ? `${appliedCoupon.discountValue}% off`
                        : `₹${appliedCoupon.discountValue} off`}
                    </p>
                  </div>
                </div>
                <button onClick={handleRemoveCoupon} className="text-gray-400 hover:text-red-500 transition">
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {discountAmount > 0 && (
            <div className="mb-2 flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span className="font-medium">−₹{discountAmount}</span>
            </div>
          )}

          <div className="mb-4 flex items-center justify-between text-base font-bold text-gray-900">
            <span>Total</span>
            <span className="text-xl text-[var(--theme-primary)]">₹{totalAmount}</span>
          </div>
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={loading || checkoutItems.length === 0}
            className="w-full rounded-full bg-[var(--theme-primary)] px-4 py-4 text-sm font-bold uppercase tracking-widest text-[var(--theme-primary-ink)] shadow-md hover:bg-[var(--theme-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading
              ? "Processing..."
              : checkoutItems.length === 0
                ? "Cart is Empty"
                : paymentMethod === "POD"
                  ? "Place Order"
                  : paymentMethod === "QR"
                    ? "Direct Payment"
                    : "Pay Now"}
          </button>

          <Popover className="mt-4 flex justify-center relative">
            {({ open }) => (
              <Fragment>
                <Popover.Button className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide outline-none">
                  {open ? "Hide Details" : "View Details"}
                  <ChevronUpIcon
                    className={`h-3 w-3 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </Popover.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-10"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-10"
                >
                  <Popover.Panel className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[calc(100vw-2rem)] sm:w-full max-w-md bg-white border border-gray-200 px-6 py-6 shadow-2xl max-h-[60vh] overflow-y-auto rounded-3xl z-50">
                    <h3 className="text-sm font-bold uppercase text-gray-900 mb-4">
                      Order Summary
                    </h3>
                    <ul className="divide-y divide-gray-100 mb-4">
                      {checkoutItems.map((item) => (
                        <li key={item._id} className="flex py-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-12 w-12 rounded-lg object-cover bg-gray-50 flex-shrink-0"
                          />
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {item.name}
                            </p>
                            {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                              <p
                                className="text-xs text-gray-500 font-medium line-clamp-2 break-words leading-relaxed cursor-help"
                                title={Object.entries(item.selectedOptions)
                                  .map(([axis, value]) => `${axis}: ${value}`)
                                  .join(" · ")}
                              >
                                {Object.entries(item.selectedOptions)
                                  .map(([axis, value]) => `${axis}: ${value}`)
                                  .join(" · ")}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-gray-900 ml-2">
                            ₹{item.price * item.quantity}
                          </p>
                        </li>
                      ))}
                    </ul>

                    <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span>
                        <span>₹{checkoutSubtotal}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span className="flex items-center gap-1">
                          Shipping <TruckIcon className="h-3 w-3" />
                        </span>
                        <span>
                          {!isGpsLocked && !address.state.trim() && !address.pincode.trim() ? (
                            <span className="text-gray-400 italic">Enter address to calculate</span>
                          ) : effectiveShippingCharge === 0 ? (
                            <span className="text-green-600 font-medium flex items-center gap-1.5">
                              <span>Free</span>
                              {isShippingDisabledForPayment && (
                                <span className="text-[10px] bg-green-100 text-green-800 font-semibold px-1.5 py-0.5 rounded-full">
                                  Free for {paymentMethod === "POD" ? "COD" : paymentMethod === "QR" ? "Direct Payment" : "Online"}
                                </span>
                              )}
                            </span>
                          ) : (
                            `₹${effectiveShippingCharge}`
                          )}
                        </span>
                      </div>

                      {discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span className="font-medium">−₹{discountAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-gray-100 pt-3">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="text-base font-bold text-[var(--theme-primary)]">
                          ₹{totalAmount}
                        </span>
                      </div>
                    </div>
                  </Popover.Panel>
                </Transition>
              </Fragment>
            )}
          </Popover>
        </div>

      </div>

      {/* ================= PAY WITH QR MODAL ================= */}
      {createPortal(
        <AnimatePresence>
          {showQrModal && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!qrSubmitting) {
                    setShowQrModal(false);
                    setQrModalStep("SCAN");
                  }
                }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />

              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 15 }}
                className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl z-10 max-h-[92vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    {qrModalStep === "SUBMIT" ? (
                      <button
                        type="button"
                        onClick={() => setQrModalStep("SCAN")}
                        className="p-1.5 -ml-1 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
                        title="Back to QR scanner"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    ) : (
                      <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                        <QrCode className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-black text-gray-900 tracking-tight">
                        {qrModalStep === "SCAN" ? "Direct Payment" : "Verify Payment (Optional)"}
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium">
                        {qrModalStep === "SCAN"
                          ? "Step 1: Pay with UPI app or scan QR"
                          : "Step 2: Enter transaction proof (Optional)"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={qrSubmitting}
                    onClick={() => {
                      setShowQrModal(false);
                      setQrModalStep("SCAN");
                    }}
                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Amount Pill */}
                <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100/80 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Total Payable Amount</p>
                    <p className="text-2xl font-black text-gray-900 mt-0.5">₹{totalAmount}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-purple-700 text-xs font-bold border border-purple-200/60 shadow-xs">
                    UPI Accepted
                  </span>
                </div>

                {/* STEP 1: SCANNER IN THE CENTER */}
                {qrModalStep === "SCAN" && (
                  <div className="mt-4 flex flex-col items-center">
                    {/* Select UPI App to Pay (Google Pay, PhonePe, Paytm) */}
                    {upiIntentUri && (
                      <div className="w-full mb-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3 sm:p-3.5">
                        <div className="flex items-center justify-between mb-2.5 px-0.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                            Select UPI App
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                            Fast Pay
                          </span>
                        </div>

                        {/* 3 App Selection Cards */}
                        <div className="grid grid-cols-3 gap-2 w-full">
                          {upiApps.map((app) => {
                            const isSelected = selectedUpiApp === app.id;
                            return (
                              <button
                                key={app.id}
                                type="button"
                                onClick={() => {
                                  if (selectedUpiApp === app.id) {
                                    const isMobile =
                                      typeof navigator !== "undefined" &&
                                      /android|iphone|ipad|ipod/i.test(navigator.userAgent);
                                    if (isMobile) {
                                      window.location.href = getUpiDeepLink(app.id);
                                    } else {
                                      toast(
                                        `To pay with ${app.name}, scan the QR code below on your phone!`,
                                        { icon: "📱", id: "desktop-qr-hint" }
                                      );
                                    }
                                  } else {
                                    setSelectedUpiApp(app.id);
                                  }
                                }}
                                className={`group relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                                  isSelected
                                    ? `${app.activeBorder} shadow-xs font-bold`
                                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-700 shadow-2xs"
                                }`}
                              >
                                {/* Active checkmark / Radio */}
                                <div className="absolute top-1.5 right-1.5">
                                  {isSelected ? (
                                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-900 text-white text-[9px] font-black">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="block h-3.5 w-3.5 rounded-full border border-slate-300 group-hover:border-slate-400" />
                                  )}
                                </div>

                                <div className="h-7.5 mb-1.5 mt-0.5 flex items-center justify-center">
                                  {app.icon}
                                </div>

                                <span className="text-[11px] font-bold tracking-tight text-center truncate max-w-full">
                                  {app.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Dynamic Action Button for Selected App */}
                        <a
                          href={getUpiDeepLink(selectedUpiApp)}
                          onClick={(e) =>
                            handleUpiAppClick(
                              e,
                              currentUpiApp.name,
                              getUpiDeepLink(selectedUpiApp)
                            )
                          }
                          className={`w-full mt-2.5 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer ${currentUpiApp.buttonBg}`}
                        >
                          <span>Pay ₹{totalAmount} with {currentUpiApp.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-0.5 shrink-0" />
                        </a>

                        {/* Other UPI apps */}
                        <div className="mt-2 text-center">
                          <a
                            href={getUpiDeepLink("other")}
                            onClick={(e) =>
                              handleUpiAppClick(e, "Any UPI App", getUpiDeepLink("other"))
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-purple-700 transition-colors cursor-pointer"
                          >
                            <span>Other UPI app (Cred, BHIM, etc.)</span>
                            <span className="text-xs">→</span>
                          </a>
                        </div>

                        <div className="relative flex py-2 items-center mt-1">
                          <div className="flex-grow border-t border-slate-200"></div>
                          <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">
                            or scan QR with another phone
                          </span>
                          <div className="flex-grow border-t border-slate-200"></div>
                        </div>
                      </div>
                    )}

                    {/* Centered QR Frame with decorative scanner corner accents */}
                    <div className="relative p-2.5 bg-white rounded-2xl border border-purple-100 shadow-sm my-1">
                      <span className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-purple-600 rounded-tl-md pointer-events-none" />
                      <span className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-purple-600 rounded-tr-md pointer-events-none" />
                      <span className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-purple-600 rounded-bl-md pointer-events-none" />
                      <span className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-purple-600 rounded-br-md pointer-events-none" />

                      <img
                        src={dynamicQrUrl || qrConfig.qrCode}
                        alt="Payment QR Code"
                        className="w-52 h-52 object-contain rounded-xl"
                      />
                    </div>

                    {/* Pre-filled amount pill */}
                    {dynamicQrUrl && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 shadow-2xs">
                        {/* <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> */}
                        Exact amount ₹{totalAmount} pre-filled in QR &amp; App
                      </div>
                    )}

                    {qrConfig.accountName && (
                      <p className="mt-2 text-xs font-bold text-gray-800">
                        Payee: <span className="text-purple-700">{qrConfig.accountName}</span>
                      </p>
                    )}

                    {qrConfig.upiId && (
                      <div className="mt-2 flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                        <span className="text-xs font-mono font-semibold text-gray-700">{qrConfig.upiId}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(qrConfig.upiId!);
                            toast.success("UPI ID copied!");
                          }}
                          className="text-purple-600 hover:text-purple-800 transition-colors p-0.5 cursor-pointer"
                          title="Copy UPI ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <p className="mt-2 text-[11px] text-gray-500 text-center max-w-xs">
                      {dynamicQrUrl
                        ? `Select an app above to pay directly on mobile, or scan the QR code — ₹${totalAmount} is pre-filled.`
                        : qrConfig.instructions || "Pay via Google Pay, PhonePe, Paytm or scan to complete payment."}
                    </p>

                    {/* Button to advance to Step 2 */}
                    <button
                      type="button"
                      onClick={() => setQrModalStep("SUBMIT")}
                      className="mt-5 w-full py-3.5 px-5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span>I Have Completed Payment</span>
                      <span>→</span>
                    </button>
                  </div>
                )}

                {/* STEP 2: ENTER TRANSACTION ID OR UPLOAD SCREENSHOT */}
                {qrModalStep === "SUBMIT" && (() => {
                  const txStatus = validateTransactionId(qrTransactionId);
                  const isTxIdProvided = qrTransactionId.trim().length > 0;
                  const canSubmitQr = !isTxIdProvided || txStatus.isValid;

                  return (
                    <div className="mt-4 space-y-4">
                      <p className="text-xs text-gray-500 font-medium">
                        Enter your UPI Transaction ID (UTR) or attach the payment screenshot <span className="text-purple-600 font-semibold">(optional)</span>:
                      </p>

                      {/* Transaction ID input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center justify-between">
                          <span>Transaction ID / UTR Number</span>
                          <span className="text-[10px] text-gray-400 font-semibold normal-case">Optional</span>
                        </label>

                        <div className="relative">
                          <input
                            type="text"
                            autoFocus
                            maxLength={12}
                            value={qrTransactionId}
                            onChange={(e) => setQrTransactionId(e.target.value.slice(0, 12))}
                            placeholder="e.g. 12-digit UTR (4239XXXXXXXX) — Optional"
                            className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-xs font-mono outline-none transition-all ${
                              !isTxIdProvided
                                ? "border-gray-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10"
                                : txStatus.isValid
                                ? "border-emerald-500 bg-emerald-50/20 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 text-emerald-950"
                                : "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 text-red-950"
                            }`}
                          />
                          {isTxIdProvided && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              {txStatus.isValid ? (
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Helper or validation message */}
                        {isTxIdProvided ? (
                          <p
                            className={`text-[11px] font-medium flex items-center gap-1 ${
                              txStatus.isValid ? "text-emerald-600" : "text-red-500"
                            }`}
                          >
                            {txStatus.isValid ? "✓ " : "⚠ "}
                            {txStatus.message}
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-400">
                            Optional. Standard UPI UTR is 12 digits (found on GPay, PhonePe, Paytm, or bank receipt).
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-px bg-gray-200 flex-1" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">OR / AND</span>
                        <div className="h-px bg-gray-200 flex-1" />
                      </div>

                      {/* Screenshot upload */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center justify-between">
                          <span>Payment Screenshot</span>
                          <span className="text-[10px] text-gray-400 font-semibold normal-case">Optional</span>
                        </label>
                        {qrScreenshotPreview ? (
                          <div className="relative rounded-2xl border border-gray-200 bg-gray-50 p-3 flex items-center gap-3">
                            <img
                              src={qrScreenshotPreview}
                              alt="Screenshot preview"
                              className="w-14 h-14 object-cover rounded-xl border border-gray-200 bg-white shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate">
                                {qrScreenshotFile?.name || "Screenshot"}
                              </p>
                              <p className="text-[10px] text-green-600 font-semibold mt-0.5">
                                ✓ Ready to upload
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setQrScreenshotFile(null);
                                setQrScreenshotPreview(null);
                              }}
                              className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors"
                              title="Remove screenshot"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-purple-400 hover:bg-purple-50/20 transition-all">
                            <UploadCloud className="w-7 h-7 text-purple-400 mb-1" />
                            <span className="text-xs font-bold text-gray-700">Upload payment screenshot</span>
                            <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG or WebP (Max 5MB)</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (!file.type.startsWith("image/")) {
                                  toast.error("Please upload an image file");
                                  return;
                                }
                                setQrScreenshotFile(file);
                                setQrScreenshotPreview(URL.createObjectURL(file));
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setQrModalStep("SCAN")}
                          className="py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          disabled={qrSubmitting || !canSubmitQr}
                          onClick={handleConfirmQrPayment}
                          className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {qrSubmitting ? (
                            <>Submitting Order…</>
                          ) : (
                            <>Confirm &amp; Place Order</>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ================= SUCCESS MODAL ================= */}
      {createPortal(
        <AnimatePresence>
          {showSuccessModal && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />

              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl z-10"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-500">
                  <CheckCircle className="h-10 w-10" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Order Confirmed!
                </h2>
                <p className="text-gray-500 mb-8">
                  We've received your order and will begin processing it right away.
                </p>

                <button
                  onClick={() => navigate("/myorders", { replace: true })}
                  className="w-full rounded-full bg-[var(--theme-primary)] px-6 py-4 text-sm font-bold uppercase tracking-widest text-[var(--theme-primary-ink)] hover:bg-[var(--theme-primary-hover)] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                >
                  Track Order
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Purchase Cancellation / Exit Intent Feedback Modal */}
      <CancellationFeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => {
          setFeedbackModalOpen(false);
          if (
            feedbackTriggerSource === "CHECKOUT_EXIT" ||
            feedbackTriggerSource === "COD_CHECKOUT_EXIT"
          ) {
            navigate("/cart", { replace: true });
          }
        }}
        customerName={userProfile?.username || (address.house ? address.house : "")}
        customerEmail={userProfile?.email || ""}
        customerPhone={userProfile?.phone || ""}
        paymentMethod={paymentMethod.toUpperCase()}
        triggerSource={feedbackTriggerSource}
        orderId={feedbackOrderId}
        items={checkoutItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          variant: item.selectedOptions && Object.keys(item.selectedOptions).length > 0
            ? Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(" / ")
            : undefined,
        }))}
        totalAmount={checkoutSubtotal + shippingCharge}
        onSubmitted={() => {
          if (
            feedbackTriggerSource === "CHECKOUT_EXIT" ||
            feedbackTriggerSource === "COD_CHECKOUT_EXIT"
          ) {
            navigate("/cart", { replace: true });
          }
        }}
      />
    </div>
  );
};

export default CheckoutPage;











