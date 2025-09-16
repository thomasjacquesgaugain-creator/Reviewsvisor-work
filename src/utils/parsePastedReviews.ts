export interface ParsedReview {
  firstName: string;
  lastName: string;
  rating: number; // 1-5
  comment: string;
  platform: string;
  reviewDate: string;
  isValid: boolean;
}

export function parsePastedReviews(rawText: string): ParsedReview[] {
  const reviews: ParsedReview[] = [];
  const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentReview: Partial<ParsedReview> = {};
  let collectingComment = false;
  let commentLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect rating patterns
    const ratingMatch = line.match(/(\d+(?:[,\.]\d+)?)\s*\/\s*5|★{1,5}|⭐{1,5}/);
    if (ratingMatch) {
      // Save previous review if exists
      if (currentReview.rating && currentReview.firstName) {
        finishCurrentReview();
      }
      
      // Start new review
      currentReview = {};
      collectingComment = false;
      commentLines = [];
      
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
    finishCurrentReview();
  }
  
  function finishCurrentReview() {
    const review: ParsedReview = {
      firstName: currentReview.firstName || '',
      lastName: currentReview.lastName || '',
      rating: currentReview.rating || 1,
      comment: commentLines.join(' ').trim(),
      platform: currentReview.platform || 'unknown',
      reviewDate: currentReview.reviewDate || '',
      isValid: !!(currentReview.firstName && currentReview.rating && commentLines.length > 0)
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