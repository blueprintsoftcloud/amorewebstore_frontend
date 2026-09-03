// import React, { useEffect, useState, useCallback } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
// import { 
//   MinusIcon, 
//   PlusIcon, 
//   ArrowLeftIcon, 
//   ShieldCheckIcon, 
//   TruckIcon,
//   StarIcon,
//   ChevronLeftIcon,
//   ChevronRightIcon,
//   MapPinIcon,
// } from "@heroicons/react/24/outline";
// import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
// import { 
//   Heart, 
//   ShoppingBag, 
//   Check, 
//   ArrowRight,
//   Share2
// } from "lucide-react"; // Using Lucide to match AllProducts
// import { BeatLoader } from "react-spinners";
// import toast, { Toaster } from 'react-hot-toast';
// import { motion, AnimatePresence } from "framer-motion";
// import FooterSection from "../components/FooterSection";
// import DeliveryLocationModal from "./DeliveryLocationModal";

// // Components & Context
// import Navbar from "../components/Navbar"; 
// import api from "../utils/api";
// import { useCart } from "../context/CartContext";
// import { useWishlist } from "../context/WishlistContext";
// import { useAuth } from "../context/AuthContext";
// import { domainUrl } from "../utils/constant";
// import { normalizeProduct } from "../utils/product";



// interface DetailProduct {
//   id: string;
//   name: string;
//   brand?: string;
//   price: number;
//   image?: string;
//   images?: string[];
//   stock?: number;
//   description?: string;
//   category?: { name?: string } | string;
//   discount?: number;
//   sizes?: string[];
//   rating?: number;
//   numReviews?: number;
// }

// interface RelatedProduct {
//   id: string;
//   name: string;
//   price: number;
//   image?: string;
//   stock?: number;
//   category?: { name?: string } | string;
//   discount?: number;
// }

// interface ReviewUser {
//   id: string;
//   username: string;
//   avatar?: string;
// }

// interface Review {
//   id: string;
//   rating: number;
//   comment?: string;
//   createdAt: string;
//   user: ReviewUser;
// }

// interface ReviewDistribution {
//   star: number;
//   count: number;
// }

// // ── Star Rating Display ───────────────────────────────────────────────────────
// function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
//   const sz = size === "lg" ? "h-6 w-6" : "h-4 w-4";
//   return (
//     <div className="flex items-center gap-0.5">
//       {[1, 2, 3, 4, 5].map((star) => (
//         star <= Math.round(rating)
//           ? <StarSolid key={star} className={`${sz} text-amber-500`} />
//           : <StarIcon key={star} className={`${sz} text-neutral-200`} />
//       ))}
//     </div>
//   );
// }

// // ── Interactive Star Picker ───────────────────────────────────────────────────
// function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
//   const [hovered, setHovered] = useState(0);
//   return (
//     <div className="flex items-center gap-1">
//       {[1, 2, 3, 4, 5].map((star) => (
//         <button
//           key={star}
//           type="button"
//           onMouseEnter={() => setHovered(star)}
//           onMouseLeave={() => setHovered(0)}
//           onClick={() => onChange(value === star ? star - 1 : star)}
//           className="transition-all hover:scale-110 active:scale-95 text-neutral-300 hover:text-amber-500"
//         >
//           {(hovered || value) >= star
//             ? <StarSolid className="h-7 w-7 text-amber-500" />
//             : <StarIcon className="h-7 w-7 text-neutral-300" />}
//         </button>
//       ))}
//     </div>
//   );
// }

// // ── Review Section (Updated UI to match reference image) ─────────────────────
// function ReviewSection({
//   productId,
//   isAuthenticated,
//   onReviewChange,
// }: {
//   productId: string;
//   isAuthenticated: boolean;
//   onReviewChange?: () => Promise<unknown> | void;
// }) {
//   const [reviews, setReviews] = useState<Review[]>([]);
//   const [avg, setAvg] = useState(0);
//   const [distribution, setDistribution] = useState<ReviewDistribution[]>([]);
//   const [myReview, setMyReview] = useState<Review | null>(null);
//   const [canReview, setCanReview] = useState(false);
//   const [featureEnabled, setFeatureEnabled] = useState(true);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [showForm, setShowForm] = useState(false);
//   const [rating, setRating] = useState(5);
//   const [comment, setComment] = useState("");
//   const [editMode, setEditMode] = useState(false);

//   useEffect(() => {
//     const handleOpenForm = () => {
//       if (isAuthenticated && !myReview) {
//         setEditMode(false);
//         setShowForm(true);
//       } else if (!isAuthenticated) {
//         window.dispatchEvent(new CustomEvent("openCustomerAuth"));
//       }
//     };
//     window.addEventListener("open-review-form", handleOpenForm);
//     return () => window.removeEventListener("open-review-form", handleOpenForm);
//   }, [isAuthenticated, myReview]);

//   const loadReviews = useCallback(async () => {
//     try {
//       const res = await api.get(`/reviews/${productId}`);
//       setReviews(res.data.reviews);
//       setAvg(res.data.avg);
//       setDistribution(res.data.distribution);
//       setFeatureEnabled(true);
//     } catch (err: unknown) {
//       if ((err as { response?: { status?: number } }).response?.status === 403) {
//         setFeatureEnabled(false);
//       }
//     }
//   }, [productId]);

//   const loadMyReview = useCallback(async () => {
//     if (!isAuthenticated) return;
//     try {
//       const res = await api.get(`/reviews/my/${productId}`);
//       setMyReview(res.data.review || null);
//       setCanReview(res.data.canReview);
//       if (res.data.review) {
//         setRating(res.data.review.rating);
//         setComment(res.data.review.comment || "");
//       }
//     } catch {
//       // ignore
//     }
//   }, [productId, isAuthenticated]);

//   useEffect(() => {
//     setLoading(true);
//     Promise.all([loadReviews(), loadMyReview()]).finally(() => setLoading(false));
//   }, [loadReviews, loadMyReview]);

//   if (!featureEnabled) return null;

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setSubmitting(true);
//     try {
//       if (editMode && myReview) {
//         const reviewId = myReview.id || myReview._id;
//         await api.patch(`/reviews/${reviewId}`, { rating, comment });
//         toast.success("Review updated!", { id: "review-update" });
//       } else {
//         await api.post(`/reviews/${productId}`, { rating, comment });
//         toast.success("Review submitted!", { id: "review-submit" });
//       }
//       await Promise.all([loadReviews(), loadMyReview()]);
//       if (onReviewChange) await onReviewChange();
//       setShowForm(false);
//       setEditMode(false);
//     } catch (err: unknown) {
//       const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to submit review";
//       toast.error(msg, { id: "review-error" });
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!myReview) return;
//     try {
//       const reviewId = myReview.id || myReview._id;
//       await api.delete(`/reviews/${reviewId}`);
//       toast.success("Review deleted", { id: "review-delete" });
//       setMyReview(null);
//       setRating(5);
//       setComment("");
//       setShowForm(false);
//       await loadReviews();
//       if (onReviewChange) onReviewChange();
//     } catch {
//       toast.error("Failed to delete review", { id: "review-delete-err" });
//     }
//   };

//   const startEdit = () => {
//     if (!myReview) return;
//     setRating(myReview.rating);
//     setComment(myReview.comment || "");
//     setEditMode(true);
//     setShowForm(true);
//   };

//   const totalReviews = reviews.length;

//   const sortedDistribution = [...distribution].sort((a, b) => b.star - a.star);

//   return (
//     <section id="reviews-section" className="mt-24 border-t border-neutral-100 pt-16 max-w-6xl mx-auto px-4">
//       {/* Title Header Section */}
//       <div className="mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-neutral-100 pb-6">
//         <div>
//           <h2 className="text-xl font-bold tracking-wider text-neutral-900 uppercase font-sans">
//             Customer Reviews
//           </h2>
//         </div>
 
//         {/* Dynamic Action Call */}
//         {isAuthenticated ? (
//           !myReview && !showForm && (
//             <button
//               onClick={() => { setEditMode(false); setShowForm(true); }}
//               className="rounded-full bg-black px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-neutral-800 transition-all duration-300 active:scale-[0.98]"
//             >
//               Write a Review
//             </button>
//           )
//         ) : (
//           <button
//             onClick={() => window.dispatchEvent(new CustomEvent("openCustomerAuth"))}
//             className="rounded-full bg-black px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-neutral-800 transition-all duration-300 active:scale-[0.98]"
//           >
//             Log in to Write a Review
//           </button>
//         )}
//       </div>
 
//       {loading ? (
//         <div className="flex justify-center py-16">
//           <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
//         </div>
//       ) : (
//         <>
//           {/* ── Reference Dashboard Summary ── */}
//           {totalReviews > 0 ? (
//             <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center mb-16 bg-neutral-50/50 p-8 rounded-3xl border border-neutral-100">
//               {/* Left Score Card */}
//               <div className="md:col-span-4 bg-white border border-neutral-200/60 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[220px] shadow-sm">
//                 <span className="text-6xl font-extrabold text-neutral-900 tracking-tighter mb-2">
//                   {avg.toFixed(1)}
//                 </span>
//                 <div className="flex gap-0.5 mb-3">
//                   {[1, 2, 3, 4, 5].map((star) => (
//                     <StarSolid 
//                       key={star} 
//                       className={`h-5 w-5 ${star <= Math.round(avg) ? "text-amber-500" : "text-neutral-200"}`} 
//                     />
//                   ))}
//                 </div>
//                 <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
//                   {totalReviews} Ratings
//                 </p>
//               </div>
 
//               {/* Right Bars Dashboard */}
//               <div className="md:col-span-8 space-y-3.5 px-2 md:px-6">
//                 {sortedDistribution.map(({ star, count }) => {
//                   const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
//                   return (
//                     <div key={star} className="flex items-center gap-4 text-xs font-semibold text-neutral-800">
//                       <span className="w-8 text-neutral-500 font-bold">{star.toFixed(1)} ★</span>
//                       <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
//                         <div
//                           className="h-full rounded-full bg-neutral-900 transition-all duration-500"
//                           style={{ width: `${percentage}%` }}
//                         />
//                       </div>
//                       <span className="w-20 text-neutral-400 text-right font-medium">
//                         {count} {count === 1 ? "review" : "reviews"}
//                       </span>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           ) : (
//             <div className="text-center py-16 bg-neutral-50 rounded-2xl border border-neutral-100 mb-12">
//               <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">No reviews yet. Be the first to share your experience!</p>
//             </div>
//           )}
 
//           {/* Review Form Component Block */}
//           {showForm && (
//             <div className="mx-auto mb-12 max-w-xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
//               <h3 className="mb-6 text-base font-bold uppercase tracking-wider text-neutral-900 font-sans border-b border-neutral-100 pb-3">
//                 {editMode ? "Edit your review" : "Write a Review"}
//               </h3>
//               <form onSubmit={handleSubmit} className="space-y-6">
//                 <div>
//                   <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-3">Overall Rating</label>
//                   <StarPicker value={rating} onChange={setRating} />
//                 </div>
//                 <div>
//                   <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-3">
//                     Comment <span className="text-neutral-400 font-normal lowercase">(optional)</span>
//                   </label>
//                   <textarea
//                     rows={4}
//                     maxLength={1000}
//                     value={comment}
//                     onChange={(e) => setComment(e.target.value)}
//                     placeholder="Share what you loved or how we can improve this product..."
//                     className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950/10 resize-none transition-all duration-200"
//                   />
//                   <p className="mt-1 text-right text-xs text-neutral-400 font-medium">{comment.length}/1000</p>
//                 </div>
//                 <div className="flex gap-4 pt-1">
//                   <button
//                     type="button"
//                     onClick={() => { setShowForm(false); setEditMode(false); }}
//                     className="flex-1 rounded-full border border-neutral-200 py-3 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all duration-200"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={submitting || rating === 0}
//                     className="flex-1 rounded-full bg-black py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
//                   >
//                     {submitting ? <BeatLoader size={6} color="#fff" /> : editMode ? "Update Review" : "Submit Review"}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           )}
 
//           {/* Active Highlighted Personal Review Banner */}
//           {myReview && !showForm && (
//             <div className="mb-12 rounded-2xl border border-neutral-200 bg-neutral-50/50 p-6 relative overflow-hidden shadow-sm">
//               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-neutral-100">
//                 <div className="flex items-center gap-3">
//                   <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center shadow-sm shrink-0">
//                     <span className="text-sm font-bold text-white">
//                       {myReview.user?.username ? myReview.user.username[0].toUpperCase() : "Y"}
//                     </span>
//                   </div>
//                   <div>
//                     <div className="flex items-center gap-2">
//                       <span className="text-sm font-bold text-neutral-900">Your Review</span>
//                       <span className="inline-flex items-center gap-1 rounded-full bg-black px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
//                         Author
//                       </span>
//                     </div>
//                     <div className="mt-0.5">
//                       <StarDisplay rating={myReview.rating} />
//                     </div>
//                   </div>
//                 </div>
 
//                 {/* Modern Segmented Actions */}
//                 <div className="flex items-center gap-2 self-end sm:self-center">
//                   <button
//                     onClick={startEdit}
//                     className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 shadow-sm hover:bg-neutral-50 hover:text-black hover:border-neutral-400 transition-all duration-200 active:scale-95"
//                   >
//                     <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//                     </svg>
//                     Edit
//                   </button>
//                   <button
//                     onClick={handleDelete}
//                     className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-neutral-800 transition-all duration-200 active:scale-95"
//                   >
//                     <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                     </svg>
//                     Delete
//                   </button>
//                 </div>
//               </div>
 
//               {/* Comment Block */}
//               {myReview.comment ? (
//                 <p className="text-sm text-neutral-600 leading-relaxed font-normal whitespace-pre-line pl-0 sm:pl-13">
//                   "{myReview.comment}"
//                 </p>
//               ) : (
//                 <p className="text-xs italic text-neutral-400 pl-0 sm:pl-13">
//                   You left a rating without a written response.
//                 </p>
//               )}
//             </div>
//           )}

//           {/* ── Premium Clean Review Stream List ── */}
//           {reviews.length > 0 && (
//             <div className="space-y-10 mt-6">
//               {reviews.map((r) => (
//                 <div key={r.id || r._id} className="flex flex-col gap-3 pb-8 border-b border-neutral-100 last:border-none">
//                   {/* Row 1: Profile metadata & Rating stars alignment */}
//                   <div className="flex items-start justify-between gap-4">
//                     <div className="flex items-center gap-3">
//                       <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center shrink-0">
//                         {r.user.avatar ? (
//                           <img src={r.user.avatar} alt={r.user.username} className="h-full w-full object-cover" />
//                         ) : (
//                           <span className="text-xs font-bold text-neutral-800 uppercase">
//                             {r.user.username[0]?.toUpperCase()}
//                           </span>
//                         )}
//                       </div>
//                       <div>
//                         <p className="text-sm font-bold text-neutral-900 font-sans">{r.user.username}</p>
//                         <p className="text-xs text-neutral-400 mt-0.5">
//                           {new Date(r.createdAt).toLocaleDateString("en-IN", {
//                             day: "numeric",
//                             month: "short",
//                             year: "numeric",
//                           })}
//                         </p>
//                       </div>
//                     </div>

