import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFPage,
  type PDFFont,
  type RGB,
} from "https://esm.sh/pdf-lib@1.17.1";

interface MonthlyReportData {
  firstName?: string;
  lastName?: string;
  establishmentName: string;
  reportMonthName: string;
  previousMonthName: string;
  reportMonthKey?: string;
  previousMonthKey?: string;
  currentMonth: {
    avgRating: number;
    totalReviews: number;
    positiveReviews: number;
    negativeReviews: number;
    responsesSent: number;
    responseRate: number;
    topPositives: string[];
    topNegatives: string[];
  };
  previousMonth: {
    avgRating: number;
    totalReviews: number;
    positiveReviews: number;
    negativeReviews: number;
  };
  recommendations: string[];
}

export type MonthlyReportLanguage = "fr" | "en";

type MonthlyReportPdfCopy = {
  reportTitle: string;
  subtitle: string;
  greeting: (name: string | null) => string;
  reportIntroPrefix: string;
  reportIntroSuffix: string;
  scoreTitle: string;
  scoreSubtitle: (previousMonthName: string, reportMonthName: string) => string;
  changeLabel: string;
  positiveReviews: string;
  negativeReviews: string;
  kpiTitle: string;
  kpiSubtitle: string;
  reviewsReceived: string;
  responsesSent: string;
  responseRate: string;
  ratingEvolution: string;
  customerFeedbackTitle: string;
  customerFeedbackSubtitle: string;
  positives: string;
  improvements: string;
  noPositives: string;
  noNegatives: string;
  recommendations: string;
  recommendationsSubtitle: string;
  noRecommendations: string;
  footer: string;
};

const PDF_COPY: Record<MonthlyReportLanguage, MonthlyReportPdfCopy> = {
  fr: {
    reportTitle: "Rapport Mensuel",
    subtitle: "Rapport mensuel des avis clients",
    greeting: (name) => `Bonjour${name ? ` ${name}` : ""},`,
    reportIntroPrefix: "Voici votre rapport mensuel pour ",
    reportIntroSuffix:
      ". Découvrez l'évolution de votre réputation en ligne et les actions à mettre en place.",
    scoreTitle: "Évolution de la note",
    scoreSubtitle: (previousMonthName, reportMonthName) =>
      `Evolution entre ${previousMonthName} et ${reportMonthName}`,
    changeLabel: "Évolution",
    positiveReviews: "Avis positifs",
    negativeReviews: "Avis negatifs",
    kpiTitle: "Actions réalisées ce mois",
    kpiSubtitle: "",
    reviewsReceived: "Avis recus",
    responsesSent: "Reponses envoyees",
    responseRate: "Taux de reponse",
    ratingEvolution: "Evolution de la note",
    customerFeedbackTitle: "Résumé des avis",
    customerFeedbackSubtitle: "",
    positives: "Points positifs",
    improvements: "Points a ameliorer",
    noPositives: "Aucun point positif identifie ce mois",
    noNegatives: "Aucun point negatif identifie ce mois",
    recommendations: "Recommandations pour le mois prochain",
    recommendationsSubtitle: "",
    noRecommendations:
      "Continuez vos efforts pour maintenir votre excellente reputation",
    footer: "Rapport genere automatiquement par Reviewsvisor",
  },
  en: {
    reportTitle: "Monthly Report",
    subtitle: "Monthly customer review report",
    greeting: (name) => `Hello${name ? ` ${name}` : ""},`,
    reportIntroPrefix: "Here is your monthly report for ",
    reportIntroSuffix:
      ". Discover how your online reputation is evolving and the actions to put in place.",
    scoreTitle: "Rating Change",
    scoreSubtitle: (previousMonthName, reportMonthName) =>
      `Evolution between ${previousMonthName} and ${reportMonthName}`,
    changeLabel: "Change",
    positiveReviews: "Positive reviews",
    negativeReviews: "Negative reviews",
    kpiTitle: "Actions Taken This Month",
    kpiSubtitle: "",
    reviewsReceived: "Reviews received",
    responsesSent: "Responses sent",
    responseRate: "Response rate",
    ratingEvolution: "Rating evolution",
    customerFeedbackTitle: "Review Summary",
    customerFeedbackSubtitle: "",
    positives: "Positive points",
    improvements: "Points to improve",
    noPositives: "No positive points identified this month",
    noNegatives: "No negative points identified this month",
    recommendations: "Recommendations for Next Month",
    recommendationsSubtitle: "",
    noRecommendations: "Keep up the good work to maintain your reputation",
    footer: "Report generated automatically by Reviewsvisor",
  },
};

