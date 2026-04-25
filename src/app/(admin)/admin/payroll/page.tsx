"use client";

import { useEffect, useState } from "react";
import LoadingState from "@/components/LoadingState";

export default function AdminPayrollPage() {
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [payroll, setPayroll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPayroll();
  }, [month]);

  const fetchPayroll = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/payroll?month=${month}`);
    const data = await res.json();
    if (Array.isArray(data)) setPayroll(data);
    setLoading(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val);
  };

  const parseCurrency = (str: string) => {
    return parseFloat(str.replace(/\./g, '')) || 0;
  };

  const handleUpdate = (id: string, field: string, value: string) => {
    const numValue = field === "work_days" ? parseFloat(value) || 0 : parseCurrency(value);
    setPayroll(prev => prev.map(p => {
      if (p.employee_id === id) {
        const updated = { ...p, [field]: numValue };
        // Recalculate total
        updated.total_salary = (updated.base_salary / updated.standard_days * updated.work_days) + 
                               updated.allowance + updated.bonus + updated.commission;
        return updated;
      }
      return p;
    }));
  };

  const savePayroll = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, salaries: payroll }),
    });
    if (res.ok) alert("Đã lưu bảng lương!");
    setSaving(false);
  };

  const exportPaySlip = (p: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Phiếu lương - ${p.full_name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Manrope', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: 800; color: #2563eb; text-transform: uppercase; margin: 0; }
            .title { font-size: 20px; font-weight: 800; margin: 10px 0; color: #0f172a; }
            .month { color: #64748b; font-weight: 700; font-size: 14px; text-transform: uppercase; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; background: #f8fafc; padding: 20px; rounded: 16px; border-radius: 16px; }
            .info-item { display: flex; flex-direction: column; }
            .label { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
            .value { font-size: 14px; font-weight: 700; color: #1e293b; }
            .table { w-full; border-collapse: collapse; margin-bottom: 40px; width: 100%; }
            .table th { text-align: left; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; padding: 12px; border-bottom: 1px solid #e2e8f0; }
            .table td { padding: 12px; font-size: 14px; border-bottom: 1px solid #f1f5f9; font-weight: 600; }
            .amount { text-align: right; }
            .total-row { background: #eff6ff; font-weight: 800 !important; color: #2563eb; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
            .sign { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; text-align: center; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="company-name">HỆ THỐNG CHẤM CÔNG</h1>
            <div class="title">PHIẾU LƯƠNG NHÂN VIÊN</div>
            <div class="month">Tháng ${month}</div>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Nhân viên</span>
              <span class="value">${p.full_name}</span>
            </div>
            <div class="info-item">
              <span class="label">Phòng ban</span>
              <span class="value">${p.department}</span>
            </div>
            <div class="info-item">
              <span class="label">Vị trí</span>
              <span class="value">${p.position || 'Nhân viên'}</span>
            </div>
            <div class="info-item">
              <span class="label">Ngày công</span>
              <span class="value">${p.work_days} / ${p.standard_days} ngày</span>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Nội dung</th>
                <th class="amount">Số tiền (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Lương cơ bản thực tế</td>
                <td class="amount">${(p.base_salary / p.standard_days * p.work_days).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Phụ cấp / Trợ cấp</td>
                <td class="amount">${p.allowance.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Thưởng thành tích</td>
                <td class="amount">${p.bonus.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Hoa hồng dịch vụ</td>
                <td class="amount">${p.commission.toLocaleString()}</td>
              </tr>
              <tr class="total-row">
                <td>TỔNG CỘNG (THỰC NHẬN)</td>
                <td class="amount">${p.total_salary.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="sign">
            <div>
              <p class="label">Phòng nhân sự</p>
              <p style="margin-top: 60px; font-weight: 700;">(Ký tên)</p>
            </div>
            <div>
              <p class="label">Người nhận lương</p>
              <p style="margin-top: 60px; font-weight: 700;">(Ký tên)</p>
            </div>
          </div>

          <div class="footer">
            <p>Phiếu lương được trích xuất từ hệ thống quản lý nhân sự điện tử.</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingState message="Đang tổng hợp dữ liệu lương..." /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-[24px] font-black text-on-surface">Tính lương</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Quản lý thu nhập nhân viên</p>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="month" 
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 font-bold text-sm outline-none focus:border-primary transition-all"
          />
          <button 
            onClick={savePayroll}
            disabled={saving}
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-black text-[12px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
          >
            {saving ? "Đang lưu..." : "Lưu bảng lương"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhân viên</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Ngày công</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lương CB</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trợ cấp</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thưởng</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hoa hồng</th>
                <th className="px-6 py-4 text-[10px] font-black text-primary uppercase tracking-widest">Tổng nhận</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payroll.map((p) => (
                <tr key={p.employee_id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-on-surface text-[14px]">{p.full_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{p.department}</p>
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="number" 
                      value={p.work_days}
                      onChange={(e) => handleUpdate(p.employee_id, "work_days", e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 font-black text-[13px] outline-none focus:border-primary"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="text" 
                      value={formatCurrency(p.base_salary)}
                      onChange={(e) => handleUpdate(p.employee_id, "base_salary", e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 font-bold text-[13px] outline-none focus:border-primary"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="text" 
                      value={formatCurrency(p.allowance)}
                      onChange={(e) => handleUpdate(p.employee_id, "allowance", e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 font-bold text-[13px] outline-none focus:border-primary text-emerald-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="text" 
                      value={formatCurrency(p.bonus)}
                      onChange={(e) => handleUpdate(p.employee_id, "bonus", e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 font-bold text-[13px] outline-none focus:border-primary text-amber-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="text" 
                      value={formatCurrency(p.commission)}
                      onChange={(e) => handleUpdate(p.employee_id, "commission", e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 font-bold text-[13px] outline-none focus:border-primary text-blue-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-primary text-[15px]">{p.total_salary.toLocaleString()}đ</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => exportPaySlip(p)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      Tải PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
