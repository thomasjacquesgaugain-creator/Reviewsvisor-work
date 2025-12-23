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
  doc.text('Rapport genere automatiquement par Reviewsvisor', MARGINS.left, footerY);
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

export function generatePdfReport(data: ReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let pageNumber = 1;
  let yPos = MARGINS.top;

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

  // Encadre principal du score
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 60, 4, 4, 'F');
  
  // Bordure coloree selon le score
  const satisfaction = getSatisfactionIndex(data.avgRating);
  doc.setDrawColor(...satisfaction.color);
  doc.setLineWidth(2);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 60, 4, 4, 'S');

  // Note globale texte
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Note globale :', PAGE_WIDTH / 2, yPos + 20, { align: 'center' });
  
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(36);
  doc.text(`${data.avgRating.toFixed(1)} / 5`, PAGE_WIDTH / 2, yPos + 38, { align: 'center' });

  // Indice de satisfaction texte
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Indice de satisfaction : `, PAGE_WIDTH / 2 - 25, yPos + 52);
  doc.setTextColor(...satisfaction.color);
  doc.setFont('helvetica', 'bold');
  doc.text(satisfaction.label, PAGE_WIDTH / 2 + 25, yPos + 52);

  yPos += 75;

  // Stats complementaires
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
  doc.text('Avis negatifs', MARGINS.left + (CONTENT_WIDTH * 3 / 4) + 2, yPos + 32, { align: 'center' });

  yPos += 55;

  // ========== KPI - INDICATEURS CLES A SUIVRE ==========
  yPos = addSectionTitle(doc, 'KPI - Indicateurs cles a suivre', yPos, COLORS.secondary);

  // Encadre principal des KPIs
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 80, 3, 3, 'F');

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  let kpiY = yPos + 10;

  // Note moyenne globale
  doc.setFont('helvetica', 'bold');
  doc.text('Note moyenne globale :', MARGINS.left + 10, kpiY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.avgRating.toFixed(1)} / 5`, MARGINS.left + 80, kpiY);
  kpiY += 10;

  // Pourcentage d'avis positifs
  doc.setFont('helvetica', 'bold');
  doc.text('Pourcentage d\'avis positifs :', MARGINS.left + 10, kpiY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${Math.round(data.positiveRatio * 100)}%`, MARGINS.left + 80, kpiY);
  kpiY += 10;

  // Pourcentage d'avis negatifs
  doc.setFont('helvetica', 'bold');
  doc.text('Pourcentage d\'avis negatifs :', MARGINS.left + 10, kpiY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${100 - Math.round(data.positiveRatio * 100)}%`, MARGINS.left + 80, kpiY);
  kpiY += 10;

  // Principal theme negatif identifie
  doc.setFont('helvetica', 'bold');
  doc.text('Principal theme negatif :', MARGINS.left + 10, kpiY);
  doc.setFont('helvetica', 'normal');
  const mainNegativeTheme = (data.topIssues && data.topIssues.length > 0) 
    ? (data.topIssues[0].theme || data.topIssues[0].issue || 'Non identifie') 
    : 'Aucun';
  doc.text(truncateText(mainNegativeTheme, 50), MARGINS.left + 80, kpiY);
  kpiY += 10;

  // Principal theme positif identifie
  doc.setFont('helvetica', 'bold');
  doc.text('Principal theme positif :', MARGINS.left + 10, kpiY);
  doc.setFont('helvetica', 'normal');
  const mainPositiveTheme = (data.topStrengths && data.topStrengths.length > 0) 
    ? (data.topStrengths[0].theme || data.topStrengths[0].strength || 'Non identifie') 
    : 'Aucun';
  doc.text(truncateText(mainPositiveTheme, 50), MARGINS.left + 80, kpiY);

  // Texte explicatif
  yPos += 90;
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 20, 2, 2, 'F');
  doc.setTextColor(...COLORS.textLight);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  const kpiExplanation = 'Ces indicateurs permettent de suivre l\'evolution de la satisfaction client et de mesurer l\'impact des actions mises en place dans le temps.';
  const kpiLines = doc.splitTextToSize(kpiExplanation, CONTENT_WIDTH - 10);
  doc.text(kpiLines, MARGINS.left + 5, yPos + 8);

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
  yPos += 15;

  // Section: Elements positifs les plus cites
  doc.setFillColor(...COLORS.success);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Les 3 elements les plus apprecies', MARGINS.left + 5, yPos + 5.5);
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
    doc.text('Aucun point fort identifie dans les avis analyses', MARGINS.left + 5, yPos);
    yPos += 12;
  }

  yPos += 10;

  // Section: Points de friction
  doc.setFillColor(...COLORS.danger);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Les 2-3 principaux points de friction', MARGINS.left + 5, yPos + 5.5);
  yPos += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (data.topIssues && data.topIssues.length > 0) {
    data.topIssues.slice(0, 3).forEach((issue, idx) => {
      const name = issue.theme || issue.issue || `Probleme ${idx + 1}`;
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
    doc.text('Aucun probleme majeur identifie', MARGINS.left + 5, yPos);
    yPos += 12;
  }

  yPos += 10;

  // Section: Impact sur la note globale
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Element ayant le plus d\'impact sur la note', MARGINS.left + 5, yPos + 5.5);
  yPos += 15;

  doc.setFillColor(...COLORS.background);
  doc.roundedRect(MARGINS.left, yPos - 3, CONTENT_WIDTH, 20, 2, 2, 'F');
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  let impactElement = '';
  if (data.topIssues && data.topIssues.length > 0 && data.avgRating < 4) {
    const mainIssue = data.topIssues[0];
    impactElement = `Le principal facteur impactant negativement votre note est "${mainIssue.theme || mainIssue.issue}". Ameliorer ce point pourrait significativement augmenter votre note globale.`;
  } else if (data.topStrengths && data.topStrengths.length > 0) {
    const mainStrength = data.topStrengths[0];
    impactElement = `Votre point fort "${mainStrength.theme || mainStrength.strength}" est le principal atout qui maintient votre bonne note. Continuez a le valoriser.`;
  } else {
    impactElement = 'Collectez plus d\'avis pour identifier les facteurs cles impactant votre note.';
  }
  
  const impactLines = doc.splitTextToSize(impactElement, CONTENT_WIDTH - 10);
  doc.text(impactLines, MARGINS.left + 5, yPos + 5);

  addFooter(doc, pageNumber);

  // ========== PAGE 4: ANALYSE DETAILLEE ==========
  pageNumber = addNewPage(doc, pageNumber);
  yPos = MARGINS.top;

  yPos = addSectionTitle(doc, 'Analyse Detaillee', yPos);

  // Repartition par note
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Repartition des avis par note', MARGINS.left, yPos);
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
    doc.text(`Note ${rating}/5`, MARGINS.left, yPos + 4);

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

  // Themes recurrents
  if (data.themes && data.themes.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text('Themes recurrents', MARGINS.left, yPos);
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
  yPos += 15;

  // Actions prioritaires
  const prioritizedActions: Array<{ action: string; impact: string; effort: string; impactColor: [number, number, number] }> = [];

  // Action 1: Corriger le principal point de friction identifie
  const mainIssueAction = (data.topIssues && data.topIssues.length > 0) 
    ? `Corriger le principal point de friction : "${data.topIssues[0].theme || data.topIssues[0].issue}"`
    : 'Corriger le principal point de friction identifie';
  prioritizedActions.push({
    action: mainIssueAction,
    impact: 'Eleve',
    effort: 'Moyen',
    impactColor: COLORS.success
  });

  // Action 2: Former l'equipe
  prioritizedActions.push({
    action: 'Former l\'equipe sur les points d\'amelioration',
    impact: 'Moyen',
    effort: 'Faible',
    impactColor: COLORS.warning
  });

  // Action 3: Repondre systematiquement aux avis clients
  prioritizedActions.push({
    action: 'Repondre systematiquement aux avis clients',
    impact: 'Moyen',
    effort: 'Faible',
    impactColor: COLORS.warning
  });

  // Action 4: Valoriser les points forts identifies
  const strengthAction = (data.topStrengths && data.topStrengths.length > 0) 
    ? `Valoriser le point fort : "${data.topStrengths[0].theme || data.topStrengths[0].strength}"`
    : 'Valoriser les points forts identifies';
  prioritizedActions.push({
    action: strengthAction,
    impact: 'Moyen',
    effort: 'Faible',
    impactColor: COLORS.warning
  });

  // En-tete du tableau
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 10, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Action', MARGINS.left + 5, yPos + 7);
  doc.text('Impact', MARGINS.left + 115, yPos + 7);
  doc.text('Effort', MARGINS.left + 145, yPos + 7);
  yPos += 15;

  // Liste des actions
  prioritizedActions.forEach((item, idx) => {
    const bgColor = idx % 2 === 0 ? COLORS.background : COLORS.white;
    doc.setFillColor(...bgColor);
    doc.roundedRect(MARGINS.left, yPos - 3, CONTENT_WIDTH, 16, 1, 1, 'F');

    // Numero et action
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${idx + 1}.`, MARGINS.left + 5, yPos + 5);
    doc.setFont('helvetica', 'normal');
    const actionLines = doc.splitTextToSize(item.action, 95);
    doc.text(actionLines[0], MARGINS.left + 12, yPos + 5);
    if (actionLines.length > 1) {
      doc.setFontSize(8);
      doc.text(truncateText(actionLines[1], 50), MARGINS.left + 12, yPos + 11);
      doc.setFontSize(9);
    }

    // Impact
    doc.setTextColor(...item.impactColor);
    doc.setFont('helvetica', 'bold');
    doc.text(item.impact, MARGINS.left + 115, yPos + 5);

    // Effort
    doc.setTextColor(...COLORS.textLight);
    doc.setFont('helvetica', 'normal');
    doc.text(item.effort, MARGINS.left + 145, yPos + 5);

    yPos += 20;
  });

  // Phrase de conclusion
  yPos += 10;
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 25, 2, 2, 'F');
  doc.setDrawColor(...COLORS.warning);
  doc.setLineWidth(1);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 25, 2, 2, 'S');
  
  doc.setTextColor(...COLORS.warning);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommandation', MARGINS.left + 5, yPos + 8);
  
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const prioConclusion = 'Il est recommande de commencer par les actions a fort impact et faible effort afin d\'obtenir des resultats rapides et mesurables.';
  const prioLines = doc.splitTextToSize(prioConclusion, CONTENT_WIDTH - 10);
  doc.text(prioLines, MARGINS.left + 5, yPos + 16);

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
    const itemY = yPos + (rowIdx * 10);

    // Case a cocher
    doc.setDrawColor(...COLORS.textLight);
    doc.setLineWidth(0.3);
    doc.rect(colX, itemY, 4, 4, 'S');

    // Texte de l'action
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(truncateText(action, 50), colX + 6, itemY + 3);
  });

  yPos += (halfItems * 10) + 8;

  // SECTION: RITUELS D'EQUIPE
  doc.setFillColor(...COLORS.warning);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RITUELS D\'EQUIPE', MARGINS.left + 5, yPos + 5.5);
  yPos += 12;

  const rituals = [
    { icon: '1', text: 'Brief d\'equipe quotidien (2 min avant service)' },
    { icon: '2', text: 'Debriefing rapide en fin de service' },
    { icon: '3', text: 'Lecture des derniers avis 1x/semaine' },
  ];

  doc.setFillColor(...COLORS.background);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 25, 2, 2, 'F');

  rituals.forEach((ritual, idx) => {
    const ritualX = MARGINS.left + 10 + (idx * 55);
    
    doc.setFillColor(...COLORS.primary);
    doc.circle(ritualX, yPos + 8, 4, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(ritual.icon, ritualX, yPos + 9.5, { align: 'center', baseline: 'middle' });

    doc.setTextColor(...COLORS.text);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const ritualLines = doc.splitTextToSize(ritual.text, 50);
    doc.text(ritualLines, ritualX - 20, yPos + 16);
  });

  yPos += 32;

  // SECTION: ENGAGEMENT EQUIPE
  doc.setFillColor(...COLORS.secondary);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ENGAGEMENT EQUIPE', MARGINS.left + 5, yPos + 5.5);
  yPos += 12;

  // Zone d'engagement
  doc.setFillColor(...COLORS.white);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 35, 2, 2, 'F');
  doc.setDrawColor(...COLORS.textLight);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 35, 2, 2, 'S');

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('"Nous nous engageons a appliquer ces actions au quotidien."', PAGE_WIDTH / 2, yPos + 8, { align: 'center' });

  // Lignes de signature
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Responsable : ______________________________', MARGINS.left + 10, yPos + 20);
  doc.text('Date : ______________', MARGINS.left + 120, yPos + 20);
  doc.text('Signature : ______________________________', MARGINS.left + 10, yPos + 30);

  // Footer special pour cette page
  yPos = PAGE_HEIGHT - 18;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(MARGINS.left, yPos, CONTENT_WIDTH, 10, 1, 1, 'F');
  doc.setTextColor(...COLORS.textLight);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Document genere par Reviewsvisor - A afficher dans l\'etablissement', PAGE_WIDTH / 2, yPos + 6, { align: 'center' });

  addFooter(doc, pageNumber);

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
