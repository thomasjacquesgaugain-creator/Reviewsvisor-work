import jsPDF from 'jspdf';

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
  doc.text('Rapport généré automatiquement par Reviewsvisor', MARGINS.left, footerY);
  doc.text(`Page ${pageNumber}`, PAGE_WIDTH - MARGINS.right, footerY, { align: 'right' });
}

function addNewPage(doc: jsPDF, pageNumber: number): number {
  addFooter(doc, pageNumber);
  doc.addPage();
  return pageNumber + 1;
}

function getSentimentLabel(ratio: number): { label: string; color: [number, number, number] } {
  if (ratio >= 0.8) return { label: 'Très positif', color: COLORS.success };
  if (ratio >= 0.6) return { label: 'Positif', color: COLORS.success };
  if (ratio >= 0.4) return { label: 'Neutre', color: COLORS.warning };
  if (ratio >= 0.2) return { label: 'Négatif', color: COLORS.danger };
  return { label: 'Très négatif', color: COLORS.danger };
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Date inconnue';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function generatePdfReport(data: ReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let pageNumber = 1;
  let yPos = MARGINS.top;

  // ========== PAGE 1: COUVERTURE ==========
  
  // Fond de couleur pour l'en-tête
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

  // Ligne décorative
  doc.setDrawColor(...COLORS.white);
  doc.setLineWidth(0.5);
  doc.line(60, 70, 150, 70);

  // Nom de l'établissement
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const estabName = truncateText(data.establishmentName, 40);
  doc.text(estabName, PAGE_WIDTH / 2, 140, { align: 'center' });

  // Date de génération
  const generationDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textLight);
  doc.text(`Rapport généré le ${generationDate}`, PAGE_WIDTH / 2, 155, { align: 'center' });

  // Encadré avec les KPIs principaux
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
  doc.text("Avis analysés", 105, 200, { align: 'center' });
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

  // ========== PAGE 2: RÉSUMÉ EXÉCUTIF ==========
  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;

  // Titre de section
  doc.setFillColor(...COLORS.primary);
  doc.rect(MARGINS.left, yPos, 5, 10, 'F');
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Résumé Exécutif', MARGINS.left + 10, yPos + 7);
  yPos += 20;

  // Stats principales
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 35, 2, 2, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textLight);
  
  const col1 = MARGINS.left + 25;
  const col2 = MARGINS.left + 65;
  const col3 = MARGINS.left + 105;
  const col4 = MARGINS.left + 145;

  doc.text('Avis analysés', col1, yPos + 10, { align: 'center' });
  doc.text('Note moyenne', col2, yPos + 10, { align: 'center' });
  doc.text('Avis positifs', col3, yPos + 10, { align: 'center' });
  doc.text('Avis négatifs', col4, yPos + 10, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(`${data.totalReviews}`, col1, yPos + 25, { align: 'center' });
  doc.text(`${data.avgRating.toFixed(1)}`, col2, yPos + 25, { align: 'center' });
  doc.setTextColor(...COLORS.success);
  doc.text(`${Math.round(data.positiveRatio * 100)}%`, col3, yPos + 25, { align: 'center' });
  doc.setTextColor(...COLORS.danger);
  doc.text(`${100 - Math.round(data.positiveRatio * 100)}%`, col4, yPos + 25, { align: 'center' });

  yPos += 50;

  // Points forts
  doc.setFillColor(...COLORS.success);
  doc.rect(MARGINS.left, yPos, 3, 8, 'F');
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Points forts principaux', MARGINS.left + 8, yPos + 6);
  yPos += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (data.topStrengths && data.topStrengths.length > 0) {
    data.topStrengths.slice(0, 5).forEach((strength, idx) => {
      const name = strength.theme || strength.strength || `Point fort ${idx + 1}`;
      const count = strength.count || strength.mentions || 0;
      doc.setTextColor(...COLORS.success);
      doc.text('✓', MARGINS.left + 5, yPos);
      doc.setTextColor(...COLORS.text);
      doc.text(`${name}`, MARGINS.left + 12, yPos);
      if (count > 0) {
        doc.setTextColor(...COLORS.textLight);
        doc.text(`(${count} mentions)`, MARGINS.left + 100, yPos);
      }
      yPos += 7;
    });
  } else {
    doc.setTextColor(...COLORS.textLight);
    doc.text('Aucun point fort identifié', MARGINS.left + 5, yPos);
    yPos += 7;
  }

  yPos += 10;

  // Points d'amélioration
  doc.setFillColor(...COLORS.danger);
  doc.rect(MARGINS.left, yPos, 3, 8, 'F');
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Points d'amélioration", MARGINS.left + 8, yPos + 6);
  yPos += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (data.topIssues && data.topIssues.length > 0) {
    data.topIssues.slice(0, 5).forEach((issue, idx) => {
      const name = issue.theme || issue.issue || `Problème ${idx + 1}`;
      const count = issue.count || issue.mentions || 0;
      doc.setTextColor(...COLORS.danger);
      doc.text('✗', MARGINS.left + 5, yPos);
      doc.setTextColor(...COLORS.text);
      doc.text(`${name}`, MARGINS.left + 12, yPos);
      if (count > 0) {
        doc.setTextColor(...COLORS.textLight);
        doc.text(`(${count} mentions)`, MARGINS.left + 100, yPos);
      }
      yPos += 7;
    });
  } else {
    doc.setTextColor(...COLORS.textLight);
    doc.text("Aucun problème identifié", MARGINS.left + 5, yPos);
    yPos += 7;
  }

  addFooter(doc, pageNumber);

  // ========== PAGE 3: ANALYSE DÉTAILLÉE ==========
  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;

  // Titre
  doc.setFillColor(...COLORS.primary);
  doc.rect(MARGINS.left, yPos, 5, 10, 'F');
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Analyse Détaillée', MARGINS.left + 10, yPos + 7);
  yPos += 25;

  // Répartition par note
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Répartition des avis par note', MARGINS.left, yPos);
  yPos += 10;

  // Calculer la répartition
  const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  data.recentReviews.forEach((review) => {
    const rating = review.rating || 0;
    if (rating >= 1 && rating <= 5) {
      ratingCounts[Math.round(rating)]++;
    }
  });
  const totalRatings = Object.values(ratingCounts).reduce((a, b) => a + b, 0) || 1;

  [5, 4, 3, 2, 1].forEach((rating) => {
    const count = ratingCounts[rating];
    const pct = (count / totalRatings) * 100;
    const barWidth = (pct / 100) * 100;

    // Étoiles
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(10);
    doc.text(`${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`, MARGINS.left, yPos + 4);

    // Barre de progression
    doc.setFillColor(...COLORS.background);
    doc.roundedRect(MARGINS.left + 35, yPos, 100, 6, 1, 1, 'F');
    
    const barColor = rating >= 4 ? COLORS.success : rating === 3 ? COLORS.warning : COLORS.danger;
    doc.setFillColor(...barColor);
    if (barWidth > 0) {
      doc.roundedRect(MARGINS.left + 35, yPos, barWidth, 6, 1, 1, 'F');
    }

    // Pourcentage
    doc.setTextColor(...COLORS.textLight);
    doc.text(`${pct.toFixed(0)}% (${count})`, MARGINS.left + 140, yPos + 4);

    yPos += 10;
  });

  yPos += 10;

  // Thèmes récurrents
  if (data.themes && data.themes.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text('Thèmes récurrents', MARGINS.left, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    data.themes.slice(0, 6).forEach((theme) => {
      doc.setFillColor(...COLORS.primary);
      doc.circle(MARGINS.left + 3, yPos - 1, 1.5, 'F');
      doc.setTextColor(...COLORS.text);
      doc.text(theme.theme, MARGINS.left + 8, yPos);
      if (theme.count || theme.score) {
        doc.setTextColor(...COLORS.textLight);
        doc.text(`(${theme.count || theme.score} mentions)`, MARGINS.left + 80, yPos);
      }
      yPos += 7;
    });
  }

  yPos += 15;

  // Extraits d'avis représentatifs
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('Extraits d\'avis représentatifs', MARGINS.left, yPos);
  yPos += 10;

  const representativeReviews = data.recentReviews
    .filter((r) => r.text && r.text.length > 20)
    .slice(0, 4);

  doc.setFontSize(9);
  representativeReviews.forEach((review) => {
    if (yPos > PAGE_HEIGHT - 50) {
      pageNumber = addNewPage(doc, pageNumber);
      yPos = MARGINS.top;
    }

    // Cadre de l'avis
    doc.setFillColor(...COLORS.background);
    doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 25, 2, 2, 'F');

    // Note et auteur
    const stars = '★'.repeat(review.rating || 0) + '☆'.repeat(5 - (review.rating || 0));
    const author = review.author || review.author_name || 'Anonyme';
    doc.setTextColor(...COLORS.warning);
    doc.text(stars, MARGINS.left + 3, yPos + 6);
    doc.setTextColor(...COLORS.textLight);
    doc.text(`- ${author}`, MARGINS.left + 30, yPos + 6);
    doc.text(formatDate(review.published_at), MARGINS.left + CONTENT_WIDTH - 30, yPos + 6);

    // Texte de l'avis
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'italic');
    const reviewText = truncateText(review.text || '', 150);
    const lines = doc.splitTextToSize(`"${reviewText}"`, CONTENT_WIDTH - 10);
    doc.text(lines.slice(0, 2), MARGINS.left + 3, yPos + 14);
    doc.setFont('helvetica', 'normal');

    yPos += 30;
  });

  addFooter(doc, pageNumber);

  // ========== PAGE 4: RECOMMANDATIONS ==========
  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;

  // Titre
  doc.setFillColor(...COLORS.primary);
  doc.rect(MARGINS.left, yPos, 5, 10, 'F');
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommandations Actionnables', MARGINS.left + 10, yPos + 7);
  yPos += 25;

  // Actions court terme
  doc.setFillColor(...COLORS.success);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Actions à mettre en place à court terme', MARGINS.left + 5, yPos + 5.5);
  yPos += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);

  // Générer des recommandations basées sur les données
  const recommendations: string[] = [];
  
  if (data.topIssues && data.topIssues.length > 0) {
    const mainIssue = data.topIssues[0];
    const issueName = mainIssue.theme || mainIssue.issue || 'problème principal';
    recommendations.push(`Priorité : Adresser "${issueName}" - c'est le problème le plus mentionné par vos clients.`);
  }
  
  if (data.avgRating < 4) {
    recommendations.push('Former l\'équipe sur les points d\'amélioration identifiés pour améliorer la note globale.');
  }
  
  if (data.positiveRatio < 0.7) {
    recommendations.push('Mettre en place un système de suivi des avis négatifs pour répondre rapidement.');
  }

  recommendations.push('Encourager les clients satisfaits à laisser des avis positifs.');
  recommendations.push('Analyser régulièrement les avis pour identifier les tendances émergentes.');

  recommendations.forEach((rec, idx) => {
    doc.setTextColor(...COLORS.primary);
    doc.text(`${idx + 1}.`, MARGINS.left + 3, yPos);
    doc.setTextColor(...COLORS.text);
    const lines = doc.splitTextToSize(rec, CONTENT_WIDTH - 15);
    doc.text(lines, MARGINS.left + 12, yPos);
    yPos += lines.length * 5 + 5;
  });

  yPos += 15;

  // Suggestions d'amélioration
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Suggestions d\'amélioration basées sur les avis', MARGINS.left + 5, yPos + 5.5);
  yPos += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);

  const suggestions: string[] = [];
  
  if (data.topStrengths && data.topStrengths.length > 0) {
    const mainStrength = data.topStrengths[0];
    const strengthName = mainStrength.theme || mainStrength.strength || 'point fort';
    suggestions.push(`Capitaliser sur "${strengthName}" - c'est votre principal atout selon les clients.`);
  }
  
  suggestions.push('Répondre à tous les avis, positifs comme négatifs, pour montrer votre engagement.');
  suggestions.push('Utiliser les verbatims positifs dans votre communication marketing.');
  
  if (data.themes && data.themes.length > 3) {
    suggestions.push('Diversifier les aspects mis en avant dans vos communications.');
  }

  suggestions.forEach((sug, idx) => {
    doc.setTextColor(...COLORS.secondary);
    doc.text('→', MARGINS.left + 3, yPos);
    doc.setTextColor(...COLORS.text);
    const lines = doc.splitTextToSize(sug, CONTENT_WIDTH - 15);
    doc.text(lines, MARGINS.left + 12, yPos);
    yPos += lines.length * 5 + 5;
  });

  addFooter(doc, pageNumber);

  // Générer le nom du fichier
  const sanitizedName = data.establishmentName
    .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Rapport_Analyse_Avis_${sanitizedName}_${dateStr}.pdf`;

  // Télécharger automatiquement
  doc.save(filename);
}
