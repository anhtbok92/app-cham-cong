"use client";

import { useState, useEffect, useCallback } from "react";
import LoadingState from "@/components/LoadingState";

type ViewMode = "week" | "month" | "year";

export default function HistoryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    let url = "/api/attendance/history-stats";
    if (viewMode === "year") {
      url += `?year=${currentDate.getFullYear()}`;
    } else if (viewMode === "week") {
      // Get ISO week
      const d = new Date(currentDate);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 4 - (d.getDay() || 7));
      const yearStart = new Date(d.getFullYear(), 0, 1);
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      url += `?week=${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
    } else {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      url += `?month=${year}-${month}`;
    }

    const res = await fetch(url);
    const result = await res.json();
    setData(result);
    setLoading(false);
  }, [currentDate, viewMode]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const changeDate = (delta: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === "year") newDate.setFullYear(newDate.getFullYear() + delta);
    else if (viewMode === "month") newDate.setMonth(newDate.getMonth() + delta);
    else newDate.setDate(newDate.getDate() + (delta * 7));
    setCurrentDate(newDate);
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  if (loading && !data) return <div className="min-h-screen flex items-center justify-center"><LoadingState message="Đang tải dữ liệu..." /></div>;

  const { standardDays, workDays, lateCount, absentDays, records, dailyStats, monthlyBreakdown } = data || {};

  return (
    <main className="px-margin-page py-6 space-y-6 max-w-md mx-auto pb-24 animate-in fade-in duration-500">
      {/* View Switcher Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
        {(["week", "month", "year"] as ViewMode[]).map((mode) => (
          <button 
            key={mode}
            onClick={() => { setViewMode(mode); setCurrentDate(new Date()); }}
            className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
              viewMode === mode ? "bg-white text-primary shadow-md" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {mode === "week" ? "Tuần" : mode === "month" ? "Tháng" : "Năm"}
          </button>
        ))}
      </div>

      {/* Date Selector */}
      <div className="flex items-center justify-between bg-white p-5 rounded-[28px] shadow-xl shadow-slate-200/40 border border-slate-50">
        <button onClick={() => changeDate(-1)} className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors active:scale-90">
          <span className="material-symbols-outlined text-slate-400">chevron_left</span>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-0.5">
            {viewMode === "year" ? "Báo cáo năm" : viewMode === "month" ? "Báo cáo tháng" : "Báo cáo tuần"}
          </span>
          <span className="text-[18px] font-black text-on-surface">
            {viewMode === "year" ? currentDate.getFullYear() : 
             viewMode === "month" ? `Tháng ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}` :
             `Tuần ${Math.ceil(currentDate.getDate() / 7)} - T${currentDate.getMonth() + 1}`}
          </span>
        </div>
        <button onClick={() => changeDate(1)} className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors active:scale-90">
          <span className="material-symbols-outlined text-slate-400">chevron_right</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 p-5 rounded-[28px] border border-blue-100/50 flex flex-col gap-1 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-700/60">Công thực tế</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-blue-700">{workDays}</span>
            <span className="text-[11px] font-bold text-blue-700/60 lowercase">ngày</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 p-5 rounded-[28px] border border-amber-100/50 flex flex-col gap-1 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700/60">Đi muộn</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-amber-700">{lateCount}</span>
            <span className="text-[11px] font-bold text-amber-700/60 lowercase">lần</span>
          </div>
        </div>
      </div>

      {/* List Section */}
      <section className="space-y-4">
        <h3 className="text-[14px] font-black uppercase tracking-widest text-on-surface opacity-60 px-2 flex items-center justify-between">
          <span>Chi tiết ghi nhận</span>
          <span className="material-symbols-outlined text-[18px]">history</span>
        </h3>

        {viewMode === "year" ? (
          <div className="grid grid-cols-1 gap-3">
            {monthlyBreakdown?.map((m: any) => (
              <div key={m.month} className="bg-white p-5 rounded-[24px] border border-slate-50 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[15px] font-black text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {m.month}
                  </div>
                  <div>
                    <p className="text-[15px] font-black text-on-surface">Tháng {m.month}</p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">{m.workDays} ngày công</p>
                  </div>
                </div>
                <button className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {records?.length === 0 ? (
              <div className="bg-white p-12 rounded-[32px] text-center border-2 border-dashed border-slate-100 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                  <span className="material-symbols-outlined text-4xl">folder_off</span>
                </div>
                <p className="text-[12px] font-black text-slate-300 uppercase tracking-widest">Không có dữ liệu chấm công</p>
              </div>
            ) : (
              records.map((r: any) => {
                const isLate = dailyStats[r.date]?.firstIn === r.check_in_time && dailyStats[r.date]?.isLate;
                return (
                  <div key={r.id} className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-50 hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[15px] font-black text-on-surface capitalize">
                          {new Date(r.date).toLocaleDateString("vi-VN", { weekday: 'long', day: '2-digit', month: '2-digit' })}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">Làm: {r.work_hours || 0}h</span>
                          {isLate && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border border-red-100">Đi muộn</span>}
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${r.check_out_time ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`}></div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">login</span>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Vào</p>
                          <p className="text-[14px] font-black text-on-surface leading-none">{formatTime(r.check_in_time)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 border-l border-slate-50 pl-6">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.check_out_time ? "bg-emerald-50 text-emerald-500" : "bg-slate-50 text-slate-300"}`}>
                          <span className="material-symbols-outlined text-[20px]">logout</span>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Ra</p>
                          <p className={`text-[14px] font-black leading-none ${r.check_out_time ? "text-on-surface" : "text-slate-300"}`}>
                            {formatTime(r.check_out_time)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>
    </main>
  );
}
