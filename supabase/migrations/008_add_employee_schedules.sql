-- 1. employee_schedules table
CREATE TABLE employee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES work_shifts(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- NULL means ongoing
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, start_date)
);

-- 2. Enable RLS
ALTER TABLE employee_schedules ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "everyone_read_schedules" ON employee_schedules FOR SELECT USING (true);
CREATE POLICY "admins_manage_schedules" ON employee_schedules FOR ALL USING (public.is_admin());
