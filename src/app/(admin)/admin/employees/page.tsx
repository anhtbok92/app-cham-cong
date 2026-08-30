"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, OfficeLocation, Department, JobPosition } from "@/lib/types";
import LoadingState from "@/components/LoadingState";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allPositions, setAllPositions] = useState<JobPosition[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [addForm, setAddForm] = useState({
    email: "",
    password: "",
    full_name: "",
    date_of_birth: "",
    position: "",
    address: "",
    phone_number: "",
    office_location_id: "",
    department_id: "",
    job_position_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const [locRes, deptRes, posRes] = await Promise.all([
      supabase.from("office_locations").select("*"),
      fetch("/api/admin/departments").then(r => r.json()),
      fetch("/api/admin/job-positions").then(r => r.json())
    ]);
    setLocations((locRes.data as OfficeLocation[]) ?? []);
    setDepartments(deptRes.departments ?? []);
    setAllPositions(posRes.jobPositions ?? []);
  }, [supabase]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/employees?${params}`);
      const data = await res.json();
      setEmployees(data.employees ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      setShowAddModal(false);
      setAddForm({
        email: "", password: "", full_name: "", date_of_birth: "",
        position: "", address: "", phone_number: "", office_location_id: "",
        department_id: "", job_position_id: ""
      });
      await fetchEmployees();
    } catch (err) {
      setError("Đã xảy ra lỗi khi tạo nhân viên.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (emp: Profile) => {
    setEditingId(emp.id);
    setEditForm({ ...emp });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/employees/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingId(null);
        await fetchEmployees();
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (emp: Profile) => {
    await fetch(`/api/admin/employees/${emp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !emp.is_active }),
    });
    await fetchEmployees();
  };

  const filteredPositionsAdd = allPositions.filter(p => p.department_id === addForm.department_id);
  const filteredPositionsEdit = allPositions.filter(p => p.department_id === editForm.department_id);

  return (
    <div className="space-y-6  animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface">Quản lý nhân sự</h1>
          <p className="text-body-sm text-on-surface-variant">Thêm, sửa và quản lý thông tin nhân viên trong hệ thống</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-xl bg-secondary px-6 py-2.5 text-label-md font-bold text-white hover:bg-blue-700 shadow-lg shadow-secondary/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Thêm nhân viên
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-outline-variant shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1 group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-colors">search</span>
            <input
              type="text"
              placeholder="Tìm theo tên, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-10 pr-4 py-2 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all"
            />
          </div>
          <button type="submit" className="rounded-lg bg-surface-container px-8 py-2 text-label-md font-bold text-on-surface hover:bg-slate-200 transition-colors">Tìm kiếm</button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState message="Đang tải danh sách nhân viên..." />
        ) : employees.length === 0 ? (
          <div className="py-20 text-center">Không tìm thấy nhân viên nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Nhân viên</th>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Phòng ban & Vị trí</th>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-center">Trạng thái</th>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                    {editingId === emp.id ? (
                      <td colSpan={4} className="p-6 bg-secondary/5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <div className="space-y-1.5">
                            <label className="text-label-sm text-secondary font-bold uppercase tracking-tight">Họ tên</label>
                            <input type="text" value={editForm.full_name ?? ""} onChange={(e) => setEditForm({...editForm, full_name: e.target.value})} className="w-full rounded-lg border border-outline-variant px-3 py-2 text-body-md outline-none focus:border-secondary shadow-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-label-sm text-secondary font-bold uppercase tracking-tight">Phòng ban</label>
                            <select value={editForm.department_id ?? ""} onChange={(e) => setEditForm({...editForm, department_id: e.target.value, job_position_id: ""})} className="w-full rounded-lg border border-outline-variant px-3 py-2 text-body-md outline-none focus:border-secondary shadow-sm bg-white">
                              <option value="">Chọn phòng ban</option>
                              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-label-sm text-secondary font-bold uppercase tracking-tight">Vị trí</label>
                            <select value={editForm.job_position_id ?? ""} onChange={(e) => setEditForm({...editForm, job_position_id: e.target.value})} className="w-full rounded-lg border border-outline-variant px-3 py-2 text-body-md outline-none focus:border-secondary shadow-sm bg-white">
                              <option value="">Chọn vị trí</option>
                              {filteredPositionsEdit.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-label-sm text-secondary font-bold uppercase tracking-tight">Email</label>
                            <input type="email" value={editForm.email ?? ""} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full rounded-lg border border-outline-variant px-3 py-2 text-body-md outline-none focus:border-secondary shadow-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-label-sm text-secondary font-bold uppercase tracking-tight">Số điện thoại</label>
                            <input type="text" value={editForm.phone_number ?? ""} onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})} className="w-full rounded-lg border border-outline-variant px-3 py-2 text-body-md outline-none focus:border-secondary shadow-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-label-sm text-secondary font-bold uppercase tracking-tight">Địa điểm</label>
                            <select value={editForm.office_location_id ?? ""} onChange={(e) => setEditForm({...editForm, office_location_id: e.target.value})} className="w-full rounded-lg border border-outline-variant px-3 py-2 text-body-md outline-none focus:border-secondary shadow-sm bg-white">
                              <option value="">Chưa gán</option>
                              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3">
                          <button onClick={() => setEditingId(null)} className="rounded-lg bg-white border border-outline-variant px-6 py-2 text-label-md font-bold text-on-surface-variant hover:bg-slate-50">Hủy</button>
                          <button onClick={saveEdit} disabled={saving} className="rounded-lg bg-secondary px-8 py-2 text-label-md font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                            {saving ? "Đang lưu..." : "Lưu thay đổi"}
                          </button>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-primary shadow-sm">{emp.full_name?.charAt(0)}</div>
                            <div className="flex flex-col">
                              <span className="text-body-md font-bold text-on-surface">{emp.full_name}</span>
                              <span className="text-[11px] text-on-surface-variant font-medium">{emp.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-body-sm font-semibold text-on-surface">{emp.job_positions?.name || "Chưa gán vị trí"}</span>
                            <span className="text-[11px] text-on-surface-variant">{emp.departments?.name || "Chưa gán phòng ban"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => toggleActive(emp)} className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${emp.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {emp.is_active ? "Hoạt động" : "Vô hiệu"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-1">
                            <button onClick={() => startEdit(emp)} className="p-2 rounded-lg text-secondary hover:bg-secondary/10"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                            <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"><span className="material-symbols-outlined text-[20px]">visibility</span></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-outline-variant overflow-hidden animate-in zoom-in-95">
            <div className="bg-primary-container px-6 py-4 text-white">
              <h2 className="text-h2 font-bold">Thêm nhân viên mới</h2>
              <p className="text-[11px] opacity-70">Khởi tạo hồ sơ nhân sự mới</p>
            </div>
            <div className="p-6">
              {error && <div className="mb-4 bg-error-container p-3 rounded-lg text-error text-sm font-bold">{error}</div>}
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-label-sm font-bold uppercase">Họ và tên *</label>
                    <input type="text" required value={addForm.full_name} onChange={e => setAddForm({...addForm, full_name: e.target.value})} className="w-full rounded-lg border border-outline-variant px-4 py-2 text-body-md" placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-sm font-bold uppercase">Email *</label>
                    <input type="email" required value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} className="w-full rounded-lg border border-outline-variant px-4 py-2 text-body-md" placeholder="email@congty.com" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-sm font-bold uppercase">Phòng ban *</label>
                    <select required value={addForm.department_id} onChange={e => setAddForm({...addForm, department_id: e.target.value, job_position_id: ""})} className="w-full rounded-lg border border-outline-variant px-4 py-2 text-body-md bg-white">
                      <option value="">Chọn phòng ban</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-sm font-bold uppercase">Vị trí *</label>
                    <select required value={addForm.job_position_id} onChange={e => setAddForm({...addForm, job_position_id: e.target.value})} className="w-full rounded-lg border border-outline-variant px-4 py-2 text-body-md bg-white">
                      <option value="">Chọn vị trí</option>
                      {filteredPositionsAdd.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-sm font-bold uppercase">Mật khẩu *</label>
                    <input type="password" required value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} className="w-full rounded-lg border border-outline-variant px-4 py-2 text-body-md" placeholder="••••••••" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-sm font-bold uppercase">Số điện thoại</label>
                    <input type="text" value={addForm.phone_number} onChange={e => setAddForm({...addForm, phone_number: e.target.value})} className="w-full rounded-lg border border-outline-variant px-4 py-2 text-body-md" placeholder="090..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-sm font-bold uppercase">Địa điểm chấm công</label>
                    <select value={addForm.office_location_id} onChange={e => setAddForm({...addForm, office_location_id: e.target.value})} className="w-full rounded-lg border border-outline-variant px-4 py-2 text-body-md bg-white">
                      <option value="">Chưa gán</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setShowAddModal(false)} className="rounded-lg border px-6 py-2">Hủy</button>
                  <button type="submit" disabled={saving} className="rounded-lg bg-secondary px-10 py-2 text-white font-bold disabled:opacity-50">Tạo nhân viên</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
