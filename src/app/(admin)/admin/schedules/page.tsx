"use client";

import { useState, useEffect, useCallback } from "react";
import { Profile, WorkShift, EmployeeSchedule } from "@/lib/types";
import LoadingState from "@/components/LoadingState";

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ employee_id: "", shift_id: "", start_date: new Date().toISOString().split("T")[0], end_date: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedRes, empRes, shiftRes] = await Promise.all([
        fetch("/api/admin/schedules"),
        fetch("/api/admin/employees?pageSize=100"),
        fetch("/api/admin/shifts")
      ]);
      const [schedData, empData, shiftData] = await Promise.all([schedRes.json(), empRes.json(), shiftRes.json()]);
      setSchedules(schedData.schedules ?? []);
      setEmployees(empData.employees ?? []);
      setShifts(shiftData.shifts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ employee_id: "", shift_id: "", start_date: new Date().toISOString().split("T")[0], end_date: "" });
        setShowAdd(false);
        await fetchData();
      } else {
        const data = await res.json();
        setError(data.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa lịch làm việc này?")) return;
    await fetch(`/api/admin/schedules/${id}`, { method: "DELETE" });
    await fetchData();
  };

  return (
    <div className="space-y-6  animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface">Phân lịch làm việc</h1>
          <p className="text-body-sm text-on-surface-variant">Gán ca làm việc cho từng nhân viên</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-xl bg-secondary px-6 py-2.5 text-label-md font-bold text-white hover:bg-blue-700 shadow-lg shadow-secondary/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">{showAdd ? "close" : "event_available"}</span>
          {showAdd ? "Hủy bỏ" : "Tạo lịch mới"}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm animate-in slide-in-from-top-2">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-500">Nhân viên</label>
              <select
                required
                value={form.employee_id}
                onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                className="w-full rounded-lg border border-outline-variant px-4 py-2 text-body-md outline-none focus:border-secondary bg-white"
              >
                <option value="">-- Chọn nhân viên --</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-500">Ca làm việc</label>
              <select
                required
                value={form.shift_id}
                onChange={(e) => setForm({ ...form, shift_id: e.target.value })}
                className="w-full rounded-lg border border-outline-variant px-4 py-2 text-body-md outline-none focus:border-secondary bg-white"
              >
                <option value="">-- Chọn ca --</option>
                {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time.substring(0, 5)}-{s.end_time.substring(0, 5)})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-500">Ngày bắt đầu</label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full rounded-lg border border-outline-variant px-4 py-2 text-body-md outline-none focus:border-secondary"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-primary-container px-8 py-2 text-label-md font-bold text-white hover:bg-primary disabled:opacity-50 h-[42px]"
              >
                {saving ? "Đang xử lý..." : "Lưu lịch trình"}
              </button>
            </div>
          </form>
          {error && <p className="text-error text-xs mt-2 font-bold">{error}</p>}
        </div>
      )}

      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState message="Đang tải lịch trình làm việc..." />
        ) : schedules.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant">Chưa có lịch làm việc nào được phân công.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Nhân viên</th>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Ca làm việc</th>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Thời gian áp dụng</th>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {schedules.map((sched) => (
                  <tr key={sched.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                          {sched.profiles?.full_name?.charAt(0)}
                        </div>
                        <span className="text-body-md font-bold text-on-surface">{sched.profiles?.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-body-md font-bold text-secondary">{sched.work_shifts?.name}</span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {sched.work_shifts?.start_time.substring(0, 5)} - {sched.work_shifts?.end_time.substring(0, 5)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-body-sm text-on-surface">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_month</span>
                        <span>{new Date(sched.start_date).toLocaleDateString("vi-VN")}</span>
                        {sched.end_date ? (
                          <>
                            <span>→</span>
                            <span>{new Date(sched.end_date).toLocaleDateString("vi-VN")}</span>
                          </>
                        ) : (
                          <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded font-bold uppercase">Dài hạn</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(sched.id)}
                        className="p-2 rounded-lg text-error hover:bg-error/10"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
