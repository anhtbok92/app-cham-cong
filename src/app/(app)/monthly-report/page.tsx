"use client";

import { useState, useEffect, useCallback } from "react";
import LoadingState from "@/components/LoadingState";

export default function MonthlyReportPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const res = await fetch(`/api/attendance/history-stats?month=${year}-${month}`);
    const result = await res.json();
    setData(result);
    setLoading(false);
  }, [currentMonth]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - offset + 1;
    if (day > 0 && day <= daysInMonth) return day;
    return null;
  });

  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const getStatusDot = (day: number) => {
    if (!data) return null;
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const dateStr = `${year}-${month}-${String(day).padStart(2, "0")}`;
    
    const stats = data.dailyStats[dateStr];
    if (stats) {
      return stats.isLate ? "bg-amber-500" : "bg-emerald-500";
    }

    // Check if it's in the past
    const checkDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkDate < today) {
      // Check if holiday
      const isHoliday = data.holidays?.some((h: any) => h.date === dateStr);
      if (isHoliday) return "bg-blue-400"; // Holiday dot

      // Check if leave
      const isLeave = data.leaves?.some((l: any) => {
        const start = new Date(l.start_date);
        const end = new Date(l.end_date);
        return checkDate >= start && checkDate <= end;
      });
      if (isLeave) return "bg-purple-500";

      // If weekend
      const dayOfWeek = checkDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) return null;

      return "bg-red-500"; // Absent
    }

    return null;
  };

  if (loading && !data) return <div className="min-h-screen flex items-center justify-center"><LoadingState message="Đang tổng hợp bảng công..." /></div>;

  return (
    <main className="px-margin-page py-6 pb-24 space-y-6 max-w-md mx-auto animate-in fade-in duration-500">
      {/* Month Selector Section */}
      <section className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-50">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bảng công tháng</span>
          <span className="text-[18px] font-black text-on-surface">
            Tháng {currentMonth.getMonth() + 1}/{currentMonth.getFullYear()}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => changeMonth(-1)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-slate-400">chevron_left</span>
          </button>
          <button onClick={() => changeMonth(1)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </button>
        </div>
      </section>

      {/* Calendar Section */}
      <section className="bg-white rounded-[24px] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-50">
        <div className="grid grid-cols-7 text-center py-4 border-b border-slate-50 bg-slate-50/50">
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day, idx) => (
            <div key={day} className={`text-[10px] font-black uppercase tracking-widest ${idx === 6 ? "text-red-500" : "text-slate-400"}`}>
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 p-2 gap-y-1">
          {calendarDays.map((day, i) => (
            <div key={i} className="flex flex-col items-center justify-center h-14 relative">
              {day && (
                <>
                  <span className={`text-[13px] font-bold ${i % 7 === 6 ? "text-red-300" : "text-on-surface"} ${day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth() ? "w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center" : ""}`}>
                    {day}
                  </span>
                  <div className="flex gap-0.5 mt-1 h-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(day)}`}></div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        
        {/* Legend Section */}
        <div className="p-4 bg-slate-50/30 border-t border-slate-50">
          <div className="grid grid-cols-3 gap-y-3 gap-x-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Đúng giờ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Đi muộn</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Vắng mặt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Nghỉ phép</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Ngày lễ</span>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Section (Bento Grid) */}
      <section className="grid grid-cols-2 gap-3">
        <div className="col-span-2 bg-gradient-to-br from-primary to-blue-700 p-5 rounded-[24px] flex justify-between items-center shadow-lg shadow-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <span className="material-symbols-outlined text-white text-[28px]">event_available</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">CÔNG THỰC TẾ</span>
              <span className="text-white font-black text-[24px] leading-none mt-1">{data?.workDays || 0} ngày</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40">
            <span className="material-symbols-outlined">chevron_right</span>
          </div>
        </div>
        
        {[
          { label: "Công chuẩn", value: data?.standardDays || 26, unit: "ngày", color: "text-slate-400", bg: "bg-white" },
          { label: "Nghỉ phép", value: data?.leaves?.length || 0, unit: "đơn", color: "text-purple-500", bg: "bg-purple-50/50" },
          { label: "Đi muộn", value: data?.lateCount || 0, unit: "lần", color: "text-amber-500", bg: "bg-amber-50/50" },
          { label: "Vắng mặt", value: data?.absentDays || 0, unit: "ngày", color: "text-red-500", bg: "bg-red-50/50" },
        ].map((item) => (
          <div key={item.label} className={`${item.bg} p-5 rounded-[24px] shadow-sm border border-slate-50 flex flex-col gap-1 transition-transform active:scale-95`}>
            <span className={`text-[9px] font-black uppercase tracking-widest ${item.color}`}>
              {item.label}
            </span>
            <div className="flex items-end gap-1">
              <span className={`text-[22px] font-black leading-none ${item.color.replace('text-', 'text-opacity-100 text-')}`}>
                {item.value}
              </span>
              <span className="text-slate-300 text-[10px] font-bold mb-0.5">{item.unit}</span>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