//                     <div className="shrink-0">
//                       <StarDisplay rating={r.rating} />
//                     </div>
//                   </div>

//                   {/* Row 2: Text Comment Content Body */}
//                   {r.comment && (
//                     <div className="max-w-4xl">
//                       <p className="text-sm text-neutral-600 leading-relaxed font-normal break-words whitespace-pre-line">
//                         {r.comment}
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </>
//       )}
//     </section>
//   );
// }


// // --- HELPERS ---
// const safeRender = (value: unknown, fallback = ""): string => {
//   if (!value) return fallback;
//   if (typeof value === 'object' && value !== null && 'name' in value) return (value as {name: string}).name;
//   if (typeof value === 'object') return JSON.stringify(value);
//   return String(value);
// };

// function classNames(...c: (string | false | undefined | null)[]) {
//   return c.filter(Boolean).join(" ");
// }

// const STATIC_DETAILS = [
//   {
//     name: "Composition & Care",
//     icon: <ShieldCheckIcon className="h-5 w-5 text-gray-400" />,
//     items: [
//       "Premium quality material",
//       "Comfortable",
//       "Durable construction",
//     ],
//   },
//   {
//     name: "Shipping & Returns",
//     icon: <TruckIcon className="h-5 w-5 text-gray-400" />,
//     items: [
//       "Fast delivery  available",
//       "Secure packaging",
//     ],
//   },
// ];

// // --- MODERN CARD COMPONENT (Reused from AllProducts for consistency) ---
// const ModernProductCard = ({ product, addToCart, cartItems }: { product: RelatedProduct; addToCart: (productId: string) => Promise<unknown>; cartItems: { productId: string }[] }) => {
  
//   const navigate = useNavigate();

//   // Check if product is already in cart
//   const isInCart = cartItems.some((item) => String(item.productId) === String(product.id));

//   const imageUrl = product.image || "https://placehold.co/600x800?text=No+Image";

//   const handleCardClick = () => {
//     navigate(`/products/${product.id}`);
//     window.scrollTo(0,0);
//   };

//   const handleAddToCart = async (e: React.MouseEvent) => {
//     e.stopPropagation();
//     if (isInCart) {
//       toast.error("This item is already in your cart", { id: "This item is already in your cartmnmnm" });
//       return;
//     }

//     try {
//       await addToCart(product.id);
//       toast.success(`${product.name} added to cart`, { id: "added-to-cart-related-product" });
//     } catch (err: any) {
//       if (err?.message !== "Not authenticated") {
//         toast.error(err?.response?.data?.message || "Failed to add to cart", {
//           id: "failed-add-related-product",
//         });
//       }
//     }
//   };


//   const { isProductInWishlist, toggleWishlist } = useWishlist();

// const isWishlisted = isProductInWishlist(product.id);


//   const handleToggleWishlist = async (e: React.MouseEvent) => {
//   e.stopPropagation();

//   const success = await toggleWishlist(product.id);
//   if (success) {
//     toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist", {id:"wishlist-toggle-related"});
//   }
// };


//   const categoryName = typeof product.category === 'object' 
//     ? product.category?.name 
//     : product.category;

//   return (
//     <div 
//       onClick={handleCardClick}
//       className="group relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-3xl bg-gray-100 transition-all hover:shadow-2xl hover:-translate-y-1"
//     >
//       <img
//         src={imageUrl}
//         alt={product.name}
//         className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
//       />
//       <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
//       <div className="absolute left-4 top-4">
//         <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-900 backdrop-blur-md">
//           {categoryName || "Collection"}
//         </span>
//       </div>

//       <div className="absolute right-4 top-4 flex flex-col gap-3">
//         <button
//           onClick={handleToggleWishlist}
//           className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95"
//         >
//           <Heart className={classNames("h-5 w-5 transition-colors", isWishlisted ? "fill-red-500 text-red-500" : "text-gray-900")} />
//         </button>
//         <button
//           onClick={handleAddToCart}
//           className={classNames(
//             "flex h-10 w-10 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95",
//             isInCart ? "bg-green-100 text-green-700 cursor-default" : "bg-white/90 text-gray-900 hover:bg-black hover:text-white"
//           )}
//         >
//           {isInCart ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
//         </button>
//       </div>

//       <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-90 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
//         <div className="flex items-center justify-between rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur-xl border border-white/50">
//           <div className="flex flex-col truncate pr-2">
//             <h3 className="truncate text-sm font-bold text-gray-900">{product.name}</h3>
//             <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
//               {product.discount && product.discount > 0 ? (
//                 <>
//                   <span className="text-xs font-bold text-gray-900">
//                     ₹{(product.price * (1 - product.discount / 100)).toFixed(2)}
//                   </span>
//                   <span className="text-[10px] text-gray-400 line-through">
//                     ₹{product.price?.toFixed(2)}
//                   </span>
//                   <span className="text-[9px] text-green-600 font-bold bg-green-50 px-1 rounded">
//                     {product.discount}% OFF
//                   </span>
//                 </>
//               ) : (
//                 <span className="text-xs font-bold text-gray-500">
//                   ₹{product.price?.toFixed(2)}
//                 </span>
//               )}
//             </div>
//           </div>
//           <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 group-hover:bg-black group-hover:text-white transition-colors duration-300">
//             <ArrowRight className="h-4 w-4" />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // --- MAIN DETAIL PAGE COMPONENT ---
// export default function ProductDetailPage() {
//   const { productId } = useParams();
//   const navigate = useNavigate();
//   const [product, setProduct] = useState<DetailProduct | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isAdding, setIsAdding] = useState(false);
//   const [showDeliveryModal, setShowDeliveryModal] = useState(false);
//   const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);

//   const { cartItems, addToCart, fetchCart, updateQuantity } = useCart(); // Assuming addToCart is available here too
//   const { user, logout } = useAuth();
//   const { isProductInWishlist, toggleWishlist } = useWishlist();
//   const [selectedImageIndex, setSelectedImageIndex] = useState(0);
//   const [showPincodeInput, setShowPincodeInput] = useState(false);
//   const [pincodeToCheck, setPincodeToCheck] = useState("");
//   const [isResolvingPincode, setIsResolvingPincode] = useState(false);
//   const [quantity, setQuantity] = useState<number>(1);

//   const isInWishlist = product ? isProductInWishlist(product.id) : false;
  
//   // Check if current product is already in cart
//   const cartItem = cartItems.find((item) => String(item.productId) === String(productId));
//   const isAlreadyAdded = !!cartItem;

//   // Sync quantity state with cartItem if present, or reset to 1 on product change
//   useEffect(() => {
//     if (cartItem && cartItem.quantity) {
//       setQuantity(cartItem.quantity);
//     } else {
//       setQuantity(1);
//     }
//   }, [cartItem?.quantity, productId]);

//   const handleDecreaseQuantity = async () => {
//     if (quantity <= 1) return;
//     const newQty = quantity - 1;
//     setQuantity(newQty);
//     if (isAlreadyAdded && product) {
//       try {
//         await updateQuantity(product.id, newQty);
//       } catch {
//         toast.error("Failed to update quantity", { id: "qty-update-error" });
//       }
//     }
//   };

//   const handleIncreaseQuantity = async () => {
//     if (!product) return;
//     const maxStock = product.stock ?? 0;
//     if (quantity >= maxStock) {
//       toast.error(`Only ${maxStock} item(s) available in stock`, { id: "max-stock-reached" });
//       return;
//     }
//     const newQty = quantity + 1;
//     setQuantity(newQty);
//     if (isAlreadyAdded) {
//       try {
//         await updateQuantity(product.id, newQty);
//       } catch {
//         toast.error("Failed to update quantity", { id: "qty-update-error" });
//       }
//     }
//   };

//   const handleGatedNavigation = (e: React.MouseEvent, path: string, isProtected: boolean) => {
//     if (isProtected && !user.isAuthenticated) {
//       e.preventDefault();
//       window.dispatchEvent(new CustomEvent("openCustomerAuth"));
//     } else {
//       navigate(path);
//     }
//   };

//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         setSelectedImageIndex(0);
//         window.scrollTo(0, 0);
//         const res = await api.get(`/user/shop/product/${productId}`);
//         setProduct(normalizeProduct(res.data.product));
//         setRelatedProducts((res.data.relatedProducts || []).map(normalizeProduct));
//       } catch (err) {
//       const _e = err as any;
//         console.error(err);
//         setError(_e.response?.status === 404 ? "Product not found" : "Error loading product");
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (productId) fetchProduct();
//   }, [productId]);

//   // Lock background scroll when delivery modal is open
//   useEffect(() => {
//     const scrollContainer = document.querySelector(".h-screen.overflow-y-auto") as HTMLElement;
//     if (showDeliveryModal) {
//       document.body.style.overflow = "hidden";
//       if (scrollContainer) {
//         scrollContainer.style.overflow = "hidden";
//       }
//     } else {
//       document.body.style.overflow = "";
//       if (scrollContainer) {
//         scrollContainer.style.overflow = "";
//       }
//     }
//     return () => {
//       document.body.style.overflow = "";
//       if (scrollContainer) {
//         scrollContainer.style.overflow = "";
//       }
//     };
//   }, [showDeliveryModal]);

//   // Handle Add to Cart for the Main Product
//   const handleMainAddToCart = async (e: React.FormEvent | React.MouseEvent) => {
//     e.preventDefault();
//     if (!product) return;
//     if (!user.isAuthenticated) {
//       window.dispatchEvent(new CustomEvent("openCustomerAuth"));
//       return;
//     }
//     if ((product.stock ?? 0) <= 0) {
//       toast.error("Sorry, this product is out of stock.", { id: "sorry product is out of stooooooooooockkkk" });
//       return;
//     }

//     if (isAlreadyAdded) {
//       toast.success("Already in your cart!", { id: "already-in-cart" });
//       return;
//     }

//     setIsAdding(true);
//     try {
//       if (addToCart) {
//         await addToCart(product.id, { quantity });
//         toast.success(`Added ${product.name} (${quantity}) to cart`, { id: "added productsss" });
//       } else {
//         const cartData = { productId: product.id, quantity };
//         await api.post(`/cart/add`, cartData);
//         fetchCart();
//         toast.success(`${product.name} added to cart!`, { id: "added to cart done" });
//       }
//     } catch (err) {
//       const _e = err as any;
//       if (_e.response?.status === 401) {
//         window.dispatchEvent(new CustomEvent("openCustomerAuth"));
//       } else {
//         toast.error("Failed to add to cart", { id: "failedddddddd" });
//       }
//     } finally {
//       setIsAdding(false);
//     }
//   };

//   // Handle Buy Now — open delivery location modal (handles cart + checkout)
//   const handleBuyNow = (e: React.MouseEvent) => {
//     e.preventDefault();
//     if (!product) return;
//     if (!user.isAuthenticated) {
//       window.dispatchEvent(new CustomEvent("openCustomerAuth"));
//       return;
//     }
//     if ((product.stock ?? 0) <= 0) {
//       toast.error("Sorry, this product is out of stock.", { id: "buynow-oos" });
//       return;
//     }
//     setShowDeliveryModal(true);
//   };

//   const handleCheckAvailabilityClick = (e: React.MouseEvent) => {
//     e.preventDefault();
//     if (!product) return;
//     if (!user.isAuthenticated) {
//       window.dispatchEvent(new CustomEvent("openCustomerAuth"));
//       return;
//     }
//     if ((product.stock ?? 0) <= 0) {
//       toast.error("Sorry, this product is out of stock.", { id: "avail-oos" });
//       return;
//     }
//     setShowPincodeInput(true);
//   };

//   const handlePincodeCheckChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const val = e.target.value;
//     const cleanPincode = val.replace(/\D/g, "").slice(0, 6);
//     setPincodeToCheck(cleanPincode);

//     if (cleanPincode.length === 6) {
//       setIsResolvingPincode(true);
//       try {
//         const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPincode}`);
//         if (res.ok) {
//           const data = await res.json();
//           if (data && data[0] && data[0].Status === "Success") {
//             const postOffice = data[0].PostOffice[0];
//             const fetchedState = postOffice.State;
//             const fetchedCity = postOffice.District || postOffice.Block || postOffice.Name;

//             if (fetchedState) {
//               const isInCart = cartItems.some((i) => String(i.productId) === String(product?.id));
              
//               // Run shipping calculation and add-to-cart concurrently
//               const [shippingRes] = await Promise.all([
//                 api.post("/address/preview-shipping", {
//                   manual: true,
//                   state: fetchedState,
//                   zipCode: cleanPincode,
//                 }),
//                 isInCart || !product ? Promise.resolve(null) : addToCart(product.id)
//               ]);

//               const shippingCharge = shippingRes?.data?.shippingCharge ?? 0;

//               // Redirect to checkout with address prefill
//               const addressPrefill = {
//                 fullAddress: "",
//                 city: fetchedCity || "",
//                 state: fetchedState,
//                 zipCode: cleanPincode,
//                 lat: null,
//                 lng: null,
//                 isGpsLocked: false,
//               };

//               setShowPincodeInput(false);
//               setPincodeToCheck("");
              
//               // Slight delay to allow the loading animation to display smoothly during navigation transition
//               setTimeout(() => {
//                 navigate("/checkout", {
//                   state: { addressPrefill, shippingCharge, buyNowProductId: product?.id },
//                 });
//                 setIsResolvingPincode(false);
//               }, 600);
//               return;
//             } else {
//               toast.error("Could not resolve location from this pincode.");
//             }
//           } else {
//             toast.error("Invalid pincode or not found.");
//           }
//         } else {
//           toast.error("Failed to verify pincode.");
//         }
//       } catch (err) {
//         console.error("Error checking pincode availability", err);
//         toast.error("An error occurred. Please try again.");
//       }
//       setIsResolvingPincode(false);
//     }
//   };

//   // Wrapper for Related Products Add to Cart
//   const handleRelatedAddToCart = async (productId: string): Promise<void> => {
//     if (!addToCart) return;

//     try {
//       await addToCart(productId);
//       toast.success("Added to cart", { id: "added-related-product-to-cart" });
//     } catch (err: any) {
//       if (err?.message !== "Not authenticated") {
//         toast.error(err?.response?.data?.message || "Failed to add to cart", {
//           id: "failed-related-add-to-cart",
//         });
//       }
//     }
//   };

//   const handleToggleWishlist = async () => {
//     if (!user?.isAuthenticated) return toast.error("Please log in to use wishlist",{id:"please be login"});
//     if (!product) return;
//     const success = await toggleWishlist(product.id);
//     if (success) {
//       toast.success(isInWishlist ? "Removed from Wishlist" : "Added to Wishlist!",{id:"removed or add to wishlist"});
//     }
//   };

