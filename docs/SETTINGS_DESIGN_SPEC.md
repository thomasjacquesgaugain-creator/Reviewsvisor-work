# Design Spec - Compte & Paramètres (Airbnb-inspired)

## Vue d'ensemble

Système de gestion de compte et paramètres inspiré d'Airbnb, adapté à Reviewsvisor.

## 1. AccountMenu (Dropdown)

### Positionnement
- **Trigger** : Avatar + nom dans la NavBar (remplace le lien "/compte")
- **Alignement** : `align="end"` (droite)
- **Largeur** : `w-80` (320px)

### Structure

#### Header (en haut)
- Avatar 48x48px (h-12 w-12)
- Nom complet (font-semibold, text-gray-900)
- Email (text-xs, text-gray-500)
- Établissement actif (si présent)
  - Label "Établissement actif" (text-xs, font-medium, text-gray-500)
  - Icône Building2 + nom (text-sm, font-medium)

#### Sélecteur d'établissement (si plusieurs)
- Liste scrollable (max-h-32)
- Badge "Check" pour l'établissement actif
- Hover: bg-gray-50
- Clic → navigate("/settings/establishments")

#### Menu items
1. Dashboard (LayoutDashboard icon)
2. Établissements (Building2 icon)
3. Messages (MessageSquare icon)
4. Facturation / Abonnement (CreditCard icon)
5. --- Séparateur ---
6. Paramètres du compte (Settings icon)
7. Aide (HelpCircle icon)
8. --- Séparateur ---
9. Déconnexion (LogOut icon, text-red-600, hover:bg-red-50)

### États
- **Active** : bg-blue-50, text-blue-600
- **Hover** : bg-gray-50
- **Focus** : ring-2 ring-blue-500

### Spacing
- Padding menu: `p-0`
- Padding header: `px-4 pt-4 pb-3`
- Padding items: `px-3 py-2.5`
- Gap items: `gap-3`

## 2. SettingsLayout

### Layout Desktop (≥1024px)
- **Container** : max-w-7xl, mx-auto, px-4 sm:px-6 lg:px-8, py-8
- **Background** : bg-gray-50
- **Structure** : flex, gap-8

#### Sidebar (gauche)
- **Width** : w-64 (256px)
- **Position** : sticky, top-8
- **Background** : transparent (hérite du bg-gray-50)
- **Title** : "Paramètres" (text-lg, font-semibold, mb-4)

#### Navigation items
- **Container** : space-y-1
- **Item** :
  - Padding: `px-4 py-2.5`
  - Border radius: `rounded-lg`
  - Gap icon-text: `gap-3`
  - **Active** : bg-blue-50, text-blue-600, font-medium
  - **Hover** : bg-gray-50, text-gray-900
  - **Focus** : ring-2 ring-blue-500

#### Main content (droite)
- **Width** : flex-1, min-w-0
- **Card** : bg-white, rounded-lg, shadow-sm, border border-gray-200
- **Padding** : p-8 (dans chaque page)

### Layout Mobile (<1024px)
- **Sheet** : drawer depuis la gauche (w-80)
- **Trigger** : Button avec Menu icon
- **Content** : même structure que sidebar desktop

## 3. Pages de Settings

### Structure commune
- **Title** : text-2xl, font-semibold, text-gray-900, mb-8
- **Sections** : mb-8, pb-8, border-b border-gray-200
- **Section title** : text-lg, font-medium, text-gray-900, mb-6
- **Section icon** : h-5 w-5, text-gray-400

### ProfileSettings
- Photo de profil (Avatar 80x80px)
- Champs éditables : Prénom, Nom, Nom d'affichage
- Email (read-only)

### SecuritySettings
- Changement de mot de passe (form)
- 2FA (coming soon)
- Sessions actives

### EstablishmentsSettings
- Liste des établissements (cards)
- Badge "Actif" pour l'établissement courant
- Bouton "Définir comme actif"
- Bouton "Gérer"

### NotificationsSettings
- Switches pour chaque type de notification
- Groupes : Email, In-app

### LanguageSettings
- Select pour la langue
- Liste : Français, English, Español

### BillingSettings
- Plan actuel (card avec état)
- Boutons de gestion

## 4. Composants réutilisables

### EditableField
- **Layout** : flex, justify-between, py-4, border-b
- **Label** : text-sm, font-medium, text-gray-500, mb-1
- **Value** : text-sm, text-gray-900
- **Edit button** : variant="ghost", size="sm", Pencil icon
- **Edit mode** :
  - Input/Textarea avec focus ring
  - Boutons Enregistrer/Annuler

## 5. Spacing & Typography

### Spacing scale
- **xs** : 4px (gap-1)
- **sm** : 8px (gap-2, p-2)
- **md** : 16px (gap-4, p-4)
- **lg** : 24px (gap-6, p-6)
- **xl** : 32px (gap-8, p-8)

### Typography
- **Title (h1)** : text-2xl, font-semibold
- **Section (h2)** : text-lg, font-medium
- **Label** : text-sm, font-medium
- **Body** : text-sm
- **Helper** : text-xs, text-gray-500

### Colors
- **Primary** : blue-600
- **Active** : blue-50, blue-600
- **Text primary** : gray-900
- **Text secondary** : gray-500
- **Border** : gray-200
- **Background** : gray-50
- **Card** : white

## 6. Responsive Breakpoints

- **Mobile** : < 640px (sm)
- **Tablet** : 640px - 1024px
- **Desktop** : ≥ 1024px (lg)

## 7. Accessibilité

- **Focus states** : ring-2 ring-blue-500, ring-offset-2
- **Keyboard navigation** : tous les éléments interactifs focusables
- **ARIA labels** : sur les boutons icon-only
- **Contrast** : respect WCAG AA minimum

## 8. Animations & Transitions

- **Hover** : transition-colors, duration-200
- **Focus** : ring animation
- **Sheet** : slide-in animation (Radix)
- **Dropdown** : fade-in/zoom (Radix)

## 9. États de chargement

- **Skeleton** : animate-pulse, bg-gray-200
- **Loading button** : disabled, texte "Mise à jour..."

## 10. Gestion d'erreurs

- **Toast** : sonner pour les succès/erreurs
- **Error state** : text-red-600 sous les inputs
- **Empty state** : message + CTA
