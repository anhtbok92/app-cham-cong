import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Custom sort: treatment=1, booking=2, surgery=3
const SOURCE_ORDER: Record<string, number> = {
  treatment: 1,
  booking: 2,
  surgery: 3,
};

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const url = req.nextUrl.searchParams;
  const page = parseInt(url.get("page") || "1");
  const pageSize = parseInt(url.get("pageSize") || "20");
  const tenKh = url.get("tenKh") || "";
  const soDienThoai = url.get("soDienThoai") || "";
  const sourceType = url.get("sourceType") || "";
  const ketQua = url.get("ketQua") || "";
  const bacSi = url.get("bacSi") || "";
  const dichVu = url.get("dichVu") || "";
  const coSo = url.get("coSo") || "";
  const dateFrom = url.get("dateFrom") || "";
  const dateTo = url.get("dateTo") || "";
  const excludeDateFrom = url.get("excludeDateFrom") || "";
  const excludeDateTo = url.get("excludeDateTo") || "";

  // We need to fetch more data for client-side sorting by source_type priority
  // and for date filtering on text-based date fields
  let query = supabase
    .from("customers")
    .select("*", { count: "exact" });

  if (tenKh) {
    query = query.or(`ten_kh.ilike.%${tenKh}%,ho_ten_day_du.ilike.%${tenKh}%`);
  }
  if (soDienThoai) {
    query = query.ilike("so_dien_thoai", `%${soDienThoai}%`);
  }
  if (sourceType) query = query.eq("source_type", sourceType);
  if (ketQua) query = query.eq("ket_qua", ketQua);
  if (bacSi) {
    query = query.or(`bac_si_mkt.ilike.%${bacSi}%,bac_si.ilike.%${bacSi}%`);
  }
  if (dichVu) {
    query = query.or(`dich_vu_chinh.ilike.%${dichVu}%,dich_vu_phat_sinh.ilike.%${dichVu}%`);
  }
  if (coSo === "HN") {
    query = query.ilike("chi_nhanh", "%Liễu Giai%");
  } else if (coSo === "HCM") {
    query = query.ilike("chi_nhanh", "%Nguyễn Du%");
  }

  // Date filters need post-processing since ngay_gio_thuc_hien is TEXT
  const needsDateFilter = dateFrom || dateTo || excludeDateFrom || excludeDateTo;

  if (needsDateFilter) {
    // Fetch all matching records for date filtering
    const { data: allData, error } = await query;
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    let filtered = allData || [];

    // Parse date from text field "DD/MM/YYYY" or "DD/MM/YYYY\n HH:MM - HH:MM"
    const parseDate = (text: string | null): Date | null => {
      if (!text) return null;
      const m = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (!m) return null;
      return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
    };

    // Inclusive date filter: keep customers WITH dates in range [A, B]
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      if (to) to.setHours(23, 59, 59, 999);

      filtered = filtered.filter((c) => {
        const d = parseDate(c.ngay_gio_thuc_hien);
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }

    // Exclusive date filter: keep customers WITHOUT dates in range [C, D]
    if (excludeDateFrom || excludeDateTo) {
      const exFrom = excludeDateFrom ? new Date(excludeDateFrom) : null;
      const exTo = excludeDateTo ? new Date(excludeDateTo) : null;
      if (exTo) exTo.setHours(23, 59, 59, 999);

      filtered = filtered.filter((c) => {
        const d = parseDate(c.ngay_gio_thuc_hien);
        if (!d) return true; // no date = not in excluded range
        const inRange =
          (!exFrom || d >= exFrom) && (!exTo || d <= exTo);
        return !inRange; // keep if NOT in excluded range
      });
    }

    // Sort: treatment first, booking second, surgery last
    filtered.sort((a, b) => {
      const oa = SOURCE_ORDER[a.source_type] ?? 99;
      const ob = SOURCE_ORDER[b.source_type] ?? 99;
      return oa - ob;
    });

    const total = filtered.length;
    const from_idx = (page - 1) * pageSize;
    const paged = filtered.slice(from_idx, from_idx + pageSize);

    return NextResponse.json({ customers: paged, total });
  }

  // No date filter — use DB pagination but still need custom sort
  // Fetch all for sorting, then paginate
  const { data: allData, count, error } = await query;
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const sorted = (allData || []).sort((a, b) => {
    const oa = SOURCE_ORDER[a.source_type] ?? 99;
    const ob = SOURCE_ORDER[b.source_type] ?? 99;
    return oa - ob;
  });

  const from_idx = (page - 1) * pageSize;
  const paged = sorted.slice(from_idx, from_idx + pageSize);

  return NextResponse.json({ customers: paged, total: count ?? sorted.length });
}
