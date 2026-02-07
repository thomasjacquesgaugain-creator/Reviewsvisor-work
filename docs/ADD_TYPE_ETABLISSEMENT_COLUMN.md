# Ajouter la colonne `type_etablissement` à la table établissements

L’erreur **"Could not find the 'type_etablissement' column of 'établissements' in the schema cache"** signifie que la colonne n’existe pas encore en base.

## Option 1 : Exécuter le SQL dans le dashboard Supabase

1. Ouvrez [Supabase Dashboard](https://supabase.com/dashboard) → votre projet.
2. Allez dans **SQL Editor**.
3. Collez et exécutez :

```sql
-- Colonne type d'établissement (Restaurant, Bar, Café, etc.)
ALTER TABLE "établissements" ADD COLUMN IF NOT EXISTS type_etablissement TEXT;

COMMENT ON COLUMN "établissements".type_etablissement IS 'Catégorie d''établissement : Restaurant, Bar, Café, Hôtel, Boulangerie, Salon de coiffure, Spa / Bien-être, Commerce de détail, Autre. Remplie depuis Google Places API ou éditée par l''utilisateur.';
```

4. Cliquez sur **Run**.

## Option 2 : Utiliser la migration existante

Le fichier **`supabase/migrations/20260131000001_add_type_etablissement_to_etablissements.sql`** contient déjà ce contenu.

- En local avec Supabase CLI : `npx supabase db push`
- Ou exécuter le contenu de ce fichier dans le SQL Editor du dashboard.

## Après avoir ajouté la colonne

Régénérer les types TypeScript (si vous utilisez Supabase CLI) :

```bash
npx supabase gen types typescript --project-id <VOTRE_PROJECT_REF> > src/integrations/supabase/types.ts
```

Ou via le script (si configuré) : `npm run supabase:types`

Les types dans `src/integrations/supabase/types.ts` incluent déjà `type_etablissement` pour la table `établissements` ; la régénération n’est nécessaire que si vous voulez resynchroniser avec le schéma distant.
