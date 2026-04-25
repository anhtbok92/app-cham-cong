# Requirements Document

## Introduction

Ứng dụng chấm công (Attendance App) xây dựng trên Next.js và Supabase, nằm trong cùng một repository nhưng chia thành hai phần: phần App dành cho nhân viên và phần Admin dành cho quản trị viên. Hệ thống cho phép nhân viên check-in/check-out hàng ngày, xem lịch sử chấm công, trong khi quản trị viên có thể quản lý nhân viên, xem báo cáo và cấu hình quy tắc chấm công.

## Glossary

- **Attendance_App**: Ứng dụng chấm công tổng thể bao gồm cả phần App và phần Admin
- **App**: Phần giao diện dành cho nhân viên để thực hiện chấm công
- **Admin_Panel**: Phần giao diện dành cho quản trị viên để quản lý hệ thống
- **Employee**: Người dùng có vai trò nhân viên, sử dụng App để chấm công
- **Administrator**: Người dùng có vai trò quản trị, sử dụng Admin_Panel để quản lý
- **Attendance_Record**: Bản ghi chấm công chứa thông tin check-in, check-out của một nhân viên trong một ngày
- **Check_In**: Hành động ghi nhận thời điểm bắt đầu làm việc
- **Check_Out**: Hành động ghi nhận thời điểm kết thúc làm việc
- **Work_Hours**: Số giờ làm việc được tính từ thời điểm Check_In đến Check_Out
- **Supabase_Auth**: Dịch vụ xác thực người dùng của Supabase
- **Role**: Vai trò của người dùng trong hệ thống (employee hoặc admin)
- **Office_Location**: Vị trí văn phòng/địa điểm làm việc được cấu hình sẵn, bao gồm tọa độ GPS (latitude, longitude) và bán kính cho phép (Allowed_Radius)
- **Allowed_Radius**: Khoảng cách tối đa (tính bằng mét) mà Employee được phép check-in/check-out so với Office_Location, có thể cấu hình là 50m hoặc 100m
- **Geolocation**: Tọa độ GPS hiện tại của thiết bị Employee, lấy qua Browser Geolocation API
- **Distance**: Khoảng cách tính bằng mét giữa Geolocation của Employee và Office_Location, sử dụng công thức Haversine

## Requirements

### Requirement 1: Xác thực người dùng

**User Story:** As an Employee or Administrator, I want to log in to the system securely, so that I can access the features appropriate to my role.

#### Acceptance Criteria

1. WHEN a user submits valid credentials, THE Supabase_Auth SHALL authenticate the user and return a session token
2. WHEN a user submits invalid credentials, THE Supabase_Auth SHALL reject the login attempt and display an error message
3. WHEN an authenticated user accesses the Attendance_App, THE Attendance_App SHALL redirect the user to the App or Admin_Panel based on the user's Role
4. WHEN an unauthenticated user attempts to access a protected route, THE Attendance_App SHALL redirect the user to the login page
5. WHEN a user logs out, THE Supabase_Auth SHALL invalidate the session and redirect to the login page

### Requirement 2: Check-in / Check-out cho nhân viên

**User Story:** As an Employee, I want to check in and check out each day, so that my working hours are recorded accurately.

#### Acceptance Criteria

1. WHEN an Employee presses the check-in button and the Distance between the Employee's Geolocation and the assigned Office_Location is within the Allowed_Radius, THE App SHALL create an Attendance_Record with the current timestamp as the check-in time and the Employee's Geolocation
2. WHEN an Employee presses the check-in button and the Distance exceeds the Allowed_Radius, THE App SHALL reject the check-in and display the current Distance and the required Allowed_Radius
3. WHEN an Employee has already checked in today and presses the check-out button and the Distance is within the Allowed_Radius, THE App SHALL update the existing Attendance_Record with the current timestamp as the check-out time
4. WHEN an Employee has already checked in today and presses the check-out button and the Distance exceeds the Allowed_Radius, THE App SHALL reject the check-out and display the current Distance and the required Allowed_Radius
5. WHEN an Employee has already checked in today, THE App SHALL display the check-out button instead of the check-in button
6. WHEN an Employee has already checked out today, THE App SHALL disable both check-in and check-out buttons for the remainder of the day
7. IF an Employee attempts to check in more than once per day, THEN THE App SHALL prevent the duplicate check-in and display a notification
8. WHEN an Attendance_Record has both check-in and check-out times, THE App SHALL calculate and store the Work_Hours
9. IF the Browser Geolocation API is unavailable or the Employee denies location permission, THEN THE App SHALL prevent check-in and check-out and display a message requesting location access

### Requirement 3: Xem lịch sử chấm công

**User Story:** As an Employee, I want to view my attendance history, so that I can track my working hours over time.

