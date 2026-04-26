-- Bảng khách hàng CK (khách hàng cũ)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Thông tin cơ bản
  stt INTEGER,
  loai TEXT, -- Tạo mới, etc.
  ten_kh TEXT NOT NULL,
  ho_ten_day_du TEXT, -- Họ tên đầy đủ từ ghi chú cơ sở
  so_dien_thoai TEXT,
  tuoi TEXT,
  dia_chi TEXT,
  nghe_nghiep TEXT,
  phan_loai_nghe_nghiep TEXT,

  -- Thông tin lịch hẹn
  ngay_ra_data TEXT,
  ngay_tao_lich TEXT,
  ngay_gio_thuc_hien TEXT,
  nguoi_tao_lich TEXT,

  -- Phòng kinh doanh & nhân viên
  phong_kinh_doanh TEXT,
  telesale TEXT,
  telesale_phu TEXT,
  le_tan TEXT,
  le_tan_phu_1 TEXT,
  le_tan_phu_2 TEXT,

  -- Dịch vụ
  dich_vu_chinh TEXT,
  dich_vu_phat_sinh TEXT,

  -- Nguồn & Marketing
  nguon TEXT,
  nguon_gr TEXT,
  bac_si_mkt TEXT,
  team TEXT,

  -- Tài chính
  bao_gia TEXT,
  ghi_chu_bao_gia TEXT,
  doanh_thu TEXT,
  no TEXT,

  -- Trạng thái
  cach_di_chuyen TEXT,
  ket_qua TEXT, -- Đã làm dịch vụ, Hủy lịch, Failed, etc.

  -- Ghi chú
  ghi_chu_telesale TEXT,
  ghi_chu_co_so TEXT,

  -- Chi nhánh
  chi_nhanh TEXT,

  -- Nguồn file
  source_file TEXT NOT NULL, -- file CSV gốc
  source_type TEXT NOT NULL DEFAULT 'booking', -- booking | surgery | treatment

  -- Dữ liệu phẫu thuật (cho trangtt_bookings)
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

  -- Dữ liệu điều trị (cho surgery_data)
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

-- Index cho tìm kiếm
CREATE INDEX IF NOT EXISTS idx_customers_ten_kh ON customers USING gin (to_tsvector('simple', ten_kh));
CREATE INDEX IF NOT EXISTS idx_customers_so_dien_thoai ON customers (so_dien_thoai);
CREATE INDEX IF NOT EXISTS idx_customers_source_type ON customers (source_type);
CREATE INDEX IF NOT EXISTS idx_customers_ket_qua ON customers (ket_qua);
CREATE INDEX IF NOT EXISTS idx_customers_chi_nhanh ON customers (chi_nhanh);

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage customers" ON customers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Employees can view customers" ON customers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  );
