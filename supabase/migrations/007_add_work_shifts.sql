-- 1. work_shifts table
CREATE TABLE work_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE work_shifts ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "everyone_read_shifts" ON work_shifts FOR SELECT USING (true);
CREATE POLICY "admins_manage_shifts" ON work_shifts FOR ALL USING (public.is_admin());