//   const handleShare = async () => {
//     const shareUrl = window.location.href;
//     const shareData = {
//       title: safeRender(product?.name) || "Check out this product",
//       text: `Check out ${safeRender(product?.name)} — ₹${product?.price?.toLocaleString()}`,
//       url: shareUrl,
//     };
//     if (navigator.share) {
//       try {
//         await navigator.share(shareData);
//       } catch {
//         // user dismissed — do nothing
//       }
//     } else {
//       // Desktop fallback: copy link to clipboard
//       try {
//         await navigator.clipboard.writeText(shareUrl);
//         toast.success("Link copied to clipboard!", { id: "share-copy" });
//       } catch {
//         toast.error("Could not copy link", { id: "share-copy-err" });
//       }
//     }
//   };

//   if (loading) return <div className="h-screen flex justify-center items-center bg-white"><BeatLoader color="#000" /></div>;
//   if (error || !product) return <div className="text-center py-20 text-red-600 font-semibold">{error || "Unavailable"}</div>;

//   // Build full image list: primary + gallery
//   const allImages = [product.image, ...(product.images ?? [])].filter(Boolean) as string[];
//   const getImgSrc = (img: string) => normalizeProduct({ image: img }).image || "https://placehold.co/600x800?text=No+Image";
//   const galleryImages = allImages.length > 0 ? allImages : [""];

//   const stock = product.stock ?? 0;
//   const isOutOfStock = stock <= 0;
//   const isLowStock = stock > 0 && stock <= 5;
//   const categoryName = safeRender(product.category, "Collection");
//   const hasDiscount = !!(product.discount && product.discount > 0);
//   const discountedPrice = hasDiscount ? product.price * (1 - product.discount! / 100) : product.price;

//   return (
//     <div className="bg-white min-h-screen font-sans">
      
//       {/* <Navbar 
//         isAuthenticated={user.isAuthenticated}
//         role={user.role}
//         cartItemCount={cartItems?.length || 0}
//         handleLogout={logout}
//         handleUserIconClick={() => navigate("/profile")}
//         handleGatedNavigation={handleGatedNavigation}
//       /> */}

//       <main className="max-w-7xl mx-auto px-4 pt-8 pb-16 sm:px-6 lg:px-8 mt-24">
        
//         {/* --- BREADCRUMB / BACK --- */}
//         <div className="mb-8 pt-6"> {/* 👈 Added pt-6 to push it cleanly away from the navbar line */}
//           <button
//             onClick={() => navigate(-1)}
//             className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors duration-300"
//           >
//             <ArrowLeftIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
//             Go Back
//           </button>
//         </div>

//         <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16 items-start">
          
//           {/* --- LEFT: PRODUCT IMAGE GALLERY --- */}
//           <motion.div 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6 }}
//             className="flex flex-col gap-4"
//           >
//             {/* Main Image Carousel */}
//             <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2.5rem] bg-gray-100 shadow-sm border border-gray-100 group">
//               {/* Slide strip — all images rendered; translateX moves between them */}
//               <div
//                 className="flex h-full transition-transform duration-300 ease-in-out"
//                 style={{
//                   width: `${galleryImages.length * 100}%`,
//                   transform: `translateX(-${(selectedImageIndex * 100) / galleryImages.length}%)`,
//                 }}
//               >
//                 {galleryImages.map((img, i) => (
//                   <div
//                     key={i}
//                     className="relative h-full flex-shrink-0"
//                     style={{ width: `${100 / galleryImages.length}%` }}
//                   >
//                     <img
//                       src={getImgSrc(img)}
//                       alt={`${safeRender(product.name)} view ${i + 1}`}
//                       className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
//                     />
//                   </div>
//                 ))}
//               </div>

//               {/* Overlay Badge */}
//               <div className="absolute top-6 left-6 pointer-events-none">
//                 <span className="inline-flex items-center rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-900 backdrop-blur-md shadow-sm">
//                   {categoryName}
//                 </span>
//               </div>

//               {/* Prev / Next arrows */}
//               {galleryImages.length > 1 && (
//                 <>
//                   <button
//                     onClick={() => setSelectedImageIndex(i => Math.max(0, i - 1))}
//                     disabled={selectedImageIndex === 0}
//                     className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-gray-800 hover:bg-white disabled:opacity-30 transition-all duration-200"
//                     aria-label="Previous image"
//                   >
//                     <ChevronLeftIcon className="h-5 w-5" />
//                   </button>
//                   <button
//                     onClick={() => setSelectedImageIndex(i => Math.min(galleryImages.length - 1, i + 1))}
//                     disabled={selectedImageIndex === galleryImages.length - 1}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-gray-800 hover:bg-white disabled:opacity-30 transition-all duration-200"
//                     aria-label="Next image"
//                   >
//                     <ChevronRightIcon className="h-5 w-5" />
//                   </button>
//                 </>
//               )}

//               {/* Image count indicator */}
//               {galleryImages.length > 1 && (
//                 <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full pointer-events-none">
//                   {selectedImageIndex + 1} / {galleryImages.length}
//                 </div>
//               )}
//             </div>

//             {/* Thumbnail Strip */}
//             {galleryImages.length > 1 && (
//               <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
//                 {galleryImages.map((img, i) => (
//                   <button
//                     key={i}
//                     onClick={() => setSelectedImageIndex(i)}
//                     className={`flex-shrink-0 w-[72px] h-[72px] rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
//                       i === selectedImageIndex
//                         ? "border-gray-900 shadow-md scale-105"
//                         : "border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100"
//                     }`}
//                   >
//                     <img
//                       src={getImgSrc(img)}
//                       alt={`${safeRender(product.name)} view ${i + 1}`}
//                       className="w-full h-full object-cover"
//                     />
//                   </button>
//                 ))}
//               </div>
//             )}
//           </motion.div>

//           {/* --- RIGHT: PRODUCT DETAILS --- */}
//           <motion.div 
//              initial={{ opacity: 0, x: 20 }}
//              animate={{ opacity: 1, x: 0 }}
//              transition={{ duration: 0.6, delay: 0.2 }}
//              className="mt-10 px-2 sm:px-0 lg:mt-0 lg:sticky lg:top-24"
//           >
//             {/* Title + Share */}
//             <div className="flex items-start justify-between gap-3 mb-4">
//               <div className="flex-1">
//                 {product.brand && (
//                   <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 select-text">
//                     {product.brand}
//                   </p>
//                 )}
//                 <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 sm:text-5xl font-sans">
//                   {safeRender(product.name)}
//                 </h1>
//               </div>
//               <button
//                 onClick={handleShare}
//                 title="Share this product"
//                 className="flex-shrink-0 mt-1 p-2.5 rounded-full border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
//               >
//                 <Share2 className="h-5 w-5" />
//               </button>
//             </div>

//             {/* Rating Stars Under Product Name */}
//             <div className="flex items-center gap-2.5 mb-6">
//               <StarDisplay rating={product.rating || 0} />
//               {product.rating !== undefined && product.rating > 0 ? (
//                 <>
//                   <span className="text-sm font-bold text-gray-800">
//                     {product.rating.toFixed(1)}
//                   </span>
//                   <span className="text-xs text-gray-300">|</span>
//                   <span
//                     onClick={() => {
//                       const reviewSec = document.getElementById("reviews-section");
//                       if (reviewSec) {
//                         reviewSec.scrollIntoView({ behavior: "smooth" });
//                       }
//                     }}
//                     className="text-xs font-bold text-neutral-900 hover:text-black hover:underline cursor-pointer"
//                   >
//                     {product.numReviews || 0} verified reviews
//                   </span>
//                 </>
//               ) : (
//                 <div className="flex items-center gap-2">
//                   <span className="text-xs font-semibold text-slate-400">
//                     No reviews yet
//                   </span>
//                   <span className="text-xs text-gray-300">|</span>
//                   <button
//                     onClick={() => {
//                       const reviewSec = document.getElementById("reviews-section");
//                       if (reviewSec) {
//                         reviewSec.scrollIntoView({ behavior: "smooth" });
//                       }
//                       window.dispatchEvent(new CustomEvent("open-review-form"));
//                     }}
//                     className="text-xs font-bold text-neutral-900 hover:text-black hover:underline cursor-pointer"
//                   >
//                     Write a review
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* Price & Stock */}
//             <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-8">
//                 <div className="flex flex-wrap items-baseline gap-3">
//                   {hasDiscount ? (
//                     <>
//                       <p className="text-3xl font-bold text-gray-900">
//                         ₹{discountedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                       <p className="text-lg text-gray-400 line-through">
//                         ₹{product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                       <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700 ring-1 ring-inset ring-green-600/20">
//                         {product.discount}% OFF
//                       </span>
//                     </>
//                   ) : (
//                     <p className="text-3xl font-bold text-gray-900">
//                       ₹ {product.price?.toLocaleString()}
//                     </p>
//                   )}
//                 </div>
//                 <div className="flex items-center gap-2">
//                     {isOutOfStock ? (
//                         <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Out of Stock</span>
//                     ) : isLowStock ? (
//                         <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/10">Only {stock} Left</span>
//                     ) : (
//                         <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">In Stock</span>
//                     )}
//                 </div>
//             </div>

//             {/* Description */}
//             <div className="prose prose-sm text-gray-700 mb-10 leading-relaxed max-w-none">
//               <div dangerouslySetInnerHTML={{ __html: product.description || "<p>No description available.</p>" }} />
//             </div>

//             {/* Delivery Availability Check - Commented Out */}
//             {/* 
//             <div className="mb-6 rounded-2xl bg-indigo-50/30 p-5 border border-indigo-100/40 shadow-sm transition-all duration-300">
//               {!showPincodeInput ? (
//                 <motion.button
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ duration: 0.15 }}
//                   type="button"
//                   onClick={handleCheckAvailabilityClick}
//                   className="w-full flex items-center justify-between transition-all text-left group"
//                 >
//                   <div className="flex items-center gap-3.5">
//                     <div className="w-10 h-10 rounded-full bg-indigo-100/70 flex items-center justify-center group-hover:scale-105 transition-transform">
//                       <MapPinIcon className="h-5 w-5 text-indigo-600" />
//                     </div>
//                     <div>
//                       <p className="text-sm font-bold text-gray-900 tracking-tight">Check availability in your place</p>
//                       <p className="text-xs text-gray-500 mt-0.5">Enter pincode to verify delivery</p>
//                     </div>
//                   </div>
//                   <span className="text-indigo-500 font-bold text-base transition-transform group-hover:translate-x-1 select-none pr-1">&gt;</span>
//                 </motion.button>
//               ) : (
//                 <motion.div
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ duration: 0.15 }}
//                 >
//                   <div className="flex items-center gap-2 mb-3">
//                     <MapPinIcon className="h-4.5 w-4.5 text-indigo-600" />
//                     <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Verify Pincode</span>
//                   </div>
//                   <div className="flex items-center gap-2.5">
//                     <div className="relative flex-1">
//                       <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
//                         <span className="text-indigo-400 font-semibold text-sm">#</span>
//                       </div>
//                       <input
//                         type="text"
//                         inputMode="numeric"
//                         pattern="[0-9]*"
//                         maxLength={6}
//                         placeholder="Enter 6-digit Pincode"
//                         value={pincodeToCheck}
//                         onChange={handlePincodeCheckChange}
//                         disabled={isResolvingPincode}
//                         className="w-full bg-white border border-indigo-100 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 rounded-xl pl-9 pr-4 py-3 text-sm font-semibold tracking-wide text-gray-855 placeholder-gray-400 focus:outline-none transition-all shadow-inner"
//                       />
//                     </div>
//                     <button
//                       type="button"
//                       onClick={() => setShowPincodeInput(false)}
//                       disabled={isResolvingPincode}
//                       className="px-4.5 py-3 text-xs font-extrabold uppercase tracking-wider text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition active:scale-95 shadow-sm"
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                   <p className="text-[11px] text-gray-400 mt-2 font-medium">
//                     Availability is automatically verified once 6 digits are typed.
//                   </p>
//                 </motion.div>
//               )}
//             </div>
//             */}

//             {/* Quantity Selector */}
//             {!isOutOfStock && (
//               <div className="mb-6">
//                 <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
//                   Quantity
//                 </label>
//                 <div className="inline-flex items-center gap-3">
//                   <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 p-1 shadow-inner">
//                     <button
//                       type="button"
//                       onClick={handleDecreaseQuantity}
//                       disabled={quantity <= 1}
//                       className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-800 shadow-sm transition-all hover:bg-gray-100 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-white"
//                       aria-label="Decrease quantity"
//                     >
//                       <MinusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
//                     </button>
//                     <span className="w-12 text-center text-sm font-bold text-gray-900 select-none">
//                       {quantity}
//                     </span>
//                     <button
//                       type="button"
//                       onClick={handleIncreaseQuantity}
//                       disabled={quantity >= stock}
//                       className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-800 shadow-sm transition-all hover:bg-gray-100 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-white"
//                       aria-label="Increase quantity"
//                     >
//                       <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
//                     </button>
//                   </div>
//                   {isAlreadyAdded && (
//                     <span className="text-xs font-semibold text-emerald-600 inline-flex items-center gap-1">
//                       <Check className="h-3.5 w-3.5" /> Updated in cart
//                     </span>
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* Action Buttons */}
//             <div className="flex flex-col gap-4 mb-10">

//                  <button
//                 onClick={handleBuyNow}
//                 disabled={isAdding || isOutOfStock}
//                 className={`w-full flex items-center justify-center gap-3 rounded-full py-4 text-sm font-bold uppercase tracking-wider transition-all border-2 hover:-translate-y-1 active:translate-y-0
//                   ${(isOutOfStock || isAdding)
//                     ? "border-gray-200 text-gray-400 cursor-not-allowed"
//                     : "border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
//                   }`}
//               >
//                 {isAdding ? <BeatLoader size={8} color="#111" /> : <><ArrowRight className="h-5 w-5" /> Buy Now</>}
//               </button>
//               <button
//                 onClick={handleMainAddToCart}
//                 disabled={isAdding || isOutOfStock || isAlreadyAdded}
//                 className={`w-full flex items-center justify-center gap-3 rounded-full py-4 text-sm font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0
//                   ${(isOutOfStock || isAdding || isAlreadyAdded) 
//                     ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none" 
//                     : "bg-black text-white hover:bg-gray-900"
//                   }`}
//               >
//                 {isAdding ? <BeatLoader size={8} color="#fff" /> : 
//                  isOutOfStock ? "Sold Out" : 
//                  isAlreadyAdded ? <><Check className="h-5 w-5"/> In Cart</> : 
//                  <><ShoppingBag className="h-5 w-5"/> Add to Cart</>}
//               </button>

