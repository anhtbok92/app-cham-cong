-- Remove the unique constraint that limits one attendance record per employee per day
ALTER TABLE public.attendance_records
DROP CONSTRAINT IF EXISTS attendance_records_employee_id_date_key;

-- We keep the 'date' column for easy querying, but it's no longer part of a unique key.
