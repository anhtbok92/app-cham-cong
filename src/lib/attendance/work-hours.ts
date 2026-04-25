/**
 * Work hours calculation utility.
 */

const MS_PER_HOUR = 1000 * 60 * 60;

/**
 * Calculates the number of work hours between check-in and check-out,
 * rounded to 2 decimal places.
 *
 * @throws if checkOut is not after checkIn
 */
export function calculateWorkHours(checkIn: Date, checkOut: Date): number {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  if (diffMs < 0) {
    throw new Error("Check-out time must be after check-in time");
  }
  const hours = diffMs / MS_PER_HOUR;
  return Math.round(hours * 100) / 100;
}
