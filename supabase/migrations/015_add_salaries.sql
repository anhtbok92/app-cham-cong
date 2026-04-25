-- 1. salaries table
CREATE TABLE salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- YYYY-MM
  base_salary DECIMAL(15,2) DEFAULT 0,
  work_days DECIMAL(5,2) DEFAULT 0,
  standard_days INTEGER DEFAULT 26,
  allowance DECIMAL(15,2) DEFAULT 0,
  bonus DECIMAL(15,2) DEFAULT 0,
  commission DECIMAL(15,2) DEFAULT 0,
  total_salary DECIMAL(15,2) DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, paid
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, month)
);

-- 2. Enable RLS
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "admins_manage_salaries" ON salaries
  FOR ALL USING (public.is_admin());

CREATE POLICY "employees_view_own_salary" ON salaries
  FOR SELECT USING (auth.uid() = employee_id);
