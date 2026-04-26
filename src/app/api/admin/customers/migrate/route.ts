import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = createAdminClient();

  const { error } = await supabase.rpc("exec_sql", {
    sql: `
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        stt INTEGER,
        loai TEXT,
        ten_kh TEXT NOT NULL,
        ho_ten_day_du TEXT,
        so_dien_thoai TEXT,
        tuoi TEXT,
        dia_chi TEXT,
        nghe_nghiep TEXT,
        phan_loai_nghe_nghiep TEXT,
        ngay_ra_data TEXT,
        ngay_tao_lich TEXT,
        ngay_gio_thuc_hien TEXT,
        nguoi_tao_lich TEXT,
        phong_kinh_doanh TEXT,
        telesale TEXT,
        telesale_phu TEXT,
        le_tan TEXT,
        le_tan_phu_1 TEXT,
        le_tan_phu_2 TEXT,
        dich_vu_chinh TEXT,
        dich_vu_phat_sinh TEXT,
        nguon TEXT,
        nguon_gr TEXT,
        bac_si_mkt TEXT,
        team TEXT,
        bao_gia TEXT,
        ghi_chu_bao_gia TEXT,
        doanh_thu TEXT,
        no TEXT,
        cach_di_chuyen TEXT,
        ket_qua TEXT,
        ghi_chu_telesale TEXT,
        ghi_chu_co_so TEXT,
        chi_nhanh TEXT,
        source_file TEXT NOT NULL,
        source_type TEXT NOT NULL DEFAULT 'booking',
        bac_si TEXT,
        lich_phau_thuat TEXT,
        xet_nghiem TEXT,
        nguon_phu TEXT,
        nguon_gr_tiep_can_sau TEXT,
        ngay_nhan_data TEXT,
        sale_1 TEXT,
        sale_2 TEXT,
        ghi_chu_sale TEXT,
        ghi_chu_mkt TEXT,
        tong_so_buoi TEXT,
        tinh_trang_truoc_dieu_tri TEXT,
        phac_do_dieu_tri TEXT,
        thuoc_dieu_tri TEXT,
        may_cong_nghe_cao TEXT,
        tai_kham TEXT,
        lieu_trinh_dieu_tri TEXT,
        ky_thuat_vien TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `,
  });

  // If rpc doesn't exist, try direct SQL via REST
  if (error) {
    // Try creating table via direct insert approach - table will be created by seed
    // Just check if table exists
    const { error: checkError } = await supabase.from("customers").select("id").limit(1);

    if (checkError && checkError.message.includes("does not exist")) {
      return NextResponse.json(
        {
          message:
            "Bảng customers chưa tồn tại. Vui lòng chạy migration SQL trong Supabase Dashboard: supabase/migrations/016_add_customers.sql",
          needsManualMigration: true,
        },
        { status: 400 }
      );
    }

    // Table exists
    return NextResponse.json({ message: "Bảng customers đã tồn tại", ok: true });
  }

  return NextResponse.json({ message: "Migration thành công", ok: true });
}
