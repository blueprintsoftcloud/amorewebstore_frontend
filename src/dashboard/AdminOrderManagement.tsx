// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import { domainUrl } from "../utils/constant";
// import api from "../utils/api";
// import { useAuth } from "../context/AuthContext";
// import { useStaffPermissions } from "../context/StaffPermissionContext";
// import { useFeatureFlags } from "../context/FeatureFlagContext";
// import { usePremiumModal } from "../context/PremiumModalContext";

// import {
//   ClockIcon,
//   CheckCircleIcon,
//   XCircleIcon,
//   UserIcon,
//   TruckIcon,
// } from "@heroicons/react/20/solid";

// import {
//   ChevronRightIcon,
//   XMarkIcon,
//   InformationCircleIcon,
// } from "@heroicons/react/24/outline";

// // --- API Endpoints ---
// const ADMIN_ALL_ORDERS_ENDPOINT = '/order/all';

// interface OrderItem {
//   product: { id: string; name: string; image?: string } | null;
//   quantity: number;
//   price: number;
// }

// interface Order {
//   id: string;
//   user?: { username?: string; email?: string };
//   createdAt: string;
//   totalAmount: number;
//   discountAmount: number;
//   shippingCharge: number;
//   finalAmount: number;
//   orderStatus: string;
//   items?: OrderItem[];
// }

// const ADMIN_UPDATE_STATUS_ENDPOINT = '/order/update';

// // Helper: Status icon
// const getStatusIcon = (status: string) => {
//   switch (status) {
//     case "PROCESSING":
//     case "CONFIRMED":
//       return <ClockIcon className="size-4" aria-hidden="true" />;
//     case "SHIPPED":
//       return <TruckIcon className="size-4" aria-hidden="true" />;
//     case "DELIVERED":
//       return <CheckCircleIcon className="size-4" aria-hidden="true" />;
//     case "CANCELLED":
//       return <XCircleIcon className="size-4" aria-hidden="true" />;
//     default:
//       return <ClockIcon className="size-4" aria-hidden="true" />;
//   }
// };

// // Helper: Status badge styles & animation
// const getStatusClasses = (status: string) => {
//   switch (status) {
//     case "PROCESSING":
//     case "CONFIRMED":
//       return {
//         container:
//           "inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 shadow-sm",
//         dot: "h-2 w-2 rounded-full bg-amber-400 animate-pulse",
//       };
//     case "SHIPPED":
//       return {
//         container:
//           "inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 shadow-sm",
//         dot: "h-2 w-2 rounded-full bg-sky-400 animate-pulse",
//       };
//     case "DELIVERED":
//       return {
//         container:
//           "inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-sm",
//         dot: "h-2 w-2 rounded-full bg-emerald-400",
//       };
//     case "CANCELLED":
//       return {
//         container:
//           "inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 shadow-sm",
//         dot: "h-2 w-2 rounded-full bg-rose-400",
//       };
//     default:
//       return {
//         container:
//           "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm",
//         dot: "h-2 w-2 rounded-full bg-slate-400",
//       };
//   }
// };

// const statusOptions = ["PROCESSING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
// // Display helper: "PROCESSING" → "Processing"
// const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

// const formatDateTime = (value: string | undefined) => {
//   if (!value) return "—";
//   return new Date(value).toLocaleString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// };

// const MOCK_ORDERS: Order[] = [
//   {
//     id: "order_mock1",
//     user: { username: "John Doe", email: "john@example.com" },
//     createdAt: new Date().toISOString(),
//     totalAmount: 1250.00,
//     discountAmount: 0,
//     shippingCharge: 50.00,
//     finalAmount: 1300.00,
//     orderStatus: "PROCESSING",
//     items: [
//       {
//         product: { id: "p1", name: "Premium Leather Jacket", image: "https://placehold.co/96x96/f3f4f6/6b7280?text=Jacket" },
//         quantity: 1,
//         price: 1250.00
//       }
//     ]
//   },
//   {
//     id: "order_mock2",
//     user: { username: "Alice Smith", email: "alice@example.com" },
//     createdAt: new Date(Date.now() - 3600000).toISOString(),
//     totalAmount: 2450.00,
//     discountAmount: 200.00,
//     shippingCharge: 0,
//     finalAmount: 2250.00,
//     orderStatus: "SHIPPED",
//     items: [
//       {
//         product: { id: "p2", name: "Designer Silk Saree", image: "https://placehold.co/96x96/f3f4f6/6b7280?text=Saree" },
//         quantity: 1,
//         price: 2450.00
//       }
//     ]
//   },
//   {
//     id: "order_mock3",
//     user: { username: "Bob Johnson", email: "bob@example.com" },
//     createdAt: new Date(Date.now() - 7200000).toISOString(),
//     totalAmount: 499.00,
//     discountAmount: 0,
//     shippingCharge: 50.00,
//     finalAmount: 549.00,
//     orderStatus: "DELIVERED",
//     items: [
//       {
//         product: { id: "p3", name: "Casual Cotton T-Shirt", image: "https://placehold.co/96x96/f3f4f6/6b7280?text=T-Shirt" },
//         quantity: 1,
//         price: 499.00
//       }
//     ]
//   }
// ];

// export default function AdminOrderManagementPage() {
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const { hasPermission } = useStaffPermissions();
//   const { isLocked, isGloballyEnabled } = useFeatureFlags();
//   const { openPremiumModal } = usePremiumModal();

//   const isStaff = user.role === "STAFF";
//   const orderManagementEnabled = isGloballyEnabled("ORDER_MANAGEMENT");
//   const canUpdateOrder = !isStaff || hasPermission("ORDER_UPDATE");

//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
//   const [drawerOpen, setDrawerOpen] = useState(false);

