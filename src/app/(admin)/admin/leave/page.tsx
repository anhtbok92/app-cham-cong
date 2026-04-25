"use client";

import { useState, useEffect, useCallback } from "react";
import { LeaveRequest } from "@/lib/types";
import LoadingState from "@/components/LoadingState";

export default function LeavePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/leave");
      const data = await res.json();
      setRequests(data.leaveRequests ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected") => {
    const comment = prompt("Nhập lời nhắn cho nhân viên (không bắt buộc):") || "";
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/leave/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, comment }),
      });
      if (res.ok) {
        await fetchRequests();
      }
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">Đã duyệt</span>;
      case "rejected": return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">Từ chối</span>;
      default: return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">Đang chờ</span>;
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case "annual": return "Nghỉ phép năm";
      case "sick": return "Nghỉ ốm";
      case "unpaid": return "Nghỉ không lương";
      default: return "Nghỉ khác";
    }
  };

  return (
    <div className="space-y-6  animate-in fade-in duration-500">
      <div>
        <h1 className="font-h1 text-h1 text-on-surface">Phê duyệt nghỉ phép</h1>
        <p className="text-body-sm text-on-surface-variant">Xem và xử lý các yêu cầu nghỉ phép từ nhân viên</p>
      </div>

      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState message="Đang tải danh sách yêu cầu nghỉ phép..." />
        ) : requests.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant">Không có yêu cầu nghỉ phép nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Nhân viên</th>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Loại & Lý do</th>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase text-center">Thời gian</th>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase text-center">Trạng thái</th>
                  <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                          {req.profiles?.full_name?.charAt(0)}
                        </div>
                        <span className="text-body-md font-bold text-on-surface">{req.profiles?.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-body-sm font-bold text-on-surface">{getLeaveTypeLabel(req.leave_type)}</span>
                        <span className="text-[11px] text-slate-500 italic truncate max-w-[200px]">{req.reason || "Không có lý do"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-body-sm font-medium">
                        {new Date(req.start_date).toLocaleDateString("vi-VN")} - {new Date(req.end_date).toLocaleDateString("vi-VN")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleStatusUpdate(req.id, "approved")}
                            className="p-2 rounded-lg text-green-600 hover:bg-green-50"
                            title="Duyệt"
                          >
                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(req.id, "rejected")}
                            className="p-2 rounded-lg text-error hover:bg-error/5"
                            title="Từ chối"
                          >
                            <span className="material-symbols-outlined text-[20px]">cancel</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase italic">Đã xử lý</span>
                      )}
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
