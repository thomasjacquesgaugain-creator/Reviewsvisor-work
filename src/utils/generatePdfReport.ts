import type jsPDF from 'jspdf';

interface ReportData {
  establishmentName: string;
  totalReviews: number;
  avgRating: number;
  positiveRatio: number;
  topIssues: Array<{ theme?: string; issue?: string; count?: number; mentions?: number }>;
  topStrengths: Array<{ theme?: string; strength?: string; count?: number; mentions?: number }>;
  themes?: Array<{ theme: string; score?: number; count?: number }>;
  recentReviews: Array<{ text?: string; rating?: number; author?: string; author_name?: string; published_at?: string }>;
  summary?: string;
  aiDebrief?: string;
  positivePct?:number;
}

// Couleurs professionnelles
const COLORS = {
  primary: [37, 99, 235] as [number, number, number], // Bleu #2563EB
  secondary: [55, 65, 81] as [number, number, number], // Gris foncé
  success: [22, 163, 74] as [number, number, number], // Vert
  warning: [234, 179, 8] as [number, number, number], // Jaune
  danger: [220, 38, 38] as [number, number, number], // Rouge
  text: [31, 41, 55] as [number, number, number], // Texte principal
  textLight: [107, 114, 128] as [number, number, number], // Texte secondaire
  background: [249, 250, 251] as [number, number, number], // Fond gris clair
  white: [255, 255, 255] as [number, number, number],
  gold: [245, 158, 11] as [number, number, number], // Or pour score
};

// Marges A4 standard (en mm)
const MARGINS = { top: 20, right: 20, bottom: 25, left: 20 };
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGINS.left - MARGINS.right;

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


function getSatisfactionIndex(
  percentage: number
): { label: string; color: [number, number, number] } {
  if (percentage >= 80) {
    return { label: "Bon", color: COLORS.success };
  }
  if (percentage >= 60) {
    return { label: "Moyen", color: COLORS.warning };
  }
  return { label: "À revoir", color: COLORS.danger };
}

function getSentimentLabel(ratio: number): { label: string; color: [number, number, number] } {
  if (ratio >= 0.8) return { label: 'Tres positif', color: COLORS.success };
  if (ratio >= 0.6) return { label: 'Positif', color: COLORS.success };
  if (ratio >= 0.4) return { label: 'Neutre', color: COLORS.warning };
  if (ratio >= 0.2) return { label: 'Negatif', color: COLORS.danger };
  return { label: 'Tres negatif', color: COLORS.danger };
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function addSectionTitle(doc: jsPDF, title: string, yPos: number, color: [number, number, number] = COLORS.primary): number {
  doc.setFillColor(...color);
  doc.rect(MARGINS.left, yPos, 5, 10, 'F');
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGINS.left + 10, yPos + 7);
  return yPos + 20;
}

export async function generatePdfReport(data: ReportData): Promise<void> {
  const { default: JsPDF } = await import('jspdf');
  const doc = new JsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let pageNumber = 1;
  let yPos = MARGINS.top;

const BLUE_PRIMARY: [number, number, number]  = [37, 99, 235];
const BLUE_LIGHT: [number, number, number]    = [191, 219, 254];
const BLUE_PALE: [number, number, number]     = [239, 246, 255];
const GREEN_PRIMARY: [number, number, number] = [22, 163, 74];
const GREEN_BORDER: [number, number, number]  = [134, 239, 172];
const GREEN_PALE: [number, number, number]    = [240, 253, 244];
const RED_PRIMARY: [number, number, number]   = [220, 38, 38];
const RED_BORDER: [number, number, number]    = [252, 165, 165];
const RED_PALE: [number, number, number]      = [255, 245, 245];
const GREEN_LIGHT: [number, number, number]   = [187, 247, 208];
const RED_LIGHT: [number, number, number]     = [254, 202, 202];
const ROW_WHITE: [number, number, number]     = [255, 255, 255];

const BLUE_DARK: [number, number, number]     = [30, 64, 175];
const GREEN_ICON: [number, number, number]    = [220, 252, 231];
const RED_ICON: [number, number, number]      = [254, 226, 226];

  // ========== PAGE 1: COUVERTURE ==========
  
  // Fond de couleur pour l'en-tete
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_WIDTH, 100, 'F');

  // Logo/Nom du produit
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('Reviewsvisor', PAGE_WIDTH / 2, 40, { align: 'center' });

  // Sous-titre
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text("Rapport d'analyse des avis clients", PAGE_WIDTH / 2, 55, { align: 'center' });

  // Ligne decorative
  doc.setDrawColor(...COLORS.white);
  doc.setLineWidth(0.5);
  doc.line(60, 70, 150, 70);

  // Nom de l'etablissement
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const estabName = truncateText(data.establishmentName, 40);
  doc.text(estabName, PAGE_WIDTH / 2, 140, { align: 'center' });

  // Date de generation
  const generationDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textLight);
  doc.text(`Rapport genere le ${generationDate}`, PAGE_WIDTH / 2, 155, { align: 'center' });

  // Encadre avec les KPIs principaux
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(30, 180, 150, 60, 3, 3, 'F');

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  // KPI: Note moyenne
  doc.setFont('helvetica', 'bold');
  doc.text('Note moyenne', 55, 200, { align: 'center' });
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.text(`${data.avgRating.toFixed(1)}/5`, 55, 215, { align: 'center' });

  // KPI: Nombre d'avis
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text("Avis analyses", 105, 200, { align: 'center' });
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.text(`${data.totalReviews}`, 105, 215, { align: 'center' });

  // KPI: Sentiment
  const sentiment = getSentimentLabel(data.positiveRatio);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text('Sentiment', 155, 200, { align: 'center' });
  doc.setFontSize(16);
  doc.setTextColor(...sentiment.color);
  doc.text(sentiment.label, 155, 215, { align: 'center' });

  addFooter(doc, pageNumber);

  // ========== PAGE 2: SCORE GLOBAL (VERSION TEXTE UNIQUEMENT) ==========
pageNumber = addNewPage(doc, pageNumber);
yPos = MARGINS.top;

yPos = addSectionTitle(doc, 'Score Global', yPos, COLORS.gold);

const satisfaction = getSatisfactionIndex(data.positivePct);
const positivePct = Math.round(data.positiveRatio * 100);
const negativePct = 100 - positivePct;

// =====================================================
// HERO CARD
// =====================================================
const heroH = 42;

doc.setFillColor(255, 255, 255);
doc.roundedRect(
  MARGINS.left,
  yPos,
  CONTENT_WIDTH,
  heroH,
  4,
  4,
  'F'
);

doc.setDrawColor(...BLUE_PRIMARY);
doc.setLineWidth(0.9);
doc.roundedRect(
  MARGINS.left,
  yPos,
  CONTENT_WIDTH,
  heroH,
  4,
  4,
  'S'
);