const PAGE = {
  width: 595,
  height: 842,
  margin: 44,
  footerY: 16,
};

const COLORS = {
  primary: rgb(0.15, 0.39, 0.92),
  secondary: rgb(0.22, 0.25, 0.32),
  success: rgb(0.09, 0.64, 0.29),
  warning: rgb(0.92, 0.7, 0.03),
  danger: rgb(0.86, 0.15, 0.15),
  text: rgb(0.12, 0.16, 0.22),
  textMuted: rgb(0.42, 0.45, 0.51),
  background: rgb(0.97, 0.98, 0.99),
  border: rgb(0.9, 0.92, 0.95),
  white: rgb(1, 1, 1),
  gold: rgb(0.96, 0.62, 0.04),
};

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
      }
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [text];
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}

function formatMonthName(
  monthKey: string | undefined,
  fallback: string,
  language: MonthlyReportLanguage,
): string {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
    return fallback;
  }

  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(
    language === "en" ? "en-US" : "fr-FR",
    {
      month: "long",
      year: "numeric",
    },
  );
}

function getUserDisplayName(data: MonthlyReportData): string | null {
  const fullName = [data.firstName, data.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  return fullName || null;
}

function getLocalizedRecommendations(
  data: MonthlyReportData,
  language: MonthlyReportLanguage,
): string[] {
  const recommendations: string[] = [];
  const { responseRate, negativeReviews, avgRating } = data.currentMonth;

  if (responseRate < 50) {
    recommendations.push(
      language === "en"
        ? `Respond to more customer reviews (current rate: ${responseRate}%)`
        : `Repondez a plus d'avis clients (taux actuel: ${responseRate}%)`,
    );
  }

  if (negativeReviews > 0) {
    recommendations.push(
      language === "en"
        ? `Focus on resolving the ${negativeReviews} negative reviews received this month`
        : `Concentrez-vous sur la resolution des ${negativeReviews} avis negatifs recus ce mois`,
    );
  }

  if (avgRating < 4.0) {
    recommendations.push(
      language === "en"
        ? `Work on improving your average rating (currently ${avgRating.toFixed(1)}/5)`
        : `Travaillez a ameliorer votre note moyenne (actuellement ${avgRating.toFixed(1)}/5)`,
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(copyNoRecommendation(language));
  }

  return recommendations;
}

function copyNoRecommendation(language: MonthlyReportLanguage): string {
  return language === "en"
    ? PDF_COPY.en.noRecommendations
    : PDF_COPY.fr.noRecommendations;
}

function drawTextCentered(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  y: number,
  color: RGB,
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (PAGE.width - width) / 2,
    y,
    size,
    font,
    color,
  });
}

function drawParagraph(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  x: number,
  y: number,
  maxWidth: number,
  color: RGB = COLORS.text,
  lineHeight = 16,
): number {
  const lines = wrapText(text, font, size, maxWidth);
  let nextY = y;

  for (const line of lines) {
    page.drawText(line, { x, y: nextY, size, font, color });
    nextY -= lineHeight;
  }

  return nextY;
}

