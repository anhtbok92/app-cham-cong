-- 1. Remove the unique constraint that limits one record per employee per day
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_employee_id_date_key;

-- 2. Add an index for performance since we'll have more records now
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, date);
