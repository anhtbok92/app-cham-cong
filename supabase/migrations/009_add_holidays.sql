-- 1. holidays table
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "everyone_read_holidays" ON holidays FOR SELECT USING (true);
CREATE POLICY "admins_manage_holidays" ON holidays FOR ALL USING (public.is_admin());