// NOTE GLOBALE
doc.setTextColor(180, 176, 165);
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.text('NOTE GLOBALE', PAGE_WIDTH / 2, yPos + 8, {
  align: 'center',
});

// SCORE
doc.setTextColor(...BLUE_PRIMARY);
doc.setFont('helvetica', 'bold');
doc.setFontSize(32);

doc.text(
  data.avgRating.toFixed(1),
  PAGE_WIDTH / 2 - 6,
  yPos + 23,
  { align: 'center' }
);

doc.setTextColor(147, 197, 253);
doc.setFontSize(14);
doc.setFont('helvetica', 'bold');
doc.text('/ 5', PAGE_WIDTH / 2 + 12, yPos + 23);

// Divider
doc.setDrawColor(...BLUE_LIGHT);
doc.setLineWidth(0.6);
doc.line(
  PAGE_WIDTH / 2 - 12,
  yPos + 28,
  PAGE_WIDTH / 2 + 12,
  yPos + 28
);

// Satisfaction Row
const rowY = yPos + 38;

doc.setTextColor(...COLORS.textLight);
doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);

doc.text(
  'Indice de satisfaction',
  PAGE_WIDTH / 2 - 10,
  rowY,
  { align: 'right' }
);

const pillW = 18;
const pillH = 7;
const pillX = PAGE_WIDTH / 2 + 2;

doc.setFillColor(...BLUE_PRIMARY);
doc.roundedRect(
  pillX,
  rowY - 5.5,
  pillW,
  pillH,
  3,
  3,
  'F'
);

doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);

doc.text(
  satisfaction.label,
  pillX + pillW / 2,
  rowY - 1,
  { align: 'center' }
);

yPos += heroH + 8;

// =====================================================
// STAT CARDS
// =====================================================
const gap = 4;
const cardW = (CONTENT_WIDTH - gap) / 2;
const cardH = 26;

const drawStatCard = (
  x: number,
  pct: number,
  label: string,
  bg: [number, number, number],
  border: [number, number, number],
  numColor: [number, number, number],
  barColor: [number, number, number]
) => {
  doc.setFillColor(...bg);
  doc.roundedRect(x, yPos, cardW, cardH, 4, 4, 'F');

  doc.setDrawColor(...border);
  doc.setLineWidth(0.8);
  doc.roundedRect(x, yPos, cardW, cardH, 4, 4, 'S');

  // %
  doc.setTextColor(...numColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);

  doc.text(
    `${pct}%`,
    x + cardW / 2,
    yPos + 12,
    { align: 'center' }
  );

  // Label
  doc.setTextColor(...COLORS.textLight);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  doc.text(
    label,
    x + cardW / 2,
    yPos + 19,
    { align: 'center' }
  );

  // Accent line
  const barW = cardW * 0.55;

  doc.setFillColor(...barColor);
  doc.roundedRect(
    x + (cardW - barW) / 2,
    yPos + 22,
    barW,
    1.2,
    0.6,
    0.6,
    'F'
  );
};

drawStatCard(
  MARGINS.left,
  positivePct,
  'Avis positifs',
  GREEN_PALE,
  GREEN_BORDER,
  GREEN_PRIMARY,
  GREEN_BORDER
);

drawStatCard(
  MARGINS.left + cardW + gap,
  negativePct,
  'Avis négatifs',
  RED_PALE,
  RED_BORDER,
  RED_PRIMARY,
  RED_BORDER
);

yPos += cardH + 10;
// ── KPI Block ──────────────────────────────────────────────
yPos = addSectionTitle(doc, 'KPI - Indicateurs cles a suivre', yPos, COLORS.secondary);

const mainNegTheme = (data.topIssues && data.topIssues.length > 0)
  ? truncateText(data.topIssues[0].theme || data.topIssues[0].issue || 'Non identifie', 35)
  : 'Aucun';
const mainPosTheme = (data.topStrengths && data.topStrengths.length > 0)
  ? truncateText(data.topStrengths[0].theme || data.topStrengths[0].strength || 'Non identifie', 35)
  : 'Aucun';

const kpiItems: Array<{ label: string; value: string; valueColor: [number,number,number] }> = [
  { label: 'Note moyenne globale',    value: `${data.avgRating.toFixed(1)} / 5`, valueColor: BLUE_PRIMARY },
  { label: 'Avis positifs',           value: `${positivePct}%`,                  valueColor: GREEN_PRIMARY },
  { label: 'Avis negatifs',           value: `${negativePct}%`,                  valueColor: RED_PRIMARY },
  { label: 'Principal theme negatif', value: mainNegTheme,                        valueColor: COLORS.text as [number,number,number] },
  { label: 'Principal theme positif', value: mainPosTheme,                        valueColor: COLORS.text as [number,number,number] },
];

const kpiRowH  = 11;
const kpiTotalH = kpiRowH * kpiItems.length;
const kpiHdrH  = 9;

// KPI header (blue, same style as other tables)
// doc.setFillColor(...BLUE_PRIMARY);
// doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, kpiHdrH, 1, 1, 'F');
// doc.setDrawColor(...BLUE_PRIMARY);
// doc.setLineWidth(0.6);
// doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, kpiHdrH, 1, 1, 'S');
// doc.setTextColor(255, 255, 255);
// doc.setFontSize(8.5);
// doc.setFont('helvetica', 'bold');
// doc.text('Indicateurs cles', MARGINS.left + 5, yPos + 6);
// yPos += kpiHdrH;

const kpiRowsStart = yPos;