function drawInlineParagraph(
  page: PDFPage,
  segments: Array<{ text: string; font: PDFFont }>,
  size: number,
  x: number,
  y: number,
  maxWidth: number,
  color: RGB = COLORS.text,
  lineHeight = 16,
): number {
  let cursorX = x;
  let cursorY = y;
  let isLineStart = true;

  for (const segment of segments) {
    const words = segment.text.match(/\s*\S+\s*/g) || [];

    for (let index = 0; index < words.length; index += 1) {
      const word = words[index];
      const wordWidth = segment.font.widthOfTextAtSize(word, size);

      if (!isLineStart && cursorX + wordWidth > x + maxWidth) {
        cursorX = x;
        cursorY -= lineHeight;
        isLineStart = true;
      }

      page.drawText(word, {
        x: cursorX,
        y: cursorY,
        size,
        font: segment.font,
        color,
      });
      cursorX += wordWidth;
      isLineStart = false;
    }
  }

  return cursorY - lineHeight;
}

function drawFooter(
  page: PDFPage,
  regular: PDFFont,
  pageNumber: number,
  totalPages: number,
  copy: MonthlyReportPdfCopy,
) {
  page.drawText(copy.footer, {
    x: PAGE.margin,
    y: PAGE.footerY,
    size: 8,
    font: regular,
    color: COLORS.textMuted,
  });

  const label = `Page ${pageNumber}/${totalPages}`;
  page.drawText(label, {
    x: PAGE.width - PAGE.margin - regular.widthOfTextAtSize(label, 8),
    y: PAGE.footerY,
    size: 8,
    font: regular,
    color: COLORS.textMuted,
  });
}

function addSectionTitle(
  page: PDFPage,
  title: string,
  subtitle: string,
  y: number,
  bold: PDFFont,
  regular: PDFFont,
  accent: RGB = COLORS.primary,
): number {
  page.drawRectangle({
    x: PAGE.margin,
    y: y - 3,
    width: 5,
    height: 18,
    color: accent,
  });

  page.drawText(title, {
    x: PAGE.margin + 12,
    y,
    size: 17,
    font: bold,
    color: COLORS.text,
  });

  page.drawText(subtitle, {
    x: PAGE.margin + 12,
    y: y - 14,
    size: 10,
    font: regular,
    color: COLORS.textMuted,
  });

  return y - 34;
}

function fitFontSize(
  text: string,
  font: PDFFont,
  initialSize: number,
  maxWidth: number,
  minSize: number,
): number {
  let size = initialSize;

  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 1;
  }

  return size;
}

function getRatingStatus(
  diff: number,
  language: MonthlyReportLanguage,
): string {
  if (diff >= 0.5) {
    return language === "en" ? "Incredible" : "Incroyable";
  }

  if (diff >= 0.2) {
    return language === "en" ? "Excellent" : "Excellent";
  }

  if (diff > 0) {
    return language === "en" ? "Improved" : "Amélioration";
  }

  if (diff === 0) {
    return language === "en" ? "Stable" : "Stable";
  }

  return language === "en"
    ? "Needs Attention"
    : "À améliorer";
}

function drawCoverMetricBox(
  page: PDFPage,
  x: number,
  topY: number,
  width: number,
  height: number,
  title: string,
  value: string,
  bold: PDFFont,
  valueColor: RGB,
) {
  drawCard(page, x, topY - height, width, height, COLORS.white, valueColor);

  const innerPadding = 12;
  const innerWidth = width - innerPadding * 2;
  const titleSize = fitFontSize(title, bold, 10, innerWidth, 8);
  const valueSize = fitFontSize(value, bold, 20, innerWidth, 13);

  page.drawText(title, {
    x: x + (width - bold.widthOfTextAtSize(title, titleSize)) / 2,
    y: topY - 28,
    size: titleSize,
    font: bold,
    color: COLORS.text,
  });

  page.drawText(value, {
    x: x + (width - bold.widthOfTextAtSize(value, valueSize)) / 2,
    y: topY - 58,
    size: valueSize,
    font: bold,
    color: valueColor,
  });
}

