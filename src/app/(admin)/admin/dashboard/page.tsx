"use client";

import { useEffect, useState } from "react";
import LoadingState from "@/components/LoadingState";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const res = await fetch("/api/admin/dashboard/stats");
    const result = await res.json();
    setData(result);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingState message="Đang phân tích dữ liệu hệ thống..." />
      </div>
    );
  }

  const statsCards = [
    { label: "Tổng nhân sự", value: data.totalEmployees, icon: "groups", color: "bg-blue-50 text-blue-600", trend: "+12%" },
    { label: "Đã chấm công", value: data.presentToday, icon: "how_to_reg", color: "bg-emerald-50 text-emerald-600", trend: `${((data.presentToday/data.totalEmployees)*100 || 0).toFixed(0)}%` },
    { label: "Đi muộn", value: data.lateToday, icon: "alarm_on", color: "bg-amber-50 text-amber-600", trend: `${((data.lateToday/data.presentToday)*100 || 0).toFixed(0)}%` },
    { label: "Vắng mặt", value: data.absentToday, icon: "person_off", color: "bg-red-50 text-red-600", trend: "Hôm nay" },
    { label: "Nghỉ phép", value: data.onLeave, icon: "event_busy", color: "bg-purple-50 text-purple-600", trend: "Có phép" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        {statsCards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl ${card.color}`}>
                <span className="material-symbols-outlined text-[24px]">{card.icon}</span>
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${card.color}`}>{card.trend}</span>
            </div>
            <div className="mt-5">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
              <p className="text-[28px] font-black text-on-surface leading-tight mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Chart Section */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-[18px] font-black text-on-surface">Tình hình chấm công</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Dữ liệu 7 ngày gần nhất</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span className="text-[11px] font-black text-slate-500">Đúng giờ</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <span className="text-[11px] font-black text-slate-500">Đi muộn</span>
                </div>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between px-2 gap-4">
              {[65, 82, 45, 90, 75, 20, 15].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group">
                  <div className="w-full max-w-[40px] bg-slate-50 rounded-2xl relative h-full flex flex-col justify-end overflow-hidden">
                    <div className="absolute top-2 w-full text-center text-[9px] font-black text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">{h}%</div>
                    <div className="w-full bg-blue-600 rounded-t-xl transition-all duration-500 group-hover:bg-blue-700" style={{ height: `${h}%` }}>
                      <div className="w-full bg-amber-400 opacity-80" style={{ height: "15%" }}></div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">{["T2", "T3", "T4", "T5", "T6", "T7", "CN"][i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Late Table */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-[18px] font-black text-on-surface">Đi muộn hôm nay</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Danh sách ghi nhận mới nhất</p>
              </div>
              <button className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline">Chi tiết</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhân viên</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phòng ban</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giờ vào</th>
                    <th className="px-8 py-4 text-[10px] font-black text-red-500 uppercase tracking-widest">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.lateList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-slate-400 text-[13px] font-bold italic">
                        Tuyệt vời! Không có nhân viên nào đi muộn hôm nay.
                      </td>
                    </tr>
                  ) : (
                    data.lateList.map((late: any) => (
                      <tr key={late.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4 font-bold text-on-surface">{late.name}</td>
                        <td className="px-8 py-4 text-slate-500 text-[13px]">{late.department}</td>
                        <td className="px-8 py-4 font-black text-on-surface">
                          {new Date(late.checkIn).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-8 py-4">
                          <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-100">Đi muộn</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Department Breakdown */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <h3 className="text-[18px] font-black text-on-surface mb-8">Cơ cấu nhân sự</h3>
            <div className="space-y-6">
              {data.deptStats.map((dept: any, i: number) => {
                const colors = ["bg-blue-600", "bg-emerald-500", "bg-amber-400", "bg-purple-500"];
                const color = colors[i % colors.length];
                const percentage = ((dept.count / data.totalEmployees) * 100).toFixed(0);
                
                return (
                  <div key={dept.name} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[12px] font-black text-on-surface-variant uppercase tracking-widest">{dept.name}</span>
                      <span className="text-[14px] font-black text-on-surface">{dept.count} <span className="text-[10px] text-slate-300">({percentage}%)</span></span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Requests Alert */}
          <div className={`p-8 rounded-[32px] border transition-all ${data.pendingLeaveCount > 0 ? "bg-amber-50 border-amber-100" : "bg-white border-slate-100 shadow-sm"}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[17px] font-black text-on-surface">Đơn nghỉ phép</h3>
              {data.pendingLeaveCount > 0 && (
                <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse">
                  {data.pendingLeaveCount} CHỜ DUYỆT
                </span>
              )}
            </div>
            {data.pendingLeaveCount > 0 ? (
              <div className="space-y-4">
                <p className="text-[13px] font-bold text-amber-800 leading-relaxed">
                  Đang có {data.pendingLeaveCount} đơn xin nghỉ phép mới cần bạn phê duyệt ngay.
                </p>
                <button className="w-full py-4 bg-amber-500 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all">
                  Đi đến phê duyệt
                </button>
              </div>
            ) : (
              <div className="text-center py-4 border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Không có đơn mới</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