kpiItems.forEach((item, idx) => {
  const bg =  [255, 255, 255] as [number,number,number];
  doc.setFillColor(...bg);
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

// Outer border for KPI block
// doc.setDrawColor(...BLUE_PRIMARY);
// doc.setLineWidth(0.6);
// doc.roundedRect(MARGINS.left, kpiRowsStart - kpiHdrH, CONTENT_WIDTH, kpiHdrH + kpiTotalH, 1, 1, 'S');

// Note box with left accent
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

  // ========== PAGE 3: SYNTHESE - CE QUE VOS CLIENTS DISENT VRAIMENT ==========
  pageNumber = addNewPage(doc, pageNumber);
yPos = MARGINS.top;

yPos = addSectionTitle(doc, 'Synthese des retours clients', yPos);

// Sous-titre
doc.setFontSize(11);
doc.setFont('helvetica', 'italic');
doc.setTextColor(...COLORS.textLight);
doc.text('Ce que vos clients disent vraiment de votre etablissement', MARGINS.left, yPos);
yPos += 12;

// ── Helper: draw a section table ──────────────────────────
const drawSectionTable = (
  title: string,
  rows: Array<{ label: string; count: number }>,
  emptyMsg: string,
  headerColor: [number, number, number],
  rowPale: [number, number, number],
  rowDivider: [number, number, number],
  badgeBg: [number, number, number],
  badgeTxt: [number, number, number],
  numColor: [number, number, number]
) => {
  const tW    = CONTENT_WIDTH;
  const hdrH  = 9;
  const rowH  = 11;
  const nameW = tW - 38; // left column
  const cntW  = 38;      // right column (badge)
  const tX    = MARGINS.left;
  const cntX  = tX + nameW;

  // Header
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
    const bg = ROW_WHITE;
    doc.setFillColor(...bg);
    doc.rect(tX, yPos, tW, rowH, 'F');

    // Dividers
    doc.setDrawColor(...rowDivider);
    doc.setLineWidth(0.3);
    if (idx > 0) doc.line(tX, yPos, tX + tW, yPos);
    if (rows.length > 0) doc.line(cntX, yPos, cntX, yPos + rowH);

    if (rows.length > 0) {
      // Number
      doc.setTextColor(...numColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`${idx + 1}.`, tX + 5, yPos + 7);

      // Label
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      const label = doc.splitTextToSize(row.label, nameW - 20);
      doc.text(label[0], tX + 15, yPos + 7);

      // Badge
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
      // Empty message
      doc.setTextColor(...COLORS.textLight);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(row.label, tX + 5, yPos + 7);
    }

    yPos += rowH;
  });

  // Outer border
  doc.setDrawColor(...headerColor);
  doc.setLineWidth(0);
  doc.roundedRect(tX, rowsStartY - hdrH, tW, hdrH + rowH * displayRows.length, 1, 1, 'S');

  yPos += 10;
};

// ── Section 1: Points forts ────────────────────────────────
const strengthRows = (data.topStrengths || []).slice(0, 3).map((s) => ({
  label: s.theme || s.strength || 'Point fort',
  count: s.count || s.mentions || 0
}));
drawSectionTable(
  'Les 3 elements les plus apprecies',
  strengthRows,
  'Aucun point fort identifie dans les avis analyses',
  GREEN_PRIMARY, GREEN_PALE, GREEN_LIGHT,
  [220, 252, 231], [22, 101, 52],
  GREEN_PRIMARY
);

// ── Section 2: Points de friction ─────────────────────────
const issueRows = (data.topIssues || []).slice(0, 3).map((i) => ({
  label: i.theme || i.issue || 'Probleme',
  count: i.count || i.mentions || 0
}));
drawSectionTable(
  'Les 2-3 principaux points de friction',
  issueRows,
  'Aucun probleme majeur identifie',
  RED_PRIMARY, RED_PALE, RED_LIGHT,
  [254, 226, 226], [153, 27, 27],
  RED_PRIMARY
);

// ── Section 3: Impact sur la note ─────────────────────────
const impactHdrH = 9;
const impactTX   = MARGINS.left;
const impactTW   = CONTENT_WIDTH;

// Header
doc.setFillColor(...BLUE_PRIMARY);
doc.roundedRect(impactTX, yPos, impactTW, impactHdrH, 1, 1, 'F');
doc.setDrawColor(...BLUE_PRIMARY);
doc.setLineWidth(0.6);
doc.roundedRect(impactTX, yPos, impactTW, impactHdrH, 1, 1, 'S');
doc.setTextColor(255, 255, 255);
doc.setFontSize(9);
doc.setFont('helvetica', 'bold');
doc.text('Element ayant le plus d\'impact sur la note', impactTX + 5, yPos + 6);
yPos += impactHdrH;

let impactText = '';
if (data.topIssues && data.topIssues.length > 0 && data.avgRating < 4) {
  const main = data.topIssues[0];
  impactText = `Le principal facteur impactant negativement votre note est "${main.theme || main.issue}". Ameliorer ce point pourrait significativement augmenter votre note globale.`;
} else if (data.topStrengths && data.topStrengths.length > 0) {
  const main = data.topStrengths[0];
  impactText = `Votre point fort "${main.theme || main.strength}" est le principal atout qui maintient votre bonne note. Continuez a le valoriser.`;
} else {
  impactText = 'Collectez plus d\'avis pour identifier les facteurs cles impactant votre note.';
}

const impactLines = doc.splitTextToSize(impactText, impactTW - 10);
const impactRowH  = Math.max(14, 8 + impactLines.length * 5);

doc.setFillColor(...BLUE_PALE);
doc.rect(impactTX, yPos, impactTW, impactRowH, 'F');
doc.setTextColor(...COLORS.text);
doc.setFontSize(8.5);
doc.setFont('helvetica', 'normal');
doc.text(impactLines, impactTX + 5, yPos + 6);
yPos += impactRowH;

// Outer border
doc.setDrawColor(...BLUE_PRIMARY);
doc.setLineWidth(0);
doc.roundedRect(impactTX, yPos - impactHdrH - impactRowH, impactTW, impactHdrH + impactRowH, 1, 1, 'S');

addFooter(doc, pageNumber);

  // ========== PAGE 4: ANALYSE DETAILLEE ==========
pageNumber = addNewPage(doc, pageNumber);
yPos = MARGINS.top;

yPos = addSectionTitle(doc, 'Analyse Detaillee', yPos);


// ─── Répartition par note ──────────────────────────────────
doc.setFontSize(11);
doc.setFont('helvetica', 'bold');
doc.setTextColor(...COLORS.text);
doc.text('Repartition des avis par note', MARGINS.left, yPos);
yPos += 8;

const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
data.recentReviews.forEach((review) => {
  const rating = review.rating || 0;
  if (rating >= 1 && rating <= 5) ratingCounts[Math.round(rating)]++;
});
const totalRatings = Object.values(ratingCounts).reduce((a, b) => a + b, 0) || 1;

const ratingRows = [5, 4, 3, 2, 1];
const rTableW  = CONTENT_WIDTH;
const rNoteW   = 22;
const rRowH    = 11;

const rColNote = MARGINS.left;
const rColInfo = rColNote + rNoteW; // single combined column for bar + pct + count

const rRowsStartY = yPos;

