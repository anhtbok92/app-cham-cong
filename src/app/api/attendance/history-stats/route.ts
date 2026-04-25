import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // YYYY-MM
  const week = searchParams.get("week"); // YYYY-Www
  const year = searchParams.get("year"); // YYYY

  let startDate: string, endDate: string;

  if (year && !month && !week) {
    startDate = `${year}-01-01`;
    endDate = `${year}-12-31`;
  } else if (week) {
    // Basic week range handling
    const [y, w] = week.split("-W");
    const firstDayOfYear = new Date(parseInt(y), 0, 1);
    const days = (parseInt(w) - 1) * 7;
    const start = new Date(firstDayOfYear.setDate(firstDayOfYear.getDate() + days));
    startDate = start.toISOString().split("T")[0];
    const end = new Date(start.setDate(start.getDate() + 6));
    endDate = end.toISOString().split("T")[0];
  } else {
    const targetDate = month ? new Date(`${month}-01`) : new Date();
    startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString().split("T")[0];
    endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).toISOString().split("T")[0];
  }

  // Fetch all necessary data
  const [attendanceRes, holidaysRes, leaveRes, settingsRes, scheduleRes] = await Promise.all([
    supabase.from("attendance_records").select("*").eq("employee_id", user.id).gte("date", startDate).lte("date", endDate).order("date", { ascending: false }),
    supabase.from("holidays").select("*").gte("date", startDate).lte("date", endDate),
    supabase.from("leave_requests").select("*").eq("employee_id", user.id).eq("status", "approved").lte("start_date", endDate).gte("end_date", startDate),
    supabase.from("system_settings").select("*").eq("id", "standard_work_days").single(),
    supabase.from("employee_schedules").select("*, shifts(*)").eq("employee_id", user.id).single()
  ]);

  const records = attendanceRes.data || [];
  const holidays = holidaysRes.data || [];
  const leaves = leaveRes.data || [];
  const standardDays = settingsRes.data ? parseInt(settingsRes.data.value) : 26;
  const shiftStart = scheduleRes.data?.shifts?.start_time || "08:00:00";

  // Calculate stats
  const dailyStats: any = {};
  records.forEach(r => {
    if (!dailyStats[r.date]) {
      dailyStats[r.date] = {
        workHours: 0,
        isLate: false,
        firstIn: r.check_in_time,
        lastOut: r.check_out_time
      };
    }
    dailyStats[r.date].workHours += r.work_hours || 0;
    
    // Check late (only for first record of the day)
    const currentFirstIn = new Date(dailyStats[r.date].firstIn);
    const newCheckIn = new Date(r.check_in_time);
    if (newCheckIn < currentFirstIn) {
      dailyStats[r.date].firstIn = r.check_in_time;
    }

    if (r.check_out_time) {
      const currentLastOut = dailyStats[r.date].lastOut ? new Date(dailyStats[r.date].lastOut) : null;
      const newCheckOut = new Date(r.check_out_time);
      if (!currentLastOut || newCheckOut > currentLastOut) {
        dailyStats[r.date].lastOut = r.check_out_time;
      }
    }
  });

  // Second pass for late calculation
  Object.keys(dailyStats).forEach(date => {
    const firstInTime = dailyStats[date].firstIn.split("T")[1].split(".")[0];
    if (firstInTime > shiftStart) {
      dailyStats[date].isLate = true;
    }
  });

  const workDays = Object.keys(dailyStats).length;
  const lateCount = Object.values(dailyStats).filter((s: any) => s.isLate).length;
  
  // Calculate absent days (simplified)
  const today = new Date().toISOString().split("T")[0];
  const endForAbsent = endDate < today ? endDate : today;
  // This is a complex calculation usually, but for now:
  const absentDays = Math.max(0, standardDays - workDays - leaves.length);

  // If year view, aggregate by month
  let monthlyBreakdown = null;
  if (year) {
    monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, "0");
      const monthStr = `${year}-${m}`;
      const monthRecords = records.filter(r => r.date.startsWith(monthStr));
      const monthWorkDays = new Set(monthRecords.map(r => r.date)).size;
      return {
        month: i + 1,
        workDays: monthWorkDays,
        lateCount: 0 // Simplified for now
      };
    });
  }

  return NextResponse.json({
    standardDays,
    workDays,
    lateCount,
    absentDays,
    records,
    dailyStats,
    holidays,
    leaves,
    monthlyBreakdown
  });
}
