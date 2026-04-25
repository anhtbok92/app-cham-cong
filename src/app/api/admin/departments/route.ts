import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase: null, error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { supabase: null, error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  }

  return { supabase, error: null };
}

export async function GET() {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { data, error: dbError } = await supabase!
    .from("departments")
    .select("*")
    .order("name");

  if (dbError) return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  return NextResponse.json({ departments: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  let body: { name: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  if (!body.name) return NextResponse.json({ message: "Tên phòng ban là bắt buộc." }, { status: 400 });

  const { data, error: dbError } = await supabase!
    .from("departments")
    .insert({ name: body.name })
    .select()
    .single();

  if (dbError) return NextResponse.json({ message: "Lỗi tạo phòng ban." }, { status: 500 });
  return NextResponse.json({ department: data }, { status: 201 });
}
