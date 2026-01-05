# Debug - Mise à jour du profil utilisateur

## Structure de la table `profiles`

D'après les migrations Supabase, la table `profiles` contient les colonnes suivantes :

### Colonnes principales :
- `id` (uuid, PRIMARY KEY, auto-généré)
- `user_id` (uuid, UNIQUE, référence auth.users)
- `current_establishment_id` (uuid, nullable, référence establishments)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### Colonnes ajoutées :
- `first_name` (TEXT, nullable)
- `last_name` (TEXT, nullable)
- `display_name` (TEXT, **GENERATED ALWAYS AS** - colonne calculée, ne peut pas être mise à jour)
- `full_name` (TEXT, nullable)
- `company` (TEXT, nullable)
- `phone` (TEXT, nullable)
- `role` (TEXT)

## Requête exécutée dans Compte.tsx

```javascript
const { data, error } = await supabase
  .from("profiles")
  .upsert(
    {
      user_id: user.id,
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      // display_name est RETIRÉ car c'est une colonne générée
    },
    { onConflict: "user_id" }
  );
```

## Politiques RLS (Row Level Security)

### Politique UPDATE actuelle :
```sql
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);
```

**⚠️ PROBLÈME IDENTIFIÉ** : La politique UPDATE manque la clause `WITH CHECK`.

### Migration de correction :
Fichier : `supabase/migrations/20260103072324_fix_profiles_update_policy.sql`

Cette migration ajoute la clause `WITH CHECK` manquante.

## Logs de débogage ajoutés

Dans `src/pages/Compte.tsx`, les logs suivants ont été ajoutés :

1. **Avant la requête** :
   - Structure de la requête (table, opération, données)
   - User ID actuel

2. **En cas d'erreur** :
   - Erreur complète (JSON stringifié)
   - Message, details, hint, code

3. **En cas de succès** :
   - Données retournées

## Instructions pour déboguer

1. Ouvrir la console du navigateur (F12)
2. Aller sur la page Compte
3. Modifier les informations
4. Cliquer sur "Modifier mes informations"
5. Vérifier les logs dans la console pour voir l'erreur exacte

## Problèmes potentiels

1. **Colonne générée** : `display_name` ne peut pas être mise à jour (déjà corrigé)
2. **Politique RLS** : Manque `WITH CHECK` (migration créée)
3. **Nom de table** : Vérifier que c'est bien `profiles` et non `profils`
4. **Clé de conflit** : Vérifier que `user_id` est bien la clé unique

