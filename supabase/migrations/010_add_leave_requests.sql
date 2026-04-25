-- 1. leave_requests table
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'unpaid', 'other')),
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  comment TEXT, -- admin comment
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

-- 2. Enable RLS
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Employees can see their own requests
CREATE POLICY "employees_read_own_leave" ON leave_requests
  FOR SELECT USING (auth.uid() = employee_id);

-- Employees can create their own requests
CREATE POLICY "employees_create_own_leave" ON leave_requests
  FOR INSERT WITH CHECK (auth.uid() = employee_id);

-- Admins can manage all
CREATE POLICY "admins_manage_all_leave" ON leave_requests
  FOR ALL USING (public.is_admin());