//               <button
//                 onClick={handleToggleWishlist}
//                 className="w-full flex items-center justify-center gap-2 rounded-full py-4 text-sm font-bold uppercase tracking-wider border border-gray-200 text-gray-900 hover:bg-gray-50 transition-all hover:border-gray-300"
//               >
//                 <Heart className={classNames("h-5 w-5", isInWishlist ? "fill-red-500 text-red-500" : "")} />
//                 {isInWishlist ? "Saved to Wishlist" : "Save to Wishlist"}
//               </button>
//             </div>

//             {/* Accordions (Clean Style) */}
//             <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-gray-50/50 p-2">
//               {STATIC_DETAILS.map((detail) => (
//                 <Disclosure key={detail.name} as="div">
//                   {({ open }) => (
//                     <>
//                       <dt>
//                         <DisclosureButton className="flex w-full items-center justify-between p-4 text-left text-sm font-semibold text-gray-900 hover:bg-white rounded-xl transition-colors">
//                           <span className="flex items-center gap-3">
//                             {detail.icon}
//                             {detail.name}
//                           </span>
//                           <span className="ml-6 flex items-center text-gray-400">
//                             {open ? <MinusIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
//                           </span>
//                         </DisclosureButton>
//                       </dt>
//                       <DisclosurePanel as="dd" className="px-4 pb-4 pt-1">
//                         <ul className="list-disc pl-11 text-sm text-gray-500 space-y-1">
//                           {detail.items.map((item) => (
//                             <li key={item}>{item}</li>
//                           ))}
//                         </ul>
//                       </DisclosurePanel>
//                     </>
//                   )}
//                 </Disclosure>
//               ))}
//             </div>
            
//           </motion.div>
//         </div>

//         {/* --- RELATED PRODUCTS (Using ModernProductCard) --- */}
//         {relatedProducts.length > 0 && (
//           <section className="mt-32">
//              <div className="text-center mb-12">
//                 <motion.h2 
//                   initial={{ opacity: 0, y: 20 }}
//                   whileInView={{ opacity: 1, y: 0 }}
//                   viewport={{ once: true }}
//                   className="text-3xl font-bold tracking-tighter sm:text-4xl font-sans"
//                 >
//                   <span className="bg-black bg-clip-text text-transparent">
//                     You May Also Like
//                   </span>
//                 </motion.h2>
//                 <div className="h-1 bg-gray-900 mx-auto mt-4 rounded-full w-20" />
//             </div>

//             <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
//               {relatedProducts.map((item) => (
//                 <ModernProductCard 
//                     key={item.id} 
//                     product={item} 
//                     addToCart={handleRelatedAddToCart}
//                     cartItems={cartItems}
//                 />
//               ))}
//             </div>
//           </section>
//         )}

//         {/* ── Reviews ── */}
//         {productId && (
//           <ReviewSection
//             productId={productId}
//             isAuthenticated={user.isAuthenticated}
//             onReviewChange={async () => {
//               try {
//                 const res = await api.get(`/user/shop/product/${productId}`);
//                 setProduct(normalizeProduct(res.data.product));
//               } catch (err) {
//                 console.error("Error refreshing product rating:", err);
//               }
//             }}
//           />
//         )}
//       </main>
//       <FooterSection/>

//       {/* Delivery location picker modal (triggered by Buy Now) */}
//       {product && (
//         <DeliveryLocationModal
//           isOpen={showDeliveryModal}
//           onClose={() => setShowDeliveryModal(false)}
//           product={{ id: product.id, name: safeRender(product.name), price: hasDiscount ? discountedPrice : (product.price ?? 0), quantity: quantity }}
//         />
//       )}

//       {/* Premium Full-Screen Page Transition Overlay - Commented Out */}
//       {/* 
//       <AnimatePresence>
//         {isResolvingPincode && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 bg-white/90 backdrop-blur-md z-[300] flex flex-col items-center justify-center pointer-events-auto"
//           >
//             <motion.div
//               initial={{ scale: 0.9, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.9, opacity: 0 }}
//               className="flex flex-col items-center gap-4 text-center px-4"
//             >
//               <div className="h-12 w-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm animate-pulse mb-2">
//                 <MapPinIcon className="h-6 w-6 text-indigo-600" />
//               </div>
//               <p className="text-base font-extrabold text-gray-900 tracking-tight">
//                 Checking availability in your place...
//               </p>
//               <p className="text-xs text-gray-400 max-w-[240px]">
//                 We are checking delivery options and preparing your checkout flow.
//               </p>
//               <div className="mt-2">
//                 <BeatLoader size={8} color="#4f46e5" />
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//       */}
//     </div>
//   );
// }









// import React, { useEffect, useState, useCallback } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
// import { 
//   MinusIcon, 
//   PlusIcon, 
//   ArrowLeftIcon, 
//   ShieldCheckIcon, 
//   TruckIcon,
//   StarIcon,
//   ChevronLeftIcon,
//   ChevronRightIcon,
// } from "@heroicons/react/24/outline";
// import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
// import { 
//   Heart, 
//   ShoppingBag, 
//   Check, 
//   ArrowRight
// } from "lucide-react";
// import { BeatLoader } from "react-spinners";
// import toast from 'react-hot-toast';
// import { motion } from "framer-motion";
// import FooterSection from "../components/FooterSection";
// import DeliveryLocationModal from "./DeliveryLocationModal";

// // Components & Context
// import api from "../utils/api";
// import { useCart } from "../context/CartContext";
// import { useWishlist } from "../context/WishlistContext";
// import { useAuth } from "../context/AuthContext";
// import { normalizeProduct } from "../utils/product";

// interface DetailProduct {
//   id: string;
//   name: string;
//   brand?: string;
//   price: number;
//   image?: string;
//   images?: string[];
//   stock?: number;
//   description?: string;
//   category?: { name?: string } | string;
//   discount?: number;
//   sizes?: string[];
//   rating?: number;
//   numReviews?: number;
// }

// interface RelatedProduct {
//   id: string;
//   name: string;
//   price: number;
//   image?: string;
//   stock?: number;
//   category?: { name?: string } | string;
//   discount?: number;
// }

// interface ReviewUser {
//   id: string;
//   username: string;
//   avatar?: string;
// }

// interface Review {
//   id: string;
//   rating: number;
//   comment?: string;
//   createdAt: string;
//   user: ReviewUser;
// }

// interface ReviewDistribution {
//   star: number;
//   count: number;
// }

// // ── Star Rating Display ───────────────────────────────────────────────────────
// function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
//   const sz = size === "lg" ? "h-6 w-6" : "h-4 w-4";
//   return (
//     <div className="flex items-center gap-0.5">
//       {[1, 2, 3, 4, 5].map((star) => (
//         star <= Math.round(rating)
//           ? <StarSolid key={star} className={`${sz} text-amber-500`} />
//           : <StarIcon key={star} className={`${sz} text-neutral-200`} />
//       ))}
//     </div>
//   );
// }

// // ── Interactive Star Picker ───────────────────────────────────────────────────
// function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
//   const [hovered, setHovered] = useState(0);
//   return (
//     <div className="flex items-center gap-1">
//       {[1, 2, 3, 4, 5].map((star) => (
//         <button
//           key={star}
//           type="button"
//           onMouseEnter={() => setHovered(star)}
//           onMouseLeave={() => setHovered(0)}
//           onClick={() => onChange(value === star ? star - 1 : star)}
//           className="transition-all hover:scale-110 active:scale-95 text-neutral-300 hover:text-amber-500"
//         >
//           {(hovered || value) >= star
//             ? <StarSolid className="h-7 w-7 text-amber-500" />
//             : <StarIcon className="h-7 w-7 text-neutral-300" />}
//         </button>
//       ))}
//     </div>
//   );
// }

// // ── Clean Minimal Standard Review Section ───────────────────────────────────
// function ReviewSection({
//   productId,
//   isAuthenticated,
//   onReviewChange,
// }: {
//   productId: string;
//   isAuthenticated: boolean;
//   onReviewChange?: () => Promise<unknown> | void;
// }) {
//   const [reviews, setReviews] = useState<Review[]>([]);
//   const [avg, setAvg] = useState(0);
//   const [distribution, setDistribution] = useState<ReviewDistribution[]>([]);
//   const [myReview, setMyReview] = useState<Review | null>(null);
//   const [, setCanReview] = useState(false);
//   const [featureEnabled, setFeatureEnabled] = useState(true);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [showForm, setShowForm] = useState(false);
//   const [rating, setRating] = useState(5);
//   const [comment, setComment] = useState("");
//   const [editMode, setEditMode] = useState(false);

//   useEffect(() => {
//     const handleOpenForm = () => {
//       if (isAuthenticated && !myReview) {
//         setEditMode(false);
//         setShowForm(true);
//       } else if (!isAuthenticated) {
//         window.dispatchEvent(new CustomEvent("openCustomerAuth"));
//       }
//     };
//     window.addEventListener("open-review-form", handleOpenForm);
//     return () => window.removeEventListener("open-review-form", handleOpenForm);
//   }, [isAuthenticated, myReview]);

//   const loadReviews = useCallback(async () => {
//     try {
//       const res = await api.get(`/reviews/${productId}`);
//       setReviews(res.data.reviews);
//       setAvg(res.data.avg);
//       setDistribution(res.data.distribution);
//       setFeatureEnabled(true);
//     } catch (err: unknown) {
//       if ((err as { response?: { status?: number } }).response?.status === 403) {
//         setFeatureEnabled(false);
//       }
//     }
//   }, [productId]);

//   const loadMyReview = useCallback(async () => {
//     if (!isAuthenticated) return;
//     try {
//       const res = await api.get(`/reviews/my/${productId}`);
//       setMyReview(res.data.review || null);
//       setCanReview(res.data.canReview);
//       if (res.data.review) {
//         setRating(res.data.review.rating);
//         setComment(res.data.review.comment || "");
//       }
//     } catch {
//       // ignore
//     }
//   }, [productId, isAuthenticated]);

//   useEffect(() => {
//     setLoading(true);
//     Promise.all([loadReviews(), loadMyReview()]).finally(() => setLoading(false));
//   }, [loadReviews, loadMyReview]);

//   if (!featureEnabled) return null;

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setSubmitting(true);
//     try {
//       if (editMode && myReview) {
//         const reviewId = myReview.id || (myReview as any)._id;
//         await api.patch(`/reviews/${reviewId}`, { rating, comment });
//         toast.success("Review updated!", { id: "review-update" });
//       } else {
//         await api.post(`/reviews/${productId}`, { rating, comment });
//         toast.success("Review submitted!", { id: "review-submit" });
//       }
//       await Promise.all([loadReviews(), loadMyReview()]);
//       if (onReviewChange) await onReviewChange();
//       setShowForm(false);
//       setEditMode(false);
//     } catch (err: unknown) {
//       const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to submit review";
//       toast.error(msg, { id: "review-error" });
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!myReview) return;
//     try {
//       const reviewId = myReview.id || (myReview as any)._id;
//       await api.delete(`/reviews/${reviewId}`);
//       toast.success("Review deleted", { id: "review-delete" });
//       setMyReview(null);
//       setRating(5);
//       setComment("");
//       setShowForm(false);
//       await loadReviews();
//       if (onReviewChange) onReviewChange();
//     } catch {
//       toast.error("Failed to delete review", { id: "review-delete-err" });
//     }
//   };

//   const startEdit = () => {
//     if (!myReview) return;
//     setRating(myReview.rating);
//     setComment(myReview.comment || "");
//     setEditMode(true);
//     setShowForm(true);
//   };

//   const totalReviews = reviews.length;
//   const sortedDistribution = [...distribution].sort((a, b) => b.star - a.star);

//   return (
//     <section id="reviews-section" className="mt-24 border-t border-gray-200 pt-14 max-w-4xl mx-auto px-4 font-sans">
      
//       {/* ── Section Header ── */}
//       <div className="flex items-center justify-between pb-6 border-b border-gray-200">
//         <div>
//           <h2 className="text-xl font-bold tracking-wider text-gray-900 uppercase">
//             Customer Reviews
//           </h2>
//         </div>

//         {isAuthenticated ? (
//           !myReview && !showForm && (
//             <button
//               onClick={() => { setEditMode(false); setShowForm(true); }}
//               className="bg-black text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all rounded-sm"
//             >
//               Write a Review
//             </button>
//           )
//         ) : (
//           <button
//             onClick={() => window.dispatchEvent(new CustomEvent("openCustomerAuth"))}
//             className="bg-black text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all rounded-sm"
//           >
//             Log in to Write a Review
//           </button>
//         )}
//       </div>

//       {loading ? (
//         <div className="flex justify-center py-16">
//           <BeatLoader size={8} color="#000" />
//         </div>
//       ) : (
//         <div className="pt-8">
//           {/* ── Summary Row: Score & Progress Bars ── */}
//           {totalReviews > 0 ? (
//             <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 items-start pb-10 border-b border-gray-200">
              
//               {/* Score summary */}
//               <div className="sm:col-span-5 flex flex-col items-start">
//                 <div className="flex items-baseline gap-3">
//                   <span className="text-5xl font-extrabold text-gray-900 tracking-tight">
//                     {avg.toFixed(1)}
//                   </span>
//                   <span className="text-sm text-gray-400 font-medium">out of 5</span>
//                 </div>
//                 <div className="mt-2">
//                   <StarDisplay rating={avg} size="lg" />
//                 </div>
//                 <p className="text-xs text-gray-500 mt-2 font-medium">
//                   Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
//                 </p>
//               </div>

//               {/* Progress Bars */}
//               <div className="sm:col-span-7 space-y-2">
//                 {sortedDistribution.map(({ star, count }) => {
//                   const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
//                   return (
//                     <div key={star} className="flex items-center gap-3 text-xs text-gray-600 font-medium">
//                       <span className="w-10 text-gray-500">{star} ★</span>
//                       <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
//                         <div
//                           className="h-full bg-gray-900 rounded-full transition-all duration-500"
//                           style={{ width: `${percentage}%` }}
//                         />
//                       </div>
//                       <span className="w-8 text-right text-gray-400 font-mono text-[11px]">{count}</span>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           ) : (
//             <div className="text-center py-12 pb-10 border-b border-gray-200">
//               <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">No reviews yet. Be the first to review this product!</p>
//             </div>
//           )}

//           {/* ── Form Section ── */}
//           {showForm && (
//             <motion.div
//               initial={{ opacity: 0, y: -8 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="my-8 p-6 bg-gray-50 border border-gray-200 rounded-lg"
//             >
//               <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 pb-2 border-b border-gray-200">
//                 {editMode ? "Edit your review" : "Write a review"}
//               </h3>
//               <form onSubmit={handleSubmit} className="space-y-4">
//                 <div>
//                   <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Rating</label>
//                   <StarPicker value={rating} onChange={setRating} />
//                 </div>
//                 <div>
//                   <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Review Comment</label>
//                   <textarea
//                     rows={4}
//                     maxLength={1000}
//                     value={comment}
//                     onChange={(e) => setComment(e.target.value)}
//                     placeholder="Write your review here..."
//                     className="w-full bg-white border border-gray-300 rounded-sm p-3 text-sm text-gray-900 focus:border-black focus:outline-none transition-colors"
//                   />
//                   <p className="mt-1 text-right text-[11px] text-gray-400 font-mono">{comment.length}/1000</p>
//                 </div>
//                 <div className="flex gap-3 pt-2">
//                   <button
//                     type="button"
//                     onClick={() => { setShowForm(false); setEditMode(false); }}
//                     className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors rounded-sm"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={submitting || rating === 0}
//                     className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-gray-800 disabled:opacity-50 transition-colors rounded-sm flex items-center gap-2"
//                   >
//                     {submitting ? <BeatLoader size={6} color="#fff" /> : editMode ? "Update" : "Submit"}
//                   </button>
//                 </div>
//               </form>
//             </motion.div>
//           )}

