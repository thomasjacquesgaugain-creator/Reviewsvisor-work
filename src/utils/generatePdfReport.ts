import type jsPDF from 'jspdf';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface RootCause {
  label: string;
  importance: string;
  category: string;
  category_key: string;
  causes: string[];
  evidence: string[];
}

interface TopIssue {
  key: string;
  theme: string;
  count: number;
  impact: string;
  ai_synthesis: string;
  root_causes: RootCause[];
}

interface TopPraise {
  key: string;
  theme: string;
  count: number;
}

interface Theme {
  theme: string;
  sentiment?: string;
  importance?: number;
  count?: number;
  score?: number;
  what_it_means?: string;
  evidence_quotes?: string[];
  verbatims?: string[];
}

interface PainPoint {
  issue: string;
  impact: number;
  ease: number;
  first_step: string;
  why_it_matters: string;
}

interface Recommendation {
  title: string;
  details: string;
  expected_result: string;
  priority: number;
}

interface Summary {
  one_liner: string;
  what_customers_love: Array<{ theme: string; reason: string; count: number }>;
  what_customers_hate: Array<{ theme: string; reason: string; count: number }>;
}

interface AnalysisData {
  analysis_version: string;
  avg_rating: number;
  business_type: string;
  business_type_confidence: number;
  last_analyzed_at: string;
  positive_ratio: number;
  total_count: number;
  pain_points_prioritized: PainPoint[];
  recommendations_projects: Recommendation[];
  recommendations_quick_wins: Recommendation[];
  summary: Summary;
  summary_one_liner: string;
  summary_what_customers_hate: Array<{ theme: string; reason: string; count: number }>;
  summary_what_customers_love: Array<{ theme: string; reason: string; count: number }>;
  themes: Theme[];
  themes_industry: Theme[];
  themes_universal: Theme[];
  top_issues: TopIssue[];
  top_praises: TopPraise[];
}

import type { SmartObjective } from '@/types/smart';
import i18n from '@/i18n/config';

// Local bilingual helper used only inside this file
interface BilingualString {
  en: string;
  fr: string;
}

interface ReportData {
  establishmentName: string;
  establishmentType:string;
  totalReviews: number;
  avgRating: number;
  positiveRatio: number;
  topIssues: Array<{ theme?: string; issue?: string; count?: number; mentions?: number }>;
  topStrengths: Array<{ theme?: string; strength?: string; count?: number; mentions?: number }>;
  themes?: Array<{ theme: string; score?: number; count?: number }>;
  recentReviews: Array<{
    text?: string;
    rating?: number;
    author?: string;
    author_name?: string;
    published_at?: string;
  }>;
  summary?: string;
  aiDebrief?: string;
  positivePct?: number;
  analysis_data?: AnalysisData;
  smart_objectives?: SmartObjective[];
  report_language?: 'en' | 'fr';
}

// ─── i18n / REPORT LANGUAGE ───────────────────────────────────────────────────
// Resolves which language the static PDF copy (section titles, labels, etc.)
// should be rendered in. Priority: explicit report_language passed in the
// data, falling back to the app's current i18n language.
function resolveReportLang(data: ReportData): 'en' | 'fr' {
  if (data.report_language === 'en' || data.report_language === 'fr') {
    return data.report_language;
  }
  return i18n.language && i18n.language.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

// Module-scoped "current" language for the static copy used by helper
// functions (addFooter, getSatisfactionIndex, etc.) that live outside of
// generatePdfReport and don't receive the language as a parameter.
let CURRENT_REPORT_LANG: 'en' | 'fr' = 'fr';

// ─── STATIC UI STRING DICTIONARY ─────────────────────────────────────────────

const TXT = {
  fr: {
    footer: 'Rapport genere automatiquement par Reviewsvisor',
    page: 'Page',
    satisfactionGood: 'Bon',
    satisfactionAverage: 'Moyen',
    satisfactionPoor: 'A revoir',
    sentimentVeryPositive: 'Tres positif',
    sentimentPositive: 'Positif',
    sentimentNeutral: 'Neutre',
    sentimentNegative: 'Negatif',
    sentimentVeryNegative: 'Tres negatif',
    easeEasy: 'Facile',
    easeMedium: 'Moyen',
    easeHard: 'Difficile',
    coverSubtitle: "Rapport d'analyse des avis clients",
    coverGeneratedOn: 'Rapport genere le',
    coverAvgRating: 'Note moyenne',
    coverReviewsAnalyzed: 'Avis analyses',
    coverSentiment: 'Sentiment',
    scoreGlobalTitle: 'Score Global',
    overallRatingLabel: 'NOTE GLOBALE',
    satisfactionIndexLabel: 'Indice de satisfaction',
    positiveReviews: 'Avis positifs',
    negativeReviews: 'Avis negatifs',
    kpiTitle: 'KPI - Indicateurs cles a suivre',
    kpiOverallRating: 'Note moyenne globale',
    kpiPositiveReviews: 'Avis positifs',
    kpiNegativeReviews: 'Avis negatifs',
    kpiMainIssue: 'Principal probleme',
    kpiMainStrength: 'Principal point fort',
    kpiEstablishmentType: "Type d'etablissement",
    kpiNote: "Ces indicateurs permettent de suivre l'evolution de la satisfaction client et de mesurer l'impact des actions mises en place dans le temps.",
    none: 'Aucun',
    synthesisTitle: 'Synthese des retours clients',
    mostAppreciated: 'Les elements les plus apprecies',
    noStrengthsFound: 'Aucun point fort identifie',
    mainFrictionPoints: 'Les principaux points de friction',
    noIssuesFound: 'Aucun probleme majeur identifie',
    loveHateTitle: "Ce que vos clients aiment et n'aiment pas",
    mentions: 'mentions',
    detailedAnalysisTitle: 'Résumé et analyse des thèmes',
    ratingDistribution: 'Repartition des avis par note',
    recurringThemesTitle: 'Themes recurrents avec sentiment et evidence quotes',
    recurringThemesSubtitle: 'Les evidence quotes ci-dessous illustrent des avis reels associes a chaque theme.',
    themeSentimentPositive: 'Positif',
    themeSentimentNegative: 'Negatif',
    themeSentimentMixed: 'Mixte',
    frequencyLabel: 'Frequence',
    evidenceQuotesLabel: 'Evidence quotes',
    noEvidenceQuote: 'Aucun evidence quote disponible.',
    ishikawaTitle: 'Analyse des causes racines (Ishikawa)',
    ishikawaSubtitle: 'Identification des causes profondes pour chaque probleme prioritaire',
    problemLabel: 'Probleme',
    problemLabelContinued: '(suite)',
    causesLabel: 'Causes:',
    testimonialsLabel: 'Temoignages:',
    noRootCause: 'Aucune cause significative identifiee dans les avis clients.',
    painPointsTitle: 'Priorisation des problemes - Impact vs Facilite',
    painPointsSubtitle: "Classement IA base sur l'impact client et la facilite de mise en oeuvre",
    ppHeaderIssue: 'Probleme',
    ppHeaderImpact: 'Impact',
    ppHeaderEase: 'Facilite',
    ppHeaderFirstAction: 'Prem. action',
    ppHeaderAiAnalysis: 'Analyse IA',
    noPrioritizationData: 'Aucune donnee de priorisation disponible.',
    tipLabel: 'Conseil',
    tipText: 'Commencez par les actions a fort impact et haute facilite pour obtenir des resultats rapides et mesurables sur votre reputation.',
    conclusionTitle: 'Conclusion strategique - Analyse IA',
    conclusionFooterLine1: "Cette analyse a ete generee automatiquement par l'intelligence artificielle de Reviewsvisor",
    conclusionFooterLine2: "basee sur l'ensemble des avis clients de votre etablissement.",
  },
  en: {
    footer: 'Report automatically generated by Reviewsvisor',
    page: 'Page',
    satisfactionGood: 'Good',
    satisfactionAverage: 'Average',
    satisfactionPoor: 'Needs improvement',
    sentimentVeryPositive: 'Very positive',
    sentimentPositive: 'Positive',
    sentimentNeutral: 'Neutral',
    sentimentNegative: 'Negative',
    sentimentVeryNegative: 'Very negative',
    easeEasy: 'Easy',
    easeMedium: 'Medium',
    easeHard: 'Difficult',
    coverSubtitle: 'Customer review analysis report',
    coverGeneratedOn: 'Report generated on',
    coverAvgRating: 'Average rating',
    coverReviewsAnalyzed: 'Reviews analyzed',
    coverSentiment: 'Sentiment',
    scoreGlobalTitle: 'Overall Score',
    overallRatingLabel: 'OVERALL RATING',
    satisfactionIndexLabel: 'Satisfaction index',
    positiveReviews: 'Positive reviews',
    negativeReviews: 'Negative reviews',
    kpiTitle: 'KPI - Key indicators to track',
    kpiOverallRating: 'Overall average rating',
    kpiPositiveReviews: 'Positive reviews',
    kpiNegativeReviews: 'Negative reviews',
    kpiMainIssue: 'Main issue',
    kpiMainStrength: 'Main strength',
    kpiEstablishmentType: 'Establishment type',
    kpiNote: 'These indicators help you track how customer satisfaction evolves and measure the impact of actions implemented over time.',
    none: 'None',
    synthesisTitle: 'Summary of customer feedback',
    mostAppreciated: 'The most appreciated elements',
    noStrengthsFound: 'No strengths identified',
    mainFrictionPoints: 'The main friction points',
    noIssuesFound: 'No major issue identified',
    loveHateTitle: 'What your customers love and dislike',
    mentions: 'mentions',
    detailedAnalysisTitle: 'Summary and theme analysis',
    ratingDistribution: 'Review distribution by rating',
    recurringThemesTitle: 'Recurring themes with sentiment and evidence quotes',
    recurringThemesSubtitle: 'The evidence quotes below illustrate real reviews associated with each theme.',
    themeSentimentPositive: 'Positive',
    themeSentimentNegative: 'Negative',
    themeSentimentMixed: 'Mixed',
    frequencyLabel: 'Frequency',
    evidenceQuotesLabel: 'Evidence quotes',
    noEvidenceQuote: 'No evidence quote available.',
    ishikawaTitle: 'Root cause analysis (Ishikawa)',
    ishikawaSubtitle: 'Identifying the deep causes behind each priority issue',
    problemLabel: 'Issue',
    problemLabelContinued: '(continued)',
    causesLabel: 'Causes:',
    testimonialsLabel: 'Testimonials:',
    noRootCause: 'No significant cause identified from customer reviews.',
    painPointsTitle: 'Issue prioritization - Impact vs Ease',
    painPointsSubtitle: "AI ranking based on customer impact and ease of implementation",
    ppHeaderIssue: 'Issue',
    ppHeaderImpact: 'Impact',
    ppHeaderEase: 'Ease',
    ppHeaderFirstAction: 'First action',
    ppHeaderAiAnalysis: 'AI analysis',
    noPrioritizationData: 'No prioritization data available.',
    tipLabel: 'Tip',
    tipText: 'Start with high-impact, high-ease actions to get fast, measurable results on your reputation.',
    conclusionTitle: 'Strategic conclusion - AI analysis',
    conclusionFooterLine1: "This analysis was automatically generated by Reviewsvisor's artificial intelligence",
    conclusionFooterLine2: 'based on all of your establishment\'s customer reviews.',
  },
} as const;

// ─── COLORS ───────────────────────────────────────────────────────────────────

const COLORS = {
  primary:    [37, 99, 235]   as [number, number, number],
  secondary:  [55, 65, 81]    as [number, number, number],
  success:    [22, 163, 74]   as [number, number, number],
  warning:    [234, 179, 8]   as [number, number, number],
  danger:     [220, 38, 38]   as [number, number, number],
  text:       [31, 41, 55]    as [number, number, number],
  textLight:  [107, 114, 128] as [number, number, number],
  background: [249, 250, 251] as [number, number, number],
  white:      [255, 255, 255] as [number, number, number],
  gold:       [245, 158, 11]  as [number, number, number],
};

const BLUE_PRIMARY:   [number, number, number] = [37,  99,  235];
const BLUE_LIGHT:     [number, number, number] = [191, 219, 254];
const BLUE_PALE:      [number, number, number] = [239, 246, 255];
const BLUE_DARK:      [number, number, number] = [30,  64,  175];
const GREEN_PRIMARY:  [number, number, number] = [22,  163, 74];
const GREEN_BORDER:   [number, number, number] = [134, 239, 172];
const GREEN_PALE:     [number, number, number] = [240, 253, 244];
const GREEN_LIGHT:    [number, number, number] = [187, 247, 208];
const RED_PRIMARY:    [number, number, number] = [220, 38,  38];
const RED_BORDER:     [number, number, number] = [252, 165, 165];
const RED_PALE:       [number, number, number] = [255, 245, 245];
const RED_LIGHT:      [number, number, number] = [254, 202, 202];
const ROW_WHITE:      [number, number, number] = [255, 255, 255];
const ORANGE_PRIMARY: [number, number, number] = [234, 88,  12];
const ORANGE_PALE:    [number, number, number] = [255, 237, 213];
const PURPLE_PRIMARY: [number, number, number] = [124, 58,  237];
const PURPLE_PALE:    [number, number, number] = [237, 233, 254];

// ─── LAYOUT ───────────────────────────────────────────────────────────────────

const MARGINS      = { top: 20, right: 20, bottom: 25, left: 20 };
const PAGE_WIDTH   = 210;
const PAGE_HEIGHT  = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGINS.left - MARGINS.right;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function truncateText(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : text.substring(0, maxLength - 3) + '...';
}

function addFooter(doc: jsPDF, pageNumber: number) {
  const S = TXT[CURRENT_REPORT_LANG];
  const footerY = PAGE_HEIGHT - 12;
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textLight);
  doc.text(S.footer, MARGINS.left, footerY);
  doc.text(`${S.page} ${pageNumber}`, PAGE_WIDTH - MARGINS.right, footerY, { align: 'right' });
}

function addNewPage(doc: jsPDF, pageNumber: number): number {
  addFooter(doc, pageNumber);
  doc.addPage();
  return pageNumber + 1;
}

function addSectionTitle(
  doc: jsPDF,
  title: string,
  yPos: number,
  color: [number, number, number] = COLORS.primary
): number {
  doc.setFillColor(...color);
  doc.rect(MARGINS.left, yPos, 5, 10, 'F');
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGINS.left + 10, yPos + 7);
  return yPos + 20;
}

function getSatisfactionIndex(pct: number): { label: string; color: [number, number, number] } {
  const S = TXT[CURRENT_REPORT_LANG];
  if (pct >= 80) return { label: S.satisfactionGood,    color: COLORS.success };
  if (pct >= 60) return { label: S.satisfactionAverage, color: COLORS.warning };
  return              { label: S.satisfactionPoor,      color: COLORS.danger  };
}

function getSentimentLabel(ratio: number): { label: string; color: [number, number, number] } {
  const S = TXT[CURRENT_REPORT_LANG];
  if (ratio >= 0.8) return { label: S.sentimentVeryPositive, color: COLORS.success };
  if (ratio >= 0.6) return { label: S.sentimentPositive,     color: COLORS.success };
  if (ratio >= 0.4) return { label: S.sentimentNeutral,      color: COLORS.warning };
  if (ratio >= 0.2) return { label: S.sentimentNegative,     color: COLORS.danger  };
  return                   { label: S.sentimentVeryNegative, color: COLORS.danger  };
}

function getSentimentColor(sentiment?: string): [number, number, number] {
  const s = (sentiment ?? '').toLowerCase();
  if (s === 'positive' || s === 'positif') return GREEN_PRIMARY;
  if (s === 'negative' || s === 'negatif') return RED_PRIMARY;
  return COLORS.warning;
}

function getSentimentBg(sentiment?: string): [number, number, number] {
  const s = (sentiment ?? '').toLowerCase();
  if (s === 'positive' || s === 'positif') return GREEN_PALE;
  if (s === 'negative' || s === 'negatif') return RED_PALE;
  return ORANGE_PALE;
}

function getImpactColor(impact: number): [number, number, number] {
  if (impact >= 75) return RED_PRIMARY;
  if (impact >= 50) return COLORS.warning;
  return GREEN_PRIMARY;
}