ratingRows.forEach((rating, idx) => {
  const count = ratingCounts[rating];
  const pct   = (count / totalRatings) * 100;
  const bg    =  ROW_WHITE;

  doc.setFillColor(...bg);
  doc.rect(rColNote, yPos, rTableW, rRowH, 'F');

  // Row separator
  doc.setDrawColor(...BLUE_LIGHT);
  doc.setLineWidth(0.3);
  if (idx > 0) {
    doc.line(rColNote, yPos, rColNote + rTableW, yPos);
  }
  // Single vertical divider after note column
  // doc.line(rColInfo, yPos, rColInfo, yPos + rRowH);

  // Note label
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`${rating}/5`, rColNote + rNoteW / 2, yPos + 7, { align: 'center' });

  // ── Combined info column: bar + badge + count ──
  const infoW    = rTableW - rNoteW;
  const pctW     = 18;
  const countW   = 16;
  const barPad   = 4;
  const barW     = infoW - pctW - countW - barPad * 2 - 6;

  const trackX = rColInfo + barPad;
  const trackW = barW;
  const trackH = 5;
  const trackY = yPos + 3;

  // Progress track
  doc.setFillColor(219, 234, 254);
  doc.roundedRect(trackX, trackY, trackW, trackH, 1, 1, 'F');
  if (pct > 0) {
    const barColor: [number, number, number] =
      rating >= 4 ? [22, 163, 74] : rating === 3 ? [245, 158, 11] : [220, 38, 38];
    doc.setFillColor(...barColor);
    doc.roundedRect(trackX, trackY, (pct / 100) * trackW, trackH, 1, 1, 'F');
  }

  // Pct badge — right after bar
  const badgeColor: [number, number, number] =
    pct === 0    ? [241, 245, 249] :
    rating >= 4  ? [220, 252, 231] :
    rating === 3 ? [254, 249, 195] : [254, 226, 226];
  const badgeTxtColor: [number, number, number] =
    pct === 0    ? [100, 116, 139] :
    rating >= 4  ? [22, 101, 52]   :
    rating === 3 ? [180, 83, 9]    : [153, 27, 27];
  const badgeX = trackX + trackW + 2;
  doc.setFillColor(...badgeColor);
  doc.roundedRect(badgeX, yPos + 2.5, pctW, 6, 1, 1, 'F');
  doc.setTextColor(...badgeTxtColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`${Math.round(pct)}%`, badgeX + pctW / 2, yPos + 7, { align: 'center' });

  // Count — right after badge
  const countX = badgeX + pctW + 2;
  doc.setTextColor(...COLORS.textLight);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${count}`, countX + countW / 2, yPos + 7, { align: 'center' });

  yPos += rRowH;
});

// Outer border (no header, just rows)
// doc.setDrawColor(...BLUE_PRIMARY);
// doc.setLineWidth(0);
// doc.roundedRect(rColNote, rRowsStartY, rTableW, rRowH * ratingRows.length, 1, 1, 'S');

yPos += 12;

// ─── Thèmes récurrents ─────────────────────────────────────
if (data.themes && data.themes.length > 0) {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('Themes recurrents', MARGINS.left, yPos);
  yPos += 8;

  const themes = data.themes.slice(0, 6);
  const maxCount = Math.max(...themes.map((t) => t.count || t.score || 1));

  const tTableW   = CONTENT_WIDTH;
  const tThemeW   = 80;
  const tMentionW = 28;
  const tBarW     = tTableW - tThemeW - tMentionW;

  const tColTheme   = MARGINS.left;
  const tColMention = tColTheme + tThemeW;
  const tColBar     = tColMention + tMentionW;

  const tHdrH = 9;
  const tRowH = 11;

  // Header
  doc.setFillColor(...BLUE_PRIMARY);
  doc.roundedRect(tColTheme, yPos, tTableW, tHdrH, 1, 1, 'F');
  doc.setDrawColor(...BLUE_PRIMARY);
  doc.setLineWidth(0.6);
  doc.roundedRect(tColTheme, yPos, tTableW, tHdrH, 1, 1, 'S');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Theme',     tColTheme + 4,               yPos + 6);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.35);
  doc.line(tColMention, yPos + 1, tColMention, yPos + tHdrH - 1);
  doc.line(tColBar,     yPos + 1, tColBar,     yPos + tHdrH - 1);
  doc.text('Mentions',  tColMention + tMentionW / 2, yPos + 6, { align: 'center' });
  doc.text('Frequence', tColBar + tBarW / 2,         yPos + 6, { align: 'center' });
  yPos += tHdrH;

  const tRowsStartY = yPos;

  themes.forEach((theme, idx) => {
    const count = theme.count || theme.score || 0;
    const bg    = idx % 2 === 0 ? BLUE_PALE : ROW_WHITE;

    doc.setFillColor(...bg);
    doc.rect(tColTheme, yPos, tTableW, tRowH, 'F');

    doc.setDrawColor(...BLUE_LIGHT);
    doc.setLineWidth(0.3);
    doc.line(tColTheme,   yPos + tRowH, tColTheme + tTableW, yPos + tRowH);
    doc.line(tColMention, yPos, tColMention, yPos + tRowH);
    doc.line(tColBar,     yPos, tColBar,     yPos + tRowH);

    // Theme name
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const themeLabel = doc.splitTextToSize(theme.theme, tThemeW - 8);
    doc.text(themeLabel[0], tColTheme + 4, yPos + 7);

    // Mention badge
    const badgeW = 18;
    const badgeX = tColMention + (tMentionW - badgeW) / 2;
    doc.setFillColor(219, 234, 254);
    doc.roundedRect(badgeX, yPos + 2.5, badgeW, 6, 1, 1, 'F');
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`${count}`, tColMention + tMentionW / 2, yPos + 7, { align: 'center' });

    // Frequency bar
    const barTrackX = tColBar + 4;
    const barTrackW = tBarW - 8;
    const barH = 5;
    const barY = yPos + 3;
    doc.setFillColor(219, 234, 254);
    doc.roundedRect(barTrackX, barY, barTrackW, barH, 1, 1, 'F');
    if (count > 0) {
      doc.setFillColor(...BLUE_PRIMARY);
      doc.roundedRect(barTrackX, barY, (count / maxCount) * barTrackW, barH, 1, 1, 'F');
    }

    yPos += tRowH;
  });

  // Outer border
  doc.setDrawColor(...BLUE_PRIMARY);
  doc.setLineWidth(0);
  doc.roundedRect(tColTheme, tRowsStartY - tHdrH, tTableW, tHdrH + tRowH * themes.length, 1, 1, 'S');
}

addFooter(doc, pageNumber);

  // ========== PAGE 5: CHECKLIST OPERATIONNELLE ==========
  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;

  yPos = addSectionTitle(doc, 'Checklist Operationnelle', yPos, COLORS.success);

  // Sous-titre
  doc.setFontSize(11);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLORS.textLight);
  doc.text('Actions concretes a mettre en place', MARGINS.left, yPos);
  yPos += 15;

  // Generer les actions basees sur les donnees
  const checklistItems: Array<{ category: string; action: string; priority: 'high' | 'medium' | 'low' }> = [];

  // Action prioritaire liee au principal point negatif
  if (data.topIssues && data.topIssues.length > 0) {
    const mainIssue = data.topIssues[0];
    const issueName = mainIssue.theme || mainIssue.issue || 'probleme identifie';
    checklistItems.push({
      category: 'Action prioritaire',
      action: `Traiter en urgence : "${issueName}" - C'est le probleme le plus mentionne par vos clients`,
      priority: 'high'
    });
  }

  // Action court terme
  if (data.avgRating < 4) {
    checklistItems.push({
      category: 'Court terme',
      action: 'Former l\'equipe sur les points d\'amelioration identifies dans ce rapport',
      priority: 'medium'
    });
  } else {
    checklistItems.push({
      category: 'Court terme',
      action: 'Maintenir la qualite actuelle et surveiller les nouveaux avis regulierement',
      priority: 'medium'
    });
  }

  // Action gestion des avis
  checklistItems.push({
    category: 'Gestion des avis',
    action: 'Repondre a tous les avis (positifs et negatifs) dans les 48h pour montrer votre engagement',
    priority: 'medium'
  });

  // Action valorisation points forts
  if (data.topStrengths && data.topStrengths.length > 0) {
    const mainStrength = data.topStrengths[0];
    const strengthName = mainStrength.theme || mainStrength.strength || 'point fort';
    checklistItems.push({
      category: 'Valorisation',
      action: `Mettre en avant "${strengthName}" dans votre communication (reseaux sociaux, site web, etc.)`,
      priority: 'low'
    });
  }

  // Action suivi regulier
  checklistItems.push({
    category: 'Suivi regulier',
    action: 'Planifier une analyse mensuelle des nouveaux avis avec Reviewsvisor pour suivre l\'evolution',
    priority: 'low'
  });

  // Dessiner la checklist
  checklistItems.forEach((item) => {
    const priorityColor = item.priority === 'high' ? COLORS.danger : item.priority === 'medium' ? COLORS.warning : COLORS.success;
    
    doc.setFillColor(...COLORS.background);
    doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 25, 2, 2, 'F');
    
    // Case a cocher
    doc.setDrawColor(...COLORS.textLight);
    doc.setLineWidth(0.5);
    doc.rect(MARGINS.left + 5, yPos + 5, 5, 5, 'S');
    
    // Badge priorite
    doc.setFillColor(...priorityColor);
    doc.roundedRect(MARGINS.left + 15, yPos + 3, 35, 8, 1, 1, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(item.category.toUpperCase(), MARGINS.left + 32.5, yPos + 8.5, { align: 'center' });
    
    // Texte de l'action
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const actionLines = doc.splitTextToSize(item.action, CONTENT_WIDTH - 60);
    doc.text(actionLines.slice(0, 2), MARGINS.left + 55, yPos + 8);
    
    yPos += 30;
  });

  // Note importante
  yPos += 10;
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 25, 2, 2, 'F');
  doc.setDrawColor(...COLORS.warning);
  doc.setLineWidth(1);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 25, 2, 2, 'S');
  
  doc.setTextColor(...COLORS.warning);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Conseil', MARGINS.left + 5, yPos + 8);
  
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Imprimez cette page et affichez-la en back-office pour un suivi quotidien des actions.', MARGINS.left + 5, yPos + 18);

  addFooter(doc, pageNumber);

  // ========== PAGE 6: PRIORISATION DES ACTIONS ==========
  pageNumber = addNewPage(doc, pageNumber);
