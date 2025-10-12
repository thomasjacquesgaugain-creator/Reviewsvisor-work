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
  const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentReview: Partial<ParsedReview> = {};
  let collectingComment = false;
  let commentLines: string[] = [];
  let reviewStartIndex = 0; // Track where current review block starts
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect rating patterns
    const ratingMatch = line.match(/(?:(?:\b(?:noté|note|rating)\s*:?)?[\s\u00A0]*(\d+(?:[\.,]\d+)?)\s*(?:\/|sur)\s*5)|(?:(?:[★☆✭✩⭑⭒\uE000-\uF8FF]|\u2B50)[\s\u00A0]*){1,5}|(?:(\b[1-5])\s*étoiles?)/i);
    
    // Detect potential author name (person name pattern, not a metadata line)
    const lower = line.toLowerCase();
    const isMetadata = line.includes('Avis de Google') || 
                       line.includes('Avis deGoogle') ||
                       lower.includes('google') ||
                       lower.includes('local guide') ||
                       lower.includes('photos') ||
                       lower.includes('avis') ||
                       line.includes('il y a') || 
                       line.includes('Visité en');
    
    const looksLikeName = /^[A-Za-zÀ-ÿ''\-\.\s]{2,80}$/.test(line) && 
                          !line.includes('★') && 
                          !line.includes('⭐') &&
                          !isMetadata &&
                          line.split(/\s+/).filter(p => p.length > 0).length >= 1 &&
                          line.split(/\s+/).filter(p => p.length > 0).length <= 5;
    
    // Start new review if we detect a rating OR a likely author name
    if (ratingMatch || looksLikeName) {
      // Save previous review if exists
      if (currentReview.rating || currentReview.firstName) {
        finishCurrentReview(i - 1);
      }
      
      // Start new review
      currentReview = {};
      collectingComment = false;
      commentLines = [];
      reviewStartIndex = i;
      
      if (ratingMatch) {
        if (ratingMatch[1]) {
          // Numeric rating like "4,5/5" or "4.5 sur 5"
          const numRating = parseFloat(ratingMatch[1].replace(',', '.'));
          currentReview.rating = Math.max(1, Math.min(5, Math.round(numRating)));
        } else if (ratingMatch[2]) {
          // "X étoiles"
          currentReview.rating = parseInt(ratingMatch[2], 10);
        } else {
          // Star symbols sequence
          const starsText = ratingMatch[0];
          const starCount = (starsText.match(/[★☆✭✩⭑⭒\uE000-\uF8FF\u2B50]/g) || []).length;
          currentReview.rating = Math.max(1, Math.min(5, starCount));
        }
      }
      
      if (looksLikeName && !currentReview.firstName) {
        // This line is a name
        const nameParts = line.split(/\s+/).filter(part => part.length > 0);
        if (nameParts.length === 1) {
          currentReview.firstName = nameParts[0];
          currentReview.lastName = '';
        } else {
          currentReview.firstName = nameParts.slice(0, -1).join(' ');
          currentReview.lastName = nameParts[nameParts.length - 1];
        }
      }
      
      // Detect platform - check current line and look ahead
      let detectedPlatform = 'unknown';
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        const checkLine = lines[j].toLowerCase();
        if (checkLine.includes('avis de google') || checkLine.includes('google')) {
          detectedPlatform = 'Google';
          break;
        } else if (checkLine.includes('tripadvisor')) {
          detectedPlatform = 'Tripadvisor';
          break;
        }
      }
      currentReview.platform = detectedPlatform;
      continue;
    }
    
    // If we have started a review, try to extract missing info
    if (currentReview.firstName || currentReview.rating) {
      // Try to find rating if not yet found
      if (!currentReview.rating && ratingMatch) {
        if (ratingMatch[1]) {
          const numRating = parseFloat(ratingMatch[1].replace(',', '.'));
          currentReview.rating = Math.max(1, Math.min(5, Math.round(numRating)));
        } else if (ratingMatch[2]) {
          currentReview.rating = parseInt(ratingMatch[2], 10);
        } else {
          const starsText = ratingMatch[0];
          const starCount = (starsText.match(/[★☆✭✩⭑⭒\uE000-\uF8FF\u2B50]/g) || []).length;
          currentReview.rating = Math.max(1, Math.min(5, starCount));
        }
        continue;
      }
      
      // Try to find author name if not yet found
      if (!currentReview.firstName && looksLikeName) {
        const nameParts = line.split(/\s+/).filter(part => part.length > 0);
        if (nameParts.length === 1) {
          currentReview.firstName = nameParts[0];
          currentReview.lastName = '';
        } else {
          currentReview.firstName = nameParts.slice(0, -1).join(' ');
          currentReview.lastName = nameParts[nameParts.length - 1];
        }
        continue;
      }
      
      // Detect date patterns
      if (!currentReview.reviewDate) {
        const datePatterns = [
          /il y a (\d+) (jour|semaine|mois|an)/i,
          /Visité en (\w+)/i,
          /(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) \d{4}/i,
          /\d{1,2}\/\d{1,2}\/\d{4}/
        ];
        
        for (const pattern of datePatterns) {
          if (pattern.test(line)) {
            currentReview.reviewDate = line;
            break;
          }
        }
        
        if (currentReview.reviewDate) {
          continue;
        }
      }
      
      // Start collecting comment if we have at least name or rating
      collectingComment = true;
      
      // Collect comment lines
      if (collectingComment) {
        // Skip obvious metadata lines and platform indicators
        if (!line.includes('Avis de Google') && 
            !line.includes('Avis deGoogle') &&
            !line.toLowerCase().includes('google') &&
            !line.includes('il y a') && 
            !line.includes('Visité en') &&
            !line.match(/^\d+\/\d+\/\d+$/)) {
          
          // Remove "...Plus" suffix
          const cleanLine = line.replace(/…Plus$|\.\.\.Plus$/, '').trim();
          if (cleanLine.length > 0) {
            commentLines.push(cleanLine);
          }
        }
      }
    }
  }
  
  // Don't forget the last review
  if (currentReview.rating || currentReview.firstName) {
    finishCurrentReview(lines.length - 1);
  }
  
  function finishCurrentReview(endIndex: number) {
    // Calculate fingerprint from raw text block
    const rawBlock = lines.slice(reviewStartIndex, endIndex + 1).join("\n");
    const fingerprint = simpleHash(normSpaces(rawBlock));
    const review: ParsedReview = {
      firstName: currentReview.firstName || 'Anonyme',
      lastName: currentReview.lastName || '',
      rating: currentReview.rating || 3, // Default to 3 if no rating found
      comment: commentLines.join(' ').trim(),
      platform: currentReview.platform || 'unknown',
      reviewDate: currentReview.reviewDate || '',
      isValid: !!(currentReview.rating || currentReview.firstName), // Valid if we have at least one key info
      rawFingerprint: fingerprint
    };
    
    // Do not deduplicate at parse time; keep all detected reviews and let import layer handle duplicates
    reviews.push(review);
  }
  
  return reviews;
}
