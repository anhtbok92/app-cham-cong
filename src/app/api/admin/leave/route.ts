import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase: null, error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { supabase: null, error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  return { supabase, error: null };
}

export async function GET() {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { data, error: dbError } = await supabase!
    .from("leave_requests")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });

  if (dbError) return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  return NextResponse.json({ leaveRequests: data ?? [] });
}

// POST for admin (e.g. creating leave on behalf of employee)
export async function POST(request: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { data, error: dbError } = await supabase!
    .from("leave_requests")
    .insert({
      employee_id: body.employee_id,
      start_date: body.start_date,
      end_date: body.end_date,
      leave_type: body.leave_type,
      reason: body.reason,
      status: body.status || "pending"
    })
    .select("*, profiles(full_name)")
    .single();

  if (dbError) return NextResponse.json({ message: "Lỗi tạo yêu cầu nghỉ phép." }, { status: 500 });
  return NextResponse.json({ leaveRequest: data }, { status: 201 });
}
