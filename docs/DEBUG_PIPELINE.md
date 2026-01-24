# Guide de Debug - Pipeline d'analyse des avis

## Problème observé

- **Mode Sentiment** : Positif et Négatif sont vides, tout va en Neutre
- **Mode Fréquence** : Pas de bloc négatif visible
- **Mode Thème** : "Prix" est vide malgré des mentions de prix dans les avis

## Diagnostic

### 1. Vérifier les données brutes (Network Tab)

1. Ouvrir les DevTools (F12) → Onglet **Network**
2. Filtrer par "reviews" ou "analysis"
3. Inspecter la réponse de l'API `/api/reviews/list` ou `/api/analysis`
4. Vérifier que les avis contiennent :
   - `rating` (numérique 1-5) OU `starRating` (ONE, TWO, THREE, FOUR, FIVE)
   - `text` ou `comment` (texte de l'avis)
   - `themes` (optionnel, array de thèmes)

**Exemple de payload attendu :**
```json
{
  "items": [
    {
      "id": "123",
      "rating": 2,
      "text": "Trop cher pour ce que c'est",
      "themes": [{"name": "Prix"}]
    }
  ]
}
```

### 2. Vérifier la transformation (Console)

Dans la console du navigateur, vérifier les logs :

```javascript
// Vérifier que les avis sont bien chargés
console.log('Reviews:', reviews);

// Vérifier le sentiment calculé
import { computeSentimentFromRating } from '@/utils/reviewProcessing';
reviews.forEach(r => {
  const sentiment = computeSentimentFromRating(r.rating || r.note);
  console.log(`Review ${r.id}: rating=${r.rating}, sentiment=${sentiment}`);
});
```

### 3. Vérifier les agrégations (React DevTools)

1. Installer React DevTools
2. Inspecter le composant `QualitativeSection`
3. Vérifier les props `data.qualitative.topKeywords`
4. Chaque keyword doit avoir un champ `sentiment` : `'positive' | 'neutral' | 'negative'`

**Exemple attendu :**
```javascript
topKeywords: [
  { word: "cher", count: 5, sentiment: "negative" },
  { word: "excellent", count: 8, sentiment: "positive" }
]
```

## Procédure de validation

### Avant correction

1. **Compter les avis négatifs** (rating <= 2) :
   ```javascript
   const negativeCount = reviews.filter(r => (r.rating || r.note) <= 2).length;
   console.log(`Avis négatifs: ${negativeCount}`);
   ```

2. **Vérifier les mots-clés extraits** :
   ```javascript
   import { extractKeywordsWithSentiment } from '@/utils/reviewProcessing';
   const negativeReview = reviews.find(r => (r.rating || r.note) <= 2);
   if (negativeReview) {
     const keywords = extractKeywordsWithSentiment(negativeReview.text, 'negative');
     console.log('Mots-clés négatifs:', keywords);
   }
   ```

3. **Vérifier le mapping des thèmes** :
   ```javascript
   import { mapTextToTheme } from '@/utils/reviewProcessing';
   const prixTexts = ['prix corrects', 'trop cher', 'bon rapport qualité/prix'];
   prixTexts.forEach(text => {
     const theme = mapTextToTheme(text);
     console.log(`${text} → ${theme}`); // Doit retourner "PRIX"
   });
   ```

### Après correction

1. **Vérifier que les modes fonctionnent** :
   - Mode **Fréquence** : Doit afficher des mots-clés dans "Points de friction" si des avis négatifs existent
   - Mode **Sentiment** : Doit afficher des mots-clés dans "Négatif" si des avis négatifs existent
   - Mode **Thème** : Doit afficher des mots-clés dans "Prix" si des mentions de prix existent

2. **Vérification runtime** :
   ```javascript
   // Dans QualitativeSection.tsx, ajouter un useEffect de debug
   useEffect(() => {
     const negativeReviews = reviews?.filter(r => (r.rating || r.note) <= 2) || [];
     if (negativeReviews.length > 0) {
       console.log(`[DEBUG] ${negativeReviews.length} avis négatifs détectés`);
       const negativeKeywords = topKeywords.filter(kw => kw.sentiment === 'negative');
       console.log(`[DEBUG] ${negativeKeywords.length} mots-clés négatifs extraits`);
       if (negativeKeywords.length === 0) {
         console.warn('[DEBUG] PROBLÈME: Des avis négatifs existent mais aucun mot-clé négatif n\'est extrait');
       }
     }
   }, [reviews, topKeywords]);
   ```

## Checklist de modifications

### Backend (si applicable)

- [ ] Normaliser `starRating` → `rating` (1-5) dans l'API
- [ ] Calculer `sentimentLabel` si absent : `rating <= 2 → 'negative'`, `rating == 3 → 'neutral'`, `rating >= 4 → 'positive'`
- [ ] Extraire et mapper les thèmes avec les synonymes complets (PRIX, SERVICE, CUISINE, AMBIANCE)
- [ ] Ne pas absorber les valeurs inconnues en "neutral" (logger + comptage "unknown")

### Frontend

- [x] Créer `src/utils/reviewProcessing.ts` avec :
  - `normalizeRating()` : ONE/TWO/THREE/FOUR/FIVE → 1/2/3/4/5
  - `computeSentimentFromRating()` : rating → sentiment canonique
  - `mapTextToTheme()` : texte → thème canonique (PRIX, SERVICE, etc.)
  - `extractKeywordsWithSentiment()` : extraire mots-clés avec sentiment de l'avis
  - `aggregateKeywords()` : agrégations par sentiment/thème/fréquence

- [x] Modifier `transformAnalysisData.ts` :
  - Utiliser `computeSentimentFromRating()` pour calculer le sentiment
  - Associer le sentiment aux mots-clés lors de l'extraction
  - Utiliser `normalizeRating()` pour normaliser les ratings

- [x] Modifier `QualitativeSection.tsx` :
  - Utiliser le `sentiment` réel des mots-clés (venant de `topKeywords`)
  - Utiliser `mapTextToTheme()` pour le mode Thème
  - Supprimer le fallback automatique en "neutral"

- [x] Mettre à jour `src/types/analysis.ts` :
  - Ajouter `sentiment?: 'positive' | 'neutral' | 'negative'` à `topKeywords`

## Tests unitaires

Exécuter les tests :

```bash
npm test src/utils/reviewProcessing.test.ts
```

Vérifier que :
- `normalizeRating('TWO')` retourne `2`
- `computeSentimentFromRating(2)` retourne `'negative'`
- `mapTextToTheme('trop cher')` retourne `'PRIX'`
- `aggregateKeywords()` avec des avis négatifs retourne des mots-clés dans `bySentiment.negative`

## Résolution des problèmes courants

### Problème : "Tous les mots-clés sont en neutre"

**Cause** : Le sentiment n'est pas calculé ou associé aux mots-clés.

**Solution** :
1. Vérifier que `transformAnalysisData.ts` utilise `computeSentimentFromRating()`
2. Vérifier que `topKeywords` contient bien un champ `sentiment`
3. Vérifier que `QualitativeSection.tsx` utilise `kw.sentiment` et non `classifyWord().sentiment`

### Problème : "Prix est vide"

**Cause** : Le mapping des thèmes ne reconnaît pas les synonymes de prix.

**Solution** :
1. Vérifier que `THEME_SYNONYMS.PRIX` contient tous les synonymes (cher, tarif, expensive, etc.)
2. Vérifier que `mapTextToTheme('prix corrects')` retourne `'PRIX'`
3. Vérifier que le mode Thème utilise `mapTextToTheme()` et non seulement les keywords

### Problème : "Mode Sentiment affiche tout en neutre"

**Cause** : Les avis négatifs ne sont pas détectés ou le sentiment n'est pas propagé.

**Solution** :
1. Vérifier que les avis avec `rating <= 2` sont bien présents dans `reviews`
2. Vérifier que `computeSentimentFromRating(2)` retourne `'negative'`
3. Vérifier que `extractKeywordsWithSentiment()` utilise le bon sentiment
4. Vérifier que `wordsBySentiment.negative` n'est pas vide si des avis négatifs existent