//   // --- Fetch ALL Orders (Admin, cookie-based) ---
//   const fetchAllOrders = useCallback(async () => {
//     if (isLocked("ORDER_MANAGEMENT")) {
//       setOrders(MOCK_ORDERS);
//       setError(null);
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await api.get(ADMIN_ALL_ORDERS_ENDPOINT, {
//         // withCredentials: true,
//       });
//       setOrders(res.data.order || []);
//     } catch (err) {
//       const _e = err as any;
//       console.error("Error fetching all orders:", err);
//       const status = _e.response?.status;
//       if (status === 403) {
//         setError("Failed to fetch orders: You do not have Admin permissions.");
//       } else {
//         setError(
//           "Failed to fetch orders. Please check backend connection and API endpoint."
//         );
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, [isLocked]);

//   useEffect(() => {
//     fetchAllOrders();
//   }, [fetchAllOrders]);

//   // --- Update status (cookie-based) ---
//   const handleUpdateStatus = async (orderId: string, newStatus: string) => {
//     if (isLocked("ORDER_MANAGEMENT")) {
//       openPremiumModal("ORDER_MANAGEMENT");
//       return;
//     }

//     const currentOrder = orders.find((o) => o.id === orderId);
//     if (!currentOrder || currentOrder.orderStatus === newStatus) return;

//     const originalOrders = [...orders];
//     setOrders((prev) =>
//       prev.map((order) =>
//         order.id === orderId ? { ...order, orderStatus: newStatus } : order
//       )
//     );

//     // Also update in drawer if currently open for this order
//     setSelectedOrder((prev) =>
//       prev && prev.id === orderId ? { ...prev, orderStatus: newStatus } : prev
//     );

//     try {
//       await api.put(
//         `${ADMIN_UPDATE_STATUS_ENDPOINT}/${orderId}`,
//         { orderStatus: newStatus },
//         // { withCredentials: true }
//       );
//     } catch (err) {
//       const _e = err as any;
//       console.error("Failed to update order status:", err);
//       alert(
//         `Failed to update status for order #${orderId.slice(
//           -8
//         )}. Reverting change.`
//       );
//       setOrders(originalOrders);
//       const revertOrder = originalOrders.find((o) => o.id === orderId);
//       setSelectedOrder((prev) =>
//         prev && prev.id === orderId ? (revertOrder ?? null) : prev
//       );
//     }
//   };

//   const handleViewInvoice = (orderId: string) => {
//     if (isLocked("ORDER_MANAGEMENT")) {
//       openPremiumModal("ORDER_MANAGEMENT");
//       return;
//     }
//     navigate(`/invoice/${orderId}`);
//   };

//   // --- Metrics (for header cards) ---
//   const metrics = useMemo(() => {
//     if (!orders.length) {
//       return {
//         totalRevenue: 0,
//         totalOrders: 0,
//         delivered: 0,
//         processing: 0,
//       };
//     }

//     const totalRevenue = orders.reduce(
//       (sum, o) => sum + (o.finalAmount ?? o.totalAmount ?? 0),
//       0
//     );
//     const delivered = orders.filter((o) => o.orderStatus === "DELIVERED")
//       .length;
//     const processing = orders.filter((o) => o.orderStatus === "PROCESSING" || o.orderStatus === "CONFIRMED")
//       .length;

//     return {
//       totalRevenue,
//       totalOrders: orders.length,
//       delivered,
//       processing,
//     };
//   }, [orders]);

//   const openDrawer = (order: Order) => {
//     setSelectedOrder(order);
//     setDrawerOpen(true);
//   };

//   const closeDrawer = () => {
//     setDrawerOpen(false);
//     setSelectedOrder(null);
//   };

//   // --- Render states ---
//   if (loading) {
//     return (
//       <div className="bg-slate-50 min-h-screen">
//         <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between">
//             <div className="animate-pulse space-y-3">
//               <div className="h-7 w-48 rounded-md bg-slate-200" />
//               <div className="h-4 w-72 rounded-md bg-slate-200" />
//             </div>
//             <div className="hidden md:flex gap-3 animate-pulse">
//               <div className="h-10 w-32 rounded-lg bg-slate-200" />
//               <div className="h-10 w-32 rounded-lg bg-slate-200" />
//             </div>
//           </div>

//           <div className="mt-10 grid gap-4 sm:grid-cols-3">
//             {[1, 2, 3].map((i) => (
//               <div
//                 key={i}
//                 className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse"
//               >
//                 <div className="h-4 w-20 rounded-md bg-slate-200" />
//                 <div className="mt-3 h-7 w-24 rounded-md bg-slate-200" />
//               </div>
//             ))}
//           </div>

//           <div className="mt-10 rounded-2xl border border-slate-200 bg-white shadow-sm">
//             <div className="border-b border-slate-200 px-6 py-4">
//               <div className="h-5 w-40 rounded-md bg-slate-200 animate-pulse" />
//             </div>
//             <div className="divide-y divide-slate-100">
//               {[1, 2, 3, 4, 5].map((i) => (
//                 <div
//                   key={i}
//                   className="flex items-center gap-4 px-6 py-4 animate-pulse"
//                 >
//                   <div className="h-4 w-24 rounded-md bg-slate-200" />
//                   <div className="h-4 w-40 rounded-md bg-slate-200" />
//                   <div className="h-4 w-32 rounded-md bg-slate-200" />
//                   <div className="h-4 w-20 rounded-md bg-slate-200" />
//                   <div className="ml-auto h-8 w-24 rounded-full bg-slate-200" />
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-slate-50 min-h-screen flex items-center justify-center px-4">
//         <div className="max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
//           <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3">
//             <XCircleIcon className="size-6" />
//           </div>
//           <h2 className="text-lg font-semibold text-rose-800 mb-1">
//             Something went wrong
//           </h2>
//           <p className="text-sm text-rose-700">{error}</p>
//         </div>
//       </div>
//     );
//   }

//   if (!orders.length) {
//     return (
//       <div className="bg-slate-50 min-h-screen flex items-center justify-center px-4">
//         <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
//           <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
//             <InformationCircleIcon className="size-6" />
//           </div>
//           <h2 className="text-lg font-semibold text-slate-900 mb-1">
//             No orders yet
//           </h2>
//           <p className="text-sm text-slate-600">
//             There are currently no orders placed. New orders will appear here
//             automatically.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//   <div className="bg-slate-50/50 min-h-screen">
//     <div className="px-8 py-8 w-full">

//       {/* Premium Dashboard Header Section */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 mb-6 border-b border-gray-200">
//         <div>
//           <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-indigo-600 uppercase mb-1">
//             <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
//             Operations Portal
//           </div>
//           <h1 className="text-3xl font-black tracking-tight text-gray-950">
//             Admin Order Management
//           </h1>
//           <p className="mt-1 text-sm text-slate-500 max-w-2xl">
//             Monitor, track, and update every order in real time with a centralized checkout status overview and processing controls.
//           </p>
//         </div>

//         <div className="flex flex-wrap gap-2 self-start md:self-center">
//           <button
//             type="button"
//             onClick={() => {
//               if (isLocked("ORDER_MANAGEMENT")) {
//                 openPremiumModal("ORDER_MANAGEMENT");
//               } else {
//                 fetchAllOrders();
//               }
//             }}
//             className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
//           >
//             <ClockIcon className="mr-1.5 size-4 text-slate-400" />
//             Refresh Orders
//           </button>
//         </div>
//       </div>

//         {/* Metrics */}
//         <div className="
//   mt-6 
//   grid gap-4

//   grid-cols-1
//   sm:grid-cols-2
//   lg:grid-cols-4

//   xl:gap-6 
// ">

//           <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//             <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//               Total Orders
//             </p>
//             <p className="mt-2 text-2xl font-semibold text-slate-900">
//               <span className={isLocked("ORDER_MANAGEMENT") ? "blur-sm select-none" : ""}>
//                 {metrics.totalOrders}
//               </span>
//             </p>
//           </div>
//           <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
//             <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
//               Revenue
//             </p>
//             <p className="mt-2 text-2xl font-semibold text-emerald-900">
//               <span className={isLocked("ORDER_MANAGEMENT") ? "blur-sm select-none" : ""}>
//                 ₹{metrics.totalRevenue.toFixed(2)}
//               </span>
//             </p>
//           </div>
//           <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
//             <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
//               Processing
//             </p>
//             <p className="mt-2 text-2xl font-semibold text-amber-900">
//               <span className={isLocked("ORDER_MANAGEMENT") ? "blur-sm select-none" : ""}>
//                 {metrics.processing}
//               </span>
//             </p>
//           </div>
//           <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
//             <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
//               Delivered
//             </p>
//             <p className="mt-2 text-2xl font-semibold text-emerald-950">
//               <span className={isLocked("ORDER_MANAGEMENT") ? "blur-sm select-none" : ""}>
//                 {metrics.delivered}
//               </span>
//             </p>
//           </div>
//         </div>

//         {/* Orders Table */}
//         <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
//           <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
//             <div>
//               <h2 className="text-sm font-semibold text-slate-900">
//                 All Orders
//               </h2>
//               <p className="text-xs text-slate-500">
//                 Click a row to view customer details and items.
//               </p>
//             </div>
//           </div>

//          <div className="overflow-x-auto max-w-full">

//             <table className="min-w-full divide-y divide-slate-200 text-sm">
//               <thead className="bg-slate-50">
//                 <tr>
//                   <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Order
//                   </th>
//                   <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Customer
//                   </th>
//                   <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Placed At
//                   </th>
//                   <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Total
//                   </th>
//                   <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Status
//                   </th>
//                   <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Update
//                   </th>
//                   <th className="px-4 py-3" />
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100 bg-white">
//                 {orders.map((order) => {
//                   const shortId = `#${order.id.slice(-8)}`;
//                   const statusStyle = getStatusClasses(order.orderStatus);

//                   return (
//                     <tr
//                       key={order.id}
//                       className="hover:bg-slate-50 transition-colors"
//                     >
//                       <td
//                         className="whitespace-nowrap px-4 py-3 text-xs font-mono text-slate-700 cursor-pointer"
//                         onClick={() => openDrawer(order)}
//                       >
//                         <span className="inline-flex items-center gap-1.5">
//                           <span className={`font-semibold ${isLocked("ORDER_MANAGEMENT") ? "blur-sm select-none" : ""}`}>{shortId}</span>
//                         </span>
//                       </td>

//                       <td
//                         className="whitespace-nowrap px-4 py-3 cursor-pointer"
//                         onClick={() => openDrawer(order)}
//                       >
//                         <div className="flex items-center gap-2">
//                           <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
//                             <UserIcon className="size-4" />
//                           </div>
//                           <div>
//                             <p className={`text-sm font-medium text-slate-900 ${isLocked("ORDER_MANAGEMENT") ? "blur-sm select-none" : ""}`}>
//                               {order.user?.username || "N/A"}
//                             </p>
//                             <p className={`text-xs text-slate-500 ${isLocked("ORDER_MANAGEMENT") ? "blur-sm select-none" : ""}`}>
//                               {order.user?.email || "No email"}
//                             </p>
//                           </div>
//                         </div>
//                       </td>

//                       <td className={`whitespace-nowrap px-4 py-3 text-xs text-slate-600 ${isLocked("ORDER_MANAGEMENT") ? "blur-sm select-none" : ""}`}>
//                         {formatDateTime(order.createdAt)}
//                       </td>

//                       <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900">
//                         <span className={isLocked("ORDER_MANAGEMENT") ? "blur-sm select-none" : ""}>
//                           ₹{(order.finalAmount ?? order.totalAmount)?.toFixed(2) ?? "0.00"}
//                         </span>
//                       </td>

//                       <td className="whitespace-nowrap px-4 py-3 text-xs">
//                         <div className={statusStyle.container}>
//                           <span className={statusStyle.dot} />
//                           {getStatusIcon(order.orderStatus)}
//                           <span className="">
//                             {statusLabel(order.orderStatus || "UNKNOWN")}
//                           </span>
//                         </div>
//                       </td>

//                       <td className="whitespace-nowrap px-4 py-3 text-xs">
//                         <div className="relative inline-block">
//                           <select
//                             value={order.orderStatus}
//                             disabled={order.orderStatus === "CANCELLED"}
//                             onChange={(e) => {
//                               if (isLocked("ORDER_MANAGEMENT")) {
//                                 openPremiumModal("ORDER_MANAGEMENT");
//                               } else {
//                                 handleUpdateStatus(order.id, e.target.value);
//                               }
//                             }}
//                             className={`rounded-full border px-3 py-1 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
//                               isLocked("ORDER_MANAGEMENT")
//                                 ? "cursor-pointer border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//                                 : !canUpdateOrder
//                                 ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400 opacity-60"
//                                 : order.orderStatus === "CANCELLED"
//                                 ? "cursor-not-allowed border-rose-200 bg-rose-50 text-rose-700"
//                                 : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//                             }`}
//                           >
//                             {!statusOptions.includes(order.orderStatus) && (
//                               <option value={order.orderStatus}>
//                                 {order.orderStatus}
//                               </option>
//                             )}
//                             {statusOptions.map((status) => (
//                               <option key={status} value={status}>
//                                 {statusLabel(status)}
//                               </option>
//                             ))}
//                           </select>
//                           {isLocked("ORDER_MANAGEMENT") && (
//                             <div
//                               onClick={(e) => {
//                                 e.preventDefault();
//                                 e.stopPropagation();
//                                 openPremiumModal("ORDER_MANAGEMENT");
//                               }}
//                               className="absolute inset-0 cursor-pointer"
//                               style={{ background: "transparent" }}
//                             />
//                           )}
//                         </div>
//                       </td>

//                       <td className="whitespace-nowrap px-4 py-3 text-right">
//                         <div className="inline-flex items-center gap-2">
//                           <button
//                             type="button"
//                             onClick={() => handleViewInvoice(order.id)}
//                             className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
//                             title="View Invoice"
//                           >
//                             Invoice
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => openDrawer(order)}
//                             className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
//                           >
//                             View
//                             <ChevronRightIcon className="ml-1.5 size-4" />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Drawer: Customer & Order Details */}
//         {drawerOpen && selectedOrder && (
//           <>
//             {/* Overlay */}
//             <div
//               className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
//               onClick={closeDrawer}
//             />
//             {/* Panel */}
//             <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md transform bg-white shadow-2xl transition-transform duration-200 ease-out">
//               <div className="flex h-full flex-col">
//                 <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
//                   <div>
//                     <p className="text-xs font-medium text-slate-500">
//                       Order
//                     </p>
//                     <p className="text-sm font-semibold text-slate-900">
//                       #{selectedOrder.id.slice(-8)}
//                     </p>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <button
//                       type="button"
//                       onClick={() => handleViewInvoice(selectedOrder.id)}
//                       className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
//                     >
//                       Invoice
//                     </button>
//                     <button
//                       type="button"
//                       onClick={closeDrawer}
//                       className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
//                     >
//                       <XMarkIcon className="size-5" />
//                     </button>
//                   </div>
//                 </div>

