# Analytique - Plateforme d'Analyse d'Avis Clients

## Description
Application React/TypeScript pour l'analyse d'avis clients d'établissements avec recherche Google Places et base française SIRET.

## Technologies utilisées

- Vite
- TypeScript  
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Backend et Edge Functions)

## Configuration API

### Variables d'environnement requises

#### Edge Functions (Supabase)
- `GOOGLE_MAPS_KEY` : Clé serveur Google (sans restriction de domaine)
  - APIs requises : Places API
  - Restrictions : Aucune (ou IP si déployé sur serveur fixe)

#### Frontend (optionnel pour cartes)
- `VITE_GOOGLE_MAPS_API_KEY` : Clé navigateur Google
  - APIs requises : Maps JavaScript API, Places API
  - Restrictions : HTTP referrers (votre domaine)

### Configuration Google Cloud Platform

1. **Activer les APIs** :
   - Places API (obligatoire)
   - Maps JavaScript API (optionnel, pour affichage cartes)

2. **Créer les clés API** :
   - Clé serveur : sans restriction pour les Edge Functions
   - Clé navigateur : restreinte par domaine pour le frontend

### Erreurs courantes et solutions

- `REQUEST_DENIED` → Vérifier que Places API est activée
- `API_KEY_INVALID` → Vérifier la clé et ses restrictions
- `OVER_QUERY_LIMIT` → Quota dépassé, attendre ou augmenter les limites
- Zéro résultat → Préciser la ville dans la recherche

## Utilisation

### Recherche d'établissement

1. **Recherche Google Places** : 
   - Tapez "Nom + Ville" (ex: "Chez Guy Paris 11")
   - Sélectionnez dans les suggestions
   - Ou collez une URL Google Maps

2. **Recherche base française** :
   - Pour établissements avec SIRET
   - Données officielles du gouvernement

### Fonctionnalités

- Suggestions en temps réel avec debounce
- Navigation clavier (↑/↓/Entrée/Échap)
- Support URL Google Maps
- Fallback vers base française
- Gestion d'erreurs complète

## Développement

### Installation
```bash
npm install
```

### Lancement local
```bash
npm run dev
```
URL locale : http://localhost:8080

### Architecture

- **Frontend** : React + TypeScript + Tailwind CSS
- **Backend** : Supabase Edge Functions
- **APIs** : Google Places + API Entreprises (gouv.fr)

### Edge Functions

- `places-search` : Recherche Google Places avec support URL
- `autocomplete-etablissements-fr` : Base française SIRET

## Tests

### Recherche Google Places
- "Chez Guy Paris 11"
- "Le Duplex Paris" 
- "McDonald's Lyon Part-Dieu"
- Coller URL : https://maps.google.com/...

### Vérification erreurs
- API non activée → `REQUEST_DENIED`
- Quota dépassé → `OVER_QUERY_LIMIT`
- Zéro résultat → message utilisateur

## Configuration de déploiement

Les Edge Functions sont déployées automatiquement avec le code. 
Assurez-vous que les secrets sont configurés dans Supabase.

## Project info (Lovable)

**URL**: https://lovable.dev/projects/69f773ab-2fa2-45af-85a1-20363e9a3b15

### Comment éditer le code

**Utiliser Lovable**
Visitez simplement le [Projet Lovable](https://lovable.dev/projects/69f773ab-2fa2-45af-85a1-20363e9a3b15) et commencez à donner des instructions.

**Utiliser votre IDE préféré**
Clonez ce repo et poussez les changements. Les changements seront reflétés dans Lovable.

### Déploiement

Ouvrez [Lovable](https://lovable.dev/projects/69f773ab-2fa2-45af-85a1-20363e9a3b15) et cliquez sur Share -> Publish.

### Domaine personnalisé

Naviguez vers Project > Settings > Domains et cliquez Connect Domain.
Plus d'infos : [Configuration d'un domaine personnalisé](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)