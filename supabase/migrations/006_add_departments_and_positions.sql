-- 1. departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. job_positions table
CREATE TABLE job_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, department_id)
);

-- 3. Add FKs to profiles
ALTER TABLE profiles ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN job_position_id UUID REFERENCES job_positions(id) ON DELETE SET NULL;

-- 4. Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Everyone can read departments and positions
CREATE POLICY "everyone_read_departments" ON departments FOR SELECT USING (true);
CREATE POLICY "everyone_read_positions" ON job_positions FOR SELECT USING (true);

-- Only admins can manage
CREATE POLICY "admins_manage_departments" ON departments FOR ALL USING (public.is_admin());
CREATE POLICY "admins_manage_positions" ON job_positions FOR ALL USING (public.is_admin());
