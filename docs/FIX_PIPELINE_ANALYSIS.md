# Correction du Pipeline d'Analyse des Avis

## Diagnostic de la cause racine

### Problèmes identifiés

1. **Sentiment non associé aux mots-clés**
   - **Cause** : Dans `transformAnalysisData.ts`, les mots-clés étaient extraits sans sentiment associé
   - **Impact** : Tous les mots-clés finissaient en "neutral" car `classifyWord()` ne regardait que le mot lui-même, pas l'avis d'origine
   - **Fichier** : `src/utils/transformAnalysisData.ts` (lignes 194-224)

2. **Mapping des thèmes incomplet**
   - **Cause** : Le mapping pour "Prix" ne couvrait pas tous les synonymes (cher, tarif, expensive, etc.)
   - **Impact** : Les mentions de prix n'étaient pas détectées dans le mode Thème
   - **Fichier** : `src/components/analysis/QualitativeSection.tsx` (ligne 117)

3. **Fallback automatique en "neutral"**
   - **Cause** : `classifyWord()` retournait toujours "neutral" par défaut
   - **Impact** : Même les mots-clés provenant d'avis négatifs étaient classés en "neutral"
   - **Fichier** : `src/components/analysis/QualitativeSection.tsx` (ligne 152)

4. **Normalisation des ratings non standardisée**
   - **Cause** : Pas de fonction centralisée pour convertir `starRating` (ONE, TWO, etc.) → `rating` (1-5)
   - **Impact** : Incohérences dans le calcul du sentiment selon le format d'entrée
   - **Fichier** : Multiple (ImportCsvPanel, parsePastedReviews, etc.)

## Solutions implémentées

### 1. Création d'utilitaires centralisés (`src/utils/reviewProcessing.ts`)

#### `normalizeRating(rating: any): number`
- Normalise les ratings depuis différents formats (numérique, enum ONE/TWO/THREE/FOUR/FIVE, string) vers 1-5
- Gère les cas limites (clamp, fallback à 3)

#### `computeSentimentFromRating(rating: number | any): CanonicalSentiment`
- Calcule le sentiment canonique : `rating <= 2 → 'negative'`, `rating == 3 → 'neutral'`, `rating >= 4 → 'positive'`
- Utilise `normalizeRating()` en interne

#### `mapTextToTheme(text: string): CanonicalTheme | null`
- Mappe un texte vers un thème canonique (PRIX, SERVICE, CUISINE, AMBIANCE)
- Utilise un dictionnaire complet de synonymes :
  - **PRIX** : prix, tarif, cher, coût, rapport qualité/prix, expensive, price, etc.
  - **SERVICE** : service, serveur, accueil, attente, sympa, etc.
  - **CUISINE** : cuisine, plats, menu, délicieux, etc.
  - **AMBIANCE** : ambiance, bruyant, musique, chaleureux, etc.

#### `extractKeywordsWithSentiment(text: string, reviewSentiment: CanonicalSentiment)`
- Extrait les mots-clés d'un texte avec le sentiment de l'avis associé
- Filtre les stop words
- Retourne `Array<{ word: string; sentiment: CanonicalSentiment }>`

#### `aggregateKeywords(reviews, mode)`
- Agrège les mots-clés par sentiment, thème ou fréquence
- Retourne des structures organisées pour chaque mode

### 2. Modification de `transformAnalysisData.ts`

**Avant** :
```typescript
// Extraction sans sentiment
cleaned.forEach(word => {
  wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
});
```

**Après** :
```typescript
// Calcul du sentiment de l'avis
const rating = normalizeRating(review.note || (review as any).rating || 0);
const reviewSentiment = computeSentimentFromRating(rating);

// Extraction avec sentiment associé
const keywords = extractKeywordsWithSentiment(cleanedText, reviewSentiment);
keywords.forEach(({ word, sentiment }) => {
  // Agrégation avec comptage des sentiments
});
```

### 3. Modification de `QualitativeSection.tsx`

**Avant** :
```typescript
const classification = classifyWord(kw.word);
// Utilisait uniquement le mot, pas l'avis
```

**Après** :
```typescript
const sentiment = kw.sentiment || 'neutral'; // Sentiment réel de l'avis
const classification = classifyWord(kw.word, sentiment);
// Utilise le sentiment réel
```

