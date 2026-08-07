export type Coordinates = {
  latitude: number;
  longitude: number;
};

// City and landmark coordinates for map pins when trips don't have lat/lng stored.
const PLACES: Record<string, Coordinates> = {
  // Bay Area
  berkeley: { latitude: 37.8715, longitude: -122.273 },
  oakland: { latitude: 37.8044, longitude: -122.2712 },
  'san francisco': { latitude: 37.7749, longitude: -122.4194 },
  sf: { latitude: 37.7749, longitude: -122.4194 },
  sausalito: { latitude: 37.8591, longitude: -122.4853 },
  'palo alto': { latitude: 37.4419, longitude: -122.143 },
  'san jose': { latitude: 37.3382, longitude: -121.8863 },
  napa: { latitude: 38.2975, longitude: -122.2869 },
  sonoma: { latitude: 38.2919, longitude: -122.458 },
  'half moon bay': { latitude: 37.4636, longitude: -122.4286 },
  'santa cruz': { latitude: 36.9741, longitude: -122.0308 },
  'mill valley': { latitude: 37.906, longitude: -122.545 },
  'point reyes': { latitude: 38.0699, longitude: -122.8055 },
  // California & US
  'lake tahoe': { latitude: 39.0968, longitude: -120.0324 },
  yosemite: { latitude: 37.8651, longitude: -119.5383 },
  monterey: { latitude: 36.6002, longitude: -121.8947 },
  'big sur': { latitude: 36.2704, longitude: -121.8081 },
  'los angeles': { latitude: 34.0522, longitude: -118.2437 },
  'new york': { latitude: 40.7128, longitude: -74.006 },
  'new york city': { latitude: 40.7128, longitude: -74.006 },
  nyc: { latitude: 40.7128, longitude: -74.006 },
  chicago: { latitude: 41.8781, longitude: -87.6298 },
  seattle: { latitude: 47.6062, longitude: -122.3321 },
  portland: { latitude: 45.5152, longitude: -122.6784 },
  austin: { latitude: 30.2672, longitude: -97.7431 },
  miami: { latitude: 25.7617, longitude: -80.1918 },
  hawaii: { latitude: 19.8968, longitude: -155.5828 },
  // International
  tokyo: { latitude: 35.6762, longitude: 139.6503 },
  kyoto: { latitude: 35.0116, longitude: 135.7681 },
  osaka: { latitude: 34.6937, longitude: 135.5023 },
  copenhagen: { latitude: 55.6761, longitude: 12.5683 },
  madrid: { latitude: 40.4168, longitude: -3.7038 },
  barcelona: { latitude: 41.3874, longitude: 2.1686 },
  lisbon: { latitude: 38.7223, longitude: -9.1393 },
  paris: { latitude: 48.8566, longitude: 2.3522 },
  london: { latitude: 51.5074, longitude: -0.1278 },
  rome: { latitude: 41.9028, longitude: 12.4964 },
  amsterdam: { latitude: 52.3676, longitude: 4.9041 },
  berlin: { latitude: 52.52, longitude: 13.405 },
  iceland: { latitude: 64.9631, longitude: -19.0208 },
  reykjavik: { latitude: 64.1466, longitude: -21.9426 },
  sydney: { latitude: -33.8688, longitude: 151.2093 },
  bali: { latitude: -8.3405, longitude: 115.092 },
  'mexico city': { latitude: 19.4326, longitude: -99.1332 },
  cancun: { latitude: 21.1619, longitude: -86.8515 },
};

// US state abbreviations / names — checked before country lookup so "CA" ≠ Canada.
const US_STATES: Record<string, Coordinates> = {
  ca: { latitude: 37.8715, longitude: -122.273 },
  california: { latitude: 37.8715, longitude: -122.273 },
  ny: { latitude: 40.7128, longitude: -74.006 },
  'new york': { latitude: 40.7128, longitude: -74.006 },
  tx: { latitude: 30.2672, longitude: -97.7431 },
  texas: { latitude: 30.2672, longitude: -97.7431 },
  wa: { latitude: 47.6062, longitude: -122.3321 },
  washington: { latitude: 47.6062, longitude: -122.3321 },
  or: { latitude: 45.5152, longitude: -122.6784 },
  oregon: { latitude: 45.5152, longitude: -122.6784 },
  hi: { latitude: 19.8968, longitude: -155.5828 },
  hawaii: { latitude: 19.8968, longitude: -155.5828 },
};

