"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Trang chủ", icon: "home", href: "/dashboard" },
    { label: "Lịch sử", icon: "history", href: "/history" },
    { label: "Chấm công", icon: "fingerprint", href: "/attendance", isSpecial: true },
    { label: "Nghỉ phép", icon: "event_note", href: "/leave-request" },
    { label: "Cá nhân", icon: "person", href: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 pb-safe bg-white/90 backdrop-blur-md border-t border-slate-100 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        
        if (item.isSpecial) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center transition-transform duration-150 active:scale-90 ${
                isActive ? "text-primary" : "text-slate-400"
              }`}
            >
              <div className="bg-primary p-2 rounded-full -mt-8 shadow-lg shadow-primary/30">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {item.icon}
                </span>
              </div>
              <span className="font-manrope text-[10px] font-semibold mt-1">{item.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center transition-transform duration-150 active:scale-90 px-3 py-1 rounded-xl ${
              isActive 
                ? "text-blue-600 bg-blue-50" 
                : "text-slate-400 hover:text-blue-500"
            }`}
          >
            <span 
              className="material-symbols-outlined" 
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {item.icon}
            </span>
            <span className="font-manrope text-[10px] font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
