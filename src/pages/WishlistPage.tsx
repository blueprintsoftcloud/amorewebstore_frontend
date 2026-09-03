import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Trash2, ShoppingBag, X, ArrowLeft } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import toast, { Toaster } from "react-hot-toast";
import FooterSection from "../components/FooterSection";
import { domainUrl } from "../utils/constant";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

const BACKEND_BASE_URL = domainUrl.replace(/\/api\/?$/, "");

interface WishlistProduct {
  id?: string;
  _id?: string;
  name?: string;
  brand?: string;
  price?: number;
  image?: string;
  variantId?: string | null;
  variantOptions?: Record<string, string> | null;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

interface WishlistProductCardProps {
  product: WishlistProduct;
  cardVariants: Variants;
}

// --- CUSTOM MODAL COMPONENT ---
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmationModalProps) => {
  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 pointer-events-auto border border-gray-100">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Clear Wishlist?
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to remove all items from your wishlist?
                  This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all transform hover:scale-105"
                  >
                    Yes, Clear All
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Component: WishlistProductCard ---
const WishlistProductCard = ({
  product,
  cardVariants,
}: WishlistProductCardProps) => {
  const { toggleWishlist } = useWishlist();
  const productId = product?.id ?? product?._id;

  if (!product || !productId) return null;
  const name = product?.name || "Product Name Missing";
  const formattedPrice =
    product?.price != null
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(product.price)
      : "N/A";

  const imageUrl = product?.image
    ? product.image.startsWith("http")
      ? product.image
      : `${BACKEND_BASE_URL}/${product.image}`
    : "https://placehold.co/300x400/F3F4F6/9CA3AF?text=No+Image";

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const success = await toggleWishlist(productId, product.variantId);
    if (success) {
      toast.success(`${name} removed`, { id: "item removed" });
    } else {
      toast.error("Could not remove item", { id: "could not item removed" });
    }
  };

  return (
    <motion.div variants={cardVariants} className="group cursor-pointer">
      <Link
        to={product.variantId ? `/products/${productId}?variantId=${product.variantId}` : `/products/${productId}`}
        className="block"
      >
        {/* Image Container */}
        <div className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100 shadow-sm transition-all duration-500 group-hover:shadow-xl">
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 z-10" />

          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover object-center transform transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-110"
          />

          {/* Floating Remove Button */}
          <div className="absolute top-3 right-3 z-20 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={handleRemove}
              className="bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:bg-red-50 transition-colors group/btn"
              title="Remove from Wishlist"
            >
              <Trash2 className="w-4 h-4 text-gray-900 group-hover/btn:text-red-600" />
            </button>
          </div>
        </div>

        {/* Text Container */}
        <div className="mt-5 text-center relative px-2">
          {product.brand && (
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1 select-none">
              {product.brand}
            </p>
          )}
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest line-clamp-1">
            {name}
          </h3>
          {product.variantOptions && Object.keys(product.variantOptions).length > 0 && (
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium tracking-wide">
              {Object.entries(product.variantOptions)
                .map(([axis, value]) => `${axis}: ${value}`)
                .join(" · ")}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1 font-medium tracking-wide">
            {formattedPrice}
          </p>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-px bg-gray-400 transition-all duration-300 group-hover:w-1/2"></span>
        </div>
      </Link>
    </motion.div>
  );
};

// --- Main WishlistPage Component ---
const WishlistPage = () => {
  const navigate = useNavigate();
  const {
    wishlistItems,
    fetchWishlist,
    loading,
    wishlistCount,
    clearWishlist,
  } = useWishlist();

  const [isClearModalOpen, setClearModalOpen] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleClearConfirm = async () => {
    const success = await clearWishlist();
    setClearModalOpen(false);
    if (success) {
      (toast.success("Wishlist cleared successfully"),
        { id: "wishlist cleared " });
    } else {
      (toast.error("Failed to clear wishlist"), { id: "failed wishlist" });
    }
  };

  // --- Animation Variants ---
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const cardVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  // --- Loading Skeleton ---
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="w-full aspect-[3/4] bg-gray-200 rounded-xl mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      ))}
    </div>
  );

  return (
  <section className="bg-white min-h-screen pt-(--app-header-h) pb-24 relative overflow-hidden">
    {/* Toast Configuration */}

    {/* Custom Confirmation Modal */}
    <ConfirmationModal
      isOpen={isClearModalOpen}
      onClose={() => setClearModalOpen(false)}
      onConfirm={handleClearConfirm}
    />

    {/* Background Decor */}
    <div
      className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full blur-3xl opacity-50 pointer-events-none"
      style={{ background: "color-mix(in srgb, var(--theme-accent) 35%, transparent)" }}
    ></div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-10">

      {/* Conditionally render header block only when data is loaded and items exist */}
      {!loading && wishlistCount > 0 && (
        <>
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5 transform transition-transform group-hover:-translate-x-1" />
            <span>Go Back</span>
          </button>

          {/* Header Section */}
          <div className="text-center mb-16 relative">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold tracking-tighter text-gray-900 sm:text-5xl"
              style={{ fontFamily: "var(--theme-font-heading)" }}
            >
              My Wishlist
            </motion.h2>

            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "80px" }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="h-1 mx-auto mt-4 mb-6"
              style={{ background: "var(--theme-primary)" }}
            />

            {/* Clear All Action (Redundant inner check removed) */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => setClearModalOpen(true)}
              className="group flex items-center justify-center gap-2 mx-auto text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors"
            >
              <span>Clear All Items</span>
              <Trash2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
            </motion.button>
          </div>
        </>
      )}

      {/* Remaining Content Area (loading state / grid / empty state) continues here... */}

        {/* Content Area */}
        {loading ? (
          <LoadingSkeleton />
        ) : wishlistCount === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-widest mb-2">
              Your Wishlist is Empty
            </h3>
            <p className="text-gray-500 font-light mb-8">
              Start exploring our collections to add items.
            </p>
            <Link
              to="/products"
              className="inline-block border-b border-gray-900 text-gray-900 pb-1 text-sm uppercase tracking-widest hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)] transition-colors"
            >
              Continue Shopping
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12"
          >
            {wishlistItems.map((product) => (
              <WishlistProductCard
                key={`${product.id ?? product._id ?? product.image ?? product.name ?? "wishlist-item"}-${product.variantId ?? ""}`}
                product={product}
                cardVariants={cardVariants}
              />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default WishlistPage;
