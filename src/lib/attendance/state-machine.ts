/**
 * Attendance state machine.
 *
 * States: no_record → checked_in → checked_out
 * Each state has a fixed set of available actions.
 */

export type AttendanceState = "no_record" | "checked_in" | "checked_out";
export type AttendanceAction = "check_in" | "check_out";

export interface AttendanceRecord {
  check_in_time: string | null;
  check_out_time: string | null;
}

/**
 * Derives the current attendance state from a record (or lack thereof).
 *
 * - No record (or null) → no_record
 * - Record with check_in but no check_out → checked_in
 * - Record with both check_in and check_out → checked_out
 */
export function getAttendanceState(
  record: AttendanceRecord | null | undefined
): AttendanceState {
  if (!record || !record.check_in_time) {
    return "no_record";
  }
  if (!record.check_out_time) {
    return "checked_in";
  }
  return "checked_out";
}

/**
 * Returns the list of actions available for a given attendance state.
 *
 * - no_record  → [check_in]
 * - checked_in → [check_out]
 * - checked_out → [check_in] (Enable multiple sessions)
 */
export function getAvailableActions(
  state: AttendanceState
): AttendanceAction[] {
  switch (state) {
    case "no_record":
    case "checked_out":
      return ["check_in"];
    case "checked_in":
      return ["check_out"];
    default:
      return [];
  }
}