function drawRatingChangeBlock(
  page: PDFPage,
  topY: number,
  previousMonthName: string,
  reportMonthName: string,
  previousRating: number,
  currentRating: number,
  language: MonthlyReportLanguage,
  copy: MonthlyReportPdfCopy,
  bold: PDFFont,
  regular: PDFFont,
): number {
  const width = PAGE.width - PAGE.margin * 2;
  const height = 220;

  drawCard(
    page,
    PAGE.margin,
    topY - height,
    width,
    height,
    COLORS.background,
    COLORS.primary,
  );

  const diff = currentRating - previousRating;

  const diffLabel =
    diff >= 0
      ? `+${diff.toFixed(1)}`
      : diff.toFixed(1);

  const status = getRatingStatus(diff, language);
  const leftScore = `${previousRating.toFixed(1)}/5`;
  const rightScore = `${currentRating.toFixed(1)}/5`;

  const centerX = PAGE.margin + width / 2;

  const leftScoreX = centerX - 170;
  const rightScoreX = centerX + 60;
  const arrowX = centerX - 25;

  page.drawText(
    `${language === "en" ? "Rating" : "Note"} ${previousMonthName}`,
    {
      x: leftScoreX,
      y: topY - 35,
      size: 12,
      font: regular,
      color: COLORS.textMuted,
    },
  );

  page.drawText(
    `${language === "en" ? "Rating" : "Note"} ${reportMonthName}`,
    {
      x: rightScoreX,
      y: topY - 35,
      size: 12,
      font: regular,
      color: COLORS.textMuted,
    },
  );

  page.drawText(leftScore, {
    x: leftScoreX,
    y: topY - 80,
    size: 32,
    font: bold,
    color: COLORS.text,
  });

  page.drawText("=>", {
    x: arrowX,
    y: topY - 70,
    size: 28,
    font: bold,
    color: COLORS.textMuted,
  });

  page.drawText(rightScore, {
    x: rightScoreX,
    y: topY - 80,
    size: 32,
    font: bold,
    color: COLORS.text,
  });

  page.drawLine({
    start: { x: PAGE.margin + 20, y: topY - 105 },
    end: { x: PAGE.width - PAGE.margin - 20, y: topY - 105 },
    thickness: 1,
    color: COLORS.border,
  });

  page.drawText(copy.changeLabel, {
    x: PAGE.margin + 90,
    y: topY - 145,
    size: 16,
    font: regular,
    color: COLORS.textMuted,
  });

  page.drawText(diffLabel, {
    x: PAGE.margin + 90,
    y: topY - 190,
    size: 28,
    font: bold,
    color: diff >= 0 ? COLORS.success : COLORS.danger,
  });

  const statusWidth = bold.widthOfTextAtSize(status, 14);

  page.drawText(status, {
    x: PAGE.width - PAGE.margin - 120 - statusWidth,
    y: topY - 155,
    size: 14,
    font: bold,
    color: COLORS.primary,
  });

  return topY - height;
}

function drawCard(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: RGB,
  border = COLORS.border,
) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: fill,
    borderColor: border,
    borderWidth: 1,
  });
}

function drawBulletList(
  page: PDFPage,
  items: string[],
  x: number,
  y: number,
  width: number,
  regular: PDFFont,
  bulletColor: RGB,
  textColor: RGB = COLORS.text,
  lineHeight = 14,
): number {
  let nextY = y;

  for (const item of items) {
    page.drawText("•", {
      x,
      y: nextY,
      size: 11,
      font: regular,
      color: bulletColor,
    });

    nextY = drawParagraph(
      page,
      item,
      regular,
      11,
      x + 12,
      nextY,
      width - 12,
      textColor,
      lineHeight,
    );
    nextY -= 7;
  }

  return nextY;
}

