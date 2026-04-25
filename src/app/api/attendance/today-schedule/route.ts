import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  // 1. Get employee's schedule for today
  const { data: schedule, error: schedError } = await supabase
    .from("employee_schedules")
    .select("*, work_shifts(*)")
    .eq("employee_id", user.id)
    .lte("start_date", today)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (schedError) {
    return NextResponse.json({ message: "Lỗi truy vấn lịch làm việc." }, { status: 500 });
  }

  // 2. Get assigned office location
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, office_locations(*)")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ 
    schedule, 
    profile,
    today 
  });
}