**Mode Thème** :
- Utilise maintenant `mapTextToTheme()` pour le mapping canonique
- Fallback sur les keywords si le mapping ne trouve rien
- Ne force plus automatiquement en "service" si non assigné

### 4. Mise à jour des types

**`src/types/analysis.ts`** :
```typescript
export interface QualitativeData {
  topKeywords: Array<{ 
    word: string; 
    count: number; 
    sentiment?: 'positive' | 'neutral' | 'negative' // ← Ajouté
  }>;
  // ...
}
```

## Code des fonctions clés

### `normalizeRating()`

```typescript
export function normalizeRating(rating: any): number {
  if (typeof rating === 'number') {
    return Math.max(1, Math.min(5, Math.round(rating)));
  }

  if (typeof rating === 'string') {
    const enumMap: Record<string, number> = {
      'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5
    };
    const upperRating = rating.toUpperCase().trim();
    if (enumMap[upperRating]) return enumMap[upperRating];
    
    const numRating = parseInt(upperRating, 10);
    if (!isNaN(numRating) && numRating >= 1 && numRating <= 5) {
      return numRating;
    }
  }

  console.warn(`[normalizeRating] Rating non reconnu: ${rating}, fallback à 3`);
  return 3;
}
```

### `computeSentimentFromRating()`

```typescript
export function computeSentimentFromRating(rating: number | any): CanonicalSentiment {
  const normalized = normalizeRating(rating);
  
  if (normalized <= 2) return 'negative';
  if (normalized === 3) return 'neutral';
  return 'positive'; // normalized >= 4
}
```

### `mapTextToTheme()` (extrait)

```typescript
const THEME_SYNONYMS: Record<CanonicalTheme, string[]> = {
  PRIX: ['prix', 'tarif', 'cher', 'coût', 'rapport qualité/prix', 'expensive', 'price', ...],
  SERVICE: ['service', 'serveur', 'accueil', 'attente', 'sympa', ...],
  CUISINE: ['cuisine', 'plats', 'menu', 'délicieux', ...],
  AMBIANCE: ['ambiance', 'bruyant', 'musique', 'chaleureux', ...]
};

export function mapTextToTheme(text: string | null | undefined): CanonicalTheme | null {
  if (!text) return null;
  const textLower = text.toLowerCase().trim();
  
  for (const [theme, synonyms] of Object.entries(THEME_SYNONYMS)) {
    if (synonyms.some(synonym => textLower.includes(synonym.toLowerCase()))) {
      return theme as CanonicalTheme;
    }
  }
  return null;
}
```

### `aggregateKeywords()` (structure)

```typescript
export function aggregateKeywords(
  reviews: Array<{ text: string; rating: any; themes?: Array<{ name: string }> }>,
  mode: 'frequency' | 'sentiment' | 'theme'
): {
  bySentiment?: Record<CanonicalSentiment, KeywordAggregation[]>;
  byTheme?: Record<CanonicalTheme, KeywordAggregation[]>;
  byFrequency?: KeywordAggregation[];
}
```

## Procédure de debug

### 1. Vérifier les données brutes (Network Tab)

1. Ouvrir DevTools (F12) → **Network**
2. Filtrer par "reviews" ou "analysis"
3. Inspecter la réponse de l'API
4. Vérifier que les avis contiennent `rating` (1-5) ou `starRating` (ONE, TWO, etc.)

### 2. Vérifier la transformation (Console)

```javascript
import { computeSentimentFromRating, normalizeRating } from '@/utils/reviewProcessing';

// Vérifier la normalisation
console.log(normalizeRating('TWO')); // Doit retourner 2
console.log(normalizeRating(2)); // Doit retourner 2

// Vérifier le sentiment
console.log(computeSentimentFromRating(2)); // Doit retourner 'negative'
console.log(computeSentimentFromRating(4)); // Doit retourner 'positive'

// Vérifier sur les avis réels
reviews.forEach(r => {
  const rating = normalizeRating(r.rating || r.note);
  const sentiment = computeSentimentFromRating(rating);
  console.log(`Review ${r.id}: rating=${rating}, sentiment=${sentiment}`);
});
```

### 3. Vérifier les agrégations (React DevTools)

1. Inspecter `QualitativeSection` → props `data.qualitative.topKeywords`
2. Vérifier que chaque keyword a un champ `sentiment`
3. Vérifier que les mots-clés négatifs sont présents si des avis négatifs existent

