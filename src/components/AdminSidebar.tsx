"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/admin/employees", label: "Quản lý nhân viên", icon: "groups" },
  { href: "/admin/departments", label: "Phòng ban", icon: "domain" },
  { href: "/admin/job-positions", label: "Vị trí công việc", icon: "badge" },
  { href: "/admin/dashboard", label: "Chấm công", icon: "calendar_today" },
  { href: "/admin/reports", label: "Báo cáo", icon: "analytics" },
  { href: "/admin/shifts", label: "Ca làm việc", icon: "schedule" },
  { href: "/admin/schedules", label: "Lịch làm việc", icon: "event_note" },
  { href: "/admin/holidays", label: "Ngày nghỉ lễ", icon: "celebration" },
  { href: "/admin/leave", label: "Nghỉ phép", icon: "time_to_leave" },
  { href: "/admin/payroll", label: "Tính lương", icon: "payments" },
  { href: "/admin/overtime", label: "Làm thêm giờ", icon: "more_time", disabled: true },
  { href: "/admin/customers", label: "Khách hàng CK", icon: "people" },
  { href: "/admin/customers/ai", label: "AI Phân tích KH", icon: "smart_toy" },
  { href: "/admin/locations", label: "Cấu hình địa điểm", icon: "location_on" },
  { href: "/admin/settings", label: "Cài đặt hệ thống", icon: "settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [branding, setBranding] = useState({ name: "TimeTrack Pro", logo: "" });
  const supabase = createClient();

  useEffect(() => {
    async function fetchBranding() {
      const { data } = await supabase
        .from("system_settings")
        .select("*")
        .in("id", ["company_name", "company_logo"]);
      
      if (data) {
        const name = data.find(s => s.id === "company_name")?.value;
        const logo = data.find(s => s.id === "company_logo")?.value;
        
        setBranding({
          name: name ? (typeof name === 'string' && name.startsWith('"') ? JSON.parse(name) : name) : "TimeTrack Pro",
          logo: logo ? (typeof logo === 'string' && logo.startsWith('"') ? JSON.parse(logo) : logo) : ""
        });
      }
    }
    fetchBranding();
  }, [supabase]);

  return (
    <aside className="fixed left-0 h-screen w-64 bg-primary-container text-white flex flex-col py-4 z-50 shadow-xl overflow-x-hidden">
      <div className="px-6 mb-8 flex items-center gap-3">
        {branding.logo ? (
          <Image src={branding.logo} alt="Logo" width={40} height={40} className="rounded-xl object-contain bg-white p-1" unoptimized />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-blue-400 flex items-center justify-center text-white font-black text-xl">
            {branding.name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-black text-white leading-tight break-words">{branding.name}</h1>
          <p className="text-[9px] uppercase tracking-widest text-blue-100/50 font-black mt-0.5">Admin Portal</p>
        </div>
      </div>
      <nav className="flex flex-col space-y-0.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const isDisabled = item.disabled;
          return (
            <Link
              key={item.href}
              href={isDisabled ? "#" : item.href}
              onClick={(e) => isDisabled && e.preventDefault()}
              className={`flex items-center gap-3 px-6 py-3.5 transition-all duration-200 group relative ${
                isDisabled
                  ? "opacity-30 cursor-not-allowed grayscale"
                  : isActive 
                    ? "bg-blue-800/40 text-white border-l-4 border-blue-400" 
                    : "text-blue-100/70 hover:bg-blue-800/20 hover:text-white hover:translate-x-1"
              }`}
            >
              <span 
                className={`material-symbols-outlined text-[22px] ${isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
              {isActive && !isDisabled && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-400 rounded-l-full shadow-[0_0_10px_#60a5fa]"></div>
              )}
            </Link>
          );
        })}
      </nav>
      
    </aside>
  );
}
