/**
 * Cache KPI Dashboard par place_id (localStorage).
 * Hydrate au mount pour éviter le flash "0" avant le fetch.
 */

const CACHE_KEY = "reviewsvisor_kpi_cache";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

export interface CachedKpi {
  place_id: string;
  insight: any | null;
  reviews: any[];
  savedAt: string;
}

function getStorage(): Record<string, CachedKpi> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CachedKpi>;
    return parsed || {};
  } catch {
    return {};
  }
}

function setStorage(data: Record<string, CachedKpi>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (_) {}
}

/**
 * Récupère le cache KPI pour un place_id (insight + reviews).
 * Retourne null si absent ou expiré.
 */
export function getKpiCache(placeId: string): CachedKpi | null {
  const all = getStorage();
  const cached = all[placeId];
  if (!cached?.savedAt) return null;
  const age = Date.now() - new Date(cached.savedAt).getTime();
  if (age > MAX_AGE_MS) {
    delete all[placeId];
    setStorage(all);
    return null;
  }
  return cached;
}

/**
 * Enregistre le cache KPI pour un place_id.
 */
export function setKpiCache(placeId: string, payload: { insight: any | null; reviews: any[] }): void {
  const all = getStorage();
  all[placeId] = {
    place_id: placeId,
    insight: payload.insight ?? null,
    reviews: Array.isArray(payload.reviews) ? payload.reviews : [],
    savedAt: new Date().toISOString(),
  };
  setStorage(all);
}
