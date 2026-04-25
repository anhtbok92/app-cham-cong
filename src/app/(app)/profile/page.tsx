"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LoadingState from "@/components/LoadingState";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*, job_positions(name), departments(name)")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [supabase]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingState message="Đang tải thông tin cá nhân..." /></div>;

  const employeeId = profile?.id ? `NV-${profile.id.slice(0, 4).toUpperCase()}` : "---";

  const infoItems = [
    { label: "Ngày sinh", value: profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString("vi-VN") : null, icon: "cake" },
    { label: "Số điện thoại", value: profile?.phone_number, icon: "call", highlight: true },
    { label: "Địa chỉ", value: profile?.address, icon: "location_on" },
    { label: "Ngày vào làm", value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString("vi-VN") : null, icon: "calendar_today" },
    { label: "Email cá nhân", value: profile?.email, icon: "mail" },
  ].filter(item => item.value); // Hide empty fields

  return (
    <main className="px-margin-page pt-6 space-y-6 max-w-md mx-auto pb-24 animate-in fade-in duration-500">
      {/* Profile Header Card */}
      <section className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center relative overflow-hidden border border-slate-50">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
        
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-[40px] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-4xl font-black text-primary border-4 border-white shadow-xl overflow-hidden">
            {profile?.full_name?.charAt(0) || "U"}
          </div>
          <button className="absolute -bottom-2 -right-2 bg-white text-primary p-2.5 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center hover:scale-110 transition-transform active:scale-95">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
          </button>
        </div>

        <h2 className="text-[22px] font-black text-on-surface leading-tight mb-1">{profile?.full_name}</h2>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-primary/10 text-primary px-3 py-1 rounded-lg">
            ID: {employeeId}
          </span>
          <p className="text-body-sm font-bold text-on-surface-variant opacity-70">
            {(Array.isArray(profile?.job_positions) ? profile.job_positions[0]?.name : profile?.job_positions?.name) || profile?.position || "Nhân viên"} • {(Array.isArray(profile?.departments) ? profile.departments[0]?.name : profile?.departments?.name) || "Công ty"}
          </p>
        </div>
      </section>

      {/* Information List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[14px] font-black uppercase tracking-widest text-on-surface opacity-60">Thông tin cá nhân</h3>
          <button className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
          </button>
        </div>
        
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-50 divide-y divide-slate-50 overflow-hidden">
          {infoItems.map((item, idx) => (
            <div key={idx} className="p-5 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </div>
                <span className="text-body-sm font-bold text-on-surface-variant opacity-80">{item.label}</span>
              </div>
              <span className={`text-body-sm font-black ${item.highlight ? "text-primary" : "text-on-surface"}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      <button 
        onClick={() => supabase.auth.signOut().then(() => window.location.href = "/login")}
        className="w-full py-5 bg-red-50 text-red-600 rounded-[24px] text-[15px] font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-[0.98] mt-4"
      >
        Đăng xuất hệ thống
      </button>
    </main>
  );
}
