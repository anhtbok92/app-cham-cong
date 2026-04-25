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

export async function GET(request: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get("departmentId");

  let query = supabase!.from("job_positions").select("*, departments(name)");
  if (departmentId) query = query.eq("department_id", departmentId);

  const { data, error: dbError } = await query.order("name");

  if (dbError) return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  return NextResponse.json({ jobPositions: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  let body: { name: string; department_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  if (!body.name || !body.department_id) {
    return NextResponse.json({ message: "Tên và phòng ban là bắt buộc." }, { status: 400 });
  }

  const { data, error: dbError } = await supabase!
    .from("job_positions")
    .insert({ name: body.name, department_id: body.department_id })
    .select("*, departments(name)")
    .single();

  if (dbError) return NextResponse.json({ message: "Lỗi tạo vị trí công việc." }, { status: 500 });
  return NextResponse.json({ jobPosition: data }, { status: 201 });
}
