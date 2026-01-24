import { formatRecommendations } from "@/utils/formatDiagnosticSummary";

export interface NormalizedSummary {
  /** Human-readable summary text (never JSON). */
  text: string;
  /** Normalized recommendations (strings only). */
  recommendations: string[];
  /** Optional extracted stats (useful for debug/future UI). */
  stats?: {
    total?: number;
    positivePct?: number;
    negativePct?: number;
  };
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(",", ".").trim());
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function clampPct(n: number | undefined): number | undefined {
  if (n === undefined) return undefined;
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.min(100, n));
}

export function normalizeSummary(input: unknown): NormalizedSummary | null {
  if (input === null || input === undefined) return null;

  // 1) string: try JSON.parse, otherwise treat as plain text
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Attempt parsing only when it looks like JSON
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return normalizeSummary(parsed);
      } catch {
        // fallthrough: plain text
      }
    }

    return { text: trimmed, recommendations: [] };
  }

  // 2) object: extract useful fields, never stringify it for UI
  if (typeof input === "object") {
    const obj: any = input as any;

    const explicitText =
      (typeof obj.resume === "string" && obj.resume.trim()) ||
      (typeof obj.summary === "string" && obj.summary.trim()) ||
      (typeof obj.text === "string" && obj.text.trim()) ||
      "";

    const total =
      toNumber(obj.total) ??
      toNumber(obj.total_count) ??
      toNumber(obj.totalReviews) ??
      toNumber(obj.stats?.totalAvis) ??
      undefined;

    // Positive can come as 0..1 ratio or 0..100 pct
    const positiveRaw =
      toNumber(obj.positive_pct) ??
      toNumber(obj.positivePercentage) ??
      toNumber(obj.positivePct) ??
      (toNumber(obj.positive_ratio) !== undefined ? (toNumber(obj.positive_ratio) as number) * 100 : undefined) ??
      undefined;

    const negativeRaw =
      toNumber(obj.negative_pct) ??
      toNumber(obj.negativePercentage) ??
      toNumber(obj.negatifsPct) ??
      undefined;

    const positivePct = clampPct(positiveRaw);
    const negativePct = clampPct(negativeRaw);

    const recommendations = formatRecommendations(
      obj.recommendations ?? obj.recommandations ?? obj.actions ?? obj.suggestions
    );

    const synthesized =
      total !== undefined && (positivePct !== undefined || negativePct !== undefined)
        ? `Analyse basée sur ${Math.round(total)} avis :${
            positivePct !== undefined ? ` ${Math.round(positivePct)}% positifs` : ""
          }${
            positivePct !== undefined && negativePct !== undefined ? "," : ""
          }${negativePct !== undefined ? ` ${Math.round(negativePct)}% négatifs` : ""}.`
        : "";

    const text = explicitText || synthesized;

    if (text) {
      return {
        text,
        recommendations,
        stats: { total: total !== undefined ? Math.round(total) : undefined, positivePct, negativePct },
      };
    }

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn("[normalizeSummary] Unexpected summary object shape:", obj);
    }

    return null;
  }

  // 3) other primitives: stringify safely
  return { text: String(input), recommendations: [] };
}

