/**
 * Report computation and CSV generation utilities.
 * Requirements: 5.4, 5.5
 */

import type { AttendanceRecord } from "@/lib/types";

export interface ReportSummary {
  employeeId: string;
  employeeName: string;
  totalWorkHours: number;
  daysPresent: number;
  daysAbsent: number;
  records: AttendanceRecord[];
}

/**
 * Count working days (Mon-Fri) in a date range inclusive.
 */
export function countWorkingDays(startDate: string, endDate: string): number {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Compute a report summary for one employee.
 */
export function computeSummary(
  employeeId: string,
  employeeName: string,
  records: AttendanceRecord[],
  startDate: string,
  endDate: string
): ReportSummary {
  const totalWorkHours = records.reduce(
    (sum, r) => sum + (r.work_hours ?? 0),
    0
  );
  const daysPresent = records.filter((r) => r.check_in_time).length;
  const totalWorkingDays = countWorkingDays(startDate, endDate);
  const daysAbsent = Math.max(0, totalWorkingDays - daysPresent);

  return {
    employeeId,
    employeeName,
    totalWorkHours: Math.round(totalWorkHours * 100) / 100,
    daysPresent,
    daysAbsent,
    records,
  };
}

/**
 * Generate CSV string from report summaries.
 */
export function generateCSV(reports: ReportSummary[]): string {
  const header = "Tên nhân viên,Tổng giờ làm,Ngày có mặt,Ngày vắng";
  const rows = reports.map(
    (r) =>
      `"${r.employeeName.replace(/"/g, '""')}",${r.totalWorkHours},${r.daysPresent},${r.daysAbsent}`
  );
  return [header, ...rows].join("\n");
}

/**
 * Generate a detailed CSV string for individual records.
 */
export function generateDetailedCSV(records: any[]): string {
  const header = "Tên nhân viên,Ngày,Giờ vào,Giờ ra,Tổng giờ";
  const rows = records.map((r) => {
    const checkIn = r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString("vi-VN") : "-";
    const checkOut = r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString("vi-VN") : "-";
    return `"${r.employee_name.replace(/"/g, '""')}",${r.date},${checkIn},${checkOut},${r.work_hours || 0}`;
  });
  return [header, ...rows].join("\n");
}