//                 <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
//                   {/* Customer */}
//                   <section className="mb-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
//                     <div className="flex items-center gap-3">
//                       <div className="flex size-10 items-center justify-center rounded-full bg-slate-900 text-slate-50">
//                         <UserIcon className="size-5" />
//                       </div>
//                       <div>
//                         <p className={`text-sm font-semibold text-slate-900 ${isLocked("ORDER_MANAGEMENT") ? "blur-sm select-none" : ""}`}>
//                           {selectedOrder.user?.username || "N/A"}
//                         </p>
//                         <p className={`text-xs text-slate-600 ${isLocked("ORDER_MANAGEMENT") ? "blur-sm select-none" : ""}`}>
//                           {selectedOrder.user?.email || "No email provided"}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
//                       <div>
//                         <p className="font-medium text-slate-500">
//                           Placed At
//                         </p>
//                         <p className={`mt-0.5 ${isLocked("ORDER_MANAGEMENT") ? "blur-sm select-none" : ""}`}>
//                           {formatDateTime(selectedOrder.createdAt)}
//                         </p>
//                       </div>
//                       <div>
//                         <p className="font-medium text-slate-500">
//                           Total Amount
//                         </p>
//                         <p className={`mt-0.5 font-semibold text-slate-900 ${isLocked("ORDER_MANAGEMENT") ? "blur-sm select-none" : ""}`}>
//                           ₹
//                           {(selectedOrder.finalAmount ?? selectedOrder.totalAmount)?.toFixed(2) ?? "0.00"}
//                         </p>
//                         {selectedOrder.discountAmount > 0 && (
//                           <p className={`text-[11px] text-green-600 font-semibold mt-0.5 ${isLocked("ORDER_MANAGEMENT") ? "blur-sm select-none" : ""}`}>
//                             Saved ₹{selectedOrder.discountAmount.toFixed(2)}
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                   </section>

