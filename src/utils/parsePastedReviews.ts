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
    const ratingMatch = line.match(/(\d+(?:[,\.]\d+)?)\s*\/\s*5|★{1,5}|⭐{1,5}/);
    if (ratingMatch) {
      // Save previous review if exists
      if (currentReview.rating && currentReview.firstName) {
        finishCurrentReview(i - 1);
      }
      
      // Start new review
      currentReview = {};
      collectingComment = false;
      commentLines = [];
      reviewStartIndex = i; // Mark start of new review block
      
      if (ratingMatch[1]) {
        // Numeric rating like "4,5/5" or "4.5/5"
        const numRating = parseFloat(ratingMatch[1].replace(',', '.'));
        currentReview.rating = Math.round(numRating);
      } else {
        // Star rating
        const stars = ratingMatch[0];
        currentReview.rating = stars.length;
      }
      
      // Detect platform
      if (line.toLowerCase().includes('google') || rawText.toLowerCase().includes('avis de google')) {
        currentReview.platform = 'Google';
      } else if (line.toLowerCase().includes('tripadvisor')) {
        currentReview.platform = 'Tripadvisor';
      } else {
        currentReview.platform = 'unknown';
      }
      continue;
    }
    
    // Detect author name (usually appears after rating)
    if (currentReview.rating && !currentReview.firstName && !collectingComment) {
      // Skip lines that look like metadata
      if (line.includes('Avis de Google') || line.includes('il y a') || line.includes('Visité en')) {
        continue;
      }
      
      // Check if line looks like a name (2-3 words, no numbers)
      if (/^[A-Za-zÀ-ÿ\s]{2,50}$/.test(line) && !line.includes('★') && !line.includes('⭐')) {
        const nameParts = line.split(' ').filter(part => part.length > 0);
        if (nameParts.length >= 1) {
          if (nameParts.length === 1) {
            currentReview.firstName = nameParts[0];
            currentReview.lastName = '';
          } else {
            currentReview.firstName = nameParts.slice(0, -1).join(' ');
            currentReview.lastName = nameParts[nameParts.length - 1];
          }
        }
        continue;
      }
    }
    
    // Detect date patterns
    if (currentReview.rating && !currentReview.reviewDate) {
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
    
    // Start collecting comment if we have basic info
    if (currentReview.rating && currentReview.firstName) {
      collectingComment = true;
    }
    
    // Collect comment lines
    if (collectingComment) {
      // Skip obvious metadata lines
      if (!line.includes('Avis de Google') && 
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
  
  // Don't forget the last review
  if (currentReview.rating && currentReview.firstName) {
    finishCurrentReview(lines.length - 1);
  }
  
  function finishCurrentReview(endIndex: number) {
    // Calculate fingerprint from raw text block
    const rawBlock = lines.slice(reviewStartIndex, endIndex + 1).join("\n");
    const fingerprint = simpleHash(normSpaces(rawBlock));
    const review: ParsedReview = {
      firstName: currentReview.firstName || '',
      lastName: currentReview.lastName || '',
      rating: currentReview.rating || 1,
      comment: commentLines.join(' ').trim(),
      platform: currentReview.platform || 'unknown',
      reviewDate: currentReview.reviewDate || '',
      isValid: !!(currentReview.firstName && currentReview.rating),
      rawFingerprint: fingerprint
    };
    
    // Simple deduplication based on content hash
    const contentHash = `${review.firstName}${review.lastName}${review.comment}${review.reviewDate}`.toLowerCase();
    const isDuplicate = reviews.some(existing => 
      `${existing.firstName}${existing.lastName}${existing.comment}${existing.reviewDate}`.toLowerCase() === contentHash
    );
    
    if (!isDuplicate) {
      reviews.push(review);
    }
  }
  
  return reviews;
}