//           {/* ── User's Active Review ── */}
//           {myReview && !showForm && (
//             <div className="my-6 p-5 bg-gray-50   rounded-lg">
//               <div className="flex items-center justify-between mb-2">
//                 <div className="flex items-center gap-3">
//                   <StarDisplay rating={myReview.rating} />
//                   <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Your Review</span>
//                 </div>
//                 <div className="flex items-center gap-3 text-xs">
//                   <button onClick={startEdit} className="font-bold text-gray-700 hover:text-black hover:underline">Edit</button>
//                   <span className="text-gray-300">•</span>
//                   <button onClick={handleDelete} className="font-bold text-red-600 hover:text-red-800 hover:underline">Delete</button>
//                 </div>
//               </div>
//               {myReview.comment ? (
//                 <p className="text-sm text-gray-700 leading-relaxed mt-2">{myReview.comment}</p>
//               ) : (
//                 <p className="text-xs italic text-gray-400 mt-1">Rating left without written comment.</p>
//               )}
//             </div>
//           )}

//           {/* ── Reviews Stream List ── */}
//           {reviews.length > 0 && (
//             <div className="divide-y divide-gray-200">
//               {reviews.map((r) => (
//                 <div key={r.id || (r as any)._id} className="py-7 first:pt-4 last:pb-0">
//                   <div className="flex items-center justify-between mb-2">
//                     <div className="flex items-center gap-3">
//                       <span className="text-sm font-bold text-gray-900">{r.user.username}</span>
                      
//                     </div>
//                     <span className="text-xs text-gray-400">
//                       {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
//                     </span>
//                   </div>

//                   <div className="mb-2">
//                     <StarDisplay rating={r.rating} />
//                   </div>

//                   {r.comment && (
//                     <p className="text-sm text-gray-700 leading-relaxed max-w-3xl whitespace-pre-line">
//                       {r.comment}
//                     </p>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}
//     </section>
//   );
// }

// // --- HELPERS ---
// const safeRender = (value: unknown, fallback = ""): string => {
//   if (!value) return fallback;
//   if (typeof value === 'object' && value !== null && 'name' in value) return (value as {name: string}).name;
//   if (typeof value === 'object') return JSON.stringify(value);
//   return String(value);
// };

// function classNames(...c: (string | false | undefined | null)[]) {
//   return c.filter(Boolean).join(" ");
// }

// const STATIC_DETAILS = [
//   {
//     name: "Composition & Care",
//     icon: <ShieldCheckIcon className="h-5 w-5 text-gray-400" />,
//     items: [
//       "Premium quality material",
//       "Comfortable",
//       "Durable construction",
//     ],
//   },
//   {
//     name: "Shipping & Returns",
//     icon: <TruckIcon className="h-5 w-5 text-gray-400" />,
//     items: [
//       "Fast delivery available",
//       "Secure packaging",
//     ],
//   },
// ];

// // --- MODERN CARD COMPONENT ---
// const ModernProductCard = ({ product, addToCart, cartItems }: { product: RelatedProduct; addToCart: (productId: string) => Promise<unknown>; cartItems: { productId: string }[] }) => {
//   const navigate = useNavigate();
//   const isInCart = cartItems.some((item) => String(item.productId) === String(product.id));
//   const imageUrl = product.image || "https://placehold.co/600x800?text=No+Image";

//   const handleCardClick = () => {
//     navigate(`/products/${product.id}`);
//     window.scrollTo(0,0);
//   };

//   const handleAddToCart = async (e: React.MouseEvent) => {
//     e.stopPropagation();
//     if (isInCart) {
//       toast.error("This item is already in your cart", { id: "This item is already in your cartmnmnm" });
//       return;
//     }

//     try {
//       await addToCart(product.id);
//       toast.success(`${product.name} added to cart`, { id: "added-to-cart-related-product" });
//     } catch (err: any) {
//       if (err?.message !== "Not authenticated") {
//         toast.error(err?.response?.data?.message || "Failed to add to cart", {
//           id: "failed-add-related-product",
//         });
//       }
//     }
//   };

//   const { isProductInWishlist, toggleWishlist } = useWishlist();
//   const isWishlisted = isProductInWishlist(product.id);

//   const handleToggleWishlist = async (e: React.MouseEvent) => {
//     e.stopPropagation();
//     const success = await toggleWishlist(product.id);
//     if (success) {
//       toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist", {id:"wishlist-toggle-related"});
//     }
//   };

//   const categoryName = typeof product.category === 'object' 
//     ? product.category?.name 
//     : product.category;

//   return (
//     <div 
//       onClick={handleCardClick}
//       className="group relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-xl bg-gray-100 transition-all hover:shadow-2xl hover:-translate-y-1"
//     >
//       <img
//         src={imageUrl}
//         alt={product.name}
//         className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
//       />
//       <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
//       <div className="absolute left-4 top-4">
//         <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-900 backdrop-blur-md">
//           {categoryName || "Collection"}
//         </span>
//       </div>

//       <div className="absolute right-4 top-4 flex flex-col gap-3">
//         <button
//           onClick={handleToggleWishlist}
//           className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95"
//         >
//           <Heart className={classNames("h-5 w-5 transition-colors", isWishlisted ? "fill-red-500 text-red-500" : "text-gray-900")} />
//         </button>
//         <button
//           onClick={handleAddToCart}
//           className={classNames(
//             "flex h-10 w-10 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95",
//             isInCart ? "bg-green-100 text-green-700 cursor-default" : "bg-white/90 text-gray-900 hover:bg-black hover:text-white"
//           )}
//         >
//           {isInCart ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
//         </button>
//       </div>

//       <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-90 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
//         <div className="flex items-center justify-between rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur-xl border border-white/50">
//           <div className="flex flex-col truncate pr-2">
//             <h3 className="truncate text-sm font-bold text-gray-900">{product.name}</h3>
//             <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
//               {product.discount && product.discount > 0 ? (
//                 <>
//                   <span className="text-xs font-bold text-gray-900">
//                     ₹{(product.price * (1 - product.discount / 100)).toFixed(2)}
//                   </span>
//                   <span className="text-[10px] text-gray-400 line-through">
//                     ₹{product.price?.toFixed(2)}
//                   </span>
//                   <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">
//                     {product.discount}% OFF
//                   </span>
//                 </>
//               ) : (
//                 <span className="text-xs font-bold text-gray-500">
//                   ₹{product.price?.toFixed(2)}
//                 </span>
//               )}
//             </div>
//           </div>
//           <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 group-hover:bg-black group-hover:text-white transition-colors duration-300">
//             <ArrowRight className="h-4 w-4" />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // --- MAIN DETAIL PAGE COMPONENT ---
// export default function ProductDetailPage() {
//   const { productId } = useParams();
//   const navigate = useNavigate();
//   const [product, setProduct] = useState<DetailProduct | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isAdding, setIsAdding] = useState(false);
//   const [showDeliveryModal, setShowDeliveryModal] = useState(false);
//   const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);

//   const { cartItems, addToCart, fetchCart, updateQuantity } = useCart();
//   const { user } = useAuth();
//   const { isProductInWishlist, toggleWishlist } = useWishlist();
//   const [selectedImageIndex, setSelectedImageIndex] = useState(0);
//   const [quantity, setQuantity] = useState<number>(1);

//   const isInWishlist = product ? isProductInWishlist(product.id) : false;
  
//   const cartItem = cartItems.find((item) => String(item.productId) === String(productId));
//   const isAlreadyAdded = !!cartItem;

//   useEffect(() => {
//     if (cartItem && cartItem.quantity) {
//       setQuantity(cartItem.quantity);
//     } else {
//       setQuantity(1);
//     }
//   }, [cartItem?.quantity, productId]);

//   const handleDecreaseQuantity = async () => {
//     if (quantity <= 1) return;
//     const newQty = quantity - 1;
//     setQuantity(newQty);
//     if (isAlreadyAdded && product) {
//       try {
//         await updateQuantity(product.id, newQty);
//       } catch {
//         toast.error("Failed to update quantity", { id: "qty-update-error" });
//       }
//     }
//   };

//   const handleIncreaseQuantity = async () => {
//     if (!product) return;
//     const maxStock = product.stock ?? 0;
//     if (quantity >= maxStock) {
//       toast.error(`Only ${maxStock} item(s) available in stock`, { id: "max-stock-reached" });
//       return;
//     }
//     const newQty = quantity + 1;
//     setQuantity(newQty);
//     if (isAlreadyAdded) {
//       try {
//         await updateQuantity(product.id, newQty);
//       } catch {
//         toast.error("Failed to update quantity", { id: "qty-update-error" });
//       }
//     }
//   };

//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         setSelectedImageIndex(0);
//         window.scrollTo(0, 0);
//         const res = await api.get(`/user/shop/product/${productId}`);
//         setProduct(normalizeProduct(res.data.product));
//         setRelatedProducts((res.data.relatedProducts || []).map(normalizeProduct));
//       } catch (err) {
//         const _e = err as any;
//         console.error(err);
//         setError(_e.response?.status === 404 ? "Product not found" : "Error loading product");
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (productId) fetchProduct();
//   }, [productId]);

//   useEffect(() => {
//     const scrollContainer = document.querySelector(".h-screen.overflow-y-auto") as HTMLElement;
//     if (showDeliveryModal) {
//       document.body.style.overflow = "hidden";
//       if (scrollContainer) scrollContainer.style.overflow = "hidden";
//     } else {
//       document.body.style.overflow = "";
//       if (scrollContainer) scrollContainer.style.overflow = "";
//     }
//     return () => {
//       document.body.style.overflow = "";
//       if (scrollContainer) scrollContainer.style.overflow = "";
//     };
//   }, [showDeliveryModal]);

//   const handleMainAddToCart = async (e: React.FormEvent | React.MouseEvent) => {
//     e.preventDefault();
//     if (!product) return;
//     if (!user.isAuthenticated) {
//       window.dispatchEvent(new CustomEvent("openCustomerAuth"));
//       return;
//     }
//     if ((product.stock ?? 0) <= 0) {
//       toast.error("Sorry, this product is out of stock.", { id: "sorry product is out of stooooooooooockkkk" });
//       return;
//     }

//     if (isAlreadyAdded) {
//       toast.success("Already in your cart!", { id: "already-in-cart" });
//       return;
//     }

//     setIsAdding(true);
//     try {
//       if (addToCart) {
//         await addToCart(product.id, { quantity });
//         toast.success(`Added ${product.name} (${quantity}) to cart`, { id: "added productsss" });
//       } else {
//         const cartData = { productId: product.id, quantity };
//         await api.post(`/cart/add`, cartData);
//         fetchCart();
//         toast.success(`${product.name} added to cart!`, { id: "added to cart done" });
//       }
//     } catch (err) {
//       const _e = err as any;
//       if (_e.response?.status === 401) {
//         window.dispatchEvent(new CustomEvent("openCustomerAuth"));
//       } else {
//         toast.error("Failed to add to cart", { id: "failedddddddd" });
//       }
//     } finally {
//       setIsAdding(false);
//     }
//   };

//   const handleBuyNow = (e: React.MouseEvent) => {
//     e.preventDefault();
//     if (!product) return;
//     if (!user.isAuthenticated) {
//       window.dispatchEvent(new CustomEvent("openCustomerAuth"));
//       return;
//     }
//     if ((product.stock ?? 0) <= 0) {
//       toast.error("Sorry, this product is out of stock.", { id: "buynow-oos" });
//       return;
//     }
//     setShowDeliveryModal(true);
//   };

//   const handleRelatedAddToCart = async (productId: string): Promise<void> => {
//     if (!addToCart) return;

//     try {
//       await addToCart(productId);
//       toast.success("Added to cart", { id: "added-related-product-to-cart" });
//     } catch (err: any) {
//       if (err?.message !== "Not authenticated") {
//         toast.error(err?.response?.data?.message || "Failed to add to cart", {
//           id: "failed-related-add-to-cart",
//         });
//       }
//     }
//   };

//   const handleToggleWishlist = async () => {
//     if (!user?.isAuthenticated) return toast.error("Please log in to use wishlist",{id:"please be login"});
//     if (!product) return;
//     const success = await toggleWishlist(product.id);
//     if (success) {
//       toast.success(isInWishlist ? "Removed from Wishlist" : "Added to Wishlist!",{id:"removed or add to wishlist"});
//     }
//   };

//   if (loading) return <div className="h-screen flex justify-center items-center bg-white"><BeatLoader color="#000" /></div>;
//   if (error || !product) return <div className="text-center py-20 text-red-600 font-semibold">{error || "Unavailable"}</div>;

//   const allImages = [product.image, ...(product.images ?? [])].filter(Boolean) as string[];
//   const getImgSrc = (img: string) => normalizeProduct({ image: img }).image || "https://placehold.co/600x800?text=No+Image";
//   const galleryImages = allImages.length > 0 ? allImages : [""];

//   const stock = product.stock ?? 0;
//   const isOutOfStock = stock <= 0;
//   const categoryName = safeRender(product.category, "Collection");
//   const hasDiscount = !!(product.discount && product.discount > 0);
//   const discountedPrice = hasDiscount ? product.price * (1 - product.discount! / 100) : product.price;

//   return (
//     <div className="bg-white min-h-screen font-sans">
//       <main className="max-w-7xl mx-auto px-4 pt-8 pb-16 sm:px-6 lg:px-8 mt-16">
        
//         {/* --- BREADCRUMB / BACK --- */}
//         <div className="mb-6 pt-4">
//           <button
//             onClick={() => navigate(-1)}
//             className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors duration-300"
//           >
//             <ArrowLeftIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
//             Go Back
//           </button>
//         </div>

//         <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 items-start">
          
//           {/* --- LEFT: PORTRAIT IMAGE GALLERY (3:4 Portrait with slightly curved corners) --- */}
//           <motion.div 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6 }}
//             className="flex flex-col gap-4 mb-8 lg:mb-0"
//           >
//             {/* Reduced edge radius to rounded-xl */}
//             <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-50 border border-gray-200/60 group shadow-sm">
//               <div
//                 className="flex h-full transition-transform duration-300 ease-in-out"
//                 style={{
//                   width: `${galleryImages.length * 100}%`,
//                   transform: `translateX(-${(selectedImageIndex * 100) / galleryImages.length}%)`,
//                 }}
//               >
//                 {galleryImages.map((img, i) => (
//                   <div
//                     key={i}
//                     className="relative h-full flex-shrink-0"
//                     style={{ width: `${100 / galleryImages.length}%` }}
//                   >
//                     <img
//                       src={getImgSrc(img)}
//                       alt={`${safeRender(product.name)} view ${i + 1}`}
//                       className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
//                     />
//                   </div>
//                 ))}
//               </div>