const COUNTRIES: Record<string, Coordinates> = {
  usa: { latitude: 39.8283, longitude: -98.5795 },
  us: { latitude: 39.8283, longitude: -98.5795 },
  'united states': { latitude: 39.8283, longitude: -98.5795 },
  japan: { latitude: 36.2048, longitude: 138.2529 },
  spain: { latitude: 40.4637, longitude: -3.7492 },
  denmark: { latitude: 56.2639, longitude: 9.5018 },
  france: { latitude: 46.2276, longitude: 2.2137 },
  italy: { latitude: 41.8719, longitude: 12.5674 },
  portugal: { latitude: 39.3999, longitude: -8.2245 },
  uk: { latitude: 55.3781, longitude: -3.436 },
  'united kingdom': { latitude: 55.3781, longitude: -3.436 },
  germany: { latitude: 51.1657, longitude: 10.4515 },
  netherlands: { latitude: 52.1326, longitude: 5.2913 },
  iceland: { latitude: 64.9631, longitude: -19.0208 },
  australia: { latitude: -25.2744, longitude: 133.7751 },
  indonesia: { latitude: -0.7893, longitude: 113.9213 },
  mexico: { latitude: 23.6345, longitude: -102.5528 },
  canada: { latitude: 56.1304, longitude: -106.3468 },
  thailand: { latitude: 15.87, longitude: 100.9925 },
  greece: { latitude: 39.0742, longitude: 21.8243 },
  switzerland: { latitude: 46.8182, longitude: 8.2275 },
};

// Trailing suffixes like "Berkeley, CA" or "Oakland, California"
const STATE_SUFFIX =
  /\s+(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy|california|texas|hawaii|oregon|washington|usa|us)$/i;

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
}

function lookupPlaceByKey(key: string): Coordinates | null {
  if (!key) return null;
  if (PLACES[key]) return PLACES[key];

  for (const [place, coords] of Object.entries(PLACES)) {
    if (key.includes(place)) return coords;
    if (key.length >= 3 && place.includes(key)) return coords;
  }

  return null;
}

function lookupPlace(name: string): Coordinates | null {
  const key = normalize(name);
  const direct = lookupPlaceByKey(key);
  if (direct) return direct;

  // "berkeley ca" → try "berkeley"
  const withoutState = key.replace(STATE_SUFFIX, '').trim();
  if (withoutState && withoutState !== key) {
    return lookupPlaceByKey(withoutState);
  }

  return null;
}

function lookupRegion(name: string): Coordinates | null {
  const key = normalize(name);
  if (US_STATES[key]) return US_STATES[key];

  if (key.length >= 3) {
    for (const [region, coords] of Object.entries(US_STATES)) {
      if (key.includes(region) || region.includes(key)) return coords;
    }
  }

  return null;
}

function lookupCountry(name: string): Coordinates | null {
  const key = normalize(name);
  if (COUNTRIES[key]) return COUNTRIES[key];

  if (key.length >= 3) {
    for (const [country, coords] of Object.entries(COUNTRIES)) {
      if (key.includes(country) || country.includes(key)) return coords;
    }
  }

  return null;
}

export function resolveCoordinates(
  destination: string,
  country?: string | null
): Coordinates | null {
  const fromDestination = lookupPlace(destination);
  if (fromDestination) return fromDestination;

  if (country) {
    const fromRegion = lookupRegion(country);
    if (fromRegion) return fromRegion;

    return lookupCountry(country);
  }

  return null;
}

export function getCoordinatesForTrip(trip: {
  destination: string;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}): Coordinates | null {
  const resolved = resolveCoordinates(trip.destination, trip.country);
  if (resolved) return resolved;

  if (trip.latitude != null && trip.longitude != null) {
    return { latitude: trip.latitude, longitude: trip.longitude };
  }

  return null;
}

export const DEFAULT_MAP_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 25,
  longitudeDelta: 25,
};

export function getRegionForPins(
  pins: Coordinates[]
): typeof DEFAULT_MAP_REGION {
  if (pins.length === 0) return DEFAULT_MAP_REGION;

  if (pins.length === 1) {
    return {
      latitude: pins[0].latitude,
      longitude: pins[0].longitude,
      latitudeDelta: 2,
      longitudeDelta: 2,
    };
  }

  const lats = pins.map((p) => p.latitude);
  const lngs = pins.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;
  const latitudeDelta = Math.max((maxLat - minLat) * 1.4, 2);
  const longitudeDelta = Math.max((maxLng - minLng) * 1.4, 2);

  return { latitude, longitude, latitudeDelta, longitudeDelta };
}
