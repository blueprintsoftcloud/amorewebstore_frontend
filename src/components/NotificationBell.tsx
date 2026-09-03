// src/components/NotificationBell.tsx
// Shared bell-icon dropdown used in Admin, Super-Admin and Staff dashboards.
// Clicking a notification marks it read and navigates to the notifications page.

import { useRef, useEffect, useState } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { getNotificationTarget } from "../utils/notificationRoute";

interface Props {
  /** Base dashboard path, e.g. "/admin-dashboard" */
  dashboardPath: string;
}

const formatTime = (iso?: string) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function NotificationBell({ dashboardPath }: Props) {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const recent = notifications.slice(0, 8);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleClick = (n: (typeof notifications)[number]) => {
    const id = n.id ?? n._id;
    if (!n.isRead && id) markAsRead(id);
    setOpen(false);
    navigate(getNotificationTarget(n, dashboardPath));
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center leading-none px-0.5">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white shadow-2xl rounded-xl border border-gray-100 z-[1100] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-red-50 text-red-600 rounded-full px-2.5 py-0.5 font-semibold border border-red-100">
                {unreadCount} new
              </span>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {recent.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-10">No notifications yet</p>
            ) : (
              recent.map((n) => {
                const id = n.id ?? n._id;
                return (
                  <button
                    key={id}
                    className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-2.5 ${
                      !n.isRead ? "bg-blue-50/50 hover:bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleClick(n)}
                  >
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                    <div className={n.isRead ? "pl-4" : ""}>
                      <p
                        className={`text-sm leading-snug line-clamp-2 ${
                          !n.isRead ? "font-semibold text-gray-900" : "text-gray-600"
                        }`}
                      >
                        {n.message}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {formatTime(n.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
            <button
              className="w-full text-center text-sm text-[#2d4a3e] hover:text-[#1b3328] font-semibold py-0.5"
              onClick={() => {
                setOpen(false);
                navigate(`${dashboardPath}/notifications`);
              }}
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
