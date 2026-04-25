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
 * GET /api/admin/locations
 * List all office locations.
 * Requirements: 8.1
 */
export async function GET() {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { data, error: dbError } = await supabase!
    .from("office_locations")
    .select("*")
    .order("created_at", { ascending: false });

  if (dbError) {
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }

  return NextResponse.json({ locations: data ?? [] });
}

/**
 * POST /api/admin/locations
 * Create a new office location.
 * Requirements: 8.2, 8.4
 */
export async function POST(request: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const { name, latitude, longitude, allowed_radius } = body as {
    name?: string;
    latitude?: number;
    longitude?: number;
    allowed_radius?: number;
  };

  if (!name || typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json({ message: "Thiếu thông tin bắt buộc." }, { status: 400 });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json({ message: "Tọa độ không hợp lệ." }, { status: 400 });
  }

  if (allowed_radius !== 50 && allowed_radius !== 100) {
    return NextResponse.json({ message: "Bán kính cho phép phải là 50 hoặc 100 mét." }, { status: 400 });
  }

  const { data, error: dbError } = await supabase!
    .from("office_locations")
    .insert({ name, latitude, longitude, allowed_radius })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ message: "Lỗi tạo địa điểm." }, { status: 500 });
  }

  return NextResponse.json({ location: data }, { status: 201 });
}