yPos = MARGINS.top;

yPos = addSectionTitle(doc, 'Priorisation des actions - Impact vs Effort', yPos, COLORS.warning);

// Sous-titre
doc.setFontSize(11);
doc.setFont('helvetica', 'italic');
doc.setTextColor(...COLORS.textLight);
doc.text('Classement des actions par impact attendu et effort estime', MARGINS.left, yPos);
yPos += 12;

// Actions prioritaires
const prioritizedActions: Array<{ action: string; impact: string; effort: string; impactColor: [number, number, number]; impactBg: [number, number, number] }> = [];

const mainIssueAction = (data.topIssues && data.topIssues.length > 0)
  ? `Corriger le principal point de friction : "${data.topIssues[0].theme || data.topIssues[0].issue}"`
  : 'Corriger le principal point de friction identifie';
prioritizedActions.push({
  action: mainIssueAction,
  impact: 'Eleve',
  effort: 'Moyen',
  impactColor: [22, 163, 74],
  impactBg: [220, 252, 231]
});

prioritizedActions.push({
  action: 'Former l\'equipe sur les points d\'amelioration',
  impact: 'Moyen',
  effort: 'Faible',
  impactColor: [180, 83, 9],
  impactBg: [254, 249, 195]
});

prioritizedActions.push({
  action: 'Repondre systematiquement aux avis clients',
  impact: 'Moyen',
  effort: 'Faible',
  impactColor: [180, 83, 9],
  impactBg: [254, 249, 195]
});

const strengthAction = (data.topStrengths && data.topStrengths.length > 0)
  ? `Valoriser le point fort : "${data.topStrengths[0].theme || data.topStrengths[0].strength}"`
  : 'Valoriser les points forts identifies';
prioritizedActions.push({
  action: strengthAction,
  impact: 'Moyen',
  effort: 'Faible',
  impactColor: [180, 83, 9],
  impactBg: [254, 249, 195]
});

const tableX = MARGINS.left;
const tableWidth = CONTENT_WIDTH;
const actionLabelWidth = 95;
const impactLabelWidth = 35;
const effortLabelWidth = tableWidth - actionLabelWidth - impactLabelWidth;
const rowPaddingX = 4;
const rowPaddingY = 3;
const actionTextX = tableX + 12;
const actionTextWidth = actionLabelWidth - 14;
const impactX = tableX + actionLabelWidth;
const effortX = impactX + impactLabelWidth;
const lineHeight = 4.2;
const headerHeight = 10;

// Blue primary color for table border & header
// const BLUE_PRIMARY: [number, number, number] = [37, 99, 235];
// const BLUE_LIGHT: [number, number, number] = [191, 219, 254];
const ROW_ALT: [number, number, number] = [239, 246, 255];

// Outer table border (draw first, behind everything)
doc.setDrawColor(...BLUE_PRIMARY);
doc.setLineWidth(0.6);
doc.roundedRect(tableX, yPos, tableWidth, headerHeight, 1, 1, 'FD');

// Header fill
doc.setFillColor(...BLUE_PRIMARY);
doc.roundedRect(tableX, yPos, tableWidth, headerHeight, 1, 1, 'F');

// Header column dividers (white semi-transparent approximated as light blue)
doc.setDrawColor(255, 255, 255);
doc.setLineWidth(0.4);
doc.line(impactX, yPos + 1, impactX, yPos + headerHeight - 1);
doc.line(effortX, yPos + 1, effortX, yPos + headerHeight - 1);

// Header text
doc.setTextColor(255, 255, 255);
doc.setFontSize(9);
doc.setFont('helvetica', 'bold');
doc.text('Action', tableX + rowPaddingX, yPos + 6.5);
doc.text('Impact', impactX + impactLabelWidth / 2, yPos + 6.5, { align: 'center' });
doc.text('Effort', effortX + effortLabelWidth / 2, yPos + 6.5, { align: 'center' });
yPos += headerHeight;

// Track total rows height for outer border
const rowStartY = yPos;

