-- Fix RLS Recursion in profiles table
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

-- 2. Drop existing recursive policies
DROP POLICY IF EXISTS "admins_manage_locations" ON office_locations;
DROP POLICY IF EXISTS "admins_manage_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_read_all" ON attendance_records;

-- 3. Re-create policies using the is_admin() function
CREATE POLICY "admins_manage_locations" ON office_locations
  FOR ALL USING (is_admin());

CREATE POLICY "admins_manage_profiles" ON profiles
  FOR ALL USING (is_admin());

CREATE POLICY "admins_read_all" ON attendance_records
  FOR SELECT USING (is_admin());
