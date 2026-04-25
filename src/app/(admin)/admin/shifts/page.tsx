"use client";

import { useState, useEffect, useCallback } from "react";
import { WorkShift } from "@/lib/types";
import LoadingState from "@/components/LoadingState";

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", start_time: "08:00", end_time: "17:30" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", start_time: "", end_time: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shifts");
      const data = await res.json();
      setShifts(data.shifts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ name: "", start_time: "08:00", end_time: "17:30" });
        setShowAdd(false);
        await fetchShifts();
      } else {
        const data = await res.json();
        setError(data.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/shifts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingId(null);
        await fetchShifts();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa ca làm việc này?")) return;
    await fetch(`/api/admin/shifts/${id}`, { method: "DELETE" });
    await fetchShifts();
  };

  return (
    <div className="space-y-6  animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface">Quản lý ca làm việc</h1>
          <p className="text-body-sm text-on-surface-variant">Thiết lập khung giờ làm việc cho nhân viên</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-xl bg-secondary px-6 py-2.5 text-label-md font-bold text-white hover:bg-blue-700 shadow-lg shadow-secondary/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">{showAdd ? "close" : "schedule"}</span>
          {showAdd ? "Hủy bỏ" : "Thêm ca mới"}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm animate-in slide-in-from-top-2">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-500">Tên ca</label>
              <input
                type="text"
                required
                placeholder="VD: Ca hành chính, Ca sáng..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-outline-variant px-4 py-2 text-body-md outline-none focus:border-secondary"
              />
            </div>
            <div className="md:col-span-1 space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-500">Giờ bắt đầu</label>
              <input
                type="time"
                required
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full rounded-lg border border-outline-variant px-4 py-2 text-body-md outline-none focus:border-secondary"
              />
            </div>
            <div className="md:col-span-1 space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-500">Giờ kết thúc</label>
              <input
                type="time"
                required
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full rounded-lg border border-outline-variant px-4 py-2 text-body-md outline-none focus:border-secondary"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-primary-container px-8 py-2 text-label-md font-bold text-white hover:bg-primary disabled:opacity-50 h-[42px]"
              >
                {saving ? "..." : "Lưu ca"}
              </button>
            </div>
          </form>
          {error && <p className="text-error text-xs mt-2 font-bold">{error}</p>}
        </div>
      )}

      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState message="Đang tải danh sách ca làm việc..." />
        ) : shifts.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant">Chưa có ca làm việc nào được thiết lập.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Tên ca làm việc</th>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase text-center">Khung giờ</th>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      {editingId === shift.id ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full rounded-lg border border-outline-variant px-3 py-1.5 text-body-md outline-none focus:border-secondary"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-secondary">history_toggle_off</span>
                          <span className="text-body-md font-bold text-on-surface">{shift.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {editingId === shift.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="time"
                            value={editForm.start_time}
                            onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                            className="rounded-lg border border-outline-variant px-2 py-1 text-sm outline-none focus:border-secondary"
                          />
                          <span>-</span>
                          <input
                            type="time"
                            value={editForm.end_time}
                            onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                            className="rounded-lg border border-outline-variant px-2 py-1 text-sm outline-none focus:border-secondary"
                          />
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-secondary/5 border border-secondary/10 text-secondary font-bold text-label-md">
                          {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {editingId === shift.id ? (
                          <>
                            <button onClick={() => handleUpdate(shift.id)} className="text-secondary font-bold text-label-md">Lưu</button>
                            <button onClick={() => setEditingId(null)} className="text-on-surface-variant font-bold text-label-md">Hủy</button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditingId(shift.id); setEditForm({ name: shift.name, start_time: shift.start_time, end_time: shift.end_time }); }}
                              className="p-2 rounded-lg text-secondary hover:bg-secondary/10"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(shift.id)}
                              className="p-2 rounded-lg text-error hover:bg-error/10"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </>
                        )}
                      </div>
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
