"use client";

import { useState, useEffect, useCallback } from "react";
import { Holiday } from "@/lib/types";
import LoadingState from "@/components/LoadingState";

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", date: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/holidays");
      const data = await res.json();
      setHolidays(data.holidays ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ name: "", date: "", description: "" });
        setShowAdd(false);
        await fetchHolidays();
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
      const res = await fetch(`/api/admin/holidays/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingId(null);
        await fetchHolidays();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa ngày nghỉ lễ này?")) return;
    await fetch(`/api/admin/holidays/${id}`, { method: "DELETE" });
    await fetchHolidays();
  };

  return (
    <div className="space-y-6  animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface">Quản lý ngày lễ</h1>
          <p className="text-body-sm text-on-surface-variant">Thiết lập các ngày nghỉ lễ trong năm</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-xl bg-secondary px-6 py-2.5 text-label-md font-bold text-white hover:bg-blue-700 shadow-lg shadow-secondary/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">{showAdd ? "close" : "celebration"}</span>
          {showAdd ? "Hủy bỏ" : "Thêm ngày lễ"}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm animate-in slide-in-from-top-2">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-500">Tên ngày lễ</label>
              <input
                type="text"
                required
                placeholder="VD: Tết Nguyên Đán, Quốc khánh..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-outline-variant px-4 py-2 text-body-md outline-none focus:border-secondary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-500">Ngày diễn ra</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-lg border border-outline-variant px-4 py-2 text-body-md outline-none focus:border-secondary"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-primary-container px-8 py-2 text-label-md font-bold text-white hover:bg-primary disabled:opacity-50 h-[42px]"
              >
                {saving ? "..." : "Lưu ngày lễ"}
              </button>
            </div>
          </form>
          {error && <p className="text-error text-xs mt-2 font-bold">{error}</p>}
        </div>
      )}

      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState message="Đang tải danh sách ngày lễ..." />
        ) : holidays.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant">Chưa có ngày nghỉ lễ nào được thiết lập.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Ngày lễ</th>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Ngày diễn ra</th>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      {editingId === h.id ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full rounded-lg border border-outline-variant px-3 py-1.5 text-body-md outline-none focus:border-secondary"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-secondary">festival</span>
                          <span className="text-body-md font-bold text-on-surface">{h.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === h.id ? (
                        <input
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                          className="rounded-lg border border-outline-variant px-3 py-1 text-sm outline-none focus:border-secondary"
                        />
                      ) : (
                        <span className="text-body-md text-on-surface font-medium">
                          {new Date(h.date).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {editingId === h.id ? (
                          <>
                            <button onClick={() => handleUpdate(h.id)} className="text-secondary font-bold text-label-md">Lưu</button>
                            <button onClick={() => setEditingId(null)} className="text-on-surface-variant font-bold text-label-md">Hủy</button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditingId(h.id); setEditForm({ name: h.name, date: h.date, description: h.description || "" }); }}
                              className="p-2 rounded-lg text-secondary hover:bg-secondary/10"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(h.id)}
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
