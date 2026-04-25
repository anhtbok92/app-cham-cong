"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateCSV, generateDetailedCSV, type ReportSummary } from "@/lib/admin/report-service";
import type { Profile } from "@/lib/types";
import LoadingState from "@/components/LoadingState";

function getDefaultDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export default function ReportsPage() {
  const defaults = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [employeeId, setEmployeeId] = useState("");
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [summaries, setSummaries] = useState<ReportSummary[]>([]);
  const [detailedRecords, setDetailedRecords] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"summary" | "detailed">("detailed");
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadEmployees() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "employee")
        .eq("is_active", true)
        .order("full_name");
      setEmployees((data as Profile[]) ?? []);
    }
    loadEmployees();
  }, [supabase]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (employeeId) params.set("employeeId", employeeId);

      const res = await fetch(`/api/admin/reports?${params}`);
      const data = await res.json();
      setSummaries(data.summaries ?? []);
      setDetailedRecords(data.detailedRecords ?? []);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, employeeId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = () => {
    const csv = viewMode === "summary" 
      ? generateCSV(summaries) 
      : generateDetailedCSV(detailedRecords);
    const filename = viewMode === "summary" 
      ? `tong-hop-cham-cong-${startDate}-${endDate}.csv`
      : `chi-tiet-cham-cong-${startDate}-${endDate}.csv`;

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6  animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface">Báo cáo chấm công</h1>
          <p className="text-body-sm text-on-surface-variant">Theo dõi và trích xuất dữ liệu làm việc của nhân viên</p>
        </div>
        <div className="flex bg-surface-container p-1 rounded-xl">
          <button
            onClick={() => setViewMode("detailed")}
            className={`px-4 py-1.5 text-label-md font-bold rounded-lg transition-all ${viewMode === "detailed" ? "bg-white text-secondary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            Chi tiết
          </button>
          <button
            onClick={() => setViewMode("summary")}
            className={`px-4 py-1.5 text-label-md font-bold rounded-lg transition-all ${viewMode === "summary" ? "bg-white text-secondary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            Tổng hợp
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm">
        <form
          onSubmit={(e) => { e.preventDefault(); fetchReport(); }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          <div className="space-y-1.5">
            <label htmlFor="startDate" className="text-label-sm text-on-surface-variant font-bold uppercase tracking-tight">Từ ngày</label>
            <input id="startDate" type="date" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md outline-none focus:border-secondary transition-all" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="endDate" className="text-label-sm text-on-surface-variant font-bold uppercase tracking-tight">Đến ngày</label>
            <input id="endDate" type="date" value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md outline-none focus:border-secondary transition-all" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="employeeFilter" className="text-label-sm text-on-surface-variant font-bold uppercase tracking-tight">Nhân viên</label>
            <select id="employeeFilter" value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md outline-none focus:border-secondary transition-all">
              <option value="">Tất cả nhân viên</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit"
              className="flex-1 rounded-lg bg-primary-container px-4 py-2 text-label-md font-bold text-white hover:bg-primary transition-all shadow-md shadow-primary/10">
              Lọc dữ liệu
            </button>
            <button 
              type="button" 
              onClick={handleExport} 
              disabled={loading || (viewMode === "summary" ? summaries.length === 0 : detailedRecords.length === 0)}
              className="rounded-lg bg-teal-600 px-4 py-2 text-label-md font-bold text-white hover:bg-teal-700 disabled:opacity-50 transition-all shadow-md shadow-teal-500/10 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">file_download</span>
              Xuất Excel
            </button>
          </div>
        </form>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState message="Đang trích xuất dữ liệu báo cáo..." />
        ) : (viewMode === "summary" ? summaries : detailedRecords).length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">analytics</span>
            <p className="text-body-lg text-on-surface-variant font-medium">Không có dữ liệu chấm công trong khoảng thời gian này.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                {viewMode === "summary" ? (
                  <tr>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Nhân viên</th>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-center">Tổng giờ làm</th>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-center">Ngày có mặt</th>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-center">Ngày vắng</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Nhân viên</th>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Ngày</th>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-center">Giờ vào</th>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-center">Giờ ra</th>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-center">Tổng giờ</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {viewMode === "summary" ? (
                  summaries.map((s) => (
                    <tr key={s.employeeId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center font-bold text-secondary text-xs">
                            {s.employeeName.charAt(0)}
                          </div>
                          <span className="text-body-md font-bold text-on-surface">{s.employeeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-body-md font-bold text-primary">{s.totalWorkHours}h</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold text-green-700">
                          {s.daysPresent} ngày
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold text-red-700">
                          {s.daysAbsent} ngày
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  detailedRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center font-bold text-on-secondary-fixed text-xs">
                            {r.employee_name?.charAt(0)}
                          </div>
                          <span className="text-body-md font-bold text-on-surface">{r.employee_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-body-sm text-on-surface font-medium">{r.date}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-green-600 font-bold">
                          <span className="material-symbols-outlined text-[16px]">login</span>
                          {r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 font-bold ${r.check_out_time ? "text-orange-600" : "text-slate-300"}`}>
                          <span className="material-symbols-outlined text-[16px]">logout</span>
                          {r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="bg-surface-container px-3 py-1 rounded-lg inline-block">
                          <span className="text-body-sm font-black text-secondary">
                            {r.work_hours ? `${r.work_hours}h` : "0h"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
