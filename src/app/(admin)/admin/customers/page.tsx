"use client";

import { useState, useEffect, useCallback } from "react";
import type { Customer } from "@/lib/types";
import LoadingState from "@/components/LoadingState";

const KET_QUA_COLORS: Record<string, string> = {
  "Đã làm dịch vụ": "bg-green-100 text-green-700",
  "Đến": "bg-blue-100 text-blue-700",
  "Đã đặt lịch": "bg-yellow-100 text-yellow-700",
  "Hủy lịch": "bg-red-100 text-red-700",
  "Failed": "bg-red-100 text-red-700",
  "Cơ sở từ chối": "bg-orange-100 text-orange-700",
  "Đã cọc": "bg-purple-100 text-purple-700",
  "Phẫu thuật": "bg-emerald-100 text-emerald-700",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  booking: "Booking",
  treatment: "Điều trị",
  surgery: "Phẫu thuật",
};

const SOURCE_TYPE_COLORS: Record<string, string> = {
  treatment: "bg-teal-100 text-teal-700",
  booking: "bg-indigo-100 text-indigo-700",
  surgery: "bg-rose-100 text-rose-700",
};

const KET_QUA_OPTIONS = [
  "Đã làm dịch vụ", "Đến", "Đã đặt lịch", "Hủy lịch",
  "Failed", "Cơ sở từ chối", "Đã cọc", "Phẫu thuật",
];

interface Filters {
  tenKh: string;
  soDienThoai: string;
  sourceType: string;
  ketQua: string;
  bacSi: string;
  dichVu: string;
  coSo: string;
  dateFrom: string;
  dateTo: string;
  excludeDateFrom: string;
  excludeDateTo: string;
}

