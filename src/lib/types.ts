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

export interface Customer {
  id: string;
  stt: number | null;
  loai: string | null;
  ten_kh: string;
  ho_ten_day_du: string | null;
  so_dien_thoai: string | null;
  tuoi: string | null;
  dia_chi: string | null;
  nghe_nghiep: string | null;
  phan_loai_nghe_nghiep: string | null;
  ngay_ra_data: string | null;
  ngay_tao_lich: string | null;
  ngay_gio_thuc_hien: string | null;
  nguoi_tao_lich: string | null;
  phong_kinh_doanh: string | null;
  telesale: string | null;
  telesale_phu: string | null;
  le_tan: string | null;
  le_tan_phu_1: string | null;
  le_tan_phu_2: string | null;
  dich_vu_chinh: string | null;
  dich_vu_phat_sinh: string | null;
  nguon: string | null;
  nguon_gr: string | null;
  bac_si_mkt: string | null;
  team: string | null;
  bao_gia: string | null;
  ghi_chu_bao_gia: string | null;
  doanh_thu: string | null;
  no: string | null;
  cach_di_chuyen: string | null;
  ket_qua: string | null;
  ghi_chu_telesale: string | null;
  ghi_chu_co_so: string | null;
  chi_nhanh: string | null;
  source_file: string;
  source_type: string;
  bac_si: string | null;
  lich_phau_thuat: string | null;
  tong_so_buoi: string | null;
  tinh_trang_truoc_dieu_tri: string | null;
  phac_do_dieu_tri: string | null;
  thuoc_dieu_tri: string | null;
  may_cong_nghe_cao: string | null;
  tai_kham: string | null;
  lieu_trinh_dieu_tri: string | null;
  ky_thuat_vien: string | null;
  zalo_status: string | null;
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
