import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") || new Date().toISOString().split("T")[0].substring(0, 7);

  // Fetch employees, their attendance for the month, and existing salary records
  const [employeesRes, attendanceRes, settingsRes, existingSalariesRes] = await Promise.all([
    supabase.from("profiles").select("*, departments(name), job_positions(name)").eq("role", "employee"),
    supabase.from("attendance_records").select("*").gte("date", `${month}-01`).lte("date", `${month}-31`),
    supabase.from("system_settings").select("*").eq("id", "standard_work_days").single(),
    supabase.from("salaries").select("*").eq("month", month)
  ]);

  const employees = employeesRes.data || [];
  const attendances = attendanceRes.data || [];
  const standardDays = settingsRes.data ? parseInt(settingsRes.data.value) : 26;
  const existingSalaries = existingSalariesRes.data || [];

  const payrollData = employees.map(emp => {
    const empAttendances = attendances.filter(a => a.employee_id === emp.id);
    const workDaysCount = new Set(empAttendances.map(a => a.date)).size;
    const existing = existingSalaries.find(s => s.employee_id === emp.id);

    return {
      employee_id: emp.id,
      full_name: emp.full_name,
      department: emp.departments?.name,
      position: emp.job_positions?.name,
      work_days: existing ? existing.work_days : workDaysCount,
      standard_days: standardDays,
      base_salary: existing ? existing.base_salary : (emp.base_salary || 0),
      allowance: existing ? existing.allowance : 0,
      bonus: existing ? existing.bonus : 0,
      commission: existing ? existing.commission : 0,
      total_salary: existing ? existing.total_salary : 0,
      status: existing ? existing.status : 'pending'
    };
  });

  return NextResponse.json(payrollData);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();
  const { month, salaries } = body;

  for (const s of salaries) {
    const { error } = await supabase
      .from("salaries")
      .upsert({
        employee_id: s.employee_id,
        month,
        base_salary: s.base_salary,
        work_days: s.work_days,
        standard_days: s.standard_days,
        allowance: s.allowance,
        bonus: s.bonus,
        commission: s.commission,
        total_salary: s.total_salary,
        status: s.status || 'pending'
      }, { onConflict: 'employee_id,month' });
    
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Cập nhật bảng lương thành công" });
}
