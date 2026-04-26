import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Groq from "groq-sdk";

function buildSystemPrompt(dateStr: string, totalRecords: number) {
  return `Bạn là trợ lý AI phân tích dữ liệu khách hàng cho một phòng khám thẩm mỹ da liễu và phẫu thuật thẩm mỹ.

Dữ liệu gồm ${totalRecords} khách hàng. Mỗi khách hàng có các trường:
- id: mã định danh
- ten: tên khách hàng
- sdt: số điện thoại
- tuoi: tuổi
- dc: địa chỉ
- nn: nghề nghiệp
- dv: dịch vụ chính
- dvps: dịch vụ phát sinh
- bs: bác sĩ
- ts: telesale
- kq: kết quả (Đã làm dịch vụ, Hủy lịch, Failed, Đã đặt lịch, Cơ sở từ chối, Đã cọc, Phẫu thuật...)
- dt: doanh thu
- no: nợ
- cn: chi nhánh (Liễu Giai = Hà Nội, Nguyễn Du = HCM)
- ngay: ngày thực hiện
- loai: booking/treatment/surgery
- gc: ghi chú tóm tắt (tính cách, tâm lý, tài chính KH)
- lt: liệu trình (Còn liệu trình / Hết liệu trình)
- tb: tổng số buổi

Ngày hiện tại: ${dateStr}

Quy tắc:
1. Trả lời bằng tiếng Việt, rõ ràng, có cấu trúc.
2. Khi liệt kê khách hàng, dùng bảng markdown.
3. Đưa ra insight cụ thể và gợi ý hành động.
4. Trường "gc" (ghi chú) chứa thông tin quý giá về tính cách, tâm lý, khả năng tài chính — hãy khai thác.
5. Nếu câu hỏi liên quan đến thời gian, so sánh với ngày hiện tại.
6. Nếu không tìm thấy dữ liệu phù hợp, nói rõ.
7. Luôn đếm số lượng kết quả.`;
}

// Truncate text to max length
function truncate(text: string | null | undefined, max: number): string | null {
  if (!text) return null;
  if (text.length <= max) return text;
  return text.substring(0, max) + "...";
}

