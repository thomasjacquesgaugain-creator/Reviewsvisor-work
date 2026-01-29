/**
 * Cache "dashboard snapshot" par establishmentId (place_id).
 * Réhydratation immédiate au chargement pour éviter le flash 0/vide.
 * TTL 6h + clé version pour invalidation si structure change.
 */

const STORAGE_KEY = "reviewsvisor_dashboard_snapshot";
const TTL_MS = 6 * 60 * 60 * 1000; // 6h
const VERSION = 1;

export interface DashboardSnapshot {
  /** Insight brut (review_insights) */
  insight: any | null;
  /** Liste des avis pour KPI et onglet Analyse */
  reviews: any[];
  /** ISO date */
  updatedAt: string;
}

function getStorage(): Record<string, DashboardSnapshot> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { version?: number; data: Record<string, DashboardSnapshot> };
    if (parsed?.version !== VERSION) return {};
    return parsed.data || {};
  } catch {
    return {};
  }
}

function setStorage(data: Record<string, DashboardSnapshot>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, data }));
  } catch (_) {}
}

/**
 * Récupère le snapshot pour un establishmentId (place_id).
 * Retourne null si absent ou expiré (TTL 6h).
 */
export function getDashboardSnapshot(establishmentId: string | null): DashboardSnapshot | null {
  if (!establishmentId) return null;
  const all = getStorage();
  const snap = all[establishmentId];
  if (!snap?.updatedAt) return null;
  const age = Date.now() - new Date(snap.updatedAt).getTime();
  if (age > TTL_MS) {
    delete all[establishmentId];
    setStorage(all);
    return null;
  }
  return snap;
}

/**
 * Enregistre le snapshot pour un establishmentId.
 */
export function setDashboardSnapshot(
  establishmentId: string,
  payload: { insight: any | null; reviews: any[] }
): void {
  const all = getStorage();
  all[establishmentId] = {
    insight: payload.insight ?? null,
    reviews: Array.isArray(payload.reviews) ? payload.reviews : [],
    updatedAt: new Date().toISOString(),
  };
  setStorage(all);
}
