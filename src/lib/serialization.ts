/**
 * Serialization / deserialization utilities for AttendanceRecord.
 *
 * "Serialize" converts an AttendanceRecord into a plain JSON-compatible
 * database row object. "Deserialize" converts a raw database row back
 * into a typed AttendanceRecord.
 *
 * The round-trip property must hold:
 *   deserializeAttendanceRecord(serializeAttendanceRecord(record)) ≡ record
 */

import type { AttendanceRecord } from "./types";

/**
 * The shape of a raw attendance row coming from the database.
 * All values are JSON primitives (string | number | null).
 */
export interface AttendanceRecordRow {
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

/**
 * Serializes an AttendanceRecord into a JSON-compatible database row.
 */
export function serializeAttendanceRecord(
  record: AttendanceRecord
): AttendanceRecordRow {
  return {
    id: record.id,
    employee_id: record.employee_id,
    check_in_time: record.check_in_time,
    check_out_time: record.check_out_time,
    check_in_latitude: record.check_in_latitude,
    check_in_longitude: record.check_in_longitude,
    check_out_latitude: record.check_out_latitude,
    check_out_longitude: record.check_out_longitude,
    work_hours: record.work_hours,
    date: record.date,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

/**
 * Deserializes a raw database row into a typed AttendanceRecord.
 */
export function deserializeAttendanceRecord(
  row: AttendanceRecordRow
): AttendanceRecord {
  return {
    id: row.id,
    employee_id: row.employee_id,
    check_in_time: row.check_in_time,
    check_out_time: row.check_out_time,
    check_in_latitude: row.check_in_latitude,
    check_in_longitude: row.check_in_longitude,
    check_out_latitude: row.check_out_latitude,
    check_out_longitude: row.check_out_longitude,
    work_hours: row.work_hours,
    date: row.date,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
