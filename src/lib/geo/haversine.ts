/**
 * Geolocation utilities using the Haversine formula.
 */

const EARTH_RADIUS_METERS = 6_371_000;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DistanceResult {
  distanceInMeters: number;
  isWithinRadius: boolean;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Validates that coordinates fall within valid GPS ranges.
 * Latitude: [-90, 90], Longitude: [-180, 180]
 */
export function validateCoordinates(coords: Coordinates): void {
  if (
    typeof coords.latitude !== "number" ||
    typeof coords.longitude !== "number" ||
    !Number.isFinite(coords.latitude) ||
    !Number.isFinite(coords.longitude)
  ) {
    throw new Error("Coordinates must be finite numbers");
  }
  if (coords.latitude < -90 || coords.latitude > 90) {
    throw new Error(
      `Invalid latitude: ${coords.latitude}. Must be between -90 and 90.`
    );
  }
  if (coords.longitude < -180 || coords.longitude > 180) {
    throw new Error(
      `Invalid longitude: ${coords.longitude}. Must be between -180 and 180.`
    );
  }
}

/**
 * Calculates the great-circle distance between two GPS coordinates
 * using the Haversine formula.
 *
 * @returns distance in meters
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  validateCoordinates(point1);
  validateCoordinates(point2);

  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Checks whether an employee's location is within the allowed radius
 * of an office location.
 */
export function isWithinAllowedRadius(
  employeeLocation: Coordinates,
  officeLocation: Coordinates,
  allowedRadiusMeters: number
): DistanceResult {
  const distanceInMeters = calculateDistance(employeeLocation, officeLocation);
  return {
    distanceInMeters,
    isWithinRadius: distanceInMeters <= allowedRadiusMeters,
  };
}
