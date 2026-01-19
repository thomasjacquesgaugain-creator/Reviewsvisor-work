import { supabase } from "@/integrations/supabase/client";

export interface ReviewCreate {
  establishment_id: string;
  establishment_place_id: string;
  establishment_name: string;
  source: string;
  author_first_name: string;
  author_last_name: string;
  rating: number;
  comment: string; // Can be empty string
  review_date?: string | null;
  createTime?: string | null; // DATE ORIGINALE - NE JAMAIS MODIFIER (règle absolue)
  import_method: string;
  import_source_url?: string | null;
  raw_fingerprint?: string; // Fingerprint for paste deduplication
}

export interface BulkCreateResult {
  inserted: number;
  skipped: number;
  reasons?: {
    duplicate?: number;
    missingRating?: number;
    missingEstablishment?: number;
  };
  sampleSkipped?: Array<{
    reason: string;
    snippet: string;
  }>;
}

// Simple hash function for deduplication
function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

export async function bulkCreateReviews(reviews: ReviewCreate[]): Promise<BulkCreateResult> {
  let inserted = 0;
  let skippedTotal = 0;
  const reasons = {
    duplicate: 0,
    missingRating: 0,
    missingEstablishment: 0
  };
  const sampleSkipped: Array<{ reason: string; snippet: string }> = [];
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  for (const review of reviews) {
    try {
      // Validate required fields
      if (!review.establishment_id || !review.establishment_place_id) {
        reasons.missingEstablishment++;
        if (sampleSkipped.length < 5) {
          sampleSkipped.push({
            reason: 'missing_establishment',
            snippet: `${review.author_first_name || 'Anonyme'}: ${(review.comment || '').substring(0, 50)}...`
          });
        }
        skippedTotal++;
        continue;
      }

      if (!review.rating || review.rating < 1 || review.rating > 5) {
        reasons.missingRating++;
        if (sampleSkipped.length < 5) {
          sampleSkipped.push({
            reason: 'missing_rating',
            snippet: `${review.author_first_name || 'Anonyme'}: ${(review.comment || '').substring(0, 50)}...`
          });
        }
        skippedTotal++;
        continue;
      }

      // Create hash for deduplication
      let reviewHash: string;
      
      if (review.import_method === "paste" && review.raw_fingerprint) {
        // Use fingerprint for paste imports to avoid over-deduplication
        reviewHash = simpleHash(`${review.establishment_id}|${review.raw_fingerprint}`);
      } else {
        // Fallback to strict deduplication for other imports
        const normalizedText = (review.comment || "").toLowerCase().trim();
        const hashInput = `${review.establishment_id}|${review.author_first_name || ""}|${review.author_last_name || ""}|${review.review_date || ""}|${review.rating}|${normalizedText}`;
        reviewHash = simpleHash(hashInput);
      }
      
      // Check if review already exists (by source_review_id which stores our hash)
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', user.user.id)
        .eq('source_review_id', reviewHash)
        .single();
      
      if (existingReview) {
        reasons.duplicate++;
        if (sampleSkipped.length < 5) {
          sampleSkipped.push({
            reason: 'duplicate',
            snippet: `${review.author_first_name || 'Anonyme'}: ${(review.comment || '').substring(0, 50)}...`
          });
        }
        skippedTotal++;
        continue;
      }
      
      // RÈGLE CRITIQUE : createTime doit TOUJOURS être préservé et ne JAMAIS changer
      // NE JAMAIS utiliser new Date() ou Date.now() pour remplacer createTime
      
      let publishedAt: string | null = null;
      let createTimeValue: string | null = null;
      
      // Priorité ABSOLUE : createTime original depuis le JSON (NE JAMAIS MODIFIER)
      if (review.createTime) {
        // CONSERVER LA VALEUR ORIGINALE TELLE QUELLE
        createTimeValue = review.createTime;
        try {
          // Utiliser createTime pour published_at aussi
          const date = new Date(review.createTime);
          if (!isNaN(date.getTime())) {
            publishedAt = date.toISOString();
          }
        } catch (e) {
          console.warn('Invalid createTime (mais on le conserve quand même):', review.createTime, e);
          // Même si invalide, on conserve createTime original
        }
      } else if (review.review_date) {
        // Fallback : utiliser review_date si createTime n'existe pas
        try {
          const date = new Date(review.review_date);
          if (!isNaN(date.getTime()) && review.review_date !== 'Invalid Date') {
            publishedAt = date.toISOString();
            createTimeValue = review.review_date; // Utiliser review_date comme createTime
          }
        } catch (e) {
          console.warn('Invalid review_date:', review.review_date, e);
        }
      } else if (review.published_at) {
        // Dernier fallback
        try {
          const date = new Date(review.published_at);
          if (!isNaN(date.getTime())) {
            publishedAt = date.toISOString();
            createTimeValue = review.published_at;
          }
        } catch (e) {
          console.warn('Invalid published_at:', review.published_at, e);
        }
      }
      
      // VÉRIFICATION CRITIQUE : createTime doit exister
      if (!createTimeValue) {
        console.error('❌ ERREUR CRITIQUE : createTime manquant pour l\'avis:', {
          author: review.author_first_name,
          comment: review.comment?.substring(0, 50)
        });
        // On continue quand même mais on log l'erreur
      }
      
      // Debug pour les 3 premiers avis
      if (inserted < 3) {
        console.log(`🔍 Review ${inserted} - Date mapping (createTime préservé):`, {
          createTime_original: review.createTime,
          createTimeValue_final: createTimeValue,
          review_date: review.review_date,
          published_at: review.published_at,
          publishedAt_final: publishedAt
        });
      }
      
      // Insert new review
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.user.id,
          place_id: review.establishment_place_id,
          source: review.source,
          author: `${review.author_first_name} ${review.author_last_name}`.trim() || 'Anonyme',
          rating: review.rating,
          text: review.comment || "",
          published_at: publishedAt,
          create_time: createTimeValue, // Stocker create_time avec la valeur originale si disponible
          source_review_id: reviewHash,
          raw: {
            import_method: review.import_method,
            import_source_url: review.import_source_url,
            author_first_name: review.author_first_name,
            author_last_name: review.author_last_name,
            establishment_name: review.establishment_name,
            raw_fingerprint: review.raw_fingerprint,
            // RÈGLE ABSOLUE : Conserver createTime original dans raw (NE JAMAIS MODIFIER)
            createTime: review.createTime || createTimeValue || review.review_date || publishedAt,
            originalCreateTime: review.createTime || createTimeValue, // Backup de sécurité
            review_date: review.review_date // Conserver aussi review_date pour compatibilité
          }
        });
      
      if (error) {
        console.error('Error inserting review:', error);
        skippedTotal++;
      } else {
        inserted++;
        
        // RÈGLE CRITIQUE : Sauvegarder createTime dans localStorage pour backup permanent
        try {
          const storageKey = `reviews_backup_${review.establishment_place_id}`;
          const existingBackup = localStorage.getItem(storageKey);
          const backupData = existingBackup ? JSON.parse(existingBackup) : {};
          
          // Ajouter ce review avec son createTime original
          backupData[reviewHash] = {
            createTime: review.createTime || createTimeValue,
            originalCreateTime: review.createTime || createTimeValue,
            review_date: review.review_date,
            published_at: publishedAt,
            create_time: createTimeValue,
            timestamp: new Date().toISOString() // Timestamp de sauvegarde
          };
          
          localStorage.setItem(storageKey, JSON.stringify(backupData));
        } catch (e) {
          console.warn('Erreur lors de la sauvegarde localStorage (non bloquant):', e);
        }
      }
    } catch (error) {
      console.error('Error processing review:', error);
      skippedTotal++;
    }
  }
  
  return { 
    inserted, 
    skipped: skippedTotal,
    reasons,
    sampleSkipped
  };
}