//                   {/* Status controls */}
//                   <section className="mb-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
//                     <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
//                       Order Status
//                     </p>
//                     <div className="flex items-center justify-between gap-3">
//                       <div>
//                         {(() => {
//                           const s = getStatusClasses(
//                             selectedOrder.orderStatus
//                           );
//                           return (
//                             <div className={s.container}>
//                               <span className={s.dot} />
//                               {getStatusIcon(selectedOrder.orderStatus)}
//                               <span className="">
//                                 {statusLabel(selectedOrder.orderStatus || "UNKNOWN")}
//                               </span>
//                             </div>
//                           );
//                         })()}
//                       </div>
//                       <div className="relative inline-block">
//                         <select
//                           value={selectedOrder.orderStatus}
//                           disabled={selectedOrder.orderStatus === "CANCELLED"}
//                           onChange={(e) => {
//                             if (isLocked("ORDER_MANAGEMENT")) {
//                               openPremiumModal("ORDER_MANAGEMENT");
//                             } else {
//                               handleUpdateStatus(selectedOrder.id, e.target.value);
//                             }
//                           }}
//                           className={`rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
//                             isLocked("ORDER_MANAGEMENT")
//                               ? "cursor-pointer border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//                               : !canUpdateOrder
//                               ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400 opacity-60"
//                               : selectedOrder.orderStatus === "CANCELLED"
//                               ? "cursor-not-allowed border-rose-200 bg-rose-50 text-rose-700"
//                               : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//                           }`}
//                         >
//                           {!statusOptions.includes(selectedOrder.orderStatus) && (
//                             <option value={selectedOrder.orderStatus}>
//                               {selectedOrder.orderStatus}
//                             </option>
//                           )}
//                           {statusOptions.map((status) => (
//                             <option key={status} value={status}>
//                               {status}
//                             </option>
//                           ))}
//                         </select>
//                         {isLocked("ORDER_MANAGEMENT") && (
//                           <div
//                             onClick={(e) => {
//                               e.preventDefault();
//                               e.stopPropagation();
//                               openPremiumModal("ORDER_MANAGEMENT");
//                             }}
//                             className="absolute inset-0 cursor-pointer"
//                             style={{ background: "transparent" }}
//                           />
//                         )}
//                       </div>
//                     </div>
//                   </section>

//                   {/* Items */}
//                   <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
//                     <div className="flex items-center justify-between">
//                       <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Order Items
//                       </p>
//                       <p className="text-xs text-slate-500">
//                         {selectedOrder.items?.length || 0} items
//                       </p>
//                     </div>
//                     <div className="divide-y divide-slate-100">
//                       {selectedOrder.items?.map((item: OrderItem, index: number) => {
//                         const isProductUnavailable = !item.product;
//                         const subtotal =
//                           (item.price || 0) * (item.quantity || 0);

//                         return (
//                           <div
//                             key={index}
//                             className="flex gap-3 py-3 first:pt-0 last:pb-0"
//                           >
//                             <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
//                               {isProductUnavailable ? (
//                                 <div className="flex h-full w-full flex-col items-center justify-center bg-rose-50 text-[10px] font-semibold text-rose-700">
//                                   <XCircleIcon className="mb-1 size-5" />
//                                   <span>PRODUCT</span>
//                                   <span>DELETED</span>
//                                 </div>
//                               ) : (
//                                 <img
//                                   src={
//                                     item.product!.image ||
//                                     "https://placehold.co/96x96/f3f4f6/6b7280?text=No+Image"
//                                   }
//                                   alt={item.product!.name}
//                                   className="h-full w-full object-cover object-center"
//                                 />
//                               )}
//                             </div>
//                             <div className="flex flex-1 flex-col justify-between text-xs">
//                               <div className="flex items-start justify-between gap-2">
//                                 <div>
//                                   <p className="text-[13px] font-medium text-slate-900">
//                                     {isProductUnavailable
//                                       ? "Product Unavailable"
//                                       : item.product!.name}
//                                   </p>
//                                   <p className={`mt-0.5 text-[11px] text-slate-500 ${isLocked("ORDER_MANAGEMENT") ? "blur-sm select-none" : ""}`}>
//                                     Unit: ₹{(item.price || 0).toFixed(2)} · Qty:{" "}
//                                     {item.quantity}
//                                   </p>
//                                 </div>
//                                 <p className={`text-[13px] font-semibold text-slate-900 ${isLocked("ORDER_MANAGEMENT") ? "blur-sm select-none" : ""}`}>
//                                   ₹{subtotal.toFixed(2)}
//                                 </p>
//                               </div>

//                               {selectedOrder.orderStatus === "CANCELLED" &&
//                                 isProductUnavailable && (
//                                   <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 border border-rose-200">
//                                     <XCircleIcon className="size-3" />
//                                     <span>
//                                       Auto-cancelled: Product/Category deleted
//                                     </span>
//                                   </div>
//                                 )}
//                             </div>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </section>
//                 </div>
//               </div>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }








import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { useNavigate, useSearchParams } from "react-router-dom";
import { domainUrl } from "../utils/constant";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useStaffPermissions } from "../context/StaffPermissionContext";
import ShipOrderModal, { ShipOrderPayload } from "./ShipOrderModal";

import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  TruckIcon,
} from "@heroicons/react/20/solid";

import {
  ChevronRightIcon,
  XMarkIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CurrencyRupeeIcon,
  ShoppingBagIcon,
  PhotoIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";

// --- API Endpoints ---
const ADMIN_ALL_ORDERS_ENDPOINT = '/order/all';

interface OrderItem {
  product: { id: string; name: string; image?: string } | null;
  quantity: number;
  price: number;
  /** e.g. { Storage: "128GB", Color: "Black" } — the specific option this line item
   * was purchased in, if the product has variants (see mongoose.ts's ProductVariant).
   * null for a plain single-SKU product. */
  variant?: { options: Record<string, string> } | null;
}

interface Order {
  id: string;
  user?: { username?: string; email?: string; phone?: string };
  createdAt: string;
  totalAmount: number;
  discountAmount: number;
  shippingCharge: number;
  finalAmount: number;
  orderStatus: string;
  paymentMethod?: string;
  paymentStatus?: string;
  transactionId?: string;
  paymentScreenshot?: string;
  items?: OrderItem[];
  shippingAddress?: {
    fullAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    lat?: number;
    lng?: number;
  } | null;
  deliveryPartnerName?: string;
  trackingId?: string;
  trackingLink?: string;
  shippingNote?: string;
}

interface OrderStats {
  totalOrders: number;
  /** Realized revenue — PAID orders only, not the face value of every order. */
  paidRevenue: number;
  /** Face value of every order regardless of payment status — the denominator for
   * "% of order value actually collected". */
  totalOrderValue: number;
  processing: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

const ADMIN_ORDER_STATS_ENDPOINT = '/order/stats';
const ADMIN_UPDATE_STATUS_ENDPOINT = '/order/update';

// Helper: Status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case "PROCESSING":
    case "CONFIRMED":
      return <ClockIcon className="size-3.5" aria-hidden="true" />;
    case "SHIPPED":
      return <TruckIcon className="size-3.5" aria-hidden="true" />;
    case "DELIVERED":
      return <CheckCircleIcon className="size-3.5" aria-hidden="true" />;
    case "CANCELLED":
      return <XCircleIcon className="size-3.5" aria-hidden="true" />;
    default:
      return <ClockIcon className="size-3.5" aria-hidden="true" />;
  }
};

