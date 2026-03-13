import { clamp, convexHull, pointInPolygon } from "./geometry";

export function getDayOfYear(date) {
  const start = new Date(Date.UTC(date.getFullYear(), 0, 0));
  const diff = date - start;
  return Math.floor(diff / 86400000);
}

export function calcSolarPosition(latitude, dayOfYear, hourDecimal) {
  const latRad = (latitude * Math.PI) / 180;
  const declination =
    (23.45 * Math.sin(((284 + dayOfYear) / 365) * Math.PI * 2) * Math.PI) / 180;
  const hourAngle = ((hourDecimal - 12) * 15 * Math.PI) / 180;
  const sinAltitude =
    Math.sin(latRad) * Math.sin(declination) +
    Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle);

  const altitude = (Math.asin(clamp(sinAltitude, -1, 1)) * 180) / Math.PI;
  const cosAzimuth =
    (Math.sin(declination) - Math.sin(latRad) * Math.sin((altitude * Math.PI) / 180)) /
    (Math.cos(latRad) * Math.cos((altitude * Math.PI) / 180) || Number.EPSILON);

  let azimuth = (Math.acos(clamp(cosAzimuth, -1, 1)) * 180) / Math.PI;
  if (hourDecimal > 12) azimuth = 360 - azimuth;

  return {
    altitude,
    azimuth,
    isDay: altitude > 0,
  };
}

export function getBuildingCorners(building) {
  const halfWidth = building.width / 2;
  const halfDepth = building.depth / 2;
  return [
    [building.x - halfWidth, building.y - halfDepth],
    [building.x + halfWidth, building.y - halfDepth],
    [building.x + halfWidth, building.y + halfDepth],
    [building.x - halfWidth, building.y + halfDepth],
  ];
}

export function shadowVector(sunPosition, height) {
  if (!sunPosition || sunPosition.altitude <= 0) return null;

  const altitude = Math.max(3, sunPosition.altitude) * (Math.PI / 180);
  const azimuth = (sunPosition.azimuth * Math.PI) / 180;
  const length = Math.min(280, (height / Math.tan(altitude)) * 1.35);

  return {
    x: -Math.sin(azimuth) * length,
    y: -Math.cos(azimuth) * length,
    length,
  };
}

export function shadowPolygonForBuilding(building, sunPosition) {
  const vector = shadowVector(sunPosition, building.height);
  if (!vector) return [];

  const corners = getBuildingCorners(building);
  const projected = corners.map(([x, y]) => [x + vector.x, y + vector.y]);
  return convexHull(corners.concat(projected));
}

export function calcSunlitPercent(targetArea, shadowPolygons, density = 32) {
  let lit = 0;
  let total = 0;

  for (let row = 0; row < density; row += 1) {
    for (let column = 0; column < density; column += 1) {
      const px = targetArea.x - targetArea.width / 2 + ((column + 0.5) * targetArea.width) / density;
      const py = targetArea.y - targetArea.depth / 2 + ((row + 0.5) * targetArea.depth) / density;
      total += 1;

      const shaded = shadowPolygons.some((polygon) => pointInPolygon([px, py], polygon));
      if (!shaded) lit += 1;
    }
  }

  return total === 0 ? 0 : Math.round((lit / total) * 1000) / 10;
}

export function analyzeDay(buildings, targetArea, date, latitude) {
  const dayOfYear = getDayOfYear(date);
  const output = [];

  for (let hour = 6; hour <= 19; hour += 1) {
    for (let minute = 0; minute < 60; minute += 20) {
      const hourDecimal = hour + minute / 60;
      const sunPosition = calcSolarPosition(latitude, dayOfYear, hourDecimal);
      if (!sunPosition.isDay) continue;

      const shadowPolygons = buildings.map((building) => shadowPolygonForBuilding(building, sunPosition));
      output.push({
        label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
        hour,
        minute,
        hourDecimal,
        altitude: Math.round(sunPosition.altitude * 10) / 10,
        azimuth: Math.round(sunPosition.azimuth * 10) / 10,
        sunlitPercent: calcSunlitPercent(targetArea, shadowPolygons),
      });
    }
  }

  return output;
}

export function summarizeDay(hourlyData, threshold = 50) {
  let totalMinutes = 0;
  let maxContinuous = 0;
  let currentContinuous = 0;

  for (const slot of hourlyData) {
    if (slot.sunlitPercent >= threshold) {
      totalMinutes += 20;
      currentContinuous += 20;
      maxContinuous = Math.max(maxContinuous, currentContinuous);
    } else {
      currentContinuous = 0;
    }
  }

  const averageSunlitPercent =
    hourlyData.length === 0
      ? 0
      : hourlyData.reduce((sum, slot) => sum + slot.sunlitPercent, 0) / hourlyData.length;

  return {
    totalSunlightHours: Math.round((totalMinutes / 60) * 10) / 10,
    continuousSunlightHours: Math.round((maxContinuous / 60) * 10) / 10,
    averageSunlitPercent: Math.round(averageSunlitPercent * 10) / 10,
  };
}

export function analyzeYear(buildings, targetArea, year, latitude) {
  const hours = Array.from({ length: 13 }, (_, index) => index + 6);
  const months = Array.from({ length: 12 }, (_, index) => index + 1);

  const matrix = months.map((month) => {
    const referenceDate = new Date(Date.UTC(year, month - 1, 21));
    const dayOfYear = getDayOfYear(referenceDate);
    return hours.map((hour) => {
      const samples = [0, 20, 40].map((minute) => {
        const sunPosition = calcSolarPosition(latitude, dayOfYear, hour + minute / 60);
        if (!sunPosition.isDay) return 0;
        const shadows = buildings.map((building) => shadowPolygonForBuilding(building, sunPosition));
        return calcSunlitPercent(targetArea, shadows, 20);
      });
      return Math.round(samples.reduce((sum, sample) => sum + sample, 0) / samples.length);
    });
  });

  return { hours, months, matrix };
}

export function currentSunForDate(date, latitude, hourDecimal) {
  return calcSolarPosition(latitude, getDayOfYear(date), hourDecimal);
}
