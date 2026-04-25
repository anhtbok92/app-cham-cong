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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { data, error: dbError } = await supabase!
    .from("leave_requests")
    .update({ 
      status: body.status,
      comment: body.comment,
      updated_at: new Date().toISOString() 
    })
    .eq("id", params.id)
    .select("*, profiles(full_name)")
    .single();

  if (dbError) return NextResponse.json({ message: "Lỗi cập nhật." }, { status: 500 });
  return NextResponse.json({ leaveRequest: data });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { error: dbError } = await supabase!
    .from("leave_requests")
    .delete()
    .eq("id", params.id);

  if (dbError) return NextResponse.json({ message: "Lỗi xóa." }, { status: 500 });
  return NextResponse.json({ message: "Deleted" });
}
