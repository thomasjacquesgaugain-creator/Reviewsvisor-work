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
  aiDebrief?: string;
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
  doc.text('Rapport généré automatiquement par Reviewsvisor', MARGINS.left, footerY);
  doc.text(`Page ${pageNumber}`, PAGE_WIDTH - MARGINS.right, footerY, { align: 'right' });
}

function addNewPage(doc: jsPDF, pageNumber: number): number {
  addFooter(doc, pageNumber);
  doc.addPage();
  return pageNumber + 1;
}

function getSatisfactionIndex(avgRating: number): { label: string; color: [number, number, number] } {
  if (avgRating >= 4.5) return { label: 'Excellent', color: COLORS.success };
  if (avgRating >= 3.5) return { label: 'Bon', color: COLORS.warning };
  return { label: 'Moyen', color: COLORS.danger };
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

function addSectionTitle(doc: jsPDF, title: string, yPos: number, color: [number, number, number] = COLORS.primary): number {
  doc.setFillColor(...color);
  doc.rect(MARGINS.left, yPos, 5, 10, 'F');
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGINS.left + 10, yPos + 7);
  return yPos + 20;
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

  // ========== PAGE 2: SCORE GLOBAL VISUEL ==========
  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;

  yPos = addSectionTitle(doc, 'Score Global', yPos, COLORS.gold);

  // Encadré principal du score
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 70, 4, 4, 'F');
  
  // Bordure colorée selon le score
  const satisfaction = getSatisfactionIndex(data.avgRating);
  doc.setDrawColor(...satisfaction.color);
  doc.setLineWidth(2);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 70, 4, 4, 'S');

  // Grande note au centre
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(48);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.avgRating.toFixed(1)}`, PAGE_WIDTH / 2 - 20, yPos + 35, { align: 'center' });
  
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.textLight);
  doc.text('/ 5', PAGE_WIDTH / 2 + 20, yPos + 35, { align: 'left' });

  // Étoiles visuelles
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.gold);
  const fullStars = Math.floor(data.avgRating);
  const starDisplay = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
  doc.text(starDisplay, PAGE_WIDTH / 2, yPos + 50, { align: 'center' });

  // Indice de satisfaction
  doc.setFillColor(...satisfaction.color);
  doc.roundedRect(PAGE_WIDTH / 2 - 30, yPos + 55, 60, 10, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Indice: ${satisfaction.label}`, PAGE_WIDTH / 2, yPos + 62, { align: 'center' });

  yPos += 85;

  // Stats complémentaires
  doc.setFillColor(...COLORS.white);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH / 2 - 5, 40, 3, 3, 'F');
  doc.setDrawColor(...COLORS.success);
  doc.setLineWidth(0.5);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH / 2 - 5, 40, 3, 3, 'S');
  
  doc.setTextColor(...COLORS.success);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`${Math.round(data.positiveRatio * 100)}%`, MARGINS.left + (CONTENT_WIDTH / 4) - 2, yPos + 20, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  doc.text('Avis positifs', MARGINS.left + (CONTENT_WIDTH / 4) - 2, yPos + 32, { align: 'center' });

  doc.setFillColor(...COLORS.white);
  doc.roundedRect(MARGINS.left + CONTENT_WIDTH / 2 + 5, yPos, CONTENT_WIDTH / 2 - 5, 40, 3, 3, 'F');
  doc.setDrawColor(...COLORS.danger);
  doc.roundedRect(MARGINS.left + CONTENT_WIDTH / 2 + 5, yPos, CONTENT_WIDTH / 2 - 5, 40, 3, 3, 'S');
  
  doc.setTextColor(...COLORS.danger);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`${100 - Math.round(data.positiveRatio * 100)}%`, MARGINS.left + (CONTENT_WIDTH * 3 / 4) + 2, yPos + 20, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  doc.text('Avis négatifs', MARGINS.left + (CONTENT_WIDTH * 3 / 4) + 2, yPos + 32, { align: 'center' });

  addFooter(doc, pageNumber);

  // ========== PAGE 3: SYNTHÈSE - CE QUE VOS CLIENTS DISENT VRAIMENT ==========
  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;

  yPos = addSectionTitle(doc, 'Synthèse des retours clients', yPos);

  // Sous-titre
  doc.setFontSize(11);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLORS.textLight);
  doc.text('Ce que vos clients disent vraiment de votre établissement', MARGINS.left, yPos);
  yPos += 15;

  // Section: Éléments positifs les plus cités
  doc.setFillColor(...COLORS.success);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('✓ Les 3 éléments les plus appréciés', MARGINS.left + 5, yPos + 5.5);
  yPos += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (data.topStrengths && data.topStrengths.length > 0) {
    data.topStrengths.slice(0, 3).forEach((strength, idx) => {
      const name = strength.theme || strength.strength || `Point fort ${idx + 1}`;
      const count = strength.count || strength.mentions || 0;
      doc.setFillColor(...COLORS.background);
      doc.roundedRect(MARGINS.left, yPos - 3, CONTENT_WIDTH, 10, 1, 1, 'F');
      doc.setTextColor(...COLORS.success);
      doc.text(`${idx + 1}.`, MARGINS.left + 5, yPos + 3);
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'bold');
      doc.text(name, MARGINS.left + 15, yPos + 3);
      if (count > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.textLight);
        doc.text(`(${count} mentions)`, MARGINS.left + 120, yPos + 3);
      }
      yPos += 12;
    });
  } else {
    doc.setTextColor(...COLORS.textLight);
    doc.text('Aucun point fort identifié dans les avis analysés', MARGINS.left + 5, yPos);
    yPos += 12;
  }

  yPos += 10;

  // Section: Points de friction
  doc.setFillColor(...COLORS.danger);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('✗ Les 2-3 principaux points de friction', MARGINS.left + 5, yPos + 5.5);
  yPos += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (data.topIssues && data.topIssues.length > 0) {
    data.topIssues.slice(0, 3).forEach((issue, idx) => {
      const name = issue.theme || issue.issue || `Problème ${idx + 1}`;
      const count = issue.count || issue.mentions || 0;
      doc.setFillColor(...COLORS.background);
      doc.roundedRect(MARGINS.left, yPos - 3, CONTENT_WIDTH, 10, 1, 1, 'F');
      doc.setTextColor(...COLORS.danger);
      doc.text(`${idx + 1}.`, MARGINS.left + 5, yPos + 3);
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'bold');
      doc.text(name, MARGINS.left + 15, yPos + 3);
      if (count > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.textLight);
        doc.text(`(${count} mentions)`, MARGINS.left + 120, yPos + 3);
      }
      yPos += 12;
    });
  } else {
    doc.setTextColor(...COLORS.textLight);
    doc.text('Aucun problème majeur identifié', MARGINS.left + 5, yPos);
    yPos += 12;
  }

  yPos += 10;

  // Section: Impact sur la note globale
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('⚡ Élément ayant le plus d\'impact sur la note', MARGINS.left + 5, yPos + 5.5);
  yPos += 15;

  doc.setFillColor(...COLORS.background);
  doc.roundedRect(MARGINS.left, yPos - 3, CONTENT_WIDTH, 20, 2, 2, 'F');
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  let impactElement = '';
  if (data.topIssues && data.topIssues.length > 0 && data.avgRating < 4) {
    const mainIssue = data.topIssues[0];
    impactElement = `Le principal facteur impactant négativement votre note est "${mainIssue.theme || mainIssue.issue}". Améliorer ce point pourrait significativement augmenter votre note globale.`;
  } else if (data.topStrengths && data.topStrengths.length > 0) {
    const mainStrength = data.topStrengths[0];
    impactElement = `Votre point fort "${mainStrength.theme || mainStrength.strength}" est le principal atout qui maintient votre bonne note. Continuez à le valoriser.`;
  } else {
    impactElement = 'Collectez plus d\'avis pour identifier les facteurs clés impactant votre note.';
  }
  
  const impactLines = doc.splitTextToSize(impactElement, CONTENT_WIDTH - 10);
  doc.text(impactLines, MARGINS.left + 5, yPos + 5);
  yPos += 25;

  // Conclusion de la synthèse
  yPos += 10;
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 35, 3, 3, 'F');
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(1);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 35, 3, 3, 'S');

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('💡 Conclusion', MARGINS.left + 5, yPos + 8);

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  let conclusion = '';
  if (data.avgRating >= 4.5) {
    conclusion = `Vos clients sont très satisfaits ! Maintenez cette excellence en continuant à valoriser vos points forts et en restant attentif aux retours.`;
  } else if (data.avgRating >= 3.5) {
    conclusion = `Votre établissement reçoit des retours globalement positifs. Quelques ajustements sur les points de friction identifiés pourraient significativement améliorer la satisfaction client.`;
  } else {
    conclusion = `Des actions correctives sont nécessaires. Concentrez-vous sur les problèmes les plus cités par vos clients pour améliorer rapidement leur expérience.`;
  }

  const conclusionLines = doc.splitTextToSize(conclusion, CONTENT_WIDTH - 10);
  doc.text(conclusionLines, MARGINS.left + 5, yPos + 18);

  addFooter(doc, pageNumber);

  // ========== PAGE 4: ANALYSE DÉTAILLÉE ==========
  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;

  yPos = addSectionTitle(doc, 'Analyse Détaillée', yPos);

  // Répartition par note
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Répartition des avis par note', MARGINS.left, yPos);
  yPos += 10;

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

    doc.setTextColor(...COLORS.text);
    doc.setFontSize(10);
    doc.text(`${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`, MARGINS.left, yPos + 4);

    doc.setFillColor(...COLORS.background);
    doc.roundedRect(MARGINS.left + 35, yPos, 100, 6, 1, 1, 'F');
    
    const barColor = rating >= 4 ? COLORS.success : rating === 3 ? COLORS.warning : COLORS.danger;
    doc.setFillColor(...barColor);
    if (barWidth > 0) {
      doc.roundedRect(MARGINS.left + 35, yPos, barWidth, 6, 1, 1, 'F');
    }

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

    doc.setFillColor(...COLORS.background);
    doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 25, 2, 2, 'F');

    const stars = '★'.repeat(review.rating || 0) + '☆'.repeat(5 - (review.rating || 0));
    const author = review.author || review.author_name || 'Anonyme';
    doc.setTextColor(...COLORS.warning);
    doc.text(stars, MARGINS.left + 3, yPos + 6);
    doc.setTextColor(...COLORS.textLight);
    doc.text(`- ${author}`, MARGINS.left + 30, yPos + 6);
    doc.text(formatDate(review.published_at), MARGINS.left + CONTENT_WIDTH - 30, yPos + 6);

    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'italic');
    const reviewText = truncateText(review.text || '', 150);
    const lines = doc.splitTextToSize(`"${reviewText}"`, CONTENT_WIDTH - 10);
    doc.text(lines.slice(0, 2), MARGINS.left + 3, yPos + 14);
    doc.setFont('helvetica', 'normal');

    yPos += 30;
  });

  addFooter(doc, pageNumber);

  // ========== PAGE 5: CHECKLIST OPÉRATIONNELLE ==========
  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;

  yPos = addSectionTitle(doc, 'Checklist Opérationnelle', yPos, COLORS.success);

  // Sous-titre
  doc.setFontSize(11);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLORS.textLight);
  doc.text('Actions concrètes à mettre en place', MARGINS.left, yPos);
  yPos += 15;

  // Générer les actions basées sur les données
  const checklistItems: Array<{ category: string; action: string; priority: 'high' | 'medium' | 'low' }> = [];

  // Action prioritaire liée au principal point négatif
  if (data.topIssues && data.topIssues.length > 0) {
    const mainIssue = data.topIssues[0];
    const issueName = mainIssue.theme || mainIssue.issue || 'problème identifié';
    checklistItems.push({
      category: 'Action prioritaire',
      action: `Traiter en urgence : "${issueName}" - C'est le problème le plus mentionné par vos clients`,
      priority: 'high'
    });
  }

  // Action court terme
  if (data.avgRating < 4) {
    checklistItems.push({
      category: 'Court terme',
      action: 'Former l\'équipe sur les points d\'amélioration identifiés dans ce rapport',
      priority: 'medium'
    });
  } else {
    checklistItems.push({
      category: 'Court terme',
      action: 'Maintenir la qualité actuelle et surveiller les nouveaux avis régulièrement',
      priority: 'medium'
    });
  }

  // Action gestion des avis
  checklistItems.push({
    category: 'Gestion des avis',
    action: 'Répondre à tous les avis (positifs et négatifs) dans les 48h pour montrer votre engagement',
    priority: 'medium'
  });

  // Action valorisation points forts
  if (data.topStrengths && data.topStrengths.length > 0) {
    const mainStrength = data.topStrengths[0];
    const strengthName = mainStrength.theme || mainStrength.strength || 'point fort';
    checklistItems.push({
      category: 'Valorisation',
      action: `Mettre en avant "${strengthName}" dans votre communication (réseaux sociaux, site web, etc.)`,
      priority: 'low'
    });
  }

  // Action suivi régulier
  checklistItems.push({
    category: 'Suivi régulier',
    action: 'Planifier une analyse mensuelle des nouveaux avis avec Reviewsvisor pour suivre l\'évolution',
    priority: 'low'
  });

  // Dessiner la checklist
  checklistItems.forEach((item, idx) => {
    const priorityColor = item.priority === 'high' ? COLORS.danger : item.priority === 'medium' ? COLORS.warning : COLORS.success;
    
    doc.setFillColor(...COLORS.background);
    doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 25, 2, 2, 'F');
    
    // Case à cocher
    doc.setDrawColor(...COLORS.textLight);
    doc.setLineWidth(0.5);
    doc.rect(MARGINS.left + 5, yPos + 5, 5, 5, 'S');
    
    // Badge priorité
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
  doc.text('💡 Conseil', MARGINS.left + 5, yPos + 8);
  
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Imprimez cette page et affichez-la en back-office pour un suivi quotidien des actions.', MARGINS.left + 5, yPos + 18);

  addFooter(doc, pageNumber);

  // ========== PAGE 6: DÉBRIEF STRATÉGIQUE IA ==========
  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;

  yPos = addSectionTitle(doc, 'Débrief Stratégique – Analyse IA', yPos, COLORS.primary);

  // Génération du débrief basé sur les données
  let aiDebrief = data.aiDebrief;
  
  if (!aiDebrief) {
    // Générer un débrief automatique basé sur les données disponibles
    const analyseParts: string[] = [];
    
    // Analyse globale
    if (data.avgRating >= 4.5) {
      analyseParts.push(`Analyse globale : Votre établissement "${data.establishmentName}" affiche une excellente performance avec une note moyenne de ${data.avgRating.toFixed(1)}/5. Sur ${data.totalReviews} avis analysés, ${Math.round(data.positiveRatio * 100)}% sont positifs, ce qui témoigne d'une satisfaction client remarquable.`);
    } else if (data.avgRating >= 3.5) {
      analyseParts.push(`Analyse globale : Votre établissement "${data.establishmentName}" présente une performance correcte avec une note de ${data.avgRating.toFixed(1)}/5. Les ${data.totalReviews} avis analysés montrent un potentiel d'amélioration significatif.`);
    } else {
      analyseParts.push(`Analyse globale : Votre établissement "${data.establishmentName}" traverse une période difficile avec une note de ${data.avgRating.toFixed(1)}/5. Une attention immédiate aux retours clients est nécessaire.`);
    }

    // Priorités
    if (data.topIssues && data.topIssues.length > 0) {
      const issuesList = data.topIssues.slice(0, 2).map(i => i.theme || i.issue).join(' et ');
      analyseParts.push(`\n\nPriorités absolues : Concentrez vos efforts sur ${issuesList}. Ces éléments sont les plus fréquemment cités négativement par vos clients et impactent directement votre note.`);
    }

    // Leviers d'amélioration
    if (data.topStrengths && data.topStrengths.length > 0) {
      const strengthsList = data.topStrengths.slice(0, 2).map(s => s.theme || s.strength).join(' et ');
      analyseParts.push(`\n\nLeviers principaux : Vos points forts (${strengthsList}) constituent votre meilleur atout. Capitalisez dessus en les mettant en avant dans votre communication et en maintenant ce niveau de qualité.`);
    }

    // Conclusion encourageante
    analyseParts.push(`\n\nConclusion : Chaque avis client est une opportunité d'amélioration. En restant à l'écoute de vos clients et en agissant sur les points identifiés, vous êtes sur la bonne voie pour améliorer durablement la satisfaction de votre clientèle. La clé du succès réside dans la constance et l'engagement quotidien de toute l'équipe.`);

    aiDebrief = analyseParts.join('');
  }

  // Afficher le débrief
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 180, 3, 3, 'F');

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const debriefLines = doc.splitTextToSize(aiDebrief, CONTENT_WIDTH - 15);
  let currentY = yPos + 10;
  
  debriefLines.forEach((line: string, idx: number) => {
    if (currentY > yPos + 170) return; // Limiter à la zone disponible
    
    // Mettre en gras les titres de section
    if (line.includes('Analyse globale') || line.includes('Priorités') || line.includes('Leviers') || line.includes('Conclusion')) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primary);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.text);
    }
    
    doc.text(line, MARGINS.left + 7, currentY);
    currentY += 6;
  });

  // Signature IA
  yPos += 190;
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 20, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Cette analyse a été générée automatiquement par l\'intelligence artificielle de Reviewsvisor', PAGE_WIDTH / 2, yPos + 8, { align: 'center' });
  doc.text('basée sur l\'ensemble des avis clients de votre établissement.', PAGE_WIDTH / 2, yPos + 14, { align: 'center' });

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
