/**
 * Tests unitaires pour la détection automatique du businessType
 */

import { describe, it, expect } from 'vitest';
import { detectBusinessType, normalizeBusinessType } from '../businessTypeDetection';
import { BusinessType } from '@/config/industry';

describe('businessTypeDetection', () => {
  describe('detectBusinessType', () => {
    it('devrait détecter un restaurant depuis Google Places types', () => {
      const result = detectBusinessType(
        'Le Bistrot',
        ['restaurant', 'food', 'point_of_interest']
      );
      expect(result.type).toBe('restaurant');
      expect(result.confidence).toBeGreaterThanOrEqual(75);
      expect(result.source).toBe('places');
    });

    it('devrait détecter un salon de coiffure depuis keywords', () => {
      const result = detectBusinessType(
        'Salon Coiffure Marie',
        null,
        ['coupe', 'coloration', 'coiffeur']
      );
      expect(result.type).toBe('salon_coiffure');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.source).toBe('keywords');
    });

    it('devrait détecter une salle de sport depuis keywords', () => {
      const result = detectBusinessType(
        'Fitness Center',
        null,
        ['gym', 'entraînement', 'coach', 'musculation']
      );
      expect(result.type).toBe('salle_sport');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('devrait détecter un serrurier depuis keywords', () => {
      const result = detectBusinessType(
        'Serrurier Express',
        null,
        ['serrurier', 'dépannage', 'urgence', 'clé']
      );
      expect(result.type).toBe('serrurier');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('devrait retourner "autre" si aucun match', () => {
      const result = detectBusinessType(
        'Entreprise XYZ',
        null,
        ['service', 'client']
      );
      expect(result.type).toBe('autre');
      expect(result.confidence).toBe(0);
    });

    it('devrait fusionner les candidats Places + Keywords si confidence < 75', () => {
      const result = detectBusinessType(
        'Salon',
        ['beauty_salon'], // Confidence modérée
        ['coiffeur', 'coupe']
      );
      expect(result.candidates.length).toBeGreaterThan(0);
    });
  });

  describe('normalizeBusinessType', () => {
    it('devrait normaliser un type valide', () => {
      expect(normalizeBusinessType('restaurant')).toBe('restaurant');
      expect(normalizeBusinessType('salon_coiffure')).toBe('salon_coiffure');
    });

    it('devrait retourner "autre" pour un type invalide', () => {
      expect(normalizeBusinessType('invalid_type')).toBe('autre');
      expect(normalizeBusinessType(null)).toBe('autre');
      expect(normalizeBusinessType(undefined)).toBe('autre');
    });
  });
});
