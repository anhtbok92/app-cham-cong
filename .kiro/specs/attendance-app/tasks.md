# Implementation Plan: Attendance App

## Overview

Triển khai ứng dụng chấm công Next.js + Supabase theo kiến trúc monorepo với route groups. Bắt đầu từ setup project, core logic (Haversine, state machine), data layer, rồi đến UI và wiring.

## Tasks

- [x] 1. Setup project và cấu hình cơ bản
  - Khởi tạo Next.js 14 project với App Router, TypeScript, Tailwind CSS
  - Cài đặt dependencies: `@supabase/ssr`, `@supabase/supabase-js`, `fast-check`, `vitest`
  - Tạo cấu trúc thư mục: `/(auth)`, `/(app)`, `/(admin)`, `lib/`
  - Cấu hình Supabase client (server + browser)
  - Cấu hình Vitest
  - _Requirements: 7.1_

- [-] 2. Implement Geolocation module
  - [x] 2.1 Implement hàm Haversine distance và isWithinAllowedRadius
    - Tạo `lib/geo/haversine.ts` với hàm `calculateDistance` và `isWithinAllowedRadius`
    - Validate input coordinates (latitude [-90, 90], longitude [-180, 180])
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ]* 2.2 Write property tests cho Haversine (Property 1: Symmetry and identity)
    - **Property 1: Haversine distance calculation is correct and symmetric**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  - [ ]* 2.3 Write property tests cho distance validation (Property 2: Distance-based validation)
    - **Property 2: Distance-based check-in/out validation**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  - [ ]* 2.4 Write property test cho allowed radius validation (Property 12: Allowed radius)
    - **Property 12: Allowed radius validation**
    - **Validates: Requirements 8.4**

- [-] 3. Implement Attendance logic module
  - [x] 3.1 Implement attendance state machine và work hours calculation
    - Tạo `lib/attendance/state-machine.ts` với hàm `getAttendanceState` và `getAvailableActions`
    - Tạo `lib/attendance/work-hours.ts` với hàm `calculateWorkHours`
    - States: `no_record`, `checked_in`, `checked_out`
    - _Requirements: 2.5, 2.6, 2.7, 2.8_
  - [ ]* 3.2 Write property test cho state machine (Property 3: Attendance state machine)
    - **Property 3: Attendance state machine transitions**
    - **Validates: Requirements 2.5, 2.6, 2.7**
  - [ ]* 3.3 Write property test cho work hours (Property 4: Work hours calculation)
    - **Property 4: Work hours calculation**
    - **Validates: Requirements 2.8**

- [-] 4. Implement data models và serialization
  - [x] 4.1 Tạo TypeScript types và serialization functions
    - Tạo `lib/types.ts` với interfaces Profile, OfficeLocation, AttendanceRecord
    - Tạo `lib/serialization.ts` với hàm serialize/deserialize cho AttendanceRecord
    - _Requirements: 7.5, 7.6_
  - [ ]* 4.2 Write property test cho serialization round-trip (Property 7)
    - **Property 7: Attendance record serialization round-trip**
    - **Validates: Requirements 7.5, 7.6**

- [x] 5. Checkpoint - Core logic tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Setup Supabase schema và RLS
  - Tạo SQL migration file `supabase/migrations/001_initial_schema.sql`
  - Bao gồm: bảng `profiles`, `office_locations`, `attendance_records`
  - Cấu hình RLS policies cho cả 3 bảng
  - _Requirements: 7.1, 7.2, 7.3, 6.4_

- [x] 7. Implement Authentication module
  - [x] 7.1 Tạo Supabase auth helpers và middleware
    - Tạo `lib/supabase/server.ts` và `lib/supabase/client.ts`
    - Tạo `middleware.ts` xử lý auth session check và role-based redirect
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [ ]* 7.2 Write property test cho role-based access (Property 6)
    - **Property 6: Role-based route access**
    - **Validates: Requirements 6.1, 6.2, 6.3**
  - [x] 7.3 Tạo trang login
    - Tạo `app/(auth)/login/page.tsx` với form đăng nhập
    - Xử lý redirect sau login dựa trên role
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 8. Implement Employee App pages
  - [x] 8.1 Tạo layout và dashboard cho nhân viên
    - Tạo `app/(app)/layout.tsx` với navigation
    - Tạo `app/(app)/dashboard/page.tsx` với nút check-in/check-out
    - Tích hợp Browser Geolocation API
    - Gọi Haversine validation trước khi check-in/out
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.9_
  - [x] 8.2 Tạo API routes cho check-in/check-out
    - Tạo `app/api/attendance/check-in/route.ts`
    - Tạo `app/api/attendance/check-out/route.ts`
    - Validate distance server-side, create/update attendance record
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 2.8_
  - [x] 8.3 Tạo trang lịch sử chấm công
    - Tạo `app/(app)/history/page.tsx`
    - Hiển thị danh sách records với date range filter
    - Hiển thị visual indicator cho records thiếu check-out
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 8.4 Write property test cho date range filtering (Property 5)
    - **Property 5: Date range filtering returns only records within range**
    - **Validates: Requirements 3.2, 5.3**

- [x] 9. Implement Admin Panel pages
  - [x] 9.1 Tạo layout admin
    - Tạo `app/(admin)/layout.tsx` với admin navigation
    - _Requirements: 6.1, 6.2_
  - [x] 9.2 Tạo trang quản lý nhân viên
    - Tạo `app/(admin)/employees/page.tsx`
    - CRUD nhân viên với pagination và search
    - Tạo API routes: `app/api/admin/employees/route.ts`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ]* 9.3 Write property tests cho employee search và pagination (Property 10, 11)
    - **Property 10: Employee search filtering**
    - **Validates: Requirements 4.4**
    - **Property 11: Pagination correctness**
    - **Validates: Requirements 4.1**
  - [x] 9.4 Tạo trang cấu hình địa điểm
    - Tạo `app/(admin)/locations/page.tsx`
    - CRUD office locations, assign location cho employee
    - Tạo API routes: `app/api/admin/locations/route.ts`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  - [x] 9.5 Tạo trang báo cáo chấm công
    - Tạo `app/(admin)/reports/page.tsx`
    - Hiển thị summary với filter theo employee và date range
    - Implement CSV export
    - Tạo API routes: `app/api/admin/reports/route.ts`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [ ]* 9.6 Write property tests cho report summary và CSV (Property 8, 9)
    - **Property 8: Report summary computation**
    - **Validates: Requirements 5.4**
    - **Property 9: CSV export contains all report data**
    - **Validates: Requirements 5.5**

- [x] 10. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with minimum 100 iterations
- Checkpoints ensure incremental validation
