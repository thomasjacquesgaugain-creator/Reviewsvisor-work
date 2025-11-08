export interface ParsedReview {
  firstName: string;
  lastName: string;
  rating: number; // 1-5
  comment: string; // Can be empty string
  platform: string;
  reviewDate: string;
  isValid: boolean;
  rawFingerprint?: string; // Fingerprint of the raw text block
}

// Simple hash function for fingerprinting
function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

function normSpaces(s: string): string {
  return (s || "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function parsePastedReviews(rawText: string): ParsedReview[] {
  const reviews: ParsedReview[] = [];
  const lines = rawText.split('\n').map(line => line.trim());
  
  // Lignes à ignorer complètement
  const skipPatterns = [
    /^Afficher tous les avis/i,
    /^Avis de Google/i,
    /^Voir plus$/i,
    /^Nouveau$/i,
    /^Traduire/i,
    /^\d+ avis$/i,
    /^\d+ reviews?$/i,
    /^Plus$/i,
    /^…$/,
    /^Afficher l'avis original/i,
    /^Afficher en français/i
  ];
  
  function shouldSkipLine(line: string): boolean {
    if (!line || line.length === 0) return true;
    return skipPatterns.some(pattern => pattern.test(line));
  }
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    if (shouldSkipLine(line)) {
      i++;
      continue;
    }
    
    // Détection du nom de l'auteur (début d'un avis)
    // Un nom est généralement une chaîne sans chiffres, 2-50 caractères
    const isNameLine = /^[A-Za-zÀ-ÿ\s'-]{2,50}$/.test(line) && 
                       !line.includes('★') && 
                       !line.includes('⭐') &&
                       !/\d/.test(line);
    
    if (!isNameLine) {
      i++;
      continue;
    }
    
    // On a potentiellement trouvé un nom d'auteur
    const authorName = line;
    const reviewStartIndex = i;
    i++; // Passer à la ligne suivante
    
    // La ligne suivante devrait contenir la notation
    if (i >= lines.length) break;
    
    const ratingLine = lines[i];
    const starsMatch = ratingLine.match(/★+|⭐+/);
    
    if (!starsMatch) {
      // Pas de notation trouvée, ce n'était pas un avis
      continue;
    }
    
    const rating = starsMatch[0].length;
    i++; // Passer après la ligne de notation
    
    // Collecter les lignes de commentaire jusqu'à "Visité en" ou fin/nouveau nom
    const commentLines: string[] = [];
    let visitedMonth = '';
    
    while (i < lines.length) {
      const commentLine = lines[i];
      
      if (shouldSkipLine(commentLine)) {
        i++;
        continue;
      }
      
      // Détecter "Visité en [mois]" qui marque la fin de l'avis
      const visitedMatch = commentLine.match(/^Visité en (\w+)$/i);
      if (visitedMatch) {
        visitedMonth = visitedMatch[1];
        i++;
        break;
      }
      
      // Détecter si on arrive à un nouveau nom (début du prochain avis)
      const isNextName = /^[A-Za-zÀ-ÿ\s'-]{2,50}$/.test(commentLine) && 
                         !commentLine.includes('★') && 
                         !commentLine.includes('⭐') &&
                         !/\d/.test(commentLine);
      
      if (isNextName && i > reviewStartIndex + 2) {
        // C'est probablement le début du prochain avis
        break;
      }
      
      // Nettoyer et ajouter la ligne au commentaire
      const cleanLine = commentLine
        .replace(/…Plus$|\.\.\.Plus$/i, '')
        .replace(/^il y a .*$/i, '')
        .trim();
      
      if (cleanLine.length > 0 && !/^il y a \d+ (jour|semaine|mois|an)/i.test(cleanLine)) {
        commentLines.push(cleanLine);
      }
      
      i++;
    }
    
    // Créer l'avis parsé
    const nameParts = authorName.split(' ').filter(part => part.length > 0);
    const firstName = nameParts.length === 1 ? nameParts[0] : nameParts.slice(0, -1).join(' ');
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    
    const comment = commentLines.join(' ').trim();
    const reviewDate = visitedMonth ? `Visité en ${visitedMonth}` : '';
    
    // Générer un fingerprint
    const rawBlock = `${authorName}\n${rating}\n${comment}\n${reviewDate}`;
    const fingerprint = simpleHash(normSpaces(rawBlock));
    
    const review: ParsedReview = {
      firstName,
      lastName,
      rating,
      comment,
      platform: 'Google',
      reviewDate,
      isValid: !!(firstName && rating >= 1 && rating <= 5),
      rawFingerprint: fingerprint
    };
    
    // Déduplication
    const contentHash = `${firstName}${lastName}${comment}${reviewDate}`.toLowerCase();
    const isDuplicate = reviews.some(existing => 
      `${existing.firstName}${existing.lastName}${existing.comment}${existing.reviewDate}`.toLowerCase() === contentHash
    );
    
    if (!isDuplicate && review.isValid) {
      reviews.push(review);
    }
  }
  
  return reviews;
}