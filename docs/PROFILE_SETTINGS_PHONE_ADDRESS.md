# Documentation - Champs Téléphone et Adresse Postale

## Vue d'ensemble

Ajout de deux nouveaux champs dans la page "Paramètres > Informations personnelles" :
1. **Numéro de téléphone** (format E.164)
2. **Adresse postale** (string formatée)

## Structure de données

### Table `profiles` (Supabase)

Les colonnes suivantes sont utilisées :

```sql
-- Colonne téléphone (déjà existante dans certaines migrations)
phone TEXT NULLABLE

-- Colonne adresse postale (à ajouter si elle n'existe pas)
postal_address TEXT NULLABLE
```

### Types TypeScript

```typescript
// Dans src/pages/settings/ProfileSettings.tsx
interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  phone: string | null;           // Format E.164 (ex: +33123456789)
  postal_address: string | null;   // Adresse formatée (ex: "1 Cr de la Bôve, 56100 Lorient")
}
```

### Interface PostalAddress (pour évolution future)

```typescript
// Dans src/utils/addressFormatting.ts
export interface PostalAddress {
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country?: string;
}
```

**Note** : Pour l'instant, `postal_address` est stocké comme une string simple. L'interface `PostalAddress` est préparée pour une évolution future vers un format structuré (JSONB).

## Validation

### Numéro de téléphone

**Format E.164** :
- Commence par `+`
- Suivi du code pays (1-3 chiffres)
- Suivi du numéro (4-14 chiffres)
- Exemples valides : `+33123456789`, `+14155552671`

**Fonction de validation** : `src/utils/phoneValidation.ts`
```typescript
validatePhoneNumber(phone: string): { valid: boolean; error?: string }
```

**Formatage d'affichage** : `+33123456789` → `+33 1 23 45 67 89`

### Adresse postale

**Format actuel** : String libre (ex: "1 Cr de la Bôve, 56100 Lorient")

**Évolution future** : Peut être migré vers un objet structuré :
```json
{
  "line1": "1 Cr de la Bôve",
  "line2": "Appartement 3B",
  "postalCode": "56100",
  "city": "Lorient",
  "country": "France"
}
```

## API / Supabase

### Requête SELECT

```typescript
const { data, error } = await supabase
  .from("profiles")
  .select("first_name, last_name, display_name, phone, postal_address")
  .eq("user_id", user.id)
  .single();
```

### Requête UPSERT (mise à jour)

#### Téléphone

```typescript
const { error } = await supabase
  .from("profiles")
  .upsert({
    user_id: user.id,
    phone: value.trim() || null,  // null si vide
  }, {
    onConflict: "user_id",
  });
```

**Payload** :
```json
{
  "user_id": "uuid-here",
  "phone": "+33123456789"
}
```

#### Adresse postale

```typescript
const { error } = await supabase
  .from("profiles")
  .upsert({
    user_id: user.id,
    postal_address: value.trim() || null,  // null si vide
  }, {
    onConflict: "user_id",
  });
```

**Payload** :
```json
{
  "user_id": "uuid-here",
  "postal_address": "1 Cr de la Bôve, 56100 Lorient"
}
```

### Migration SQL (si nécessaire)

Si la colonne `postal_address` n'existe pas encore :

```sql
-- Ajouter la colonne postal_address
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS postal_address TEXT;

-- La colonne phone devrait déjà exister d'après les migrations existantes
-- Si elle n'existe pas :
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;
```

## Composants

### ProfileSettings.tsx

**Nouveaux états** :
```typescript
const [phone, setPhone] = useState("");
const [postalAddress, setPostalAddress] = useState("");
```

**Nouveaux handlers** :
- `handleSavePhone(value: string)` : Valide et sauvegarde le téléphone
- `handleSavePostalAddress(value: string)` : Sauvegarde l'adresse

### EditableField.tsx

**Améliorations** :
- Support du type `"tel"` pour les inputs téléphone
- Support du type `"textarea"` pour les adresses (multi-lignes)
- Prop `emptyLabel` pour personnaliser le message "Information non fournie"

## UX / Comportement

### Affichage

- **Si vide** : Affiche "Information non fournie" (gris)
- **Si renseigné** : Affiche la valeur formatée
  - Téléphone : Formaté avec espaces (ex: `+33 1 23 45 67 89`)
  - Adresse : Affichée telle quelle (sur 1-2 lignes si nécessaire)

### Édition

- **Bouton "Modifier"** : Icône crayon à droite (cohérent avec les autres champs)
- **Mode édition** :
  - Téléphone : Input `type="tel"` avec placeholder `+33123456789`
  - Adresse : Textarea (3 lignes) avec placeholder exemple
- **Validation** :
  - Téléphone : Validation E.164 avant sauvegarde
  - Adresse : Pas de validation stricte (string libre)

### Messages

- **Succès** : Toast "Numéro de téléphone mis à jour" / "Adresse postale mise à jour"
- **Erreur validation** : Toast avec message d'erreur clair
- **Erreur API** : Toast "Erreur lors de la mise à jour"

## Évolution future

### Adresse structurée

Pour migrer vers un format structuré :

1. **Migration SQL** :
```sql
ALTER TABLE public.profiles 
ADD COLUMN postal_address_jsonb JSONB;

-- Migrer les données existantes
UPDATE public.profiles
SET postal_address_jsonb = jsonb_build_object(
  'line1', postal_address
)
WHERE postal_address IS NOT NULL;
```

2. **Mise à jour du code** :
- Utiliser `PostalAddress` interface
- Parser/Formatter avec `parseAddress()` / `formatAddress()`
- Stocker en JSONB dans Supabase

### Autres améliorations possibles

- Autocomplétion d'adresse (Google Places API)
- Validation de code postal par pays
- Formatage automatique du téléphone selon le pays
