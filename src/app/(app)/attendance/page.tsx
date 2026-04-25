"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import LoadingState from "@/components/LoadingState";
import { 
  getAttendanceState, 
  getAvailableActions, 
  AttendanceRecord 
} from "@/lib/attendance/state-machine";

export default function AttendancePage() {
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [address, setAddress] = useState<string>("Đang xác định vị trí...");

  const supabase = createClient();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Watch location
  useEffect(() => {
    if (!navigator.geolocation) {
      setAddress("Trình duyệt không hỗ trợ định vị");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        // Reverse geocoding (Optional, using Nominatim for free)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await res.json();
          setAddress(data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } catch {
          setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
      },
      (err) => {
        setAddress("Không thể truy cập vị trí. Vui lòng bật GPS.");
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedRes, attRes] = await Promise.all([
        fetch("/api/attendance/today-schedule"),
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) return null;
          const today = new Date().toISOString().split("T")[0];
          return supabase
            .from("attendance_records")
            .select("*")
            .eq("employee_id", session.user.id)
            .eq("date", today)
            .order("check_in_time", { ascending: false })
            .limit(1)
            .maybeSingle();
        })
      ]);

      const schedData = await schedRes.json();
      setScheduleData(schedData);
      
      if (attRes?.data) {
        setRecord(attRes.data as AttendanceRecord);
      } else {
        setRecord(null);
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAttendance = async () => {
    if (!location) {
      setMessage({ text: "Vui lòng đợi hệ thống xác định vị trí của bạn.", type: 'error' });
      return;
    }

    const state = getAttendanceState(record);
    const actions = getAvailableActions(state);
    if (actions.length === 0) return;
    
    const action = actions[0];
    setActionLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/attendance/${action.replace("_", "-")}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Đã xảy ra lỗi");
      }

      setMessage({ 
        text: action === "check_in" ? "Check-in thành công! Chúc bạn một ngày làm việc hiệu quả." : "Check-out thành công! Hẹn gặp lại bạn.",
        type: 'success'
      });
      fetchData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest"><LoadingState message="Đang chuẩn bị dữ liệu chấm công..." /></div>;

  const state = getAttendanceState(record);
  const isCheckedIn = state === "checked_in";
  const shift = scheduleData?.schedule?.work_shifts;
  const office = scheduleData?.profile?.office_locations;
  
  const timeString = currentTime.toLocaleTimeString("vi-VN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateString = currentTime.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <main className="px-margin-page pt-stack-gap space-y-6 max-w-md mx-auto pb-24">
      {/* Date and Time Card */}
      <section className="text-center mt-4">
        <p className="font-label-caps text-label-caps text-on-surface-variant mb-1 uppercase tracking-widest opacity-70">
          {dateString}
        </p>
        <h2 className="font-display-time text-[56px] leading-none text-primary tabular-nums font-black tracking-tighter">
          {timeString}
        </h2>
      </section>

      {/* Shift Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary font-bold text-label-md">
          <span className="material-symbols-outlined text-[18px]">schedule</span>
          {shift?.name || "Chưa có ca làm việc"}
        </div>
      </div>

      {/* Main Action Button */}
      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative">
          {/* Pulsing Effects */}
          {!actionLoading && (
            <>
              <div className="absolute inset-0 rounded-full bg-primary/10 scale-125 animate-pulse duration-[2000ms]"></div>
              <div className="absolute inset-0 rounded-full bg-primary/5 scale-150 animate-pulse duration-[3000ms]"></div>
            </>
          )}
          
          <button
            onClick={handleAttendance}
            disabled={actionLoading || !shift}
            className={`relative w-52 h-52 rounded-full flex flex-col items-center justify-center text-white shadow-2xl active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:grayscale disabled:scale-90 ${
              isCheckedIn ? "bg-red-500 shadow-red-200" : "bg-primary shadow-blue-200"
            }`}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-transparent"></div>
            <span className="material-symbols-outlined text-6xl mb-1 drop-shadow-md" style={{ fontVariationSettings: "'FILL' 1" }}>
              fingerprint
            </span>
            <p className="font-label-caps text-[10px] uppercase tracking-[0.2em] text-white/80 font-black mb-1">
              {actionLoading ? "ĐANG XỬ LÝ..." : "CHẤM CÔNG"}
            </p>
            <p className="text-2xl font-black uppercase tracking-tight">
              {isCheckedIn ? "GIỜ RA" : "GIỜ VÀO"}
            </p>
          </button>
        </div>
        
        {message && (
          <div className={`mt-8 animate-in slide-in-from-bottom-4 duration-500 max-w-xs text-center p-3 rounded-2xl border flex items-center gap-3 ${
            message.type === 'error' 
              ? "bg-red-50 border-red-100 text-red-700" 
              : "bg-green-50 border-green-100 text-green-700"
          }`}>
            <span className="material-symbols-outlined text-[20px] shrink-0">
              {message.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <p className="text-body-sm font-bold leading-tight">{message.text}</p>
          </div>
        )}
      </div>

      {/* Location Status Card */}
      <div className="bg-white border border-outline-variant rounded-2xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-2xl shrink-0 ${location ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"} transition-colors`}>
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {location ? "location_on" : "location_searching"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-body-sm font-black mb-0.5 ${location ? "text-green-700" : "text-amber-700"}`}>
              {location ? "Vị trí hiện tại của bạn" : "Đang tìm tín hiệu GPS..."}
            </h3>
            <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-2 font-medium opacity-80">
              {address}
            </p>
            {office && (
              <div className="mt-2 pt-2 border-t border-slate-50 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-primary">apartment</span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Địa điểm: {office.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Work Info Section */}
      <section className="space-y-3 pt-2">
        <h3 className="text-[13px] font-black uppercase tracking-widest text-on-surface-variant px-1 opacity-60">Ca làm việc của bạn</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Giờ làm việc</span>
            <p className="font-black text-on-surface text-lg">{shift ? `${shift.start_time.substring(0, 5)} - ${shift.end_time.substring(0, 5)}` : "--:--"}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Nghỉ trưa</span>
            <p className="font-black text-on-surface text-lg">12:00 - 13:30</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCheckedIn ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
              <span className="material-symbols-outlined">{isCheckedIn ? "work" : "pending_actions"}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Trạng thái hiện tại</p>
              <p className="font-black text-on-surface text-sm">
                {isCheckedIn ? "Đang trong ca làm việc" : "Chưa ghi nhận giờ vào"}
              </p>
            </div>
          </div>
          <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider ${
            isCheckedIn 
              ? "bg-green-100 text-green-700" 
              : "bg-amber-100 text-amber-700"
          }`}>
            {isCheckedIn ? "Working" : "Available"}
          </span>
        </div>
      </section>
    </main>
  );
}
