import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isWithinAllowedRadius, validateCoordinates } from "@/lib/geo/haversine";
import { createNotification } from "@/lib/notifications/service";
import type { OfficeLocation } from "@/lib/types";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  // 1. Authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ message: "Phiên làm việc hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });
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

  // 3. Get employee profile and office
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, office_locations(*)")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ message: "Không tìm thấy hồ sơ nhân viên." }, { status: 404 });
  }

  if (!profile.office_locations) {
    return NextResponse.json(
      { message: "Bạn chưa được gán địa điểm làm việc. Vui lòng liên hệ Admin.", code: "NO_LOCATION" },
      { status: 400 }
    );
  }

  const office = profile.office_locations as OfficeLocation;

  // 4. Validate Distance
  const geoResult = isWithinAllowedRadius(
    { latitude, longitude },
    { latitude: office.latitude, longitude: office.longitude },
    office.allowed_radius
  );

  if (!geoResult.isWithinRadius) {
    return NextResponse.json({
      message: `Bạn đang ở ngoài phạm vi cho phép (${Math.round(geoResult.distanceInMeters)}m). Vui lòng di chuyển lại gần văn phòng hơn.`,
      code: "OUT_OF_RANGE"
    }, { status: 403 });
  }

  // 5. Check for existing open sessions
  const today = new Date().toISOString().split("T")[0];

  const { data: activeRecords, error: activeError } = await supabase
    .from("attendance_records")
    .select("id, date")
    .eq("employee_id", user.id)
    .is("check_out_time", null);

  if (activeError) {
    return NextResponse.json({ message: "Lỗi kiểm tra trạng thái chấm công." }, { status: 500 });
  }

  if (activeRecords && activeRecords.length > 0) {
    // Tách phiên hôm nay và phiên từ ngày trước
    const todaySession = activeRecords.find((r) => r.date === today);
    const pastSessions = activeRecords.filter((r) => r.date !== today);

    // Auto check-out các phiên từ ngày trước (user quên check-out)
    if (pastSessions.length > 0) {
      for (const session of pastSessions) {
        await supabase
          .from("attendance_records")
          .update({
            check_out_time: `${session.date}T23:59:59`,
            notes: "Tự động check-out do quên check-out ngày hôm trước",
          })
          .eq("id", session.id);
      }
    }

    // Nếu hôm nay đã có phiên chưa kết thúc thì mới chặn
    if (todaySession) {
      return NextResponse.json({
        message: "Bạn đang có một lượt chấm công chưa kết thúc hôm nay. Vui lòng check-out trước khi bắt đầu lượt mới.",
        code: "ACTIVE_SESSION"
      }, { status: 409 });
    }
  }

  // 6. Create record
  const { data: record, error: insertError } = await supabase
    .from("attendance_records")
    .insert({
      employee_id: user.id,
      check_in_time: new Date().toISOString(),
      check_in_latitude: latitude,
      check_in_longitude: longitude,
      date: today,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Insert Error:", insertError);
    // If we still get a 500 here after migration 011, it might be due to RLS or other constraints
    return NextResponse.json({ 
      message: "Không thể ghi nhận chấm công. " + (insertError.code === "23505" ? "Bạn đã chấm công cho ngày hôm nay rồi (Vui lòng chạy migration 011)." : "Lỗi hệ thống."),
      details: insertError.message 
    }, { status: 500 });
  }

  // Create real notification
  await createNotification({
    userId: user.id,
    title: "Chấm công thành công",
    message: `Bạn đã check-in vào lúc ${new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })} tại ${office.name}.`,
    type: "attendance"
  });

  return NextResponse.json({ success: true, record });
}
