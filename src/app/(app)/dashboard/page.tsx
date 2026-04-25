"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import LoadingState from "@/components/LoadingState";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapPicker"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse" />
});

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [address, setAddress] = useState<string>("Đang xác định vị trí...");
  const [branding, setBranding] = useState({ name: "Công ty", address: "" });
  const supabase = createClient();

  // Watch location
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`);
          const d = await res.json();
          setAddress(d.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } catch {
          setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
      },
      () => setAddress("Vui lòng bật GPS để xem vị trí"),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const fetchData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    const [profileRes, scheduleRes, attendanceRes, settingsRes] = await Promise.all([
      supabase.from("profiles").select("*, job_positions(name), departments(name)").eq("id", user.id).single(),
      fetch("/api/attendance/today-schedule").then(res => res.json()),
      supabase.from("attendance_records").select("*").eq("employee_id", user.id).eq("date", today).order("check_in_time", { ascending: true }),
      supabase.from("system_settings").select("*").in("id", ["company_name", "company_address"])
    ]);

    if (settingsRes.data) {
      const nameVal = settingsRes.data.find(s => s.id === "company_name")?.value;
      const addrVal = settingsRes.data.find(s => s.id === "company_address")?.value;
      setBranding({
        name: nameVal ? (typeof nameVal === 'string' && nameVal.startsWith('"') ? JSON.parse(nameVal) : nameVal) : "Công ty",
        address: addrVal ? (typeof addrVal === 'string' && addrVal.startsWith('"') ? JSON.parse(addrVal) : addrVal) : ""
      });
    }

    const records = attendanceRes.data || [];
    const firstCheckIn = records.length > 0 ? records[0].check_in_time : null;
    const checkOuts = records.map(r => r.check_out_time).filter(t => t !== null);
    const lastCheckOut = checkOuts.length > 0 ? checkOuts.sort().reverse()[0] : null;

    setData({
      profile: profileRes.data,
      schedule: scheduleRes.schedule,
      firstCheckIn,
      lastCheckOut,
      isCurrentlyWorking: records.some(r => !r.check_out_time)
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest"><LoadingState message="Đang tải dữ liệu của bạn..." /></div>;

  const { profile, schedule, firstCheckIn, lastCheckOut, isCurrentlyWorking } = data;
  const shift = schedule?.work_shifts;

  const todayStr = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long" });

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const getOnTimeStatus = () => {
    if (!firstCheckIn || !shift) return null;
    const checkInDate = new Date(firstCheckIn);
    const [h, m] = shift.start_time.split(":");
    const shiftStartTime = new Date(checkInDate);
    shiftStartTime.setHours(parseInt(h), parseInt(m), 0, 0);

    const diffMinutes = Math.floor((checkInDate.getTime() - shiftStartTime.getTime()) / 60000);
    if (diffMinutes <= 0) return { text: "Đúng giờ", color: "text-green-600" };
    return { text: `Muộn ${diffMinutes} phút`, color: "text-red-600" };
  };

  const status = getOnTimeStatus();

  return (
    <main className="px-4 py-6 space-y-5 max-w-md mx-auto pb-12">
      {/* Profile Section */}
      <section className="flex flex-col">
        <h1 className="text-[22px] xs:text-[24px] font-black text-on-surface leading-tight">
          Chào ngày mới, {profile?.full_name?.split(' ').pop() || "bạn"}!
        </h1>
        <p className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5 opacity-60">
          <span className="material-symbols-outlined text-[14px]">badge</span>
          {(Array.isArray(profile?.job_positions) ? profile.job_positions[0]?.name : profile?.job_positions?.name) || profile?.position || "Nhân viên"} • {branding.name}
        </p>
      </section>
      
      {/* Status Card */}
      <div className="bg-white rounded-[24px] p-5 xs:p-6 shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12"></div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            </div>
            <span className="text-[12px] font-black uppercase tracking-wider text-on-surface-variant">{todayStr}</span>
          </div>
          <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
            isCurrentlyWorking ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
          }`}>
            {isCurrentlyWorking ? "Đang làm việc" : "Nghỉ ngơi"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 xs:gap-8">
          <div className="space-y-1.5">
            <p className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-[0.15em]">GIỜ VÀO ĐẦU</p>
            <div className="flex flex-col">
              <span className="text-[24px] xs:text-[28px] font-black text-primary leading-none mb-1">
                {formatTime(firstCheckIn)}
              </span>
              {status && (
                <span className={`text-[10px] font-black uppercase ${status.color}`}>({status.text})</span>
              )}
            </div>
          </div>
          <div className="space-y-1.5 border-l border-slate-100 pl-4 xs:pl-8">
            <p className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-[0.15em]">GIỜ RA CUỐI</p>
            <div className="flex flex-col">
              <span className={`text-[24px] xs:text-[28px] font-black leading-none mb-1 ${lastCheckOut ? "text-primary" : "text-slate-200"}`}>
                {formatTime(lastCheckOut)}
              </span>
              <span className="text-[10px] text-slate-300 font-black uppercase">
                {lastCheckOut ? "(HOÀN THÀNH)" : "(CHƯA CÓ)"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Link href="/attendance" className="block group active:scale-[0.98] transition-transform">
        <div className="relative bg-white rounded-[24px] p-5 shadow-lg border border-primary/5 flex items-center gap-4">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-3 transition-transform">
            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              fingerprint
            </span>
          </div>
          <div className="text-left space-y-0.5 min-w-0 flex-1">
            <h2 className="text-[16px] font-black text-on-surface">Chấm công ngay</h2>
            <div className="flex items-center gap-1 text-on-surface-variant/60">
              <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
              <span className="text-[10px] font-bold truncate">{address}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
            <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
          </div>
        </div>
      </Link>

      {/* Feature Bento Grid */}
      <section className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Lịch sử", icon: "history", color: "bg-blue-50 text-blue-600", href: "/history" },
          { label: "Bảng công", icon: "table_chart", color: "bg-emerald-50 text-emerald-600", href: "/monthly-report" },
          { label: "Xin nghỉ", icon: "event_busy", color: "bg-orange-50 text-orange-600", href: "/leave-request" },
          { label: "Thông báo", icon: "notifications", color: "bg-purple-50 text-purple-600", href: "/notifications" },
          { label: "Hồ sơ", icon: "person", color: "bg-indigo-50 text-indigo-600", href: "/profile" },
          { label: "Cài đặt", icon: "settings", color: "bg-slate-50 text-slate-600", href: "/settings" },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="bg-white p-3 rounded-2xl shadow-sm border border-slate-50 flex flex-col items-center justify-center gap-2 aspect-square active:scale-95 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter text-on-surface-variant">{item.label}</span>
          </Link>
        ))}
      </section>

      {/* Location Map */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant opacity-50">Vị trí của bạn</h3>
          <span className="text-[9px] font-black text-primary flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-primary animate-ping"></span> LIVE
          </span>
        </div>
        <div className="h-36 rounded-[24px] overflow-hidden relative shadow-inner border border-slate-100 bg-slate-50">
          {location ? (
            <MapView
              initialLat={location.lat}
              initialLng={location.lng}
              readonly={true}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300">
              <span className="material-symbols-outlined text-3xl animate-bounce">location_searching</span>
              <p className="text-[9px] font-black uppercase tracking-widest">Xác định GPS...</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
