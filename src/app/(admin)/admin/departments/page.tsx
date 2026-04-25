"use client";

import { useState, useEffect, useCallback } from "react";
import { Department } from "@/lib/types";
import LoadingState from "@/components/LoadingState";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/departments");
      const data = await res.json();
      setDepartments(data.departments ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        setNewName("");
        setShowAdd(false);
        await fetchDepartments();
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
      const res = await fetch(`/api/admin/departments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      if (res.ok) {
        setEditingId(null);
        await fetchDepartments();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa phòng ban này? Các vị trí liên quan sẽ bị xóa.")) return;
    await fetch(`/api/admin/departments/${id}`, { method: "DELETE" });
    await fetchDepartments();
  };

  return (
    <div className="space-y-6  animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface">Quản lý phòng ban</h1>
          <p className="text-body-sm text-on-surface-variant">Tổ chức các bộ phận trong công ty</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-xl bg-secondary px-6 py-2.5 text-label-md font-bold text-white hover:bg-blue-700 shadow-lg shadow-secondary/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">{showAdd ? "close" : "add"}</span>
          {showAdd ? "Hủy bỏ" : "Thêm phòng ban"}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm animate-in slide-in-from-top-2">
          <form onSubmit={handleAdd} className="flex gap-4">
            <input
              type="text"
              required
              placeholder="Tên phòng ban (VD: Phòng Kỹ thuật, Phòng Nhân sự...)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 rounded-lg border border-outline-variant px-4 py-2 text-body-md outline-none focus:border-secondary"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-container px-8 py-2 text-label-md font-bold text-white hover:bg-primary disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </form>
          {error && <p className="text-error text-xs mt-2 font-bold">{error}</p>}
        </div>
      )}

      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState message="Đang tải danh sách phòng ban..." />
        ) : departments.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant">Chưa có phòng ban nào.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Tên phòng ban</th>
                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    {editingId === dept.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-outline-variant px-3 py-1.5 text-body-md outline-none focus:border-secondary"
                        autoFocus
                      />
                    ) : (
                      <span className="text-body-md font-bold text-on-surface">{dept.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {editingId === dept.id ? (
                        <>
                          <button onClick={() => handleUpdate(dept.id)} className="text-secondary font-bold text-label-md">Lưu</button>
                          <button onClick={() => setEditingId(null)} className="text-on-surface-variant font-bold text-label-md">Hủy</button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditingId(dept.id); setEditName(dept.name); }}
                            className="p-2 rounded-lg text-secondary hover:bg-secondary/10"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(dept.id)}
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
        )}
      </div>
    </div>
  );
}