// RÈGLE CRITIQUE : Fonction de vérification et restauration de createTime au chargement
export async function verifyAndRestoreCreateTimes(establishmentId: string) {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    
    // Charger les avis depuis la DB
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, source_review_id, create_time, raw')
      .eq('user_id', user.user.id)
      .eq('place_id', establishmentId);
    
    if (!reviews || reviews.length === 0) return;
    
    // Charger le backup depuis localStorage
    const storageKey = `reviews_backup_${establishmentId}`;
    const backupStr = localStorage.getItem(storageKey);
    const backupData = backupStr ? JSON.parse(backupStr) : {};
    
    let restoredCount = 0;
    let missingCount = 0;
    
    for (const review of reviews) {
      const reviewHash = review.source_review_id;
      const backup = backupData[reviewHash];
      
      // Vérifier si createTime existe
      const hasCreateTime = review.create_time || review.raw?.createTime || review.raw?.originalCreateTime;
      
      if (!hasCreateTime) {
        missingCount++;
        console.error(`❌ ERREUR CRITIQUE : Review ${review.id} n'a pas de createTime!`);
        
        // Essayer de restaurer depuis le backup
        if (backup && backup.createTime) {
          console.log(`🔄 Tentative de restauration createTime pour review ${review.id} depuis backup`);
          
          // Mettre à jour dans la DB (SEULEMENT createTime, ne pas toucher au reste)
          const { error: updateError } = await supabase
            .from('reviews')
            .update({
              create_time: backup.createTime,
              raw: {
                ...review.raw,
                createTime: backup.createTime,
                originalCreateTime: backup.originalCreateTime || backup.createTime
              }
            })
            .eq('id', review.id);
          
          if (!updateError) {
            restoredCount++;
            console.log(`✅ createTime restauré pour review ${review.id}`);
          } else {
            console.error(`❌ Échec restauration createTime pour review ${review.id}:`, updateError);
          }
        }
      } else {
        // Vérifier que createTime n'a pas été modifié (comparer avec backup)
        if (backup && backup.createTime) {
          const currentCreateTime = review.create_time || review.raw?.createTime;
          if (currentCreateTime !== backup.createTime) {
            console.warn(`⚠️ createTime modifié pour review ${review.id}! Original: ${backup.createTime}, Actuel: ${currentCreateTime}`);
            // Optionnel : restaurer automatiquement
            // await supabase.from('reviews').update({ create_time: backup.createTime }).eq('id', review.id);
          }
        }
      }
    }
    
    if (missingCount > 0 || restoredCount > 0) {
      console.log(`📊 Vérification createTime: ${missingCount} manquants, ${restoredCount} restaurés`);
    }
  } catch (error) {
    console.error('Erreur lors de la vérification createTime:', error);
  }
}

