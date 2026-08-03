import { extractOriginalText } from "@/utils/extractOriginalText";

export interface EstablishmentContext {
  name: string;
  totalReviews: number;
  positiveReviews: number;
  negativeReviews: number;
  avgRating: string;
  topIssues: unknown[];
  topPraises: unknown[];
  themes: unknown[];
  recentNegativeReviews: Array<{
    rating: number;
    text: string;
    author: string;
    date: string;
  }>;
  recentPositiveReviews: Array<{
    rating: number;
    text: string;
    author: string;
    date: string;
  }>;
}

export function buildEstablishmentContext(
  establishmentName: string,
  insight: Record<string, unknown> | null | undefined,
  reviews: Array<Record<string, unknown>>,
): EstablishmentContext {
  const totalReviews = reviews.length;
  const positiveReviews = reviews.filter((r) => (Number(r?.rating) || 0) >= 4).length;
  const negativeReviews = reviews.filter((r) => (Number(r?.rating) || 0) <= 2).length;
  const avgRating =
    insight?.avg_rating ??
    (totalReviews > 0
      ? reviews.reduce((sum, r) => sum + (Number(r?.rating) || 0), 0) / totalReviews
      : 0);

  const topIssues = (insight?.top_issues as unknown[]) || [];
  const topPraises = (insight?.top_praises as unknown[]) || [];
  const themes = (insight?.themes as unknown[]) || [];

  const recentNegativeReviews = reviews
    .filter((r) => Number(r?.rating) <= 2)
    .slice(0, 5)
    .map((r) => ({
      rating: Number(r?.rating) ?? 0,
      text: extractOriginalText(String(r?.text || "")) || "",
      author: String(r?.author || "Anonyme"),
      date: String(r?.published_at || r?.create_time || r?.inserted_at || ""),
    }));

  const recentPositiveReviews = reviews
    .filter((r) => Number(r?.rating) >= 4)
    .slice(0, 3)
    .map((r) => ({
      rating: Number(r?.rating) ?? 0,
      text: extractOriginalText(String(r?.text || "")) || "",
      author: String(r?.author || "Anonyme"),
      date: String(r?.published_at || r?.create_time || r?.inserted_at || ""),
    }));

  return {
    name: establishmentName || "l'établissement",
    totalReviews,
    positiveReviews,
    negativeReviews,
    avgRating: Number(avgRating).toFixed(1),
    topIssues: topIssues.slice(0, 10),
    topPraises: topPraises.slice(0, 10),
    themes: themes.slice(0, 15),
    recentNegativeReviews,
    recentPositiveReviews,
  };
}
