import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readFileSync } from "fs";
import { join } from "path";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseBookingCSV(content: string, filename: string) {
  // These files have data in a single "line" with embedded newlines in quoted fields
  // Headers: #,Loại,Người tạo lịch,Ngày ra data,Ngày tạo lịch,Ngày giờ thực hiện,
  // Phòng kinh doanh,Telesale,Telesale phụ,Số ĐT,Tên KH,Địa chỉ,Dịch vụ chính,
  // Dịch vụ phát sinh,Nguồn,Bác sĩ mkt,Team,Nguồn GR,Báo giá,Ghi chú báo giá,
  // Cách di chuyển,Kết quả,Doanh thu,Nợ,Lễ tân / %,Lễ tân phụ 1 / %,Lễ tân phụ 2 / %,
  // Ghi chú của Telesale,Ghi chú của cơ sở,Chi nhánh,Phân loại nghề nghiệp,...

  const rows: Record<string, string | null>[] = [];

  // Split by record pattern: number at start of field after comma
  // Use regex to find record boundaries
  const records = content.split(/\n(?=\d+,(?:Tạo mới|Tạo Mới))/);

  // First element contains header + possibly first record
  const headerLine = records[0];
  const headerEnd = headerLine.indexOf("\n");
  const header = headerEnd > 0 ? headerLine.substring(0, headerEnd) : headerLine;
  const headers = parseCSVLine(header);

  // If first record is attached to header
  if (headerEnd > 0) {
    const firstRecord = headerLine.substring(headerEnd + 1);
    if (firstRecord.trim()) {
      records[0] = firstRecord;
    } else {
      records.shift();
    }
  } else {
    records.shift();
  }

  for (const record of records) {
    const trimmed = record.trim();
    if (!trimmed || trimmed.startsWith(",,,,")) continue; // Skip summary rows

    const fields = parseCSVLine(trimmed);
    if (fields.length < 10) continue;

    const stt = fields[0];
    if (!stt || isNaN(parseInt(stt))) continue;

    const row: Record<string, string | null> = {
      stt: stt,
      loai: fields[1] || null,
      nguoi_tao_lich: fields[2] || null,
      ngay_ra_data: fields[3] || null,
      ngay_tao_lich: fields[4] || null,
      ngay_gio_thuc_hien: fields[5] || null,
      phong_kinh_doanh: fields[6] || null,
      telesale: fields[7] || null,
      telesale_phu: fields[8] || null,
      so_dien_thoai: fields[9] || null,
      ten_kh: fields[10] || "Không rõ",
      dia_chi: fields[11] || null,
      dich_vu_chinh: fields[12] || null,
      dich_vu_phat_sinh: fields[13] || null,
      nguon: fields[14] || null,
      bac_si_mkt: fields[15] || null,
      team: fields[16] || null,
      nguon_gr: fields[17] || null,
      bao_gia: fields[18] || null,
      ghi_chu_bao_gia: fields[19] || null,
      cach_di_chuyen: fields[20] || null,
      ket_qua: fields[21] || null,
      doanh_thu: fields[22] || null,
      no: fields[23] || null,
      le_tan: fields[24] || null,
      le_tan_phu_1: fields[25] || null,
      le_tan_phu_2: fields[26] || null,
      ghi_chu_telesale: fields[27] || null,
      ghi_chu_co_so: fields[28] || null,
      chi_nhanh: fields[29] || null,
      phan_loai_nghe_nghiep: fields[30] || null,
      source_file: filename,
      source_type: "booking",
    };

    rows.push(row);
  }

  return rows;
}

function parseTreatmentCSV(content: string, filename: string) {
  const lines = content.split("\n");
  const rows: Record<string, string | null>[] = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCSVLine(line);
    if (fields.length < 5) continue;

    const stt = fields[0];
    if (!stt || isNaN(parseInt(stt))) continue;

    rows.push({
      stt: stt,
      ten_kh: fields[1] || "Không rõ",
      so_dien_thoai: fields[2] || null,
      dia_chi: fields[3] || null,
      ngay_gio_thuc_hien: fields[4] || null,
      dich_vu_chinh: fields[5] || null,
      tong_so_buoi: fields[6] || null,
      tinh_trang_truoc_dieu_tri: fields[7] || null,
      phac_do_dieu_tri: fields[8] || null,
      thuoc_dieu_tri: fields[9] || null,
      may_cong_nghe_cao: fields[10] || null,
      tai_kham: fields[11] || null,
      lieu_trinh_dieu_tri: fields[12] || null,
      telesale: fields[13] || null,
      bac_si: fields[14] || null,
      ky_thuat_vien: fields[15] || null,
      source_file: filename,
      source_type: "treatment",
    });
  }

  return rows;
}

