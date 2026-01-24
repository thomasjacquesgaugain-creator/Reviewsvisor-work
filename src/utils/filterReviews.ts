import { Review } from "@/types/analysis";
import {
  endOfDay,
  format,
  isValid,
  parse,
  parseISO,
  startOfDay,
  subDays,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";

export type RatingFilter = "ALL" | "POS" | "NEU" | "NEG";

export type PeriodPreset = "all" | "30d" | "90d" | "12m" | "custom";

export interface PeriodFilter {
  preset: PeriodPreset;
  startDate: Date | null;
  endDate: Date | null;
  /**
   * Backward-compatible aliases (legacy).
   * Prefer `startDate` / `endDate`.
   */
  from?: Date;
  to?: Date;
}

export type SourceFilter = "ALL" | string;

export interface ReviewFilterOptions {
  ratingFilter: RatingFilter;
  periodFilter: PeriodFilter;
  sourceFilter: SourceFilter;
}

export function parseReviewDate(value: unknown): Date | null {
  if (!value) return null;

  // Date object
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  // Timestamp (number) or numeric string
  if (typeof value === "number" && isFinite(value)) {
    // Heuristic: seconds vs milliseconds
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return isValid(d) ? d : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Numeric string timestamp
    if (/^\d+$/.test(trimmed)) {
      const asNumber = Number(trimmed);
      if (!Number.isNaN(asNumber)) {
        const ms = asNumber < 1e12 ? asNumber * 1000 : asNumber;
        const d = new Date(ms);
        return isValid(d) ? d : null;
      }
    }

    // ISO-like
    const iso = parseISO(trimmed);
    if (isValid(iso)) return iso;

    // Common DB format: "yyyy-MM-dd HH:mm[:ss]"
    for (const fmt of ["yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd HH:mm"]) {
      const d = parse(trimmed, fmt, new Date());
      if (isValid(d)) return d;
    }

    // FR formats: "dd/MM/yyyy" (optionally time)
    for (const fmt of ["dd/MM/yyyy HH:mm:ss", "dd/MM/yyyy HH:mm", "dd/MM/yyyy"]) {
      const d = parse(trimmed, fmt, new Date(), { locale: fr });
      if (isValid(d)) return d;
    }

    // FR with dashes
    for (const fmt of ["dd-MM-yyyy HH:mm:ss", "dd-MM-yyyy HH:mm", "dd-MM-yyyy"]) {
      const d = parse(trimmed, fmt, new Date(), { locale: fr });
      if (isValid(d)) return d;
    }

    // Last resort (browser parsing)
    const fallback = new Date(trimmed);
    return isValid(fallback) ? fallback : null;
  }

  // Unknown object → try Date ctor
  const d = new Date(value as any);
  return isValid(d) ? d : null;
}

export function computeRange(
  preset: PeriodPreset,
  customStart?: Date | null,
  customEnd?: Date | null
): { start: Date | null; end: Date | null } {
  const now = new Date();
  const todayEnd = endOfDay(now);

  if (preset === "all") {
    return { start: null, end: null };
  }

  if (preset === "30d") {
    return { start: startOfDay(subDays(now, 30)), end: todayEnd };
  }

  if (preset === "90d") {
    return { start: startOfDay(subDays(now, 90)), end: todayEnd };
  }

  if (preset === "12m") {
    return { start: startOfDay(subMonths(now, 12)), end: todayEnd };
  }

  // custom
  const start = customStart ? startOfDay(customStart) : null;
  let end = customEnd ? endOfDay(customEnd) : null;
  if (end && end.getTime() > todayEnd.getTime()) end = todayEnd;

  return { start, end };
}

export function filterReviews(
  reviews: Review[] = [],
  { ratingFilter, periodFilter, sourceFilter }: ReviewFilterOptions
): Review[] {
  if (!reviews || reviews.length === 0) return [];

  const rawStart = periodFilter.startDate ?? periodFilter.from ?? null;
  const rawEnd = periodFilter.endDate ?? periodFilter.to ?? null;
  const { start, end } = computeRange(periodFilter.preset, rawStart, rawEnd);

  const normalizeSource = (v: unknown) => (v ?? "").toString().trim().toLowerCase();
  const sourceNeedle = sourceFilter === "ALL" ? null : normalizeSource(sourceFilter);

  const getReviewDate = (review: Review): Date | null => {
    const r: any = review as any;
    // Un champ "date" est normalement fourni dans notre type Review,
    // mais on supporte plusieurs sources (backend/raw) par robustesse.
    const candidates: unknown[] = [
      r?.date,
      r?.published_at,
      r?.inserted_at,
      r?.created_at,
      r?.createdAt,
    ];

    for (const c of candidates) {
      const d = parseReviewDate(c);
      if (d) return d;
    }
    return null;
  };

  const filtered = reviews.filter((review) => {
    const rating = review.note;
    if (ratingFilter === "POS" && !(rating >= 4 && rating <= 5)) return false;
    if (ratingFilter === "NEU" && rating !== 3) return false;
    if (ratingFilter === "NEG" && !(rating >= 1 && rating <= 2)) return false;

    if (sourceNeedle) {
      const reviewSource = normalizeSource((review as any)?.source);
      if (!reviewSource) return false;
      if (reviewSource !== sourceNeedle) return false;
    }

    if (start || end) {
      const reviewDate = getReviewDate(review);
      if (!reviewDate) return false;
      if (start && reviewDate.getTime() < start.getTime()) return false;
      if (end && reviewDate.getTime() > end.getTime()) return false;
    }

    return true;
  });

  // Debug temporaire (DEV only) — à retirer après validation.
  if (import.meta.env.DEV) {
    const debugKey = [
      "PeriodFilter",
      periodFilter.preset,
      start ? start.toISOString() : "null",
      end ? end.toISOString() : "null",
      `total=${reviews.length}`,
      `filtered=${filtered.length}`,
      `source=${String(sourceFilter)}`,
      `rating=${String(ratingFilter)}`,
    ].join("|");

    // Limiter le spam console : log uniquement quand les paramètres changent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g: any = globalThis as any;
    if (g.__rv_lastPeriodFilterLogKey !== debugKey) {
      g.__rv_lastPeriodFilterLogKey = debugKey;
      const samples = reviews.slice(0, 3).map((r) => {
        const d = getReviewDate(r);
        return { id: (r as any).id, raw: (r as any).date, parsed: d ? d.toISOString() : null };
      });
      // eslint-disable-next-line no-console
      console.log("[PeriodFilter]", periodFilter.preset, {
        start,
        end,
        total: reviews.length,
        filtered: filtered.length,
        sourceFilter,
        ratingFilter,
        samples,
      });
    }
  }

  return filtered;
}

/**
 * Formate un filtre de période en texte lisible pour l'affichage
 */
export function formatPeriodLabel(periodFilter: PeriodFilter): string {
  switch (periodFilter.preset) {
    case "30d":
      return "sur les 30 derniers jours";
    case "90d":
      return "sur les 90 derniers jours";
    case "12m":
      return "sur les 12 derniers mois";
    case "custom":
      if (periodFilter.startDate && periodFilter.endDate) {
        return `${format(periodFilter.startDate, "dd/MM/yyyy", { locale: fr })} – ${format(periodFilter.endDate, "dd/MM/yyyy", { locale: fr })}`;
      }
      return "période personnalisée";
    case "all":
    default:
      return "toute la période";
  }
}

