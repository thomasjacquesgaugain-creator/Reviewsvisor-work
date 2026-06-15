import { CompleteAnalysisData, Review, QualitativeKeywordTheme } from "@/types/analysis";
import { format, parseISO } from "date-fns";
import { cleanReviewText } from "@/utils/cleanReviewText";
import { formatDiagnosticSummary, formatRecommendations } from "@/utils/formatDiagnosticSummary";
// ✅ REMOVED: analyzeRootCauses, RootCauseAnalysis — no longer needed
import { 
  computeSentimentFromRating, 
  normalizeRating,
  extractKeywordsWithSentiment,
} from "@/utils/reviewProcessing";

// ✅ REMOVED: createEmptyRCA — no longer needed

export function transformAnalysisData(
  insight: any,
  reviews: Review[]
): CompleteAnalysisData {
  const safeReviews = reviews || [];
  const safeInsight = insight || {};
  
  const totalReviews = safeReviews.length || safeInsight?.total_count || 0;
  const avgRating = safeInsight?.avg_rating || 0;
  const positiveRatio = safeInsight?.positive_ratio || 0;

  const MIN_REVIEWS_PER_PERIOD = 3;
  
  let trend: 'up' | 'down' | 'stable' | 'insufficient' | 'partial' = 'stable';
  let trendValue: number | null = null;
  let trendDeltaPoints: number | null = null;
  let isPartialData = false;
  
  if (safeReviews.length > 0) {
    const reviewsWithDates = safeReviews.filter((r) => {
      const dateStr = (r as any).published_at || r.date;
      if (!dateStr) return false;

      try {
        const reviewDate = parseISO(dateStr);
        return !isNaN(reviewDate.getTime());
      } catch {
        return false;
      }
    });

    if (reviewsWithDates.length < MIN_REVIEWS_PER_PERIOD) {
      trend = "insufficient";
    } else {
      const sortedReviews = reviewsWithDates
        .map((r) => ({
          ...r,
          date: parseISO((r as any).published_at || r.date || ""),
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      // Use completed months only for trend calculation.
      // Example (June): compare Apr+May vs Feb+Mar and exclude partial June data.
      const last_month_date = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
      const currentPeriodStart = new Date(last_month_date);
      currentPeriodStart.setDate(last_month_date.getDate() - 60);
      const previousPeriodStart = new Date(last_month_date);
      previousPeriodStart.setDate(last_month_date.getDate() - 120);

      const currentReviews = sortedReviews.filter(
        (r) => r.date >= currentPeriodStart && r.date <= last_month_date,
      );

      const previousReviews = sortedReviews.filter(
        (r) => r.date >= previousPeriodStart && r.date < currentPeriodStart,
      );

      if (
        currentReviews.length < MIN_REVIEWS_PER_PERIOD ||
        previousReviews.length < MIN_REVIEWS_PER_PERIOD
      ) {
        trend = "insufficient";
      } else {
        const currentAvg =
          currentReviews.reduce((s, r) => s + (r.note || 0), 0) /
          currentReviews.length;
        const previousAvg =
          previousReviews.reduce((s, r) => s + (r.note || 0), 0) /
          previousReviews.length;

        if (isFinite(currentAvg) && isFinite(previousAvg) && previousAvg > 0) {
          trendDeltaPoints = currentAvg - previousAvg;
          trendValue = ((currentAvg - previousAvg) / previousAvg) * 100;
          trend =
            trendDeltaPoints > 0
              ? "up"
              : trendDeltaPoints < 0
                ? "down"
                : "stable";
        } else {
          trend = "insufficient";
        }
      }
    }
  }

  let positivePercentage = positiveRatio * 100;
  let negativePercentage = (1 - positiveRatio) * 100;
  let neutralPercentage = 0;

  if (safeReviews.length > 0) {
    const positiveCount = safeReviews.filter((r) => r.note >= 4).length;
    const negativeCount = safeReviews.filter((r) => r.note <= 2).length;
    const neutralCount = totalReviews - positiveCount - negativeCount;
    positivePercentage = (positiveCount / totalReviews) * 100;
    negativePercentage = (negativeCount / totalReviews) * 100;
    neutralPercentage = (neutralCount / totalReviews) * 100;
  }

  const overview = {
    averageRating: avgRating || (safeReviews.length > 0 
      ? safeReviews.reduce((sum, r) => sum + (r.note || 0), 0) / safeReviews.length 
      : 0),
    totalReviews,
    positivePercentage,
    negativePercentage,
    neutralPercentage,
    trend,
    trendValue,
    trendDeltaPoints,
    isPartialData
  };

  const historyMap = new Map<string, { sum: number; count: number }>();
  safeReviews.forEach(review => {
    try {
      if (!review.note) return;
      const dateStr = (review as any).published_at || review.date;
      if (!dateStr) return;
      const date = parseISO(dateStr);
      if (isNaN(date.getTime())) return;
      const monthKey = format(date, 'yyyy-MM');
      const existing = historyMap.get(monthKey) || { sum: 0, count: 0 };
      existing.sum += review.note;
      existing.count += 1;
      historyMap.set(monthKey, existing);
    } catch {
      console.warn('Invalid date for review:', review.date);
    }
  });

  const history = Array.from(historyMap.entries())
    .map(([date, data]) => ({ date, rating: data.count > 0 ? data.sum / data.count : 0, count: data.count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const positiveCount = safeReviews.filter(r => r.note >= 4).length;
  const negativeCount = safeReviews.filter(r => r.note <= 2).length;
  const neutralCount  = totalReviews - positiveCount - negativeCount;
  const sentiment = { positive: positiveCount, neutral: neutralCount, negative: negativeCount };

  // ── PARETO ISSUES ──────────────────────────────────────────
  const localizedIssues = Array.isArray(safeInsight?.top_issues) ? safeInsight.top_issues : [];
  const originalTopIssues = safeInsight?.top_issues_original || {};
  const enIssues = Array.isArray(originalTopIssues.en) ? originalTopIssues.en : [];
  const frIssues = Array.isArray(originalTopIssues.fr) ? originalTopIssues.fr : [];
  const sourceIssues = enIssues.length > 0 ? enIssues : frIssues;

  const totalIssuesMentions = sourceIssues.reduce(
    (sum: number, issue: any) => sum + (Number(issue?.count) || 0), 0
  );

  const paretoIssues = sourceIssues.map((_: any, index: number) => {
    const enIssue       = enIssues[index]       || {};
    const frIssue       = frIssues[index]       || {};
    const localizedIssue = localizedIssues[index] || {};
    const count      = Number(enIssue.count ?? frIssue.count ?? 0) || 0;
    const percentage = totalIssuesMentions > 0 ? (count / totalIssuesMentions) * 100 : 0;

    return {
      key:         enIssue.key || frIssue.key || localizedIssue.key || `issue_${index}`,
      name:        localizedIssue.theme || localizedIssue.issue || "",
      en:          enIssue.theme  || enIssue.issue  || "",
      fr:          frIssue.theme  || frIssue.issue  || "",
      count,
      percentage,
      impact:      localizedIssue.impact        || "medium",
      ai_synthesis:localizedIssue.ai_synthesis  || "",
      root_causes: localizedIssue.root_causes   || [],   // ✅ comes straight from API
    };
  });

  // ── PARETO STRENGTHS ───────────────────────────────────────
  const totalStrengthsMentions = (safeInsight?.top_praises || []).reduce(
    (sum: number, s: any) => sum + (Number(s.count) || 0), 0
  );
  const paretoStrengths = (safeInsight?.top_praises || []).map((strength: any, index: number) => {
    const count = Number(strength.count) || 0;
    return {
      key: strength.key,
      name: strength.theme || strength.strength || `Point fort ${index + 1}`,
      count,
      percentage: totalStrengthsMentions > 0 ? (count / totalStrengthsMentions) * 100 : 0,

      impact: strength.impact || "medium",
      ai_synthesis: strength.ai_synthesis || "",
      evidence: Array.isArray(strength.evidence)
        ? strength.evidence
        : [],
      };
    }
  );

  // ── THEMES ─────────────────────────────────────────────────
  // ✅ Guard: ensure both arrays exist before reduce
  const rawUniversal = Array.isArray(safeInsight?.themes_universal) ? safeInsight.themes_universal : [];
  const rawIndustry  = Array.isArray(safeInsight?.themes_industry)  ? safeInsight.themes_industry  : [];

  let themes: any[] = [];

  if (rawUniversal.length > 0 || rawIndustry.length > 0) {

    // ✅ Number() coercion so string counts/importance don't break math
    function computeThemeScore(theme: any, totalCount: number): number {
      const count      = Number(theme.count)      || 0;
      const importance = Number(theme.importance) || 50;
      const frequency     = totalCount > 0 ? count / totalCount : 0;
      const frequencyBoost = Math.sqrt(frequency);
      const normalizedImportance = Math.max(0, Math.min(1, importance / 100));
      const weight = frequencyBoost * 0.5 + normalizedImportance * 0.5;
      if (theme.sentiment === "positive") return 0.5 + weight * 0.5;
      if (theme.sentiment === "negative") return 0.5 - weight * 0.5;
      return 0.5;
    }

    const totalCountCheck =
      rawUniversal.reduce((sum: number, item: any) => sum + (Number(item.count) || 0), 0) +
      rawIndustry .reduce((sum: number, item: any) => sum + (Number(item.count) || 0), 0);
    const totalCount = totalCountCheck >= totalReviews ? totalCountCheck : totalReviews;

    const mapTheme = (theme: any) => ({
      theme:      theme.theme || theme,
      score:      computeThemeScore(theme, totalCount),
      count:      Number(theme.count)      || 0,   // ✅ coerced
      importance: Number(theme.importance) || 50,  // ✅ coerced
      verbatims:  theme.verbatims || [],
    });

    const universalThemes = rawUniversal.map(mapTheme);
    const industryThemes  = rawIndustry .map(mapTheme);
    themes = [...universalThemes, ...industryThemes];

    // Fill missing verbatims from reviews
    themes = themes.map(theme => {
      if (theme.verbatims && theme.verbatims.length > 0) return theme;

      const themeWords = theme.theme
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/);

      const matched = safeReviews
        .map(r => {
          const text = cleanReviewText(r.texte || "");
          if (!text) return null;
          const rating    = normalizeRating(r.note || 0);
          const sentiment = computeSentimentFromRating(rating);
          return { text, lower: text.toLowerCase(), sentiment };
        })
        .filter(Boolean)
        .filter(r => themeWords.some(word => r!.lower.includes(word)));

      const positive = matched.filter(r => r!.sentiment === 'positive');
      const negative = matched.filter(r => r!.sentiment === 'negative');
      const neutral  = matched.filter(r => r!.sentiment === 'neutral');

      let selected: any[] =
        theme.score < 0.5 ? [...negative.slice(0, 4), ...neutral.slice(0, 2)]
        : theme.score > 0.5 ? [...positive.slice(0, 4), ...neutral.slice(0, 2)]
        : [...neutral.slice(0, 3), ...positive.slice(0, 1), ...negative.slice(0, 1)];

      selected = selected.filter((v, i, self) => i === self.findIndex(x => x.text === v.text));
      if (selected.length < 5) {
        const remaining = matched.filter(m => !selected.some(s => s.text === m!.text));
        selected.push(...remaining.slice(0, 5 - selected.length));
      }

      return { ...theme, verbatims: selected.slice(0, 5).map(v => v!.text) };
    });

  } else {
    // Fallback: derive themes from top_issues / top_praises
    const allThemes = new Map<string, { count: number; score: number }>();
    (safeInsight?.top_issues || []).forEach((issue: any) => {
      const name  = issue.theme || issue.issue || '';
      const count = Number(issue.count) || 0;
      if (name) allThemes.set(name, { count, score: Math.max(0, 1 - (count / totalReviews)) });
    });
    (safeInsight?.top_praises || []).forEach((strength: any) => {
      const name  = strength.theme || strength.strength || '';
      const count = Number(strength.count) || 0;
      if (!name) return;
      const existing = allThemes.get(name);
      if (existing) {
        existing.count += count;
        existing.score  = Math.max(0.5, existing.score + (count / totalReviews));
      } else {
        allThemes.set(name, { count, score: Math.min(1, 0.5 + (count / totalReviews)) });
      }
    });
    themes = Array.from(allThemes.entries()).map(([theme, data]) => ({
      theme, score: data.score, count: Number(data.count), verbatims: []
    }));
  }

  // ── QUALITATIVE ────────────────────────────────────────────
  const wordSentimentCounts = new Map<string, Map<'positive' | 'neutral' | 'negative', number>>();
  safeReviews.forEach(review => {
    const rawText = (review as any).text || review.texte;
    if (!rawText) return;
    const cleanedText = cleanReviewText(rawText);
    if (!cleanedText) return;
    const rating          = normalizeRating(review.note || (review as any).rating || 0);
    const reviewSentiment = computeSentimentFromRating(rating);
    extractKeywordsWithSentiment(cleanedText, reviewSentiment,insight?.qualitative_stop_words).forEach(({ word, sentiment }) => {
      if (!wordSentimentCounts.has(word)) wordSentimentCounts.set(word, new Map());
      const sm = wordSentimentCounts.get(word)!;
      sm.set(sentiment, (sm.get(sentiment) || 0) + 1);
    });
  });

  const topKeywords: Array<{ word: string; count: number; sentiment: 'positive' | 'neutral' | 'negative' }> = [];
  for (const [word, sentimentMap] of wordSentimentCounts.entries()) {
    for (const [sentiment, count] of sentimentMap.entries()) {
      topKeywords.push({ word, count, sentiment });
    }
  }
  topKeywords.sort((a, b) => b.count - a.count);

  const keyVerbatims = safeReviews
    .map(r => {
      const rawText     = (r as any).text || r.texte;
      if (!rawText) return null;
      const cleanedText = cleanReviewText(rawText);
      if (!cleanedText || cleanedText.length < 20) return null;
      return { ...r, cleanedText };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => {
      const rA = a.note || 0, rB = b.note || 0;
      const iA = rA === 1 || rA === 5 || rA === 3 ? 1 : 0;
      const iB = rB === 1 || rB === 5 || rB === 3 ? 1 : 0;
      if (iA !== iB) return iB - iA;
      return (b as any).published_at ? 1 : -1;
    })
    .slice(0, 8)
    .map(r => {
      const rating    = normalizeRating(r.note || (r as any).rating || 0);
      const sentiment = computeSentimentFromRating(rating);
      return {
        text: r.cleanedText.substring(0, 200) + (r.cleanedText.length > 200 ? '...' : ''),
        rating,
        sentiment
      };
    });

  const qualitative = {
    topKeywords,
    keyVerbatims,
    qualitativeKeywords: normalizeQualitativeKeywords(safeInsight?.qualitative_keywords),
  };

  // ── DIAGNOSTIC ─────────────────────────────────────────────
  const diagnosticInsights = {
    totalReviews,
    avgRating: overview.averageRating,
    positivePercentage: overview.positivePercentage,
    negativePercentage: overview.negativePercentage,
    topStrengths:  paretoStrengths.slice(0, 3).map(s => ({ theme: s.name,  count: s.count, percentage: s.percentage })),
    topWeaknesses: paretoIssues  .slice(0, 3).map(i => ({ theme: i.name,  count: i.count, percentage: i.percentage })),
  };

  const summaryText    = formatDiagnosticSummary(safeInsight?.summary.one_liner, diagnosticInsights);
  let recommendations: string[] = [];
  if (safeInsight?.recommendations) {
    recommendations = formatRecommendations(safeInsight.recommendations);
  } else if (safeInsight?.summary && typeof safeInsight.summary === 'object') {
    const s = safeInsight.summary as any;
    if (s.recommendations) recommendations = formatRecommendations(s.recommendations);
  }

  const diagnostic = {
    summary:      summaryText,
    topStrengths: diagnosticInsights.topStrengths,
    topWeaknesses:diagnosticInsights.topWeaknesses,
    recommendations,
    recommendations_for_main_issues: insight?.pain_points_prioritized,
  };

  // ✅ REMOVED: rcaByIssue — root_causes now live directly on each paretoIssue
  return {
    overview,
    history,
    sentiment,
    paretoIssues,
    paretoStrengths,
    themes,
    qualitative,
    diagnostic,
  };
}

function normalizeQualitativeKeywords(value: unknown): QualitativeKeywordTheme[] {
  const rawItems = Array.isArray(value) ? value : [];

  return rawItems
    .map((item: any) => {
      const themeKey = String(item?.theme_key ?? item?.key ?? item?.theme ?? "").trim();
      const keywords = Array.isArray(item?.keywords)
        ? item.keywords
            .map((keyword: unknown) => String(keyword ?? "").trim())
            .filter(Boolean)
        : [];

      return {
        theme_key: themeKey,
        keywords,
      };
    })
    .filter((item) => item.theme_key && item.keywords.length > 0);
}
