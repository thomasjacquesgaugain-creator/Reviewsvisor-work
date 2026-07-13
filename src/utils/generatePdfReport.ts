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
  const footerY = PAGE_HEIGHT - 12;
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textLight);
  doc.text('Rapport genere automatiquement par Reviewsvisor', MARGINS.left, footerY);
  doc.text(`Page ${pageNumber}`, PAGE_WIDTH - MARGINS.right, footerY, { align: 'right' });
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
  if (pct >= 80) return { label: 'Bon',      color: COLORS.success };
  if (pct >= 60) return { label: 'Moyen',    color: COLORS.warning };
  return              { label: 'A revoir',  color: COLORS.danger  };
}

function getSentimentLabel(ratio: number): { label: string; color: [number, number, number] } {
  if (ratio >= 0.8) return { label: 'Tres positif', color: COLORS.success };
  if (ratio >= 0.6) return { label: 'Positif',      color: COLORS.success };
  if (ratio >= 0.4) return { label: 'Neutre',        color: COLORS.warning };
  if (ratio >= 0.2) return { label: 'Negatif',       color: COLORS.danger  };
  return                   { label: 'Tres negatif', color: COLORS.danger  };
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
  if (ease >= 70) return 'Facile';
  if (ease >= 40) return 'Moyen';
  return 'Difficile';
}

