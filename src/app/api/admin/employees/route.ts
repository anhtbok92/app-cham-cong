import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/employees
 * Create a new employee.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();

  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", adminUser.id)
    .single();

  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      full_name, 
      date_of_birth, 
      position, 
      address, 
      phone_number,
      office_location_id,
      department_id,
      job_position_id
    } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json({ message: "Thiếu thông tin bắt buộc." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Create user in Auth
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (authError) {
      return NextResponse.json({ message: authError.message }, { status: 400 });
    }

    // Normalize empty strings to null so Postgres accepts date/uuid columns
    const emptyToNull = (v: unknown) =>
      v === "" || v === undefined ? null : v;

    // 2. Upsert the profile
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: authUser.user.id,
        full_name,
        email,
        date_of_birth: emptyToNull(date_of_birth),
        position: emptyToNull(position),
        address: emptyToNull(address),
        phone_number: emptyToNull(phone_number),
        office_location_id: emptyToNull(office_location_id),
        department_id: emptyToNull(department_id),
        job_position_id: emptyToNull(job_position_id),
        role: "employee",
        is_active: true
      });

    if (profileError) {
      await adminClient.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        { message: `Lỗi khi tạo hồ sơ nhân viên: ${profileError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Tạo nhân viên thành công.", user: authUser.user });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

/**
 * GET /api/admin/employees
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));
  const search = searchParams.get("search")?.trim() || "";

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("profiles")
    .select("*, departments(name), job_positions(name)", { count: "exact" })
    .eq("role", "employee")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  query = query.range(from, to);

  const { data: employees, count, error } = await query;

  if (error) return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });

  return NextResponse.json({
    employees: employees ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
}
