"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [branding, setBranding] = useState({ name: "Hệ thống", logo: "" });
  const router = useRouter();
  const supabase = createClient();

  useState(() => {
    async function fetchBranding() {
      const { data } = await supabase
        .from("system_settings")
        .select("*")
        .in("id", ["company_name", "company_logo"]);
      
      if (data) {
        const nameVal = data.find(s => s.id === "company_name")?.value;
        const logoVal = data.find(s => s.id === "company_logo")?.value;
        setBranding({
          name: nameVal ? (typeof nameVal === 'string' && nameVal.startsWith('"') ? JSON.parse(nameVal) : nameVal) : "Hệ thống Chấm công",
          logo: logoVal ? (typeof logoVal === 'string' && logoVal.startsWith('"') ? JSON.parse(logoVal) : logoVal) : ""
        });
      }
    }
    fetchBranding();
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      setError("Thiếu thông tin.");
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        setError("Email/Mật khẩu không đúng.");
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", authData.user.id).single();
      router.push(profile?.role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch {
      setError("Đã xảy ra lỗi.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col text-on-background items-center justify-start w-full max-w-md mx-auto px-6 py-8">
      {/* Header Banner */}
      <div className="w-full relative shrink-0 rounded-[40px] overflow-hidden shadow-2xl h-56 bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center">
        <img
          alt="Office"
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay"
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1000"
        />
        <div className="relative z-10 flex flex-col items-center text-center p-6 w-full">
          {branding.logo ? (
            <div className="bg-white p-3.5 rounded-[24px] mb-4 shadow-xl">
              <img src={branding.logo} alt="Logo" className="w-14 h-14 object-contain" />
            </div>
          ) : (
            <div className="bg-white/20 backdrop-blur-xl p-5 rounded-[24px] mb-4 border border-white/30 shadow-inner">
              <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                nest_clock_farsight_analog
              </span>
            </div>
          )}
          <h1 className="text-[22px] font-black text-white tracking-[0.1em] mb-1 uppercase px-4 break-words w-full leading-tight">
            {branding.name}
          </h1>
          <p className="text-[11px] font-bold text-blue-100 uppercase tracking-widest opacity-80">
            Hệ thống chấm công thông minh
          </p>
        </div>
      </div>

      {/* Main Login Form */}
      <div className="w-full bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 flex-1 flex flex-col justify-center my-4 overflow-y-auto hide-scrollbar">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-[11px] font-black border border-red-100 text-center uppercase tracking-wider animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-[18px]">alternate_email</span>
              <input name="email" type="email" required className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-[13px]" placeholder="email@congty.com" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Mật khẩu</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-[18px]">key</span>
              <input name="password" type={showPassword ? "text" : "password"} required className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-[13px]" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"><span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span></button>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-slate-200 text-primary focus:ring-primary" />
              <span className="text-[11px] font-bold text-slate-500 group-hover:text-on-surface transition-colors">Ghi nhớ</span>
            </label>
            <button type="button" onClick={() => alert("Liên hệ Admin để hỗ trợ.")} className="text-[11px] font-black text-primary uppercase tracking-wider">Quên mật khẩu?</button>
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-white rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-[0.98] transition-all hover:brightness-110 disabled:opacity-50 mt-2">
            {loading ? "Đang xử lý..." : "Đăng nhập ngay"}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center">
          <div className="w-full flex items-center space-x-4 mb-2">
            <div className="h-[1px] bg-slate-100 flex-grow"></div>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Đăng nhập bảo mật</span>
            <div className="h-[1px] bg-slate-100 flex-grow"></div>
          </div>
        </div>
      </div>

      <footer className="w-full shrink-0 flex flex-col items-center py-2 opacity-30">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">v1.2.4 Secure</p>
      </footer>
    </main>
  );
}