// Helper: Status badge styles & colors
const getStatusClasses = (status: string) => {
  switch (status) {
    case "PROCESSING":
    case "CONFIRMED":
      return {
        container: "inline-flex items-center gap-1.5 rounded-md bg-amber-50/60 border border-amber-200/60 px-2.5 py-1 text-xs font-semibold text-amber-800 backdrop-blur-sm",
        dot: "h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse",
        chipActive: "bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-600/20",
        chipInactive: "bg-white text-amber-700 border-amber-200 hover:bg-amber-50/50",
      };
    case "SHIPPED":
      return {
        container: "inline-flex items-center gap-1.5 rounded-md bg-sky-50/60 border border-sky-200/60 px-2.5 py-1 text-xs font-semibold text-sky-800 backdrop-blur-sm",
        dot: "h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse",
        chipActive: "bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/20",
        chipInactive: "bg-white text-sky-700 border-sky-200 hover:bg-sky-50/50",
      };
    case "DELIVERED":
      return {
        container: "inline-flex items-center gap-1.5 rounded-md bg-emerald-50/60 border border-emerald-200/60 px-2.5 py-1 text-xs font-semibold text-emerald-800 backdrop-blur-sm",
        dot: "h-1.5 w-1.5 rounded-full bg-emerald-500",
        chipActive: "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20",
        chipInactive: "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50/50",
      };
    case "CANCELLED":
      return {
        container: "inline-flex items-center gap-1.5 rounded-md bg-rose-50/60 border border-rose-200/60 px-2.5 py-1 text-xs font-semibold text-rose-800 backdrop-blur-sm",
        dot: "h-1.5 w-1.5 rounded-full bg-rose-500",
        chipActive: "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/20",
        chipInactive: "bg-white text-rose-700 border-rose-200 hover:bg-rose-50/50",
      };
    default:
      return {
        container: "inline-flex items-center gap-1.5 rounded-md bg-slate-50/60 border border-slate-200/60 px-2.5 py-1 text-xs font-semibold text-slate-800 backdrop-blur-sm",
        dot: "h-1.5 w-1.5 rounded-full bg-slate-500",
        chipActive: "bg-slate-800 text-white border-slate-800",
        chipInactive: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
      };
  }
};

