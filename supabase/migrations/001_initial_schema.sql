-- =====================================================================
-- Attendance App - Initial Database Schema
-- Chạy toàn bộ file này trong Supabase Dashboard > SQL Editor
-- =====================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- office_locations
-- ---------------------------------------------------------------------
create table if not exists public.office_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  allowed_radius integer not null default 100 check (allowed_radius in (50, 100)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- departments
-- ---------------------------------------------------------------------
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- job_positions
-- ---------------------------------------------------------------------
create table if not exists public.job_positions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_id uuid references public.departments(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- profiles (liên kết auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  role text not null default 'employee' check (role in ('employee', 'admin')),
  office_location_id uuid references public.office_locations(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  job_position_id uuid references public.job_positions(id) on delete set null,
  is_active boolean not null default true,
  date_of_birth date,
  position text,
  address text,
  phone_number text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- work_shifts
-- ---------------------------------------------------------------------
create table if not exists public.work_shifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- employee_schedules
-- ---------------------------------------------------------------------
create table if not exists public.employee_schedules (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  shift_id uuid not null references public.work_shifts(id) on delete cascade,
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- holidays
-- ---------------------------------------------------------------------
create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- leave_requests
-- ---------------------------------------------------------------------
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  leave_type text not null default 'annual' check (leave_type in ('annual', 'sick', 'unpaid', 'other')),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- attendance_records
-- ---------------------------------------------------------------------
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  check_in_time timestamptz not null,
  check_out_time timestamptz,
  check_in_latitude double precision not null,
  check_in_longitude double precision not null,
  check_out_latitude double precision,
  check_out_longitude double precision,
  work_hours double precision,
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'system' check (type in ('attendance', 'leave', 'system')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- system_settings (key/value)
-- ---------------------------------------------------------------------
create table if not exists public.system_settings (
  id text primary key,
  value text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  stt integer,
  loai text,
  ten_kh text not null default '',
  ho_ten_day_du text,
  so_dien_thoai text,
  tuoi text,
  dia_chi text,
  nghe_nghiep text,
  phan_loai_nghe_nghiep text,
  ngay_ra_data text,
  ngay_tao_lich text,
  ngay_gio_thuc_hien text,
  nguoi_tao_lich text,
  phong_kinh_doanh text,
  telesale text,
  telesale_phu text,
  le_tan text,
  le_tan_phu_1 text,
  le_tan_phu_2 text,
  dich_vu_chinh text,
  dich_vu_phat_sinh text,
  nguon text,
  nguon_gr text,
  bac_si_mkt text,
  team text,
  bao_gia text,
  ghi_chu_bao_gia text,
  doanh_thu text,
  no text,
  cach_di_chuyen text,
  ket_qua text,
  ghi_chu_telesale text,
  ghi_chu_co_so text,
  chi_nhanh text,
  source_file text not null default '',
  source_type text not null default '',
  bac_si text,
  lich_phau_thuat text,
  tong_so_buoi text,
  tinh_trang_truoc_dieu_tri text,
  phac_do_dieu_tri text,
  thuoc_dieu_tri text,
  may_cong_nghe_cao text,
  tai_kham text,
  lieu_trinh_dieu_tri text,
  ky_thuat_vien text,
  zalo_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
create index if not exists idx_attendance_employee on public.attendance_records(employee_id);
create index if not exists idx_attendance_date on public.attendance_records(date);
create index if not exists idx_leave_employee on public.leave_requests(employee_id);
create index if not exists idx_schedules_employee on public.employee_schedules(employee_id);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_job_positions_dept on public.job_positions(department_id);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles            enable row level security;
alter table public.office_locations    enable row level security;
alter table public.departments         enable row level security;
alter table public.job_positions       enable row level security;
alter table public.work_shifts         enable row level security;
alter table public.employee_schedules  enable row level security;
alter table public.holidays            enable row level security;
alter table public.leave_requests      enable row level security;
alter table public.attendance_records  enable row level security;
alter table public.notifications       enable row level security;
alter table public.system_settings     enable row level security;
alter table public.customers           enable row level security;

-- Helper: kiểm tra admin (dùng SECURITY DEFINER để tránh đệ quy RLS)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert" on public.profiles
  for insert with check (public.is_admin() or auth.uid() = id);

drop policy if exists "profiles_admin_delete" on public.profiles;
create policy "profiles_admin_delete" on public.profiles
  for delete using (public.is_admin());

-- attendance_records: nhân viên thao tác record của mình, admin xem tất cả
drop policy if exists "attendance_select" on public.attendance_records;
create policy "attendance_select" on public.attendance_records
  for select using (auth.uid() = employee_id or public.is_admin());

drop policy if exists "attendance_insert" on public.attendance_records;
create policy "attendance_insert" on public.attendance_records
  for insert with check (auth.uid() = employee_id);

drop policy if exists "attendance_update" on public.attendance_records;
create policy "attendance_update" on public.attendance_records
  for update using (auth.uid() = employee_id or public.is_admin());

-- leave_requests
drop policy if exists "leave_select" on public.leave_requests;
create policy "leave_select" on public.leave_requests
  for select using (auth.uid() = employee_id or public.is_admin());

drop policy if exists "leave_insert" on public.leave_requests;
create policy "leave_insert" on public.leave_requests
  for insert with check (auth.uid() = employee_id or public.is_admin());

drop policy if exists "leave_update" on public.leave_requests;
create policy "leave_update" on public.leave_requests
  for update using (auth.uid() = employee_id or public.is_admin());

-- notifications
drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications
  for update using (auth.uid() = user_id);

drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert" on public.notifications
  for insert with check (true);

-- employee_schedules
drop policy if exists "schedules_select" on public.employee_schedules;
create policy "schedules_select" on public.employee_schedules
  for select using (auth.uid() = employee_id or public.is_admin());

drop policy if exists "schedules_admin_write" on public.employee_schedules;
create policy "schedules_admin_write" on public.employee_schedules
  for all using (public.is_admin()) with check (public.is_admin());

-- Các bảng đọc chung cho authenticated, chỉ admin ghi
-- office_locations
drop policy if exists "loc_read" on public.office_locations;
create policy "loc_read" on public.office_locations
  for select using (auth.role() = 'authenticated');
drop policy if exists "loc_admin_write" on public.office_locations;
create policy "loc_admin_write" on public.office_locations
  for all using (public.is_admin()) with check (public.is_admin());

-- departments
drop policy if exists "dept_read" on public.departments;
create policy "dept_read" on public.departments
  for select using (auth.role() = 'authenticated');
drop policy if exists "dept_admin_write" on public.departments;
create policy "dept_admin_write" on public.departments
  for all using (public.is_admin()) with check (public.is_admin());

-- job_positions
drop policy if exists "job_read" on public.job_positions;
create policy "job_read" on public.job_positions
  for select using (auth.role() = 'authenticated');
drop policy if exists "job_admin_write" on public.job_positions;
create policy "job_admin_write" on public.job_positions
  for all using (public.is_admin()) with check (public.is_admin());

-- work_shifts
drop policy if exists "shift_read" on public.work_shifts;
create policy "shift_read" on public.work_shifts
  for select using (auth.role() = 'authenticated');
drop policy if exists "shift_admin_write" on public.work_shifts;
create policy "shift_admin_write" on public.work_shifts
  for all using (public.is_admin()) with check (public.is_admin());

-- holidays
drop policy if exists "holiday_read" on public.holidays;
create policy "holiday_read" on public.holidays
  for select using (auth.role() = 'authenticated');
drop policy if exists "holiday_admin_write" on public.holidays;
create policy "holiday_admin_write" on public.holidays
  for all using (public.is_admin()) with check (public.is_admin());

-- system_settings
drop policy if exists "settings_read" on public.system_settings;
create policy "settings_read" on public.system_settings
  for select using (auth.role() = 'authenticated');
drop policy if exists "settings_admin_write" on public.system_settings;
create policy "settings_admin_write" on public.system_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- customers (chỉ admin)
drop policy if exists "customers_admin_all" on public.customers;
create policy "customers_admin_all" on public.customers
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Trigger: tự tạo profile khi có user mới trong auth.users
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'employee')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Seed: cấu hình mặc định
-- =====================================================================
insert into public.system_settings (id, value)
values
  ('standard_work_days', '22'),
  ('company_name', 'Attendance App'),
  ('company_logo', '')
on conflict (id) do nothing;