### 4. Vérification runtime

Ajouter dans `QualitativeSection.tsx` :

```typescript
useEffect(() => {
  const negativeReviews = reviews?.filter(r => {
    const rating = normalizeRating(r.rating || r.note);
    return rating <= 2;
  }) || [];
  
  if (negativeReviews.length > 0) {
    console.log(`[DEBUG] ${negativeReviews.length} avis négatifs détectés`);
    const negativeKeywords = topKeywords.filter(kw => kw.sentiment === 'negative');
    console.log(`[DEBUG] ${negativeKeywords.length} mots-clés négatifs extraits`);
    
    if (negativeKeywords.length === 0) {
      console.warn('[DEBUG] PROBLÈME: Des avis négatifs existent mais aucun mot-clé négatif');
    }
  }
}, [reviews, topKeywords]);
```

## Procédure de validation

### Avant correction

1. Compter les avis négatifs : `reviews.filter(r => (r.rating || r.note) <= 2).length`
2. Vérifier les mots-clés extraits : `extractKeywordsWithSentiment(negativeReview.text, 'negative')`
3. Vérifier le mapping des thèmes : `mapTextToTheme('prix corrects')` → doit retourner `'PRIX'`

### Après correction

1. **Mode Fréquence** : Doit afficher des mots-clés dans "Points de friction" si des avis négatifs existent
2. **Mode Sentiment** : Doit afficher des mots-clés dans "Négatif" si des avis négatifs existent
3. **Mode Thème** : Doit afficher des mots-clés dans "Prix" si des mentions de prix existent

## Tests unitaires

Exécuter :

```bash
npm test src/utils/reviewProcessing.test.ts
```

Vérifier que :
- ✅ `normalizeRating('TWO')` retourne `2`
- ✅ `computeSentimentFromRating(2)` retourne `'negative'`
- ✅ `mapTextToTheme('trop cher')` retourne `'PRIX'`
- ✅ `aggregateKeywords()` avec des avis négatifs retourne des mots-clés dans `bySentiment.negative`

## Résolution des problèmes courants

### "Tous les mots-clés sont en neutre"

**Solution** :
1. Vérifier que `transformAnalysisData.ts` utilise `computeSentimentFromRating()`
2. Vérifier que `topKeywords` contient bien un champ `sentiment`
3. Vérifier que `QualitativeSection.tsx` utilise `kw.sentiment` et non `classifyWord().sentiment`

### "Prix est vide"

**Solution** :
1. Vérifier que `THEME_SYNONYMS.PRIX` contient tous les synonymes
2. Vérifier que `mapTextToTheme('prix corrects')` retourne `'PRIX'`
3. Vérifier que le mode Thème utilise `mapTextToTheme()`

### "Mode Sentiment affiche tout en neutre"

**Solution** :
1. Vérifier que les avis avec `rating <= 2` sont présents
2. Vérifier que `computeSentimentFromRating(2)` retourne `'negative'`
3. Vérifier que `wordsBySentiment.negative` n'est pas vide

## Checklist de modifications

### Backend (si applicable)

- [ ] Normaliser `starRating` → `rating` (1-5) dans l'API
- [ ] Calculer `sentimentLabel` si absent
- [ ] Extraire et mapper les thèmes avec les synonymes complets
- [ ] Ne pas absorber les valeurs inconnues en "neutral" (logger + comptage "unknown")

### Frontend

- [x] Créer `src/utils/reviewProcessing.ts`
- [x] Modifier `transformAnalysisData.ts`
- [x] Modifier `QualitativeSection.tsx`
- [x] Mettre à jour `src/types/analysis.ts`
- [x] Ajouter tests unitaires
- [x] Créer documentation de debug

## Résultat attendu

Après ces modifications :

1. **Mode Sentiment** : Affiche correctement les mots-clés Positifs / Neutres / Négatifs selon le sentiment réel des avis
2. **Mode Fréquence** : Affiche les mots-clés négatifs dans "Points de friction" si des avis négatifs existent
3. **Mode Thème** : Affiche les mots-clés dans "Prix" si des mentions de prix existent (cher, tarif, expensive, etc.)

Le pipeline est maintenant **robuste**, **canonique** (labels EN/ENUM), et **sans fallback silencieux** en neutre.
