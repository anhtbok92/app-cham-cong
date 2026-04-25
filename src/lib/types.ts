/**
 * Core TypeScript types for the Attendance App.
 * These map directly to the Supabase PostgreSQL tables.
 */

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: "employee" | "admin";
  office_location_id: string | null;
  department_id: string | null;
  job_position_id: string | null;
  is_active: boolean;
  date_of_birth: string | null;
  position: string | null;
  address: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
  departments?: { name: string };
  job_positions?: { name: string };
}

export interface Department {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface JobPosition {
  id: string;
  name: string;
  department_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkShift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeSchedule {
  id: string;
  employee_id: string;
  shift_id: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  leave_type: "annual" | "sick" | "unpaid" | "other";
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface OfficeLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  allowed_radius: 50 | 100;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  check_in_time: string;
  check_out_time: string | null;
  check_in_latitude: number;
  check_in_longitude: number;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  work_hours: number | null;
  date: string;
  created_at: string;
  updated_at: string;
}