//               {/* Category Overlay Badge (Top Left) */}
//               <div className="absolute top-4 left-4 pointer-events-none">
//                 <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-900 backdrop-blur-md shadow-sm">
//                   {categoryName}
//                 </span>
//               </div>

//               {/* Wishlist Button Overlay (Top Right) */}
//               <button
//                 onClick={handleToggleWishlist}
//                 className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95"
//                 title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
//               >
//                 <Heart className={classNames("h-5 w-5 transition-colors", isInWishlist ? "fill-red-500 text-red-500" : "text-gray-900")} />
//               </button>

//               {/* Prev / Next arrows */}
//               {galleryImages.length > 1 && (
//                 <>
//                   <button
//                     onClick={() => setSelectedImageIndex(i => Math.max(0, i - 1))}
//                     disabled={selectedImageIndex === 0}
//                     className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-gray-800 hover:bg-white disabled:opacity-30 transition-all duration-200"
//                     aria-label="Previous image"
//                   >
//                     <ChevronLeftIcon className="h-5 w-5" />
//                   </button>
//                   <button
//                     onClick={() => setSelectedImageIndex(i => Math.min(galleryImages.length - 1, i + 1))}
//                     disabled={selectedImageIndex === galleryImages.length - 1}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-gray-800 hover:bg-white disabled:opacity-30 transition-all duration-200"
//                     aria-label="Next image"
//                   >
//                     <ChevronRightIcon className="h-5 w-5" />
//                   </button>
//                 </>
//               )}

//               {/* Image count indicator */}
//               {galleryImages.length > 1 && (
//                 <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full pointer-events-none">
//                   {selectedImageIndex + 1} / {galleryImages.length}
//                 </div>
//               )}
//             </div>

//             {/* Thumbnail Strip */}
//             {galleryImages.length > 1 && (
//               <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
//                 {galleryImages.map((img, i) => (
//                   <button
//                     key={i}
//                     onClick={() => setSelectedImageIndex(i)}
//                     className={`flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
//                       i === selectedImageIndex
//                         ? "border-gray-900 shadow-md scale-105"
//                         : "border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100"
//                     }`}
//                   >
//                     <img
//                       src={getImgSrc(img)}
//                       alt={`${safeRender(product.name)} view ${i + 1}`}
//                       className="w-full h-full object-cover"
//                     />
//                   </button>
//                 ))}
//               </div>
//             )}
//           </motion.div>

//           {/* --- RIGHT: PRODUCT DETAILS & BLACK BUTTON STACK --- */}
//           <motion.div 
//              initial={{ opacity: 0, x: 20 }}
//              animate={{ opacity: 1, x: 0 }}
//              transition={{ duration: 0.6, delay: 0.2 }}
//              className="px-2 sm:px-0 lg:sticky lg:top-24"
//           >
//             {/* Title */}
//             <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 font-sans mb-1">
//               {safeRender(product.name)}
//             </h1>

//             {/* Brand / Subtitle */}
//             {product.brand && (
//               <p className="text-xs  text-gray-500 mb-3">
//                 {product.brand}
//               </p>
//             )}

//             {/* Restored Rating Display Always Visible */}
//             <div className="flex items-center gap-2 mb-4">
//               <StarDisplay rating={product.rating || 0} />
              
//             </div>

//             {/* Price Header with Green Discount Percentage Badge */}
//             <div className="mb-6">
//               <div className="flex flex-wrap items-center gap-3">
//                 {hasDiscount ? (
//                   <>
//                     <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
//                       Rs. {discountedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </span>
//                     <span className="text-base text-gray-400 line-through">
//                       Rs. {product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </span>
//                     {/* Vibrant Green Discount Badge */}
//                     <span className="inline-flex items-center  px-2.5 py-1 text-xs font-extrabold text-emerald-800 ">
//                       {product.discount}% OFF
//                     </span>
//                   </>
//                 ) : (
//                   <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
//                     Rs. {product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                   </span>
//                 )}
//               </div>
//             </div>

//             {/* Quantity Control */}
//             {!isOutOfStock && (
//               <div className="mb-6">
//                 <label className="block text-xs font-bold text-neutral-900 mb-2">
//                   Quantity
//                 </label>
//                 <div className="inline-flex items-center border border-gray-300 rounded-md bg-white overflow-hidden shadow-sm">
//                   <button
//                     type="button"
//                     onClick={handleDecreaseQuantity}
//                     disabled={quantity <= 1}
//                     className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
//                   >
//                     <MinusIcon className="h-4 w-4" strokeWidth={2.5} />
//                   </button>
//                   <span className="px-5 text-sm font-bold text-neutral-900 select-none">
//                     {quantity}
//                   </span>
//                   <button
//                     type="button"
//                     onClick={handleIncreaseQuantity}
//                     disabled={quantity >= stock}
//                     className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
//                   >
//                     <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* Action Buttons Stack */}
//             <div className="flex flex-col gap-3 mb-8">
//               {/* Add to Cart Button */}
//               <button
//                 onClick={handleMainAddToCart}
//                 disabled={isAdding || isOutOfStock || isAlreadyAdded}
//                 className={`w-full py-4 text-xs font-bold uppercase tracking-widest transition-all rounded-sm text-center
//                   ${(isOutOfStock || isAdding || isAlreadyAdded) 
//                     ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
//                     : "bg-black text-white hover:bg-neutral-800"
//                   }`}
//               >
//                 {isAdding ? <BeatLoader size={8} color="#fff" /> : 
//                  isOutOfStock ? "Out of Stock" : 
//                  isAlreadyAdded ? "In Cart" : "ADD TO CART"}
//               </button>

//               {/* Buy Now Button */}
//               <button
//                 onClick={handleBuyNow}
//                 disabled={isAdding || isOutOfStock}
//                 className={`w-full py-4 text-xs font-bold uppercase tracking-widest transition-all rounded-sm text-center border-2 border-black
//                   ${(isOutOfStock || isAdding)
//                     ? "border-gray-300 text-gray-400 cursor-not-allowed bg-transparent"
//                     : "bg-black text-white hover:bg-neutral-800"
//                   }`}
//               >
//                 {isAdding ? <BeatLoader size={8} color="#fff" /> : "BUY IT NOW"}
//               </button>
//             </div>

//             {/* Product Description */}
//             <div className="mb-8 rounded-xl bg-gray-50/70 p-5 border border-gray-100">
//               <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2">Description</h3>
//               <div 
//                 className="prose prose-sm prose-neutral max-w-none text-gray-600 leading-relaxed text-sm"
//                 dangerouslySetInnerHTML={{ __html: product.description || "<p>No description available.</p>" }} 
//               />
//             </div>

//             {/* Details Accordions */}
//             <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
//               {STATIC_DETAILS.map((detail) => (
//                 <Disclosure key={detail.name} as="div">
//                   {({ open }) => (
//                     <>
//                       <dt>
//                         <DisclosureButton className="flex w-full items-center justify-between py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-black">
//                           <span className="flex items-center gap-3">
//                             {detail.icon}
//                             {detail.name}
//                           </span>
//                           <span className="ml-6 flex items-center text-gray-400">
//                             {open ? <MinusIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
//                           </span>
//                         </DisclosureButton>
//                       </dt>
//                       <DisclosurePanel as="dd" className="pb-4 pt-1">
//                         <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
//                           {detail.items.map((item) => (
//                             <li key={item}>{item}</li>
//                           ))}
//                         </ul>
//                       </DisclosurePanel>
//                     </>
//                   )}
//                 </Disclosure>
//               ))}
//             </div>
            
//           </motion.div>
//         </div>

//         {/* --- RELATED PRODUCTS --- */}
//         {relatedProducts.length > 0 && (
//           <section className="mt-28">
//             <div className="text-center mb-12">
//               <motion.h2 
//                 initial={{ opacity: 0, y: 20 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 viewport={{ once: true }}
//                 className="text-2xl font-bold tracking-tight sm:text-3xl font-sans"
//               >
//                 You May Also Like
//               </motion.h2>
//               <div className="h-0.5 bg-[var(--theme-primary)] mx-auto mt-3 rounded-full w-16" />
//             </div>

//             <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
//               {relatedProducts.map((item) => (
//                 <ModernProductCard 
//                   key={item.id} 
//                   product={item} 
//                   addToCart={handleRelatedAddToCart}
//                   cartItems={cartItems}
//                 />
//               ))}
//             </div>
//           </section>
//         )}

//         {/* ── Reviews ── */}
//         {productId && (
//           <ReviewSection
//             productId={productId}
//             isAuthenticated={user.isAuthenticated}
//             onReviewChange={async () => {
//               try {
//                 const res = await api.get(`/user/shop/product/${productId}`);
//                 setProduct(normalizeProduct(res.data.product));
//               } catch (err) {
//                 console.error("Error refreshing product rating:", err);
//               }
//             }}
//           />
//         )}
//       </main>

//       <FooterSection/>

//       {/* Delivery Modal */}
//       {product && (
//         <DeliveryLocationModal
//           isOpen={showDeliveryModal}
//           onClose={() => setShowDeliveryModal(false)}
//           product={{ id: product.id, name: safeRender(product.name), price: hasDiscount ? discountedPrice : (product.price ?? 0), quantity: quantity }}
//         />
//       )}
//     </div>
//   );
// }




import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { sanitizeHtml } from "../utils/sanitizeHtml";
import {
  MinusIcon,
  PlusIcon,
  ArrowLeftIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { 
  Heart, 
  ShoppingBag, 
  Check, 
  ArrowRight
} from "lucide-react";
import { BeatLoader } from "react-spinners";
import toast from 'react-hot-toast';
import { motion } from "framer-motion";
import FooterSection from "../components/FooterSection";
import DeliveryLocationModal from "./DeliveryLocationModal";

// Components & Context
import api from "../utils/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { normalizeProduct } from "../utils/product";
import PageSeo from "../components/seo/PageSeo";
import { ProductJsonLd, BreadcrumbJsonLd } from "../components/seo/JsonLd";

interface ProductVariantOption {
  id: string;
  /** Admin-named axes, e.g. { Storage: "128GB", Color: "Black" } or { Weight: "1kg" }
   * — see backend/src/models/mongoose.ts's ProductVariant. */
  options: Record<string, string>;
  stock: number;
  priceOverride: number | null;
  /** Falls back to the product's own discount when null — see ProductVariant. */
  discountOverride: number | null;
  isActive: boolean;
  /** This variant's own rating, independent of the parent product's overall rating —
   * see review.controller.ts's recalcVariantRating. 0 until it has its own reviews. */
  rating?: number;
  numReviews?: number;
}

interface DetailProduct {
  id: string;
  code?: string;
  name: string;
  brand?: string;
  price: number;
  image?: string;
  images?: string[];
  stock?: number;
  description?: string;
  category?: { name?: string } | string;
  discount?: number;
  sizes?: string[];
  rating?: number;
  numReviews?: number;
  metaTitle?: string;
  metaDescription?: string;
  /** Present only when an admin has defined size/color combinations for this product
   * (see ProductVariant) — an empty/absent array means it's a plain single-SKU
   * product, same as every product before this feature existed. */
  variants?: ProductVariantOption[];
}

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  stock?: number;
  category?: { name?: string } | string;
  discount?: number;
}

interface ReviewUser {
  id: string;
  username: string;
  avatar?: string;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  variantId?: string | null;
  createdAt: string;
  user: ReviewUser;
}

interface ReviewDistribution {
  star: number;
  count: number;
}

// ── Star Rating Display ───────────────────────────────────────────────────────
function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        star <= Math.round(rating)
          ? <StarSolid key={star} className={`${sz} text-amber-500`} />
          : <StarIcon key={star} className={`${sz} text-neutral-200`} />
      ))}
    </div>
  );
}

// ── Interactive Star Picker ───────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(value === star ? star - 1 : star)}
          className="transition-all hover:scale-110 active:scale-95 text-neutral-300 hover:text-amber-500"
        >
          {(hovered || value) >= star
            ? <StarSolid className="h-7 w-7 text-amber-500" />
            : <StarIcon className="h-7 w-7 text-neutral-300" />}
        </button>
      ))}
    </div>
  );
}

