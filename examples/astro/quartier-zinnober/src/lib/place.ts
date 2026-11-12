/**
 * Places around the development, written for the site (not from the API).
 * Point coordinates are taken from OpenStreetMap (November 2026). Every
 * distance shown is computed here from the development's coordinates:
 * straight line ("Luftlinie"), walking time estimated at 4.8 km/h with a
 * detour factor of 1.3. No ride or drive times: those are not computable
 * from two points. Kept in one place so home and /lage say the same.
 */
export type PlaceIcon = 'train' | 'bus' | 'school' | 'cart' | 'tree' | 'car' | 'factory' | 'town';
export type Place = { icon: PlaceIcon; label: string; lat: number; lng: number; group: 'verkehr' | 'alltag' | 'freizeit'; walk?: false };

export const PLACES: Place[] = [
  { icon: 'bus', label: 'Bushaltestelle Gaswerk', lat: 47.49359, lng: 8.70998, group: 'verkehr' },
  { icon: 'train', label: 'Bahnhof Winterthur-Töss', lat: 47.48977, lng: 8.70928, group: 'verkehr' },
  { icon: 'train', label: 'Winterthur Hauptbahnhof', lat: 47.50003, lng: 8.724, group: 'verkehr' },
  { icon: 'car', label: 'Autobahnanschluss Winterthur-Töss (A1)', lat: 47.48987, lng: 8.702, group: 'verkehr', walk: false },
  { icon: 'school', label: 'Kindergarten Agnesstrasse', lat: 47.4936, lng: 8.71325, group: 'alltag' },
  { icon: 'school', label: 'Schule Tössfeld', lat: 47.49275, lng: 8.7137, group: 'alltag' },
  { icon: 'cart', label: 'Nächster Supermarkt', lat: 47.49487, lng: 8.71275, group: 'alltag' },
  { icon: 'tree', label: 'Tössfeld-Anlage (Park)', lat: 47.49328, lng: 8.7139, group: 'freizeit' },
  { icon: 'factory', label: 'Lokstadt, Dialogplatz', lat: 47.49566, lng: 8.71617, group: 'freizeit' },
  { icon: 'tree', label: 'Ufer der Töss', lat: 47.49298, lng: 8.70407, group: 'freizeit' },
  { icon: 'town', label: 'Altstadt, Marktgasse', lat: 47.49964, lng: 8.7289, group: 'freizeit' },
];

/** Straight-line distance in metres (haversine). */
export function metres(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

/** `80 m`, `450 m`, `1.2 km` (10 m steps below 1 km, 100 m above). */
export const distanceLabel = (m: number) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(Math.round(m / 100) / 10).toFixed(1)} km`);

/** Estimated walk in minutes: 80 m/min, detour factor 1.3, at least 1. */
export const walkMinutes = (m: number) => Math.max(1, Math.round((m * 1.3) / 80));

export type Distance = Place & { m: number; distance: string; minutes?: number };

/** Places with their computed distance from the address, nearest first. */
export function distances(from: { lat?: number | null; lng?: number | null }): Distance[] {
  if (from.lat == null || from.lng == null) return [];
  const o = { lat: from.lat, lng: from.lng };
  return PLACES.map((p) => {
    const m = metres(o, p);
    return { ...p, m, distance: distanceLabel(m), minutes: p.walk === false ? undefined : walkMinutes(m) };
  }).sort((a, b) => a.m - b.m);
}

export const METHOD_NOTE =
  'Luftlinie ab der Adresse, berechnet aus Koordinaten (Kartendaten © OpenStreetMap-Mitwirkende). Gehzeiten geschätzt mit 4.8 km/h und Umwegen. Fahrzeiten der S-Bahn: Fahrplan der SBB.';
