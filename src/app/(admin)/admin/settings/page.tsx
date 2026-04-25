"use client";

import { useState, useEffect } from "react";
import LoadingState from "@/components/LoadingState";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/settings");
    const data = await res.json();
    setSettings(data);
    setLoading(false);
  };

  const handleUpdate = async (id: string, value: any) => {
    setSaving(id);
    setMessage(null);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, value }),
    });
    if (res.ok) {
      setMessage("Cập nhật thành công!");
      fetchSettings();
    } else {
      setMessage("Cập nhật thất bại.");
    }
    setSaving(null);
  };

  if (loading) return <LoadingState message="Đang tải cài đặt..." />;

  const getSetting = (id: string) => {
    const val = settings.find(s => s.id === id)?.value;
    // Handle JSON parsing since it's stored as JSONB
    try {
      if (typeof val === 'string' && (val.startsWith('"') || val.startsWith('{'))) {
        return JSON.parse(val);
      }
      return val;
    } catch {
      return val;
    }
  };

  const companyName = getSetting("company_name") || "";
  const companyLogo = getSetting("company_logo") || "";
  const companyAddress = getSetting("company_address") || "";
  const standardDays = getSetting("standard_work_days") || "26";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl pb-20">
      <div>
        <h1 className="text-[28px] font-black text-on-surface leading-tight">Cấu hình hệ thống</h1>
        <p className="text-body-sm text-on-surface-variant font-medium opacity-70">Quản lý định danh và tham số vận hành</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Branding */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <span className="material-symbols-outlined text-[28px]">domain</span>
            </div>
            <div>
              <h3 className="text-[17px] font-black text-on-surface">Thông tin công ty</h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-60">Nhận diện thương hiệu</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Tên công ty</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => {
                  const newSettings = [...settings];
                  const idx = newSettings.findIndex(s => s.id === "company_name");
                  if (idx > -1) newSettings[idx].value = JSON.stringify(e.target.value);
                  setSettings(newSettings);
                }}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-3 text-body-md font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                placeholder="Nhập tên công ty..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Địa chỉ trụ sở</label>
              <textarea
                value={companyAddress}
                onChange={(e) => {
                  const newSettings = [...settings];
                  const idx = newSettings.findIndex(s => s.id === "company_address");
                  if (idx > -1) newSettings[idx].value = JSON.stringify(e.target.value);
                  setSettings(newSettings);
                }}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-3 text-body-md font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all min-h-[80px]"
                placeholder="Nhập địa chỉ..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">URL Logo</label>
              <input
                type="text"
                value={companyLogo}
                onChange={(e) => {
                  const newSettings = [...settings];
                  const idx = newSettings.findIndex(s => s.id === "company_logo");
                  if (idx > -1) newSettings[idx].value = JSON.stringify(e.target.value);
                  setSettings(newSettings);
                }}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-3 text-body-md font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <button
              onClick={async () => {
                await handleUpdate("company_name", JSON.stringify(companyName));
                await handleUpdate("company_address", JSON.stringify(companyAddress));
                await handleUpdate("company_logo", JSON.stringify(companyLogo));
              }}
              disabled={saving !== null}
              className="w-full rounded-2xl bg-indigo-600 px-6 py-4 text-label-md font-black text-white hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">save</span>
              {saving ? "Đang lưu..." : "Lưu thông tin công ty"}
            </button>
          </div>
        </div>

        {/* Operational Settings */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined text-[28px]">settings_accessibility</span>
            </div>
            <div>
              <h3 className="text-[17px] font-black text-on-surface">Vận hành</h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-60">Tham số hệ thống</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Số ngày công chuẩn</label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={standardDays}
                  onChange={(e) => {
                    const newSettings = [...settings];
                    const idx = newSettings.findIndex(s => s.id === "standard_work_days");
                    if (idx > -1) newSettings[idx].value = e.target.value;
                    setSettings(newSettings);
                  }}
                  className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-3 text-body-md font-bold outline-none focus:border-amber-500 focus:bg-white transition-all"
                />
                <button
                  onClick={() => handleUpdate("standard_work_days", standardDays)}
                  disabled={saving === "standard_work_days"}
                  className="rounded-2xl bg-amber-500 px-6 py-3 text-label-md font-black text-white hover:bg-amber-600 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-amber-100"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-5 rounded-[24px] border animate-in slide-in-from-bottom-4 duration-300 ${message.includes("thành công") ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"}`}>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">{message.includes("thành công") ? "check_circle" : "error"}</span>
            <p className="text-body-sm font-black uppercase tracking-widest">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