function getEaseLabel(ease: number): string {
  const S = TXT[CURRENT_REPORT_LANG];
  if (ease >= 70) return S.easeEasy;
  if (ease >= 40) return S.easeMedium;
  return S.easeHard;
}

function getCategoryColor(categoryKey: string): [number, number, number] {
  const map: Record<string, [number, number, number]> = {
    workforce:   BLUE_PRIMARY,
    methods:     PURPLE_PRIMARY,
    equipment:   ORANGE_PRIMARY,
    materials:   GREEN_PRIMARY,
    environment: [20, 184, 166],
    measurement: [219, 39, 119],
  };
  return map[categoryKey.toLowerCase()] ?? COLORS.secondary;
}

// Translates a raw impact/effort level value ("low" | "medium" | "high",
// case-insensitive) into the display label for the given language.
function getLevelLabel(value: unknown, lang: 'en' | 'fr'): string {
  const v = String(value ?? '').trim().toLowerCase();
  const map: Record<string, { en: string; fr: string }> = {
    low:    { en: 'Low',    fr: 'Faible' },
    medium: { en: 'Medium', fr: 'Moyen' },
    high:   { en: 'High',   fr: 'Eleve' },
  };
  return map[v]?.[lang] ?? String(value ?? '');
}

// Translates an Ishikawa (6M) category key into a display label. Handles
// both the "workforce/methods/equipment/materials/environment" naming and
// the classic 6M naming (manpower/machine/measurement) since the data
// source isn't always consistent about which set it uses.
function getCategoryLabel(categoryKey: string, lang: 'en' | 'fr'): string {
  const key = String(categoryKey ?? '').trim().toLowerCase();
  const map: Record<string, { en: string; fr: string }> = {
    workforce:   { en: 'Workforce',   fr: 'Main-d\u2019oeuvre' },
    manpower:    { en: 'Workforce',   fr: 'Main-d\u2019oeuvre' },
    methods:     { en: 'Methods',     fr: 'Methodes' },
    method:      { en: 'Methods',     fr: 'Methodes' },
    equipment:   { en: 'Equipment',   fr: 'Equipement' },
    machine:     { en: 'Equipment',   fr: 'Equipement' },
    materials:   { en: 'Materials',   fr: 'Materiaux' },
    material:    { en: 'Materials',   fr: 'Materiaux' },
    environment: { en: 'Environment', fr: 'Environnement' },
    measurement: { en: 'Measurement', fr: 'Mesure' },
  };
  return map[key]?.[lang] ?? '';
}

