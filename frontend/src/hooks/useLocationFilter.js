import { useEffect, useState } from "react";

export const CITIES = [
  { id: "tula",     name: "Тула",            lat: 54.1931, lon: 37.6173 },
  { id: "moscow",   name: "Москва",          lat: 55.7558, lon: 37.6173 },
  { id: "spb",      name: "Санкт-Петербург", lat: 59.9343, lon: 30.3351 },
  { id: "kaluga",   name: "Калуга",          lat: 54.5293, lon: 36.2754 },
  { id: "ryazan",   name: "Рязань",          lat: 54.6296, lon: 39.7415 },
  { id: "oryol",    name: "Орёл",            lat: 52.9658, lon: 36.0786 },
  { id: "voronezh", name: "Воронеж",         lat: 51.6720, lon: 39.1843 },
  { id: "lipetsk",  name: "Липецк",          lat: 52.6105, lon: 39.5947 },
  { id: "tver",     name: "Тверь",           lat: 56.8587, lon: 35.9176 },
  { id: "smolensk", name: "Смоленск",        lat: 54.7826, lon: 32.0453 },
];

export const RADIUS_OPTIONS_KM = [5, 10, 20, 50, 100, 200];

const STORAGE_KEY = "location_filter";
const DEFAULT = { cityId: "tula", radiusKm: 50 };

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT;
}

const listeners = new Set();
let state = load();

function broadcast() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  listeners.forEach((fn) => fn(state));
}

export function useLocationFilter() {
  const [value, setValue] = useState(state);

  useEffect(() => {
    const fn = (v) => setValue(v);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  const city = CITIES.find((c) => c.id === value.cityId) ?? CITIES[0];

  return {
    city,
    radiusKm: value.radiusKm,
    setCity(id)    { state = { ...state, cityId: id   }; broadcast(); },
    setRadius(km)  { state = { ...state, radiusKm: km }; broadcast(); },
  };
}
