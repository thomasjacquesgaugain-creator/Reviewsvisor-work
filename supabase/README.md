# Supabase

## Migrations

Les migrations SQL sont **appliquées via le Dashboard Supabase** (SQL Editor ou onglet Migrations), pas via la CLI.

- **Aucun script du projet n'exige `supabase db push`** ni l’installation de la CLI Supabase.
- Les schémas en prod sont considérés déjà à jour ; les fichiers dans `migrations/` servent de référence et peuvent être exécutés manuellement si besoin.
- Si une colonne optionnelle est absente en base, le front utilise un fallback (requêtes sur les colonnes de base uniquement) et ne bloque pas.

## Développement

- Pas besoin d’installer la CLI Supabase pour faire tourner l’app.
- Variables d’environnement Supabase : configurer dans `.env` (voir `.env.example` si présent).
