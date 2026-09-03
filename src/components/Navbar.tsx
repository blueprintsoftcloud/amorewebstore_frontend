// import React, { useState, useEffect, useRef } from "react";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import { Dialog, DialogPanel, DialogBackdrop, DialogTitle } from "@headlessui/react";
// import {
//   Bars3Icon,
//   UserIcon,
//   XMarkIcon,
//   HeartIcon as HeartOutline,
//   BellIcon,
//   ShoppingBagIcon,
//   ChevronDownIcon,
//   HomeIcon,
//   CubeIcon,
//   ClipboardDocumentListIcon,
//   CreditCardIcon,
//   MagnifyingGlassIcon,
// } from "@heroicons/react/24/outline";
// import {
//   HeartIcon as HeartSolid,
//   ShoppingBagIcon as ShoppingBagSolid,
//   BellIcon as BellSolid,
// } from "@heroicons/react/24/solid";
// import logo123 from "../assets/logo.png";
// import { useWishlist } from "../context/WishlistContext";
// import { useAuth } from "../context/AuthContext";
// import { useBranding } from "../context/BrandingContext";
// import { useUserNotifications } from "../context/UserNotificationContext";
// import { useNotifications } from "../context/NotificationContext";
// import CustomerAuthModal from "./CustomerAuthModal";
// import toast from "react-hot-toast";
// import api from "../utils/api";
// import { domainUrl } from "../utils/constant";


// const Navbar = ({ user, role, cartItemCount = 0, handleLogout }: { user?: { isAuthenticated?: boolean; role?: string | null }; role?: string | null; cartItemCount?: number; handleLogout?: () => void }) => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { logout } = useAuth();
//   const { branding } = useBranding();
//   const { wishlistCount } = useWishlist();
//   const { notifications: userNotifications, unreadCount: userUnreadCount, markAsRead } = useUserNotifications();
//   const { unreadCount: adminUnreadCount } = useNotifications();

//   const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
//   const adminDashboardPath = role === "SUPER_ADMIN" ? "/super-admin-dashboard" : "/admin-dashboard";
//   const unreadCount = isAdmin ? adminUnreadCount : userUnreadCount;
//   const [notifOpen, setNotifOpen] = useState(false);
//   const notifRef = useRef<HTMLDivElement>(null);

//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [scrolled, setScrolled] = useState(false);
//   const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
//   const [customerAuthOpen, setCustomerAuthOpen] = useState(false);

