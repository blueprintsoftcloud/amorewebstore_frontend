// src/context/UserNotificationContext.tsx
// Migrated: TanStack Query handles initial fetch + cache invalidation.
// Socket.IO handles real-time push.

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../utils/api";
import socket from "../utils/socket";
import { useAuth } from "./AuthContext";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface UserNotification {
  _id?: string;
  id?: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt?: string;
  /** Present on order-related notifications (NEW_ORDER/ORDER_UPDATE/PAYMENT_SUCCESS/
   * PAYMENT_FAILED) — see notification.controller.ts's getUserNotifications. Null/absent
   * for non-order types or if the order was since deleted. */
  order?: { id: string } | null;
  [key: string]: unknown;
}

interface UserNotificationContextValue {
  notifications: UserNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────────────────
const UserNotificationContext = createContext<UserNotificationContextValue | undefined>(undefined);

export const useUserNotifications = (): UserNotificationContextValue => {
  const ctx = useContext(UserNotificationContext);
  if (!ctx) throw new Error("useUserNotifications must be used inside <UserNotificationProvider>");
  return ctx;
};

// ── Provider ───────────────────────────────────────────────────────────────────
export const UserNotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Query: initial fetch ─────────────────────────────────────────────────────
  const { data: notifications = [] } = useQuery<UserNotification[]>({
    queryKey: ["user-notifications"],
    queryFn: async () => {
      const res = await api.get<UserNotification[]>("/notifications/user");
      setUnreadCount(res.data.filter((n) => !n.isRead).length);
      return res.data;
    },
    enabled: user?.isAuthenticated === true && navigator.onLine,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // ── Mark as read ─────────────────────────────────────────────────────────────
  const markAsRead = useCallback(
    async (id: string) => {
      queryClient.setQueryData<UserNotification[]>(
        ["user-notifications"],
        (prev) =>
          (prev ?? []).map((n) =>
            n._id === id || n.id === id ? { ...n, isRead: true } : n,
          ),
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));

      try {
        await api.put(`/notifications/${id}/read`);
      } catch (err) {
        console.error("markAsRead failed:", err);
        queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      }
    },
    [queryClient],
  );

  // ── Socket.IO real-time push ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.isAuthenticated) return;
    if (!navigator.onLine) return;

    if (!socket.connected) socket.connect();

    const handleNotification = (notification: UserNotification) => {
      queryClient.setQueryData<UserNotification[]>(
        ["user-notifications"],
        (prev) => [notification, ...(prev ?? [])],
      );
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("new-notification", handleNotification);
    return () => { socket.off("new-notification", handleNotification); };
  }, [user?.isAuthenticated, queryClient]);

  return (
    <UserNotificationContext.Provider value={{ notifications, unreadCount, markAsRead }}>
      {children}
    </UserNotificationContext.Provider>
  );
};
