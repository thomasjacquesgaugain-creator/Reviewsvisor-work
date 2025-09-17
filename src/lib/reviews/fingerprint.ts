export type IncomingReview = {
  author: string;
  rating: number; // 0..5
  comment: string | null;
  platform?: string | null;
  review_date?: string | null; // ISO ou null
};

function norm(s?: string | null) {
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?()«»"']/g, "")
    .trim();
}

// Simple hash function for client-side use (no crypto dependency)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export function fingerprint(r: IncomingReview) {
  const base = [
    norm(r.author) || "nouveau",
    String(r.rating ?? 0),
    norm(r.comment) || "",
    norm(r.platform) || "google",
    // la date est souvent vague → on ne l'inclut pas pour éviter les faux négatifs
  ].join("|");
  return simpleHash(base);
}

export function dedupeBatch(arr: IncomingReview[]) {
  const seen = new Set<string>();
  const out: (IncomingReview & { fp: string })[] = [];
  for (const r of arr) {
    const fp = fingerprint(r);
    if (seen.has(fp)) continue;
    seen.add(fp);
    out.push({ ...r, fp });
  }
  return out;
}