//   // --- SEARCH STATE ---
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchResults, setSearchResults] = useState<{
//     categories: Array<{ id: string; name: string; image?: string }>;
//     products: Array<{ id: string; name: string; price: number; image?: string; category?: { id: string; name: string } }>;
//   } | null>(null);
//   const [searchLoading, setSearchLoading] = useState(false);
//   const [searchFocused, setSearchFocused] = useState(false);
//   const searchRef = useRef<HTMLDivElement>(null);

//   // --- ACKNOWLEDGED COUNT STATE (Persisted) ---
//   const [ackCartCount, setAckCartCount] = useState(() => {
//     return parseInt(localStorage.getItem("ack_cart_count") || "0", 10);
//   });

//   const [ackWishlistCount, setAckWishlistCount] = useState(() => {
//     return parseInt(localStorage.getItem("ack_wishlist_count") || "0", 10);
//   });

//   // --- MATCHING LOGIC ---
//   const currentPath = location.pathname.toLowerCase();
//   const isCartPage = currentPath.includes("cart");
//   const isWishlistPage = currentPath.includes("wishlist");

//   // --- SYNC LOGIC ---
//   useEffect(() => {
//     if (isCartPage) {
//       setAckCartCount(cartItemCount);
//       localStorage.setItem("ack_cart_count", String(cartItemCount));
//     }
//   }, [isCartPage, cartItemCount]);

//   useEffect(() => {
//     if (!isWishlistPage) return;
//     setAckWishlistCount((prev) => {
//       const next = Math.max(prev, wishlistCount);
//       localStorage.setItem("ack_wishlist_count", String(next));
//       return next;
//     });
//   }, [isWishlistPage, wishlistCount]);

//   // Scroll effect
//   useEffect(() => {
//     const handleScroll = () => {
//       setScrolled(window.scrollY > 10);
//     };
//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   // Open auth modal from anywhere via window event
//   useEffect(() => {
//     const handler = () => setCustomerAuthOpen(true);
//     window.addEventListener("openCustomerAuth", handler);
//     return () => window.removeEventListener("openCustomerAuth", handler);
//   }, []);

//   // Close notification dropdown on outside click
//   useEffect(() => {
//     const handler = (e: MouseEvent) => {
//       if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
//     };
//     if (notifOpen) document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, [notifOpen]);

//   // Close search on outside click
//   useEffect(() => {
//     const handler = (e: MouseEvent) => {
//       if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
//         setSearchFocused(false);
//       }
//     };
//     if (searchFocused) document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, [searchFocused]);

//   // Debounced search API call
//   useEffect(() => {
//     if (!searchQuery.trim() || searchQuery.trim().length < 2) {
//       setSearchResults(null);
//       setSearchLoading(false);
//       return;
//     }
//     setSearchLoading(true);
//     const timer = setTimeout(async () => {
//       try {
//         const res = await api.get(`/user/shop/global-search?q=${encodeURIComponent(searchQuery.trim())}`);
//         setSearchResults(res.data);
//       } catch {
//         setSearchResults({ categories: [], products: [] });
//       } finally {
//         setSearchLoading(false);
//       }
//     }, 350);
//     return () => clearTimeout(timer);
//   }, [searchQuery]);

//   const handleCategoryClick = (categoryId: string) => {
//     setSearchFocused(false);
//     setSearchQuery("");
//     setSearchResults(null);
//     navigate(`/categories/${categoryId}`);
//   };

//   const handleProductClick = (productId: string) => {
//     setSearchFocused(false);
//     setSearchQuery("");
//     setSearchResults(null);
//     navigate(`/products/${productId}`);
//   };


//   const isAuthenticated = user?.isAuthenticated;

//   // --- BADGE VISIBILITY LOGIC ---
//   const showCartBadge = cartItemCount > ackCartCount;
//   const showWishlistBadge = wishlistCount > 0;

//   const handleCartClick = () => {
//     setAckCartCount(cartItemCount);
//     localStorage.setItem("ack_cart_count", String(cartItemCount));
//   };

//   const handleWishlistClick = (e: React.MouseEvent) => {
//     handleGatedNavigation(e, "/WishlistPage", true);
//     setAckWishlistCount((prev) => {
//       const next = Math.max(prev, wishlistCount);
//       localStorage.setItem("ack_wishlist_count", String(next));
//       return next;
//     });
//   };

//   const handleUserIconClick = () => {
//     if (!isAuthenticated) {
//       setCustomerAuthOpen(true);
//     } else {
//       setIsUserDropdownOpen(!isUserDropdownOpen);
//     }
//   };


//   const handleGatedNavigation = (e: React.MouseEvent, path: string, isProtected: boolean) => {
//     e.preventDefault();

//     if (isProtected && !isAuthenticated) {
//       toast.error("Please login to continue",
//         { id: "please login to continue wishlist" });
//       return;
//     }

//     navigate(path);
//   };


//   const navigation = [
//     { name: "Home", href: "/", protected: false, icon: HomeIcon },
//     { name: "Products", href: "/products", protected: false, icon: CubeIcon },
//     ...(isAuthenticated
//       ? [
//         { name: "My Orders", href: "/myorders", protected: true, icon: ClipboardDocumentListIcon },
//         { name: "Transactions", href: "/transactions", protected: true, icon: CreditCardIcon },
//       ]
//       : []),
//   ];


//   const isActive = (path: string) => {
//     if (path === "/") return location.pathname === "/";
//     return location.pathname.startsWith(path);
//   };

//   return (
//     <>
//       <header className="fixed top-0 left-0 w-full z-40 font-sans ">
//         {/* GLASSMORPHISM EFFECT (Light Black)
//          - bg-black/40 or bg-gray-900/30: Semi-transparent dark background
//          - backdrop-blur-xl or backdrop-blur-2xl: Strong blur for the "glass" look
//          - border-white/10: Subtle light border for edge definition
//       */}
//         <nav className={`relative w-full transition-all duration-500 ${scrolled
//             ? "bg-white/60 backdrop-blur-2xl shadow-2xl shadow-black/20 py-4 border-b border-black/10" // Scrolled: slightly darker, strong blur
//             : "bg-white/70 backdrop-blur-xl border-b border-black/5 py-6" // Top: very transparent, frosted
//           // :"bg-gradient-to-r from-gray-900 via-indigo-900 to-rose-900 py-6"
//           }`}>
//           <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
//             <div className="flex items-center justify-between">
//               {/* LEFT: Logo & Mobile Menu */}
//               <div className="flex items-center gap-2 sm:gap-4 lg:gap-8 flex-shrink-0">
//                 <button
//                   type="button"
//                   className="lg:hidden p-2.5 rounded-lg hover:bg-black/5 transition-all duration-300 group"
//                   onClick={() => setMobileMenuOpen(true)}
//                 >
//                   <Bars3Icon className="h-6 w-6 text-gray-800 group-hover:text-black transition-colors" />
//                 </button>

//                 <Link to="/" className="flex-shrink-0">
//                   <div className="flex items-center gap-2 lg:gap-3">
//                     {branding.companyLogo ? (
//                       <img
//                         src={branding.companyLogo.startsWith("http") ? branding.companyLogo : `${domainUrl}/${branding.companyLogo}`}
//                         alt={branding.companyName || ""}
//                         className="h-8 md:h-9 lg:h-10 w-auto object-contain transition-all duration-300 filter brightness-125"
//                       />
//                     ) : null}
//                     <div className="hidden sm:block">
//                       {branding.companyName && (
//                         <div className="text-xs md:text-sm font-bold text-black tracking-widest uppercase">{branding.companyName}</div>
//                       )}
//                       {branding.companyTagline && (
//                         <div className="text-[10px] text-gray-400 tracking-wider hidden xl:block">{branding.companyTagline}</div>
//                       )}
//                     </div>
//                   </div>
//                 </Link>
//               </div>

//               {/* CENTER: Desktop Navigation Links */}
//               <div className="hidden lg:flex items-center gap-1 xl:gap-2">
//                 {navigation.map((item) => {
//                   const Icon = item.icon;
//                   const active = isActive(item.href);
//                   return (
//                     <Link
//                       key={item.name}
//                       to={item.href}
//                       onClick={(e) => item.protected && !isAuthenticated ? handleGatedNavigation(e, item.href, true) : null}
//                       className={`relative flex items-center gap-2 px-3.5 py-2 xl:px-4 xl:py-2 text-xs xl:text-sm font-bold tracking-tight transition-all duration-200 rounded-xl cursor-pointer ${
//                         active
//                           ? "bg-black text-white shadow-md shadow-black/10 border border-black/10"
//                           : "text-slate-700 hover:text-black hover:bg-black/5"
//                       }`}
//                     >
//                       <Icon className={`h-4 w-4 transition-colors ${active ? 'text-white' : 'text-slate-500'}`} strokeWidth={2} />
//                       {item.name}
//                     </Link>
//                   );
//                 })}
//               </div>

//               {/* RIGHT: Search, Actions & Auth */}
//               <div className="flex items-center gap-2 sm:gap-3 xl:gap-4 flex-shrink-0">
//                 {/* Global Search Bar */}
//                 <div ref={searchRef} className="relative hidden md:block">
//                   <div className="relative flex items-center">
//                     <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" strokeWidth={2} />
//                     <input
//                       type="text"
//                       value={searchQuery}
//                       onChange={(e) => setSearchQuery(e.target.value)}
//                       onFocus={() => setSearchFocused(true)}
//                       placeholder="Search products & categories..."
//                       className="w-44 lg:w-56 xl:w-64 focus:w-72 pl-9 pr-8 py-2 bg-black/5 border border-black/10 rounded-full text-xs xl:text-sm text-black placeholder-gray-500 focus:outline-none focus:border-black/30 focus:bg-black/10 transition-all duration-300 shadow-xs"
//                     />
//                     {searchLoading && (
//                       <div className="absolute right-3 top-1/2 -translate-y-1/2">
//                         <svg className="animate-spin h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24">
//                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
//                         </svg>
//                       </div>
//                     )}
//                     {searchQuery && !searchLoading && (
//                       <button
//                         onMouseDown={(e) => { e.preventDefault(); setSearchQuery(""); setSearchResults(null); }}
//                         className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
//                       >
//                         <XMarkIcon className="h-3.5 w-3.5 text-gray-500" />
//                       </button>
//                     )}
//                   </div>

//                   {/* Search Results Dropdown */}
//                   {searchFocused && searchQuery.trim().length >= 2 && (
//                     <div className="absolute top-full right-0 mt-2.5 w-80 xl:w-96 bg-white border border-black/10 rounded-2xl shadow-2xl shadow-black/10 z-50 overflow-hidden max-h-[420px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
//                       {searchLoading && (
//                         <div className="flex items-center justify-center gap-2 p-6 text-sm text-gray-500">
//                           <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
//                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
//                           </svg>
//                           Searching...
//                         </div>
//                       )}
//                       {!searchLoading && searchResults && (
//                         <>
//                           {searchResults.categories.length > 0 && (
//                             <div>
//                               <div className="px-4 pt-3 pb-1.5 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
//                                 Categories
//                               </div>
//                               {searchResults.categories.map((cat) => (
//                                 <button
//                                   key={cat.id}
//                                   onMouseDown={() => handleCategoryClick(cat.id)}
//                                   className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 transition-colors text-left group/item cursor-pointer"
//                                 >
//                                   <div className="w-9 h-9 rounded-lg overflow-hidden bg-black/5 flex-shrink-0 border border-black/5">
//                                     {cat.image ? (
//                                       <img
//                                         src={cat.image.startsWith("http") ? cat.image : `${domainUrl}/${cat.image}`}
//                                         alt={cat.name}
//                                         className="w-full h-full object-cover"
//                                       />
//                                     ) : (
//                                       <div className="w-full h-full flex items-center justify-center">
//                                         <CubeIcon className="h-4 w-4 text-gray-450" />
//                                       </div>
//                                     )}
//                                   </div>
//                                   <div className="flex-1 min-w-0">
//                                     <div className="text-sm text-black font-medium">{cat.name}</div>
//                                     <div className="text-xs text-gray-500">Browse all {cat.name}</div>
//                                   </div>
//                                   <svg className="h-4 w-4 text-gray-400 group-hover/item:text-black transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                                   </svg>
//                                 </button>
//                               ))}
//                             </div>
//                           )}

//                           {searchResults.products.length > 0 && (
//                             <div className={searchResults.categories.length > 0 ? "border-t border-black/5 mt-1" : ""}>
//                               <div className="px-4 pt-3 pb-1.5 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
//                                 Products
//                               </div>
//                               {searchResults.products.map((prod) => (
//                                 <button
//                                   key={prod.id}
//                                   onMouseDown={() => handleProductClick(prod.id)}
//                                   className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 transition-colors text-left group/item cursor-pointer"
//                                 >
//                                   <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/5 flex-shrink-0 border border-black/5">
//                                     {prod.image ? (
//                                       <img
//                                         src={prod.image.startsWith("http") ? prod.image : `${domainUrl}/${prod.image}`}
//                                         alt={prod.name}
//                                         className="w-full h-full object-cover"
//                                       />
//                                     ) : (
//                                       <div className="w-full h-full flex items-center justify-center">
//                                         <ShoppingBagIcon className="h-4 w-4 text-gray-455" />
//                                       </div>
//                                     )}
//                                   </div>
//                                   <div className="flex-1 min-w-0">
//                                     <div className="text-sm text-black font-medium truncate">{prod.name}</div>
//                                     <div className="text-xs text-gray-500 truncate">
//                                       {prod.category?.name} · ₹{prod.price?.toLocaleString()}
//                                     </div>
//                                   </div>
//                                   <svg className="h-4 w-4 text-gray-400 group-hover/item:text-black transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                                   </svg>
//                                 </button>
//                               ))}
//                             </div>
//                           )}

//                           {searchResults.categories.length === 0 && searchResults.products.length === 0 && (
//                             <div className="py-10 text-center">
//                               <MagnifyingGlassIcon className="h-8 w-8 text-gray-400 mx-auto mb-3" />
//                               <p className="text-gray-500 text-sm">No results for <span className="text-black font-medium">"{searchQuery}"</span></p>
//                               <p className="text-gray-400 text-xs mt-1">Try a different keyword</p>
//                             </div>
//                           )}
//                         </>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 {/* Action Icons & Auth */}
//                 <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
//                   {/* Action Icons — visible only when logged in */}
//                   {isAuthenticated && (
//                     <>
//                       {/* Wishlist Icon */}
//                       <button
//                         onClick={handleWishlistClick}
//                         className="relative p-2 rounded-lg hover:bg-black/5 transition-all duration-300 group cursor-pointer"
//                       >
//                         {isActive('/wishlist') ? (
//                           <HeartSolid className="h-5 w-5 text-pink-500 group-hover:text-pink-600 transition-colors" />
//                         ) : (
//                           <HeartOutline className="h-5 w-5 text-gray-800 group-hover:text-pink-500 transition-colors" />
//                         )}
//                         {showWishlistBadge && (
//                           <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-pink-500 to-rose-500 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
//                             {wishlistCount}
//                           </span>
//                         )}
//                       </button>

//                       {/* Cart Icon */}
//                       <Link
//                         to="/cart"
//                         onClick={(e) => {
//                           if (!isAuthenticated) {
//                             e.preventDefault();
//                             toast.error("Please login to continue",
//                               { id: "Navbar login to continue" });
//                             return;
//                           }
//                           handleCartClick();
//                         }}
//                         className="relative p-2 rounded-lg hover:bg-black/5 transition-all duration-300 group cursor-pointer"
//                       >
//                         {isActive('/cart') ? (
//                           <ShoppingBagSolid className="h-5 w-5 text-emerald-600 group-hover:text-emerald-500 transition-colors" />
//                         ) : (
//                           <ShoppingBagIcon className="h-5 w-5 text-gray-800 group-hover:text-emerald-500 transition-colors" />
//                         )}
//                         {showCartBadge && (
//                           <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-emerald-500 to-teal-500 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-1 animate-bounce">
//                             {cartItemCount}
//                           </span>
//                         )}
//                       </Link>
//                     </>
//                   )}

//                   {/* Bell notification — customers get dropdown, admin/superadmin get count-only badge linking to dashboard */}
//                   {isAuthenticated && (
//                     <div ref={notifRef} className="relative">
//                       {isAdmin ? (
//                         // Admin/SuperAdmin: count badge only, click navigates to dashboard notifications
//                         <button
//                           onClick={() => navigate(`${adminDashboardPath}/notifications`)}
//                           className="relative p-2.5 rounded-lg hover:bg-black/5 transition-all duration-300 group"
//                           aria-label="Notifications"
//                         >
//                           <BellIcon className="h-5 w-5 text-gray-800 group-hover:text-black transition-colors" />
//                           {unreadCount > 0 && (
//                             <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-rose-500 to-pink-500 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-0.5 animate-pulse">
//                               {unreadCount > 99 ? "99+" : unreadCount}
//                             </span>
//                           )}
//                         </button>
//                       ) : (
//                         // Customer: full dropdown
//                         <>
//                           <button
//                             onClick={() => setNotifOpen((o) => !o)}
//                             className="relative p-2 rounded-lg hover:bg-black/5 transition-all duration-300 group"
//                             aria-label="Notifications"
//                           >
//                             {notifOpen ? (
//                               <BellSolid className="h-5 w-5 text-black" />
//                             ) : (
//                               <BellIcon className="h-5 w-5 text-gray-800 group-hover:text-black transition-colors" />
//                             )}
//                             {unreadCount > 0 && (
//                               <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-rose-500 to-pink-500 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-0.5 animate-pulse">
//                                 {unreadCount > 99 ? "99+" : unreadCount}
//                               </span>
//                             )}
//                           </button>

//                           {/* Dropdown panel */}
//                           {notifOpen && (
//                             <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1rem)] bg-white border border-black/10 rounded-xl shadow-2xl shadow-black/10 z-50 overflow-hidden">
//                               {/* Header */}
//                               <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
//                                 <h3 className="font-semibold text-black text-sm">Notifications</h3>
//                                 {unreadCount > 0 && (
//                                   <span className="text-xs bg-rose-500/10 text-rose-600 rounded-full px-2.5 py-0.5 font-semibold border border-rose-500/10">
//                                     {unreadCount} new
//                                   </span>
//                                 )}
//                               </div>

//                               {/* List */}
//                               <div className="max-h-72 overflow-y-auto divide-y divide-black/5">
//                                 {userNotifications.length === 0 ? (
//                                   <p className="text-center text-sm text-gray-500 py-10">No notifications yet</p>
//                                 ) : (
//                                   userNotifications.slice(0, 8).map((n) => {
//                                     const id = n.id ?? n._id;
//                                     return (
//                                       <button
//                                         key={id}
//                                         className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-2.5 ${!n.isRead ? "bg-black/5 hover:bg-black/10" : "hover:bg-black/5"
//                                           }`}
//                                         onClick={() => {
//                                           if (!n.isRead && id) markAsRead(id);
//                                           setNotifOpen(false);
//                                         }}
//                                       >
//                                         {!n.isRead && (
//                                           <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-600" />
//                                         )}
//                                         <div className={n.isRead ? "pl-4" : ""}>
//                                           <p className={`text-sm leading-snug line-clamp-2 ${!n.isRead ? "font-semibold text-black" : "text-gray-600"}`}>
//                                             {n.message}
//                                           </p>
//                                           {n.createdAt && (
//                                             <p className="text-xs text-gray-500 mt-0.5">
//                                               {new Date(n.createdAt).toLocaleString("en-IN", {
//                                                 day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
//                                               })}
//                                             </p>
//                                           )}
//                                         </div>
//                                       </button>
//                                     );
//                                   })
//                                 )}
//                               </div>

//                               {/* Footer */}
//                               {userNotifications.length > 0 && (
//                                 <div className="border-t border-black/10 px-4 py-2.5">
//                                   <Link
//                                     to="/myorders"
//                                     onClick={() => setNotifOpen(false)}
//                                     className="text-xs text-gray-600 hover:text-black transition-colors"
//                                   >
//                                     View My Orders →
//                                   </Link>
//                                 </div>
//                               )}
//                             </div>
//                           )}
//                         </>
//                       )}
//                     </div>
//                   )}

//                   {/* Auth Section */}
//                   {!isAuthenticated ? (
//                     <div className="hidden md:flex items-center gap-3 ml-2">
//                       <button
//                         onClick={() => setCustomerAuthOpen(true)}
//                         className="px-4 py-2 bg-black hover:bg-black/90 border border-black/10 text-white text-xs md:text-sm font-semibold rounded-lg transition-all duration-300 backdrop-blur-sm shadow-[0_0_10px_rgba(0,0,0,0.05)] focus:outline-none"
//                       >
//                         Sign In
//                       </button>
//                     </div>
//                   ) : (
//                     <div className="relative">
//                       <button
//                         onClick={handleUserIconClick}
//                         className="hidden md:flex items-center gap-2 ml-1 lg:ml-2 p-2 rounded-lg hover:bg-black/5 focus:outline-none transition-all duration-300 group"
//                       >
//                         <div className="w-8 h-8 lg:w-9 lg:h-9 bg-black/5 border border-black/10 rounded-full flex items-center justify-center group-hover:border-black/30 transition-colors backdrop-blur-md">
//                           <UserIcon className="h-4 w-4 text-gray-700 group-hover:text-black" />
//                         </div>
//                         <ChevronDownIcon className={`h-3.5 w-3.5 lg:h-4 lg:w-4 text-gray-650 transition-all duration-300 ${isUserDropdownOpen ? 'rotate-180 text-black' : ''}`} />
//                       </button>

//                       {/* User Dropdown */}
//                       {isUserDropdownOpen && (
//                         <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl shadow-black/10 border border-black/10 py-2 z-50">
//                           <Link
//                             to="/profile"
//                             onClick={() => setIsUserDropdownOpen(false)}
//                             className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:text-black hover:bg-black/5 transition-colors"
//                           >
//                             <UserIcon className="h-4 w-4" />
//                             My Profile
//                           </Link>
//                           <div className="border-t border-black/10 my-2"></div>
//                           <button
//                             onClick={() => {
//                               logout();
//                               setIsUserDropdownOpen(false);
//                             }}
//                             className="flex items-center gap-3 w-full px-4 py-3 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-500/5 transition-colors"
//                           >
//                             <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//                             </svg>
//                             Logout
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </nav>


//         {/* ------------------------------------------------ */}
//         {/* ENHANCED MOBILE MENU */}
//         {/* ------------------------------------------------ */}
//         <Dialog
//           open={mobileMenuOpen}
//           onClose={setMobileMenuOpen}
//           className="relative z-[100] lg:hidden"
//         >
//           <DialogBackdrop className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-300 z-[100]" />
//           <div className="fixed inset-0 z-[100] flex">
//             <DialogPanel className="relative mr-auto flex h-full w-[320px] max-w-[85vw] flex-col overflow-y-auto bg-black/95 backdrop-blur-2xl shadow-2xl transition-transform duration-300 border-r border-white/10">
//               {/* Header */}
//               <div className="px-6 py-5 border-b border-white/10">
//                 <div className="flex items-center justify-between">
//                   <Link to="/" onClick={() => setMobileMenuOpen(false)}>
//                     <div className="flex items-center gap-3">
//                       {branding.companyLogo ? (
//                         <img
//                           src={branding.companyLogo.startsWith("http") ? branding.companyLogo : `${domainUrl}/${branding.companyLogo}`}
//                           alt={branding.companyName || ""}
//                           className="h-8 w-auto filter brightness-125 object-contain"
//                         />
//                       ) : null}
//                       {(branding.companyName || branding.companyTagline) ? (
//                         <div>
//                           {branding.companyName && (
//                             <div className="text-sm font-bold text-white uppercase tracking-widest">{branding.companyName}</div>
//                           )}
//                           {branding.companyTagline && (
//                             <div className="text-xs text-gray-400 tracking-wider">{branding.companyTagline}</div>
//                           )}
//                         </div>
//                       ) : null}
//                     </div>
//                   </Link>
//                   <button
//                     onClick={() => setMobileMenuOpen(false)}
//                     className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
//                   >
//                     <XMarkIcon className="h-6 w-6 text-gray-300" />
//                   </button>
//                 </div>
//               </div>

//               {/* Navigation Links */}
//               <div className="flex-1 px-2 py-4">
//                 {/* Mobile Search */}
//                 <div className="mx-2 mb-4">
//                   <div className="relative">
//                     <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
//                     <input
//                       type="text"
//                       value={searchQuery}
//                       onChange={(e) => setSearchQuery(e.target.value)}
//                       onFocus={() => setSearchFocused(true)}
//                       placeholder="Search products & categories..."
//                       className="w-full pl-9 pr-8 py-2.5 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/20"
//                     />
//                     {searchQuery && (
//                       <button
//                         onClick={() => { setSearchQuery(""); setSearchResults(null); }}
//                         className="absolute right-3 top-1/2 -translate-y-1/2"
//                       >
//                         <XMarkIcon className="h-4 w-4 text-gray-400" />
//                       </button>
//                     )}
//                   </div>
//                   {/* Mobile search results */}
//                   {searchQuery.trim().length >= 2 && (searchLoading || searchResults) && (
//                     <div className="mt-2 bg-black/80 border border-white/10 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
//                       {searchLoading && (
//                         <div className="p-3 text-center text-gray-400 text-sm">Searching...</div>
//                       )}
//                       {!searchLoading && searchResults && (
//                         <>
//                           {[...searchResults.categories.map(c => ({ type: "category" as const, ...c })),
//                           ...searchResults.products.map(p => ({ type: "product" as const, ...p }))
//                           ].length === 0 ? (
//                             <div className="p-4 text-center text-gray-400 text-sm">No results found</div>
//                           ) : (
//                             <>
//                               {searchResults.categories.map((cat) => (
//                                 <button
//                                   key={cat.id}
//                                   onClick={() => { handleCategoryClick(cat.id); setMobileMenuOpen(false); }}
//                                   className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 transition-colors text-left border-b border-white/5"
//                                 >
//                                   <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
//                                     {cat.image ? (
//                                       <img src={cat.image.startsWith("http") ? cat.image : `${domainUrl}/${cat.image}`} alt={cat.name} className="w-full h-full object-cover" />
//                                     ) : (
//                                       <CubeIcon className="h-4 w-4 text-gray-500 m-auto mt-2" />
//                                     )}
//                                   </div>
//                                   <div>
//                                     <div className="text-xs text-white font-medium">{cat.name}</div>
//                                     <div className="text-[10px] text-gray-500">Category</div>
//                                   </div>
//                                 </button>
//                               ))}
//                               {searchResults.products.map((prod) => (
//                                 <button
//                                   key={prod.id}
//                                   onClick={() => { handleProductClick(prod.id); setMobileMenuOpen(false); }}
//                                   className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 transition-colors text-left border-b border-white/5"
//                                 >
//                                   <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
//                                     {prod.image ? (
//                                       <img src={prod.image.startsWith("http") ? prod.image : `${domainUrl}/${prod.image}`} alt={prod.name} className="w-full h-full object-cover" />
//                                     ) : (
//                                       <ShoppingBagIcon className="h-4 w-4 text-gray-500 m-auto mt-2.5" />
//                                     )}
//                                   </div>
//                                   <div className="flex-1 min-w-0">
//                                     <div className="text-xs text-white font-medium truncate">{prod.name}</div>
//                                     <div className="text-[10px] text-gray-500">₹{prod.price?.toLocaleString()}</div>
//                                   </div>
//                                 </button>
//                               ))}
//                             </>
//                           )}
//                         </>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 <div className="space-y-1">
//                   {navigation.map((item) => {
//                     const Icon = item.icon;
//                     const active = isActive(item.href);
//                     return (
//                       <Link
//                         key={item.name}
//                         to={item.href}
//                         onClick={(e) => {
//                           if (item.protected && !isAuthenticated) {
//                             handleGatedNavigation(e, item.href, true);
//                           }
//                           setMobileMenuOpen(false);
//                         }}
//                         className={`flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-300 mx-2 ${active
//                             ? 'bg-white/10 text-white border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.05)]'
//                             : 'text-gray-300 hover:text-white hover:bg-white/5'
//                           }`}
//                       >
//                         <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-gray-400'}`} />
//                         {item.name}
//                       </Link>
//                     );
//                   })}
//                   {/* Notifications link — authenticated only */}
//                   {isAuthenticated && (
//                     <Link
//                       to="/myorders"
//                       onClick={() => setMobileMenuOpen(false)}
//                       className="flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-300 mx-2 text-gray-300 hover:text-white hover:bg-white/5"
//                     >
//                       <BellIcon className="h-5 w-5 text-gray-400" />
//                       Notifications
//                       {unreadCount > 0 && (
//                         <span className="ml-auto min-w-[20px] h-[20px] bg-gradient-to-r from-rose-500 to-pink-500 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-1">
//                           {unreadCount}
//                         </span>
//                       )}
//                     </Link>
//                   )}
//                 </div>
//               </div>

//               {/* Auth Section */}
//               <div className="px-4 py-6 border-t border-white/10">
//                 {!isAuthenticated ? (
//                   <div className="space-y-3">

//                     <button
//                       onClick={() => { setMobileMenuOpen(false); setCustomerAuthOpen(true); }}
//                       className="block w-full text-center border border-gray-600 text-gray-300 py-3.5 rounded-lg text-sm font-semibold hover:bg-white/5 hover:text-white transition-colors"
//                     >
//                       Sign In
//                     </button>
//                   </div>
//                 ) : (
//                   <div className="space-y-3">
//                     {/* <div className="px-4 py-3 bg-white/5 rounded-lg mb-3 border border-white/5">
//                     <p className="text-sm font-semibold text-white">Welcome back!</p>
//                     <p className="text-xs text-gray-400 truncate">{user.email || "User"}</p>
//                   </div> */}
//                     <Link
//                       to="/profile"
//                       onClick={() => setMobileMenuOpen(false)}
//                       className="flex items-center justify-center gap-2 w-full text-center bg-black/40 text-gray-300 py-3.5 rounded-lg text-sm font-semibold hover:bg-white/5 hover:text-white transition-colors border border-white/5"
//                     >
//                       <UserIcon className="h-4 w-4" />
//                       My Profile
//                     </Link>
//                     <button
//                       onClick={() => {
//                         logout();
//                         setMobileMenuOpen(false);
//                       }}
//                       className="flex items-center justify-center gap-2 w-full text-center border border-white/10 text-rose-400 py-3.5 rounded-lg text-sm font-semibold hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
//                     >
//                       <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//                       </svg>
//                       Logout
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </DialogPanel>
//           </div>
//         </Dialog>
//       </header>

//       <CustomerAuthModal
//         open={customerAuthOpen}
//         onClose={() => setCustomerAuthOpen(false)}
//       />
//     </>
//   );
// };

// export default Navbar;







import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogPanel, DialogBackdrop } from "@headlessui/react";
import {
  Bars3Icon,
  UserIcon,
  XMarkIcon,
  HeartIcon as HeartOutline,
  BellIcon,
  ShoppingBagIcon,
  ChevronDownIcon,
  HomeIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolid,
  ShoppingBagIcon as ShoppingBagSolid,
  BellIcon as BellSolid,
} from "@heroicons/react/24/solid";
import logo123 from "../assets/logo.png";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { useBranding } from "../context/BrandingContext";
import { useUserNotifications } from "../context/UserNotificationContext";
import { useNotifications } from "../context/NotificationContext";
import CustomerAuthModal from "./CustomerAuthModal";
import CategoryMegaMenu from "./CategoryMegaMenu";
import toast from "react-hot-toast";
import api from "../utils/api";
import { domainUrl } from "../utils/constant";
import { getCustomerNotificationTarget } from "../utils/notificationRoute";

