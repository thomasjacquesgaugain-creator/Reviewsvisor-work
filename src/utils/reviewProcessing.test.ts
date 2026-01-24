/**
 * Tests unitaires pour reviewProcessing.ts
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeRating,
  computeSentimentFromRating,
  mapTextToTheme,
  mapThemeLabel,
  extractKeywordsWithSentiment,
  aggregateKeywords
} from './reviewProcessing';

describe('normalizeRating', () => {
  it('should normalize numeric ratings', () => {
    expect(normalizeRating(1)).toBe(1);
    expect(normalizeRating(3)).toBe(3);
    expect(normalizeRating(5)).toBe(5);
    expect(normalizeRating(0)).toBe(1); // Clamp min
    expect(normalizeRating(10)).toBe(5); // Clamp max
  });

  it('should normalize enum ratings (ONE, TWO, etc.)', () => {
    expect(normalizeRating('ONE')).toBe(1);
    expect(normalizeRating('TWO')).toBe(2);
    expect(normalizeRating('THREE')).toBe(3);
    expect(normalizeRating('FOUR')).toBe(4);
    expect(normalizeRating('FIVE')).toBe(5);
    expect(normalizeRating('one')).toBe(1); // Case insensitive
  });

  it('should normalize string numeric ratings', () => {
    expect(normalizeRating('1')).toBe(1);
    expect(normalizeRating('5')).toBe(5);
  });

  it('should fallback to 3 for unknown values', () => {
    expect(normalizeRating('UNKNOWN')).toBe(3);
    expect(normalizeRating(null)).toBe(3);
    expect(normalizeRating(undefined)).toBe(3);
  });
});

describe('computeSentimentFromRating', () => {
  it('should return negative for ratings <= 2', () => {
    expect(computeSentimentFromRating(1)).toBe('negative');
    expect(computeSentimentFromRating(2)).toBe('negative');
    expect(computeSentimentFromRating('TWO')).toBe('negative');
  });

  it('should return neutral for rating 3', () => {
    expect(computeSentimentFromRating(3)).toBe('neutral');
    expect(computeSentimentFromRating('THREE')).toBe('neutral');
  });

  it('should return positive for ratings >= 4', () => {
    expect(computeSentimentFromRating(4)).toBe('positive');
    expect(computeSentimentFromRating(5)).toBe('positive');
    expect(computeSentimentFromRating('FIVE')).toBe('positive');
  });
});

describe('mapTextToTheme', () => {
  it('should map PRIX keywords', () => {
    expect(mapTextToTheme('prix corrects')).toBe('PRIX');
    expect(mapTextToTheme('trop cher')).toBe('PRIX');
    expect(mapTextToTheme('bon rapport qualité/prix')).toBe('PRIX');
    expect(mapTextToTheme('expensive')).toBe('PRIX');
  });

  it('should map SERVICE keywords', () => {
    expect(mapTextToTheme('service excellent')).toBe('SERVICE');
    expect(mapTextToTheme('attente longue')).toBe('SERVICE');
    expect(mapTextToTheme('serveur sympa')).toBe('SERVICE');
  });

  it('should map CUISINE keywords', () => {
    expect(mapTextToTheme('cuisine délicieuse')).toBe('CUISINE');
    expect(mapTextToTheme('plats excellents')).toBe('CUISINE');
    expect(mapTextToTheme('menu varié')).toBe('CUISINE');
  });

  it('should map AMBIANCE keywords', () => {
    expect(mapTextToTheme('ambiance chaleureuse')).toBe('AMBIANCE');
    expect(mapTextToTheme('trop bruyant')).toBe('AMBIANCE');
    expect(mapTextToTheme('musique forte')).toBe('AMBIANCE');
  });

  it('should return null for unrelated text', () => {
    expect(mapTextToTheme('random text')).toBe(null);
    expect(mapTextToTheme('')).toBe(null);
    expect(mapTextToTheme(null)).toBe(null);
  });
});

describe('mapThemeLabel', () => {
  it('should map French theme labels to canonical themes', () => {
    expect(mapThemeLabel('Service')).toBe('SERVICE');
    expect(mapThemeLabel('Cuisine')).toBe('CUISINE');
    expect(mapThemeLabel('Ambiance')).toBe('AMBIANCE');
    expect(mapThemeLabel('Prix')).toBe('PRIX');
    expect(mapThemeLabel('Rapport qualité/prix')).toBe('PRIX');
  });

  it('should handle variations and case', () => {
    expect(mapThemeLabel('service / attente')).toBe('SERVICE');
    expect(mapThemeLabel('CUISINE / PRODUITS')).toBe('CUISINE');
  });
});

describe('extractKeywordsWithSentiment', () => {
  it('should extract keywords with associated sentiment', () => {
    const result = extractKeywordsWithSentiment('Le service était excellent et rapide', 'positive');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(kw => kw.sentiment === 'positive')).toBe(true);
  });

  it('should filter stop words', () => {
    const result = extractKeywordsWithSentiment('très bon service', 'positive');
    expect(result.some(kw => kw.word === 'très')).toBe(false);
    expect(result.some(kw => kw.word === 'bon')).toBe(false); // Stop word
  });

  it('should handle empty text', () => {
    expect(extractKeywordsWithSentiment('', 'positive')).toEqual([]);
  });
});

describe('aggregateKeywords', () => {
  const mockReviews = [
    { text: 'Service excellent, très bon accueil', rating: 5, themes: [{ name: 'Service' }] },
    { text: 'Trop cher pour la qualité', rating: 2, themes: [{ name: 'Prix' }] },
    { text: 'Cuisine délicieuse, ambiance chaleureuse', rating: 4, themes: [{ name: 'Cuisine' }] },
  ];

  it('should aggregate by sentiment', () => {
    const result = aggregateKeywords(mockReviews, 'sentiment');
    
    expect(result.bySentiment).toBeDefined();
    expect(result.bySentiment!.positive.length).toBeGreaterThan(0);
    expect(result.bySentiment!.negative.length).toBeGreaterThan(0);
  });

  it('should aggregate by theme', () => {
    const result = aggregateKeywords(mockReviews, 'theme');
    
    expect(result.byTheme).toBeDefined();
    expect(result.byTheme!.SERVICE.length).toBeGreaterThan(0);
    expect(result.byTheme!.PRIX.length).toBeGreaterThan(0);
    expect(result.byTheme!.CUISINE.length).toBeGreaterThan(0);
  });

  it('should aggregate by frequency', () => {
    const result = aggregateKeywords(mockReviews, 'frequency');
    
    expect(result.byFrequency).toBeDefined();
    expect(result.byFrequency!.length).toBeGreaterThan(0);
    expect(result.byFrequency![0].count).toBeGreaterThan(0);
  });

  it('should handle reviews with negative ratings', () => {
    const negativeReviews = [
      { text: 'Service horrible, attente interminable', rating: 1, themes: [] },
      { text: 'Trop cher, pas de valeur', rating: 2, themes: [] },
    ];
    
    const result = aggregateKeywords(negativeReviews, 'sentiment');
    
    expect(result.bySentiment!.negative.length).toBeGreaterThan(0);
    // Vérifier que les mots négatifs sont bien présents
    const negativeWords = result.bySentiment!.negative.map(kw => kw.word);
    expect(negativeWords.some(w => w.includes('horrible') || w.includes('attente') || w.includes('cher'))).toBe(true);
  });
});