function drawKpiSection(
  page: PDFPage,
  y: number,
  data: MonthlyReportData,
  ratingDiff: number,
  ratingDiffLabel: string,
  copy: MonthlyReportPdfCopy,
  bold: PDFFont,
): void {
  drawCard(
    page,
    PAGE.margin,
    y - 88,
    PAGE.width - PAGE.margin * 2,
    90,
    COLORS.background,
  );

  const infoX = PAGE.margin + 18;

  page.drawText(`${copy.reviewsReceived} : ${data.currentMonth.totalReviews}`, {
    x: infoX,
    y: y - 24,
    size: 12,
    font: bold,
    color: COLORS.text,
  });
  page.drawText(`${copy.responsesSent} : ${data.currentMonth.responsesSent}`, {
    x: infoX,
    y: y - 44,
    size: 12,
    font: bold,
    color: COLORS.text,
  });
  page.drawText(`${copy.responseRate} : ${data.currentMonth.responseRate}%`, {
    x: infoX,
    y: y - 64,
    size: 12,
    font: bold,
    color: COLORS.text,
  });
  page.drawText(`${copy.ratingEvolution} : ${ratingDiffLabel}`, {
    x: 322,
    y: y - 24,
    size: 12,
    font: bold,
    color: ratingDiff >= 0 ? COLORS.success : COLORS.danger,
  });
  page.drawText(`${copy.positiveReviews} : ${data.currentMonth.positiveReviews}`, {
    x: 322,
    y: y - 44,
    size: 12,
    font: bold,
    color: COLORS.success,
  });
  page.drawText(`${copy.negativeReviews} : ${data.currentMonth.negativeReviews}`, {
    x: 322,
    y: y - 64,
    size: 12,
    font: bold,
    color: COLORS.danger,
  });
}