const Navbar = ({
  user,
  role,
  cartItemCount = 0,
  handleLogout,
}: {
  user?: { isAuthenticated?: boolean; role?: string | null };
  role?: string | null;
  cartItemCount?: number;
  handleLogout?: () => void;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { branding } = useBranding();
  const logoSrc = branding.companyLogo
    ? branding.companyLogo.startsWith("http")
      ? branding.companyLogo
      : `${domainUrl}/${branding.companyLogo}`
    : logo123;
  const { wishlistCount } = useWishlist();
  const {
    notifications: userNotifications,
    unreadCount: userUnreadCount,
    markAsRead,
  } = useUserNotifications();
  const { unreadCount: adminUnreadCount } = useNotifications();

  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const adminDashboardPath =
    role === "SUPER_ADMIN" ? "/super-admin-dashboard" : "/admin-dashboard";
  const unreadCount = isAdmin ? adminUnreadCount : userUnreadCount;
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [customerAuthOpen, setCustomerAuthOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // --- SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    categories: Array<{ id: string; name: string; image?: string }>;
    products: Array<{
      id: string;
      name: string;
      price: number;
      image?: string;
      category?: { id: string; name: string };
    }>;
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // --- ACKNOWLEDGED COUNT STATE (Persisted) ---
  const [ackCartCount, setAckCartCount] = useState(() => {
    return parseInt(localStorage.getItem("ack_cart_count") || "0", 10);
  });

  const [ackWishlistCount, setAckWishlistCount] = useState(() => {
    return parseInt(localStorage.getItem("ack_wishlist_count") || "0", 10);
  });

  // --- MATCHING LOGIC ---
  const currentPath = location.pathname.toLowerCase();
  const isCartPage = currentPath.includes("cart");
  const isWishlistPage = currentPath.includes("wishlist");

  // --- SYNC LOGIC ---
  useEffect(() => {
    if (isCartPage) {
      setAckCartCount(cartItemCount);
      localStorage.setItem("ack_cart_count", String(cartItemCount));
    }
  }, [isCartPage, cartItemCount]);

  useEffect(() => {
    if (!isWishlistPage) return;
    setAckWishlistCount((prev) => {
      const next = Math.max(prev, wishlistCount);
      localStorage.setItem("ack_wishlist_count", String(next));
      return next;
    });
  }, [isWishlistPage, wishlistCount]);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // This fixed header's real height varies — responsive logo sizing, whether the
  // branding tagline row is showing, and now the CategoryMegaMenu row underneath it
  // (see below) all change it. Every customer page needs to clear exactly that height
  // to avoid its content (e.g. a "Go Back" button) rendering partly behind the header,
  // so instead of each page hardcoding its own guessed margin — which drifts out of
  // sync the moment the header's actual height changes, as happened here — the header
  // publishes its measured height as a CSS variable that those pages read from
  // (`mt-[var(--app-header-h)]` / `pt-[var(--app-header-h)]`). ResizeObserver (not a
  // fixed set of effect dependencies) catches every cause of a height change, including
  // ones we haven't enumerated — a late-loading logo image, a branding text wrap, etc.
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const applyHeight = () => {
      document.documentElement.style.setProperty("--app-header-h", `${el.offsetHeight}px`);
    };
    applyHeight();
    const observer = new ResizeObserver(applyHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Open auth modal from anywhere via window event
  useEffect(() => {
    const handler = () => setCustomerAuthOpen(true);
    window.addEventListener("openCustomerAuth", handler);
    return () => window.removeEventListener("openCustomerAuth", handler);
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    };
    if (notifOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
    };
    if (searchFocused) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchFocused]);

  // Debounced search API call
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(
          `/user/shop/global-search?q=${encodeURIComponent(
            searchQuery.trim()
          )}`
        );
        setSearchResults(res.data);
      } catch {
        setSearchResults({ categories: [], products: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCategoryClick = (categoryId: string) => {
    setSearchFocused(false);
    setSearchQuery("");
    setSearchResults(null);
    navigate(`/categories/${categoryId}`);
  };

  const handleProductClick = (productId: string) => {
    setSearchFocused(false);
    setSearchQuery("");
    setSearchResults(null);
    navigate(`/products/${productId}`);
  };

  const isAuthenticated = user?.isAuthenticated;

  // --- BADGE VISIBILITY LOGIC ---
  const showCartBadge = cartItemCount > ackCartCount;
  const showWishlistBadge = wishlistCount > 0;

  const handleCartClick = () => {
    setAckCartCount(cartItemCount);
    localStorage.setItem("ack_cart_count", String(cartItemCount));
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    handleGatedNavigation(e, "/WishlistPage", true);
    setAckWishlistCount((prev) => {
      const next = Math.max(prev, wishlistCount);
      localStorage.setItem("ack_wishlist_count", String(next));
      return next;
    });
  };

  const handleUserIconClick = () => {
    if (!isAuthenticated) {
      setCustomerAuthOpen(true);
    } else {
      setIsUserDropdownOpen(!isUserDropdownOpen);
    }
  };

  const handleGatedNavigation = (
    e: React.MouseEvent,
    path: string,
    isProtected: boolean
  ) => {
    e.preventDefault();

    if (isProtected && !isAuthenticated) {
      window.dispatchEvent(new CustomEvent("openCustomerAuth"));
      return;
    }

    navigate(path);
  };

  const navigation = [
    { name: "Home", href: "/", protected: false, icon: HomeIcon },
    { name: "Products", href: "/products", protected: false, icon: CubeIcon },
    ...(isAuthenticated
      ? [
          {
            name: "My Orders",
            href: "/myorders",
            protected: true,
            icon: ClipboardDocumentListIcon,
          },
          {
            name: "Transactions",
            href: "/transactions",
            protected: true,
            icon: CreditCardIcon,
          },
        ]
      : []),
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header ref={headerRef} className="fixed top-0 left-0 w-full z-40 font-sans">
        <nav
          className={`relative z-20 w-full transition-all duration-500 ${
            scrolled
              ? "bg-white/60 backdrop-blur-2xl shadow-2xl shadow-black/20 py-1 border-b border-black/10"
              : "bg-white/70 backdrop-blur-xl border-b border-black/5 py-1.5"
          }`}
        >
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              {/* LEFT: Logo & Mobile Menu */}
              <div className="flex items-center gap-2 sm:gap-4 lg:gap-8 flex-shrink-0 my-auto">
                <button
                  type="button"
                  className="lg:hidden p-2 rounded-xl hover:bg-black/5 transition-all duration-300 group my-auto"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Bars3Icon className="h-6 w-6 text-gray-800 group-hover:text-black transition-colors" />
                </button>

                <Link to="/" className="flex-shrink-0 flex items-center justify-center my-auto gap-2.5">
                  <img
                    src={logoSrc}
                    alt={branding.companyName || "Logo"}
                    className="h-11 sm:h-13 md:h-16 lg:h-20 w-auto object-contain transition-all duration-300 filter brightness-125 my-auto"
                  />
                  {(branding.showCompanyName || branding.showCompanyTagline) && (
                    <div className="hidden sm:flex flex-col justify-center text-left">
                      {branding.showCompanyName && branding.companyName && (
                        <span className="text-xs md:text-sm font-bold text-black tracking-widest uppercase leading-tight">
                          {branding.companyName}
                        </span>
                      )}
                      {branding.showCompanyTagline && branding.companyTagline && (
                        <span className="text-[10px] text-slate-500 tracking-wider hidden xl:block leading-tight mt-0.5">
                          {branding.companyTagline}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              </div>

              {/* CENTER: Desktop Navigation Links */}
              <div className="hidden lg:flex items-center gap-1 xl:gap-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={(e) =>
                        item.protected && !isAuthenticated
                          ? handleGatedNavigation(e, item.href, true)
                          : null
                      }
                      className={`relative flex items-center px-3 py-2 xl:px-4 xl:py-2 text-xs xl:text-sm font-bold tracking-tight transition-all duration-200 cursor-pointer ${
                        active
                          ? "text-[var(--theme-primary)]"
                          : "text-slate-600 hover:text-[var(--theme-primary)] hover:bg-black/5 rounded-lg"
                      }`}
                    >
                      {item.name}
                      {active && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[var(--theme-primary)] rounded-full transition-all duration-300" />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* RIGHT: Search, Actions & Auth */}
              <div className="flex items-center gap-1.5 sm:gap-3 xl:gap-4 flex-shrink-0">
                {/* Global Search Bar - Sleek squircle shape without harsh border line */}
                <div ref={searchRef} className="relative hidden md:block">
                  <div className="relative flex items-center">
                    <MagnifyingGlassIcon
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
                      strokeWidth={2}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      placeholder="Search products & categories..."
                      className="w-44 lg:w-56 xl:w-64 focus:w-72 pl-9 pr-8 py-2 bg-slate-100/90 hover:bg-slate-100 border-0 rounded-2xl text-xs xl:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:bg-white transition-all duration-300 shadow-xs"
                    />
                    {searchLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg
                          className="animate-spin h-3.5 w-3.5 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                      </div>
                    )}
                    {searchQuery && !searchLoading && (
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSearchQuery("");
                          setSearchResults(null);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
                      >
                        <XMarkIcon className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {searchFocused && searchQuery.trim().length >= 2 && (
                    <div className="absolute top-full right-0 mt-2.5 w-80 xl:w-96 bg-white border-0 ring-1 ring-black/5 rounded-2xl shadow-2xl z-50 max-h-[420px] overflow-y-auto p-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden animate-in fade-in zoom-in-95 duration-150">
                      {searchLoading && (
                        <div className="flex items-center justify-center gap-2 p-6 text-sm text-gray-500">
                          <svg
                            className="animate-spin h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                          </svg>
                          Searching...
                        </div>
                      )}
                      {!searchLoading && searchResults && (
                        <>
                          {searchResults.categories.length > 0 && (
                            <div className="mb-1">
                              <div className="px-3 pt-2 pb-1 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                Categories
                              </div>
                              {searchResults.categories.map((cat) => (
                                <button
                                  key={cat.id}
                                  onMouseDown={() => handleCategoryClick(cat.id)}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100/80 transition-colors text-left group/item cursor-pointer"
                                >
                                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                    {cat.image ? (
                                      <img
                                        src={
                                          cat.image.startsWith("http")
                                            ? cat.image
                                            : `${domainUrl}/${cat.image}`
                                        }
                                        alt={cat.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <CubeIcon className="h-4 w-4 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-900 font-bold">
                                      {cat.name}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Browse all {cat.name}
                                    </div>
                                  </div>
                                  <svg
                                    className="h-4 w-4 text-gray-400 group-hover/item:text-gray-900 transition-colors flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </button>
                              ))}
                            </div>
                          )}

                          {searchResults.products.length > 0 && (
                            <div>
                              <div className="px-3 pt-2 pb-1 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                Products
                              </div>
                              {searchResults.products.map((prod) => (
                                <button
                                  key={prod.id}
                                  onMouseDown={() => handleProductClick(prod.id)}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100/80 transition-colors text-left group/item cursor-pointer"
                                >
                                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                    {prod.image ? (
                                      <img
                                        src={
                                          prod.image.startsWith("http")
                                            ? prod.image
                                            : `${domainUrl}/${prod.image}`
                                        }
                                        alt={prod.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <ShoppingBagIcon className="h-4 w-4 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-900 font-bold truncate">
                                      {prod.name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {prod.category?.name} · ₹
                                      {prod.price?.toLocaleString()}
                                    </div>
                                  </div>
                                  <svg
                                    className="h-4 w-4 text-gray-400 group-hover/item:text-gray-900 transition-colors flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </button>
                              ))}
                            </div>
                          )}

                          {searchResults.categories.length === 0 &&
                            searchResults.products.length === 0 && (
                              <div className="py-10 text-center">
                                <MagnifyingGlassIcon className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">
                                  No results for{" "}
                                  <span className="text-black font-medium">
                                    "{searchQuery}"
                                  </span>
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  Try a different keyword
                                </p>
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Icons & Auth */}
                <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
                  {/* Action Icons — visible only when logged in */}
                  {isAuthenticated && (
                    <>
                      {/* Wishlist Icon */}
                      <button
                        onClick={handleWishlistClick}
                        className="relative p-1.5 sm:p-2 rounded-full hover:bg-black/5 transition-all duration-300 group cursor-pointer"
                        aria-label="Wishlist"
                      >
                        {isActive("/WishlistPage") || isActive("/wishlist") ? (
                          <HeartSolid className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-[var(--theme-accent)] transition-colors" />
                        ) : (
                          <HeartOutline className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-gray-800 group-hover:text-[var(--theme-accent)] transition-colors" />
                        )}
                        {showWishlistBadge && (
                          <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] bg-[var(--theme-accent)] text-[9px] sm:text-[10px] text-[var(--theme-accent-ink)] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                            {wishlistCount}
                          </span>
                        )}
                      </button>

                      {/* Cart Icon */}
                      <Link
                        to="/cart"
                        onClick={(e) => {
                          if (!isAuthenticated) {
                            e.preventDefault();
                            toast.error("Please login to continue", {
                              id: "Navbar login to continue",
                            });
                            return;
                          }
                          handleCartClick();
                        }}
                        className="relative p-1.5 sm:p-2 rounded-full hover:bg-black/5 transition-all duration-300 group cursor-pointer"
                        aria-label="Cart"
                      >
                        {isActive("/cart") ? (
                          <ShoppingBagSolid className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-emerald-600 transition-colors" />
                        ) : (
                          <ShoppingBagIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-gray-800 group-hover:text-emerald-500 transition-colors" />
                        )}
                        {showCartBadge && (
                          <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] bg-gradient-to-r from-emerald-500 to-teal-500 text-[9px] sm:text-[10px] text-white font-bold rounded-full flex items-center justify-center px-1 animate-bounce">
                            {cartItemCount}
                          </span>
                        )}
                      </Link>
                    </>
                  )}

                  {/* Bell notification */}
                  {isAuthenticated && (
                    <div ref={notifRef} className="relative flex items-center">
                      {isAdmin ? (
                        <button
                          onClick={() =>
                            navigate(`${adminDashboardPath}/notifications`)
                          }
                          className="relative p-1.5 sm:p-2 rounded-full hover:bg-black/5 transition-all duration-300 group cursor-pointer"
                          aria-label="Notifications"
                        >
                          <BellIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-gray-800 group-hover:text-black transition-colors" />
                          {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] bg-[var(--theme-accent)] text-[9px] sm:text-[10px] text-[var(--theme-accent-ink)] font-bold rounded-full flex items-center justify-center px-0.5 animate-pulse">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setNotifOpen((o) => !o)}
                            className="relative p-1.5 sm:p-2 rounded-full hover:bg-black/5 transition-all duration-300 group cursor-pointer"
                            aria-label="Notifications"
                          >
                            {notifOpen ? (
                              <BellSolid className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-black" />
                            ) : (
                              <BellIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-gray-800 group-hover:text-black transition-colors" />
                            )}
                            {unreadCount > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] bg-[var(--theme-accent)] text-[9px] sm:text-[10px] text-[var(--theme-accent-ink)] font-bold rounded-full flex items-center justify-center px-0.5 animate-pulse">
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </span>
                            )}
                          </button>

                          {/* Dropdown panel */}
                          {notifOpen && (
                            <div className="absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-1rem)] bg-white border border-black/10 rounded-2xl shadow-2xl shadow-black/15 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                              <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
                                <h3 className="font-semibold text-black text-sm">
                                  Notifications
                                </h3>
                                {unreadCount > 0 && (
                                  <span className="text-xs bg-rose-500/10 text-rose-600 rounded-full px-2.5 py-0.5 font-semibold border border-rose-500/10">
                                    {unreadCount} new
                                  </span>
                                )}
                              </div>

                              <div className="max-h-72 overflow-y-auto divide-y divide-black/5">
                                {userNotifications.length === 0 ? (
                                  <p className="text-center text-sm text-gray-500 py-10">
                                    No notifications yet
                                  </p>
                                ) : (
                                  userNotifications
                                    .slice(0, 8)
                                    .map((n) => {
                                      const id = n.id ?? n._id;
                                      return (
                                        <button
                                          key={id}
                                          className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-2.5 ${
                                            !n.isRead
                                              ? "bg-black/5 hover:bg-black/10"
                                              : "hover:bg-black/5"
                                          }`}
                                          onClick={() => {
                                            if (!n.isRead && id) markAsRead(id);
                                            setNotifOpen(false);
                                            navigate(getCustomerNotificationTarget(n));
                                          }}
                                        >
                                          {!n.isRead && (
                                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-600" />
                                          )}
                                          <div className={n.isRead ? "pl-4" : ""}>
                                            <p
                                              className={`text-sm leading-snug line-clamp-2 ${
                                                !n.isRead
                                                  ? "font-semibold text-black"
                                                  : "text-gray-600"
                                              }`}
                                            >
                                              {n.message}
                                            </p>
                                            {n.createdAt && (
                                              <p className="text-xs text-gray-500 mt-0.5">
                                                {new Date(
                                                  n.createdAt
                                                ).toLocaleString("en-IN", {
                                                  day: "numeric",
                                                  month: "short",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })}
                                              </p>
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })
                                )}
                              </div>

                              {userNotifications.length > 0 && (
                                <div className="border-t border-black/10 px-4 py-2.5">
                                  <Link
                                    to="/myorders"
                                    onClick={() => setNotifOpen(false)}
                                    className="text-xs text-gray-600 hover:text-black transition-colors"
                                  >
                                    View My Orders →
                                  </Link>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Auth Section */}
                  {!isAuthenticated ? (
                    <div className="hidden md:flex items-center gap-3 ml-2">
                      <button
                        onClick={() => setCustomerAuthOpen(true)}
                        className="px-4 py-2 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] border border-black/10 text-[var(--theme-primary-ink)] text-xs md:text-sm font-semibold rounded-lg transition-all duration-300 backdrop-blur-sm shadow-[0_0_10px_rgba(0,0,0,0.05)] focus:outline-none"
                      >
                        Sign In
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <button
                        onClick={handleUserIconClick}
                        className={`hidden md:flex items-center gap-2 ml-1 lg:ml-2 px-3 py-1.5 rounded-full border transition-all duration-300 group cursor-pointer ${
                          isUserDropdownOpen || isActive("/profile")
                            ? "bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] border-[var(--theme-primary)] shadow-md shadow-black/10"
                            : "bg-slate-100/90 hover:bg-slate-200/90 border-slate-200/80 text-slate-800"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                            isUserDropdownOpen || isActive("/profile")
                              ? "bg-white/20 text-[var(--theme-primary-ink)]"
                              : "bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] shadow-xs"
                          }`}
                        >
                          <UserIcon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold tracking-tight hidden lg:inline">
                          {isAdmin ? "Admin" : "Account"}
                        </span>
                        <ChevronDownIcon
                          className={`h-3.5 w-3.5 transition-transform duration-300 ${
                            isUserDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* User Dropdown */}
                      {isUserDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2.5 w-56 bg-white rounded-2xl shadow-2xl shadow-black/10 border border-slate-200/80 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-3 py-2 mb-1 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Signed in as
                            </p>
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {isAdmin ? "Administrator" : "Customer Account"}
                            </p>
                          </div>
                          <Link
                            to="/profile"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-700 hover:text-black hover:bg-slate-100 rounded-xl transition-all duration-200"
                          >
                            <UserIcon className="h-4 w-4 text-slate-500" />
                            My Profile
                          </Link>
                          <div className="border-t border-slate-100 my-1"></div>
                          <button
                            onClick={() => {
                              logout();
                              setIsUserDropdownOpen(false);
                            }}
                            className="flex items-center gap-3 w-full px-3 py-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all duration-200 cursor-pointer"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Category browse bar — homepage only (it was showing on every page, including
            ones like About/Help/Contact where it has no relevance and just adds visual
            noise above the actual page content). Desktop only otherwise (see
            CategoryMegaMenu's own hidden lg:flex); mobile users browse categories via
            the hamburger menu below. */}
        {location.pathname === "/" && <CategoryMegaMenu />}

        {/* MOBILE MENU */}
        <Dialog
          open={mobileMenuOpen}
          onClose={setMobileMenuOpen}
          className="relative z-[100] lg:hidden"
        >
          <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300 z-[100]" />
          <div className="fixed inset-0 z-[100] flex">
            <DialogPanel className="relative mr-auto flex h-full w-[300px] max-w-[85vw] flex-col overflow-y-auto bg-white/95 backdrop-blur-2xl shadow-2xl transition-transform duration-300 border-r border-slate-200/80">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                  <img
                    src={logoSrc}
                    alt={branding.companyName || "Logo"}
                    className="h-10 sm:h-12 w-auto object-contain filter brightness-125"
                  />
                  {(branding.showCompanyName || branding.showCompanyTagline) && (
                    <div className="flex flex-col justify-center text-left">
                      {branding.showCompanyName && branding.companyName && (
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-widest leading-tight">
                          {branding.companyName}
                        </span>
                      )}
                      {branding.showCompanyTagline && branding.companyTagline && (
                        <span className="text-[10px] text-slate-500 tracking-wider leading-tight">
                          {branding.companyTagline}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 px-2 py-4">
                {/* Mobile Search */}
                <div className="mx-2 mb-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      placeholder="Search products & categories..."
                      className="w-full pl-9 pr-8 py-2.5 bg-slate-100/90 border border-slate-200/60 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSearchResults(null);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <XMarkIcon className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    )}
                  </div>

                  {/* Mobile search results */}
                  {searchQuery.trim().length >= 2 &&
                    (searchLoading || searchResults) && (
                      <div className="mt-2 bg-white border border-slate-200/80 rounded-xl shadow-xl max-h-64 overflow-y-auto p-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {searchLoading && (
                          <div className="p-3 text-center text-slate-400 text-xs">
                            Searching...
                          </div>
                        )}
                        {!searchLoading && searchResults && (
                          <>
                            {[
                              ...searchResults.categories.map((c) => ({
                                type: "category" as const,
                                ...c,
                              })),
                              ...searchResults.products.map((p) => ({
                                type: "product" as const,
                                ...p,
                              })),
                            ].length === 0 ? (
                              <div className="p-4 text-center text-slate-400 text-xs">
                                No results found
                              </div>
                            ) : (
                              <>
                                {searchResults.categories.map((cat) => (
                                  <button
                                    key={cat.id}
                                    onClick={() => {
                                      handleCategoryClick(cat.id);
                                      setMobileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-left"
                                  >
                                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                      {cat.image ? (
                                        <img
                                          src={
                                            cat.image.startsWith("http")
                                              ? cat.image
                                              : `${domainUrl}/${cat.image}`
                                          }
                                          alt={cat.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <CubeIcon className="h-4 w-4 text-slate-400 m-auto mt-2" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-xs text-slate-900 font-bold">
                                        {cat.name}
                                      </div>
                                      <div className="text-[10px] text-slate-400">
                                        Category
                                      </div>
                                    </div>
                                  </button>
                                ))}
                                {searchResults.products.map((prod) => (
                                  <button
                                    key={prod.id}
                                    onClick={() => {
                                      handleProductClick(prod.id);
                                      setMobileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-left"
                                  >
                                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                      {prod.image ? (
                                        <img
                                          src={
                                            prod.image.startsWith("http")
                                              ? prod.image
                                              : `${domainUrl}/${prod.image}`
                                          }
                                          alt={prod.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <ShoppingBagIcon className="h-4 w-4 text-slate-400 m-auto mt-2" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs text-slate-900 font-bold truncate">
                                        {prod.name}
                                      </div>
                                      <div className="text-[10px] text-slate-500">
                                        ₹{prod.price?.toLocaleString()}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                </div>

                <div className="space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={(e) => {
                          if (item.protected && !isAuthenticated) {
                            handleGatedNavigation(e, item.href, true);
                          }
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 mx-2 text-xs font-bold ${
                          active
                            ? "bg-[var(--theme-primary)] text-[var(--theme-primary-ink)] shadow-md shadow-black/10"
                            : "text-slate-700 hover:text-[var(--theme-primary)] hover:bg-slate-100/80"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            active ? "text-[var(--theme-primary-ink)]" : "text-slate-500"
                          }`}
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                  {isAuthenticated && (
                    <Link
                      to="/myorders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 mx-2 text-xs font-bold text-slate-700 hover:text-black hover:bg-slate-100/80"
                    >
                      <BellIcon className="h-4 w-4 text-slate-500" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto min-w-[20px] h-[20px] bg-[var(--theme-accent)] text-[10px] text-[var(--theme-accent-ink)] font-bold rounded-full flex items-center justify-center px-1">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  )}
                </div>
              </div>

              {/* Auth Section */}
              <div className="px-4 py-4 border-t border-slate-100">
                {!isAuthenticated ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setCustomerAuthOpen(true);
                      }}
                      className="block w-full text-center bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-ink)] py-3 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <UserIcon className="h-4 w-4 text-slate-600" />
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 w-full text-center bg-rose-50 hover:bg-rose-100 text-rose-600 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      </header>

      <CustomerAuthModal
        open={customerAuthOpen}
        onClose={() => setCustomerAuthOpen(false)}
      />
    </>
  );
};

export default Navbar;




// import React, { useState, useEffect, useRef } from "react";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import { Dialog, DialogPanel, DialogBackdrop } from "@headlessui/react";
// import {
//   Bars3Icon,
//   UserIcon,
//   XMarkIcon,
//   HeartIcon as HeartOutline,
//   BellIcon,
//   ShoppingCartIcon, // Updated to ShoppingCartIcon to match reference image
//   HomeIcon,
//   CubeIcon,
//   ClipboardDocumentListIcon,
//   CreditCardIcon,
//   MagnifyingGlassIcon,
// } from "@heroicons/react/24/outline";
// import {
//   HeartIcon as HeartSolid,
//   ShoppingCartIcon as ShoppingCartSolid,
//   BellIcon as BellSolid,
// } from "@heroicons/react/24/solid";
// import { useWishlist } from "../context/WishlistContext";
// import { useAuth } from "../context/AuthContext";
// import { useBranding } from "../context/BrandingContext";
// import { useUserNotifications } from "../context/UserNotificationContext";
// import { useNotifications } from "../context/NotificationContext";
// import CustomerAuthModal from "./CustomerAuthModal";
// import toast from "react-hot-toast";
// import api from "../utils/api";
// import { domainUrl } from "../utils/constant";

// const Navbar = ({
//   user,
//   role,
//   cartItemCount = 0,
//   handleLogout,
// }: {
//   user?: { isAuthenticated?: boolean; role?: string | null };
//   role?: string | null;
//   cartItemCount?: number;
//   handleLogout?: () => void;
// }) => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { logout } = useAuth();
//   const { branding } = useBranding();
//   const { wishlistCount } = useWishlist();
//   const {
//     notifications: userNotifications,
//     unreadCount: userUnreadCount,
//     markAsRead,
//   } = useUserNotifications();
//   const { unreadCount: adminUnreadCount } = useNotifications();

//   const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
//   const adminDashboardPath =
//     role === "SUPER_ADMIN" ? "/super-admin-dashboard" : "/admin-dashboard";
//   const unreadCount = isAdmin ? adminUnreadCount : userUnreadCount;
//   const [notifOpen, setNotifOpen] = useState(false);
//   const notifRef = useRef<HTMLDivElement>(null);

//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [scrolled, setScrolled] = useState(false);
//   const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
//   const [customerAuthOpen, setCustomerAuthOpen] = useState(false);

//   // --- SEARCH STATE ---
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchResults, setSearchResults] = useState<{
//     categories: Array<{ id: string; name: string; image?: string }>;
//     products: Array<{
//       id: string;
//       name: string;
//       price: number;
//       image?: string;
//       category?: { id: string; name: string };
//     }>;
//   } | null>(null);
//   const [searchLoading, setSearchLoading] = useState(false);
//   const [searchFocused, setSearchFocused] = useState(false);
//   const searchRef = useRef<HTMLDivElement>(null);

//   // --- ACKNOWLEDGED COUNT STATE (Persisted) ---
//   const [ackCartCount, setAckCartCount] = useState(() => {
//     return parseInt(localStorage.getItem("ack_cart_count") || "0", 10);
//   });

//   const [ackWishlistCount, setAckWishlistCount] = useState(() => {
//     return parseInt(localStorage.getItem("ack_wishlist_count") || "0", 10);
//   });

//   // --- MATCHING LOGIC ---
//   const currentPath = location.pathname.toLowerCase();
//   const isCartPage = currentPath.includes("cart");
//   const isWishlistPage = currentPath.includes("wishlist");

//   // --- SYNC LOGIC ---
//   useEffect(() => {
//     if (isCartPage) {
//       setAckCartCount(cartItemCount);
//       localStorage.setItem("ack_cart_count", String(cartItemCount));
//     }
//   }, [isCartPage, cartItemCount]);

//   useEffect(() => {
//     if (!isWishlistPage) return;
//     setAckWishlistCount((prev) => {
//       const next = Math.max(prev, wishlistCount);
//       localStorage.setItem("ack_wishlist_count", String(next));
//       return next;
//     });
//   }, [isWishlistPage, wishlistCount]);

//   // Scroll effect
//   useEffect(() => {
//     const handleScroll = () => {
//       setScrolled(window.scrollY > 10);
//     };
//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   // Open auth modal from anywhere via window event
//   useEffect(() => {
//     const handler = () => setCustomerAuthOpen(true);
//     window.addEventListener("openCustomerAuth", handler);
//     return () => window.removeEventListener("openCustomerAuth", handler);
//   }, []);

//   // Close notification dropdown on outside click
//   useEffect(() => {
//     const handler = (e: MouseEvent) => {
//       if (notifRef.current && !notifRef.current.contains(e.target as Node))
//         setNotifOpen(false);
//     };
//     if (notifOpen) document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, [notifOpen]);

//   // Close search on outside click
//   useEffect(() => {
//     const handler = (e: MouseEvent) => {
//       if (
//         searchRef.current &&
//         !searchRef.current.contains(e.target as Node)
//       ) {
//         setSearchFocused(false);
//       }
//     };
//     if (searchFocused) document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, [searchFocused]);

//   // Debounced search API call
//   useEffect(() => {
//     if (!searchQuery.trim() || searchQuery.trim().length < 2) {
//       setSearchResults(null);
//       setSearchLoading(false);
//       return;
//     }
//     setSearchLoading(true);
//     const timer = setTimeout(async () => {
//       try {
//         const res = await api.get(
//           `/user/shop/global-search?q=${encodeURIComponent(
//             searchQuery.trim()
//           )}`
//         );
//         setSearchResults(res.data);
//       } catch {
//         setSearchResults({ categories: [], products: [] });
//       } finally {
//         setSearchLoading(false);
//       }
//     }, 350);
//     return () => clearTimeout(timer);
//   }, [searchQuery]);

//   const handleCategoryClick = (categoryId: string) => {
//     setSearchFocused(false);
//     setSearchQuery("");
//     setSearchResults(null);
//     navigate(`/categories/${categoryId}`);
//   };

//   const handleProductClick = (productId: string) => {
//     setSearchFocused(false);
//     setSearchQuery("");
//     setSearchResults(null);
//     navigate(`/products/${productId}`);
//   };

//   const isAuthenticated = user?.isAuthenticated;

//   // --- BADGE VISIBILITY LOGIC ---
//   const showCartBadge = cartItemCount > ackCartCount;
//   const showWishlistBadge = wishlistCount > 0;

//   const handleCartClick = () => {
//     setAckCartCount(cartItemCount);
//     localStorage.setItem("ack_cart_count", String(cartItemCount));
//   };

//   const handleWishlistClick = (e: React.MouseEvent) => {
//     handleGatedNavigation(e, "/WishlistPage", true);
//     setAckWishlistCount((prev) => {
//       const next = Math.max(prev, wishlistCount);
//       localStorage.setItem("ack_wishlist_count", String(next));
//       return next;
//     });
//   };

//   const handleUserIconClick = () => {
//     if (!isAuthenticated) {
//       setCustomerAuthOpen(true);
//     } else {
//       setIsUserDropdownOpen(!isUserDropdownOpen);
//     }
//   };

//   const handleGatedNavigation = (
//     e: React.MouseEvent,
//     path: string,
//     isProtected: boolean
//   ) => {
//     e.preventDefault();

//     if (isProtected && !isAuthenticated) {
//       toast.error("Please login to continue", {
//         id: "please login to continue wishlist",
//       });
//       return;
//     }

//     navigate(path);
//   };

//   const navigation = [
//     { name: "Home", href: "/", protected: false, icon: HomeIcon },
//     { name: "Products", href: "/products", protected: false, icon: CubeIcon },
//     ...(isAuthenticated
//       ? [
//           {
//             name: "My Orders",
//             href: "/myorders",
//             protected: true,
//             icon: ClipboardDocumentListIcon,
//           },
//           {
//             name: "Transactions",
//             href: "/transactions",
//             protected: true,
//             icon: CreditCardIcon,
//           },
//         ]
//       : []),
//   ];

//   const isActive = (path: string) => {
//     if (path === "/") return location.pathname === "/";
//     return location.pathname.startsWith(path);
//   };

//   return (
//     <>
//       <header className="fixed top-0 left-0 w-full z-40 font-sans">
//         <nav
//           className={`relative w-full bg-white transition-all duration-300 border-b border-gray-100 ${
//             scrolled ? "py-3 shadow-xs" : "py-4"
//           }`}
//         >
//           <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
//             <div className="flex items-center justify-between gap-4">
//               {/* LEFT: Logo & Mobile Hamburger */}
//               <div className="flex items-center gap-3 flex-shrink-0">
//                 <button
//                   type="button"
//                   className="lg:hidden p-2 rounded-md hover:bg-gray-100 text-gray-700 transition-colors"
//                   onClick={() => setMobileMenuOpen(true)}
//                 >
//                   <Bars3Icon className="h-6 w-6" />
//                 </button>

//                 <Link to="/" className="flex-shrink-0">
//                   <div className="flex items-center gap-2">
//                     {branding.companyLogo ? (
//                       <img
//                         src={
//                           branding.companyLogo.startsWith("http")
//                             ? branding.companyLogo
//                             : `${domainUrl}/${branding.companyLogo}`
//                         }
//                         alt={branding.companyName || ""}
//                         className="h-7 md:h-8 lg:h-9 w-auto object-contain"
//                       />
//                     ) : null}
//                     <div>
//                       {branding.companyName && (
//                         <div className="text-sm md:text-base font-bold text-gray-900 tracking-tight uppercase">
//                           {branding.companyName}
//                         </div>
//                       )}
//                       {branding.companyTagline && (
//                         <div className="text-[10px] text-gray-500 tracking-wider hidden xl:block">
//                           {branding.companyTagline}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </Link>
//               </div>

//               {/* CENTER: Navigation Links */}
//               <div className="hidden lg:flex items-center space-x-8">
//                 {navigation.map((item) => {
//                   const active = isActive(item.href);
//                   return (
//                     <Link
//                       key={item.name}
//                       to={item.href}
//                       onClick={(e) =>
//                         item.protected && !isAuthenticated
//                           ? handleGatedNavigation(e, item.href, true)
//                           : null
//                       }
//                       className={`text-sm font-medium transition-colors duration-200 ${
//                         active
//                           ? "text-black font-semibold"
//                           : "text-gray-700 hover:text-black"
//                       }`}
//                     >
//                       {item.name}
//                     </Link>
//                   );
//                 })}
//               </div>

//               {/* RIGHT: Search Bar & Icons Matching Reference */}
//               <div className="flex items-center space-x-5 flex-shrink-0">
//                 {/* Pill Search Input */}
//                 <div ref={searchRef} className="relative hidden md:block">
//                   <div className="relative flex items-center">
//                     <input
//                       type="text"
//                       value={searchQuery}
//                       onChange={(e) => setSearchQuery(e.target.value)}
//                       onFocus={() => setSearchFocused(true)}
//                       placeholder="Search anything..."
//                       className="w-48 lg:w-60 xl:w-72 pl-4 pr-10 py-2 bg-white border border-gray-200 rounded-full text-xs xl:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-all duration-200"
//                     />
//                     <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
//                       {searchLoading ? (
//                         <svg
//                           className="animate-spin h-4 w-4 text-gray-400"
//                           fill="none"
//                           viewBox="0 0 24 24"
//                         >
//                           <circle
//                             className="opacity-25"
//                             cx="12"
//                             cy="12"
//                             r="10"
//                             stroke="currentColor"
//                             strokeWidth="4"
//                           />
//                           <path
//                             className="opacity-75"
//                             fill="currentColor"
//                             d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//                           />
//                         </svg>
//                       ) : (
//                         <MagnifyingGlassIcon className="h-4.5 w-4.5 text-red-600 stroke-[2.2]" />
//                       )}
//                     </div>
//                     {searchQuery && !searchLoading && (
//                       <button
//                         onMouseDown={(e) => {
//                           e.preventDefault();
//                           setSearchQuery("");
//                           setSearchResults(null);
//                         }}
//                         className="absolute right-9 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full text-gray-400 cursor-pointer"
//                       >
//                         <XMarkIcon className="h-3.5 w-3.5" />
//                       </button>
//                     )}
//                   </div>

//                   {/* Search Dropdown */}
//                   {searchFocused && searchQuery.trim().length >= 2 && (
//                     <div className="absolute top-full right-0 mt-2 w-80 xl:w-96 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 max-h-[420px] overflow-y-auto p-2">
//                       {searchLoading && (
//                         <div className="p-6 text-center text-sm text-gray-500">
//                           Searching...
//                         </div>
//                       )}
//                       {!searchLoading && searchResults && (
//                         <>
//                           {searchResults.categories.length > 0 && (
//                             <div className="mb-2">
//                               <div className="px-3 py-1 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
//                                 Categories
//                               </div>
//                               {searchResults.categories.map((cat) => (
//                                 <button
//                                   key={cat.id}
//                                   onMouseDown={() =>
//                                     handleCategoryClick(cat.id)
//                                   }
//                                   className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 text-left cursor-pointer"
//                                 >
//                                   <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
//                                     {cat.image ? (
//                                       <img
//                                         src={
//                                           cat.image.startsWith("http")
//                                             ? cat.image
//                                             : `${domainUrl}/${cat.image}`
//                                         }
//                                         alt={cat.name}
//                                         className="w-full h-full object-cover"
//                                       />
//                                     ) : (
//                                       <CubeIcon className="h-4 w-4 text-gray-400 m-auto mt-2" />
//                                     )}
//                                   </div>
//                                   <div className="flex-1 min-w-0">
//                                     <div className="text-xs text-gray-900 font-medium">
//                                       {cat.name}
//                                     </div>
//                                   </div>
//                                 </button>
//                               ))}
//                             </div>
//                           )}

//                           {searchResults.products.length > 0 && (
//                             <div>
//                               <div className="px-3 py-1 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
//                                 Products
//                               </div>
//                               {searchResults.products.map((prod) => (
//                                 <button
//                                   key={prod.id}
//                                   onMouseDown={() =>
//                                     handleProductClick(prod.id)
//                                   }
//                                   className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 text-left cursor-pointer"
//                                 >
//                                   <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
//                                     {prod.image ? (
//                                       <img
//                                         src={
//                                           prod.image.startsWith("http")
//                                             ? prod.image
//                                             : `${domainUrl}/${prod.image}`
//                                         }
//                                         alt={prod.name}
//                                         className="w-full h-full object-cover"
//                                       />
//                                     ) : (
//                                       <ShoppingCartIcon className="h-4 w-4 text-gray-400 m-auto mt-2.5" />
//                                     )}
//                                   </div>
//                                   <div className="flex-1 min-w-0">
//                                     <div className="text-xs text-gray-900 font-medium truncate">
//                                       {prod.name}
//                                     </div>
//                                     <div className="text-[11px] text-gray-500">
//                                       ₹{prod.price?.toLocaleString()}
//                                     </div>
//                                   </div>
//                                 </button>
//                               ))}
//                             </div>
//                           )}

//                           {searchResults.categories.length === 0 &&
//                             searchResults.products.length === 0 && (
//                               <div className="py-8 text-center text-sm text-gray-500">
//                                 No results for "{searchQuery}"
//                               </div>
//                             )}
//                         </>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 {/* 1. Profile / Account Icon */}
//                 <div className="relative">
//                   <button
//                     onClick={handleUserIconClick}
//                     className="p-1 text-gray-900 hover:text-black transition-colors focus:outline-none flex items-center"
//                     aria-label="Account"
//                   >
//                     <UserIcon className="h-5 w-5 stroke-[1.4]" />
//                   </button>

//                   {/* Desktop User Dropdown */}
//                   {isAuthenticated && isUserDropdownOpen && (
//                     <div className="absolute top-full right-0 mt-3 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
//                       <Link
//                         to="/profile"
//                         onClick={() => setIsUserDropdownOpen(false)}
//                         className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
//                       >
//                         <UserIcon className="h-4 w-4 text-gray-500" />
//                         My Profile
//                       </Link>
//                       <div className="border-t border-gray-100 my-1"></div>
//                       <button
//                         onClick={() => {
//                           logout();
//                           setIsUserDropdownOpen(false);
//                         }}
//                         className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
//                       >
//                         Logout
//                       </button>
//                     </div>
//                   )}
//                 </div>

//                 {/* 2. Wishlist Heart Icon */}
//                 {isAuthenticated && (
//                   <button
//                     onClick={handleWishlistClick}
//                     className="relative p-1 text-gray-900 hover:text-black transition-colors flex items-center"
//                     aria-label="Wishlist"
//                   >
//                     {isActive("/wishlist") ? (
//                       <HeartSolid className="h-4 w-4 text-red-600" />
//                     ) : (
//                       <HeartOutline className="h-4.5 w-5 stroke-[1.4]" />
//                     )}
//                     {showWishlistBadge && (
//                       <span className="absolute -top-1 -right-1.5 min-w-[17px] h-[17px] bg-red-600 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-0.5">
//                         {wishlistCount}
//                       </span>
//                     )}
//                   </button>
//                 )}

//                 {/* 3. Shopping Cart Icon */}
//                 {isAuthenticated && (
//                   <Link
//                     to="/cart"
//                     onClick={(e) => {
//                       if (!isAuthenticated) {
//                         e.preventDefault();
//                         toast.error("Please login to continue", {
//                           id: "Navbar login to continue",
//                         });
//                         return;
//                       }
//                       handleCartClick();
//                     }}
//                     className="relative p-1 text-gray-900 hover:text-black transition-colors flex items-center"
//                     aria-label="Cart"
//                   >
//                     {isActive("/cart") ? (
//                       <ShoppingCartSolid className="h-5 w-5 text-black" />
//                     ) : (
//                       <ShoppingCartIcon className="h-5 w-5 stroke-[1.4]" />
//                     )}
//                     {showCartBadge && (
//                       <span className="absolute -top-1 -right-1.5 min-w-[17px] h-[17px] bg-red-600 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-0.5">
//                         {cartItemCount}
//                       </span>
//                     )}
//                   </Link>
//                 )}

//                 {/* 4. Notification Bell Icon */}
//                 {isAuthenticated && (
//                   <div ref={notifRef} className="relative">
//                     {isAdmin ? (
//                       <button
//                         onClick={() =>
//                           navigate(`${adminDashboardPath}/notifications`)
//                         }
//                         className="relative p-1 text-gray-900 hover:text-black transition-colors flex items-center"
//                         aria-label="Notifications"
//                       >
//                         <BellIcon className="h-6 w-6 stroke-[1.6]" />
//                         {unreadCount > 0 && (
//                           <span className="absolute -top-1 -right-1.5 min-w-[17px] h-[17px] bg-red-600 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-0.5">
//                             {unreadCount > 99 ? "99+" : unreadCount}
//                           </span>
//                         )}
//                       </button>
//                     ) : (
//                       <>
//                         <button
//                           onClick={() => setNotifOpen((o) => !o)}
//                           className="relative p-1 text-gray-900 hover:text-black transition-colors flex items-center"
//                           aria-label="Notifications"
//                         >
//                           {notifOpen ? (
//                             <BellSolid className="h-6 w-6 text-black" />
//                           ) : (
//                             <BellIcon className="h-5 w-5 stroke-[1.4]" />
//                           )}
//                           {unreadCount > 0 && (
//                             <span className="absolute -top-1 -right-1.5 min-w-[17px] h-[17px] bg-red-600 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-0.5">
//                               {unreadCount > 99 ? "99+" : unreadCount}
//                             </span>
//                           )}
//                         </button>

//                         {/* Dropdown panel */}
//                         {notifOpen && (
//                           <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
//                             <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
//                               <h3 className="font-semibold text-gray-900 text-xs uppercase tracking-wider">
//                                 Notifications
//                               </h3>
//                               {unreadCount > 0 && (
//                                 <span className="text-[10px] bg-red-50 text-red-600 rounded-full px-2 py-0.5 font-bold">
//                                   {unreadCount} new
//                                 </span>
//                               )}
//                             </div>

//                             <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
//                               {userNotifications.length === 0 ? (
//                                 <p className="text-center text-xs text-gray-400 py-8">
//                                   No notifications yet
//                                 </p>
//                               ) : (
//                                 userNotifications.slice(0, 8).map((n) => {
//                                   const id = n.id ?? n._id;
//                                   return (
//                                     <button
//                                       key={id}
//                                       className={`w-full text-left px-4 py-3 text-xs flex items-start gap-2 hover:bg-gray-50 transition-colors ${
//                                         !n.isRead ? "bg-red-50/30 font-medium" : "text-gray-600"
//                                       }`}
//                                       onClick={() => {
//                                         if (!n.isRead && id) markAsRead(id);
//                                         setNotifOpen(false);
//                                       }}
//                                     >
//                                       {!n.isRead && (
//                                         <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" />
//                                       )}
//                                       <div className={n.isRead ? "pl-3.5" : ""}>
//                                         <p className="line-clamp-2 text-gray-800">
//                                           {n.message}
//                                         </p>
//                                         {n.createdAt && (
//                                           <p className="text-[10px] text-gray-400 mt-1">
//                                             {new Date(
//                                               n.createdAt
//                                             ).toLocaleString("en-IN", {
//                                               day: "numeric",
//                                               month: "short",
//                                               hour: "2-digit",
//                                               minute: "2-digit",
//                                             })}
//                                           </p>
//                                         )}
//                                       </div>
//                                     </button>
//                                   );
//                                 })
//                               )}
//                             </div>
//                           </div>
//                         )}
//                       </>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </nav>

//         {/* MOBILE MENU */}
//         <Dialog
//           open={mobileMenuOpen}
//           onClose={setMobileMenuOpen}
//           className="relative z-[100] lg:hidden"
//         >
//           <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 z-[100]" />
//           <div className="fixed inset-0 z-[100] flex">
//             <DialogPanel className="relative mr-auto flex h-full w-[300px] max-w-[80vw] flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300">
//               <div className="p-4 flex items-center justify-between border-b border-gray-100">
//                 <Link to="/" onClick={() => setMobileMenuOpen(false)}>
//                   <div className="flex items-center gap-2">
//                     {branding.companyLogo ? (
//                       <img
//                         src={
//                           branding.companyLogo.startsWith("http")
//                             ? branding.companyLogo
//                             : `${domainUrl}/${branding.companyLogo}`
//                         }
//                         alt={branding.companyName || ""}
//                         className="h-7 w-auto object-contain"
//                       />
//                     ) : null}
//                     <span className="font-bold text-gray-900 text-sm">
//                       {branding.companyName}
//                     </span>
//                   </div>
//                 </Link>
//                 <button
//                   onClick={() => setMobileMenuOpen(false)}
//                   className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
//                 >
//                   <XMarkIcon className="h-6 w-6" />
//                 </button>
//               </div>

//               <div className="p-4 space-y-4 flex-1">
//                 <div className="relative">
//                   <input
//                     type="text"
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     placeholder="Search anything..."
//                     className="w-full pl-3 pr-8 py-2 text-xs bg-gray-50 border border-gray-200 rounded-full focus:outline-none"
//                   />
//                   <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-600" />
//                 </div>

//                 <div className="space-y-1">
//                   {navigation.map((item) => (
//                     <Link
//                       key={item.name}
//                       to={item.href}
//                       onClick={(e) => {
//                         if (item.protected && !isAuthenticated) {
//                           handleGatedNavigation(e, item.href, true);
//                         }
//                         setMobileMenuOpen(false);
//                       }}
//                       className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
//                     >
//                       {item.name}
//                     </Link>
//                   ))}
//                 </div>
//               </div>

//               <div className="p-4 border-t border-gray-100">
//                 {!isAuthenticated ? (
//                   <button
//                     onClick={() => {
//                       setMobileMenuOpen(false);
//                       setCustomerAuthOpen(true);
//                     }}
//                     className="w-full py-2 bg-black text-white text-xs font-semibold rounded-lg"
//                   >
//                     Sign In
//                   </button>
//                 ) : (
//                   <div className="space-y-2">
//                     <Link
//                       to="/profile"
//                       onClick={() => setMobileMenuOpen(false)}
//                       className="block w-full text-center py-2 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg"
//                     >
//                       My Profile
//                     </Link>
//                     <button
//                       onClick={() => {
//                         logout();
//                         setMobileMenuOpen(false);
//                       }}
//                       className="block w-full text-center py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg"
//                     >
//                       Logout
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </DialogPanel>
//           </div>
//         </Dialog>
//       </header>

//       <CustomerAuthModal
//         open={customerAuthOpen}
//         onClose={() => setCustomerAuthOpen(false)}
//       />
//     </>
//   );
// };

// export default Navbar;