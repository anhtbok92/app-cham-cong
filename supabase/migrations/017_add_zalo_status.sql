-- Thêm cột trạng thái Zalo cho khách hàng
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS zalo_status TEXT DEFAULT NULL;

-- Giá trị hợp lệ: NULL (chưa xử lý), 'da_ket_ban', 'da_dong_y', 'da_nhan_tin', 'da_dong_y_lieu_trinh'
COMMENT ON COLUMN customers.zalo_status IS 'Trạng thái Zalo: da_ket_ban, da_dong_y, da_nhan_tin, da_dong_y_lieu_trinh';

CREATE INDEX IF NOT EXISTS idx_customers_zalo_status ON customers (zalo_status);
