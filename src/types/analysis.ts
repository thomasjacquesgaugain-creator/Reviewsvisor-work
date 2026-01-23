// Types pour les données d'analyse complètes

export interface OverviewMetrics {
  averageRating: number;
  totalReviews: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  trend: 'up' | 'down' | 'stable' | 'insufficient';
  trendValue?: number | null; // null si données insuffisantes
  trendDeltaPoints?: number | null; // Variation en points (ex: +0.5)
}

export interface TimeSeriesDataPoint {
  date: string;
  rating: number;
  count: number;
}

export interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

export interface ParetoItem {
  name: string;
  count: number;
  percentage: number;
}

export interface ThemeAnalysis {
  theme: string;
  score: number; // 0-1
  count: number;
  verbatims: string[];
}

export interface QualitativeData {
  topKeywords: Array<{ word: string; count: number; sentiment?: 'positive' | 'neutral' | 'negative' }>;
  keyVerbatims: Array<{ text: string; rating: number; sentiment: 'positive' | 'neutral' | 'negative' }>;
}

export interface DiagnosticSummary {
  summary: string;
  topStrengths: Array<{ theme: string; count: number; percentage: number }>;
  topWeaknesses: Array<{ theme: string; count: number; percentage: number }>;
  recommendations: string[];
}

export interface CompleteAnalysisData {
  overview: OverviewMetrics;
  history: TimeSeriesDataPoint[];
  sentiment: SentimentDistribution;
  paretoIssues: ParetoItem[];
  paretoStrengths: ParetoItem[];
  themes: ThemeAnalysis[];
  qualitative: QualitativeData;
  diagnostic: DiagnosticSummary;
}

export interface Review {
  id: string;
  etablissementId: string;
  source: "google" | "trustpilot" | "facebook" | "yelp" | "tripadvisor" | "other";
  note: number;
  texte: string;
  date: string;
  // Champs optionnels pour les analyses avancées
  sentimentScore?: number; // -1..1
  sentimentLabel?: "positive" | "neutral" | "negative";
  themes?: Array<{ name: string; sentimentScore?: number }>;
  keywords?: string[];
  frictionPoints?: Array<{ label: string }>;
}
