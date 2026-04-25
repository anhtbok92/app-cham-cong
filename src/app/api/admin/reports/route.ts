import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeSummary } from "@/lib/admin/report-service";
import type { AttendanceRecord, Profile } from "@/lib/types";

/**
 * GET /api/admin/reports
 * Get attendance report summaries.
 * Query params: startDate, endDate, employeeId (optional)
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);

  // Default to current month
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const startDate = searchParams.get("startDate") || defaultStart;
  const endDate = searchParams.get("endDate") || defaultEnd;
  const employeeId = searchParams.get("employeeId") || undefined;

  // Fetch employees
  let empQuery = supabase
    .from("profiles")
    .select("*")
    .eq("role", "employee")
    .eq("is_active", true);

  if (employeeId) {
    empQuery = empQuery.eq("id", employeeId);
  }

  const { data: employees } = await empQuery;
  const empList = (employees as Profile[]) ?? [];

  // Fetch attendance records in range
  let recQuery = supabase
    .from("attendance_records")
    .select("*, profiles(full_name)")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  if (employeeId) {
    recQuery = recQuery.eq("employee_id", employeeId);
  }

  const { data: records } = await recQuery;
  const rawRecords = (records as any[]) ?? [];

  // Group records by employee for summaries
  const recordsByEmployee = new Map<string, AttendanceRecord[]>();
  const detailedRecords = rawRecords.map(r => ({
    ...r,
    employee_name: r.profiles?.full_name || "Unknown"
  }));

  for (const r of detailedRecords) {
    const existing = recordsByEmployee.get(r.employee_id) ?? [];
    existing.push(r);
    recordsByEmployee.set(r.employee_id, existing);
  }

  // Compute summaries
  const summaries = empList.map((emp) =>
    computeSummary(
      emp.id,
      emp.full_name,
      recordsByEmployee.get(emp.id) ?? [],
      startDate,
      endDate
    )
  );

  return NextResponse.json({ summaries, detailedRecords, startDate, endDate });
}