export async function list(establishmentId: string, limit = 500, cursor?: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  let query = supabase
    .from('reviews')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('place_id', establishmentId)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('inserted_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.gt('id', parseInt(cursor));
  }

  const { data: reviews, error } = await query;

  if (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }

  return {
    items: reviews || [],
    nextCursor: reviews && reviews.length === limit ? reviews[reviews.length - 1].id.toString() : undefined
  };
}

export async function listAll(establishmentId: string) {
  let all: any[] = [];
  let cursor: string | undefined;
  
  do {
    const { items, nextCursor } = await list(establishmentId, 500, cursor);
    all = all.concat(items || []);
    cursor = nextCursor;
  } while (cursor);
  
  return all;
}

export async function getReviewsList(establishmentId: string, options?: { limit?: number; cursor?: string }) {
  return list(establishmentId, options?.limit || 50, options?.cursor);
}

export async function listAllReviews(establishmentId: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  // Get ALL reviews for the establishment (no limit)
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('place_id', establishmentId)
    .order('published_at', { ascending: false })
    .order('inserted_at', { ascending: false });

  if (error) {
    console.error('Error fetching all reviews:', error);
    throw error;
  }

  return reviews || [];
}

/**
 * ⚠️ PROTECTION DES DONNÉES ⚠️
 * Cette fonction supprime TOUS les avis d'un établissement.
 * Elle crée automatiquement un backup avant suppression.
 * UTILISER UNIQUEMENT après confirmation explicite de l'utilisateur.
 */
