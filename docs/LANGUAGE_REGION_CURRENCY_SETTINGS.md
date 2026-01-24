# Documentation - Paramètres Langue, Région & Devises

## Vue d'ensemble

Page de paramètres permettant à l'utilisateur de configurer :
1. **Langue de l'interface** (ex: Français, English, Español)
2. **Région** (pays, ex: France, États-Unis)
3. **Devise** (ex: EUR — Euro, USD — Dollar américain)

## Structure des données

### Fichiers de données

**`src/utils/countries.ts`**
- Liste complète des pays (ISO 3166-1 alpha-2)
- Triée alphabétiquement par nom français
- Interface `Country` : `{ code: string, name: string }`
- Fonction `getCountryByCode(code: string)`
- Valeur par défaut : `"FR"` (France)

**`src/utils/currencies.ts`**
- Liste complète des devises (ISO 4217)
- Triée alphabétiquement par nom français
- Interface `Currency` : `{ code: string, name: string }`
- Fonction `getCurrencyByCode(code: string)`
- Valeur par défaut : `"EUR"` (Euro)

### Stockage actuel (localStorage)

**Clés utilisées** :
- `language` : Code langue (ex: "fr", "en", "es")
- `rv_region` : Code pays ISO (ex: "FR", "US")
- `rv_currency` : Code devise ISO (ex: "EUR", "USD")

**Valeurs par défaut** :
- Langue : `"fr"` (ou depuis i18n)
- Région : `"FR"` (France)
- Devise : `"EUR"` (Euro)

### Structure future (Supabase)

**Table `profiles` - Colonnes à ajouter** :
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS locale_language TEXT DEFAULT 'fr',
ADD COLUMN IF NOT EXISTS region_country TEXT DEFAULT 'FR',
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';
```

**Types TypeScript** :
```typescript
interface UserPreferences {
  localeLanguage: string;    // ex: "fr-FR" ou "fr"
  regionCountry: string;     // ex: "FR"
  currency: string;          // ex: "EUR"
}
```

## API / Supabase (TODO)

### Requête SELECT

```typescript
const { data, error } = await supabase
  .from("profiles")
  .select("locale_language, region_country, currency")
  .eq("user_id", user.id)
  .single();
```

### Requête UPSERT

```typescript
const { error } = await supabase
  .from("profiles")
  .upsert({
    user_id: user.id,
    locale_language: language,      // ex: "fr"
    region_country: region,          // ex: "FR"
    currency: currency,              // ex: "EUR"
  }, {
    onConflict: "user_id",
  });
```

**Payload exemple** :
```json
{
  "user_id": "uuid-here",
  "locale_language": "fr",
  "region_country": "FR",
  "currency": "EUR"
}
```

## Composants

### LanguageSettings.tsx

**États** :
```typescript
const [language, setLanguage] = useState("fr");
const [region, setRegion] = useState("FR");
const [currency, setCurrency] = useState("EUR");
```

**Handlers** :
- `handleLanguageChange(newLanguage: string)` : Change la langue i18n + localStorage
- `handleRegionChange(newRegion: string)` : Change la région + localStorage
- `handleCurrencyChange(newCurrency: string)` : Change la devise + localStorage

**Layout** :
- 3 selects empilés verticalement
- Même largeur (`max-w-md`)
- Même style (Select component)
- Même spacing (`space-y-6` entre les champs)
- Textes d'aide identiques en style

### SettingsLayout.tsx

**Menu mis à jour** :
- Label : "Langue, Région & Devises" (au lieu de "Langue & région")
- Path : `/settings/language` (inchangé)

## UX / Comportement

### Affichage

- **Langue** : Liste des langues supportées (Français, English, Español)
- **Région** : Liste complète des pays (ordre alphabétique, noms en français)
- **Devise** : Liste complète des devises (format "CODE — Nom", ex: "EUR — Euro")

### Sélection

- **Select identiques** : Même composant `Select` de shadcn/ui
- **Largeur** : `max-w-md` (cohérent avec le champ langue)
- **Placeholder** : Affiche la valeur sélectionnée

### Sauvegarde

- **localStorage** : Sauvegarde immédiate
- **Toast** : Message de succès ("Langue mise à jour", "Région mise à jour", "Devise mise à jour")
- **TODO** : Intégration Supabase (commentaires dans le code)

### Textes d'aide

- **Langue** : "Cette langue sera utilisée pour l'interface de Reviewsvisor"
- **Région** : "Cette région sera utilisée pour les formats de dates, nombres et adresses"
- **Devise** : "Cette devise sera utilisée pour l'affichage des montants et tarifs"

## Migration SQL (si nécessaire)

```sql
-- Ajouter les colonnes de préférences
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS locale_language TEXT DEFAULT 'fr',
ADD COLUMN IF NOT EXISTS region_country TEXT DEFAULT 'FR',
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';

-- Commentaires pour documentation
COMMENT ON COLUMN public.profiles.locale_language IS 'Language code (e.g., fr, en, es)';
COMMENT ON COLUMN public.profiles.region_country IS 'Country code ISO 3166-1 alpha-2 (e.g., FR, US)';
COMMENT ON COLUMN public.profiles.currency IS 'Currency code ISO 4217 (e.g., EUR, USD)';
```

## Évolution future

### Utilisation des préférences

Les préférences peuvent être utilisées pour :
- **Formatage des dates** : Selon la région (ex: FR → DD/MM/YYYY, US → MM/DD/YYYY)
- **Formatage des nombres** : Séparateurs décimaux selon la région
- **Affichage des prix** : Format monétaire selon la devise
- **Localisation** : Contenu adapté à la région

### Exemple d'utilisation

```typescript
import { getCountryByCode } from "@/utils/countries";
import { getCurrencyByCode } from "@/utils/currencies";

const country = getCountryByCode("FR"); // { code: "FR", name: "France" }
const currency = getCurrencyByCode("EUR"); // { code: "EUR", name: "Euro" }
```

## Accessibilité

- **Labels** : Tous les selects ont un `<Label>` lié via `htmlFor` / `id`
- **Navigation clavier** : Support natif du composant Select (Radix UI)
- **Focus visible** : Géré par shadcn/ui
- **ARIA** : Géré automatiquement par Radix UI