// Extract key personality/financial traits from notes
function extractTraits(note: string | null | undefined): string | null {
  if (!note) return null;
  const text = note.toLowerCase();
  const traits: string[] = [];

  if (text.includes("dễ tính") || text.includes("hiền") || text.includes("ngoan")) traits.push("dễ tính");
  if (text.includes("khó tính") || text.includes("kĩ tính") || text.includes("kỹ tính")) traits.push("khó tính");
  if (text.includes("care giá") || text.includes("căn ke") || text.includes("tiếc tiền") || text.includes("care chi phí") || text.includes("ít tiền")) traits.push("care giá");
  if (text.includes("có điều kiện") || text.includes("có kinh tế") || text.includes("giàu") || text.includes("tiền ko quan trọng")) traits.push("có kinh tế");
  if (text.includes("mất niềm tin") || text.includes("mất lòng tin") || text.includes("sợ k hiệu quả")) traits.push("mất niềm tin");
  if (text.includes("nhu cầu cao") || text.includes("nhu cầu điều trị cao") || text.includes("nhu cầu cải thiện")) traits.push("nhu cầu cao");
  if (text.includes("sợ đau") || text.includes("sợ kim")) traits.push("sợ đau/kim");
  if (text.includes("nước ngoài") || text.includes("việt kiều") || text.includes("về vn") || text.includes("bay")) traits.push("Việt kiều/nước ngoài");
  if (text.includes("sinh viên") || text.includes("học sinh")) traits.push("SV/HS");
  if (text.includes("cam kết") || text.includes("bảo hành")) traits.push("care cam kết");
  if (text.includes("kỳ vọng cao")) traits.push("kỳ vọng cao");

  return traits.length > 0 ? traits.join(", ") : null;
}

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message) {
    return NextResponse.json({ message: "Thiếu nội dung câu hỏi" }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: "Chưa cấu hình GROQ_API_KEY trong .env" }, { status: 500 });
  }

  const supabase = createAdminClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  // Build ultra-compact data — extract traits instead of sending raw notes
  const compactData = (customers || []).map((c, i) => {
    const allNotes = [c.ghi_chu_telesale, c.ghi_chu_co_so].filter(Boolean).join(" ");
    const traits = extractTraits(allNotes);
    // For notes, only send a short summary
    const gcShort = truncate(allNotes, 150);

    return {
      id: i + 1,
      ten: c.ten_kh,
      sdt: c.so_dien_thoai,
      tuoi: c.tuoi,
      dc: truncate(c.dia_chi, 30),
      nn: c.nghe_nghiep || c.phan_loai_nghe_nghiep || null,
      dv: c.dich_vu_chinh,
      dvps: c.dich_vu_phat_sinh || null,
      bs: c.bac_si_mkt || c.bac_si || null,
      ts: truncate(c.telesale, 30),
      kq: c.ket_qua,
      dt: c.doanh_thu,
      no: c.no || null,
      cn: c.chi_nhanh ? (c.chi_nhanh.includes("Liễu Giai") ? "HN" : c.chi_nhanh.includes("Nguyễn Du") ? "HCM" : truncate(c.chi_nhanh, 20)) : null,
      ngay: c.ngay_gio_thuc_hien,
      loai: c.source_type,
      tc: traits, // extracted personality traits
      gc: gcShort, // truncated notes
      lt: c.lieu_trinh_dieu_tri || null,
      tb: c.tong_so_buoi || null,
    };
  });

  // Remove null fields to save tokens
  const cleanData = compactData.map((item) => {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(item)) {
      if (v !== null && v !== undefined && v !== "") {
        clean[k] = v;
      }
    }
    return clean;
  });

  const dataStr = JSON.stringify(cleanData);

  try {
    const groq = new Groq({ apiKey });
    const systemPrompt = buildSystemPrompt(
      new Date().toLocaleDateString("vi-VN"),
      cleanData.length
    );

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Dữ liệu:\n${dataStr}\n\nCâu hỏi: ${message}`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 4096,
    });

    const answer =
      chatCompletion.choices[0]?.message?.content || "Không có phản hồi từ AI";

    return NextResponse.json({ answer });
  } catch (err: unknown) {
    // If still too long, retry with even less data
    if (err instanceof Error && err.message.includes("context_length_exceeded")) {
      try {
        const groq = new Groq({ apiKey });
        const systemPrompt = buildSystemPrompt(
          new Date().toLocaleDateString("vi-VN"),
          cleanData.length
        );

        // Ultra-minimal: only key fields, first 200 records
        const miniData = compactData.slice(0, 200).map((c) => ({
          id: c.id,
          ten: c.ten,
          sdt: c.sdt,
          dv: c.dv,
          kq: c.kq,
          dt: c.dt,
          cn: c.cn,
          ngay: c.ngay,
          loai: c.loai,
          tc: c.tc,
        }));

        const miniClean = miniData.map((item) => {
          const clean: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(item)) {
            if (v !== null && v !== undefined && v !== "") clean[k] = v;
          }
          return clean;
        });

        const chatCompletion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Dữ liệu (rút gọn, ${miniClean.length}/${compactData.length} records):\n${JSON.stringify(miniClean)}\n\nCâu hỏi: ${message}`,
            },
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.3,
          max_tokens: 4096,
        });

        const answer =
          chatCompletion.choices[0]?.message?.content || "Không có phản hồi từ AI";

        return NextResponse.json({
          answer: answer + "\n\n> ⚠️ *Lưu ý: Do giới hạn context, chỉ phân tích được " + miniClean.length + "/" + compactData.length + " khách hàng.*",
        });
      } catch (retryErr: unknown) {
        const msg = retryErr instanceof Error ? retryErr.message : "Lỗi khi gọi Groq AI";
        return NextResponse.json({ message: msg }, { status: 500 });
      }
    }

    const msg = err instanceof Error ? err.message : "Lỗi khi gọi Groq AI";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
