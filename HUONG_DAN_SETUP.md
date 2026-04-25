# Hướng Dẫn Cài Đặt và Chạy Ứng Dụng Chấm Công

## Yêu Cầu Hệ Thống

- Node.js >= 18
- npm (đi kèm Node.js)
- Tài khoản [Supabase](https://supabase.com) (miễn phí)
- Trình duyệt hỗ trợ Geolocation API (Chrome, Firefox, Edge...)

---

## 1. Cài Đặt Dependencies

```bash
npm install
```

---

## 2. Tạo Project Supabase

1. Truy cập [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Nhấn **New Project**, đặt tên và chọn region gần bạn
3. Đợi project khởi tạo xong

### Lấy thông tin kết nối

Vào **Project Settings > API**, copy 2 giá trị:
- **Project URL** (ví dụ: `https://abc123.supabase.co`)
- **anon public key** (bắt đầu bằng `eyJ...`)

---

## 3. Cấu Hình Biến Môi Trường

Copy file mẫu và điền thông tin:

```bash
copy .env.local.example .env.local
```

Mở file `.env.local` và thay thế:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4. Tạo Database Schema

Vào **Supabase Dashboard > SQL Editor**, copy toàn bộ nội dung file `supabase/migrations/001_initial_schema.sql` và chạy.

File này sẽ tạo:
- Bảng `office_locations` — địa điểm văn phòng
- Bảng `profiles` — thông tin nhân viên/admin
- Bảng `attendance_records` — bản ghi chấm công
- Các RLS policies để phân quyền truy cập

---

## 5. Tạo Tài Khoản Người Dùng

### Tạo tài khoản Admin

1. Vào **Supabase Dashboard > Authentication > Users**
2. Nhấn **Add User > Create New User**
3. Nhập email và password
4. Sau khi tạo xong, copy **User UID**
5. Vào **SQL Editor** chạy:

```sql
INSERT INTO profiles (id, full_name, email, role)
VALUES (
  'user-uid-vua-copy',
  'Admin',
  'admin@example.com',
  'admin'
);
```

### Tạo tài khoản Nhân viên

Lặp lại bước trên, nhưng đổi `role` thành `'employee'`:

```sql
INSERT INTO profiles (id, full_name, email, role)
VALUES (
  'user-uid-nhan-vien',
  'Nguyen Van A',
  'nhanvien@example.com',
  'employee'
);
```

---

## 6. Tạo Địa Điểm Văn Phòng

Chạy SQL để thêm ít nhất 1 địa điểm (thay tọa độ phù hợp với vị trí thực tế của bạn):

```sql
INSERT INTO office_locations (name, latitude, longitude, allowed_radius)
VALUES ('Văn phòng chính', 10.7769, 106.7009, 100);
```

> `allowed_radius` chỉ chấp nhận giá trị `50` hoặc `100` (mét).

### Gán địa điểm cho nhân viên

```sql
UPDATE profiles
SET office_location_id = (SELECT id FROM office_locations WHERE name = 'Văn phòng chính')
WHERE email = 'nhanvien@example.com';
```

---

## 7. Chạy Ứng Dụng

```bash
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

---

## 8. Sử Dụng

### Đăng nhập

- Truy cập `/login`
- Nhập email/password đã tạo ở bước 5
- Hệ thống tự chuyển hướng:
  - **Admin** → `/admin/dashboard`
  - **Nhân viên** → `/dashboard`

### Nhân viên

| Trang | Đường dẫn | Chức năng |
|-------|-----------|-----------|
| Chấm công | `/dashboard` | Check-in / Check-out (cần bật GPS) |
| Lịch sử | `/history` | Xem lịch sử chấm công, lọc theo ngày |

> Khi check-in/check-out, trình duyệt sẽ hỏi quyền truy cập vị trí. Bạn cần **cho phép** để tính năng hoạt động.

### Admin

| Trang | Đường dẫn | Chức năng |
|-------|-----------|-----------|
| Tổng quan | `/admin/dashboard` | Dashboard admin |
| Nhân viên | `/admin/employees` | Quản lý nhân viên (thêm/sửa/tìm kiếm) |
| Địa điểm | `/admin/locations` | Quản lý địa điểm chấm công |
| Báo cáo | `/admin/reports` | Xem báo cáo, xuất CSV |

---

## 9. Chạy Tests

```bash
npm test
```

Hoặc chạy ở chế độ watch (tự chạy lại khi code thay đổi):

```bash
npm run test:watch
```

---

## 10. Build Production

```bash
npm run build
npm start
```

---

## Cấu Trúc Thư Mục Chính

```
src/
├── app/
│   ├── (auth)/login/       — Trang đăng nhập
│   ├── (app)/              — Phần nhân viên
│   │   ├── dashboard/      — Trang chấm công
│   │   └── history/        — Lịch sử chấm công
│   ├── (admin)/            — Phần admin
│   │   ├── dashboard/      — Tổng quan
│   │   ├── employees/      — Quản lý nhân viên
│   │   ├── locations/      — Quản lý địa điểm
│   │   └── reports/        — Báo cáo
│   └── api/                — API endpoints
├── lib/
│   ├── geo/haversine.ts    — Tính khoảng cách GPS
│   ├── attendance/         — Logic chấm công & state machine
│   ├── admin/              — Logic báo cáo
│   ├── auth/actions.ts     — Server actions đăng nhập/đăng xuất
│   ├── supabase/           — Supabase client (server + browser)
│   ├── types.ts            — TypeScript types
│   └── serialization.ts    — Serialize/deserialize attendance records
├── middleware.ts            — Auth + phân quyền routing
supabase/
└── migrations/             — SQL schema
```

---

## Xử Lý Sự Cố

| Vấn đề | Giải pháp |
|--------|-----------|
| Không check-in được | Kiểm tra đã bật GPS trên trình duyệt và cho phép quyền truy cập vị trí |
| Báo "ngoài bán kính" | Bạn đang ở quá xa địa điểm văn phòng. Kiểm tra tọa độ trong `office_locations` |
| Lỗi đăng nhập | Kiểm tra email/password. Đảm bảo đã tạo profile trong bảng `profiles` |
| Nhân viên vào được trang admin | Kiểm tra role trong bảng `profiles` phải là `'employee'` |
| Lỗi kết nối Supabase | Kiểm tra lại `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` trong `.env.local` |
