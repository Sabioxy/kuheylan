"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, X, Gift } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id?: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { notificationId: id } : { all: true }),
      });
      if (res.ok) {
        if (id) {
          setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        } else {
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
          setUnreadCount(0);
        }
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center justify-center rounded-full border border-zinc-200/60 bg-white p-2 text-zinc-900 transition-all hover:bg-zinc-50 hover:scale-105 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10"
        title="Bildirimler"
      >
        <Bell className={`h-5 w-5 ${unreadCount > 0 ? "animate-tada" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 origin-top-right overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 dark:border-white/10 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-white/5">
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Bildirimler</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead()}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Hepsini oku
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="mb-2 h-10 w-10 text-zinc-200 dark:text-zinc-800" />
                <p className="text-sm text-zinc-500">Henüz bildirim yok.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50 dark:divide-white/5">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`group relative flex gap-3 px-4 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-white/5 ${
                      !notification.isRead ? "bg-indigo-50/30 dark:bg-indigo-500/5" : ""
                    }`}
                  >
                    <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      notification.type === "GIFT" ? "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}>
                      {notification.type === "GIFT" ? <Gift className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium leading-none ${!notification.isRead ? "text-zinc-950 dark:text-zinc-50" : "text-zinc-700 dark:text-zinc-300"}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                            title="Okundu olarak işaretle"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: tr })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-100 px-4 py-2 bg-zinc-50/50 dark:border-white/5 dark:bg-white/5">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-1 text-center text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes tada {
          0% { transform: scale(1); }
          10%, 20% { transform: scale(0.9) rotate(-3deg); }
          30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); }
          40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); }
          100% { transform: scale(1) rotate(0); }
        }
        .animate-tada {
          animation: tada 1s ease-in-out infinite;
          animation-iteration-count: 1;
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
