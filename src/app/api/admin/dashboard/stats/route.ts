import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const [empRes, attendanceRes, leaveRes, deptRes, pendingLeaveRes] = await Promise.all([
    supabase.from("profiles").select("*, departments(name), job_positions(name)").eq("role", "employee"),
    supabase.from("attendance_records").select("*, profiles(full_name, departments(name))").eq("date", today),
    supabase.from("leave_requests").select("*").eq("status", "approved").lte("start_date", today).gte("end_date", today),
    supabase.from("departments").select("*, profiles(count)"),
    supabase.from("leave_requests").select("*", { count: "exact", head: true }).eq("status", "pending")
  ]);

  const employees = empRes.data || [];
  const attendances = attendanceRes.data || [];
  const activeLeaves = leaveRes.data || [];
  const departments = deptRes.data || [];
  const pendingLeaveCount = pendingLeaveRes.count || 0;

  // Calculate Late Employees (Requires checking shifts, but for simplicity we'll use first check-in)
  // To be more accurate, we'd join with schedules and shifts. 
  // Let's do a simplified version: late if check_in > 08:05 (as a default if shift not found)
  const lateEmployees = attendances.filter(a => {
    // In a real scenario, compare a.check_in_time with shift start
    const checkIn = new Date(a.check_in_time);
    return checkIn.getHours() > 8 || (checkIn.getHours() === 8 && checkIn.getMinutes() > 5);
  });

  const stats = {
    totalEmployees: employees.length,
    presentToday: new Set(attendances.map(a => a.employee_id)).size,
    lateToday: new Set(lateEmployees.map(a => a.employee_id)).size,
    onLeave: new Set(activeLeaves.map(l => l.employee_id)).size,
    absentToday: employees.length - new Set(attendances.map(a => a.employee_id)).size - new Set(activeLeaves.map(l => l.employee_id)).size,
    pendingLeaveCount,
    lateList: lateEmployees.map(a => ({
      id: a.id,
      name: a.profiles?.full_name,
      department: a.profiles?.departments?.name,
      checkIn: a.check_in_time
    })),
    deptStats: departments.map(d => ({
      name: d.name,
      count: employees.filter(e => e.department_id === d.id).length
    })).filter(d => d.count > 0)
  };

  return NextResponse.json(stats);
}