function parseSurgeryCSV(content: string, filename: string) {
  // trangtt_bookings uses tab-separated in the display but comma in actual CSV
  const rows: Record<string, string | null>[] = [];

  const records = content.split(/\n(?=\d+,)/);
  const headerLine = records[0];
  const headerEnd = headerLine.indexOf("\n");

  if (headerEnd > 0) {
    records[0] = headerLine.substring(headerEnd + 1);
  } else {
    records.shift();
  }

  for (const record of records) {
    const trimmed = record.trim();
    if (!trimmed) continue;

    const fields = parseCSVLine(trimmed);
    if (fields.length < 10) continue;

    const stt = fields[0];
    if (!stt || isNaN(parseInt(stt))) continue;

    rows.push({
      stt: stt,
      ngay_tao_lich: fields[1] || null,
      ngay_gio_thuc_hien: fields[2] || null,
      bac_si: fields[3] || null,
      lich_phau_thuat: fields[4] || null,
      ten_kh: fields[5] || "Không rõ",
      so_dien_thoai: fields[6] || null,
      dia_chi: fields[7] || null,
      dich_vu_chinh: fields[8] || null,
      dich_vu_phat_sinh: fields[9] || null,
      xet_nghiem: fields[10] || null,
      nguon: fields[11] || null,
      nguon_phu: fields[12] || null,
      nguon_gr_tiep_can_sau: fields[13] || null,
      ngay_nhan_data: fields[14] || null,
      telesale: fields[15] || null,
      sale_1: fields[16] || null,
      sale_2: fields[17] || null,
      ghi_chu_telesale: fields[18] || null,
      ket_qua: fields[19] || null,
      ghi_chu_sale: fields[20] || null,
      ghi_chu_mkt: fields[21] || null,
      doanh_thu: fields[23] || null,
      source_file: filename,
      source_type: "surgery",
    });
  }

  return rows;
}

export async function POST() {
  const supabase = createAdminClient();

  try {
    // Clear existing data
    await supabase.from("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const basePath = join(process.cwd(), "khach-hang");
    let allRows: Record<string, string | null>[] = [];

    // Parse booking files
    const bookingFiles = [
      "bookings_anhntn7.csv",
      "bookings_hongnt2.csv",
      "bookings_oanhdh.csv",
      "bookings_thaoctt.csv",
      "bookings_thutt2.csv",
    ];

    for (const file of bookingFiles) {
      try {
        const content = readFileSync(join(basePath, file), "utf-8");
        const rows = parseBookingCSV(content, file);
        allRows = allRows.concat(rows);
      } catch (e) {
        console.error(`Error parsing ${file}:`, e);
      }
    }

    // Parse treatment file
    try {
      const content = readFileSync(join(basePath, "surgery_data_thaoctt_abcd1221.csv"), "utf-8");
      const rows = parseTreatmentCSV(content, "surgery_data_thaoctt_abcd1221.csv");
      allRows = allRows.concat(rows);
    } catch (e) {
      console.error("Error parsing treatment file:", e);
    }

    // Parse surgery file
    try {
      const content = readFileSync(join(basePath, "trangtt_bookings.csv"), "utf-8");
      const rows = parseSurgeryCSV(content, "trangtt_bookings.csv");
      allRows = allRows.concat(rows);
    } catch (e) {
      console.error("Error parsing surgery file:", e);
    }

    // Insert in batches
    const batchSize = 50;
    let inserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < allRows.length; i += batchSize) {
      const batch = allRows.slice(i, i + batchSize);
      const { error } = await supabase.from("customers").insert(batch);
      if (error) {
        errors.push(`Batch ${i}: ${error.message}`);
      } else {
        inserted += batch.length;
      }
    }

    return NextResponse.json({
      message: `Đã import ${inserted}/${allRows.length} khách hàng`,
      total: allRows.length,
      inserted,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