// ── Clean Minimal Standard Review Section ───────────────────────────────────
function ReviewSection({
  productId,
  variantId,
  variantLabel,
  needsVariantSelection,
  optionAxesLabel,
  isAuthenticated,
  onReviewChange,
}: {
  productId: string;
  /** The currently-selected variant, if the product has variants — reviews and the
   * rating shown here are scoped to this exact variant, independently of any other
   * option of the same product (see review.controller.ts's recalcVariantRating). */
  variantId?: string | null;
  /** e.g. "65W" or "128GB / Black" — shown so it's unambiguous which option a review
   * will attach to, instead of silently landing on the whole product. */
  variantLabel?: string | null;
  /** True when the product has variants but none is selected yet — same guard
   * add-to-cart/wishlist already use (see ProductDetailPage's needsVariantSelection),
   * applied here too so a review can't silently fall back to a product-level review
   * the shopper never intended. */
  needsVariantSelection?: boolean;
  /** e.g. "Power" or "Storage / Color" — used in the prompt telling the shopper what
   * to pick before they can review. */
  optionAxesLabel?: string;
  isAuthenticated: boolean;
  onReviewChange?: () => Promise<unknown> | void;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avg, setAvg] = useState(0);
  const [distribution, setDistribution] = useState<ReviewDistribution[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [, setCanReview] = useState(false);
  const [featureEnabled, setFeatureEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const handleOpenForm = () => {
      if (isAuthenticated && !myReview) {
        setEditMode(false);
        setShowForm(true);
      } else if (!isAuthenticated) {
        window.dispatchEvent(new CustomEvent("openCustomerAuth"));
      }
    };
    window.addEventListener("open-review-form", handleOpenForm);
    return () => window.removeEventListener("open-review-form", handleOpenForm);
  }, [isAuthenticated, myReview]);

  const loadReviews = useCallback(async () => {
    try {
      const res = await api.get(`/reviews/${productId}`, { params: variantId ? { variantId } : undefined });
      setReviews(res.data.reviews);
      setAvg(res.data.avg);
      setDistribution(res.data.distribution);
      setFeatureEnabled(true);
    } catch (err: unknown) {
      if ((err as { response?: { status?: number } }).response?.status === 403) {
        setFeatureEnabled(false);
      }
    }
  }, [productId, variantId]);

  const loadMyReview = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get(`/reviews/my/${productId}`, { params: variantId ? { variantId } : undefined });
      setMyReview(res.data.review || null);
      setCanReview(res.data.canReview);
      if (res.data.review) {
        setRating(res.data.review.rating);
        setComment(res.data.review.comment || "");
      } else {
        // No review for THIS variant — reset the form instead of leaving a stale
        // rating/comment from whichever variant was selected before.
        setRating(5);
        setComment("");
      }
    } catch {
      // ignore
    }
  }, [productId, variantId, isAuthenticated]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadReviews(), loadMyReview()]).finally(() => setLoading(false));
  }, [loadReviews, loadMyReview]);

  if (!featureEnabled) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Not just a UI nicety — without this, submitting with the option picker still
    // untouched would silently save a whole-product review instead of the specific
    // variant the shopper thinks they're rating.
    if (!editMode && needsVariantSelection) {
      toast.error(`Select ${optionAxesLabel ?? "an option"} above before writing a review.`, { id: "review-needs-variant" });
      return;
    }
    setSubmitting(true);
    try {
      if (editMode && myReview) {
        const reviewId = myReview.id || (myReview as any)._id;
        await api.patch(`/reviews/${reviewId}`, { rating, comment });
        toast.success("Review updated!", { id: "review-update" });
      } else {
        await api.post(`/reviews/${productId}`, { rating, comment, variantId: variantId ?? undefined });
        toast.success("Review submitted!", { id: "review-submit" });
      }
      await Promise.all([loadReviews(), loadMyReview()]);
      if (onReviewChange) await onReviewChange();
      setShowForm(false);
      setEditMode(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to submit review";
      toast.error(msg, { id: "review-error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;
    try {
      const reviewId = myReview.id || (myReview as any)._id;
      await api.delete(`/reviews/${reviewId}`);
      toast.success("Review deleted", { id: "review-delete" });
      setMyReview(null);
      setRating(5);
      setComment("");
      setShowForm(false);
      await loadReviews();
      if (onReviewChange) onReviewChange();
    } catch {
      toast.error("Failed to delete review", { id: "review-delete-err" });
    }
  };

  const startEdit = () => {
    if (!myReview) return;
    setRating(myReview.rating);
    setComment(myReview.comment || "");
    setEditMode(true);
    setShowForm(true);
  };

  const totalReviews = reviews.length;
  const sortedDistribution = [...distribution].sort((a, b) => b.star - a.star);

  return (
    <section id="reviews-section" className="mt-16 pt-6 max-w-4xl mx-auto px-4 font-sans">
      
      {/* ── Section Header (Line removed above) ── */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-gray-900 uppercase">
            Customer Reviews
          </h2>
          {variantLabel && (
            <p className="text-xs text-gray-500 mt-1">Showing reviews for: <span className="font-semibold text-gray-700">{variantLabel}</span></p>
          )}
        </div>

        {isAuthenticated ? (
          !myReview && !showForm && (
            needsVariantSelection ? (
              <p className="text-xs text-gray-400 italic max-w-[220px] text-right">
                Select {optionAxesLabel ?? "an option"} above to write a review
              </p>
            ) : (
              <button
                onClick={() => { setEditMode(false); setShowForm(true); }}
                className="bg-black text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all rounded-sm"
              >
                Write a Review
              </button>
            )
          )
        ) : (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("openCustomerAuth"))}
            className="bg-black text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all rounded-sm"
          >
            Log in to Write a Review
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <BeatLoader size={8} color="#000" />
        </div>
      ) : (
        <div className="pt-8">
          {/* ── Summary Row: Score & Progress Bars ── */}
          {totalReviews > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 items-start pb-10 border-b border-gray-200">
              
              {/* Score summary */}
              <div className="sm:col-span-5 flex flex-col items-start">
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-extrabold text-gray-900 tracking-tight">
                    {avg.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-400 font-medium">out of 5</span>
                </div>
                <div className="mt-2">
                  <StarDisplay rating={avg} size="lg" />
                </div>
                <p className="text-xs text-gray-500 mt-2 font-medium">
                  Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
                </p>
              </div>

              {/* Progress Bars */}
              <div className="sm:col-span-7 space-y-2">
                {sortedDistribution.map(({ star, count }) => {
                  const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-xs text-gray-600 font-medium">
                      <span className="w-10 text-gray-500">{star} ★</span>
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full bg-gray-900 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-gray-400 font-mono text-[11px]">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 pb-10 border-b border-gray-200">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">No reviews yet. Be the first to review this product!</p>
            </div>
          )}

          {/* ── Form Section ── */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="my-8 p-6 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 pb-2 border-b border-gray-200">
                {editMode ? "Edit your review" : "Write a review"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Rating</label>
                  <StarPicker value={rating} onChange={setRating} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Review Comment</label>
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write your review here..."
                    className="w-full bg-white border border-gray-300 rounded-sm p-3 text-sm text-gray-900 focus:border-black focus:outline-none transition-colors"
                  />
                  <p className="mt-1 text-right text-[11px] text-gray-400 font-mono">{comment.length}/1000</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditMode(false); }}
                    className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors rounded-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || rating === 0}
                    className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-gray-800 disabled:opacity-50 transition-colors rounded-sm flex items-center gap-2"
                  >
                    {submitting ? <BeatLoader size={6} color="#fff" /> : editMode ? "Update" : "Submit"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ── User's Active Review ── */}
          {myReview && !showForm && (
            <div className="my-6 p-5 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <StarDisplay rating={myReview.rating} />
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Your Review</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <button onClick={startEdit} className="font-bold text-gray-700 hover:text-black hover:underline">Edit</button>
                  <span className="text-gray-300">•</span>
                  <button onClick={handleDelete} className="font-bold text-red-600 hover:text-red-800 hover:underline">Delete</button>
                </div>
              </div>
              {myReview.comment ? (
                <p className="text-sm text-gray-700 leading-relaxed mt-2">{myReview.comment}</p>
              ) : (
                <p className="text-xs italic text-gray-400 mt-1">Rating left without written comment.</p>
              )}
            </div>
          )}

          {/* ── Reviews Stream List ── */}
          {reviews.length > 0 && (
            <div className="divide-y divide-gray-200">
              {reviews.map((r) => (
                <div key={r.id || (r as any)._id} className="py-7 first:pt-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">{r.user.username}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  <div className="mb-2">
                    <StarDisplay rating={r.rating} />
                  </div>

                  {r.comment && (
                    <p className="text-sm text-gray-700 leading-relaxed max-w-3xl whitespace-pre-line">
                      {r.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// --- HELPERS ---
const safeRender = (value: unknown, fallback = ""): string => {
  if (!value) return fallback;
  if (typeof value === 'object' && value !== null && 'name' in value) return (value as {name: string}).name;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

function classNames(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

// --- MODERN CARD COMPONENT ---
const ModernProductCard = React.memo(function ModernProductCard({ product, addToCart, cartItems }: { product: RelatedProduct; addToCart: (productId: string) => Promise<unknown>; cartItems: { productId: string }[] }) {
  const navigate = useNavigate();
  const isInCart = cartItems.some((item) => String(item.productId) === String(product.id));
  const imageUrl = product.image || "https://placehold.co/600x800?text=No+Image";

  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
    window.scrollTo(0,0);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInCart) {
      toast.error("This item is already in your cart", { id: "This item is already in your cartmnmnm" });
      return;
    }

    try {
      await addToCart(product.id);
      toast.success(`${product.name} added to cart`, { id: "added-to-cart-related-product" });
    } catch (err: any) {
      if (err?.message !== "Not authenticated") {
        toast.error(err?.response?.data?.message || "Failed to add to cart", {
          id: "failed-add-related-product",
        });
      }
    }
  };

  const { isProductInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isProductInWishlist(product.id);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await toggleWishlist(product.id);
    if (success) {
      toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist", {id:"wishlist-toggle-related"});
    }
  };

  const categoryName = typeof product.category === 'object' 
    ? product.category?.name 
    : product.category;

  return (
    <div 
      onClick={handleCardClick}
      className="group relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-xl bg-gray-100 transition-all hover:shadow-2xl hover:-translate-y-1"
    >
      <img
        src={imageUrl}
        alt={product.name}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="absolute left-4 top-4">
        <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-900 backdrop-blur-md">
          {categoryName || "Collection"}
        </span>
      </div>

      <div className="absolute right-4 top-4 flex flex-col gap-3">
        <button
          onClick={handleToggleWishlist}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95"
        >
          <Heart className={classNames("h-5 w-5 transition-colors", isWishlisted ? "fill-red-500 text-red-500" : "text-gray-900")} />
        </button>
        <button
          onClick={handleAddToCart}
          className={classNames(
            "flex h-10 w-10 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95",
            isInCart ? "bg-green-100 text-green-700 cursor-default" : "bg-white/90 text-gray-900 hover:bg-black hover:text-white"
          )}
        >
          {isInCart ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
        </button>
      </div>

      <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-90 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <div className="flex items-center justify-between rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur-xl border border-white/50">
          <div className="flex flex-col truncate pr-2">
            <h3 className="truncate text-sm font-bold text-gray-900">{product.name}</h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              {product.discount && product.discount > 0 ? (
                <>
                  <span className="text-xs font-bold text-gray-900">
                    ₹{(product.price * (1 - product.discount / 100)).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-gray-400 line-through">
                    ₹{product.price?.toFixed(2)}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">
                    {product.discount}% OFF
                  </span>
                </>
              ) : (
                <span className="text-xs font-bold text-gray-500">
                  ₹{product.price?.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 group-hover:bg-black group-hover:text-white transition-colors duration-300">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
});

// --- MAIN DETAIL PAGE COMPONENT ---
export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  // Arriving from a listing card that already represents one specific variant (see
  // components/AllProducts.tsx / cart/CategoryProductPage.tsx's expanded cards) —
  // that option should already be selected here, not reset to "pick an option".
  const [searchParams] = useSearchParams();
  const preselectedVariantId = searchParams.get("variantId");
  const [product, setProduct] = useState<DetailProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);

  const { cartItems, addToCart, fetchCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const { isProductInWishlist, toggleWishlist } = useWishlist();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState<number>(1);
  // Empty until the shopper picks every axis — see the option picker below and the
  // auto-select effect further down (skips the picker for axes with only one option).
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Admin-named axes actually used by this product's variants — e.g. ["Storage",
  // "Color"] for a phone, ["Weight"] for groceries, [] for a plain single-SKU
  // product. Order follows first appearance across variants (Set preserves
  // insertion order), so the picker's row order matches how the admin built them.
  // Memoized: this and activeVariants below were previously recomputed from scratch
  // on every render (including every quantity/selectedOptions keystroke) even though
  // they only ever change when the fetched product itself changes.
  const optionAxes = useMemo(
    () => [...new Set((product?.variants ?? []).flatMap((v) => Object.keys(v.options || {})))],
    [product?.variants],
  );
  const hasVariants = (product?.variants?.length ?? 0) > 0;
  // Used in validation toasts/buttons below — e.g. "Storage / Color" or "Weight".
  const optionAxesLabel = optionAxes.join(" / ") || "an option";
  // product.variants includes disabled variants too now (see product-user.controller.ts's
  // productCard) so the option picker's display order stays fixed regardless of which
  // ones an admin has toggled off — but a customer can only ever land on an active one.
  const activeVariants = useMemo(
    () => (product?.variants ?? []).filter((v) => v.isActive),
    [product?.variants],
  );

  const selectedVariant = hasVariants
    ? activeVariants.find((v) =>
        optionAxes.every((axis) => v.options[axis] === selectedOptions[axis]),
      ) ?? null
    : null;

  // For a variant product, "in wishlist" means this SPECIFIC option is saved — matches
  // ModernProductCard's own listing-level (productId, variantId) identity, so wishing
  // one size doesn't show every other size as saved too.
  const isInWishlist = product ? isProductInWishlist(product.id, selectedVariant?.id ?? null) : false;

  // Once a product has variants, ITS OWN stock/price are meaningless (see
  // product-user.controller.ts's productCard) — everything below reads from the
  // selected variant instead, falling back to the product's own fields for a plain
  // single-SKU product (selectedVariant is always null for those).
  const effectiveStock = selectedVariant ? selectedVariant.stock : hasVariants ? 0 : (product?.stock ?? 0);
  const effectivePrice = selectedVariant?.priceOverride ?? product?.price ?? 0;
  // A variant's own discount (e.g. a promo on just one option) wins over the
  // product-level one — see mongoose.ts's ProductVariant discountOverride.
  const effectiveDiscount = selectedVariant?.discountOverride ?? product?.discount ?? 0;

  // A ?variantId= from the listing card wins outright — select every axis of that
  // exact variant. Otherwise fall back to pre-selecting any axis that only has one
  // real value, so the shopper isn't asked to click a choice that isn't actually one.
  // Resets whenever the product itself changes.
  useEffect(() => {
    const preselected = preselectedVariantId
      ? activeVariants.find((v) => v.id === preselectedVariantId)
      : null;
    if (preselected) {
      setSelectedOptions({ ...preselected.options });
      return;
    }
    const initial: Record<string, string> = {};
    optionAxes.forEach((axis) => {
      const values = [...new Set(activeVariants.map((v) => v.options[axis]).filter(Boolean))];
      if (values.length === 1) initial[axis] = values[0];
    });
    setSelectedOptions(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, preselectedVariantId]);

  const cartItem = cartItems.find(
    (item) =>
      String(item.productId) === String(productId) &&
      String(item.variantId ?? "") === String(selectedVariant?.id ?? ""),
  );
  const isAlreadyAdded = !!cartItem;

  useEffect(() => {
    if (cartItem && cartItem.quantity) {
      setQuantity(cartItem.quantity);
    } else {
      setQuantity(1);
    }
  }, [cartItem?.quantity, productId, selectedVariant?.id]);

  const handleDecreaseQuantity = async () => {
    if (quantity <= 1) return;
    const newQty = quantity - 1;
    setQuantity(newQty);
    if (isAlreadyAdded && product) {
      try {
        await updateQuantity(product.id, newQty, selectedVariant?.id ?? null);
      } catch {
        toast.error("Failed to update quantity", { id: "qty-update-error" });
      }
    }
  };

  const handleIncreaseQuantity = async () => {
    if (!product) return;
    if (hasVariants && !selectedVariant) {
      toast.error(`Please select ${optionAxesLabel} first`, { id: "select-variant-first" });
      return;
    }
    if (quantity >= effectiveStock) {
      toast.error(`Only ${effectiveStock} item(s) available in stock`, { id: "max-stock-reached" });
      return;
    }
    const newQty = quantity + 1;
    setQuantity(newQty);
    if (isAlreadyAdded) {
      try {
        await updateQuantity(product.id, newQty, selectedVariant?.id ?? null);
      } catch {
        toast.error("Failed to update quantity", { id: "qty-update-error" });
      }
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        setSelectedImageIndex(0);
        window.scrollTo(0, 0);
        const res = await api.get(`/user/shop/product/${productId}`);
        setProduct(normalizeProduct(res.data.product));
        setRelatedProducts((res.data.relatedProducts || []).map(normalizeProduct));
      } catch (err) {
        const _e = err as any;
        console.error(err);
        setError(_e.response?.status === 404 ? "Product not found" : "Error loading product");
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchProduct();
  }, [productId]);

  useEffect(() => {
    const scrollContainer = document.querySelector(".h-screen.overflow-y-auto") as HTMLElement;
    if (showDeliveryModal) {
      document.body.style.overflow = "hidden";
      if (scrollContainer) scrollContainer.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      if (scrollContainer) scrollContainer.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      if (scrollContainer) scrollContainer.style.overflow = "";
    };
  }, [showDeliveryModal]);

  const handleMainAddToCart = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!user.isAuthenticated) {
      window.dispatchEvent(new CustomEvent("openCustomerAuth"));
      return;
    }
    if (hasVariants && !selectedVariant) {
      toast.error(`Please select ${optionAxesLabel}`, { id: "select-variant-first" });
      return;
    }
    if (effectiveStock <= 0) {
      toast.error("Sorry, this product is out of stock.", { id: "sorry product is out of stooooooooooockkkk" });
      return;
    }

    if (isAlreadyAdded) {
      toast.success("Already in your cart!", { id: "already-in-cart" });
      return;
    }

    setIsAdding(true);
    try {
      if (addToCart) {
        await addToCart(product.id, { quantity, variantId: selectedVariant?.id ?? null });
        toast.success(`Added ${product.name} (${quantity}) to cart`, { id: "added productsss" });
      } else {
        const cartData = { productId: product.id, quantity, variantId: selectedVariant?.id ?? null };
        await api.post(`/cart/add`, cartData);
        fetchCart();
        toast.success(`${product.name} added to cart!`, { id: "added to cart done" });
      }
    } catch (err) {
      const _e = err as any;
      if (_e.response?.status === 401) {
        window.dispatchEvent(new CustomEvent("openCustomerAuth"));
      } else {
        toast.error(_e.response?.data?.message || "Failed to add to cart", { id: "failedddddddd" });
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!user.isAuthenticated) {
      window.dispatchEvent(new CustomEvent("openCustomerAuth"));
      return;
    }
    if (hasVariants && !selectedVariant) {
      toast.error(`Please select ${optionAxesLabel}`, { id: "select-variant-first" });
      return;
    }
    if (effectiveStock <= 0) {
      toast.error("Sorry, this product is out of stock.", { id: "buynow-oos" });
      return;
    }
    setShowDeliveryModal(true);
  };

  const handleRelatedAddToCart = async (productId: string): Promise<void> => {
    if (!addToCart) return;

    try {
      await addToCart(productId);
      toast.success("Added to cart", { id: "added-related-product-to-cart" });
    } catch (err: any) {
      if (err?.message !== "Not authenticated") {
        toast.error(err?.response?.data?.message || "Failed to add to cart", {
          id: "failed-related-add-to-cart",
        });
      }
    }
  };

  const handleToggleWishlist = async () => {
    if (!user?.isAuthenticated) {
      window.dispatchEvent(new CustomEvent("openCustomerAuth"));
      return;
    }
    if (!product) return;
    if (hasVariants && !selectedVariant) {
      toast.error(`Please select ${optionAxesLabel}`, { id: "select-variant-first" });
      return;
    }
    const success = await toggleWishlist(product.id, selectedVariant?.id ?? null);
    if (success) {
      toast.success(isInWishlist ? "Removed from Wishlist" : "Added to Wishlist!",{id:"removed or add to wishlist"});
    }
  };

  if (loading) return <div className="h-screen flex justify-center items-center bg-white"><BeatLoader color="#000" /></div>;
  if (error || !product) return <div className="text-center py-20 text-red-600 font-semibold">{error || "Unavailable"}</div>;

  const allImages = [product.image, ...(product.images ?? [])].filter(Boolean) as string[];
  const getImgSrc = (img: string) => normalizeProduct({ image: img }).image || "https://placehold.co/600x800?text=No+Image";
  const galleryImages = allImages.length > 0 ? allImages : [""];

  const stock = effectiveStock;
  // Distinct from "needs a size/color picked" below — this only means "the selected
  // (or only possible) combination has zero stock," not "nothing picked yet".
  const isOutOfStock = hasVariants ? !!selectedVariant && selectedVariant.stock <= 0 : (product.stock ?? 0) <= 0;
  const needsVariantSelection = hasVariants && !selectedVariant;
  const categoryName = safeRender(product.category, "Collection");
  const hasDiscount = effectiveDiscount > 0;
  const discountedPrice = hasDiscount ? effectivePrice * (1 - effectiveDiscount / 100) : effectivePrice;

  // Meta description falls back to the product's own (HTML) description, stripped to
  // plain text and trimmed to a search-result-friendly length.
  const seoDescription =
    product.metaDescription?.trim() ||
    product.description?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160) ||
    undefined;

  return (
    <div className="bg-white min-h-screen font-sans">
      <PageSeo
        title={product.metaTitle?.trim() || product.name}
        description={seoDescription}
        image={allImages[0]}
        path={`/products/${product.id}`}
      />
      <ProductJsonLd
        product={{
          id: product.id,
          name: product.name,
          description: seoDescription,
          brand: product.brand,
          code: product.code || product.id,
          price: discountedPrice,
          image: product.image,
          images: product.images,
          inStock: !isOutOfStock,
          rating: product.rating,
          numReviews: product.numReviews,
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: categoryName, path: "/products" },
          { name: product.name, path: `/products/${product.id}` },
        ]}
      />
      <main className="max-w-7xl mx-auto px-4 pt-8 pb-16 sm:px-6 lg:px-8 mt-(--app-header-h)">

        {/* --- BREADCRUMB / BACK --- */}
        <div className="mb-6 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors duration-300"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            Go Back
          </button>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 items-start">
          
          {/* --- LEFT: PORTRAIT IMAGE GALLERY (3:4 Portrait with slightly curved corners) --- */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-4 mb-8 lg:mb-0"
          >
            {/* Reduced edge radius to rounded-xl */}
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-50 border border-gray-200/60 group shadow-sm">
              <div
                className="flex h-full transition-transform duration-300 ease-in-out"
                style={{
                  width: `${galleryImages.length * 100}%`,
                  transform: `translateX(-${(selectedImageIndex * 100) / galleryImages.length}%)`,
                }}
              >
                {galleryImages.map((img, i) => (
                  <div
                    key={i}
                    className="relative h-full flex-shrink-0"
                    style={{ width: `${100 / galleryImages.length}%` }}
                  >
                    <img
                      src={getImgSrc(img)}
                      alt={`${safeRender(product.name)} view ${i + 1}`}
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>

              {/* Category Overlay Badge (Top Left) */}
              <div className="absolute top-4 left-4 pointer-events-none">
                <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-900 backdrop-blur-md shadow-sm">
                  {categoryName}
                </span>
              </div>

              {/* Wishlist Button Overlay (Top Right) */}
              <button
                onClick={handleToggleWishlist}
                className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95"
                title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart className={classNames("h-5 w-5 transition-colors", isInWishlist ? "fill-red-500 text-red-500" : "text-gray-900")} />
              </button>

              {/* Prev / Next arrows */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(i => Math.max(0, i - 1))}
                    disabled={selectedImageIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-gray-800 hover:bg-white disabled:opacity-30 transition-all duration-200"
                    aria-label="Previous image"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(i => Math.min(galleryImages.length - 1, i + 1))}
                    disabled={selectedImageIndex === galleryImages.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-gray-800 hover:bg-white disabled:opacity-30 transition-all duration-200"
                    aria-label="Next image"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Image count indicator */}
              {galleryImages.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full pointer-events-none">
                  {selectedImageIndex + 1} / {galleryImages.length}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {galleryImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      i === selectedImageIndex
                        ? "border-[var(--theme-primary)] shadow-md scale-105"
                        : "border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={getImgSrc(img)}
                      alt={`${safeRender(product.name)} view ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* --- RIGHT: PRODUCT DETAILS & BLACK BUTTON STACK --- */}
          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.6, delay: 0.2 }}
             className="px-2 sm:px-0 lg:sticky lg:top-24"
          >
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 font-sans mb-1">
              {safeRender(product.name)}
            </h1>

            {/* Brand / Subtitle */}
            {product.brand && (
              <p className="text-xs text-gray-500 mb-3">
                {product.brand}
              </p>
            )}

            {/* Restored Rating Display Always Visible — the selected variant's own
                rating once one's picked, falling back to the product's overall rating
                for a variant-less product or before any option is chosen. */}
            <div className="flex items-center gap-2 mb-4">
              <StarDisplay rating={selectedVariant?.rating ?? product.rating ?? 0} />
            </div>

            {/* Price Header with Green Discount Percentage Badge */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-3">
                {hasDiscount ? (
                  <>
                    <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
                      Rs. {discountedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-base text-gray-400 line-through">
                      Rs. {effectivePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {/* Vibrant Green Discount Badge */}
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-extrabold text-emerald-800">
                      {effectiveDiscount}% OFF
                    </span>
                  </>
                ) : (
                  <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
                    Rs. {effectivePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>

            {/* Option Pickers — one row per admin-defined axis (Storage, Color, Weight,
                Metal, whatever this product's variants use); a plain single-SKU
                product has optionAxes: [] and none of this renders. */}
            {optionAxes.map((axis) => {
              const axisValues = [...new Set((product.variants ?? []).map((v) => v.options[axis]).filter(Boolean))];
              if (axisValues.length === 0) return null;
              return (
                <div className="mb-5" key={axis}>
                  <label className="block text-xs font-bold text-neutral-900 mb-2">
                    {axis} {selectedOptions[axis] && <span className="font-normal text-gray-500 normal-case">— {selectedOptions[axis]}</span>}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {axisValues.map((value) => {
                      // A value is only truly pickable if it has at least one in-stock
                      // combination once every OTHER already-picked axis is factored in.
                      const stockForValue = activeVariants
                        .filter(
                          (v) =>
                            v.options[axis] === value &&
                            optionAxes.every(
                              (otherAxis) =>
                                otherAxis === axis ||
                                !selectedOptions[otherAxis] ||
                                v.options[otherAxis] === selectedOptions[otherAxis],
                            ),
                        )
                        .reduce((sum, v) => sum + v.stock, 0);
                      const active = selectedOptions[axis] === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setSelectedOptions((prev) => {
                              const next = { ...prev };
                              if (active) delete next[axis];
                              else next[axis] = value;
                              return next;
                            })
                          }
                          disabled={stockForValue <= 0}
                          className={classNames(
                            "min-w-11 px-3 py-2 text-xs font-bold rounded-md border transition-all",
                            active
                              ? "bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] border-[var(--theme-primary)]"
                              : stockForValue <= 0
                                ? "border-gray-200 text-gray-300 cursor-not-allowed line-through"
                                : "border-gray-300 text-neutral-900 hover:border-[var(--theme-primary)]",
                          )}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Quantity Control */}
            {!isOutOfStock && (
              <div className="mb-6">
                <label className="block text-xs font-bold text-neutral-900 mb-2">
                  Quantity
                </label>
                <div className="inline-flex items-center border border-gray-300 rounded-md bg-white overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={handleDecreaseQuantity}
                    disabled={quantity <= 1}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <MinusIcon className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  <span className="px-5 text-sm font-bold text-neutral-900 select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncreaseQuantity}
                    disabled={!needsVariantSelection && quantity >= stock}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons Stack */}
            <div className="flex flex-col gap-3 mb-8">
              {/* Add to Cart Button */}
              <button
                onClick={handleMainAddToCart}
                disabled={isAdding || isOutOfStock || isAlreadyAdded || needsVariantSelection}
                className={`w-full py-4 text-xs font-bold uppercase tracking-widest transition-all rounded-sm text-center
                  ${(isOutOfStock || isAdding || isAlreadyAdded || needsVariantSelection)
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] hover:bg-[var(--theme-primary-hover)]"
                  }`}
              >
                {isAdding ? <BeatLoader size={8} color="#fff" /> :
                 isOutOfStock ? "Out of Stock" :
                 needsVariantSelection ? `Select ${optionAxesLabel}` :
                 isAlreadyAdded ? "In Cart" : "ADD TO CART"}
              </button>

              {/* Buy Now Button */}
              <button
                onClick={handleBuyNow}
                disabled={isAdding || isOutOfStock || needsVariantSelection}
                className={`w-full py-4 text-xs font-bold uppercase tracking-widest transition-all rounded-sm text-center border-2 border-[var(--theme-primary)]
                  ${(isOutOfStock || isAdding || needsVariantSelection)
                    ? "border-gray-300 text-gray-400 cursor-not-allowed bg-transparent"
                    : "bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] hover:bg-[var(--theme-primary-hover)]"
                  }`}
              >
                {isAdding ? <BeatLoader size={8} color="#fff" /> : needsVariantSelection ? `Select ${optionAxesLabel}` : "BUY IT NOW"}
              </button>
            </div>

            {/* Product Description */}
            <div className="mb-8 rounded-xl bg-gray-50/70 p-5 border border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2">Description</h3>
              <div 
                className="prose prose-sm prose-neutral max-w-none text-gray-600 leading-relaxed text-sm"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) || "<p>No description available.</p>" }}
              />
            </div>

          </motion.div>
        </div>

        {/* --- RELATED PRODUCTS --- */}
        {relatedProducts.length > 0 && (
          <section className="mt-28">
            <div className="text-center mb-12">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl font-bold tracking-tight sm:text-3xl font-sans"
              >
                You May Also Like
              </motion.h2>
              <div className="h-0.5 bg-[var(--theme-primary)] mx-auto mt-3 rounded-full w-16" />
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
              {relatedProducts.map((item) => (
                <ModernProductCard 
                  key={item.id} 
                  product={item} 
                  addToCart={handleRelatedAddToCart}
                  cartItems={cartItems}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Reviews ── */}
        {productId && (
          <ReviewSection
            productId={productId}
            variantId={selectedVariant?.id ?? null}
            variantLabel={selectedVariant ? Object.values(selectedVariant.options).join(" / ") : null}
            needsVariantSelection={needsVariantSelection}
            optionAxesLabel={optionAxesLabel}
            isAuthenticated={user.isAuthenticated}
            onReviewChange={async () => {
              try {
                const res = await api.get(`/user/shop/product/${productId}`);
                setProduct(normalizeProduct(res.data.product));
              } catch (err) {
                console.error("Error refreshing product rating:", err);
              }
            }}
          />
        )}
      </main>

      <FooterSection/>

      {/* Delivery Modal */}
      {product && (
        <DeliveryLocationModal
          isOpen={showDeliveryModal}
          onClose={() => setShowDeliveryModal(false)}
          product={{ id: product.id, name: safeRender(product.name), price: hasDiscount ? discountedPrice : effectivePrice, quantity: quantity, variantId: selectedVariant?.id ?? null }}
        />
      )}
    </div>
  );
}