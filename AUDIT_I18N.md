# Audit i18n - Textes à traduire

## Structure actuelle
- ✅ Configuration i18n : `src/i18n/config.ts`
- ✅ Fichiers de traduction : `src/i18n/locales/{fr,en,it,es,pt}.json`
- ✅ Hook : `useLanguage()` disponible
- ⚠️ Nombreux textes en dur à remplacer

## Fichiers à modifier

### Pages principales
1. **TableauDeBord.tsx** - Nombreux textes en dur
2. **Etablissement.tsx** - Textes en dur
3. **Compte.tsx** - Textes en dur
4. **Login.tsx** - Textes en dur
5. **Accueil.tsx** - Landing page
6. **Dashboard.tsx** - Dashboard principal
7. **ForgotPassword.tsx** - Textes en dur
8. **ResetPassword.tsx** - Textes en dur
9. **Contact.tsx** - Textes en dur
10. **APropos.tsx** - Textes en dur
11. **Fonctionnalites.tsx** - Textes en dur
12. **Aide.tsx** - Textes en dur

### Composants
1. **MonEtablissementCard.tsx** - Textes en dur
2. **ReviewsVisualPanel.tsx** - Textes en dur
3. **SavedEstablishmentsList.tsx** - Textes en dur
4. **SubscriptionManagementModal.tsx** - Textes en dur
5. **ChangePasswordModal.tsx** - Textes en dur
6. **TrendModal.tsx** - Textes en dur
7. **RatingDistributionModal.tsx** - Textes en dur
8. **SaveEstablishmentButton.tsx** - Textes en dur
9. **ImportAvisToolbar.tsx** - Textes en dur
10. **ImportCsvPanel.tsx** - Textes en dur
11. **PasteImportPanel.tsx** - Textes en dur
12. **Footer.tsx** - Textes en dur
13. **HeroSection.tsx** - Textes en dur
14. **PricingSection.tsx** - Textes en dur

### Utilitaires
1. **generatePdfReport.ts** - Textes en dur dans le PDF

## Textes identifiés dans TableauDeBord.tsx

### À traduire :
- "Bienvenue, {displayName} !"
- "Établissement"
- "Voir mon dashboard"
- "Notifications"
- "{count} avis"
- "Reçus {time}"
- "Aucun avis pour le moment"
- "Note"
- "Augmentée de {delta}"
- "Baisse de {delta}"
- "Stable ({delta})"
- "En attente de données"
- "depuis l'enregistrement"
- "{count}/{total} réponses"
- "Validées"
- "Satisfaction +{delta}%"
- "Performance globale"
- "Indice de satisfaction"
- "Valeur ressentie"
- "Expérience délivrée"
- "Chargement..."
- "Utilisateur"
- "Baseline : {value} fixée le {date}"

## Prochaines étapes

1. Compléter les fichiers de traduction avec toutes les clés manquantes
2. Remplacer progressivement les textes en dur par des clés i18n
3. Tester le changement de langue sur chaque page








