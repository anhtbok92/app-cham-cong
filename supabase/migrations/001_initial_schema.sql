-- ============================================================
-- Attendance App: Initial Schema
-- Tables: office_locations, profiles, attendance_records
-- Includes RLS policies for role-based access control
-- ============================================================

-- 1. office_locations (must be created before profiles due to FK)
CREATE TABLE office_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  allowed_radius INTEGER NOT NULL CHECK (allowed_radius IN (50, 100)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('employee', 'admin')) DEFAULT 'employee',
  office_location_id UUID REFERENCES office_locations(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. attendance_records
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id),
  check_in_time TIMESTAMPTZ NOT NULL,
  check_out_time TIMESTAMPTZ,
  check_in_latitude DOUBLE PRECISION NOT NULL,
  check_in_longitude DOUBLE PRECISION NOT NULL,
  check_out_latitude DOUBLE PRECISION,
  check_out_longitude DOUBLE PRECISION,
  work_hours NUMERIC(5,2),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- ============================================================
-- Row Level Security
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE office_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- 1. Create a function to check if a user is an admin without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- office_locations policies
-- ============================================================

-- All employees can read locations (needed for check-in validation)
CREATE POLICY "employees_read_locations" ON office_locations
  FOR SELECT USING (true);

-- Only admins can manage (insert, update, delete) locations
CREATE POLICY "admins_manage_locations" ON office_locations
  FOR ALL USING (is_admin());

-- ============================================================
-- profiles policies
-- ============================================================

-- Users can read their own profile
CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can manage all profiles
CREATE POLICY "admins_manage_profiles" ON profiles
  FOR ALL USING (is_admin());

-- ============================================================
-- attendance_records policies
-- ============================================================

-- Employees can read their own records
CREATE POLICY "employees_read_own" ON attendance_records
  FOR SELECT USING (auth.uid() = employee_id);

-- Employees can insert their own records
CREATE POLICY "employees_insert_own" ON attendance_records
  FOR INSERT WITH CHECK (auth.uid() = employee_id);

-- Employees can update their own records
CREATE POLICY "employees_update_own" ON attendance_records
  FOR UPDATE USING (auth.uid() = employee_id);

-- Admins can read all records
CREATE POLICY "admins_read_all" ON attendance_records
  FOR SELECT USING (is_admin());
