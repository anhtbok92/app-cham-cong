"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import dynamic from "next/dynamic";
import type { OfficeLocation } from "@/lib/types";
import LoadingState from "@/components/LoadingState";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full animate-pulse rounded-2xl bg-surface-container flex flex-col items-center justify-center gap-3 border border-outline-variant/50">
      <div className="w-10 h-10 rounded-full border-4 border-secondary/20 border-b-secondary animate-spin"></div>
      <p className="text-body-sm font-bold text-on-surface-variant">Đang tải bản đồ...</p>
    </div>
  )
});

interface LocationForm {
  name: string;
  latitude: string;
  longitude: string;
  allowed_radius: 50 | 100;
}

const emptyForm: LocationForm = { name: "", latitude: "", longitude: "", allowed_radius: 100 };

export default function LocationsPage() {
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<LocationForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<LocationForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/locations");
      const data = await res.json();
      setLocations(data.locations ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          latitude: parseFloat(createForm.latitude),
          longitude: parseFloat(createForm.longitude),
          allowed_radius: createForm.allowed_radius,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message);
        return;
      }
      setCreateForm(emptyForm);
      setShowCreate(false);
      await fetchLocations();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (loc: OfficeLocation) => {
    setEditingId(loc.id);
    setEditForm({
      name: loc.name,
      latitude: String(loc.latitude),
      longitude: String(loc.longitude),
      allowed_radius: loc.allowed_radius,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/locations/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          latitude: parseFloat(editForm.latitude),
          longitude: parseFloat(editForm.longitude),
          allowed_radius: editForm.allowed_radius,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message);
        return;
      }
      setEditingId(null);
      await fetchLocations();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa địa điểm này?")) return;
    await fetch(`/api/admin/locations/${id}`, { method: "DELETE" });
    await fetchLocations();
  };

  return (
    <div className="space-y-6 pb-20  animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface">Cấu hình địa điểm</h1>
          <p className="text-body-sm text-on-surface-variant">Thiết lập các văn phòng và bán kính cho phép chấm công</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`rounded-xl px-6 py-2.5 text-label-md font-bold transition-all flex items-center gap-2 active:scale-95 ${
            showCreate 
              ? "bg-white border border-outline-variant text-on-surface-variant hover:bg-slate-50" 
              : "bg-secondary text-white hover:bg-blue-700 shadow-lg shadow-secondary/20"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">{showCreate ? "close" : "add_location"}</span>
          {showCreate ? "Hủy bỏ" : "Thêm địa điểm"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-error-container p-4 flex gap-3 border border-error/20">
          <span className="material-symbols-outlined text-error">error</span>
          <p className="text-body-sm text-on-error-container font-bold">{error}</p>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-xl animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 space-y-1.5">
                <label htmlFor="create-name" className="text-label-sm text-on-surface-variant font-bold uppercase tracking-tight">Tên địa điểm *</label>
                <input id="create-name" type="text" required value={createForm.name}
                  placeholder="Văn phòng TP.HCM, Chi nhánh Hà Nội..."
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-body-md outline-none focus:border-secondary shadow-sm transition-all" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="create-lat" className="text-label-sm text-on-surface-variant font-bold uppercase tracking-tight">Vĩ độ (Latitude)</label>
                <input id="create-lat" type="number" step="any" required value={createForm.latitude}
                  onChange={(e) => setCreateForm({ ...createForm, latitude: e.target.value })}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-body-md outline-none focus:border-secondary shadow-sm transition-all" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="create-lng" className="text-label-sm text-on-surface-variant font-bold uppercase tracking-tight">Kinh độ (Longitude)</label>
                <input id="create-lng" type="number" step="any" required value={createForm.longitude}
                  onChange={(e) => setCreateForm({ ...createForm, longitude: e.target.value })}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-body-md outline-none focus:border-secondary shadow-sm transition-all" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="create-radius" className="text-label-sm text-on-surface-variant font-bold uppercase tracking-tight">Bán kính cho phép (m)</label>
                <select id="create-radius" value={createForm.allowed_radius}
                  onChange={(e) => setCreateForm({ ...createForm, allowed_radius: Number(e.target.value) as 50 | 100 })}
                  className="w-full rounded-xl border border-outline-variant bg-white px-4 py-2.5 text-body-md outline-none focus:border-secondary shadow-sm transition-all">
                  <option value={50}>50 mét</option>
                  <option value={100}>100 mét</option>
                </select>
              </div>
            </div>
            
            <div className="pt-2">
              <p className="mb-2 text-label-sm text-on-surface-variant font-bold uppercase tracking-tight">Chọn vị trí trên bản đồ</p>
              <div className="rounded-2xl border-2 border-surface-container overflow-hidden shadow-inner">
                <MapPicker
                  initialLat={createForm.latitude ? parseFloat(createForm.latitude) : undefined}
                  initialLng={createForm.longitude ? parseFloat(createForm.longitude) : undefined}
                  onLocationPick={(lat, lng) => setCreateForm(prev => ({ ...prev, latitude: String(lat), longitude: String(lng) }))}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" disabled={saving}
                className="rounded-xl bg-secondary px-10 py-3 text-label-md font-bold text-white hover:bg-blue-700 shadow-lg shadow-secondary/20 disabled:opacity-50 transition-all active:scale-95">
                {saving ? "Đang xử lý..." : "Tạo địa điểm"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Locations Container */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <LoadingState message="Đang tải danh sách địa điểm..." />
        ) : locations.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-outline-variant/30">
            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">map</span>
            <p className="text-body-lg text-on-surface-variant font-medium">Chưa có địa điểm làm việc nào được cấu hình.</p>
          </div>
        ) : (
          locations.map((loc) => (
            <div key={loc.id} className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
              {editingId === loc.id ? (
                <div className="p-6 space-y-6 bg-secondary/5 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-label-sm text-secondary font-bold uppercase tracking-tight">Tên địa điểm</label>
                      <input type="text" value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full rounded-xl border border-outline-variant bg-white px-4 py-2.5 text-body-md outline-none focus:border-secondary shadow-sm transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-label-sm text-secondary font-bold uppercase tracking-tight">Vĩ độ</label>
                      <input type="number" step="any" value={editForm.latitude}
                        onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                        className="w-full rounded-xl border border-outline-variant bg-white px-4 py-2.5 text-body-md outline-none focus:border-secondary shadow-sm transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-label-sm text-secondary font-bold uppercase tracking-tight">Kinh độ</label>
                      <input type="number" step="any" value={editForm.longitude}
                        onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                        className="w-full rounded-xl border border-outline-variant bg-white px-4 py-2.5 text-body-md outline-none focus:border-secondary shadow-sm transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-label-sm text-secondary font-bold uppercase tracking-tight">Bán kính (m)</label>
                      <select value={editForm.allowed_radius}
                        onChange={(e) => setEditForm({ ...editForm, allowed_radius: Number(e.target.value) as 50 | 100 })}
                        className="w-full rounded-xl border border-outline-variant bg-white px-4 py-2.5 text-body-md outline-none focus:border-secondary shadow-sm transition-all">
                        <option value={50}>50 mét</option>
                        <option value={100}>100 mét</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="mb-2 text-label-sm text-secondary font-bold uppercase tracking-tight">Cập nhật vị trí trên bản đồ</p>
                    <div className="rounded-2xl border-2 border-secondary/10 overflow-hidden">
                      <MapPicker
                        initialLat={parseFloat(editForm.latitude)}
                        initialLng={parseFloat(editForm.longitude)}
                        onLocationPick={(lat, lng) => setEditForm(prev => ({ ...prev, latitude: String(lat), longitude: String(lng) }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button onClick={() => setEditingId(null)}
                      className="rounded-xl border border-outline-variant bg-white px-8 py-2.5 text-label-md font-bold text-on-surface-variant hover:bg-slate-50 transition-all">
                      Hủy bỏ
                    </button>
                    <button onClick={saveEdit} disabled={saving}
                      className="rounded-xl bg-secondary px-10 py-2.5 text-label-md font-bold text-white hover:bg-blue-700 shadow-lg shadow-secondary/20 disabled:opacity-50 transition-all active:scale-95">
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-secondary shadow-inner group-hover:bg-secondary group-hover:text-white transition-all duration-300">
                      <span className="material-symbols-outlined text-[28px]">apartment</span>
                    </div>
                    <div>
                      <h3 className="text-h3 text-on-surface font-bold group-hover:text-secondary transition-colors">{loc.name}</h3>
                      <div className="mt-1 flex gap-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span> {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}</span>
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">radar</span> {loc.allowed_radius}m</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(loc)}
                      className="p-3 rounded-xl text-secondary hover:bg-secondary/10 transition-colors"
                      title="Chỉnh sửa"
                    >
                      <span className="material-symbols-outlined">edit_square</span>
                    </button>
                    <button onClick={() => handleDelete(loc.id)}
                      className="p-3 rounded-xl text-error hover:bg-error/10 transition-colors"
                      title="Xóa địa điểm"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
