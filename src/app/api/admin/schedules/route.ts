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
    .from("employee_schedules")
    .select("*, profiles(full_name), work_shifts(name, start_time, end_time)")
    .order("start_date", { ascending: false });

  if (dbError) return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  return NextResponse.json({ schedules: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  let body: { employee_id: string; shift_id: string; start_date: string; end_date?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  if (!body.employee_id || !body.shift_id || !body.start_date) {
    return NextResponse.json({ message: "Thiếu thông tin bắt buộc." }, { status: 400 });
  }

  const { data, error: dbError } = await supabase!
    .from("employee_schedules")
    .insert({ 
      employee_id: body.employee_id, 
      shift_id: body.shift_id, 
      start_date: body.start_date,
      end_date: body.end_date || null
    })
    .select("*, profiles(full_name), work_shifts(name, start_time, end_time)")
    .single();

  if (dbError) return NextResponse.json({ message: "Lỗi tạo lịch làm việc." }, { status: 500 });
  return NextResponse.json({ schedule: data }, { status: 201 });
}
