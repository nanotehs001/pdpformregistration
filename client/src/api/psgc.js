// Philippine Standard Geographic Code API — official region/province/city/barangay data.
const PSGC_BASE = 'https://psgc.gitlab.io/api';

const cache = new Map();

async function fetchJson(path) {
  if (cache.has(path)) return cache.get(path);

  const response = await fetch(`${PSGC_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Failed to load address data (${response.status})`);
  }

  const data = await response.json();
  const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
  cache.set(path, sorted);
  return sorted;
}

export function fetchRegions() {
  return fetchJson('/regions/');
}

export function fetchProvinces(regionCode) {
  return fetchJson(`/regions/${regionCode}/provinces/`);
}

// NCR has no provinces, so its cities hang directly off the region.
export function fetchCitiesByRegion(regionCode) {
  return fetchJson(`/regions/${regionCode}/cities-municipalities/`);
}

export function fetchCitiesByProvince(provinceCode) {
  return fetchJson(`/provinces/${provinceCode}/cities-municipalities/`);
}

export function fetchBarangays(cityOrMunicipalityCode) {
  return fetchJson(`/cities-municipalities/${cityOrMunicipalityCode}/barangays/`);
}