// Rows
prioritizedActions.forEach((item, idx) => {
  const bgColor = idx % 2 === 0 ? ROW_ALT : [255, 255, 255] as [number, number, number];
  doc.setFillColor(...bgColor);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const actionLines = doc.splitTextToSize(item.action, actionTextWidth);
  const rowHeight = Math.max(13, rowPaddingY * 2 + actionLines.length * lineHeight);

  // Row background (no stroke here — outer border drawn separately)
  doc.rect(tableX, yPos, tableWidth, rowHeight, 'F');

  // Row bottom divider
  doc.setDrawColor(...BLUE_LIGHT);
  doc.setLineWidth(0.3);
  doc.line(tableX, yPos + rowHeight, tableX + tableWidth, yPos + rowHeight);

  // Column dividers (blue light)
  doc.line(impactX, yPos, impactX, yPos + rowHeight);
  doc.line(effortX, yPos, effortX, yPos + rowHeight);

  // Row number
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text(`${idx + 1}.`, tableX + rowPaddingX, yPos + rowPaddingY + 3);

  // Action text
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'normal');
  actionLines.forEach((line: string, lineIdx: number) => {
    doc.text(line, actionTextX, yPos + rowPaddingY + 3 + lineIdx * lineHeight);
  });

  // Impact badge background
  const badgeW = 20;
  const badgeH = 5.5;
  const badgeX = impactX + (impactLabelWidth - badgeW) / 2;
  const badgeY = yPos + (rowHeight - badgeH) / 2;
  doc.setFillColor(...item.impactBg);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1, 1, 'F');
  doc.setTextColor(...item.impactColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(item.impact, impactX + impactLabelWidth / 2, badgeY + 4, { align: 'center' });

  // Effort text
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textLight);
  doc.setFont('helvetica', 'normal');
  doc.text(item.effort, effortX + effortLabelWidth / 2, yPos + rowHeight / 2 + 1.5, { align: 'center' });

  yPos += rowHeight;
});

// Outer border around all rows (blue, matching header)
doc.setDrawColor(...BLUE_PRIMARY);
doc.setLineWidth(0.6);
doc.rect(tableX, rowStartY, tableWidth, yPos - rowStartY, 'S');

// Bottom-left and bottom-right rounded corners via clipping workaround:
// Draw a final rounded rect outline over the whole table
doc.setDrawColor(...BLUE_PRIMARY);
doc.setLineWidth(0.6);
doc.roundedRect(tableX, rowStartY - headerHeight, tableWidth, yPos - rowStartY + headerHeight, 1, 1, 'S');

// Recommandation box
yPos += 8;
doc.setFillColor(255, 251, 235);
doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 22, 2, 2, 'F');
doc.setDrawColor(...COLORS.warning);
doc.setLineWidth(0.8);
doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 22, 2, 2, 'S');

doc.setTextColor(...COLORS.warning);
doc.setFontSize(9);
doc.setFont('helvetica', 'bold');
doc.text('Recommandation', MARGINS.left + 5, yPos + 7);

doc.setTextColor(...COLORS.text);
doc.setFontSize(8.5);
doc.setFont('helvetica', 'normal');
const prioConclusion = 'Il est recommande de commencer par les actions a fort impact et faible effort afin d\'obtenir des resultats rapides et mesurables.';
const prioLines = doc.splitTextToSize(prioConclusion, CONTENT_WIDTH - 10);
doc.text(prioLines, MARGINS.left + 5, yPos + 14);

