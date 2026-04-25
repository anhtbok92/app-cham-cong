import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/admin/employees/[id]
 * Update employee profile (name, email, is_active, office_location_id).
 * Requirements: 4.3, 4.5, 8.6
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.full_name === "string") updates.full_name = body.full_name;
  if (typeof body.email === "string") updates.email = body.email;
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
  if (body.office_location_id !== undefined) updates.office_location_id = body.office_location_id;
  if (body.department_id !== undefined) updates.department_id = body.department_id;
  if (body.job_position_id !== undefined) updates.job_position_id = body.job_position_id;
  if (body.date_of_birth !== undefined) updates.date_of_birth = body.date_of_birth;
  if (body.address !== undefined) updates.address = body.address;
  if (body.phone_number !== undefined) updates.phone_number = body.phone_number;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: "No fields to update" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ message: "Lỗi cập nhật." }, { status: 500 });
  }

  return NextResponse.json({ employee: updated });
}