#### Acceptance Criteria

1. WHEN an Employee navigates to the history page, THE App SHALL display a list of Attendance_Records for the current month by default
2. WHEN an Employee selects a date range filter, THE App SHALL display Attendance_Records within the selected range
3. THE App SHALL display each Attendance_Record with check-in time, check-out time, and calculated Work_Hours
4. WHEN an Attendance_Record is missing a check-out time, THE App SHALL display the record with a visual indicator showing incomplete status

### Requirement 4: Quản lý nhân viên (Admin)

**User Story:** As an Administrator, I want to manage employee accounts, so that I can control who has access to the system.

#### Acceptance Criteria

1. WHEN an Administrator navigates to the employee management page, THE Admin_Panel SHALL display a paginated list of all Employees
2. WHEN an Administrator creates a new employee account, THE Admin_Panel SHALL create the user in Supabase_Auth with the employee Role
3. WHEN an Administrator deactivates an employee account, THE Admin_Panel SHALL prevent that Employee from logging in while preserving existing Attendance_Records
4. WHEN an Administrator searches for an employee by name or email, THE Admin_Panel SHALL filter and display matching results
5. WHEN an Administrator edits employee information, THE Admin_Panel SHALL update the employee profile and persist changes to Supabase

### Requirement 5: Xem báo cáo chấm công (Admin)

**User Story:** As an Administrator, I want to view attendance reports for all employees, so that I can monitor workforce attendance and working hours.

#### Acceptance Criteria

1. WHEN an Administrator navigates to the reports page, THE Admin_Panel SHALL display a summary of attendance for all Employees for the current month
2. WHEN an Administrator selects a specific Employee, THE Admin_Panel SHALL display detailed Attendance_Records for that Employee
3. WHEN an Administrator selects a date range, THE Admin_Panel SHALL filter the report data to the selected range
4. THE Admin_Panel SHALL display total Work_Hours, number of days present, and number of days absent for each Employee in the report
5. WHEN an Administrator exports the report, THE Admin_Panel SHALL generate a downloadable CSV file containing the filtered report data

### Requirement 6: Phân quyền truy cập

**User Story:** As a system owner, I want role-based access control, so that employees and administrators can only access features appropriate to their roles.

#### Acceptance Criteria

1. WHILE a user has the employee Role, THE Attendance_App SHALL restrict access to App routes only
2. WHILE a user has the admin Role, THE Attendance_App SHALL grant access to both App and Admin_Panel routes
3. WHEN a user with the employee Role attempts to access an Admin_Panel route, THE Attendance_App SHALL deny access and redirect to the App
4. THE Attendance_App SHALL enforce role-based access at both the client-side routing level and the Supabase Row Level Security policy level

### Requirement 7: Lưu trữ dữ liệu với Supabase

**User Story:** As a developer, I want attendance data stored in Supabase, so that data is persistent, secure, and queryable.

#### Acceptance Criteria

1. THE Attendance_App SHALL store all Attendance_Records in a Supabase PostgreSQL database
2. THE Attendance_App SHALL use Supabase Row Level Security to ensure Employees can only read their own Attendance_Records
3. THE Attendance_App SHALL use Supabase Row Level Security to allow Administrators to read all Attendance_Records
4. WHEN an Attendance_Record is created or updated, THE Attendance_App SHALL persist the change to Supabase immediately
5. WHEN storing an Attendance_Record, THE Attendance_App SHALL serialize the record as a JSON-compatible row in the database
6. FOR ALL valid Attendance_Record objects, serializing then deserializing from the database SHALL produce an equivalent object (round-trip property)

### Requirement 8: Cấu hình địa điểm chấm công (Admin)

**User Story:** As an Administrator, I want to configure office locations and allowed check-in radius, so that employees can only check in when they are physically present at the workplace.

#### Acceptance Criteria

1. WHEN an Administrator navigates to the location settings page, THE Admin_Panel SHALL display a list of all configured Office_Locations with their coordinates and Allowed_Radius
2. WHEN an Administrator creates a new Office_Location, THE Admin_Panel SHALL store the location name, latitude, longitude, and Allowed_Radius in Supabase
3. WHEN an Administrator edits an Office_Location, THE Admin_Panel SHALL update the coordinates or Allowed_Radius and persist changes to Supabase
4. WHEN an Administrator sets the Allowed_Radius, THE Admin_Panel SHALL accept values of 50 meters or 100 meters
5. WHEN an Administrator deletes an Office_Location, THE Admin_Panel SHALL remove the location from the system while preserving existing Attendance_Records that reference the location
6. WHEN an Administrator assigns an Office_Location to an Employee, THE Admin_Panel SHALL link that Employee to the specified Office_Location for check-in validation
