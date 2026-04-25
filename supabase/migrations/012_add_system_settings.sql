-- Create system_settings table
CREATE TABLE system_settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial standard work days
INSERT INTO system_settings (id, value, description)
VALUES ('standard_work_days', '26', 'Số ngày công chuẩn trong tháng')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "anyone_read_settings" ON system_settings
  FOR SELECT USING (true);

-- Only admins can manage settings
CREATE POLICY "admins_manage_settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
