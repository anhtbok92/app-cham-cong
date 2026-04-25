import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isWithinAllowedRadius, validateCoordinates } from "@/lib/geo/haversine";
import { calculateWorkHours } from "@/lib/attendance/work-hours";
import { createNotification } from "@/lib/notifications/service";
import type { OfficeLocation } from "@/lib/types";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  // 1. Authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ message: "Phiên làm việc hết hạn." }, { status: 401 });
  }

  // 2. Parse & Validate Coordinates
  let latitude: number;
  let longitude: number;
  try {
    const body = await request.json();
    latitude = body.latitude;
    longitude = body.longitude;
    validateCoordinates({ latitude, longitude });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Tọa độ không hợp lệ." }, { status: 400 });
  }

  // 3. Get profile and office
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, office_locations(*)")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ message: "Không tìm thấy hồ sơ." }, { status: 404 });
  }

  const office = profile.office_locations as OfficeLocation;
  if (!office) {
     return NextResponse.json({ message: "Chưa cấu hình địa điểm." }, { status: 400 });
  }

  // 4. Validate Distance
  const geoResult = isWithinAllowedRadius(
    { latitude, longitude },
    { latitude: office.latitude, longitude: office.longitude },
    office.allowed_radius
  );

  if (!geoResult.isWithinRadius) {
    return NextResponse.json({ message: "Bạn đang ở ngoài phạm vi cho phép." }, { status: 403 });
  }

  // 5. Find active record
  const { data: activeRecord, error: activeError } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", user.id)
    .is("check_out_time", null)
    .order("check_in_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeError || !activeRecord) {
    return NextResponse.json({ message: "Bạn chưa check-in lượt này." }, { status: 400 });
  }

  // 6. Calculate hours and Update
  const checkOutTime = new Date();
  const workHours = calculateWorkHours(new Date(activeRecord.check_in_time), checkOutTime);

  const { data: updated, error: updateError } = await supabase
    .from("attendance_records")
    .update({
      check_out_time: checkOutTime.toISOString(),
      check_out_latitude: latitude,
      check_out_longitude: longitude,
      work_hours: workHours,
    })
    .eq("id", activeRecord.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ message: "Lỗi ghi nhận check-out." }, { status: 500 });
  }

  // Create real notification
  await createNotification({
    userId: user.id,
    title: "Check-out thành công",
    message: `Bạn đã kết thúc lượt làm việc vào lúc ${checkOutTime.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}. Tổng giờ: ${workHours}h.`,
    type: "attendance"
  });

  return NextResponse.json({ success: true, record: updated, workHours });
}
