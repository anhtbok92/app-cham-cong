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

/**
 * PATCH /api/admin/locations/[id]
 * Update an office location.
 * Requirements: 8.3, 8.4
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.name === "string") updates.name = body.name;
  if (typeof body.latitude === "number") {
    if (body.latitude < -90 || body.latitude > 90) {
      return NextResponse.json({ message: "Latitude không hợp lệ." }, { status: 400 });
    }
    updates.latitude = body.latitude;
  }
  if (typeof body.longitude === "number") {
    if (body.longitude < -180 || body.longitude > 180) {
      return NextResponse.json({ message: "Longitude không hợp lệ." }, { status: 400 });
    }
    updates.longitude = body.longitude;
  }
  if (body.allowed_radius !== undefined) {
    if (body.allowed_radius !== 50 && body.allowed_radius !== 100) {
      return NextResponse.json({ message: "Bán kính cho phép phải là 50 hoặc 100 mét." }, { status: 400 });
    }
    updates.allowed_radius = body.allowed_radius;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: "No fields to update" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error: dbError } = await supabase!
    .from("office_locations")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ message: "Lỗi cập nhật." }, { status: 500 });
  }

  return NextResponse.json({ location: data });
}

/**
 * DELETE /api/admin/locations/[id]
 * Delete an office location. Existing attendance records are preserved.
 * Requirements: 8.5
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  // Unlink employees assigned to this location before deleting
  await supabase!
    .from("profiles")
    .update({ office_location_id: null, updated_at: new Date().toISOString() })
    .eq("office_location_id", params.id);

  const { error: dbError } = await supabase!
    .from("office_locations")
    .delete()
    .eq("id", params.id);

  if (dbError) {
    return NextResponse.json({ message: "Lỗi xóa địa điểm." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
