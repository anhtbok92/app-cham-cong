"use client";

import { useState, useEffect } from "react";
import LoadingState from "@/components/LoadingState";

export default function LeaveRequestPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    leave_type: "annual",
    reason: ""
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const res = await fetch("/api/leave-requests");
    const data = await res.json();
    if (Array.isArray(data)) setRequests(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/leave-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ start_date: "", end_date: "", leave_type: "annual", reason: "" });
      fetchRequests();
    } else {
      alert("Lỗi khi gửi yêu cầu.");
    }
    setSaving(false);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-50 text-green-700 border-green-100";
      case "rejected": return "bg-red-50 text-red-700 border-red-100";
      default: return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    const types: any = { annual: "Nghỉ phép năm", sick: "Nghỉ ốm", unpaid: "Nghỉ không lương", other: "Khác" };
    return types[type] || type;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingState message="Đang tải dữ liệu nghỉ phép..." /></div>;

  return (
    <main className="px-margin-page py-6 space-y-6 max-w-md mx-auto pb-24 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-black text-on-surface leading-tight">Nghỉ phép</h1>
          <p className="text-[11px] font-bold text-on-surface-variant opacity-60 uppercase tracking-widest">Đăng ký và theo dõi đơn</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="w-12 h-12 rounded-[18px] bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[28px]">{showForm ? "close" : "add"}</span>
        </button>
      </div>

      {showForm && (
        <section className="bg-white p-6 rounded-[28px] shadow-xl shadow-slate-200/50 border border-slate-50 animate-in zoom-in-95 duration-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Từ ngày</label>
                <input 
                  type="date" 
                  required 
                  value={form.start_date}
                  onChange={e => setForm({...form, start_date: e.target.value})}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-[14px] font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Đến ngày</label>
                <input 
                  type="date" 
                  required 
                  value={form.end_date}
                  onChange={e => setForm({...form, end_date: e.target.value})}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-[14px] font-bold outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Loại nghỉ phép</label>
              <select 
                value={form.leave_type}
                onChange={e => setForm({...form, leave_type: e.target.value})}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-[14px] font-bold outline-none focus:border-primary transition-all bg-white"
              >
                <option value="annual">Nghỉ phép năm</option>
                <option value="sick">Nghỉ ốm</option>
                <option value="unpaid">Nghỉ không lương</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lý do</label>
              <textarea 
                placeholder="Nhập lý do xin nghỉ..."
                value={form.reason}
                onChange={e => setForm({...form, reason: e.target.value})}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-[14px] font-bold outline-none focus:border-primary transition-all min-h-[100px]"
              />
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full py-4 bg-primary text-white rounded-2xl text-[14px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {saving ? "Đang gửi..." : "Gửi yêu cầu xin nghỉ"}
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>
        </section>
      )}

      {/* Requests History */}
      <section className="space-y-4">
        <h2 className="text-[14px] font-black uppercase tracking-widest text-on-surface opacity-50 px-1">Lịch sử yêu cầu</h2>
        
        {requests.length === 0 ? (
          <div className="bg-white p-12 rounded-[28px] text-center border-2 border-dashed border-slate-100 flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-slate-200">event_note</span>
            <p className="text-body-sm font-bold text-slate-400 uppercase tracking-widest">Chưa có yêu cầu nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-50 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                    </div>
                    <div>
                      <p className="text-[14px] font-black text-on-surface">{getLeaveTypeLabel(req.leave_type)}</p>
                      <p className="text-[11px] font-bold text-slate-400">
                        {new Date(req.start_date).toLocaleDateString("vi-VN")} - {new Date(req.end_date).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(req.status)}`}>
                    {req.status === "pending" ? "Chờ duyệt" : req.status === "approved" ? "Đã duyệt" : "Từ chối"}
                  </span>
                </div>
                {req.reason && (
                  <p className="text-[12px] text-on-surface-variant italic opacity-70 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{req.reason}"
                  </p>
                )}
                {req.comment && (
                  <div className="flex items-start gap-2 pt-2 border-t border-slate-50">
                    <span className="material-symbols-outlined text-[16px] text-primary">reply</span>
                    <p className="text-[11px] font-bold text-primary">Phản hồi: {req.comment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