const statusOptions = ["PROCESSING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

// DELIVERED is a terminal state, same as CANCELLED — once an order lands there, no
// further status change is offered.
const isStatusChipDisabled = (currentStatus: string, targetStatus: string, canUpdateOrder: boolean): boolean => {
  if (!canUpdateOrder) return true;
  if (currentStatus === targetStatus) return false; // the active chip stays clickable (no-op)
  if (currentStatus === "CANCELLED" || currentStatus === "DELIVERED") return true;
  return false;
};

// DELIVERED can only be reached from SHIPPED — but the chip itself stays visible and
// normally styled rather than greyed out; clicking it early just explains why instead
// of silently doing nothing.
const blockedStatusMessage = (currentStatus: string, targetStatus: string): string | null => {
  if (targetStatus === "DELIVERED" && currentStatus !== "SHIPPED" && currentStatus !== "DELIVERED") {
    return "Mark the order as Shipped before marking it Delivered.";
  }
  return null;
};

const formatDateTime = (value: string | undefined) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

export default function AdminOrderManagementPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { hasPermission } = useStaffPermissions();

  const isStaff = user.role === "STAFF";
  const canUpdateOrder = !isStaff || hasPermission("ORDER_UPDATE");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  // getOrdersForAdmin (order.controller.ts) is already paginated server-side
  // (default limit=20, capped at 100) — previously this page always requested page 1
  // with no way to see anything past the first 20 orders. Page-forward controls below.
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const ORDERS_PAGE_SIZE = 20;

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [shipModalOrder, setShipModalOrder] = useState<Order | null>(null);
  const [shipSubmitting, setShipSubmitting] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const fetchAllOrders = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(ADMIN_ALL_ORDERS_ENDPOINT, {
        params: { page: targetPage, limit: ORDERS_PAGE_SIZE },
      });
      setOrders(res.data.order || []);
      setTotalPages(res.data.pagination?.totalPages ?? 1);
      setTotalOrders(res.data.pagination?.total ?? (res.data.order || []).length);
    } catch (err) {
      const _e = err as any;
      console.error("Error fetching all orders:", err);
      const status = _e.response?.status;
      if (status === 403) {
        setError("Failed to fetch orders: You do not have Admin permissions.");
      } else {
        setError("Failed to fetch orders. Please check backend connection and API endpoint.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Header metric cards are computed server-side over every order — getOrdersForAdmin
  // above is paginated (and capped at 100 per page), so reducing over `orders` directly
  // would silently undercount the moment there are more orders than one page.
  const fetchOrderStats = useCallback(async () => {
    try {
      const res = await api.get(ADMIN_ORDER_STATS_ENDPOINT);
      setOrderStats(res.data);
    } catch (err) {
      console.error("Error fetching order stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchAllOrders(page);
    fetchOrderStats();
  }, [fetchAllOrders, fetchOrderStats, page]);

  // Deep-link support: a notification about a specific order (NEW_ORDER, status
  // change, payment) lands here via ?orderId= instead of just the bare list — the
  // order it's about might not even be on the first page of `orders` (capped/paginated,
  // see fetchAllOrders), so this fetches it directly rather than searching the loaded
  // page. Removes the param once handled so a later manual refresh doesn't re-open it.
  useEffect(() => {
    const targetId = searchParams.get("orderId");
    if (!targetId) return;
    api
      .get(`/order/${targetId}`)
      .then((res) => {
        if (res.data?.order) {
          setSelectedOrder(res.data.order);
          setDrawerOpen(true);
        }
      })
      .catch(() => {
        console.error("Failed to load linked order", targetId);
      })
      .finally(() => {
        searchParams.delete("orderId");
        setSearchParams(searchParams, { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Locks body scrolling while the order drawer or the ship-order modal is open —
  // previously only covered drawerOpen, so opening "Ship Order" from within the drawer
  // and then closing the drawer first (leaving the ship modal open) silently
  // re-enabled background scroll underneath it.
  useBodyScrollLock(drawerOpen || !!shipModalOrder || !!blockedMessage);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const currentOrder = orders.find((o) => o.id === orderId);
    if (!currentOrder || currentOrder.orderStatus === newStatus) return;

    const originalOrders = [...orders];
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, orderStatus: newStatus } : order
      )
    );

    setSelectedOrder((prev) =>
      prev && prev.id === orderId ? { ...prev, orderStatus: newStatus } : prev
    );

    try {
      await api.put(
        `${ADMIN_UPDATE_STATUS_ENDPOINT}/${orderId}`,
        { orderStatus: newStatus }
      );
      fetchOrderStats();
    } catch (err) {
      const _e = err as any;
      console.error("Failed to update order status:", err);
      alert(`Failed to update status for order #${orderId.slice(-8)}. Reverting change.`);
      setOrders(originalOrders);
      const revertOrder = originalOrders.find((o) => o.id === orderId);
      setSelectedOrder((prev) =>
        prev && prev.id === orderId ? (revertOrder ?? null) : prev
      );
    }
  };

  // Ship transition requires courier + tracking info first — the modal collects it,
  // then this actually performs the same status-update call handleUpdateStatus does,
  // just with the extra fields included in the request body.
  const handleShipOrder = async (payload: ShipOrderPayload) => {
    const orderId = shipModalOrder?.id;
    if (!orderId) return;

    setShipSubmitting(true);
    try {
      const { data } = await api.put(`${ADMIN_UPDATE_STATUS_ENDPOINT}/${orderId}`, {
        orderStatus: "SHIPPED",
        ...payload,
      });
      const updatedOrder = data.order;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                orderStatus: "SHIPPED",
                deliveryPartnerName: updatedOrder?.deliveryPartnerName,
                trackingId: updatedOrder?.trackingId,
                trackingLink: updatedOrder?.trackingLink,
                shippingNote: updatedOrder?.shippingNote,
              }
            : o
        )
      );
      setSelectedOrder((prev) =>
        prev && prev.id === orderId
          ? {
              ...prev,
              orderStatus: "SHIPPED",
              deliveryPartnerName: updatedOrder?.deliveryPartnerName,
              trackingId: updatedOrder?.trackingId,
              trackingLink: updatedOrder?.trackingLink,
              shippingNote: updatedOrder?.shippingNote,
            }
          : prev
      );
      setShipModalOrder(null);
      fetchOrderStats();
    } catch (err) {
      const _e = err as any;
      console.error("Failed to ship order:", err);
      alert(_e?.response?.data?.message ?? `Failed to ship order #${orderId.slice(-8)}.`);
    } finally {
      setShipSubmitting(false);
    }
  };

  const handleViewInvoice = (orderId: string) => {
    navigate(`/invoice/${orderId}`);
  };

  // Sourced from getOrderStats (unbounded aggregation over every order), not reduced
  // from the paginated `orders` list — see fetchOrderStats above for why.
  const metrics = useMemo(() => {
    const s = orderStats;
    const processing = s?.processing ?? 0;
    const confirmed = s?.confirmed ?? 0;
    const shipped = s?.shipped ?? 0;
    const delivered = s?.delivered ?? 0;
    const cancelled = s?.cancelled ?? 0;
    const totalOrders = s?.totalOrders ?? 0;
    return {
      totalOrders,
      paidRevenue: s?.paidRevenue ?? 0,
      totalOrderValue: s?.totalOrderValue ?? 0,
      pureProcessing: processing,
      confirmed,
      shipped,
      delivered,
      cancelled,
      processing: processing + confirmed,
      // "Dispatched & Done" is two states by its own name — shipped (dispatched) and
      // delivered (done) — not delivered alone.
      dispatchedAndDone: shipped + delivered,
      // Orders that can still move through the pipeline. Cancelled orders are excluded
      // from the funnel-progress percentages below so a high cancellation rate doesn't
      // silently deflate every other bar — cancellation gets its own signal elsewhere
      // (Reports & Analytics), this card is about active fulfillment progress.
      activeOrders: totalOrders - cancelled,
    };
  }, [orderStats]);

  // Bar widths for the fulfillment-progress cards, as a % of active (non-cancelled) orders.
  const graphPercentages = useMemo(() => {
    if (!metrics.activeOrders) return { processing: 0, confirmed: 0, shipped: 0, delivered: 0, dispatchedAndDone: 0, cancelled: 0 };
    const calc = (val: number) => (val / metrics.activeOrders) * 100;
    return {
      processing: calc(metrics.pureProcessing),
      confirmed: calc(metrics.confirmed),
      shipped: calc(metrics.shipped),
      delivered: calc(metrics.delivered),
      dispatchedAndDone: calc(metrics.dispatchedAndDone),
      cancelled: metrics.totalOrders ? (metrics.cancelled / metrics.totalOrders) * 100 : 0,
    };
  }, [metrics]);

  // % of total order value that's actually been collected (PAID) — replaces the card's
  // previous hardcoded 78% "Target Pace Achieved" bar, which never reflected real data.
  const collectedPct = metrics.totalOrderValue > 0 ? (metrics.paidRevenue / metrics.totalOrderValue) * 100 : 0;

  // Real per-status distribution for the "Total Volumes" mini bar chart — replaces 5
  // hardcoded static bar heights that had no relationship to actual order data.
  const statusDistribution = useMemo(() => {
    const bars = [
      { key: "processing", count: metrics.pureProcessing, color: "bg-amber-400" },
      { key: "confirmed", count: metrics.confirmed, color: "bg-orange-400" },
      { key: "shipped", count: metrics.shipped, color: "bg-blue-400" },
      { key: "delivered", count: metrics.delivered, color: "bg-emerald-400" },
      { key: "cancelled", count: metrics.cancelled, color: "bg-rose-300" },
    ];
    const max = Math.max(1, ...bars.map((b) => b.count));
    return bars.map((b) => ({ ...b, heightPct: Math.max(8, (b.count / max) * 100) }));
  }, [metrics]);

  const openDrawer = (order: Order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedOrder(null);
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen p-8">
        <div className="max-w-[1600px] mx-auto space-y-8">
          <div className="flex justify-between items-center animate-pulse">
            <div className="space-y-2">
              <div className="h-8 w-64 rounded-lg bg-slate-200" />
              <div className="h-4 w-96 rounded-lg bg-slate-200" />
            </div>
            <div className="h-10 w-36 rounded-xl bg-slate-200" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse" />
            ))}
          </div>
          <div className="h-96 rounded-2xl border border-slate-200 bg-white animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 mb-4 border border-rose-100">
            <XCircleIcon className="size-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Operations Error</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">{error}</p>
          <button onClick={() => fetchAllOrders(page)} className="w-full inline-flex justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 min-h-screen font-sans antialiased text-slate-900">
      <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-200/80">
          <div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950">
              Order Management
            </h1>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl leading-relaxed">
              Monitor routing metrics and sync fulfillment workflows seamlessly using our real-time tracking suite.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                fetchAllOrders(page);
                fetchOrderStats();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <ArrowPathIcon className="size-4 text-slate-500" />
              Sync Live Stream
            </button>
          </div>
        </div>

        {/* Dynamic Graphic Metrics Grid */}
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

          {/* Card 1: Total Volumes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group">
            <div className="flex items-start justify-between z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Volumes</p>
                <p className="mt-1.5 text-3xl font-black tracking-tight text-slate-900">
                  {metrics.totalOrders}
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-500">
                <ShoppingBagIcon className="size-4" />
              </div>
            </div>
            {/* Order Status Distribution — real per-status counts, not a fake trend line */}
            <div className="w-full pt-4 z-10">
              <div className="flex items-end gap-1 h-12">
                {statusDistribution.map((bar) => (
                  <div
                    key={bar.key}
                    className={`w-full rounded-t-sm ${bar.color} transition-all`}
                    style={{ height: `${bar.heightPct}%` }}
                    title={`${bar.key}: ${bar.count}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Gross Income */}
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group">
            <div className="flex items-start justify-between z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Gross Income</p>
                <p className="mt-1.5 text-3xl font-black tracking-tight text-emerald-950">
                  ₹{metrics.paidRevenue.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700">
                <CurrencyRupeeIcon className="size-4" />
              </div>
            </div>
            {/* % of total order value actually collected (paid), not a hardcoded figure */}
            <div className="w-full pt-4 z-10">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full shadow-sm transition-all duration-500" style={{ width: `${Math.min(collectedPct, 100)}%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                <span>₹{metrics.totalOrderValue.toLocaleString("en-IN")} ordered</span>
                <span className="text-emerald-600">{collectedPct.toFixed(0)}% Collected</span>
              </div>
            </div>
          </div>

          {/* Card 3: In Processing */}
          <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group">
            <div className="flex items-start justify-between z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">In Processing</p>
                <p className="mt-1.5 text-3xl font-black tracking-tight text-amber-950">
                  {metrics.processing}
                </p>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-amber-700">
                <ClockIcon className="size-4" />
              </div>
            </div>
            {/* Share of active (non-cancelled) orders — cancelled orders no longer dilute this */}
            <div className="w-full pt-4 z-10">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div style={{ width: `${graphPercentages.processing}%` }} className="h-full bg-amber-400" />
                <div style={{ width: `${graphPercentages.confirmed}%` }} className="h-full bg-orange-400" />
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-2">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Proc ({metrics.pureProcessing})</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400" />Conf ({metrics.confirmed})</span>
              </div>
            </div>
          </div>

          {/* Card 4: Dispatched & Done */}
          <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group">
            <div className="flex items-start justify-between z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Dispatched & Done</p>
                <p className="mt-1.5 text-3xl font-black tracking-tight text-indigo-950">
                  {metrics.dispatchedAndDone}
                </p>
              </div>
              <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-700">
                <CheckCircleIcon className="size-4" />
              </div>
            </div>
            {/* Shipped (dispatched) + Delivered (done), matching the card's own name —
                previously counted DELIVERED only, silently dropping SHIPPED orders. */}
            <div className="w-full pt-4 z-10">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div style={{ width: `${graphPercentages.shipped}%` }} className="h-full bg-blue-400" />
                <div style={{ width: `${graphPercentages.delivered}%` }} className="h-full bg-indigo-600" />
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-2">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />Shipped ({metrics.shipped})</span>
                <span className="flex items-center gap-1 text-indigo-600"><span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />Delivered ({metrics.delivered})</span>
              </div>
            </div>
          </div>

        </div>

        {/* Master Table Area */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Pipeline</h2>
              <p className="text-xs text-slate-500 mt-0.5">Realtime checkout lists. Modify orders directly via structural interactive status action buttons.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Account Client</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Gross Settlement</th>
                  <th className="px-6 py-4">Lifecycle State</th>
                  <th className="px-6 py-4">Update Status Router (Action Chips)</th>
                  <th className="px-6 py-4 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const shortId = `#${order.id.slice(-8)}`;
                  const currentStatusStyle = getStatusClasses(order.orderStatus);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">

                      {/* Token Reference */}
                      <td className="px-6 py-4 font-mono text-xs cursor-pointer text-slate-600 group-hover:text-slate-900" onClick={() => openDrawer(order)}>
                        <span className="font-bold tracking-tight bg-slate-100 px-2 py-1 rounded-md border border-slate-200/60">
                          {shortId}
                        </span>
                      </td>

                      {/* Account Customer Client info */}
                      <td className="px-6 py-4 cursor-pointer" onClick={() => openDrawer(order)}>
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 border border-slate-200/50">
                            <UserIcon className="size-4" />
                          </div>
                          <div className="max-w-[1600px] truncate">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {order.user?.username || "N/A"}
                            </p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {order.user?.email || "No email"}
                            </p>
                            {order.user?.phone && (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {order.user.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Placed At Timestamp */}
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {formatDateTime(order.createdAt)}
                      </td>

                      {/* Gross settlement item values & payment method */}
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        <div>
                          <span>
                            ₹{(order.finalAmount ?? order.totalAmount)?.toFixed(2) ?? "0.00"}
                          </span>
                          <div className="mt-1">
                            {order.paymentMethod === "QR" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                <QrCodeIcon className="size-3" /> Pay with QR
                              </span>
                            ) : order.paymentMethod === "ONLINE" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                Online
                              </span>
                            ) : order.paymentMethod === "CASH" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-700 border border-teal-200">
                                Cash
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                COD
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Badge Display View */}
                      <td className="px-6 py-4">
                        <div className={currentStatusStyle.container}>
                          <span className={currentStatusStyle.dot} />
                          {getStatusIcon(order.orderStatus)}
                          <span>{statusLabel(order.orderStatus || "UNKNOWN")}</span>
                        </div>
                      </td>

                      {/* Custom Action Chips Container Instead of list dropdowns */}
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-flex flex-wrap gap-1 items-center bg-slate-100 p-1 rounded-xl border border-slate-200/40">
                          {statusOptions.map((status) => {
                            const isCurrent = order.orderStatus === status;
                            const targetClasses = getStatusClasses(status);
                            const chipDisabled = isStatusChipDisabled(order.orderStatus, status, canUpdateOrder);

                            return (
                              <button
                                key={status}
                                type="button"
                                disabled={chipDisabled}
                                onClick={() => {
                                  const blocked = blockedStatusMessage(order.orderStatus, status);
                                  if (blocked) {
                                    setBlockedMessage(blocked);
                                    return;
                                  }
                                  if (status === "SHIPPED") {
                                    setShipModalOrder(order);
                                  } else {
                                    handleUpdateStatus(order.id, status);
                                  }
                                }}
                                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all duration-200 ${isCurrent
                                  ? targetClasses.chipActive
                                  : chipDisabled
                                    ? "bg-slate-50 text-slate-300 border-transparent cursor-not-allowed opacity-40"
                                    : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300 shadow-xs"
                                  }`}
                              >
                                {statusLabel(status)}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Controls Rows */}
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleViewInvoice(order.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all"
                            title="View Invoice"
                          >
                            <DocumentTextIcon className="size-3.5 text-slate-400" />
                            Invoice
                          </button>
                          <button
                            type="button"
                            onClick={() => openDrawer(order)}
                            className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all"
                          >
                            View
                            <ChevronRightIcon className="size-3.5 text-slate-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination footer — getOrdersForAdmin caps each request at 20 orders
              (order.controller.ts), this is what lets an admin actually reach order 21+. */}
          {totalOrders > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-700">{orders.length}</span> of{" "}
                <span className="font-semibold text-slate-700">{totalOrders}</span> orders
                {totalPages > 1 && (
                  <span className="text-slate-400"> — page {page} of {totalPages}</span>
                )}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                  >
                    <ChevronRightIcon className="size-3.5 rotate-180" />
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                  >
                    Next
                    <ChevronRightIcon className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Audit Registry Flow Control Drawer Panel */}
        {drawerOpen && selectedOrder && createPortal(
          <>
            <div className="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-xl transition-opacity" onClick={closeDrawer} />
            <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-in-out border-l border-slate-100">
              <div className="flex h-full flex-col bg-white">

                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-slate-50/50">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auditing Registry</p>
                    <p className="text-base font-black text-slate-900 tracking-tight mt-0.5">Order ID: #{selectedOrder.id.slice(-8)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewInvoice(selectedOrder.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-900 hover:text-white transition-all"
                    >
                      <DocumentTextIcon className="size-4" />
                      Invoice
                    </button>
                    <button type="button" onClick={closeDrawer} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all">
                      <XMarkIcon className="size-4.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                  {/* Account Metadata profile */}
                  <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm font-bold">
                        <UserIcon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1 truncate">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {selectedOrder.user?.username || "N/A"}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {selectedOrder.user?.email || "No email provided"}
                        </p>
                        {selectedOrder.user?.phone && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {selectedOrder.user.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <hr className="border-slate-200/60" />

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Settled On</p>
                        <p className="mt-1 font-medium text-slate-700">
                          {formatDateTime(selectedOrder.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Aggregate Net</p>
                        <p className="mt-1 font-extrabold text-slate-900 text-sm">
                          ₹{(selectedOrder.finalAmount ?? selectedOrder.totalAmount)?.toFixed(2) ?? "0.00"}
                        </p>
                        {selectedOrder.discountAmount > 0 && (
                          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                            Markdown Savings ₹{selectedOrder.discountAmount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Drawer Level Action Chips */}
                  <section className="space-y-3 rounded-2xl border border-slate-200/80 p-5 bg-white">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State Routing Segment</p>
                    <div className="flex flex-col gap-3 pt-1">
                      <div className="relative inline-flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/40">
                        {statusOptions.map((status) => {
                          const isCurrent = selectedOrder.orderStatus === status;
                          const targetClasses = getStatusClasses(status);
                          const chipDisabled = isStatusChipDisabled(selectedOrder.orderStatus, status, canUpdateOrder);

                          return (
                            <button
                              key={status}
                              type="button"
                              disabled={chipDisabled}
                              onClick={() => {
                                const blocked = blockedStatusMessage(selectedOrder.orderStatus, status);
                                if (blocked) {
                                  setBlockedMessage(blocked);
                                  return;
                                }
                                if (status === "SHIPPED") {
                                  setShipModalOrder(selectedOrder);
                                } else {
                                  handleUpdateStatus(selectedOrder.id, status);
                                }
                              }}
                              className={`flex-1 text-center px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all duration-200 ${isCurrent
                                ? targetClasses.chipActive
                                : chipDisabled
                                  ? "bg-slate-50 text-slate-300 border-transparent cursor-not-allowed opacity-40"
                                  : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300 shadow-xs"
                                }`}
                            >
                              {statusLabel(status)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </section>

                  {/* Payment & Verification Section */}
                  <section className="space-y-3 rounded-2xl border border-slate-200/80 p-5 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Information</p>
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold border ${
                        selectedOrder.paymentMethod === "QR"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : selectedOrder.paymentMethod === "ONLINE"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : selectedOrder.paymentMethod === "CASH"
                          ? "bg-teal-50 text-teal-700 border-teal-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        {selectedOrder.paymentMethod === "QR" && <QrCodeIcon className="size-3 text-purple-600" />}
                        {selectedOrder.paymentMethod === "QR"
                          ? "Pay with QR"
                          : selectedOrder.paymentMethod === "ONLINE"
                          ? "Online"
                          : selectedOrder.paymentMethod === "CASH"
                          ? "Cash"
                          : "Pay on Delivery"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Payment Status</p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {selectedOrder.paymentStatus || "PENDING"}
                        </p>
                      </div>

                      {selectedOrder.transactionId && (
                        <div>
                          <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Transaction ID / UTR</p>
                          <p className="mt-1 font-mono font-bold text-purple-700 break-all text-xs bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                            {selectedOrder.transactionId}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedOrder.paymentScreenshot && (
                      <div className="pt-2 border-t border-slate-100">
                        <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">Customer Payment Screenshot</p>
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => setPreviewImage(selectedOrder.paymentScreenshot!)}
                            className="w-16 h-16 rounded-xl overflow-hidden border-2 border-purple-200 bg-slate-50 cursor-pointer relative group shrink-0 shadow-xs"
                            title="Click to view full screenshot"
                          >
                            <img
                              src={selectedOrder.paymentScreenshot}
                              alt="Receipt Thumbnail"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                              View
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800">Proof Screenshot Attached</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Customer uploaded this receipt as verification.</p>
                            <button
                              type="button"
                              onClick={() => setPreviewImage(selectedOrder.paymentScreenshot!)}
                              className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-800 underline"
                            >
                              <PhotoIcon className="size-3.5" /> Open Full Image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Summary item listing items mapping */}
                  <section className="space-y-4 rounded-2xl border border-slate-200/80 p-5 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manifest Summary</p>
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                        {selectedOrder.items?.length || 0} Products
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {selectedOrder.items?.map((item: OrderItem, index: number) => {
                        const isProductUnavailable = !item.product;
                        const subtotal = (item.price || 0) * (item.quantity || 0);

                        return (
                          <div key={index} className="flex gap-4 py-3 first:pt-0 last:pb-0 group/item">
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                              {isProductUnavailable ? (
                                <div className="flex h-full w-full flex-col items-center justify-center bg-rose-50/50 text-[9px] font-black tracking-tight text-rose-700 text-center leading-none">
                                  <XCircleIcon className="mb-0.5 size-4 text-rose-500" />
                                  <span>VOID</span>
                                </div>
                              ) : (
                                <img
                                  src={item.product!.image || "https://placehold.co/96x96/f3f4f6/6b7280?text=No+Image"}
                                  alt={item.product!.name}
                                  className="h-full w-full object-cover object-center transition-transform group-hover/item:scale-105 duration-300"
                                />
                              )}
                            </div>

                            <div className="flex flex-1 flex-col justify-center text-xs">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-0.5">
                                  <p className="text-sm font-bold text-slate-900 leading-snug">
                                    {isProductUnavailable ? "Product Terminated" : item.product!.name}
                                  </p>
                                  {item.variant?.options && Object.keys(item.variant.options).length > 0 && (
                                    <p className="text-xs font-semibold text-indigo-600">
                                      {Object.entries(item.variant.options)
                                        .map(([axis, value]) => `${axis}: ${value}`)
                                        .join(" · ")}
                                    </p>
                                  )}
                                  <p className="text-xs font-medium text-slate-400">
                                    ₹{(item.price || 0).toFixed(2)} × {item.quantity}
                                  </p>
                                </div>
                                <p className="text-sm font-bold text-slate-900 whitespace-nowrap">
                                  ₹{subtotal.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Delivery Address Section */}
                  {selectedOrder.shippingAddress && (
                    <section className="space-y-3 rounded-2xl border border-slate-200/80 p-5 bg-white">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivery Address</p>
                      {selectedOrder.shippingAddress.fullAddress && (
                        <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                          {selectedOrder.shippingAddress.fullAddress}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium">
                        {selectedOrder.shippingAddress.city && (
                          <span><span className="text-slate-400">City: </span>{selectedOrder.shippingAddress.city}</span>
                        )}
                        {selectedOrder.shippingAddress.state && (
                          <span><span className="text-slate-400">State: </span>{selectedOrder.shippingAddress.state}</span>
                        )}
                        {selectedOrder.shippingAddress.zipCode && (
                          <span><span className="text-slate-400">PIN: </span>{selectedOrder.shippingAddress.zipCode}</span>
                        )}
                        {selectedOrder.shippingAddress.country && (
                          <span><span className="text-slate-400">Country: </span>{selectedOrder.shippingAddress.country}</span>
                        )}
                      </div>
                      {selectedOrder.shippingAddress.lat && selectedOrder.shippingAddress.lng && (
                        <a
                          href={`https://maps.google.com/?q=${selectedOrder.shippingAddress.lat},${selectedOrder.shippingAddress.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:underline mt-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                          View on Google Maps
                        </a>
                      )}
                    </section>
                  )}

                  {(selectedOrder.deliveryPartnerName || selectedOrder.trackingId || selectedOrder.shippingNote) && (
                    <section className="px-5 py-4 border-b border-slate-100">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Shipment Tracking</h3>
                      <div className="space-y-1 text-xs text-slate-600">
                        {selectedOrder.deliveryPartnerName && (
                          <p><span className="text-slate-400">Courier: </span>{selectedOrder.deliveryPartnerName}</p>
                        )}
                        {selectedOrder.trackingId && (
                          <p><span className="text-slate-400">Tracking ID: </span>{selectedOrder.trackingId}</p>
                        )}
                        {selectedOrder.shippingNote && (
                          <p><span className="text-slate-400">Note: </span>{selectedOrder.shippingNote}</p>
                        )}
                        {selectedOrder.trackingLink && (
                          <a
                            href={selectedOrder.trackingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:underline mt-1"
                          >
                            Track Package
                          </a>
                        )}
                      </div>
                    </section>
                  )}

                </div>
              </div>
            </div>
          </>,
          document.body
        )}

        <ShipOrderModal
          order={shipModalOrder}
          submitting={shipSubmitting}
          onClose={() => setShipModalOrder(null)}
          onConfirm={handleShipOrder}
        />

        {blockedMessage && createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-sky-50 text-sky-600 shrink-0">
                    <InformationCircleIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm">Can't skip ahead</h3>
                    <p className="text-xs text-gray-500 mt-1">{blockedMessage}</p>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5">
                <button
                  onClick={() => setBlockedMessage(null)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition cursor-pointer"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Lightbox Payment Screenshot Modal */}
        {previewImage && createPortal(
          <div
            className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-w-2xl w-full bg-white rounded-2xl p-5 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <PhotoIcon className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Customer Payment Screenshot</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-auto max-h-[70vh] flex justify-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                <img src={previewImage} alt="Payment receipt full preview" className="max-w-full h-auto rounded-lg object-contain" />
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Verify against your UPI app statement</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Close
                  </button>
                  <a
                    href={previewImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Open in New Tab
                  </a>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      </div>
    </div>
  );
}