addFooter(doc, pageNumber);

  // ========== PAGE 6: CONCLUSION STRATEGIQUE - ANALYSE IA ==========
  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;

  yPos = addSectionTitle(doc, 'Conclusion strategique - Analyse IA', yPos, COLORS.primary);

  // Generation de la conclusion strategique detaillee
  const strategicConclusion = generateStrategicConclusion(data);

  // Afficher la conclusion
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 200, 3, 3, 'F');

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const conclusionLines = doc.splitTextToSize(strategicConclusion, CONTENT_WIDTH - 15);
  let currentY = yPos + 10;
  
  conclusionLines.forEach((line: string) => {
    if (currentY > yPos + 190) return;
    
    // Mettre en gras les titres de section
    if (line.includes('1. Resume') || line.includes('2. Coherence') || line.includes('3. Consequences') || line.includes('4. Opportunites') || line.includes('5. Vision')) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primary);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.text);
    }
    
    doc.text(line, MARGINS.left + 7, currentY);
    currentY += 5.5;
  });

  // Signature IA
  yPos += 210;
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 20, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Cette analyse a ete generee automatiquement par l\'intelligence artificielle de Reviewsvisor', PAGE_WIDTH / 2, yPos + 8, { align: 'center' });
  doc.text('basee sur l\'ensemble des avis clients de votre etablissement.', PAGE_WIDTH / 2, yPos + 14, { align: 'center' });

  addFooter(doc, pageNumber);

  // ========== PAGE 7: PLAN D'ACTION OPERATIONNEL - AFFICHE EQUIPE ==========
  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;

  // EN-TETE GRAND ET CENTRE
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_WIDTH, 55, 'F');

  // Titre de la page
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PLAN D\'ACTION OPERATIONNEL', PAGE_WIDTH / 2, 18, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('OBJECTIFS & CHECKLIST EQUIPE', PAGE_WIDTH / 2, 28, { align: 'center' });

  // Nom de l'etablissement
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  const displayName = truncateText(data.establishmentName, 45);
  doc.text(displayName, PAGE_WIDTH / 2, 40, { align: 'center' });

  // Date
  const reportDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.setFontSize(10);
  doc.text(reportDate, PAGE_WIDTH / 2, 50, { align: 'center' });

  yPos = 65;

  // Phrase inspirante
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 12, 2, 2, 'F');
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('"Notre objectif : offrir une experience client irreprochable, chaque jour."', PAGE_WIDTH / 2, yPos + 8, { align: 'center' });

  yPos += 20;

  // SECTION: OBJECTIFS PRIORITAIRES
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('OBJECTIFS PRIORITAIRES', MARGINS.left + 5, yPos + 5.5);
  yPos += 12;

  // Generer les objectifs dynamiquement
  const objectives: Array<{ title: string; why: string; indicator: string }> = [];

  // Objectif 1: Base sur le principal probleme
  if (data.topIssues && data.topIssues.length > 0) {
    const mainIssue = data.topIssues[0].theme || data.topIssues[0].issue || 'service';
    objectives.push({
      title: `Ameliorer : ${truncateText(mainIssue, 25)}`,
      why: 'C\'est le point le plus cite par vos clients',
      indicator: 'Reduire les mentions negatives de 50%'
    });
  } else {
    objectives.push({
      title: 'Maintenir l\'excellence',
      why: 'Vos clients sont satisfaits',
      indicator: 'Garder une note > 4.5/5'
    });
  }

  // Objectif 2: Base sur la note
  if (data.avgRating < 4) {
    objectives.push({
      title: 'Augmenter la note globale',
      why: `Note actuelle : ${data.avgRating.toFixed(1)}/5`,
      indicator: `Objectif : ${Math.min(5, data.avgRating + 0.5).toFixed(1)}/5 en 3 mois`
    });
  } else {
    objectives.push({
      title: 'Fideliser les clients',
      why: 'Transformer les satisfaits en ambassadeurs',
      indicator: '+20% d\'avis 5 etoiles'
    });
  }

  // Objectif 3: Avis
  objectives.push({
    title: 'Collecter plus d\'avis',
    why: 'Plus d\'avis = meilleure visibilite',
    indicator: '+5 avis/semaine minimum'
  });

  // Afficher les objectifs en 3 colonnes
  const colWidth = (CONTENT_WIDTH - 10) / 3;
  objectives.slice(0, 3).forEach((obj, idx) => {
    const colX = MARGINS.left + (idx * (colWidth + 5));
    
    // Carte objectif
    doc.setFillColor(...COLORS.background);
    doc.roundedRect(colX, yPos, colWidth, 35, 2, 2, 'F');
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.roundedRect(colX, yPos, colWidth, 35, 2, 2, 'S');

    // Icone objectif
    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Objectif ${idx + 1}`, colX + colWidth / 2, yPos + 8, { align: 'center' });

    // Titre
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(obj.title, colWidth - 6);
    doc.text(titleLines[0], colX + 3, yPos + 16);

    // Indicateur
    doc.setTextColor(...COLORS.success);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const indLines = doc.splitTextToSize(obj.indicator, colWidth - 6);
    doc.text(indLines[0], colX + 3, yPos + 30);
  });

  yPos += 42;

  // SECTION: CHECKLIST OPERATIONNELLE
  doc.setFillColor(...COLORS.success);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CHECKLIST OPERATIONNELLE QUOTIDIENNE', MARGINS.left + 5, yPos + 5.5);
  yPos += 12;

  // Generer la checklist dynamiquement
  const checklistActions: string[] = [
    'Accueillir chaque client dans les 30 secondes',
    'Verifier la proprete des espaces a chaque rotation',
    'S\'assurer de la conformite des produits avant service',
    'Etre attentif aux signaux de mecontentement',
  ];

  // Ajouter des actions specifiques basees sur les problemes
  if (data.topIssues && data.topIssues.length > 0) {
    const issue1 = data.topIssues[0].theme || data.topIssues[0].issue;
    if (issue1 && issue1.toLowerCase().includes('attente')) {
      checklistActions.push('Optimiser le temps d\'attente (max 10 min)');
    } else if (issue1 && issue1.toLowerCase().includes('accueil')) {
      checklistActions.push('Sourire et saluer chaque client a l\'entree');
    } else if (issue1 && issue1.toLowerCase().includes('qualite')) {
      checklistActions.push('Controler la qualite avant chaque envoi');
    } else {
      checklistActions.push(`Porter attention particuliere a : ${truncateText(issue1, 30)}`);
    }
  }

  checklistActions.push('Demander un feedback en fin de visite');
  checklistActions.push('Inviter poliment a laisser un avis Google');
  checklistActions.push('Noter les remarques clients dans le cahier');

  // Afficher la checklist sur 2 colonnes
  const halfColWidth = (CONTENT_WIDTH - 5) / 2;
  const halfItems = Math.ceil(checklistActions.slice(0, 8).length / 2);
  
  checklistActions.slice(0, 8).forEach((action, idx) => {
    const isLeftCol = idx < halfItems;
    const colX = isLeftCol ? MARGINS.left : MARGINS.left + halfColWidth + 5;
    const rowIdx = isLeftCol ? idx : idx - halfItems;
    const itemY = yPos + (rowIdx * 12);

    // Case a cocher
    doc.setDrawColor(...COLORS.textLight);
    doc.setLineWidth(0.3);
    doc.rect(colX, itemY, 4, 4, 'S');

    // Texte de l'action avec retour à la ligne automatique
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    // Utiliser splitTextToSize pour permettre le retour à la ligne
    const textWidth = halfColWidth - 10; // Largeur disponible pour le texte
    const actionLines = doc.splitTextToSize(action, textWidth);
    doc.text(actionLines, colX + 6, itemY + 3);
  });

  // Calculer la hauteur réelle nécessaire en fonction du nombre de lignes
  const maxLines = Math.max(...checklistActions.slice(0, 8).map(action => {
    const textWidth = (CONTENT_WIDTH - 5) / 2 - 10;
    return doc.splitTextToSize(action, textWidth).length;
  }));
  yPos += (halfItems * 12) + (maxLines > 1 ? (maxLines - 1) * 4 : 0) + 5;

  // SECTION: RITUELS D'EQUIPE
  doc.setFillColor(...COLORS.warning);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RITUELS D\'EQUIPE', MARGINS.left + 5, yPos + 5.5);
  yPos += 10;

  const rituals = [
    { icon: '1', text: 'Brief d\'equipe quotidien (2 min avant service)' },
    { icon: '2', text: 'Debriefing rapide en fin de service' },
    { icon: '3', text: 'Lecture des derniers avis 1x/semaine' },
  ];

  doc.setFillColor(...COLORS.background);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 20, 2, 2, 'F');

  const ritualsBoxTop = yPos;
  const ritualTextStartY = ritualsBoxTop + 13; // hauteur réduite
  
  // Calculer la largeur de chaque colonne (égale pour les 3)
  const columnWidth = CONTENT_WIDTH / 3;

  rituals.forEach((ritual, idx) => {
    // Centrer chaque élément dans sa colonne
    const ritualX = MARGINS.left + (idx + 0.5) * columnWidth;

    // Cercle bleu centré dans sa colonne
    doc.setFillColor(...COLORS.primary);
    doc.circle(ritualX, ritualsBoxTop + 6, 3.5, 'F');
    
    // Numéro dans le cercle (centré)
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(ritual.icon, ritualX, ritualsBoxTop + 7.5, { align: 'center', baseline: 'middle' });

    // Texte centré sous le cercle
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');

    // Largeur du texte = 80% de la largeur de colonne pour éviter les débordements
    const textWidth = columnWidth * 0.8;
    const ritualLines = doc.splitTextToSize(ritual.text, textWidth);
    doc.text(ritualLines, ritualX, ritualTextStartY, { align: 'center' });
  });

  yPos += 23;

  // SECTION: ENGAGEMENT EQUIPE
  doc.setFillColor(...COLORS.secondary);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ENGAGEMENT EQUIPE', MARGINS.left + 5, yPos + 5.5);
  yPos += 10;

  // Zone d'engagement - hauteur réduite pour tenir sur la page
  doc.setFillColor(...COLORS.white);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 45, 2, 2, 'F');
  doc.setDrawColor(...COLORS.textLight);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 45, 2, 2, 'S');

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('"Nous nous engageons a appliquer ces actions au quotidien."', PAGE_WIDTH / 2, yPos + 12, { align: 'center' });

  // Lignes de signature - organisées verticalement
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // Responsable
  doc.text('Responsable : ______________________________', MARGINS.left + 10, yPos + 26);
  
  // Date
  doc.text('Date : ______________', MARGINS.left + 10, yPos + 36);

  // Pas de footer pour cette page (page 8) pour gagner de la place

  // Generer le nom du fichier
  const sanitizedName = data.establishmentName
    .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Rapport_Analyse_Avis_${sanitizedName}_${dateStr}.pdf`;

  // Telecharger automatiquement
  doc.save(filename);
}

function generateStrategicConclusion(data: ReportData): string {
  const parts: string[] = [];
  
  // 1. Resume global de la perception client
  parts.push('1. Resume global de la perception client');
  parts.push('');
  if (data.avgRating >= 4.5) {
    parts.push(`Votre etablissement "${data.establishmentName}" beneficie d'une excellente reputation aupres de vos clients. Avec une note moyenne de ${data.avgRating.toFixed(1)}/5 basee sur ${data.totalReviews} avis, vous vous situez dans la categorie des etablissements les mieux notes. ${Math.round(data.positiveRatio * 100)}% de vos clients expriment une satisfaction elevee, ce qui temoigne d'une experience client de qualite constante.`);
  } else if (data.avgRating >= 3.5) {
    parts.push(`Votre etablissement "${data.establishmentName}" presente une perception client globalement positive mais perfectible. Avec une note de ${data.avgRating.toFixed(1)}/5 sur ${data.totalReviews} avis et ${Math.round(data.positiveRatio * 100)}% d'avis positifs, vous disposez d'une base solide sur laquelle construire des ameliorations significatives.`);
  } else {
    parts.push(`Votre etablissement "${data.establishmentName}" fait face a des defis importants en matiere de satisfaction client. La note actuelle de ${data.avgRating.toFixed(1)}/5 sur ${data.totalReviews} avis indique des axes d'amelioration prioritaires a adresser rapidement pour redresser la perception client.`);
  }
  parts.push('');
  
  // 2. Analyse de la coherence entre points forts et points faibles
  parts.push('2. Coherence entre points forts et points faibles');
  parts.push('');
  if (data.topStrengths && data.topStrengths.length > 0 && data.topIssues && data.topIssues.length > 0) {
    const strengthsList = data.topStrengths.slice(0, 2).map(s => s.theme || s.strength).filter(Boolean).join(', ');
    const issuesList = data.topIssues.slice(0, 2).map(i => i.theme || i.issue).filter(Boolean).join(', ');
    parts.push(`L'analyse revele une dichotomie interessante : vos points forts (${strengthsList}) sont reconnus par vos clients, tandis que les axes d'amelioration (${issuesList}) constituent des freins a une satisfaction complete. Cette situation suggere un potentiel d'amelioration rapide si les problemes identifies sont traites de maniere ciblee.`);
  } else if (data.topStrengths && data.topStrengths.length > 0) {
    const strengthsList = data.topStrengths.slice(0, 2).map(s => s.theme || s.strength).filter(Boolean).join(', ');
    parts.push(`Vos points forts (${strengthsList}) sont clairement identifies par vos clients. L'absence de problemes majeurs recurrents est un signal positif de maitrise operationnelle.`);
  } else if (data.topIssues && data.topIssues.length > 0) {
    const issuesList = data.topIssues.slice(0, 2).map(i => i.theme || i.issue).filter(Boolean).join(', ');
    parts.push(`Les points d'amelioration identifies (${issuesList}) meritent une attention immediate. La resolution de ces problemes devrait avoir un impact direct et mesurable sur votre note globale.`);
  }
  parts.push('');
  
  // 3. Consequences potentielles si les points de friction ne sont pas traites
  parts.push('3. Consequences potentielles si les points de friction ne sont pas traites');
  parts.push('');
  if (data.topIssues && data.topIssues.length > 0 && data.avgRating < 4.5) {
    parts.push(`Sans action corrective sur les problemes identifies, plusieurs risques sont a anticiper : erosion progressive de la note moyenne, perte de competitivite face aux etablissements mieux notes, difficulte a attirer de nouveaux clients qui consultent les avis avant de choisir, et potentielle demotivation des equipes face aux retours negatifs recurrents. A moyen terme, ces facteurs peuvent impacter significativement le chiffre d'affaires.`);
  } else {
    parts.push(`Votre situation actuelle est favorable. Le risque principal reside dans la complaisance : le maintien de l'excellence requiert une vigilance constante et une capacite d'adaptation aux attentes evoluant de vos clients.`);
  }
  parts.push('');
  
  // 4. Opportunites concretes d'amelioration a court et moyen terme
  parts.push('4. Opportunites d\'amelioration a court et moyen terme');
  parts.push('');
  const opportunities: string[] = [];
  if (data.topIssues && data.topIssues.length > 0) {
    const mainIssue = data.topIssues[0].theme || data.topIssues[0].issue;
    opportunities.push(`Court terme : Concentrer les efforts sur "${mainIssue}" avec un plan d'action dedie`);
  }
  if (data.topStrengths && data.topStrengths.length > 0) {
    const mainStrength = data.topStrengths[0].theme || data.topStrengths[0].strength;
    opportunities.push(`Moyen terme : Capitaliser sur "${mainStrength}" en l'integrant dans votre communication et votre strategie de differenciation`);
  }
  opportunities.push('Formation continue des equipes sur les standards de qualite identifies');
  opportunities.push('Mise en place d\'un processus de reponse systematique aux avis pour montrer l\'engagement');
  parts.push(opportunities.join('. ') + '.');
  parts.push('');
  
  // 5. Vision projetee de l'evolution
  parts.push('5. Vision projetee si les actions recommandees sont mises en place');
  parts.push('');
  if (data.avgRating >= 4.5) {
    parts.push(`En maintenant votre niveau d'excellence et en restant attentif aux nouvelles attentes, votre etablissement peut consolider sa position de leader sur votre marche. L'objectif est de transformer vos clients satisfaits en ambassadeurs actifs de votre marque.`);
  } else if (data.avgRating >= 3.5) {
    parts.push(`Avec une execution rigoureuse des actions recommandees, une amelioration de 0.3 a 0.5 point sur votre note moyenne est realiste dans les 3 a 6 prochains mois. Cela vous positionnerait favorablement face a la concurrence et devrait se traduire par une augmentation de la frequentation.`);
  } else {
    parts.push(`Un plan d'action structure sur les problemes prioritaires peut permettre un redressement significatif de votre note en 6 a 12 mois. L'objectif initial devrait etre d'atteindre une note superieure a 3.5/5, seuil a partir duquel la perception client change positivement.`);
  }
  
  return parts.join('\n');
}