function getCategoryColor(categoryKey: string): [number, number, number] {
  const map: Record<string, [number, number, number]> = {
    workforce:   BLUE_PRIMARY,
    methods:     PURPLE_PRIMARY,
    equipment:   ORANGE_PRIMARY,
    materials:   GREEN_PRIMARY,
    environment: [20, 184, 166],
  };
  return map[categoryKey] ?? COLORS.secondary;
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
        doc.text(`${row.count} mentions`, cntX + cntW / 2, yPos + 7, { align: 'center' });
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
  doc.text("Rapport d'analyse des avis clients", PAGE_WIDTH / 2, 55, { align: 'center' });

  doc.setDrawColor(...COLORS.white);
  doc.setLineWidth(0.5);
  doc.line(60, 70, 150, 70);

  // AI one-liner under the line
  if (oneLiner) {
    doc.setFontSize(10);
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
  if (ad?.business_type) {
    doc.setFillColor(...BLUE_PALE);
    doc.roundedRect(PAGE_WIDTH / 2 - 25, 145, 50, 8, 2, 2, 'F');
    doc.setTextColor(...BLUE_PRIMARY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(
      ad.business_type.replace(/_/g, ' ').toUpperCase(),
      PAGE_WIDTH / 2, 150, { align: 'center' }
    );
  }

  const generationDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textLight);
  doc.text(`Rapport genere le ${generationDate}`, PAGE_WIDTH / 2, 160, { align: 'center' });

  // KPI hero card
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(30, 180, 150, 60, 3, 3, 'F');

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Note moyenne', 55, 200, { align: 'center' });
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.text(`${data.avgRating.toFixed(1)}/5`, 55, 215, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text('Avis analyses', 105, 200, { align: 'center' });
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.text(`${data.totalReviews}`, 105, 215, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text('Sentiment', 155, 200, { align: 'center' });
  doc.setFontSize(16);
  doc.setTextColor(...sentiment.color);
  doc.text(sentiment.label, 155, 215, { align: 'center' });

  addFooter(doc, pageNumber);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 2 — SCORE GLOBAL + KPI
  // ═══════════════════════════════════════════════════════════════════════════

  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;
  yPos = addSectionTitle(doc, 'Score Global', yPos, COLORS.gold);

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
  doc.text('NOTE GLOBALE', PAGE_WIDTH / 2, yPos + 8, { align: 'center' });

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
  doc.text('Indice de satisfaction', PAGE_WIDTH / 2 - 10, rowY, { align: 'right' });

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

  drawStatCard(MARGINS.left, positivePct, 'Avis positifs',
    GREEN_PALE, GREEN_BORDER, GREEN_PRIMARY, GREEN_BORDER);
  drawStatCard(MARGINS.left + cardW + gap, negativePct, 'Avis negatifs',
    RED_PALE, RED_BORDER, RED_PRIMARY, RED_BORDER);

  yPos += cardH + 10;

  // KPI table — now using real data
  yPos = addSectionTitle(doc, 'KPI - Indicateurs cles a suivre', yPos, COLORS.secondary);

  const mainNegTheme = topIssues.length > 0
    ? truncateText(topIssues[0].theme, 35) : 'Aucun';
  const mainPosTheme = topPraises.length > 0
    ? truncateText(topPraises[0].theme, 35) : 'Aucun';

  const kpiItems: Array<{ label: string; value: string; valueColor: [number, number, number] }> = [
    { label: 'Note moyenne globale',    value: `${data.avgRating.toFixed(1)} / 5`, valueColor: BLUE_PRIMARY },
    { label: 'Avis positifs',           value: `${positivePct}%`,                  valueColor: GREEN_PRIMARY },
    { label: 'Avis negatifs',           value: `${negativePct}%`,                  valueColor: RED_PRIMARY },
    { label: 'Principal probleme',      value: mainNegTheme,                        valueColor: COLORS.text as [number, number, number] },
    { label: 'Principal point fort',    value: mainPosTheme,                        valueColor: COLORS.text as [number, number, number] },
    ...(ad?.business_type ? [{
      label: 'Type d\'etablissement',
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
  const noteLines = doc.splitTextToSize(
    'Ces indicateurs permettent de suivre l\'evolution de la satisfaction client et de mesurer l\'impact des actions mises en place dans le temps.',
    CONTENT_WIDTH - 14
  );
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

  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;
  yPos = addSectionTitle(doc, 'Synthese des retours clients', yPos);

  // AI one-liner banner
  if (oneLiner) {
    const bannerLines = doc.splitTextToSize(`"${oneLiner}"`, CONTENT_WIDTH - 16);
    const bannerH = Math.max(16, 8 + bannerLines.length * 5);
    doc.setFillColor(...BLUE_PALE);
    doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, bannerH, 3, 3, 'F');
    doc.setFillColor(...BLUE_PRIMARY);
    doc.rect(MARGINS.left, yPos, 3, bannerH, 'F');
    doc.setTextColor(...BLUE_DARK);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(bannerLines, MARGINS.left + 8, yPos + 6);
    yPos += bannerH + 10;
  }

  // Points forts from real top_praises
  const strengthRows = topPraises.slice(0, 4).map(s => ({
    label: s.theme, count: s.count
  }));
  yPos = drawSectionTable(
    doc, yPos,
    'Les elements les plus apprecies',
    strengthRows,
    'Aucun point fort identifie',
    GREEN_PRIMARY, GREEN_PALE, GREEN_LIGHT,
    [220, 252, 231], [22, 101, 52], GREEN_PRIMARY
  );

  // Points de friction from real top_issues
  const issueRows = topIssues.slice(0, 4).map(i => ({
    label: i.theme, count: i.count
  }));
  yPos = drawSectionTable(
    doc, yPos,
    'Les principaux points de friction',
    issueRows,
    'Aucun probleme majeur identifie',
    RED_PRIMARY, RED_PALE, RED_LIGHT,
    [254, 226, 226], [153, 27, 27], RED_PRIMARY
  );

  // What customers love/hate from summary
  if (customersLove.length > 0 || customersHate.length > 0) {
    const impactHdrH = 9;
    doc.setFillColor(...BLUE_PRIMARY);
    doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, impactHdrH, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Ce que vos clients aiment et n\'aiment pas', MARGINS.left + 5, yPos + 6);
    yPos += impactHdrH;

    const allItems = [
      ...customersLove.slice(0, 2).map(l => ({ ...l, type: 'love' as const })),
      ...customersHate.slice(0, 2).map(h => ({ ...h, type: 'hate' as const })),
    ];

    allItems.forEach((item, idx) => {
      const rowH = 13;
      const bg: [number, number, number] = item.type === 'love' ? GREEN_PALE : RED_PALE;
      doc.setFillColor(...bg);
      doc.rect(MARGINS.left, yPos, CONTENT_WIDTH, rowH, 'F');
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      if (idx > 0) doc.line(MARGINS.left, yPos, MARGINS.left + CONTENT_WIDTH, yPos);

      const iconColor: [number, number, number] = item.type === 'love' ? GREEN_PRIMARY : RED_PRIMARY;
      const icon = item.type === 'love' ? '+' : '-';
      doc.setFillColor(...iconColor);
      doc.circle(MARGINS.left + 6, yPos + 6.5, 3.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(icon, MARGINS.left + 6, yPos + 7.5, { align: 'center' });

      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(truncateText(item.theme, 30), MARGINS.left + 14, yPos + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.textLight);
      doc.text(truncateText(item.reason || '', 70), MARGINS.left + 14, yPos + 11);

      yPos += rowH;
    });

    doc.setDrawColor(...BLUE_PRIMARY);
    doc.setLineWidth(0);
    doc.roundedRect(MARGINS.left, yPos - allItems.length * 13 - impactHdrH,
      CONTENT_WIDTH, impactHdrH + allItems.length * 13, 1, 1, 'S');
  }

  addFooter(doc, pageNumber);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 4 — ANALYSE DETAILLEE (real themes)
  // ═══════════════════════════════════════════════════════════════════════════

  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;
  yPos = addSectionTitle(doc, 'Analyse Detaillee', yPos);

  // Rating distribution
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('Repartition des avis par note', MARGINS.left, yPos);
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
  const allThemes = [
    ...themesUniv.slice(0, 3),
    ...themesInd.slice(0, 3),
  ].filter(Boolean);

  if (allThemes.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text('Themes recurrents avec sentiment', MARGINS.left, yPos);
    yPos += 8;

    const maxCount = Math.max(...allThemes.map(t => t.count || t.importance || 1));
    const tTableW   = CONTENT_WIDTH;
    const tThemeW   = 70;
    const tSentW    = 28;
    const tMentionW = 22;
    const tBarW     = tTableW - tThemeW - tSentW - tMentionW;
    const tHdrH     = 9;
    const tRowH     = 11;

    doc.setFillColor(...BLUE_PRIMARY);
    doc.roundedRect(MARGINS.left, yPos, tTableW, tHdrH, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Theme',     MARGINS.left + 4,                          yPos + 6);
    doc.text('Sentiment', MARGINS.left + tThemeW + tSentW / 2,       yPos + 6, { align: 'center' });
    doc.text('Mentions',  MARGINS.left + tThemeW + tSentW + tMentionW / 2, yPos + 6, { align: 'center' });
    doc.text('Frequence', MARGINS.left + tThemeW + tSentW + tMentionW + tBarW / 2, yPos + 6, { align: 'center' });
    yPos += tHdrH;

    const tRowsStartY = yPos;
    allThemes.forEach((theme, idx) => {
      const count = theme.count || theme.importance || 0;
      const bg: [number, number, number] = idx % 2 === 0 ? BLUE_PALE : ROW_WHITE;

      doc.setFillColor(...bg);
      doc.rect(MARGINS.left, yPos, tTableW, tRowH, 'F');
      doc.setDrawColor(...BLUE_LIGHT);
      doc.setLineWidth(0.3);
      doc.line(MARGINS.left, yPos + tRowH, MARGINS.left + tTableW, yPos + tRowH);

      // Theme name
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(doc.splitTextToSize(theme.theme, tThemeW - 8)[0], MARGINS.left + 4, yPos + 7);

      // Sentiment badge
      const sentBg    = getSentimentBg(theme.sentiment);
      const sentColor = getSentimentColor(theme.sentiment);
      const sentLabel = theme.sentiment === 'positive' ? 'Positif'
        : theme.sentiment === 'negative' ? 'Negatif' : 'Mixte';
      const sentX = MARGINS.left + tThemeW + 2;
      doc.setFillColor(...sentBg);
      doc.roundedRect(sentX, yPos + 2.5, tSentW - 4, 6, 1, 1, 'F');
      doc.setTextColor(...sentColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(sentLabel, sentX + (tSentW - 4) / 2, yPos + 7, { align: 'center' });

      // Count badge
      const cntX = MARGINS.left + tThemeW + tSentW + 2;
      doc.setFillColor(219, 234, 254);
      doc.roundedRect(cntX, yPos + 2.5, tMentionW - 4, 6, 1, 1, 'F');
      doc.setTextColor(30, 64, 175);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(`${count}`, cntX + (tMentionW - 4) / 2, yPos + 7, { align: 'center' });

      // Frequency bar
      const barTrackX = MARGINS.left + tThemeW + tSentW + tMentionW + 4;
      const barTrackW = tBarW - 8;
      doc.setFillColor(219, 234, 254);
      doc.roundedRect(barTrackX, yPos + 3, barTrackW, 5, 1, 1, 'F');
      if (count > 0) {
        doc.setFillColor(...BLUE_PRIMARY);
        doc.roundedRect(barTrackX, yPos + 3, (count / maxCount) * barTrackW, 5, 1, 1, 'F');
      }

      yPos += tRowH;
    });

    doc.setDrawColor(...BLUE_PRIMARY);
    doc.setLineWidth(0);
    doc.roundedRect(MARGINS.left, tRowsStartY - tHdrH, tTableW, tHdrH + tRowH * allThemes.length, 1, 1, 'S');
  }

  addFooter(doc, pageNumber);

  
  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 4 — ANALYSE APPROFONDIE DES PROBLEMES (root causes)
  // ═══════════════════════════════════════════════════════════════════════════
const issuesWithRootCauses = topIssues.filter(
  i => i.root_causes && i.root_causes.length > 0
);

if (issuesWithRootCauses.length > 0) {

  issuesWithRootCauses.slice(0, 2).forEach((issue) => {

    pageNumber = addNewPage(doc, pageNumber);
    yPos = MARGINS.top;

    yPos = addSectionTitle(
      doc,
      'Analyse des causes racines (Ishikawa)',
      yPos,
      RED_PRIMARY
    );

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.textLight);

    doc.text(
      'Identification des causes profondes pour chaque probleme prioritaire',
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
      `Probleme : ${issue.theme}`,
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
      `${issue.count} mentions`,
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
          (a, lines) => a + Math.min(lines.length, 3),
          0
        );

      const totalLines =
        Math.max(
          causeLineCount,
          evidenceLineCount
        );

      const rcCardH = Math.max(
        48,
        22 + totalLines * 4
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
          `Probleme : ${issue.theme} (suite)`,
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

      doc.setFillColor(...categoryColor);

      doc.roundedRect(
        MARGINS.left + 8,
        yPos + 3,
        35,
        6,
        1,
        1,
        'F'
      );

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);

      doc.text(
        rc.category.toUpperCase(),
        MARGINS.left + 25.5,
        yPos + 7.5,
        { align: 'center' }
      );

      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);

      doc.text(
        rc.label,
        MARGINS.left + 46,
        yPos + 8
      );

      // Causes

      doc.setTextColor(...COLORS.textLight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);

      doc.text(
        'Causes:',
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
        'Temoignages:',
        evColX,
        yPos + 17
      );

      doc.setFont('helvetica', 'italic');
      doc.setTextColor(80, 80, 100);

      let evY = yPos + 22;

      evidenceLines.forEach(lines => {

        lines.slice(0, 2).forEach((line: string) => {

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


  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 5 — PAIN POINTS PRIORISES (real pain_points_prioritized)
  // ═══════════════════════════════════════════════════════════════════════════

  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;
  yPos = addSectionTitle(doc, 'Priorisation des problemes - Impact vs Facilite', yPos, COLORS.warning);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLORS.textLight);
  doc.text('Classement IA base sur l\'impact client et la facilite de mise en oeuvre', MARGINS.left, yPos);
  yPos += 12;

  if (painPoints.length > 0) {
    const ppTableW  = CONTENT_WIDTH;
    const ppIssueW  = 75;
    const ppImpactW = 25;
    const ppEaseW   = 25;
    const ppStepW   = ppTableW - ppIssueW - ppImpactW - ppEaseW;
    const ppHdrH    = 9;
    const ppRowH    = 22;

    // Header
    doc.setFillColor(...COLORS.warning);
    doc.roundedRect(MARGINS.left, yPos, ppTableW, ppHdrH, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Probleme',        MARGINS.left + 4,                                   yPos + 6);
    doc.text('Impact',          MARGINS.left + ppIssueW + ppImpactW / 2,            yPos + 6, { align: 'center' });
    doc.text('Facilite',        MARGINS.left + ppIssueW + ppImpactW + ppEaseW / 2,  yPos + 6, { align: 'center' });
    doc.text('Premiere action', MARGINS.left + ppIssueW + ppImpactW + ppEaseW + 4,  yPos + 6);
    yPos += ppHdrH;

    const ppStartY = yPos;
    painPoints.forEach((pp, idx) => {
      const bg: [number, number, number] = idx % 2 === 0 ? ORANGE_PALE : ROW_WHITE;
      doc.setFillColor(...bg);
      doc.rect(MARGINS.left, yPos, ppTableW, ppRowH, 'F');

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      if (idx > 0) doc.line(MARGINS.left, yPos, MARGINS.left + ppTableW, yPos);
      doc.line(MARGINS.left + ppIssueW,                    yPos, MARGINS.left + ppIssueW,                    yPos + ppRowH);
      doc.line(MARGINS.left + ppIssueW + ppImpactW,        yPos, MARGINS.left + ppIssueW + ppImpactW,        yPos + ppRowH);
      doc.line(MARGINS.left + ppIssueW + ppImpactW + ppEaseW, yPos, MARGINS.left + ppIssueW + ppImpactW + ppEaseW, yPos + ppRowH);

      // Issue
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(truncateText(pp.issue, 30), MARGINS.left + 4, yPos + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.textLight);
      const whyLines = doc.splitTextToSize(pp.why_it_matters || '', ppIssueW - 8);
      doc.text(whyLines[0] || '', MARGINS.left + 4, yPos + 13);
      if (whyLines[1]) doc.text(whyLines[1], MARGINS.left + 4, yPos + 17);

      // Impact bar
      const impactX = MARGINS.left + ppIssueW + 3;
      const impactColor = getImpactColor(pp.impact);
      doc.setFillColor(...impactColor);
      doc.roundedRect(impactX, yPos + 4, 12, 5, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(`${pp.impact}`, impactX + 6, yPos + 8, { align: 'center' });
      doc.setTextColor(...COLORS.textLight);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('/100', impactX + 14, yPos + 8);

      // Ease
      const easeX = MARGINS.left + ppIssueW + ppImpactW + 3;
      const easeLabel = getEaseLabel(pp.ease);
      const easeColor: [number, number, number] = pp.ease >= 70 ? GREEN_PRIMARY : pp.ease >= 40 ? COLORS.warning : RED_PRIMARY;
      doc.setFillColor(...easeColor);
      doc.roundedRect(easeX, yPos + 4, ppEaseW - 6, 5, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(easeLabel, easeX + (ppEaseW - 6) / 2, yPos + 8, { align: 'center' });

      // First step
      const stepX = MARGINS.left + ppIssueW + ppImpactW + ppEaseW + 4;
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const stepLines = doc.splitTextToSize(pp.first_step || '', ppStepW - 8);
      stepLines.slice(0, 3).forEach((line: string, li: number) => {
        doc.text(line, stepX, yPos + 7 + li * 4.5);
      });

      yPos += ppRowH;
    });

    doc.setDrawColor(...COLORS.warning);
    doc.setLineWidth(0.6);
    doc.roundedRect(MARGINS.left, ppStartY - ppHdrH, ppTableW, ppHdrH + ppRowH * painPoints.length, 1, 1, 'S');

  } else {
    doc.setTextColor(...COLORS.textLight);
    doc.setFontSize(10);
    doc.text('Aucune donnee de priorisation disponible.', MARGINS.left, yPos + 10);
    yPos += 20;
  }

  // Tip box
  yPos += 8;
  const tipLines = doc.splitTextToSize(
    'Commencez par les actions a fort impact et haute facilite pour obtenir des resultats rapides et mesurables sur votre reputation.',
    CONTENT_WIDTH - 10
  );
  const tipH = Math.max(18, 8 + tipLines.length * 5);
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, tipH, 2, 2, 'F');
  doc.setDrawColor(...COLORS.warning);
  doc.setLineWidth(0.8);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, tipH, 2, 2, 'S');
  doc.setTextColor(...COLORS.warning);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Conseil', MARGINS.left + 5, yPos + 7);
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(tipLines, MARGINS.left + 5, yPos + 13);

  addFooter(doc, pageNumber);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 6 — RECOMMANDATIONS (real quick_wins + projects)
  // ═══════════════════════════════════════════════════════════════════════════

  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;
  yPos = addSectionTitle(doc, 'Plan d\'action recommande', yPos, COLORS.success);

  // Quick wins
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('Actions rapides - 7 jours', MARGINS.left, yPos);
  yPos += 8;

  const drawRecoCard = (
    item: Recommendation,
    idx: number,
    accentColor: [number, number, number],
    bgColor: [number, number, number]
  ) => {
    const titleLines  = doc.splitTextToSize(item.title || '', CONTENT_WIDTH - 50);
    const detailLines = doc.splitTextToSize(item.details || '', CONTENT_WIDTH - 20);
    const resultLines = doc.splitTextToSize(item.expected_result || '', CONTENT_WIDTH - 30);
    const cardH = Math.max(28, 12 + detailLines.length * 4.5 + resultLines.length * 4);

    doc.setFillColor(...bgColor);
    doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, cardH, 3, 3, 'F');
    doc.setFillColor(...accentColor);
    doc.roundedRect(MARGINS.left, yPos, 4, cardH, 2, 2, 'F');

    // Priority badge
    doc.setFillColor(...accentColor);
    doc.roundedRect(MARGINS.left + 8, yPos + 4, 12, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`#${idx + 1}`, MARGINS.left + 14, yPos + 8.5, { align: 'center' });

    // Title
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(titleLines[0] || '', MARGINS.left + 24, yPos + 9);

    // Details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textLight);
    detailLines.slice(0, 2).forEach((line: string, li: number) => {
      doc.text(line, MARGINS.left + 8, yPos + 16 + li * 4.5);
    });

    // Expected result
    if (item.expected_result) {
      const rY = yPos + 16 + Math.min(detailLines.length, 2) * 4.5;
      doc.setFillColor(...accentColor);
      doc.setTextColor(...accentColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('Resultat attendu: ', MARGINS.left + 8, rY + 2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.text);
      doc.text(truncateText(item.expected_result, 80), MARGINS.left + 45, rY + 2);
    }

    yPos += cardH + 4;
  };

  const qwItems = quickWins.length > 0
    ? quickWins
    : topIssues.slice(0, 2).map((issue, i) => ({
        title: `Traiter : ${issue.theme}`,
        details: issue.ai_synthesis || '',
        expected_result: 'Amelioration de la satisfaction client',
        priority: i + 1,
      }));

  qwItems.slice(0, 3).forEach((item, idx) => {
    drawRecoCard(item, idx, GREEN_PRIMARY, GREEN_PALE);
  });

  yPos += 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('Projets - 30 jours', MARGINS.left, yPos);
  yPos += 8;

  const projItems = projects.length > 0 ? projects : [];
  projItems.slice(0, 2).forEach((item, idx) => {
    drawRecoCard(item, idx, BLUE_PRIMARY, BLUE_PALE);
  });

  addFooter(doc, pageNumber);

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
  const lang = (data.report_language ?? 'fr') as 'en' | 'fr';

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
    yPos = addSectionTitle(doc, 'Objectifs SMART & Plan d\'action', yPos, PURPLE_PRIMARY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.textLight);
    doc.text(
      lang === 'fr'
        ? 'Objectifs definis sur la base des causes prioritaires identifiees par l\'IA'
        : 'Objectives defined based on priority causes identified by AI',
      MARGINS.left, yPos
    );
    yPos += 14;

    // ── One objective per card, stacked vertically ──────────────────────────
    smartObjectives.slice(0, 3).forEach((obj, objIdx) => {

      // New page if not enough room for a card (~100mm)
      if (yPos > PAGE_HEIGHT - MARGINS.bottom - 100) {
        pageNumber = addNewPage(doc, pageNumber);
        yPos = MARGINS.top + 6;
      }

      const causeName  = t((obj as any).pareto_cause) || (obj as any).pareto_cause?.key || '';
      const problemTxt = t((obj as any).problem);
      const kpiTxt     = t((obj as any).kpi_label);
      const synthTxt   = t((obj as any).synthesis);
      const unitTxt    = (() => {
        // unit is "negative reviews | mentions | percent" — just take first segment
        const raw = t((obj as any).unit);
        return raw.split('|')[0].trim();
      })();

      const actionPlanItems = resolveActionPlan(obj).slice(0, 4);

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
      const durationMonths = (obj as any).duration_months ?? 3;

      // Progress = current_value - current_progress (issues reduced so far)
      // baseline = pareto_count (starting number of issues)
      const reduced     = Math.max(0, currentVal - currentProgress);
      const baseline    = Math.max(paretoCount, currentVal);
      const range       = Math.max(1, baseline - targetVal);
      const progressPct = Math.round((reduced / range) * 100);
      const safePct     = Math.min(100, Math.max(0, progressPct));

      const impactStr = String((obj as any).impact ?? '').toLowerCase();
      const effortStr = String((obj as any).effort ?? '').toLowerCase();
      const statusStr = String((obj as any).status ?? 'todo');

      const impactColor: [number, number, number] =
        impactStr === 'high'   ? RED_PRIMARY :
        impactStr === 'medium' ? COLORS.warning : GREEN_PRIMARY;
      const effortColor: [number, number, number] =
        effortStr === 'high'   ? RED_PRIMARY :
        effortStr === 'medium' ? COLORS.warning : GREEN_PRIMARY;

      const statusLabel =
        statusStr === 'done'        ? (lang === 'fr' ? 'Termine'    : 'Done')        :
        statusStr === 'in_progress' ? (lang === 'fr' ? 'En cours'   : 'In progress') :
                                      (lang === 'fr' ? 'A faire'    : 'To do');
      const statusColor: [number, number, number] =
        statusStr === 'done'        ? GREEN_PRIMARY :
        statusStr === 'in_progress' ? COLORS.warning :
                                      COLORS.textLight;

      // ── Card header ────────────────────────────────────────────────────────
      const hdrH = 12;
      doc.setFillColor(...PURPLE_PRIMARY);
      doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, hdrH, 3, 3, 'F');

      // Index circle
      doc.setFillColor(255, 255, 255);
      doc.circle(MARGINS.left + 8, yPos + 6, 4.5, 'F');
      doc.setTextColor(...PURPLE_PRIMARY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`${objIdx + 1}`, MARGINS.left + 8, yPos + 7.5, { align: 'center' });

      // Cause name
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(truncateText(causeName, 38), MARGINS.left + 18, yPos + 8);

      // Status badge
      doc.setFillColor(...statusColor);
      const statusW = 22;
      doc.roundedRect(MARGINS.left + CONTENT_WIDTH - statusW - 3, yPos + 3, statusW, 6, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text(statusLabel, MARGINS.left + CONTENT_WIDTH - statusW / 2 - 3, yPos + 7.5, { align: 'center' });

      yPos += hdrH;
      yPos += 4;

      // ── Card body: stacked single-column layout ────────────────────────────
      const PAD = 6;
      const IW  = CONTENT_WIDTH - PAD * 2;

    const problemLines = doc.splitTextToSize(problemTxt, IW);
const kpiLines     = doc.splitTextToSize(kpiTxt, IW);

// ── Action plan constants — defined FIRST so cardH can use them ──────────
const BULLET_R   = 3.5;
const BULLET_CX  = MARGINS.left + PAD + BULLET_R + 1;
const TEXT_LEFT  = MARGINS.left + PAD + BULLET_R * 2;
const TEXT_MAX_W = MARGINS.left + PAD + IW - PAD - TEXT_LEFT;
const ROW_PAD_V  = 4;
const LINE_H     = 4.5;
const ROW_GAP    = 2;

// Split using TEXT_MAX_W — same width used during render
const actionLines = actionPlanItems.map((a: string) =>
  doc.splitTextToSize(a, TEXT_MAX_W) as string[]
);

const actionBlockH = actionPlanItems.length > 0
  ? PAD + 6 + actionLines.reduce(
      (s: number, l: string[]) => s + l.length * LINE_H + ROW_PAD_V * 2 + ROW_GAP,
      0
    )
  : 0;

const pillH  = 7;
const trackH = 7;

const cardH =
  PAD +
  8 + PAD +
  PAD +
  5 + problemLines.length * 4.5 + PAD +
  5 + kpiLines.length * 4.5 + PAD +
  8 +
  pillH + 4 +
  trackH + 4 +
  6 + PAD +
  actionBlockH +
  PAD;

      doc.setFillColor(250, 248, 255);
      doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, cardH, 3, 3, 'F');
      doc.setDrawColor(...PURPLE_PRIMARY);
      doc.setLineWidth(0.5);
      doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, cardH, 3, 3, 'S');

      let cy = yPos + PAD;

      // ── Badges row: Impact / Effort / Ishikawa ──────────────────────────────
      const badgeH  = 8;
      const badge3W = (IW - 6) / 3;
      const bX      = MARGINS.left + PAD;

      doc.setFillColor(...impactColor);
      doc.roundedRect(bX, cy, badge3W, badgeH, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(`Impact : ${(obj as any).impact ?? ''}`, bX + badge3W / 2, cy + 5.5, { align: 'center' });

      doc.setFillColor(...effortColor);
      doc.roundedRect(bX + badge3W + 3, cy, badge3W, badgeH, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(`Effort : ${(obj as any).effort ?? ''}`, bX + badge3W + 3 + badge3W / 2, cy + 5.5, { align: 'center' });

      const ishiCat   = String((obj as any).ishikawa_top_category ?? '').toUpperCase();
      const ishiColor = getCategoryColor((obj as any).ishikawa_top_category ?? '');
      doc.setFillColor(...ishiColor);
      doc.roundedRect(bX + (badge3W + 3) * 2, cy, badge3W, badgeH, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(ishiCat || '—', bX + (badge3W + 3) * 2 + badge3W / 2, cy + 5.5, { align: 'center' });

      cy += badgeH + PAD;

      // Divider
      doc.setDrawColor(210, 200, 240);
      doc.setLineWidth(0.3);
      doc.line(MARGINS.left + PAD, cy, MARGINS.left + CONTENT_WIDTH - PAD, cy);
      cy += PAD;

      // ── Problem ──────────────────────────────────────────────────────────────
      doc.setTextColor(...PURPLE_PRIMARY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(lang === 'fr' ? 'PROBLEME' : 'PROBLEM', MARGINS.left + PAD, cy);
      cy += 5;
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      problemLines.forEach((line: string) => { doc.text(line, MARGINS.left + PAD, cy); cy += 4.5; });
      cy += PAD;

      // ── KPI ──────────────────────────────────────────────────────────────────
      doc.setTextColor(...PURPLE_PRIMARY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(lang === 'fr' ? 'KPI SUIVI' : 'KPI TRACKED', MARGINS.left + PAD, cy);
      cy += 5;
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      kpiLines.forEach((line: string) => { doc.text(line, MARGINS.left + PAD, cy); cy += 4.5; });
      cy += PAD;

      // ── Progress ─────────────────────────────────────────────────────────────
      doc.setTextColor(...PURPLE_PRIMARY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(lang === 'fr' ? 'PROGRESSION' : 'PROGRESS', MARGINS.left + PAD, cy);
      cy += 5;

      // Current → Target pills
      const halfIW = (IW - 6) / 2;
      doc.setFillColor(230, 220, 255);
      doc.roundedRect(MARGINS.left + PAD, cy, halfIW, pillH, 2, 2, 'F');
      doc.setTextColor(...PURPLE_PRIMARY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(
        `${lang === 'fr' ? 'Actuel' : 'Current'}: ${currentVal} ${unitTxt}`,
        MARGINS.left + PAD + halfIW / 2, cy + 5, { align: 'center' }
      );
      doc.setTextColor(...COLORS.textLight);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('>', MARGINS.left + PAD + halfIW + 3, cy + 5, { align: 'center' });
      doc.setFillColor(...GREEN_PALE);
      doc.roundedRect(MARGINS.left + PAD + halfIW + 6, cy, halfIW, pillH, 2, 2, 'F');
      doc.setTextColor(...GREEN_PRIMARY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(
        `${lang === 'fr' ? 'Cible' : 'Target'}: ${targetVal} ${unitTxt}`,
        MARGINS.left + PAD + halfIW + 6 + halfIW / 2, cy + 5, { align: 'center' }
      );
      cy += pillH + 4;

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

      // Deadline chip
      doc.setFillColor(...COLORS.background);
      doc.roundedRect(MARGINS.left + PAD, cy, IW, 6, 1, 1, 'F');
      doc.setTextColor(...COLORS.textLight);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(
        lang === 'fr'
          ? `Echeance : ${deadlineDate}  (${durationMonths} mois)`
          : `Deadline: ${deadlineDate}  (${durationMonths} mo.)`,
        MARGINS.left + PAD + IW / 2, cy + 4.3, { align: 'center' }
      );
      cy += 6 + PAD;

      // ── Action plan ──────────────────────────────────────────────────────────
if (actionPlanItems.length > 0) {
  doc.setDrawColor(210, 200, 240);
  doc.setLineWidth(0.3);
  doc.line(MARGINS.left + PAD, cy, MARGINS.left + CONTENT_WIDTH - PAD, cy);
  cy += PAD;

  doc.setTextColor(...PURPLE_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(lang === 'fr' ? "PLAN D'ACTION" : 'ACTION PLAN', MARGINS.left + PAD, cy);
  cy += 6;

  const BULLET_OFFSET = 11;
  const RIGHT_PAD = 4;
  const TEXT_MAX_W = IW - BULLET_OFFSET - RIGHT_PAD;

  actionLines.forEach((lines: string[], ai: number) => {
    const LINE_HEIGHT = 4.5;
    const V_PAD = 6;

    // ✅ Join back to one string, then split ONCE at the correct width
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const fullText = lines.join(' ');
    const safeLines: string[] = doc.splitTextToSize(fullText, TEXT_MAX_W);

    const itemH = safeLines.length * LINE_HEIGHT + V_PAD;

    // Alternating row bg
    doc.setFillColor(ai % 2 === 0 ? 245 : 250, ai % 2 === 0 ? 240 : 248, 255);
    doc.roundedRect(MARGINS.left + PAD, cy - 1, IW, itemH, 1, 1, 'F');

    // Bullet circle — vertically centered in the row
    const midY = cy - 1 + itemH / 2;
    doc.setFillColor(...PURPLE_PRIMARY);
    doc.circle(MARGINS.left + PAD + 4, midY, 3.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(`${ai + 1}`, MARGINS.left + PAD + 4, midY + 1.3, { align: 'center' });

    // Action text — vertically centered as a block
    const totalTextH = safeLines.length * LINE_HEIGHT;
    const textBlockStartY = cy - 1 + (itemH - totalTextH) / 2 + LINE_HEIGHT - 1;

    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    safeLines.forEach((line: string, li: number) => {
      doc.text(line, MARGINS.left + PAD + BULLET_OFFSET, textBlockStartY + li * LINE_HEIGHT);
    });

    cy += itemH;
  });
}

      yPos += cardH + 8;
    });

    // // ── Ishikawa 5M aggregated scores — on same or new page ─────────────────
    // if (yPos > PAGE_HEIGHT - MARGINS.bottom - 55) {
    //   pageNumber = addNewPage(doc, pageNumber);
    //   yPos = MARGINS.top + 6;
    // }

    // // Aggregate scores
    // const scoreKeys = ['manpower', 'method', 'machine', 'material', 'measurement'] as const;
    // const scoreTotals: Record<string, number> = {};
    // const scoreLabels: Record<string, string> = {
    //   manpower:    lang === 'fr' ? 'Main-d\'oeuvre' : 'Manpower',
    //   method:      lang === 'fr' ? 'Methodes'       : 'Methods',
    //   machine:     lang === 'fr' ? 'Machines'       : 'Machines',
    //   material:    lang === 'fr' ? 'Materiaux'      : 'Materials',
    //   measurement: lang === 'fr' ? 'Mesure'         : 'Measurement',
    // };

    // smartObjectives.forEach(obj => {
    //   scoreKeys.forEach(k => {
    //     scoreTotals[k] = (scoreTotals[k] ?? 0) + ((obj as any).questionnaire_scores?.[k] ?? 0);
    //   });
    // });

    // const maxScore = Math.max(...Object.values(scoreTotals), 1);

    // // Section label
    // doc.setFontSize(11);
    // doc.setFont('helvetica', 'bold');
    // doc.setTextColor(...COLORS.text);
    // doc.text(
    //   lang === 'fr' ? 'Scores Ishikawa (5M) — Vue globale' : 'Ishikawa (5M) Scores — Overview',
    //   MARGINS.left, yPos
    // );
    // yPos += 8;

    // const barH   = 9;
    // const barGap = 5;
    // const labelW = 38;
    // const scoreBarW = CONTENT_WIDTH - labelW - 24;

    // scoreKeys.forEach(k => {
    //   const val      = scoreTotals[k] ?? 0;
    //   const fillPct  = val / maxScore;
    //   const fillColor: [number, number, number] =
    //     fillPct >= 0.75 ? RED_PRIMARY :
    //     fillPct >= 0.45 ? COLORS.warning : GREEN_PRIMARY;

    //   // Label
    //   doc.setTextColor(...COLORS.text);
    //   doc.setFont('helvetica', 'normal');
    //   doc.setFontSize(8.5);
    //   doc.text(scoreLabels[k], MARGINS.left, yPos + barH - 2);

    //   // Track background
    //   doc.setFillColor(219, 234, 254);
    //   doc.roundedRect(MARGINS.left + labelW, yPos, scoreBarW, barH, 2, 2, 'F');

    //   // Fill
    //   if (fillPct > 0) {
    //     doc.setFillColor(...fillColor);
    //     doc.roundedRect(MARGINS.left + labelW, yPos, fillPct * scoreBarW, barH, 2, 2, 'F');
    //   }

    //   // Value badge
    //   doc.setFillColor(...COLORS.background);
    //   doc.roundedRect(MARGINS.left + labelW + scoreBarW + 2, yPos + 1, 14, barH - 2, 1, 1, 'F');
    //   doc.setTextColor(...COLORS.text);
    //   doc.setFont('helvetica', 'bold');
    //   doc.setFontSize(8);
    //   doc.text(`${val}`, MARGINS.left + labelW + scoreBarW + 9, yPos + barH - 2, { align: 'center' });

    //   yPos += barH + barGap;
    // });

    // yPos += 4;
    // // Note
    // doc.setTextColor(...COLORS.textLight);
    // doc.setFont('helvetica', 'italic');
    // doc.setFontSize(7.5);
    // doc.text(
    //   lang === 'fr'
    //     ? 'Scores plus eleves = categories ayant le plus contribue aux problemes identifies.'
    //     : 'Higher scores = categories that contributed most to identified issues.',
    //   MARGINS.left, yPos
    // );

    // addFooter(doc, pageNumber);
  }

  
  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 9 — PLAN EQUIPE (operational poster)
  // ═══════════════════════════════════════════════════════════════════════════

  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;

  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_WIDTH, 55, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PLAN D\'ACTION OPERATIONNEL', PAGE_WIDTH / 2, 18, { align: 'center' });
  doc.setFontSize(12);
  doc.text('OBJECTIFS & CHECKLIST EQUIPE', PAGE_WIDTH / 2, 28, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(truncateText(data.establishmentName, 45), PAGE_WIDTH / 2, 40, { align: 'center' });
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), PAGE_WIDTH / 2, 50, { align: 'center' });

  yPos = 65;

  doc.setFillColor(245, 247, 250);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 12, 2, 2, 'F');
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('"Notre objectif : offrir une experience client irreprochable, chaque jour."', PAGE_WIDTH / 2, yPos + 8, { align: 'center' });
  yPos += 20;

  // Objectives — real data
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('OBJECTIFS PRIORITAIRES', MARGINS.left + 5, yPos + 5.5);
  yPos += 12;

  const objectives: Array<any> = data.smart_objectives;

  // if (topIssues.length > 0) {
  //   objectives.push({
  //     title: `Ameliorer : ${truncateText(topIssues[0].theme, 22)}`,
  //     indicator: `${topIssues[0].count} mentions negatives a reduire`
  //   });
  // }
  // if (quickWins.length > 0) {
  //   objectives.push({
  //     title: truncateText(quickWins[0].title, 28),
  //     indicator: truncateText(quickWins[0].expected_result, 35)
  //   });
  // } else {
  //   objectives.push({
  //     title: data.avgRating < 4 ? 'Augmenter la note globale' : 'Fideliser les clients',
  //     indicator: data.avgRating < 4
  //       ? `Objectif : ${Math.min(5, data.avgRating + 0.5).toFixed(1)}/5 en 3 mois`
  //       : '+20% d\'avis 5 etoiles'
  //   });
  // }
  // objectives.push({
  //   title: 'Collecter plus d\'avis',
  //   indicator: '+5 avis/semaine minimum'
  // });

  const colWidth = (CONTENT_WIDTH - 10) / 3;
  objectives.slice(0, 3).forEach((obj, idx) => {
    const colX = MARGINS.left + idx * (colWidth + 5);
    doc.setFillColor(...COLORS.background);
    doc.roundedRect(colX, yPos, colWidth, 35, 2, 2, 'F');
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.roundedRect(colX, yPos, colWidth, 35, 2, 2, 'S');
    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Obj. ${idx + 1}`, colX + colWidth / 2, yPos + 8, { align: 'center' });
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(doc.splitTextToSize(obj.pareto_cause?.[i18n.language], colWidth - 6)[0], colX + 3, yPos + 16);
    doc.setTextColor(...COLORS.success);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(obj.problem?.[i18n.language], colWidth - 6)[0], colX + 3, yPos + 30);
  });

  yPos += 42;

  // Checklist — real first_steps from pain_points
  doc.setFillColor(...COLORS.success);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ACTIONS A METTRE EN OEUVRE', MARGINS.left + 5, yPos + 5.5);
  yPos += 12;

  const checklistActions: string[] =
  (objectives ?? [])
    .flatMap(obj =>
      (obj.actions ?? [])
        .map(action =>
          i18n.language === 'fr'
            ? action?.text?.fr
            : action?.text?.en
        )
        .filter(Boolean)
    )
    .slice(0, 8);

  const halfColWidth = (CONTENT_WIDTH - 5) / 2;
  const halfItems = Math.ceil(checklistActions.length / 2);

  checklistActions.forEach((action, idx) => {
    const isLeft = idx < halfItems;
    const colX   = isLeft ? MARGINS.left : MARGINS.left + halfColWidth + 5;
    const rowIdx = isLeft ? idx : idx - halfItems;
    const itemY  = yPos + rowIdx * 12;

    doc.setDrawColor(...COLORS.textLight);
    doc.setLineWidth(0.3);
    doc.rect(colX, itemY, 4, 4, 'S');

    doc.setTextColor(...COLORS.text);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(action, halfColWidth - 10);
    doc.text(lines, colX + 6, itemY + 3);
  });

  yPos += halfItems * 12 + 8;

  // Team rituals
  doc.setFillColor(...COLORS.warning);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RITUELS D\'EQUIPE', MARGINS.left + 5, yPos + 5.5);
  yPos += 10;

  const rituals = [
    { icon: '1', text: 'Brief quotidien (2 min avant service)' },
    { icon: '2', text: 'Lecture des avis 1x par semaine' },
    { icon: '3', text: 'Suivi mensuel avec Reviewsvisor' },
  ];

  doc.setFillColor(...COLORS.background);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 20, 2, 2, 'F');

  rituals.forEach((ritual, idx) => {
    const ritualX = MARGINS.left + (idx + 0.5) * (CONTENT_WIDTH / 3);
    doc.setFillColor(...COLORS.primary);
    doc.circle(ritualX, yPos + 6, 3.5, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(ritual.icon, ritualX, yPos + 7.5, { align: 'center' });
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(ritual.text, CONTENT_WIDTH / 3 * 0.8), ritualX, yPos + 14, { align: 'center' });
  });

  yPos += 23;

  // Signature zone
  doc.setFillColor(...COLORS.secondary);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ENGAGEMENT EQUIPE', MARGINS.left + 5, yPos + 5.5);
  yPos += 10;

  doc.setFillColor(...COLORS.white);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 40, 2, 2, 'F');
  doc.setDrawColor(...COLORS.textLight);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 40, 2, 2, 'S');
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('"Nous nous engageons a appliquer ces actions au quotidien."', PAGE_WIDTH / 2, yPos + 12, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Responsable : ______________________________', MARGINS.left + 10, yPos + 26);
  doc.text('Date : ______________', MARGINS.left + 10, yPos + 35);

  
  // ═══════════════════════════════════════════════════════════════════════════
  // Last page — CONCLUSION STRATEGIQUE (real AI synthesis)
  // ═══════════════════════════════════════════════════════════════════════════

  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;
  yPos = addSectionTitle(doc, 'Conclusion strategique - Analyse IA', yPos, COLORS.primary);

  const strategicText = generateStrategicConclusion(data, ad);
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 200, 3, 3, 'F');

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const conclusionLines = doc.splitTextToSize(strategicText, CONTENT_WIDTH - 15);
  let currentY = yPos + 10;

  conclusionLines.forEach((line: string) => {
    if (currentY > yPos + 190) return;
    const isSectionTitle = /^\d\./.test(line.trim());
    doc.setFont('helvetica', isSectionTitle ? 'bold' : 'normal');
    doc.setTextColor(...(isSectionTitle ? COLORS.primary : COLORS.text));
    doc.text(line, MARGINS.left + 7, currentY);
    currentY += 5.5;
  });

  yPos += 210;
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 20, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Cette analyse a ete generee automatiquement par l\'intelligence artificielle de Reviewsvisor',
    PAGE_WIDTH / 2, yPos + 8, { align: 'center' }
  );
  doc.text(
    'basee sur l\'ensemble des avis clients de votre etablissement.',
    PAGE_WIDTH / 2, yPos + 14, { align: 'center' }
  );

  addFooter(doc, pageNumber);


  // ── Save ────────────────────────────────────────────────────────────────────

  const sanitizedName = data.establishmentName
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30);
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`Rapport_Analyse_Avis_${sanitizedName}_${dateStr}.pdf`);
}

// ─── STRATEGIC CONCLUSION (real data) ────────────────────────────────────────

function generateStrategicConclusion(data: ReportData, ad?: AnalysisData): string {
  const parts: string[] = [];
  const oneLiner = ad?.summary?.one_liner ?? ad?.summary_one_liner ?? '';

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