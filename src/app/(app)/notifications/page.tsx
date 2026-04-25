"use client";

import { useState, useEffect } from "react";
import LoadingState from "@/components/LoadingState";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "attendance" | "leave" | "system";
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    if (Array.isArray(data)) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingState message="Đang tải thông báo..." /></div>;

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <main className="px-4 pt-6 space-y-6 max-w-md mx-auto pb-24 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-black text-on-surface leading-tight">Thông báo</h1>
          <p className="text-[11px] font-bold text-on-surface-variant opacity-60 uppercase tracking-widest">Cập nhật mới nhất của bạn</p>
        </div>
        <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
          <span className="material-symbols-outlined text-[20px]">done_all</span>
        </button>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white p-12 rounded-[24px] text-center border-2 border-dashed border-slate-100 flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-slate-200">notifications_off</span>
            <p className="text-body-sm font-bold text-slate-400 uppercase tracking-widest">Không có thông báo nào</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              onClick={() => !n.is_read && markAsRead(n.id)}
              className={`bg-white p-5 rounded-[24px] shadow-sm border transition-all active:scale-[0.98] cursor-pointer ${
                n.is_read ? "border-slate-50 opacity-80" : "border-primary/10 shadow-lg shadow-primary/5"
              }`}
            >
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  n.type === "attendance" ? "bg-emerald-50 text-emerald-500" :
                  n.type === "leave" ? "bg-orange-50 text-orange-500" :
                  "bg-blue-50 text-blue-500"
                }`}>
                  <span className="material-symbols-outlined text-[24px]">
                    {n.type === "attendance" ? "fingerprint" : 
                     n.type === "leave" ? "event_busy" : "info"}
                  </span>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-[14px] font-black ${n.is_read ? "text-on-surface-variant" : "text-on-surface"}`}>
                      {n.title}
                    </h3>
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>}
                  </div>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[10px] font-bold text-slate-300 pt-1 uppercase">
                    {formatDate(n.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