export async function deleteAllReviews(establishmentId: string): Promise<number> {
  // RÈGLE CRITIQUE : Supprimer aussi le backup createTime lors de la suppression des avis
  try {
    const storageKey = `reviews_backup_${establishmentId}`;
    localStorage.removeItem(storageKey);
    console.log(`🗑️ Backup createTime supprimé pour établissement ${establishmentId}`);
  } catch (e) {
    console.warn('Erreur lors de la suppression du backup (non bloquant):', e);
  }
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  // ⚠️ PROTECTION 1: Backup automatique avant suppression
  try {
    const { data: reviewsToBackup } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('place_id', establishmentId);

    if (reviewsToBackup && reviewsToBackup.length > 0) {
      const backupData = {
        timestamp: new Date().toISOString(),
        establishmentId,
        reviewsCount: reviewsToBackup.length,
        reviews: reviewsToBackup
      };
      
      // Sauvegarder dans localStorage avec clé unique par établissement
      const backupKey = `reviews_backup_${establishmentId}_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      
      console.warn(`[PROTECTION DONNÉES] ⚠️ Backup créé avant suppression: ${backupKey}`, {
        reviewsCount: reviewsToBackup.length,
        establishmentId
      });
      
      // Garder aussi un backup récent (max 5 backups)
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(`reviews_backup_${establishmentId}_`))
        .sort()
        .reverse();
      
      // Supprimer les backups anciens (garder les 5 plus récents)
      backupKeys.slice(5).forEach(oldKey => {
        localStorage.removeItem(oldKey);
        console.log(`[PROTECTION DONNÉES] Backup ancien supprimé: ${oldKey}`);
      });
    }
  } catch (backupError) {
    console.error('[PROTECTION DONNÉES] ❌ Erreur lors du backup:', backupError);
    // Continuer quand même, mais avec un warning
    console.warn('[PROTECTION DONNÉES] ⚠️ Suppression effectuée sans backup (risque de perte de données)');
  }

  // ⚠️ PROTECTION 2: Log d'avertissement
  console.warn('[PROTECTION DONNÉES] ⚠️ Suppression de tous les avis demandée pour:', {
    establishmentId,
    userId: user.user.id,
    timestamp: new Date().toISOString()
  });

  const { error, count } = await supabase
    .from('reviews')
    .delete({ count: 'exact' })
    .eq('user_id', user.user.id)
    .eq('place_id', establishmentId);

  if (error) {
    console.error('[PROTECTION DONNÉES] ❌ Erreur lors de la suppression:', error);
    throw error;
  }

  console.warn(`[PROTECTION DONNÉES] ⚠️ ${count || 0} avis supprimés pour l'établissement ${establishmentId}`);

  return count || 0;
}

export async function getReviewsSummary(establishmentId: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  // Get all reviews for the establishment
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('rating, published_at')
    .eq('user_id', user.user.id)
    .eq('place_id', establishmentId);

  if (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }

  if (!reviews || reviews.length === 0) {
    return {
      total: 0,
      avgRating: 0,
      byStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      byMonth: []
    };
  }

  // Calculate metrics
  const total = reviews.length;
  const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / total;

  // Group by stars
  const byStars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) {
      byStars[Math.floor(r.rating) as keyof typeof byStars]++;
    }
  });

  // Group by month (last 12 months)
  const monthCounts: Record<string, { count: number; total: number }> = {};
  const now = new Date();
  
  reviews.forEach(r => {
    if (r.published_at) {
      const date = new Date(r.published_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthCounts[monthKey]) {
        monthCounts[monthKey] = { count: 0, total: 0 };
      }
      monthCounts[monthKey].count++;
      monthCounts[monthKey].total += r.rating || 0;
    }
  });

  const byMonth = Object.entries(monthCounts)
    .map(([month, data]) => ({
      month,
      count: data.count,
      avg: data.count > 0 ? data.total / data.count : 0
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months

  return {
    total,
    avgRating,
    byStars,
    byMonth
  };
}