export async function generateMonthlyReportPdf(
  data: MonthlyReportData,
  language: MonthlyReportLanguage = "fr",
): Promise<Uint8Array> {
  const copy = PDF_COPY[language] || PDF_COPY.fr;
  const pdfDoc = await PDFDocument.create();
  const coverPage = pdfDoc.addPage([PAGE.width, PAGE.height]);
  const pageTwo = pdfDoc.addPage([PAGE.width, PAGE.height]);

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const ratingDiff = data.currentMonth.avgRating - data.previousMonth.avgRating;
  const ratingDiffLabel =
    ratingDiff >= 0 ? `+${ratingDiff.toFixed(1)}` : ratingDiff.toFixed(1);
  const reportMonthName = formatMonthName(
    data.reportMonthKey,
    data.reportMonthName,
    language,
  );
  const previousMonthName = formatMonthName(
    data.previousMonthKey,
    data.previousMonthName,
    language,
  );
  const userDisplayName = getUserDisplayName(data);
  const recommendations = getLocalizedRecommendations(data, language);
  const generatedAt = new Date().toLocaleDateString(language === "en" ? "en-US" : "fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ── PAGE 1: COVER ──────────────────────────────────────────────────────────

  // Header banner
  coverPage.drawRectangle({
    x: 0,
    y: PAGE.height - 132,
    width: PAGE.width,
    height: 132,
    color: COLORS.primary,
  });

  drawTextCentered(
    coverPage,
    copy.reportTitle,
    bold,
    30,
    PAGE.height - 60,
    COLORS.white,
  );

  drawTextCentered(
    coverPage,
    `${reportMonthName}`,
    regular,
    15,
    PAGE.height - 88,
    COLORS.white,
  );

  // Greeting
  coverPage.drawRectangle({
    x: PAGE.margin,
    y: PAGE.height - 195,
    width: 5,
    height: 18,
    color: COLORS.primary,
  });
  coverPage.drawText(copy.greeting(userDisplayName), {
    x: PAGE.margin + 12,
    y: PAGE.height - 192,
    size: 17,
    font: bold,
    color: COLORS.text,
  });

  // Intro paragraph
  drawInlineParagraph(
    coverPage,
    [
      { text: copy.reportIntroPrefix, font: regular },
      { text: data.establishmentName, font: bold },
      { text: copy.reportIntroSuffix, font: regular },
    ],
    14,
    PAGE.margin,
    PAGE.height - 240,
    PAGE.width - PAGE.margin * 2,
    COLORS.text,
    20,
  );

  // ── Rating Change section ──
  let coverY = PAGE.height - 320;
  coverY = addSectionTitle(
    coverPage,
    copy.scoreTitle,
    copy.scoreSubtitle(previousMonthName, reportMonthName),
    coverY,
    bold,
    regular,
    COLORS.gold,
  );

  coverY = drawRatingChangeBlock(
    coverPage,
    coverY,
    previousMonthName,
    reportMonthName,
    data.previousMonth.avgRating,
    data.currentMonth.avgRating,
    language,
    copy,
    bold,
    regular,
  );

  // ── KPI/Actions Taken section
  let coverKpiY = coverY - 28;
  coverKpiY = addSectionTitle(
    coverPage,
    copy.kpiTitle,
    copy.kpiSubtitle,
    coverKpiY,
    bold,
    regular,
    COLORS.secondary,
  );

  drawKpiSection(
    coverPage,
    coverKpiY,
    data,
    ratingDiff,
    ratingDiffLabel,
    copy,
    bold,
  );

  // ── PAGE 2 ─────────────────────────────────────────────────────────────────

  let y = PAGE.height - 58;

  // Customer feedback section
  y = addSectionTitle(
    pageTwo,
    copy.customerFeedbackTitle,
    copy.customerFeedbackSubtitle,
    y,
    bold,
    regular,
    COLORS.primary,
  );

  const panelWidth = (PAGE.width - PAGE.margin * 2 - 16) / 2;
  const panelHeight = 138;
  const panelY = y - 138;

  drawCard(
    pageTwo,
    PAGE.margin,
    panelY,
    panelWidth,
    panelHeight,
    rgb(0.95, 0.99, 0.97),
    COLORS.success,
  );
  drawCard(
    pageTwo,
    PAGE.margin + panelWidth + 16,
    panelY,
    panelWidth,
    panelHeight,
    rgb(1, 0.96, 0.96),
    COLORS.danger,
  );

  pageTwo.drawText(copy.positives, {
    x: PAGE.margin + 16,
    y: panelY + 114,
    size: 14,
    font: bold,
    color: COLORS.success,
  });
  pageTwo.drawText(copy.improvements, {
    x: PAGE.margin + panelWidth + 32,
    y: panelY + 114,
    size: 14,
    font: bold,
    color: COLORS.danger,
  });

  drawBulletList(
    pageTwo,
    data.currentMonth.topPositives.length > 0
      ? data.currentMonth.topPositives.slice(0, 4)
      : [copy.noPositives],
    PAGE.margin + 16,
    panelY + 90,
    panelWidth - 24,
    regular,
    COLORS.success,
  );
  drawBulletList(
    pageTwo,
    data.currentMonth.topNegatives.length > 0
      ? data.currentMonth.topNegatives.slice(0, 4)
      : [copy.noNegatives],
    PAGE.margin + panelWidth + 32,
    panelY + 90,
    panelWidth - 24,
    regular,
    COLORS.danger,
  );

  // Recommendations section
  y = panelY - 28;
  y = addSectionTitle(
    pageTwo,
    copy.recommendations,
    copy.recommendationsSubtitle,
    y,
    bold,
    regular,
    COLORS.gold,
  );

  drawCard(
    pageTwo,
    PAGE.margin,
    y - 92,
    PAGE.width - PAGE.margin * 2,
    96,
    rgb(1, 0.98, 0.92),
    COLORS.gold,
  );

  drawBulletList(
    pageTwo,
    recommendations.slice(0, 4),
    PAGE.margin + 16,
    y - 24,
    PAGE.width - PAGE.margin * 2 - 24,
    regular,
    COLORS.gold,
  );

  // Footers on all pages
  const pages = pdfDoc.getPages();
  pages.forEach((page, index) => {
    drawFooter(page, regular, index + 1, pages.length, copy);
  });

  return pdfDoc.save();
}