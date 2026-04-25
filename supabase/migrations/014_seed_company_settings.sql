-- Seed company branding settings
INSERT INTO system_settings (id, value, description)
VALUES 
  ('company_name', '"TimeTrack Pro"', 'Tên công ty hiển thị trên ứng dụng'),
  ('company_logo', '""', 'URL logo công ty'),
  ('company_address', '"72 Trần Hưng Đạo, Quận 1, TP.HCM"', 'Địa chỉ trụ sở chính')
ON CONFLICT (id) DO NOTHING;