const emptyFilters: Filters = {
  tenKh: "", soDienThoai: "", sourceType: "", ketQua: "",
  bacSi: "", dichVu: "", coSo: "",
  dateFrom: "", dateTo: "", excludeDateFrom: "", excludeDateTo: "",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pageSize = 20;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      const keys: (keyof Filters)[] = [
        "tenKh", "soDienThoai", "sourceType", "ketQua", "bacSi", "dichVu", "coSo",
        "dateFrom", "dateTo", "excludeDateFrom", "excludeDateTo",
      ];
      for (const k of keys) {
        if (filters[k]) params.set(k, filters[k]);
      }
      const res = await fetch(`/api/admin/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const applyFilters = (e: React.FormEvent) => { e.preventDefault(); setPage(1); setFilters({ ...draft }); };
  const clearFilters = () => { setDraft(emptyFilters); setFilters(emptyFilters); setPage(1); };
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleSeed = async () => {
    if (!confirm("Import dữ liệu khách hàng từ file CSV? Dữ liệu cũ sẽ bị xóa.")) return;
    setSeeding(true); setSeedResult(null);
    try {
      const res = await fetch("/api/admin/customers/seed", { method: "POST" });
      const data = await res.json();
      setSeedResult(data.message); await fetchCustomers();
    } catch { setSeedResult("Lỗi khi import dữ liệu"); }
    finally { setSeeding(false); }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface">Khách hàng CK</h1>
          <p className="text-body-sm text-on-surface-variant">
            Danh sách khách hàng cũ được import từ các file CSV ({total} khách hàng)
          </p>
        </div>
        <button onClick={handleSeed} disabled={seeding}
          className="rounded-xl bg-secondary px-6 py-2.5 text-label-md font-bold text-white hover:bg-blue-700 shadow-lg shadow-secondary/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50">
          <span className="material-symbols-outlined text-[20px]">{seeding ? "hourglass_empty" : "upload_file"}</span>
          {seeding ? "Đang import..." : "Import CSV"}
        </button>
      </div>

      {seedResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 text-body-sm font-medium">{seedResult}</div>
      )}

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl border border-outline-variant shadow-sm">
        <form onSubmit={applyFilters} className="space-y-4">
          {/* Row 1: Basic filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <FilterInput icon="person" label="Tên khách hàng" placeholder="Nhập tên..."
              value={draft.tenKh} onChange={(v) => setDraft({ ...draft, tenKh: v })} />
            <FilterInput icon="call" label="Số điện thoại" placeholder="Nhập SĐT..."
              value={draft.soDienThoai} onChange={(v) => setDraft({ ...draft, soDienThoai: v })} />
            <FilterInput icon="medical_services" label="Bác sĩ" placeholder="Tên bác sĩ..."
              value={draft.bacSi} onChange={(v) => setDraft({ ...draft, bacSi: v })} />
            <FilterInput icon="spa" label="Dịch vụ" placeholder="Tên dịch vụ..."
              value={draft.dichVu} onChange={(v) => setDraft({ ...draft, dichVu: v })} />
          </div>

          {/* Row 2: Dropdowns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <FilterSelect label="Cơ sở" value={draft.coSo} onChange={(v) => setDraft({ ...draft, coSo: v })}
              options={[{ value: "", label: "Tất cả cơ sở" }, { value: "HN", label: "Hà Nội" }, { value: "HCM", label: "Hồ Chí Minh" }]} />
            <FilterSelect label="Loại" value={draft.sourceType} onChange={(v) => setDraft({ ...draft, sourceType: v })}
              options={[{ value: "", label: "Tất cả loại" }, { value: "treatment", label: "Điều trị" }, { value: "booking", label: "Booking" }, { value: "surgery", label: "Phẫu thuật" }]} />
            <FilterSelect label="Kết quả" value={draft.ketQua} onChange={(v) => setDraft({ ...draft, ketQua: v })}
              options={[{ value: "", label: "Tất cả kết quả" }, ...KET_QUA_OPTIONS.map((k) => ({ value: k, label: k }))]} />
            <div className="flex items-end gap-2">
              <button type="submit"
                className="flex-1 rounded-lg bg-secondary px-4 py-2 text-label-md font-bold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">filter_alt</span> Lọc
              </button>
              {activeFilterCount > 0 && (
                <button type="button" onClick={clearFilters}
                  className="rounded-lg border border-outline-variant px-3 py-2 text-label-md font-bold text-on-surface-variant hover:bg-slate-50 transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">close</span> Xóa ({activeFilterCount})
                </button>
              )}
            </div>
          </div>

          {/* Row 3: Date range filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-outline-variant">
            {/* Inclusive date range */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-green-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">date_range</span>
                Điều trị trong khoảng thời gian
              </label>
              <div className="flex gap-2 items-center">
                <input type="date" value={draft.dateFrom} onChange={(e) => setDraft({ ...draft, dateFrom: e.target.value })}
                  className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-body-sm bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none" />
                <span className="text-[11px] text-slate-400 font-bold">→</span>
                <input type="date" value={draft.dateTo} onChange={(e) => setDraft({ ...draft, dateTo: e.target.value })}
                  className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-body-sm bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none" />
              </div>
            </div>

            {/* Exclusive date range */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-red-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">event_busy</span>
                Không điều trị trong khoảng thời gian
              </label>
              <div className="flex gap-2 items-center">
                <input type="date" value={draft.excludeDateFrom} onChange={(e) => setDraft({ ...draft, excludeDateFrom: e.target.value })}
                  className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-body-sm bg-white focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none" />
                <span className="text-[11px] text-slate-400 font-bold">→</span>
                <input type="date" value={draft.excludeDateTo} onChange={(e) => setDraft({ ...draft, excludeDateTo: e.target.value })}
                  className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-body-sm bg-white focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none" />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState message="Đang tải danh sách khách hàng..." />
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] mb-2 block opacity-30">people</span>
            <p>Chưa có dữ liệu khách hàng. Nhấn &quot;Import CSV&quot; để bắt đầu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider w-8"></th>
                  <th className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Khách hàng</th>
                  <th className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Dịch vụ</th>
                  <th className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Bác sĩ</th>
                  <th className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Kết quả</th>
                  <th className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Loại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {customers.map((c) => (
                  <>
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                      <td className="px-4 py-3">
                        <span className="material-symbols-outlined text-[18px] text-slate-400 transition-transform"
                          style={{ transform: expandedId === c.id ? "rotate(90deg)" : "" }}>chevron_right</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-primary text-sm shadow-sm">
                            {c.ten_kh?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div className="text-body-sm font-bold text-on-surface">{c.ten_kh}</div>
                            <div className="text-[11px] text-on-surface-variant">{c.so_dien_thoai || "N/A"} · {c.dia_chi || "N/A"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-body-sm text-on-surface">{c.dich_vu_chinh || "-"}</div>
                        {c.dich_vu_phat_sinh && <div className="text-[11px] text-on-surface-variant">+ {c.dich_vu_phat_sinh}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-body-sm text-on-surface truncate max-w-[200px]">{c.bac_si_mkt || c.bac_si || "-"}</div>
                        <div className="text-[11px] text-on-surface-variant truncate max-w-[200px]">{c.chi_nhanh || ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        {c.ket_qua ? (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${KET_QUA_COLORS[c.ket_qua] || "bg-slate-100 text-slate-600"}`}>
                            {c.ket_qua}
                          </span>
                        ) : <span className="text-slate-400 text-[11px]">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SOURCE_TYPE_COLORS[c.source_type] || "bg-slate-100 text-slate-600"}`}>
                          {SOURCE_TYPE_LABELS[c.source_type] || c.source_type}
                        </span>
                      </td>
                    </tr>
                    {expandedId === c.id && (
                      <tr key={`${c.id}-detail`}>
                        <td colSpan={6} className="px-6 py-4 bg-slate-50/80">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-body-sm">
                            <DetailField label="Họ tên đầy đủ" value={c.ho_ten_day_du} />
                            <DetailField label="Tuổi" value={c.tuoi} />
                            <DetailField label="Nghề nghiệp" value={c.nghe_nghiep || c.phan_loai_nghe_nghiep} />
                            <DetailField label="Ngày thực hiện" value={c.ngay_gio_thuc_hien} />
                            <DetailField label="Bác sĩ MKT" value={c.bac_si_mkt || c.bac_si} />
                            <DetailField label="Team" value={c.team} />
                            <DetailField label="Báo giá" value={c.bao_gia} />
                            <DetailField label="Doanh thu" value={c.doanh_thu} />
                            <DetailField label="Nợ" value={c.no} />
                            <DetailField label="Cách di chuyển" value={c.cach_di_chuyen} />
                            <DetailField label="Lễ tân" value={c.le_tan} />
                            <DetailField label="Nguồn" value={c.nguon} />
                            {c.source_type === "treatment" && (
                              <>
                                <DetailField label="Tổng số buổi" value={c.tong_so_buoi} />
                                <DetailField label="Phác đồ" value={c.phac_do_dieu_tri} />
                                <DetailField label="Thuốc" value={c.thuoc_dieu_tri} />
                                <DetailField label="Máy công nghệ" value={c.may_cong_nghe_cao} />
                                <DetailField label="Liệu trình" value={c.lieu_trinh_dieu_tri} />
                                <DetailField label="Kỹ thuật viên" value={c.ky_thuat_vien} />
                              </>
                            )}
                            {c.ghi_chu_telesale && (
                              <div className="md:col-span-3"><DetailField label="Ghi chú Telesale" value={c.ghi_chu_telesale} /></div>
                            )}
                            {c.ghi_chu_co_so && (
                              <div className="md:col-span-3"><DetailField label="Ghi chú cơ sở" value={c.ghi_chu_co_so} /></div>
                            )}
                            {c.tinh_trang_truoc_dieu_tri && (
                              <div className="md:col-span-3"><DetailField label="Tình trạng trước điều trị" value={c.tinh_trang_truoc_dieu_tri} /></div>
                            )}
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-200 text-[10px] text-slate-400">File: {c.source_file}</div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-body-sm text-on-surface-variant">Trang {page}/{totalPages} · {total} khách hàng</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="rounded-lg border border-outline-variant px-4 py-2 text-label-md font-bold disabled:opacity-30 hover:bg-slate-50">Trước</button>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              className="rounded-lg border border-outline-variant px-4 py-2 text-label-md font-bold disabled:opacity-30 hover:bg-slate-50">Sau</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterInput({ icon, label, placeholder, value, onChange }: {
  icon: string; label: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <div className="relative group">
        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">{icon}</span>
        <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-9 pr-3 py-2 text-body-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all" />
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-outline-variant px-3 py-2 text-body-sm bg-white focus:border-secondary focus:ring-1 focus:ring-secondary outline-none">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</div>
      <div className="text-body-sm text-on-surface whitespace-pre-wrap break-words">{value}</div>
    </div>
  );
}