function cleanVerbatim(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizePdfText(text: string): string {
  return cleanVerbatim(
    text
      // Remove emoji / surrogate pairs that jsPDF's core fonts don't render well.
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
      // Remove other non-printable control characters.
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      // Normalize curly quotes to plain ASCII quotes for cleaner wrapping.
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
  );
}

function getThemeVerbatims(theme: Theme): string[] {
  const rawQuotes = Array.isArray(theme.verbatims) && theme.verbatims.length > 0
    ? theme.verbatims
    : Array.isArray(theme.evidence_quotes) && theme.evidence_quotes.length > 0
      ? theme.evidence_quotes
      : [];

  return Array.from(
    new Set(
      rawQuotes
        .map((quote) => sanitizePdfText(String(quote)))
        .filter(Boolean)
    )
  );
}

// ─── REUSABLE TABLE RENDERER ──────────────────────────────────────────────────

function drawSectionTable(
  doc: jsPDF,
  yPos: number,
  title: string,
  rows: Array<{ label: string; count: number }>,
  emptyMsg: string,
  headerColor: [number, number, number],
  rowPale: [number, number, number],
  rowDivider: [number, number, number],
  badgeBg: [number, number, number],
  badgeTxt: [number, number, number],
  numColor: [number, number, number]
): number {
  const S = TXT[CURRENT_REPORT_LANG];
  const tW   = CONTENT_WIDTH;
  const hdrH = 9;
  const rowH = 11;
  const nameW = tW - 38;
  const cntW  = 38;
  const tX    = MARGINS.left;
  const cntX  = tX + nameW;

  doc.setFillColor(...headerColor);
  doc.roundedRect(tX, yPos, tW, hdrH, 1, 1, 'F');
  doc.setDrawColor(...headerColor);
  doc.setLineWidth(0.6);
  doc.roundedRect(tX, yPos, tW, hdrH, 1, 1, 'S');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(title, tX + 5, yPos + 6);
  yPos += hdrH;

  const rowsStartY = yPos;
  const displayRows = rows.length > 0 ? rows : [{ label: emptyMsg, count: 0 }];

  displayRows.forEach((row, idx) => {
    doc.setFillColor(...ROW_WHITE);
    doc.rect(tX, yPos, tW, rowH, 'F');

    doc.setDrawColor(...rowDivider);
    doc.setLineWidth(0.3);
    if (idx > 0) doc.line(tX, yPos, tX + tW, yPos);
    if (rows.length > 0) doc.line(cntX, yPos, cntX, yPos + rowH);

    if (rows.length > 0) {
      doc.setTextColor(...numColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`${idx + 1}.`, tX + 5, yPos + 7);

      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(doc.splitTextToSize(row.label, nameW - 20)[0], tX + 15, yPos + 7);

      if (row.count > 0) {
        const badgeW = 28;
        const badgeX = cntX + (cntW - badgeW) / 2;
        doc.setFillColor(...badgeBg);
        doc.roundedRect(badgeX, yPos + 2.5, badgeW, 6, 1, 1, 'F');
        doc.setTextColor(...badgeTxt);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(`${row.count} ${S.mentions}`, cntX + cntW / 2, yPos + 7, { align: 'center' });
      }
    } else {
      doc.setTextColor(...COLORS.textLight);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(row.label, tX + 5, yPos + 7);
    }
    yPos += rowH;
  });

  doc.setDrawColor(...headerColor);
  doc.setLineWidth(0);
  doc.roundedRect(tX, rowsStartY - hdrH, tW, hdrH + rowH * displayRows.length, 1, 1, 'S');

  return yPos + 10;
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export async function generatePdfReport(data: ReportData): Promise<void> {
  const { default: JsPDF } = await import('jspdf');
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Resolve the report's language once, from data.report_language falling
  // back to the app's current i18n language, and make it available to
  // helper functions declared outside this closure.
  const reportLang = resolveReportLang(data);
  CURRENT_REPORT_LANG = reportLang;
  const S = TXT[reportLang];
  // Ensure any downstream helpers reading data.report_language stay in sync
  // with the resolved language (e.g. when it wasn't explicitly provided).
  data.report_language = reportLang;

  const ad = data.analysis_data;
  let pageNumber = 1;
  let yPos = MARGINS.top;

  const positivePct = Math.round(data.positiveRatio * 100);
  const negativePct = 100 - positivePct;
  const sentiment   = getSentimentLabel(data.positiveRatio);
  const satisfaction = getSatisfactionIndex(positivePct);

  // ── Resolve real data with fallbacks ────────────────────────────────────────
  const topIssues   = ad?.top_issues   ?? data.topIssues.map(i => ({
    key: '', theme: i.theme || i.issue || '', count: i.count || 0,
    impact: 'medium', ai_synthesis: '', root_causes: []
  })) as TopIssue[];

  const topPraises  = ad?.top_praises  ?? data.topStrengths.map(s => ({
    key: '', theme: s.theme || s.strength || '', count: s.count || 0
  })) as TopPraise[];

  const themes        = ad?.themes          ?? data.themes ?? [];
  const themesUniv    = ad?.themes_universal ?? [];
  const themesInd     = ad?.themes_industry  ?? [];
  const painPoints    = ad?.pain_points_prioritized    ?? [];
  const quickWins     = ad?.recommendations_quick_wins ?? [];
  const projects      = ad?.recommendations_projects   ?? [];
  const oneLiner      = ad?.summary?.one_liner ?? ad?.summary_one_liner ?? data.summary ?? '';
  const customersLove = ad?.summary?.what_customers_love ?? ad?.summary_what_customers_love ?? [];
  const customersHate = ad?.summary?.what_customers_hate ?? ad?.summary_what_customers_hate ?? [];
  const establishmentType=data?.establishmentType??'';

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ═══════════════════════════════════════════════════════════════════════════

  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_WIDTH, 100, 'F');

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('Reviewsvisor', PAGE_WIDTH / 2, 40, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(S.coverSubtitle, PAGE_WIDTH / 2, 55, { align: 'center' });

  doc.setDrawColor(...COLORS.white);
  doc.setLineWidth(0.5);
  doc.line(60, 70, 150, 70);

  // AI one-liner under the line
  if (oneLiner) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(191, 219, 254);
    const oneLinerLines = doc.splitTextToSize(`"${oneLiner}"`, 140);
    doc.text(oneLinerLines, PAGE_WIDTH / 2, 82, { align: 'center' });
  }

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(truncateText(data.establishmentName, 40), PAGE_WIDTH / 2, 140, { align: 'center' });

  // Business type badge
  if (establishmentType) {
    doc.setFillColor(...BLUE_PALE);
    doc.roundedRect(PAGE_WIDTH / 2 - 25, 145, 50, 8, 2, 2, 'F');
    doc.setTextColor(...BLUE_PRIMARY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(
      establishmentType.replace(/_/g, ' ').toUpperCase(),
      PAGE_WIDTH / 2, 150, { align: 'center' }
    );
  }

  const generationDate = new Date().toLocaleDateString(reportLang === 'en' ? 'en-GB' : 'fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textLight);
  doc.text(`${S.coverGeneratedOn} ${generationDate}`, PAGE_WIDTH / 2, 160, { align: 'center' });

  // KPI hero card
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(30, 180, 150, 60, 3, 3, 'F');

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(S.coverAvgRating, 55, 200, { align: 'center' });
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.text(`${data.avgRating.toFixed(1)}/5`, 55, 215, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text(S.coverReviewsAnalyzed, 105, 200, { align: 'center' });
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.text(`${data.totalReviews}`, 105, 215, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text(S.coverSentiment, 155, 200, { align: 'center' });
  doc.setFontSize(16);
  doc.setTextColor(...sentiment.color);
  doc.text(sentiment.label, 155, 215, { align: 'center' });

  addFooter(doc, pageNumber);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 2 — SCORE GLOBAL + KPI
  // ═══════════════════════════════════════════════════════════════════════════

  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;
  yPos = addSectionTitle(doc, S.scoreGlobalTitle, yPos, COLORS.gold);

  // Hero rating card
  const heroH = 42;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, heroH, 4, 4, 'F');
  doc.setDrawColor(...BLUE_PRIMARY);
  doc.setLineWidth(0.9);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, heroH, 4, 4, 'S');

  doc.setTextColor(180, 176, 165);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(S.overallRatingLabel, PAGE_WIDTH / 2, yPos + 8, { align: 'center' });

  doc.setTextColor(...BLUE_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.text(data.avgRating.toFixed(1), PAGE_WIDTH / 2 - 6, yPos + 23, { align: 'center' });

  doc.setTextColor(147, 197, 253);
  doc.setFontSize(14);
  doc.text('/ 5', PAGE_WIDTH / 2 + 12, yPos + 23);

  doc.setDrawColor(...BLUE_LIGHT);
  doc.setLineWidth(0.6);
  doc.line(PAGE_WIDTH / 2 - 12, yPos + 28, PAGE_WIDTH / 2 + 12, yPos + 28);

  const rowY = yPos + 38;
  doc.setTextColor(...COLORS.textLight);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(S.satisfactionIndexLabel, PAGE_WIDTH / 2 - 10, rowY, { align: 'right' });

  const pillW = 18; const pillH = 7;
  doc.setFillColor(...BLUE_PRIMARY);
  doc.roundedRect(PAGE_WIDTH / 2 + 2, rowY - 5.5, pillW, pillH, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(satisfaction.label, PAGE_WIDTH / 2 + 2 + pillW / 2, rowY - 1, { align: 'center' });

  yPos += heroH + 8;

  // Stat cards
  const gap = 4;
  const cardW = (CONTENT_WIDTH - gap) / 2;
  const cardH = 26;

  const drawStatCard = (
    x: number, pct: number, label: string,
    bg: [number, number, number], border: [number, number, number],
    numColor: [number, number, number], barColor: [number, number, number]
  ) => {
    doc.setFillColor(...bg);
    doc.roundedRect(x, yPos, cardW, cardH, 4, 4, 'F');
    doc.setDrawColor(...border);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, yPos, cardW, cardH, 4, 4, 'S');
    doc.setTextColor(...numColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(`${pct}%`, x + cardW / 2, yPos + 12, { align: 'center' });
    doc.setTextColor(...COLORS.textLight);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(label, x + cardW / 2, yPos + 19, { align: 'center' });
    const barW = cardW * 0.55;
    doc.setFillColor(...barColor);
    doc.roundedRect(x + (cardW - barW) / 2, yPos + 22, barW, 1.2, 0.6, 0.6, 'F');
  };

  drawStatCard(MARGINS.left, positivePct, S.positiveReviews,
    GREEN_PALE, GREEN_BORDER, GREEN_PRIMARY, GREEN_BORDER);
  drawStatCard(MARGINS.left + cardW + gap, negativePct, S.negativeReviews,
    RED_PALE, RED_BORDER, RED_PRIMARY, RED_BORDER);

  yPos += cardH + 10;

  // KPI table — now using real data
  yPos = addSectionTitle(doc, S.kpiTitle, yPos, COLORS.secondary);

  const mainNegTheme = topIssues.length > 0
    ? truncateText(topIssues[0].theme, 35) : S.none;
  const mainPosTheme = topPraises.length > 0
    ? truncateText(topPraises[0].theme, 35) : S.none;

  const kpiItems: Array<{ label: string; value: string; valueColor: [number, number, number] }> = [
    { label: S.kpiOverallRating,   value: `${data.avgRating.toFixed(1)} / 5`, valueColor: BLUE_PRIMARY },
    { label: S.kpiPositiveReviews, value: `${positivePct}%`,                  valueColor: GREEN_PRIMARY },
    { label: S.kpiNegativeReviews, value: `${negativePct}%`,                  valueColor: RED_PRIMARY },
    { label: S.kpiMainIssue,       value: mainNegTheme,                        valueColor: COLORS.text as [number, number, number] },
    { label: S.kpiMainStrength,    value: mainPosTheme,                        valueColor: COLORS.text as [number, number, number] },
    ...(ad?.business_type ? [{
      label: S.kpiEstablishmentType,
      value: ad.business_type.replace(/_/g, ' '),
      valueColor: BLUE_PRIMARY
    }] : []),
  ];

  const kpiRowH = 11;
  kpiItems.forEach((item) => {
    doc.setFillColor(255, 255, 255);
    doc.rect(MARGINS.left, yPos, CONTENT_WIDTH, kpiRowH, 'F');
    doc.setDrawColor(...BLUE_LIGHT);
    doc.setLineWidth(0.25);
    doc.line(MARGINS.left, yPos + kpiRowH, MARGINS.left + CONTENT_WIDTH, yPos + kpiRowH);
    doc.setTextColor(...COLORS.textLight);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(item.label, MARGINS.left + 6, yPos + 7.5);
    doc.setTextColor(...item.valueColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(item.value, MARGINS.left + CONTENT_WIDTH - 6, yPos + 7.5, { align: 'right' });
    yPos += kpiRowH;
  });

  yPos += 6;
  const noteLines = doc.splitTextToSize(S.kpiNote, CONTENT_WIDTH - 14);
  const noteH = Math.max(16, 8 + noteLines.length * 5);
  doc.setFillColor(...BLUE_PALE);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, noteH, 2, 2, 'F');
  doc.setFillColor(...BLUE_PRIMARY);
  doc.rect(MARGINS.left, yPos, 3, noteH, 'F');
  doc.setTextColor(...BLUE_DARK);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(noteLines, MARGINS.left + 8, yPos + 6);

  addFooter(doc, pageNumber);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 3 — SYNTHESE CLIENT (real data)
  // ═══════════════════════════════════════════════════════════════════════════

  // pageNumber = addNewPage(doc, pageNumber);
  // yPos = MARGINS.top;
  // yPos = addSectionTitle(doc, S.synthesisTitle, yPos);

  // // AI one-liner banner
  // if (oneLiner) {
  //   const bannerLines = doc.splitTextToSize(`"${oneLiner}"`, CONTENT_WIDTH - 16);
  //   const bannerH = Math.max(16, 8 + bannerLines.length * 5);
  //   doc.setFillColor(...BLUE_PALE);
  //   doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, bannerH, 3, 3, 'F');
  //   doc.setFillColor(...BLUE_PRIMARY);
  //   doc.rect(MARGINS.left, yPos, 3, bannerH, 'F');
  //   doc.setTextColor(...BLUE_DARK);
  //   doc.setFontSize(9);
  //   doc.setFont('helvetica', 'italic');
  //   doc.text(bannerLines, MARGINS.left + 8, yPos + 6);
  //   yPos += bannerH + 10;
  // }

  // // Points forts from real top_praises
  // const strengthRows = topPraises.slice(0, 4).map(s => ({
  //   label: s.theme, count: s.count
  // }));
  // yPos = drawSectionTable(
  //   doc, yPos,
  //   S.mostAppreciated,
  //   strengthRows,
  //   S.noStrengthsFound,
  //   GREEN_PRIMARY, GREEN_PALE, GREEN_LIGHT,
  //   [220, 252, 231], [22, 101, 52], GREEN_PRIMARY
  // );

  // // Points de friction from real top_issues
  // const issueRows = topIssues.slice(0, 4).map(i => ({
  //   label: i.theme, count: i.count
  // }));
  // yPos = drawSectionTable(
  //   doc, yPos,
  //   S.mainFrictionPoints,
  //   issueRows,
  //   S.noIssuesFound,
  //   RED_PRIMARY, RED_PALE, RED_LIGHT,
  //   [254, 226, 226], [153, 27, 27], RED_PRIMARY
  // );

  // // What customers love/hate from summary
  // if (customersLove.length > 0 || customersHate.length > 0) {
  //   const impactHdrH = 9;
  //   doc.setFillColor(...BLUE_PRIMARY);
  //   doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, impactHdrH, 1, 1, 'F');
  //   doc.setTextColor(255, 255, 255);
  //   doc.setFontSize(9);
  //   doc.setFont('helvetica', 'bold');
  //   doc.text(S.loveHateTitle, MARGINS.left + 5, yPos + 6);
  //   yPos += impactHdrH;

  //   const allItems = [
  //     ...customersLove.slice(0, 2).map(l => ({ ...l, type: 'love' as const })),
  //     ...customersHate.slice(0, 2).map(h => ({ ...h, type: 'hate' as const })),
  //   ];

  //   allItems.forEach((item, idx) => {
  //     const rowH = 13;
  //     const bg: [number, number, number] = item.type === 'love' ? GREEN_PALE : RED_PALE;
  //     doc.setFillColor(...bg);
  //     doc.rect(MARGINS.left, yPos, CONTENT_WIDTH, rowH, 'F');
  //     doc.setDrawColor(220, 220, 220);
  //     doc.setLineWidth(0.3);
  //     if (idx > 0) doc.line(MARGINS.left, yPos, MARGINS.left + CONTENT_WIDTH, yPos);

  //     const iconColor: [number, number, number] = item.type === 'love' ? GREEN_PRIMARY : RED_PRIMARY;
  //     const icon = item.type === 'love' ? '+' : '-';
  //     doc.setFillColor(...iconColor);
  //     doc.circle(MARGINS.left + 6, yPos + 6.5, 3.5, 'F');
  //     doc.setTextColor(255, 255, 255);
  //     doc.setFont('helvetica', 'bold');
  //     doc.setFontSize(9);
  //     doc.text(icon, MARGINS.left + 6, yPos + 7.5, { align: 'center' });

  //     doc.setTextColor(...COLORS.text);
  //     doc.setFont('helvetica', 'bold');
  //     doc.setFontSize(8.5);
  //     doc.text(truncateText(item.theme, 30), MARGINS.left + 14, yPos + 6);
  //     doc.setFont('helvetica', 'normal');
  //     doc.setFontSize(7.5);
  //     doc.setTextColor(...COLORS.textLight);
  //     doc.text(truncateText(item.reason || '', 70), MARGINS.left + 14, yPos + 11);

  //     yPos += rowH;
  //   });

  //   doc.setDrawColor(...BLUE_PRIMARY);
  //   doc.setLineWidth(0);
  //   doc.roundedRect(MARGINS.left, yPos - allItems.length * 13 - impactHdrH,
  //     CONTENT_WIDTH, impactHdrH + allItems.length * 13, 1, 1, 'S');
  // }

  // addFooter(doc, pageNumber);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 4 — ANALYSE DETAILLEE (real themes)
  // ═══════════════════════════════════════════════════════════════════════════

  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;
  yPos = addSectionTitle(doc, S.detailedAnalysisTitle, yPos);

  // Rating distribution
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(S.ratingDistribution, MARGINS.left, yPos);
  yPos += 8;

  const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  data.recentReviews.forEach((r) => {
    const rating = r.rating || 0;
    if (rating >= 1 && rating <= 5) ratingCounts[Math.round(rating)]++;
  });
  const totalRatings = Object.values(ratingCounts).reduce((a, b) => a + b, 0) || 1;

  [5, 4, 3, 2, 1].forEach((rating, idx) => {
    const count = ratingCounts[rating];
    const pct   = (count / totalRatings) * 100;
    const rTableW = CONTENT_WIDTH;
    const rNoteW  = 22;
    const rRowH   = 11;

    doc.setFillColor(...ROW_WHITE);
    doc.rect(MARGINS.left, yPos, rTableW, rRowH, 'F');
    doc.setDrawColor(...BLUE_LIGHT);
    doc.setLineWidth(0.3);
    if (idx > 0) doc.line(MARGINS.left, yPos, MARGINS.left + rTableW, yPos);

    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`${rating}/5`, MARGINS.left + rNoteW / 2, yPos + 7, { align: 'center' });

    const infoW   = rTableW - rNoteW;
    const pctW    = 18;
    const countW  = 16;
    const barPad  = 4;
    const barW    = infoW - pctW - countW - barPad * 2 - 6;
    const trackX  = MARGINS.left + rNoteW + barPad;
    const trackH  = 5;
    const trackY  = yPos + 3;

    doc.setFillColor(219, 234, 254);
    doc.roundedRect(trackX, trackY, barW, trackH, 1, 1, 'F');
    if (pct > 0) {
      const barColor: [number, number, number] =
        rating >= 4 ? [22, 163, 74] : rating === 3 ? [245, 158, 11] : [220, 38, 38];
      doc.setFillColor(...barColor);
      doc.roundedRect(trackX, trackY, (pct / 100) * barW, trackH, 1, 1, 'F');
    }

    const badgeColor: [number, number, number] =
      pct === 0 ? [241, 245, 249] : rating >= 4 ? [220, 252, 231] :
      rating === 3 ? [254, 249, 195] : [254, 226, 226];
    const badgeTxtColor: [number, number, number] =
      pct === 0 ? [100, 116, 139] : rating >= 4 ? [22, 101, 52] :
      rating === 3 ? [180, 83, 9] : [153, 27, 27];
    const badgeX = trackX + barW + 2;
    doc.setFillColor(...badgeColor);
    doc.roundedRect(badgeX, yPos + 2.5, pctW, 6, 1, 1, 'F');
    doc.setTextColor(...badgeTxtColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`${Math.round(pct)}%`, badgeX + pctW / 2, yPos + 7, { align: 'center' });

    doc.setTextColor(...COLORS.textLight);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${count}`, badgeX + pctW + 2 + countW / 2, yPos + 7, { align: 'center' });

    yPos += rRowH;
  });

  yPos += 12;

  // Universal + Industry themes with sentiment
  const themeMap = new Map<string, Theme>();
  [...themesUniv.slice(0), ...themesInd.slice(0)]
    .filter(Boolean)
    .forEach((theme) => {
      const key = (theme.theme || '').trim().toLowerCase() || `${theme.theme}-${theme.count || theme.importance || 0}`;
      const existing = themeMap.get(key);

      if (!existing) {
        themeMap.set(key, {
          ...theme,
          verbatims: getThemeVerbatims(theme),
        });
        return;
      }

      const mergedQuotes = Array.from(
        new Set([
          ...getThemeVerbatims(existing),
          ...getThemeVerbatims(theme),
        ])
      );

      themeMap.set(key, {
        ...existing,
        count: Math.max(existing.count ?? 0, theme.count ?? 0),
        importance: Math.max(existing.importance ?? 0, theme.importance ?? 0),
        score: Math.max(existing.score ?? 0, theme.score ?? 0),
        sentiment: existing.sentiment ?? theme.sentiment,
        verbatims: mergedQuotes,
      });
    });

  const allThemes = Array.from(themeMap.values()).sort(
    (a, b) => (b.count || b.importance || 0) - (a.count || a.importance || 0)
  );

  if (allThemes.length > 0) {
    const renderThemesHeader = (startY: number): number => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text(S.recurringThemesTitle, MARGINS.left, startY);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...COLORS.textLight);
      doc.text(
        S.recurringThemesSubtitle,
        MARGINS.left,
        startY + 6
      );

      return startY + 14;
    };

    yPos = renderThemesHeader(yPos);

    const themeCardGap = 4;
    const themeCardW = (CONTENT_WIDTH - themeCardGap) / 2;
    const rowLimit = PAGE_HEIGHT - MARGINS.bottom - 4;
    const maxCount = Math.max(
      1,
      ...allThemes.map((t) => t.count || t.importance || 0)
    );

    const themeSentimentLabel = (sentiment?: string) => (
      sentiment === 'positive' ? S.themeSentimentPositive
        : sentiment === 'negative' ? S.themeSentimentNegative
        : S.themeSentimentMixed
    );

    for (let i = 0; i < allThemes.length; i += 2) {
      const rowThemes = allThemes.slice(i, i + 2).map((theme) => {
        const quotes = getThemeVerbatims(theme).slice(0,2);
        const wrappedQuotes = quotes.length > 0
          ? quotes.map((quote) => {
              const quoteTxt = truncateText(cleanVerbatim(quote), 320);
              return doc.splitTextToSize(`"${quoteTxt}"`, themeCardW - 16) as string[];
            })
          : [];

        const quoteLineCount = wrappedQuotes.reduce((sum, lines) => sum + lines.length, 0);
        const cardH = Math.max(
          48,
          47 + (quotes.length === 0 ? 6 : quoteLineCount * 4.1 + Math.max(0, quotes.length - 1) * 1.5)
        );

        return {
          theme,
          quotes,
          wrappedQuotes,
          cardH,
        };
      });

      const rowH = Math.max(...rowThemes.map((row) => row.cardH));

      if (yPos + rowH > rowLimit) {
        pageNumber = addNewPage(doc, pageNumber);
        yPos = MARGINS.top;
        yPos = renderThemesHeader(yPos);
      }

      rowThemes.forEach((row, colIdx) => {
        const { theme, quotes, wrappedQuotes } = row;
        const cardX = MARGINS.left + colIdx * (themeCardW + themeCardGap);
        const count = theme.count || theme.importance || 0;
        const accentColor = getSentimentColor(theme.sentiment);
        const sentBg = getSentimentBg(theme.sentiment);
        const sentColor = getSentimentColor(theme.sentiment);
        const sentLabel = themeSentimentLabel(theme.sentiment);

        doc.setFillColor(...ROW_WHITE);
        doc.roundedRect(cardX, yPos, themeCardW, rowH, 2, 2, 'F');
        doc.setDrawColor(...BLUE_LIGHT);
        doc.setLineWidth(0.4);
        doc.roundedRect(cardX, yPos, themeCardW, rowH, 2, 2, "S");

        doc.setFillColor(...accentColor);
        doc.roundedRect(cardX, yPos, 3, rowH, 1, 1, "F");

        doc.setFillColor(...accentColor);
        doc.rect(cardX + 1, yPos, 2, rowH, "F"); 

        doc.setTextColor(...COLORS.text);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.7);
        const themeLines = doc.splitTextToSize(truncateText(theme.theme, 38), themeCardW - 12);
        doc.text(themeLines.slice(0, 2), cardX + 6, yPos + 7);

        const badgeY = yPos + 13 + Math.max(0, (themeLines.length - 1) * 3.2);
        const badgeH = 6.5;
        const sentW = 28;
        const countW = 30;
        const sentX = cardX + 6;
        const countX = cardX + themeCardW - countW - 6;

        doc.setFillColor(...sentBg);
        doc.roundedRect(sentX, badgeY, sentW, badgeH, 1, 1, 'F');
        doc.setTextColor(...sentColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.text(sentLabel, sentX + sentW / 2, badgeY + 4.6, { align: 'center' });

        doc.setFillColor(219, 234, 254);
        doc.roundedRect(countX, badgeY, countW, badgeH, 1, 1, 'F');
        doc.setTextColor(30, 64, 175);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.text(`${count} ${S.mentions}`, countX + countW / 2, badgeY + 4.6, { align: 'center' });

        const freqLabelY = badgeY + 11;
        doc.setTextColor(...COLORS.textLight);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(S.frequencyLabel, cardX + 6, freqLabelY);

        const freqTrackY = freqLabelY + 3;
        const freqTrackX = cardX + 6;
        const freqTrackW = themeCardW - 12;
        const freqTrackH = 2.5;
        doc.setFillColor(219, 234, 254);
        doc.roundedRect(freqTrackX, freqTrackY, freqTrackW, freqTrackH, 1, 1, 'F');
        if (count > 0) {
          doc.setFillColor(...BLUE_PRIMARY);
          doc.roundedRect(
            freqTrackX,
            freqTrackY,
            (count / maxCount) * freqTrackW,
            freqTrackH,
            1,
            1,
            'F'
          );
        }

        const evidenceY = freqTrackY + 9;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.25);
        doc.line(cardX + 6, evidenceY, cardX + themeCardW - 6, evidenceY);

        doc.setTextColor(...COLORS.textLight);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(S.evidenceQuotesLabel, cardX + 6, evidenceY + 4);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.8);

        if (quotes.length === 0) {
          doc.setTextColor(...COLORS.textLight);
          doc.text(S.noEvidenceQuote, cardX + 6, evidenceY + 10);
        } else {
          let quoteY = evidenceY + 9;

          wrappedQuotes.forEach((quoteLines) => {
            doc.setTextColor(95, 99, 112);
            doc.text('-', cardX + 6, quoteY);
            doc.text(quoteLines, cardX + 9, quoteY);

            quoteY += Math.max(6, quoteLines.length * 3.6) + 1.5;
          });
        }
      });

      yPos += rowH + 4;
    }
  }

  addFooter(doc, pageNumber);

  
  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 4 — ANALYSE APPROFONDIE DES PROBLEMES (root causes)
  // ═══════════════════════════════════════════════════════════════════════════

const issuesWithRootCauses = topIssues
  .map(issue => ({
    ...issue,
    root_causes: (issue.root_causes ?? []).filter(rc => rc.causes && rc.causes.length > 0),
  }))
  .filter(i => i.root_causes.length > 0);

if (issuesWithRootCauses.length > 0) {

  issuesWithRootCauses.slice(0, 3).forEach((issue) => {

    pageNumber = addNewPage(doc, pageNumber);
    yPos = MARGINS.top;

    yPos = addSectionTitle(
      doc,
      S.ishikawaTitle,
      yPos,
      RED_PRIMARY
    );

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.textLight);

    doc.text(
      S.ishikawaSubtitle,
      MARGINS.left,
      yPos
    );

    yPos += 12;

    // ───────────────────────────────────────────
    // ISSUE HEADER
    // ───────────────────────────────────────────

    const issHdrH = 10;

    doc.setFillColor(...RED_PRIMARY);
    doc.roundedRect(
      MARGINS.left,
      yPos,
      CONTENT_WIDTH,
      issHdrH,
      2,
      2,
      'F'
    );

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);

    doc.text(
      `${S.problemLabel} : ${issue.theme}`,
      MARGINS.left + 5,
      yPos + 7
    );

    doc.setFillColor(255, 255, 255);

    const badgeW = 30;

    doc.roundedRect(
      MARGINS.left + CONTENT_WIDTH - badgeW - 4,
      yPos + 2,
      badgeW,
      6,
      2,
      2,
      'F'
    );

    doc.setTextColor(...RED_PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);

    doc.text(
      `${issue.count} ${S.mentions}`,
      MARGINS.left + CONTENT_WIDTH - badgeW / 2 - 4,
      yPos + 6.5,
      { align: 'center' }
    );

    yPos += issHdrH + 4;

    // ───────────────────────────────────────────
    // AI SYNTHESIS
    // ───────────────────────────────────────────

    if (issue.ai_synthesis) {

      const synthLines = doc.splitTextToSize(
        issue.ai_synthesis,
        CONTENT_WIDTH - 10
      );

      const synthH = Math.max(
        14,
        6 + synthLines.length * 4.5
      );

      doc.setFillColor(...RED_PALE);

      doc.roundedRect(
        MARGINS.left,
        yPos,
        CONTENT_WIDTH,
        synthH,
        2,
        2,
        'F'
      );

      doc.setFillColor(...RED_PRIMARY);
      doc.rect(
        MARGINS.left,
        yPos,
        3,
        synthH,
        'F'
      );

      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      doc.text(
        synthLines,
        MARGINS.left + 7,
        yPos + 6
      );

      yPos += synthH + 6;
    }

    // ───────────────────────────────────────────
    // ROOT CAUSES
    // ───────────────────────────────────────────

    issue.root_causes.slice(0, 3).forEach((rc) => {

      const categoryColor = getCategoryColor(
        rc.category_key
      );

      const causesLines =
        (rc.causes || []).map(c =>
          doc.splitTextToSize(
            `• ${c}`,
            CONTENT_WIDTH / 2 - 16
          )
        );

      const evidenceLines =
        (rc.evidence || []).map(e =>
          doc.splitTextToSize(
            `"${e}"`,
            CONTENT_WIDTH / 2 - 16
          )
        );

      const causeLineCount =
        causesLines.reduce(
          (a, lines) => a + Math.min(lines.length, 3),
          0
        );

      const evidenceLineCount =
        evidenceLines.reduce(
          (a, lines) => a + lines.length,
          0
        );

      const totalLines =
        Math.max(
          causeLineCount,
          evidenceLineCount
        );

      const rcCardH = Math.max(
        48,
        22 + totalLines * 3.8
      );

      // ─────────────────────────────────────
      // PAGE OVERFLOW
      // ─────────────────────────────────────

      if (yPos + rcCardH > PAGE_HEIGHT - 25) {

        addFooter(doc, pageNumber);

        pageNumber = addNewPage(
          doc,
          pageNumber
        );

        yPos = MARGINS.top;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...RED_PRIMARY);

        doc.text(
          `${S.problemLabel} : ${issue.theme} ${S.problemLabelContinued}`,
          MARGINS.left,
          yPos
        );

        yPos += 12;
      }

      // ─────────────────────────────────────
      // CARD
      // ─────────────────────────────────────

      doc.setFillColor(...COLORS.background);

      doc.roundedRect(
        MARGINS.left,
        yPos,
        CONTENT_WIDTH,
        rcCardH,
        2,
        2,
        'F'
      );

      doc.setFillColor(...categoryColor);

      doc.roundedRect(
        MARGINS.left,
        yPos,
        4,
        rcCardH,
        2,
        2,
        'F'
      );

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);

      const rcCategoryLabel = (getCategoryLabel(rc.category_key, reportLang) || rc.category || '').toUpperCase();
      const rcBadgeMinW = 35;
      const rcBadgeW = Math.max(rcBadgeMinW, doc.getTextWidth(rcCategoryLabel) + 10);

      doc.setFillColor(...categoryColor);

      doc.roundedRect(
        MARGINS.left + 8,
        yPos + 3,
        rcBadgeW,
        6,
        1,
        1,
        'F'
      );

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);

      doc.text(
        rcCategoryLabel,
        MARGINS.left + 8 + rcBadgeW / 2,
        yPos + 7.5,
        { align: 'center' }
      );

      // The root-cause "label" is only worth showing separately when it adds
      // information beyond the category badge itself (some records just
      // repeat the raw category key as the label, e.g. "manpower").
      const rcLabelNormalized = (rc.label || '').trim().toLowerCase();
      const rcIsDuplicateOfCategory =
        !rcLabelNormalized ||
        rcLabelNormalized === (rc.category || '').trim().toLowerCase() ||
        rcLabelNormalized === (rc.category_key || '').trim().toLowerCase() ||
        rcLabelNormalized === rcCategoryLabel.toLowerCase();

      if (!rcIsDuplicateOfCategory) {
        doc.setTextColor(...COLORS.text);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);

        doc.text(
          rc.label,
          MARGINS.left + 8 + rcBadgeW + 8,
          yPos + 8
        );
      }

      // Causes

      doc.setTextColor(...COLORS.textLight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);

      doc.text(
        S.causesLabel,
        MARGINS.left + 8,
        yPos + 17
      );

      doc.setFont('helvetica', 'normal');

      let causeY = yPos + 22;

      causesLines.forEach(lines => {

        lines.slice(0, 2).forEach((line: string) => {

          doc.text(
            line,
            MARGINS.left + 8,
            causeY
          );

          causeY += 4;
        });
      });

      // Evidence

      const evColX =
        MARGINS.left +
        CONTENT_WIDTH / 2 +
        4;

      doc.setTextColor(...COLORS.textLight);
      doc.setFont('helvetica', 'bold');

      doc.text(
        S.testimonialsLabel,
        evColX,
        yPos + 17
      );

      doc.setFont('helvetica', 'italic');
      doc.setTextColor(80, 80, 100);

      let evY = yPos + 22;

      evidenceLines.forEach(lines => {

        lines.slice(0,2).forEach((line: string) => {

          doc.text(
            line,
            evColX,
            evY
          );

          evY += 4;
        });
      });

      yPos += rcCardH + 4;
    });

    addFooter(doc, pageNumber);
  });
}
else {
  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;

  yPos = addSectionTitle(
    doc,
    S.ishikawaTitle,
    yPos,
    RED_PRIMARY
  );

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLORS.textLight);

  doc.text(
    S.ishikawaSubtitle,
    MARGINS.left,
    yPos
  );

  yPos += 12;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.text(
    S.noRootCause,
    MARGINS.left,
    yPos
  );

  addFooter(doc, pageNumber);
}


  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 5 — PAIN POINTS PRIORISES (real pain_points_prioritized)
  // ═══════════════════════════════════════════════════════════════════════════

  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;
  yPos = addSectionTitle(doc, S.painPointsTitle, yPos, COLORS.warning);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLORS.textLight);
  doc.text(S.painPointsSubtitle, MARGINS.left, yPos);
  yPos += 12;

  if (painPoints.length > 0) {
    // ── 4-column table: Issue | Impact | Ease | First Action ──
    // Row height is computed per-row from actual first-action line count.
    const ppTableW  = CONTENT_WIDTH;
    const ppIssueW  = 45;
    const ppImpactW = 20;
    const ppEaseW   = 20;
    const ppStepW   = ppTableW - ppIssueW - ppImpactW - ppEaseW;
    const ppHdrH       = 9;
    const PP_ROW_MIN   = 16;   // minimum row height (mm)
    const PP_LINE_H    = 4.0;  // line height for AI text (mm)
    const PP_PAD_V     = 6;    // total vertical padding inside a row (mm)

    // ── Header ──────────────────────────────────────────────────────────────
    doc.setFillColor(...COLORS.warning);
    doc.roundedRect(MARGINS.left, yPos, ppTableW, ppHdrH, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(S.ppHeaderIssue,       MARGINS.left + 4,                                         yPos + 6);
    doc.text(S.ppHeaderImpact,      MARGINS.left + ppIssueW + ppImpactW / 2,                  yPos + 6, { align: "center" });
    doc.text(S.ppHeaderEase,        MARGINS.left + ppIssueW + ppImpactW + ppEaseW / 2,        yPos + 6, { align: "center" });
    doc.text(S.ppHeaderFirstAction, MARGINS.left + ppIssueW + ppImpactW + ppEaseW + ppStepW / 2, yPos + 6, { align: "center" });
    yPos += ppHdrH;

    // ── Rows — height adapts to AI analysis content ──────────────────────────
    const ppStartY = yPos;
    const rowHeights: number[] = [];

    painPoints.forEach((pp, idx) => {
      // First action — full text, no truncation
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      const stepLines = doc.splitTextToSize(pp.first_step || "", ppStepW - 6) as string[];

      // Row height = padding + first-action line count × line-height, at least PP_ROW_MIN
      const ppRowH = Math.max(PP_ROW_MIN, PP_PAD_V + stepLines.length * PP_LINE_H);
      rowHeights.push(ppRowH);

      const bg: [number, number, number] = idx % 2 === 0 ? ORANGE_PALE : ROW_WHITE;
      doc.setFillColor(...bg);
      doc.rect(MARGINS.left, yPos, ppTableW, ppRowH, "F");

      // Dividers
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      if (idx > 0) doc.line(MARGINS.left, yPos, MARGINS.left + ppTableW, yPos);
      doc.line(MARGINS.left + ppIssueW,                       yPos, MARGINS.left + ppIssueW,                       yPos + ppRowH);
      doc.line(MARGINS.left + ppIssueW + ppImpactW,           yPos, MARGINS.left + ppIssueW + ppImpactW,           yPos + ppRowH);
      doc.line(MARGINS.left + ppIssueW + ppImpactW + ppEaseW, yPos, MARGINS.left + ppIssueW + ppImpactW + ppEaseW, yPos + ppRowH);

      const midY = yPos + ppRowH / 2 + 1.5; // vertical centre of row

      // ── Issue (bold title only) ──
      doc.setTextColor(...COLORS.text);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      const issueLines  = doc.splitTextToSize(pp.issue, ppIssueW - 8) as string[];
      const issueStartY = midY - ((Math.min(issueLines.length, 2) - 1) * 4) / 2;
      issueLines.slice(0, 2).forEach((line, li) => {
        doc.text(line, MARGINS.left + 4, issueStartY + li * 4);
      });

      // ── Impact — coloured badge ──
      const impactX      = MARGINS.left + ppIssueW + 2;
      const impactColor  = getImpactColor(pp.impact);
      const impactBadgeW = ppImpactW - 6;
      doc.setFillColor(...impactColor);
      doc.roundedRect(impactX, midY - 4, impactBadgeW, 7, 1.5, 1.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(`${pp.impact}/100`, impactX + impactBadgeW / 2, midY + 0.5, { align: "center" });

      // ── Difficulty — coloured label badge ──
      const easeX      = MARGINS.left + ppIssueW + ppImpactW + 2;
      const easeLabel  = getEaseLabel(pp.ease);
      const easeColor: [number, number, number] =
        pp.ease >= 70 ? GREEN_PRIMARY : pp.ease >= 40 ? COLORS.warning : RED_PRIMARY;
      const easeBadgeW = ppEaseW - 4;
      doc.setFillColor(...easeColor);
      doc.roundedRect(easeX, midY - 4, easeBadgeW, 7, 1.5, 1.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(easeLabel, easeX + easeBadgeW / 2, midY + 0.5, { align: "center" });

      // ── First recommended action — full text, top-aligned ──
      const stepX      = MARGINS.left + ppIssueW + ppImpactW + ppEaseW + 3;
      const stepStartY = yPos + PP_PAD_V / 2 + PP_LINE_H * 0.8;
      doc.setTextColor(...COLORS.text);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      stepLines.forEach((line, li) => {
        doc.text(line, stepX, stepStartY + li * PP_LINE_H);
      });

      yPos += ppRowH;
    });

    // Outer border spans the full accumulated height of all rows
    const totalRowsH = rowHeights.reduce((a, b) => a + b, 0);
    doc.setDrawColor(...COLORS.warning);
    doc.setLineWidth(0.6);
    doc.roundedRect(MARGINS.left, ppStartY - ppHdrH, ppTableW, ppHdrH + totalRowsH, 1, 1, "S");
  } else {
    doc.setTextColor(...COLORS.textLight);
    doc.setFontSize(10);
    doc.text(S.noPrioritizationData, MARGINS.left, yPos + 10);
    yPos += 20;
  }

  // Tip box
  yPos += 8;

  const paddingX = 5;
  const paddingTop = 7;
  const paddingBottom = 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const labelHeight = 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  const maxTextWidth = CONTENT_WIDTH - paddingX * 2;
  const tipLines = doc.splitTextToSize(S.tipText, maxTextWidth);

  const lineHeight = 4.5;

  const tipH =
    paddingTop +
    labelHeight +
    2 + 
    tipLines.length * lineHeight +
    paddingBottom;

  doc.setFillColor(255, 251, 235);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, tipH, 2, 2, "F");

  doc.setDrawColor(...COLORS.warning);
  doc.setLineWidth(0.8);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, tipH, 2, 2, "S");

  doc.setTextColor(...COLORS.warning);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(S.tipLabel, MARGINS.left + paddingX, yPos + paddingTop);

  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(
    tipLines,
    MARGINS.left + paddingX,
    yPos + paddingTop + labelHeight + 2,
    {
      maxWidth: maxTextWidth,
      lineHeightFactor: 1.25,
    },
  );

  addFooter(doc, pageNumber);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 6 — RECOMMANDATIONS (real quick_wins + projects)
  // ═══════════════════════════════════════════════════════════════════════════

  // pageNumber = addNewPage(doc, pageNumber);
  // yPos = MARGINS.top;

  // const page6Lang = reportLang;
  // const page6Text = (field: unknown): string => {
  //   if (!field) return "";
  //   if (typeof field === "string") {
  //     try {
  //       const parsed = JSON.parse(field);
  //       if (parsed && typeof parsed === "object") {
  //         const obj = parsed as Record<string, unknown>;
  //         return String(obj[page6Lang] ?? obj.fr ?? obj.en ?? field);
  //       }
  //     } catch {}
  //     return field;
  //   }
  //   if (typeof field === "object") {
  //     const obj = field as Record<string, unknown>;
  //     return String(obj[page6Lang] ?? obj.fr ?? obj.en ?? "");
  //   }
  //   return String(field);
  // };

  // const page6ResolveActionPlan = (obj: SmartObjective): string[] => {
  //   const raw: unknown[] =
  //     (obj.action_plan as any)?.[page6Lang] ??
  //     (obj.action_plan as any)?.fr ??
  //     (obj.action_plan as any)?.en ??
  //     [];

  //   if (Array.isArray(raw) && raw.length > 0) {
  //     return raw
  //       .map((item) => {
  //         if (typeof item === "string") return item;
  //         if (item && typeof item === "object") {
  //           const o = item as Record<string, unknown>;
  //           if (typeof o.text === "string") return o.text;
  //           if (o.title) return page6Text(o.title);
  //           return page6Text(item);
  //         }
  //         return String(item);
  //       })
  //       .filter(Boolean);
  //   }

  //   if (Array.isArray((obj as any).actions)) {
  //     return ((obj as any).actions as any[])
  //       .map((a) => {
  //         if (typeof a === "string") return a;
  //         if (typeof a?.text === "string") return a.text;
  //         if (a?.title) return page6Text(a.title);
  //         return page6Text(a);
  //       })
  //       .filter(Boolean);
  //   }

  //   return [];
  // };

  // const smartObjectivesByKey = new Map(
  //   (data.smart_objectives ?? [])
  //     .filter((obj) => obj.pareto_cause?.key || obj.problem)
  //     .map((obj) => {
  //       const key = String(obj.pareto_cause?.key ?? obj.problem ?? "")
  //         .trim()
  //         .toLowerCase();
  //       return [key, obj] as const;
  //     }),
  // );

  // const page6Objectives = topIssues.slice(0, 3).map((issue, idx) => {
  //   const matchKey = String(issue.key ?? issue.theme ?? "")
  //     .trim()
  //     .toLowerCase();
  //   const objective = smartObjectivesByKey.get(matchKey);
  //   return {
  //     issue,
  //     objective,
  //     issueName: page6Text(issue.theme || issue.key || `Issue ${idx + 1}`),
  //     issuePct:
  //       issue.count && data.totalReviews > 0
  //         ? Math.round((issue.count / data.totalReviews) * 100)
  //         : null,
  //     actionPlanItems: objective
  //       ? page6ResolveActionPlan(objective).slice(0, 4)
  //       : [],
  //     kpiText: objective ? page6Text(objective.kpi_label) : "",
  //     status: String(objective?.status ?? "todo").toLowerCase(),
  //     priority: String(objective?.priority ?? "").toLowerCase(),
  //     currentProgress: objective
  //       ? ((objective as any).current_progress ?? 0)
  //       : 0,
  //     currentValue: objective ? ((objective as any).current_value ?? 0) : 0,
  //     isMissing: !objective,
  //   };
  // });

  // yPos = addSectionTitle(
  //   doc,
  //   page6Lang === "fr" ? "Plan d'action recommande" : "Recommended action plan",
  //   yPos,
  //   COLORS.success,
  // );

  // if (page6Objectives.length === 0) {
  //   const emptyText =
  //     page6Lang === "fr" ? "Aucune action disponible" : "No actions available";
  //   const emptySub =
  //     page6Lang === "fr"
  //       ? "Aucun objectif SMART n a encore ete genere pour cet etablissement."
  //       : "No SMART objective has been created for this establishment yet.";
  //   const emptyBoxH = 34;
  //   doc.setFillColor(250, 250, 250);
  //   doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, emptyBoxH, 3, 3, "F");
  //   doc.setDrawColor(...COLORS.textLight);
  //   doc.setLineWidth(0.4);
  //   doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, emptyBoxH, 3, 3, "S");
  //   doc.setTextColor(...COLORS.textLight);
  //   doc.setFont("helvetica", "bold");
  //   doc.setFontSize(10);
  //   doc.text(emptyText, PAGE_WIDTH / 2, yPos + 15, { align: "center" });
  //   doc.setFont("helvetica", "normal");
  //   doc.setFontSize(8);
  //   doc.text(emptySub, PAGE_WIDTH / 2, yPos + 22, { align: "center" });
  // } else {
  //   page6Objectives.forEach((entry, idx) => {
  //     const issueName = entry.issueName;
  //     const issuePct = entry.issuePct;
  //     const actionPlanItems = entry.actionPlanItems;
  //     const kpiText = entry.kpiText;
  //     const status = entry.status;
  //     const priority = entry.priority;
  //     const isMissing = entry.isMissing;
  //     const accent =
  //       status === "completed"
  //         ? GREEN_PRIMARY
  //         : status === "in_progress"
  //           ? COLORS.warning
  //           : ([156, 163, 175] as [number, number, number]);
  //     const pale =
  //       status === "completed"
  //         ? GREEN_PALE
  //         : status === "in_progress"
  //           ? ([255, 248, 219] as [number, number, number])
  //           : ([243, 244, 246] as [number, number, number]);
  //     const statusLabel =
  //       status === "completed"
  //         ? page6Lang === "fr"
  //           ? "Termine"
  //           : "Completed"
  //         : status === "in_progress"
  //           ? page6Lang === "fr"
  //             ? "En cours"
  //             : "In progress"
  //           : page6Lang === "fr"
  //             ? "A faire"
  //             : "To do";

  //     const actionTextX = MARGINS.left + 12;
  //     const actionWrapWidth = CONTENT_WIDTH - 12;

  //     doc.setFont("helvetica", "normal");
  //     doc.setFontSize(8.2);

  //     const actionBlocks =
  //       actionPlanItems.length > 0
  //         ? actionPlanItems.map(
  //             (item) => doc.splitTextToSize(item, actionWrapWidth) as string[],
  //           )
  //         : [];

  //     const actionListH = actionBlocks.reduce(
  //       (sum, lines) => sum + lines.length * 4.1 + 1.5,
  //       0,
  //     );

  //     const cardH = 24 + actionListH + 4;
  //     if (yPos + cardH > PAGE_HEIGHT - MARGINS.bottom - 10) {
  //       pageNumber = addNewPage(doc, pageNumber);
  //       yPos = MARGINS.top;
  //     }

  //     const cardRadius = 3;
  //     const accentWidth = 1.8;

  //     doc.setFillColor(...accent);
  //     doc.roundedRect(
  //       MARGINS.left,
  //       yPos,
  //       CONTENT_WIDTH,
  //       cardH,
  //       cardRadius,
  //       cardRadius,
  //       "F",
  //     );

  //     doc.setFillColor(...pale);
  //     doc.roundedRect(
  //       MARGINS.left + accentWidth,
  //       yPos,
  //       CONTENT_WIDTH - accentWidth,
  //       cardH,
  //       cardRadius,
  //       cardRadius,
  //       "F",
  //     );

  //     doc.setDrawColor(...accent);
  //     doc.setLineWidth(0.6);
  //     doc.roundedRect(
  //       MARGINS.left,
  //       yPos,
  //       CONTENT_WIDTH,
  //       cardH,
  //       cardRadius,
  //       cardRadius,
  //       "S",
  //     );

  //     doc.setTextColor(...COLORS.text);
  //     doc.setFont("helvetica", "bold");
  //     doc.setFontSize(10);
  //     const displayedTitle = truncateText(issueName, 36);
  //     doc.text(displayedTitle, MARGINS.left + 6, yPos + 8);

  //     doc.setFillColor(...accent);
  //     doc.roundedRect(
  //       MARGINS.left + CONTENT_WIDTH - 28,
  //       yPos + 4,
  //       20,
  //       6,
  //       2,
  //       2,
  //       "F",
  //     );
  //     doc.setTextColor(255, 255, 255);
  //     doc.setFont("helvetica", "bold");
  //     doc.setFontSize(6.8);
  //     doc.text(statusLabel, MARGINS.left + CONTENT_WIDTH - 18, yPos + 8, {
  //       align: "center",
  //     });

  //     if (actionBlocks.length > 0) {
  //       doc.setFont("helvetica", "bold");
  //       doc.setTextColor(...accent);
  //       doc.setFontSize(8);
  //       doc.text(
  //         page6Lang === "fr" ? "Actions cles" : "Key actions",
  //         MARGINS.left + 6,
  //         yPos + 13,
  //       );
  //     } else {
  //       doc.setFont("helvetica", "italic");
  //       doc.setTextColor(...COLORS.textLight);
  //       doc.setFontSize(8);
  //       doc.text(
  //         page6Lang === "fr"
  //           ? "Aucune action disponible"
  //           : "No action items available",
  //         MARGINS.left + 6,
  //         yPos + 13,
  //       );
  //     }

  //     doc.setFont("helvetica", "normal");
  //     doc.setTextColor(...COLORS.text);
  //     doc.setFontSize(8.2);
  //     let lineY = yPos + 17;
  //     actionBlocks.forEach((lines, actionIdx) => {
  //       doc.setFillColor(...accent);
  //       doc.roundedRect(
  //         MARGINS.left + 5.5,
  //         lineY - 2.4,
  //         5.5,
  //         5.5,
  //         1.5,
  //         1.5,
  //         "F",
  //       );
  //       doc.setTextColor(255, 255, 255);
  //       doc.setFont("helvetica", "bold");
  //       doc.setFontSize(6.8);
  //       doc.text(String(actionIdx + 1), MARGINS.left + 8.75, lineY + 1.6, {
  //         align: "center",
  //       });

  //       doc.setTextColor(...COLORS.text);
  //       doc.setFont("helvetica", "normal");
  //       doc.setFontSize(8.2);
  //       lines.forEach((ln, lineIdx) => {
  //         doc.text(ln, actionTextX, lineY + lineIdx * 4.1);
  //       });
  //       lineY += lines.length * 4.1 + 2.2;
  //     });

  //     doc.setTextColor(...COLORS.textLight);
  //     doc.setFontSize(7.8);

  //     yPos += cardH + 4;
  //   });
  // }

  // addFooter(doc, pageNumber);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 10 — SMART OBJECTIFS (one card per objective, full page each)
  // ═══════════════════════════════════════════════════════════════════════════


const smartObjectives = (data.smart_objectives ?? []).filter(obj =>
  topIssues.some(issue =>
    issue.key
      ? issue.key === obj.pareto_cause?.key
      : issue.theme.trim().toLowerCase() ===
        obj.problem.trim().toLowerCase()
  )
);
  const lang = reportLang;

  // Resolve any field shape: plain string | { en, fr } object | JSON string
  const t = (field: unknown): string => {
    if (!field) return '';
    if (typeof field === 'string') {
      try {
        const p = JSON.parse(field);
        if (p && typeof p === 'object') return String(p[lang] ?? p.fr ?? p.en ?? field);
      } catch {}
      return field;
    }
    if (typeof field === 'object') {
      const f = field as Record<string, unknown>;
      return String(f[lang] ?? f.fr ?? f.en ?? '');
    }
    return String(field);
  };

  // Resolve action_plan items.
  // action_plan[lang] is Array<{ text: string; priority: string }>
  // Falls back to actions[] if empty.
  const resolveActionPlan = (obj: SmartObjective): string[] => {
    const raw: unknown[] =
      (obj.action_plan as any)?.[lang] ??
      (obj.action_plan as any)?.fr ??
      (obj.action_plan as any)?.en ??
      [];

    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const o = item as Record<string, unknown>;
          // { text: string, priority: string } — the actual shape
          if (typeof o.text === 'string') return o.text;
          // { title: BilingualString | string }
          if (o.title) return t(o.title);
          // flat bilingual { en, fr }
          return t(item);
        }
        return String(item);
      }).filter(Boolean);
    }

    // Fallback: actions[] array
    if (Array.isArray((obj as any).actions)) {
      return ((obj as any).actions as any[]).map((a) => {
        if (typeof a === 'string') return a;
        if (typeof a?.text === 'string') return a.text;
        if (a?.title) return t(a.title);
        return t(a);
      }).filter(Boolean);
    }

    return [];
  };

  if (smartObjectives.length > 0) {
    // ── Section header page ─────────────────────────────────────────────────
    pageNumber = addNewPage(doc, pageNumber);
    yPos = MARGINS.top;
    yPos = addSectionTitle(doc, lang === 'fr' ? "Objectifs SMART & Plan d'action" : 'SMART Objectives & Action Plan', yPos, PURPLE_PRIMARY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.textLight);
    doc.text(
      lang === 'fr'
        ? 'Objectifs definis sur la base des causes prioritaires identifiees par l\'IA'
        : 'Objectives defined based on priority causes identified by AI',
      MARGINS.left, yPos
    );
    yPos += 9;

    // ── One objective per card, stacked vertically ──────────────────────────
    const issueCards = topIssues.slice(0, 3).map((issue) => ({
      issue,
      objective: smartObjectives.find((obj) =>
        issue.key
          ? issue.key === obj.pareto_cause?.key
          : issue.theme.trim().toLowerCase() === obj.problem.trim().toLowerCase()
      ),
    }));

    issueCards.forEach(({ issue, objective }, objIdx) => {

      const hasObjective = Boolean(objective);
      const estimatedCardH = hasObjective ? 180 : 42;

      // New page if not enough room for a card
      if (yPos > PAGE_HEIGHT - MARGINS.bottom - estimatedCardH) {
        pageNumber = addNewPage(doc, pageNumber);
        yPos = MARGINS.top + 2;
      }

      const obj = (objective ?? {}) as any;
      const issueName = truncateText(issue.theme || issue.key || '', 38);
      const causeName  = hasObjective
        ? t(obj.pareto_cause) || obj.pareto_cause?.key || issueName
        : issueName;
      const statusStr = hasObjective ? String(obj.status ?? 'todo').toLowerCase() : 'todo';
      const statusLabel =
        statusStr === 'completed'   ? (lang === 'fr' ? 'Termine'    : 'Completed')   :
        statusStr === 'done'        ? (lang === 'fr' ? 'Termine'    : 'Done')        :
        statusStr === 'in_progress' ? (lang === 'fr' ? 'En cours'   : 'In progress') :
                                      (lang === 'fr' ? 'A faire'    : 'To do');
      const statusColor: [number, number, number] =
        statusStr === "completed" || statusStr === "done"
          ? GREEN_PRIMARY
          : statusStr === "in_progress"
            ? COLORS.warning
            : COLORS.textLight;

      // Deadline
      const deadlineDate = (obj as any).deadline
        ? new Date((obj as any).deadline).toLocaleDateString(
            lang === 'fr' ? 'fr-FR' : 'en-GB',
            { month: 'long', year: 'numeric' }
          )
        : '';

      const currentVal     = (obj as any).current_value ?? 0;
      const currentProgress = (obj as any).current_progress ?? 0;
      const targetVal      = (obj as any).computed_target ?? (obj as any).target_value ?? 0;
      const paretoCount    = (obj as any).pareto_count ?? currentVal;

      // Progress = current_value - current_progress (issues reduced so far)
      // baseline = pareto_count (starting number of issues)
      const reduced     = Math.max(0, currentVal - currentProgress);
      const baseline    = Math.max(paretoCount, currentVal);
      const range       = Math.max(1, baseline - targetVal);
      const progressPct = Math.round((reduced / range) * 100);
      const safePct     = Math.min(100, Math.max(0, progressPct));

      const impactStr = String((obj as any).impact ?? '').toLowerCase();
      const effortStr = String((obj as any).effort ?? '').toLowerCase();

      const impactColor: [number, number, number] =
        impactStr === 'high'   ? RED_PRIMARY :
        impactStr === 'medium' ? COLORS.warning : GREEN_PRIMARY;
      const effortColor: [number, number, number] =
        effortStr === 'high'   ? RED_PRIMARY :
        effortStr === 'medium' ? COLORS.warning : GREEN_PRIMARY;

      // ── Card header ────────────────────────────────────────────────────────
      const hdrH = 10;
      const headerCenterY = yPos + hdrH / 2;

      // Header background
      doc.setFillColor(...PURPLE_PRIMARY);
      doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, hdrH, 3, 3, "F");
      const circleX = MARGINS.left + 8;
      doc.setFillColor(255, 255, 255);
      doc.circle(circleX, headerCenterY, 4.5, "F");

      doc.setTextColor(...PURPLE_PRIMARY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`${objIdx + 1}`, circleX, headerCenterY + 1.1, {
        align: "center",
      });

      // --------------------
      // Cause Name
      // --------------------
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(
        truncateText(causeName, 38),
        MARGINS.left + 18,
        headerCenterY + 1,
      );

      // --------------------
      // Status Badge
      // --------------------
      const statusW = 22;
      const statusH = 6;
      const statusX = MARGINS.left + CONTENT_WIDTH - statusW - 3;
      const statusY = headerCenterY - statusH / 2;

      doc.setFillColor(...statusColor);
      doc.roundedRect(statusX, statusY, statusW, statusH, 2, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(statusLabel, statusX + statusW / 2, headerCenterY + 0.8, {
        align: "center",
      });

      yPos += hdrH + 3;

      if (!hasObjective) {
        const missingSub =
          lang === "fr"
            ? `Le probleme "${issueName}" n a pas encore d objectif SMART.`
            : `The issue "${issueName}" has no SMART objective yet.`;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.6);
        const missingLines = (
          doc.splitTextToSize(missingSub, CONTENT_WIDTH - 16) as string[]
        ).slice(0, 2);

        const M_TOP_PAD = 7;
        const M_TITLE_H = 5;
        const M_TITLE_GAP = 3;
        const M_LINE_H = 4.2;
        const M_BOTTOM_PAD = 6;

        const missingCardH =
          M_TOP_PAD +
          M_TITLE_H +
          M_TITLE_GAP +
          missingLines.length * M_LINE_H +
          M_BOTTOM_PAD;

        doc.setFillColor(255, 250, 223);
        doc.roundedRect(
          MARGINS.left + 2,
          yPos,
          CONTENT_WIDTH - 4,
          missingCardH,
          3,
          3,
          "F",
        );
        doc.setDrawColor(...COLORS.warning);
        doc.setLineWidth(0.5);
        doc.roundedRect(
          MARGINS.left + 2,
          yPos,
          CONTENT_WIDTH - 4,
          missingCardH,
          3,
          3,
          "S",
        );

        doc.setTextColor(...COLORS.warning);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text(
          lang === "fr"
            ? "Aucun objectif SMART disponible"
            : "No SMART objective available",
          MARGINS.left + 7,
          yPos + M_TOP_PAD,
        );

        doc.setTextColor(...COLORS.textLight);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.6);
        const subtitleStartY = yPos + M_TOP_PAD + M_TITLE_H + M_TITLE_GAP;
        missingLines.forEach((line: string, idx: number) => {
          doc.text(line, MARGINS.left + 7, subtitleStartY + idx * M_LINE_H);
        });

        yPos += missingCardH + 6; 
        return;
      }
      const PAD = 4.5;
      const IW = CONTENT_WIDTH - PAD * 2;

      const problemTxt = hasObjective ? t(obj.problem) : "";
      const kpiTxt = hasObjective ? t(obj.kpi_label) : '';
      const unitTxt = hasObjective
        ? (() => {
            const raw = t(obj.unit);
            return raw.split('|')[0].trim();
          })()
        : '';
      const actionPlanItems = hasObjective ? resolveActionPlan(obj).slice(0, 4) : [];

      const problemLines = doc.splitTextToSize(problemTxt, IW);
      const kpiLines = doc.splitTextToSize(kpiTxt, IW);


const localizedSmartText = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const f = value as Record<string, unknown>;
    return String(f[lang] ?? f.en ?? f.fr ?? Object.values(f)[0] ?? '');
  }
  return String(value);
};

const objectiveActions = Array.isArray((obj as any).actions) ? ((obj as any).actions as any[]) : [];
const launchActions = objectiveActions.length > 0
  ? objectiveActions.slice(0, 2).map((a: any) => localizedSmartText(a?.text ?? a))
  : actionPlanItems.slice(0, 2);
const checklistCompleted = objectiveActions.filter((a: any) => a?.completed).length;
const fieldExecutionProgress = objectiveActions.length > 0
  ? Math.round((checklistCompleted / objectiveActions.length) * 100)
  : safePct;

const startFmt = (obj as any).created_at
  ? new Date((obj as any).created_at).toLocaleDateString(
      lang === 'fr' ? 'fr-FR' : 'en-GB',
      { day: 'numeric', month: 'long', year: 'numeric' }
    )
  : '';

const pdcaInnerW = IW - 10;
const pdcaPlanLines = doc.splitTextToSize(problemTxt || (lang === 'fr' ? 'Plan a definir' : 'Plan to define'), pdcaInnerW) as string[];
const pdcaDoLines = launchActions.length > 0
  ? launchActions.flatMap((a: string) => doc.splitTextToSize(a, pdcaInnerW) as string[])
  : doc.splitTextToSize(lang === 'fr' ? 'Aucune action renseignee' : 'No action provided', pdcaInnerW) as string[];
const pdcaCheckLines = [
  `${lang === 'fr' ? 'KPI' : 'KPI'}: ${kpiTxt}`,
  `${lang === 'fr' ? 'Objectif' : 'Objective'}: ${targetVal} ${unitTxt}`,
  `${lang === 'fr' ? 'Current' : 'Current'}: ${(obj as any).current_progress ?? currentVal} ${unitTxt}`,
  `${lang === 'fr' ? 'Field execution' : 'Field execution'}: ${fieldExecutionProgress}%`,
].flatMap((line: string) => doc.splitTextToSize(line, pdcaInnerW) as string[]);
const pdcaActLines = statusStr === 'todo'
  ? doc.splitTextToSize(
      lang === 'fr'
        ? 'En attente de validation du plan pour lancer la collecte de donnees.'
        : 'Waiting for plan validation to start data collection.',
      pdcaInnerW
    ) as string[]
  : [
      `${lang === 'fr' ? 'Start' : 'Start'}: ${startFmt || (lang === 'fr' ? 'A definir' : 'To define')}`,
      `${lang === 'fr' ? 'Expected end' : 'Expected end'}: ${deadlineDate || (lang === 'fr' ? 'A definir' : 'To define')}`,
      `${lang === 'fr' ? 'Target' : 'Target'}: ${currentVal} ${unitTxt} -> ${targetVal} ${unitTxt}`,
      `${lang === 'fr' ? 'Current situation' : 'Current situation'}: ${(obj as any).current_progress ?? currentVal} ${unitTxt}`,
      `${lang === 'fr' ? 'Field execution' : 'Field execution'}: ${fieldExecutionProgress}%`,
    ].flatMap((line: string) => doc.splitTextToSize(line, pdcaInnerW) as string[]);

const PDCA_BODY_OFFSET = 15;  
const PDCA_LINE_STEP = 3.8;  
const PDCA_BOTTOM_PAD = 5;    
 
const measurePdcaStepHeight = (lines: string[], minHeight: number): number => {
  const lastLineBaselineOffset = PDCA_BODY_OFFSET + Math.max(0, lines.length - 1) * PDCA_LINE_STEP;
  return Math.max(minHeight, lastLineBaselineOffset + PDCA_BOTTOM_PAD);
};

const pdcaStepHeights = [
  measurePdcaStepHeight(pdcaPlanLines, 21),
  measurePdcaStepHeight(pdcaDoLines, 22),
  measurePdcaStepHeight(pdcaCheckLines, 24),
  measurePdcaStepHeight(pdcaActLines, 24),
];

const badgeH = 6.5;
const trackH = 6;

const pdcaBlockH = 11 + pdcaStepHeights.reduce((sum, h) => sum + h + 2.5, 0);

const cardH =
  PAD +
  badgeH +
  3 +
  PAD +
  4.2 +
  problemLines.length * 4 +
  3 +
  4.2 +
  kpiLines.length * 4 +
  3 +
  4.2 +
  pillH +
  3 +
  trackH + 4 +
  pdcaBlockH +
  PAD;

doc.setFillColor(250, 248, 255);
doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, cardH, 3, 3, "F");
doc.setDrawColor(...PURPLE_PRIMARY);
doc.setLineWidth(0.5);
      doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, cardH, 3, 3, 'S');

      let cy = yPos + PAD;

    
      const badge3W = (IW - 6) / 3;
      const bX      = MARGINS.left + PAD;

      doc.setFillColor(...impactColor);
      doc.roundedRect(bX, cy, badge3W, badgeH, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      const impactLabelPrefix = lang === 'fr' ? 'Impact' : 'Impact';
      doc.text(`${impactLabelPrefix} : ${getLevelLabel((obj as any).impact, lang)}`, bX + badge3W / 2, cy + 4.8, { align: 'center' });

      doc.setFillColor(...effortColor);
      doc.roundedRect(bX + badge3W + 3, cy, badge3W, badgeH, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      const effortLabelPrefix = lang === 'fr' ? 'Effort' : 'Effort';
      doc.text(`${effortLabelPrefix} : ${getLevelLabel((obj as any).effort, lang)}`, bX + badge3W + 3 + badge3W / 2, cy + 4.8, { align: 'center' });

      const ishiCatKey = String((obj as any).ishikawa_top_category ?? '');
      const ishiCat   = getCategoryLabel(ishiCatKey, lang).toUpperCase();
      const ishiColor = getCategoryColor(ishiCatKey);
      doc.setFillColor(...ishiColor);
      doc.roundedRect(bX + (badge3W + 3) * 2, cy, badge3W, badgeH, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.text(ishiCat || '—', bX + (badge3W + 3) * 2 + badge3W / 2, cy + 4.8, { align: 'center' });

      cy += badgeH + 3;

      // Divider
      doc.setDrawColor(210, 200, 240);
      doc.setLineWidth(0.3);
      doc.line(MARGINS.left + PAD, cy, MARGINS.left + CONTENT_WIDTH - PAD, cy);
      cy += PAD;

      // ── Problem ──────────────────────────────────────────────────────────────
      doc.setTextColor(...PURPLE_PRIMARY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.text(lang === 'fr' ? 'OBJECTIF CLAIR' : 'CLEAR GOAL', MARGINS.left + PAD, cy);
      cy += 4.2;
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.6);
      problemLines.forEach((line: string) => { doc.text(line, MARGINS.left + PAD, cy); cy += 4.0; });
      cy += 3;

      // ── KPI ──────────────────────────────────────────────────────────────────
      doc.setTextColor(...PURPLE_PRIMARY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.text(lang === 'fr' ? 'MESURÉ PAR' : 'MEASURED BY', MARGINS.left + PAD, cy);
      cy += 4.2;
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.6);
      kpiLines.forEach((line: string) => { doc.text(line, MARGINS.left + PAD, cy); cy += 4.0; });
      cy += 3;

      // ── Progress ─────────────────────────────────────────────────────────────
      doc.setTextColor(...PURPLE_PRIMARY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.text(lang === 'fr' ? 'PROGRESSION' : 'PROGRESS', MARGINS.left + PAD, cy);
      cy += 4.2;

      // Current → Target pills
      const halfIW = (IW - 6) / 2;
      doc.setFillColor(230, 220, 255);
      doc.roundedRect(MARGINS.left + PAD, cy, halfIW, pillH, 2, 2, 'F');
      doc.setTextColor(...PURPLE_PRIMARY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.9);
      doc.text(
        `${lang === 'fr' ? 'Actuel' : 'Current'}: ${currentVal} ${unitTxt}`,
        MARGINS.left + PAD + halfIW / 2, cy + 4.1, { align: 'center' }
      );
      doc.setTextColor(...COLORS.textLight);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('>', MARGINS.left + PAD + halfIW + 3, cy + 5, { align: 'center' });
      doc.setFillColor(...GREEN_PALE);
      doc.roundedRect(MARGINS.left + PAD + halfIW + 6, cy, halfIW, pillH, 2, 2, 'F');
      doc.setTextColor(...GREEN_PRIMARY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.9);
      doc.text(
        `${lang === 'fr' ? 'Cible' : 'Target'}: ${targetVal} ${unitTxt}`,
        MARGINS.left + PAD + halfIW + 6 + halfIW / 2, cy + 4.1, { align: 'center' }
      );
      cy += pillH + 3;

      // ── Progress bar ─────────────────────────────────────────────────────────
      const trackW = IW;
      doc.setFillColor(219, 234, 254);
      doc.roundedRect(MARGINS.left + PAD, cy, trackW, trackH, 2, 2, 'F');

const fillColor: [number, number, number] =
  safePct >= 70 ? GREEN_PRIMARY :
  safePct >= 40 ? ([99, 102, 241] as [number, number, number]) :
  safePct > 0 ? ([167, 139, 250] as [number, number, number]) :
  ([200, 195, 220] as [number, number, number]);

const renderPct = safePct === 0 ? 3 : safePct;
const fillW = (renderPct / 100) * trackW;

doc.setFillColor(...fillColor);
doc.roundedRect(MARGINS.left + PAD, cy, fillW, trackH, 2, 2, 'F');

// Build bar label
const barLabel = safePct === 0
  ? (lang === 'fr' ? 'Debut' : 'Start')
  : `${safePct}% (${lang === 'fr' ? 'reduit de' : 'reduced by'} ${reduced})`;

doc.setFont('helvetica', 'bold');
doc.setFontSize(7);

const textY = cy + trackH / 2;

// For larger bars, center the label inside the bar
if (fillW > 60) {
  doc.setTextColor(255, 255, 255);

  doc.text(
    barLabel,
    MARGINS.left + PAD + fillW / 2,
    textY,
    {
      align: 'center',
      baseline: 'middle',
      maxWidth: fillW - 10,
    }
  );
} else {
  // Small bars: place label outside
  doc.setTextColor(60, 60, 60);

  doc.text(
    barLabel,
    MARGINS.left + PAD + fillW + 3,
    textY,
    {
      align: 'left',
      baseline: 'middle',
      maxWidth: Math.max(trackW - fillW - 6, 20),
    }
  );
}

      cy += trackH + 4;

      doc.setFillColor(...PURPLE_PALE);
      doc.roundedRect(MARGINS.left + PAD, cy, IW, 7, 2, 2, 'F');
      doc.setTextColor(...PURPLE_PRIMARY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.text(
        lang === 'fr' ? "Cycle PDCA" : "PDCA cycle",
        MARGINS.left + PAD + 4,
        cy + 4.8
      );
      doc.setTextColor(...COLORS.textLight);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(
        lang === 'fr'
          ? "Planifier, executer, verifier, ajuster"
          : "Plan, do, check, act",
        MARGINS.left + PAD + IW - 4,
        cy + 4.8,
        { align: 'right' }
      );
      cy += 11;

      const pdcaGap = 3;
      const pdcaSteps = [
        {
          number: '1',
          title: lang === 'fr' ? 'Plan' : 'Plan',
          subtitle: lang === 'fr' ? 'Decision manager' : 'Manager decision',
          accent: PURPLE_PRIMARY,
          fill: PURPLE_PALE,
          lines: pdcaPlanLines,
          badge: '',
        },
        {
          number: '2',
          title: lang === 'fr' ? 'Do' : 'Do',
          subtitle: lang === 'fr' ? 'Action terrain' : 'Field action',
          accent: ORANGE_PRIMARY,
          fill: ORANGE_PALE,
          lines: pdcaDoLines,
          badge: actionPlanItems.length > 0
            ? (lang === 'fr' ? 'Actions' : 'Actions')
            : (lang === 'fr' ? 'Aucune' : 'None'),
        },
        {
          number: '3',
          title: lang === 'fr' ? 'Check' : 'Check',
          subtitle: lang === 'fr' ? 'Mesure automatique' : 'Automatic measure',
          accent: COLORS.warning,
          fill: [255, 249, 219] as [number, number, number],
          lines: pdcaCheckLines,
          badge: lang === 'fr' ? 'Automatique' : 'Automatic',
        },
        {
          number: '4',
          title: lang === 'fr' ? 'Act' : 'Act',
          subtitle: lang === 'fr' ? 'Ajustement' : 'Adjustment',
          accent: GREEN_PRIMARY,
          fill: GREEN_PALE,
          lines: pdcaActLines,
          badge: lang === 'fr' ? 'Suivi' : 'Tracking',
        },
      ] as const;

      pdcaSteps.forEach((step, stepIdx) => {
        const stepH = pdcaStepHeights[stepIdx];
        doc.setFillColor(...step.fill);
        doc.setDrawColor(...step.accent);
        doc.setLineWidth(0.4);
        doc.roundedRect(MARGINS.left + PAD, cy, IW, stepH, 2, 2, 'F');
        doc.roundedRect(MARGINS.left + PAD, cy, IW, stepH, 2, 2, 'S');

        doc.setFillColor(...step.accent);
        doc.circle(MARGINS.left + PAD + 6, cy + 6, 3.3, 'F');
        doc.setTextColor(...COLORS.white);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(step.number, MARGINS.left + PAD + 6, cy + 7.1, { align: 'center' });

        doc.setTextColor(...step.accent);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.6);
        doc.text(step.title, MARGINS.left + PAD + 13, cy + 5.2);
        doc.setTextColor(...COLORS.textLight);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.3);
        doc.text(`(${step.subtitle})`, MARGINS.left + PAD + 13, cy + 9.6);

        if (step.badge) {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(...step.accent);
          doc.setLineWidth(0.2);
          doc.roundedRect(MARGINS.left + PAD + IW - 26, cy + 3.4, 22, 5.5, 2, 2, 'F');
          doc.setTextColor(...step.accent);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.text(truncateText(step.badge, 18), MARGINS.left + PAD + IW - 15, cy + 7.1, { align: 'center' });
        }

        const bodyY = cy + 15;
        doc.setTextColor(...COLORS.text);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.0);

        if (stepIdx === 2) {
          const barTrackW = IW - 12;
          const barTrackH = 5.5;
          const barY = bodyY + 1.5;
          const barPct = Math.min(100, Math.max(0, fieldExecutionProgress));
          const barFillW = Math.max(4, (barPct / 100) * barTrackW);

          step.lines.forEach((line, lineIdx) => {
            doc.text(line, MARGINS.left + PAD + 4, bodyY + lineIdx * 3.8);
          });
        } else {
          let lineY = bodyY;
          step.lines.forEach((line) => {
            doc.text(line, MARGINS.left + PAD + 4, lineY);
            lineY += 3.8;
          });
        }

        cy += stepH + 2.5;
      });

      yPos += cardH + 6;
    });

  }

  
// ═══════════════════════════════════════════════════════════════════════════
  // PAGE 9 — Operational Checklist (unified layout: one calculation, one draw)
  // ═══════════════════════════════════════════════════════════════════════════

  const checklistLang = reportLang;

  const checklistText = (field: unknown): string => {
    if (!field) return "";
    if (typeof field === "string") {
      try {
        const parsed = JSON.parse(field);
        if (parsed && typeof parsed === "object") {
          const obj = parsed as Record<string, unknown>;
          return String(obj[checklistLang] ?? obj.fr ?? obj.en ?? field);
        }
      } catch {}
      return field;
    }
    if (typeof field === "object") {
      const obj = field as Record<string, unknown>;
      return String(obj[checklistLang] ?? obj.fr ?? obj.en ?? "");
    }
    return String(field);
  };

  const checklistNormalizeFrequency = (frequency?: string) => {
    const value = String(frequency ?? "").toLowerCase();
    if (value === "weekly") return "weekly";
    if (value === "monthly" || value === "once") return "monthly";
    return "daily";
  };

  const checklistScheduleLabel = (action: any): string => {
    if (!action?.schedule) return "";
    const isCustom =
      action.schedule === "custom_time" || action.schedule === "custom_date";
    if (isCustom && action.schedule_value) return action.schedule_value;

    const labels: Record<string, string> = {
      start_of_day: checklistLang === "fr" ? "Debut de journee" : "Start of day",
      during_activity:
        checklistLang === "fr" ? "Pendant l'activite" : "During activity",
      end_of_day: checklistLang === "fr" ? "Fin de journee" : "End of day",
      custom_time: checklistLang === "fr" ? "Heure personnalisee" : "Custom time",
      monday: checklistLang === "fr" ? "Lundi" : "Monday",
      tuesday: checklistLang === "fr" ? "Mardi" : "Tuesday",
      wednesday: checklistLang === "fr" ? "Mercredi" : "Wednesday",
      thursday: checklistLang === "fr" ? "Jeudi" : "Thursday",
      friday: checklistLang === "fr" ? "Vendredi" : "Friday",
      saturday: checklistLang === "fr" ? "Samedi" : "Saturday",
      sunday: checklistLang === "fr" ? "Dimanche" : "Sunday",
      start_of_month:
        checklistLang === "fr" ? "Debut de mois" : "Start of month",
      mid_month: checklistLang === "fr" ? "Mi-mois" : "Mid-month",
      end_of_month:
        checklistLang === "fr" ? "Fin de mois" : "End of month",
      custom_date: checklistLang === "fr" ? "Date personnalisee" : "Custom date",
    };

    return labels[action.schedule] ?? String(action.schedule);
  };

  const checklistObjectives = topIssues.slice(0, 3).map((issue, idx) => {
    const matchKey = String(issue.key ?? issue.theme ?? "").trim().toLowerCase();
    const objective = (data.smart_objectives ?? []).find((obj) => {
      const objectiveKey = String(obj.pareto_cause?.key ?? obj.problem ?? "")
        .trim()
        .toLowerCase();
      return objectiveKey === matchKey;
    });

    const issueName = checklistText(issue.theme || issue.key || `Issue ${idx + 1}`);
    const status = String(objective?.status ?? "todo").toLowerCase();
    const actions = Array.isArray(objective?.actions) ? objective!.actions : [];
    const entries = actions.map((action) => ({
      ...action,
      frequency: checklistNormalizeFrequency(action.frequency),
      text: checklistText(action.text),
    }));
    const grouped = {
      daily: entries.filter((item) => item.frequency === "daily"),
      weekly: entries.filter((item) => item.frequency === "weekly"),
      monthly: entries.filter((item) => item.frequency === "monthly"),
    };
    const totalCount = entries.length;
    const completedCount = entries.filter((item) => item.completed).length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const issuePct =
      issue.count && data.totalReviews > 0
        ? Math.round((issue.count / data.totalReviews) * 100)
        : null;

    return { issueName, issuePct, objective, status, progress, grouped, hasObjective: Boolean(objective) };
  });

  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;
  yPos = addSectionTitle(
    doc,
    checklistLang === "fr" ? "Checklist operationnelle/Plan d'action recommande" : "Operational checklist/Recommended action plan",
    yPos,
    GREEN_PRIMARY,
  );

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9.2);
  doc.setTextColor(...COLORS.textLight);
  doc.text(
    checklistLang === "fr"
      ? "Routine a suivre sur le terrain"
      : "Routine to follow in the field",
    MARGINS.left,
    yPos,
  );
  yPos += 10;

  const checklistSectionTitle = (key: "daily" | "weekly" | "monthly") =>
    checklistLang === "fr"
      ? key === "daily"
        ? "QUOTIDIEN"
        : key === "weekly"
          ? "HEBDOMADAIRE"
          : "MENSUEL"
      : key === "daily"
        ? "DAILY"
        : key === "weekly"
          ? "WEEKLY"
          : "MONTHLY";

  const CL_HEADER_H = 13;        
  const CL_CARD_GAP = 6;         
  const CL_SUMMARY_H = 15;     
  const CL_SECTION_HEADER_H = 7; 
  const CL_INNER_BOTTOM_PAD = 4;  
  const CL_CARD_GAP_BETWEEN = 10;  
  const CL_MIN_CARD_H = 52;
  const CL_NO_OBJECTIVE_H = 30;
  const CL_TEXT_LEFT_OFFSET = 12;
  const CL_TEXT_BADGE_GAP = 4;    
  const CL_TEXT_RIGHT_MARGIN = 2; 

  type ChecklistLineItem = {
    item: any;
    lines: string[];
    rowHeight: number;
    badgeText: string;
    badgeFontSize: number;
    badgeW: number;
  };
  type ChecklistSectionLayout = {
    title: string;
    count: number;
    items: ChecklistLineItem[];
    headerH: number;
    itemsH: number;
    totalH: number;
  };

  const layoutChecklistCard = (entry: (typeof checklistObjectives)[number]) => {
    const rawSections: Array<{ key: "daily" | "weekly" | "monthly"; items: any[] }> = [
      { key: "daily", items: entry.grouped.daily },
      { key: "weekly", items: entry.grouped.weekly },
      { key: "monthly", items: entry.grouped.monthly },
    ];

    const sections: ChecklistSectionLayout[] = rawSections.map((section) => {
      const items: ChecklistLineItem[] = section.items.map((item: any) => {
        const badgeText = checklistScheduleLabel(item);
        let badgeW = 0;
        const badgeFontSize = badgeText.length > 14 ? 5.2 : 5.8;
        if (badgeText) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(badgeFontSize);
          badgeW = Math.min(30, Math.max(12, doc.getTextWidth(badgeText) + 5));
        }

        const reservedForBadge = badgeText ? badgeW + CL_TEXT_BADGE_GAP : 0;
        const rowTextWrapWidth =
          CONTENT_WIDTH - CL_TEXT_LEFT_OFFSET - reservedForBadge - CL_TEXT_RIGHT_MARGIN;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.7);
        const lines = doc.splitTextToSize(item.text || "", rowTextWrapWidth) as string[];
        const rowHeight = Math.max(6.4, lines.length * 3.9 + 3.5);

        return { item, lines, rowHeight, badgeText, badgeFontSize, badgeW };
      });

      const itemsH = items.reduce((sum, it) => sum + it.rowHeight + 1.5, 0);
      const headerH = items.length > 0 ? CL_SECTION_HEADER_H : 0;

      return {
        title: checklistSectionTitle(section.key),
        count: items.length,
        items,
        headerH,
        itemsH,
        totalH: headerH + itemsH,
      };
    });

    const sectionsH = sections.reduce((sum, s) => sum + s.totalH, 0);
    const cardH = entry.hasObjective
      ? Math.max(CL_MIN_CARD_H, CL_HEADER_H + CL_CARD_GAP + CL_SUMMARY_H + sectionsH + CL_INNER_BOTTOM_PAD)
      : CL_NO_OBJECTIVE_H;

    return { sections, cardH };
  };

  checklistObjectives.forEach((entry, idx) => {
    const hasObjective = entry.hasObjective;
    const layout = layoutChecklistCard(entry);
    const cardH = layout.cardH;

    const accent =
      entry.status === "completed"
        ? GREEN_PRIMARY
        : entry.status === "in_progress"
          ? ORANGE_PRIMARY
          : ([148, 163, 184] as [number, number, number]);
    const pale =
      entry.status === "completed"
        ? GREEN_PALE
        : entry.status === "in_progress"
          ? ORANGE_PALE
          : ([248, 250, 252] as [number, number, number]);

    if (yPos + cardH > PAGE_HEIGHT - MARGINS.bottom - 10) {
      pageNumber = addNewPage(doc, pageNumber);
      yPos = MARGINS.top;
    }
    const cardStartY = yPos; 

    doc.setFillColor(...pale);
    doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, cardH, 4, 4, "F");
    doc.setDrawColor(...accent);
    doc.setLineWidth(0.7);
    doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, cardH, 4, 4, "S");

    doc.setFillColor(...accent);
    doc.circle(MARGINS.left + 7, yPos + 8, 3.8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.6);
    doc.text(String(idx + 1), MARGINS.left + 7, yPos + 9.1, { align: "center" });

    const statusLabel =
      entry.status === "completed"
        ? checklistLang === "fr" ? "Termine" : "Completed"
        : entry.status === "in_progress"
          ? checklistLang === "fr" ? "En cours" : "In progress"
          : checklistLang === "fr" ? "A faire" : "To do";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.6);
    const statusBadgeW = Math.max(18, doc.getTextWidth(statusLabel) + 8);
    const statusBadgeX = MARGINS.left + CONTENT_WIDTH - statusBadgeW - 5;

    doc.setTextColor(...COLORS.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.2);
    const titleMaxWidth = statusBadgeX - (MARGINS.left + 16) - 4;
    let displayTitle = entry.issueName;
    while (doc.getTextWidth(displayTitle) > titleMaxWidth && displayTitle.length > 3) {
      displayTitle = displayTitle.slice(0, -1);
    }
    if (displayTitle !== entry.issueName) displayTitle = displayTitle.trimEnd() + "…";
    doc.text(displayTitle, MARGINS.left + 16, yPos + 7.2);

    doc.setFillColor(...accent);
    doc.roundedRect(statusBadgeX, yPos + 4, statusBadgeW, 7, 2.5, 2.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.6);
    doc.text(statusLabel, statusBadgeX + statusBadgeW / 2, yPos + 9.2, { align: "center" });

    yPos += CL_HEADER_H;

    if (!hasObjective) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.2);
      doc.setTextColor(...COLORS.textLight);
      doc.text(
        checklistLang === "fr" ? "Aucun objectif SMART disponible" : "No SMART objective available",
        MARGINS.left + 6,
        yPos + 5,
      );
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.4);
      doc.text(
        checklistLang === "fr"
          ? "La checklist sera disponible une fois l'objectif SMART genere."
          : "The checklist will be available once the SMART objective is generated.",
        MARGINS.left + 6,
        yPos + 11,
      );
      yPos = cardStartY + cardH + CL_CARD_GAP_BETWEEN;
      return;
    }

    yPos += CL_CARD_GAP;

    const summaryInset = 2;
    const summaryGap = 4;
    const summaryW = (CONTENT_WIDTH - summaryInset * 2 - summaryGap * 2) / 3;
    layout.sections.forEach((section, boxIdx) => {
      const x = MARGINS.left + summaryInset + boxIdx * (summaryW + summaryGap);
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...GREEN_LIGHT);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, yPos, summaryW, 11, 2.8, 2.8, "FD");
      doc.setTextColor(...COLORS.textLight);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.2);
      doc.text(section.title, x + 3, yPos + 4.4);
      doc.setTextColor(...accent);
      doc.setFontSize(8.8);
      doc.text(`${section.count}`, x + 3, yPos + 8.3);
    });
    yPos += CL_SUMMARY_H;

    layout.sections.forEach((section) => {
      if (!section.items.length) return;

      doc.setTextColor(...accent);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.2);
      doc.text(section.title, MARGINS.left + 6, yPos + 2.5);
      doc.setTextColor(...COLORS.textLight);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(String(section.items.length), PAGE_WIDTH - MARGINS.right - 6, yPos + 2.5, { align: "right" });
      doc.setDrawColor(...GREEN_LIGHT);
      doc.setLineWidth(0.35);
      doc.line(MARGINS.left + 6, yPos + 4, PAGE_WIDTH - MARGINS.right - 6, yPos + 4);
      yPos += CL_SECTION_HEADER_H;

      section.items.forEach((entryItem) => {
        const { lines, rowHeight, badgeText, badgeFontSize, badgeW } = entryItem;

        doc.setDrawColor(191, 203, 217);
        doc.setLineWidth(0.35);
        doc.roundedRect(MARGINS.left + 6, yPos + 0.6, 4.2, 4.2, 1, 1, "S");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.7);
        doc.setTextColor(...COLORS.text);
        let lineY = yPos + 3.4;
        lines.forEach((line: string, lineIdx: number) => {
          doc.text(line, MARGINS.left + CL_TEXT_LEFT_OFFSET, lineY + lineIdx * 3.9);
        });

        if (badgeText) {
          const badgeH = 6.4;
          const badgeX = PAGE_WIDTH - MARGINS.right - badgeW - 2;
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(...GREEN_LIGHT);
          doc.setLineWidth(0.35);
          doc.roundedRect(badgeX, yPos + 0.2, badgeW, badgeH, 2.5, 2.5, "FD");
          doc.setTextColor(...accent);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(badgeFontSize);
          doc.text(badgeText, badgeX + badgeW / 2, yPos + 4.7, { align: "center" });
        }

        yPos += rowHeight + 1.5;
      });
    });

    yPos = cardStartY + cardH + CL_CARD_GAP_BETWEEN;
  });

  // PAGE 10 — Improvement roadmap
  // ═══════════════════════════════════════════════════════════════════════════

pageNumber = addNewPage(doc, pageNumber);
yPos = MARGINS.top;

const roadmapLang = reportLang;

const roadmapPhaseDefinitions = [
  {
    label: roadmapLang === "fr" ? "Semaine 1" : "Week 1",
    note: roadmapLang === "fr" ? "Lancer les premieres actions." : "Launch the first actions.",
  },
  {
    label: roadmapLang === "fr" ? "Mois 1" : "Month 1",
    note: roadmapLang === "fr" ? "Revoir les premiers resultats et ajuster." : "Review the first results and adjust.",
  },
  {
    label: roadmapLang === "fr" ? "Mois 2" : "Month 2",
    note: roadmapLang === "fr" ? "Mesurer les KPI et poursuivre les ameliorations." : "Measure KPI improvements and keep refining.",
  },
];

const roadmapPhases = roadmapPhaseDefinitions.map((phase) => ({
  ...phase,
  items: [] as Array<{ source: string; text: string }>,
}));

checklistObjectives.forEach((entry) => {
  const objectiveActions = Array.isArray(entry.objective?.actions) && entry.objective!.actions.length > 0
    ? entry.objective!.actions
    : [...entry.grouped.daily, ...entry.grouped.weekly, ...entry.grouped.monthly];

  objectiveActions.forEach((action: any, actionIdx: number) => {
    const actionText = checklistText(action?.text ?? "");
    if (!actionText) return;
    const phaseIdx = Math.min(actionIdx, roadmapPhases.length - 1);
    roadmapPhases[phaseIdx].items.push({ source: entry.issueName, text: actionText });
  });
});

const roadmapHasItems = roadmapPhases.some((phase) => phase.items.length > 0);

yPos = addSectionTitle(
  doc,
  roadmapLang === 'fr' ? "Feuille de route d'amelioration" : 'Improvement Roadmap',
  yPos,
  PURPLE_PRIMARY
);
yPos += 4;


const roadmapIntroLines = doc.splitTextToSize(
    roadmapLang === 'fr'
      ? "Cette feuille de route montre quand chaque action recommandee doit etre realisee, pour suivre facilement la progression des ameliorations."
      : "This roadmap shows when each recommended action should be completed, so the improvement journey is easy to follow.",
    CONTENT_WIDTH
  );
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textLight);
  doc.text(roadmapIntroLines, MARGINS.left, yPos);
  yPos += roadmapIntroLines.length * 4.5 + 8;

if (!roadmapHasItems) {
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 30, 3, 3, 'F');
  doc.setDrawColor(...COLORS.textLight);
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 30, 3, 3, 'S');
  doc.setTextColor(...COLORS.textLight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(
    roadmapLang === 'fr' ? 'Aucune priorite identifiee' : 'No priorities identified',
    PAGE_WIDTH / 2, yPos + 17, { align: 'center' }
  );
} else {
  const phaseTextWidth = CONTENT_WIDTH - 22;
  const phaseLabelWidths = roadmapPhases.map((phase) => Math.max(34, doc.getTextWidth(phase.label) + 10));
  const phaseGroups = roadmapPhases.map((phase) => {
    const groupMap = new Map<string, string[]>();
    phase.items.forEach((item) => {
      const key = item.source || (roadmapLang === 'fr' ? 'Sans source' : 'Unspecified');
      const existing = groupMap.get(key) ?? [];
      existing.push(item.text);
      groupMap.set(key, existing);
    });
    return { ...phase, groups: Array.from(groupMap.entries()).map(([source, items]) => ({ source, items })) };
  });

  // Single source of truth for spacing — used by BOTH the height calculator and the draw loop,
  // so the box height and the actual rendered content can never drift apart again.
  const RM = {
    cardPad: 4,
    phaseGap: 3,
    noteOffset: 13,
    noteToContentGap: 1.5,
    sourceLineGap: 4.6,
    groupBottomGap: 1.0,
    itemExtra: 0.8,
    bottomPad: 3,
  };

  const computePhaseHeight = (
    phase: { note: string; groups: { source: string; items: string[] }[] },
    isMonth2: boolean
  ) => {
    const noteStep = isMonth2 ? 3.1 : 3.5;
    const itemLineStep = isMonth2 ? 2.8 : 3.0;
    const itemBlockMin = isMonth2 ? 4.0 : 4.4;

    const noteLines = doc.splitTextToSize(phase.note, phaseTextWidth - 10) as string[];
    let y = RM.noteOffset + noteLines.length * noteStep + RM.noteToContentGap;

    if (phase.groups.length === 0) {
      y += 6;
    } else {
      phase.groups.forEach((group) => {
        y += RM.sourceLineGap;
        group.items.forEach((text) => {
          const itemLines = doc.splitTextToSize(text, phaseTextWidth - 18) as string[];
          y += Math.max(itemBlockMin, itemLines.length * itemLineStep + RM.itemExtra);
        });
        y += RM.groupBottomGap;
      });
    }

    return y + RM.bottomPad;
  };

  const phaseHeights = phaseGroups.map((phase, phaseIdx) => computePhaseHeight(phase, phaseIdx === 2));

  // Pre-check: if even the first phase can't fit under the title, move everything to a new page
  // before drawing anything, so the title is never left orphaned above empty space.
  const totalH = RM.cardPad + phaseHeights.reduce((s, v) => s + v, 0) + (phaseHeights.length - 1) * RM.phaseGap + RM.cardPad;
  if (yPos + Math.min(totalH, RM.cardPad + phaseHeights[0] + RM.cardPad) > PAGE_HEIGHT - MARGINS.bottom - 5) {
    addFooter(doc, pageNumber);
    pageNumber = addNewPage(doc, pageNumber);
    yPos = MARGINS.top;
    yPos = addSectionTitle(
      doc,
      roadmapLang === 'fr' ? "Feuille de route d'amelioration" : 'Improvement Roadmap',
      yPos,
      PURPLE_PRIMARY
    );
    yPos += 4;
  }

  let roadmapCy = yPos + RM.cardPad;

  phaseGroups.forEach((phase, phaseIdx) => {
    const phaseH = phaseHeights[phaseIdx];

    // Per-phase page-break check — self-correcting safety net, nothing can ever clip.
    if (roadmapCy + phaseH > PAGE_HEIGHT - MARGINS.bottom - 5) {
      addFooter(doc, pageNumber);
      pageNumber = addNewPage(doc, pageNumber);
      yPos = MARGINS.top;
      yPos = addSectionTitle(
        doc,
        roadmapLang === 'fr' ? "Feuille de route d'amelioration" : 'Improvement Roadmap',
        yPos,
        PURPLE_PRIMARY
      );
      yPos += 4;
      roadmapCy = yPos + RM.cardPad;
    }

    const isMonth2 = phaseIdx === 2;
    const noteFontSize = isMonth2 ? 7.0 : 7.4;
    const sourceFontSize = isMonth2 ? 6.4 : 6.7;
    const itemFontSize = isMonth2 ? 7.0 : 7.3;
    const itemIndent = isMonth2 ? 12.5 : 13;
    const bulletX = isMonth2 ? 8.9 : 9.2;
    const bulletRadius = isMonth2 ? 0.55 : 0.6;
    const itemLineStep = isMonth2 ? 2.8 : 3.0;   // must match computePhaseHeight
    const itemBlockMin = isMonth2 ? 4.0 : 4.4;   // must match computePhaseHeight
    const noteStep = isMonth2 ? 3.1 : 3.5;      // must match computePhaseHeight

    const phaseX = MARGINS.left + 6;
    const phaseY = roadmapCy;
    const labelW = phaseLabelWidths[phaseIdx];
    const noteLines = doc.splitTextToSize(phase.note, phaseTextWidth - 10) as string[];

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...PURPLE_PALE);
    doc.setLineWidth(0.35);
    doc.roundedRect(phaseX, phaseY, CONTENT_WIDTH - 12, phaseH, 2.5, 2.5, 'FD');

    doc.setFillColor(...PURPLE_PRIMARY);
    doc.rect(phaseX, phaseY, 2, phaseH, 'F');

    doc.setFillColor(...PURPLE_PALE);
    doc.roundedRect(phaseX + 6, phaseY + 3, labelW, 6.5, 2.2, 2.2, 'F');
    doc.setTextColor(...PURPLE_PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.1);
    doc.text(phase.label, phaseX + 6 + labelW / 2, phaseY + 7.5, { align: 'center' });

    doc.setTextColor(...COLORS.textLight);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(noteFontSize);
    doc.text(noteLines, phaseX + 6, phaseY + RM.noteOffset);

    let phaseItemY = phaseY + RM.noteOffset + noteLines.length * noteStep + RM.noteToContentGap;
    doc.setTextColor(...COLORS.text);

    if (phase.groups.length === 0) {
      doc.setTextColor(...COLORS.textLight);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.6);
      doc.text(
        roadmapLang === 'fr'
          ? 'Aucune action planifiee pour cette etape.'
          : 'No actions scheduled for this step yet.',
        phaseX + 6,
        phaseItemY,
      );
    } else {
      phase.groups.forEach((group) => {
        const sourceLabel = truncateText(group.source, 34);
        doc.setTextColor(...PURPLE_PRIMARY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(sourceFontSize);
        doc.text(sourceLabel, phaseX + 8, phaseItemY + 1);

        phaseItemY += RM.sourceLineGap;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(itemFontSize);
        doc.setTextColor(...COLORS.text);

        group.items.forEach((text) => {
          const itemLines = doc.splitTextToSize(text, phaseTextWidth - 18) as string[];
          doc.setFillColor(...PURPLE_PRIMARY);
          doc.circle(phaseX + bulletX, phaseItemY - 1.0, bulletRadius, 'F');
          doc.text(itemLines, phaseX + itemIndent, phaseItemY);
          phaseItemY += Math.max(itemBlockMin, itemLines.length * itemLineStep + RM.itemExtra);
        });

        phaseItemY += RM.groupBottomGap;
      });
    }

    roadmapCy += phaseH + RM.phaseGap;
  });

  yPos = roadmapCy + RM.cardPad;
}

addFooter(doc, pageNumber);

  // Last page — CONCLUSION STRATEGIQUE (real AI synthesis)
  // ═══════════════════════════════════════════════════════════════════════════

  // pageNumber = addNewPage(doc, pageNumber);
  // yPos = MARGINS.top;
  // yPos = addSectionTitle(doc, S.conclusionTitle, yPos, COLORS.primary);

  // const strategicText = generateStrategicConclusion(data, ad, reportLang);
  // doc.setFillColor(...COLORS.background);
  // doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 200, 3, 3, 'F');

  // doc.setTextColor(...COLORS.text);
  // doc.setFontSize(10);
  // doc.setFont('helvetica', 'normal');

  // const conclusionLines = doc.splitTextToSize(strategicText, CONTENT_WIDTH - 15);
  // let currentY = yPos + 10;

  // conclusionLines.forEach((line: string) => {
  //   if (currentY > yPos + 190) return;
  //   const isSectionTitle = /^\d\./.test(line.trim());
  //   doc.setFont('helvetica', isSectionTitle ? 'bold' : 'normal');
  //   doc.setTextColor(...(isSectionTitle ? COLORS.primary : COLORS.text));
  //   doc.text(line, MARGINS.left + 7, currentY);
  //   currentY += 5.5;
  // });

  // yPos += 210;
  // doc.setFillColor(...COLORS.primary);
  // doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 20, 2, 2, 'F');
  // doc.setTextColor(...COLORS.white);
  // doc.setFontSize(9);
  // doc.setFont('helvetica', 'italic');
  // doc.text(
  //   S.conclusionFooterLine1,
  //   PAGE_WIDTH / 2, yPos + 8, { align: 'center' }
  // );
  // doc.text(
  //   S.conclusionFooterLine2,
  //   PAGE_WIDTH / 2, yPos + 14, { align: 'center' }
  // );

  // addFooter(doc, pageNumber);


  // ── Save ────────────────────────────────────────────────────────────────────

  const sanitizedName = data.establishmentName
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30);
  const dateStr = new Date().toISOString().split('T')[0];
  const savedFilePrefix = reportLang === 'en' ? 'Review_Analysis_Report' : 'Rapport_Analyse_Avis';
  doc.save(`${savedFilePrefix}_${sanitizedName}_${dateStr}.pdf`);
}

// ─── STRATEGIC CONCLUSION (real data) ────────────────────────────────────────

function generateStrategicConclusion(data: ReportData, ad: AnalysisData | undefined, lang: 'en' | 'fr'): string {
  const parts: string[] = [];
  const oneLiner = ad?.summary?.one_liner ?? ad?.summary_one_liner ?? '';

  if (lang === 'en') {
    parts.push('1. Overall summary of customer perception');
    parts.push('');
    if (oneLiner) {
      parts.push(oneLiner);
    } else if (data.avgRating >= 4.5) {
      parts.push(`Your establishment "${data.establishmentName}" enjoys an excellent reputation with a rating of ${data.avgRating.toFixed(1)}/5 across ${data.totalReviews} reviews.`);
    } else if (data.avgRating >= 3.5) {
      parts.push(`Your establishment "${data.establishmentName}" shows an overall positive perception with a rating of ${data.avgRating.toFixed(1)}/5 across ${data.totalReviews} reviews.`);
    } else {
      parts.push(`Your establishment "${data.establishmentName}" faces some challenges with a rating of ${data.avgRating.toFixed(1)}/5 across ${data.totalReviews} reviews.`);
    }
    parts.push('');

    parts.push('2. Main issues identified');
    parts.push('');
    const topIssues = ad?.top_issues ?? [];
    if (topIssues.length > 0) {
      topIssues.slice(0, 3).forEach((issue, i) => {
        parts.push(`${i + 1}. ${issue.theme} (${issue.count} mentions): ${issue.ai_synthesis || 'A recurring issue cited by customers.'}`);
        parts.push('');
      });
    } else {
      parts.push('No major issue identified in the analyzed reviews.');
      parts.push('');
    }

    parts.push('3. Strengths to highlight');
    parts.push('');
    const topPraises = ad?.top_praises ?? [];
    if (topPraises.length > 0) {
      const praiseList = topPraises.slice(0, 3).map(p => `${p.theme} (${p.count} mentions)`).join(', ');
      parts.push(`Your customers particularly appreciate: ${praiseList}. These strengths should be highlighted in your communication.`);
    } else {
      parts.push('Collect more reviews to identify your strengths.');
    }
    parts.push('');

    parts.push('4. Short-term improvement opportunities');
    parts.push('');
    const quickWins = ad?.recommendations_quick_wins ?? [];
    if (quickWins.length > 0) {
      quickWins.slice(0, 3).forEach((qw, i) => {
        parts.push(`${i + 1}. ${qw.title}: ${qw.expected_result}`);
      });
    } else if (topIssues.length > 0) {
      parts.push(`Priority action: Address "${topIssues[0].theme}", which directly impacts your overall rating.`);
    }
    parts.push('');

    parts.push('5. Projected outlook if the recommended actions are implemented');
    parts.push('');
    if (data.avgRating >= 4.5) {
      parts.push(`By maintaining your level of excellence, your establishment can consolidate its leading position. The goal is to turn your satisfied customers into active ambassadors.`);
    } else if (data.avgRating >= 3.5) {
      parts.push(`With rigorous execution of the recommended actions, a 0.3 to 0.5 point improvement in your rating is realistic within the next 3 to 6 months.`);
    } else {
      parts.push(`A structured action plan can lead to a significant turnaround in 6 to 12 months. The initial goal is to reach a rating above 3.5/5.`);
    }

    return parts.join('\n');
  }

  parts.push('1. Resume global de la perception client');
  parts.push('');
  if (oneLiner) {
    parts.push(oneLiner);
  } else if (data.avgRating >= 4.5) {
    parts.push(`Votre etablissement "${data.establishmentName}" beneficie d'une excellente reputation avec une note de ${data.avgRating.toFixed(1)}/5 sur ${data.totalReviews} avis.`);
  } else if (data.avgRating >= 3.5) {
    parts.push(`Votre etablissement "${data.establishmentName}" presente une perception globalement positive avec une note de ${data.avgRating.toFixed(1)}/5 sur ${data.totalReviews} avis.`);
  } else {
    parts.push(`Votre etablissement "${data.establishmentName}" fait face a des defis avec une note de ${data.avgRating.toFixed(1)}/5 sur ${data.totalReviews} avis.`);
  }
  parts.push('');

  parts.push('2. Principaux problemes identifies');
  parts.push('');
  const topIssues = ad?.top_issues ?? [];
  if (topIssues.length > 0) {
    topIssues.slice(0, 3).forEach((issue, i) => {
      parts.push(`${i + 1}. ${issue.theme} (${issue.count} mentions) : ${issue.ai_synthesis || 'Probleme recurrent cite par les clients.'}`);
      parts.push('');
    });
  } else {
    parts.push('Aucun probleme majeur identifie dans les avis analyses.');
    parts.push('');
  }

  parts.push('3. Points forts a valoriser');
  parts.push('');
  const topPraises = ad?.top_praises ?? [];
  if (topPraises.length > 0) {
    const praiseList = topPraises.slice(0, 3).map(p => `${p.theme} (${p.count} mentions)`).join(', ');
    parts.push(`Vos clients apprecient particulierement : ${praiseList}. Ces atouts sont a mettre en avant dans votre communication.`);
  } else {
    parts.push('Collectez plus d\'avis pour identifier vos points forts.');
  }
  parts.push('');

  parts.push('4. Opportunites d\'amelioration a court terme');
  parts.push('');
  const quickWins = ad?.recommendations_quick_wins ?? [];
  if (quickWins.length > 0) {
    quickWins.slice(0, 3).forEach((qw, i) => {
      parts.push(`${i + 1}. ${qw.title} : ${qw.expected_result}`);
    });
  } else if (topIssues.length > 0) {
    parts.push(`Action prioritaire : Traiter "${topIssues[0].theme}" qui impacte directement votre note globale.`);
  }
  parts.push('');

  parts.push('5. Vision projetee si les actions recommandees sont mises en place');
  parts.push('');
  if (data.avgRating >= 4.5) {
    parts.push(`En maintenant votre niveau d'excellence, votre etablissement peut consolider sa position de leader. L'objectif est de transformer vos clients satisfaits en ambassadeurs actifs.`);
  } else if (data.avgRating >= 3.5) {
    parts.push(`Avec une execution rigoureuse des actions recommandees, une amelioration de 0.3 a 0.5 point sur votre note est realiste dans les 3 a 6 prochains mois.`);
  } else {
    parts.push(`Un plan d'action structure peut permettre un redressement significatif en 6 a 12 mois. L'objectif initial est d'atteindre une note superieure a 3.5/5.`);
  }

  return parts.join('\n');
}