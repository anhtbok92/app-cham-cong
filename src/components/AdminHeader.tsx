"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/lib/auth/actions";

export default function AdminHeader() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", session.user.id)
          .single();
        setUser({ ...session.user, ...data });
      }
    }
    fetchUser();

    // Close menu when clicking outside
    const closeMenu = () => setIsMenuOpen(false);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, [supabase]);

  return (
    <header className="flex justify-between items-center px-6 h-16 w-full sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm ">
      <div className="flex items-center gap-4">
        <span className="font-label-md text-label-md text-primary-container font-bold border-b-2 border-primary-container pb-1">
          Hệ thống Quản trị
        </span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex gap-2">
          <button className="relative p-2 rounded-full hover:bg-slate-50 transition-colors group">
            <span className="material-symbols-outlined text-slate-500 group-hover:text-primary-container transition-colors">
              notifications
            </span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-white animate-pulse"></span>
          </button>
          <button className="p-2 rounded-full hover:bg-slate-50 transition-colors group">
            <span className="material-symbols-outlined text-slate-500 group-hover:text-primary-container transition-colors">
              settings
            </span>
          </button>
        </div>
        
        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <div className="text-right">
            <p className="font-label-md text-label-md text-on-surface font-bold leading-tight">
              {user?.full_name || "Admin User"}
            </p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">
              System Administrator
            </p>
          </div>
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="w-10 h-10 rounded-full border-2 border-primary-container/20 overflow-hidden hover:border-primary-container/50 transition-all active:scale-90"
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary-fixed flex items-center justify-center text-primary font-bold">
                  {user?.full_name?.charAt(0) || "A"}
                </div>
              )}
            </button>
            
            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-48 bg-white shadow-2xl border border-slate-100 rounded-xl overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-2 border-b border-slate-50">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Tài khoản</p>
                </div>
                <button className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                  Hồ sơ cá nhân
                </button>
                <button className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">shield_person</span>
                  Đổi mật khẩu
                </button>
                <div className="h-px bg-slate-100 my-1"></div>
                <form action={logout}>
                  <button type="submit" className="w-full text-left px-4 py-2 text-xs font-bold text-error hover:bg-error/5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Đăng xuất
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
