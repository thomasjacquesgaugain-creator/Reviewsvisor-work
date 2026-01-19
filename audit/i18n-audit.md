# i18n Audit (hardcoded texts)

Generated at: 2026-01-19T07:40:55.860Z  
Total extracted strings: **860**

## src/App.tsx (x4)

- L61:19 **[string]** Checking stripe return
- L62:34 **[string]** stripeCheckoutStarted
- L63:35 **[string]** stripeCheckoutStarted
- L86:24 **[string]** z-[9999]

## src/components/AiAssistance.tsx (x2)

- L41:23 **[string]** AI assistance error:
- L65:21 **[string]** Unexpected AI assistance error:

## src/components/AutocompleteEtablissementInline.tsx (x3)

- L28:47 **[jsx_text]** (null);    const debounced = useDebounce(q, 250);   const abortRef = useRef
- L31:49 **[jsx_text]** (null);   const tokenRef = useRef
- L187:54 **[string]** sous l'icône

## src/components/AutocompleteEtablissementsFR.tsx (x3)

- L30:47 **[jsx_text]** (null);   const debounced = useDebounce(q, 250);   const boxRef = useRef
- L53:18 **[string]** Erreur de recherche
- L60:28 **[string]** Erreur de recherche

## src/components/ChangePasswordModal.tsx (x1)

- L8:8 **[string]** @/components/ui/dialog

## src/components/EstablishmentSelector.tsx (x2)

- L65:21 **[string]** Erreur chargement établissements:
- L110:21 **[string]** Erreur sélection établissement:

## src/components/GoogleImportButton.tsx (x19)

- L13:8 **[string]** @/components/ui/dialog
- L54:40 **[jsx_text]** (   name: string,   body?: unknown ): Promise
- L71:21 **[string]** application/json
- L81:13 **[string]** (anon)
- L82:44 **[string]** Bearer ***
- L321:55 **[string]** google-business-accounts
- L361:33 **[string]** API has not been used
- L363:33 **[string]** Enable it by visiting
- L375:33 **[string]** connection not found
- L379:33 **[string]** Access denied
- L416:56 **[string]** google-business-locations
- L493:53 **[string]** google-business-reviews
- L554:95 **[string]** (manquant)
- L559:146 **[string]** (manquant)
- L569:35 **[string]** reviews-visual-anchor
- L577:44 **[string]** reviews:imported
- L608:23 **[string]** SYNC POINTERDOWN
- L613:11 **[string]** w-full pointer-events-auto cursor-pointer relative z-50
- L620:13 **[jsx_text]** ) : hasExistingConnection ? (

## src/components/GoogleOAuthDebugPanel.tsx (x24)

- L68:16 **[string]** Diagnostic chargé
- L69:22 **[string]** Informations OAuth récupérées avec succès
- L103:14 **[string]** Copié
- L137:65 **[jsx_text]** 🔍 Diagnostic OAuth Google
- L158:16 **[jsx_text]** ) : debugInfo ? (
- L162:89 **[jsx_text]** Configuration Frontend
- L171:17 **[attr:label]** Source client_id
- L171:23 **[string]** Source client_id
- L175:17 **[attr:label]** redirect_uri (frontend)
- L175:23 **[string]** redirect_uri (frontend)
- L187:89 **[jsx_text]** URL d'autorisation complète
- L191:17 **[attr:label]** URL OAuth
- L191:23 **[string]** URL OAuth
- L198:89 **[jsx_text]** Configuration Backend (Edge Function)
- L202:17 **[attr:label]** redirect_uri (callback)
- L202:23 **[string]** redirect_uri (callback)
- L208:59 **[string]** ✅ Configuré (GOOGLE_CLIENT_SECRET)
- L208:98 **[string]** ❌ Non configuré
- L211:17 **[attr:label]** Source secret
- L211:23 **[string]** Source secret
- L212:23 **[string]** Variable d'environnement GOOGLE_CLIENT_SECRET (Edge Function)
- L218:24 **[jsx_text]** Note:
- L218:38 **[jsx_text]** Les credentials (client_id et client_secret) proviennent des variables d'environnement                 Supabase configurées dans Paramètres → Variables. Le client_id est utilisé côté frontend,                 le client_secret reste côté backend dans l'Edge Function.
- L225:66 **[jsx_text]** Aucune donnée disponible

## src/components/GooglePlaceAutocomplete.tsx (x1)

- L394:27 **[jsx_text]** = 0 && selectedIndex

## src/components/Header.tsx (x7)

- L37:26 **[string]** thomas.jacquesgaugain@gmail.com
- L62:22 **[string]** hover:bg-gray-800
- L62:44 **[string]** hover:bg-blue-100
- L83:26 **[string]** hover:bg-gray-800
- L83:48 **[string]** hover:bg-blue-50
- L99:24 **[jsx_text]** 🇫🇷 Français
- L100:24 **[jsx_text]** 🇬🇧 English

## src/components/HeroSection.tsx (x7)

- L21:8 **[string]** @/components/ui/dropdown-menu
- L86:43 **[jsx_text]** 🔐
- L161:24 **[jsx_text]** 👤
- L206:86 **[jsx_text]** ➡️
- L207:52 **[jsx_text]** 94%
- L207:91 **[jsx_text]** ➡️
- L208:52 **[jsx_text]** 86%

## src/components/ImportAvisPopover.tsx (x2)

- L279:28 **[string]** .csv
- L333:44 **[jsx_text]** 🔄

## src/components/ImportAvisToolbar.tsx (x2)

- L29:17 **[string]** Avis manuel:
- L34:17 **[string]** Import en masse:

## src/components/ImportCsvPanel.tsx (x11)

- L39:33 **[string]** text/csv
- L39:66 **[string]** .csv
- L40:34 **[string]** application/json
- L40:75 **[string]** .json
- L175:58 **[jsx_text]** line.trim());                      if (lines.length
- L264:49 **[string]** .json
- L350:35 **[string]** reviews-visual-anchor
- L358:44 **[string]** reviews:imported
- L391:13 **[jsx_text]** Google Takeout
- L409:27 **[string]** bg-muted/50
- L429:22 **[string]** .csv,.json

## src/components/ManualReviewPanel.tsx (x2)

- L161:23 **[string]** w-6 h-6 transition-colors
- L191:17 **[string]** min-h-[100px] resize-none

## src/components/MonEtablissementCard.tsx (x4)

- L39:23 **[string]** Erreur chargement établissement actif:
- L58:21 **[string]** Erreur chargement établissement actif:
- L226:18 **[jsx_text]** ) : etab.address ? (
- L284:25 **[string]** btn-analyser-etablissement

## src/components/NavBar.tsx (x4)

- L21:29 **[string]** thomas.jacquesgaugain@gmail.com
- L29:38 **[string]** thomas.jacquesgaugain@gmail.com
- L54:5 **[string]** px-4 py-2 rounded-md font-medium !bg-[#dc2626] !text-white !border !border-[#dc2626] hover:!bg-[#b91c1c] active:!bg-[#991b1b] transition-all duration-200
- L92:36 **[jsx_text]** 📊

## src/components/PasteImportPanel.tsx (x8)

- L43:122 **[jsx_text]** = 1 && r.rating
- L81:25 **[string]** Rapport d'import:
- L90:19 **[string]** Import terminé:
- L104:35 **[string]** reviews-visual-anchor
- L112:44 **[string]** reviews:imported
- L142:77 **[jsx_text]** = 1 && r.rating
- L180:13 **[jsx_text]** Google Takeout
- L259:38 **[jsx_text]** !r.isValid) && (

## src/components/PreSignupSubscriptionCard.tsx (x1)

- L26:32 **[string]** stripeCheckoutStarted

## src/components/PricingSection.tsx (x6)

- L15:21 **[string]** thomas.jacquesgaugain@gmail.com
- L27:32 **[string]** thomas.jacquesgaugain@gmail.com
- L40:23 **[string]** [PricingSection] Admin bypass detected for
- L61:23 **[string]** [PricingSection] Creator bypass for
- L80:32 **[string]** stripeCheckoutStarted
- L86:21 **[string]** Checkout error:

## src/components/Protected.tsx (x1)

- L12:47 **[jsx_text]** Chargement...

## src/components/RatingDistributionModal.tsx (x3)

- L8:8 **[string]** @/components/ui/dialog
- L69:46 **[jsx_text]** = 1 && review.rating
- L132:48 **[jsx_text]** 0 ? (

## src/components/RequireGuest.tsx (x1)

- L15:37 **[string]** thomas.jacquesgaugain@gmail.com

## src/components/RestaurantInput.tsx (x1)

- L37:49 **[jsx_text]** ();   const suggestionRef = useRef

## src/components/ReviewsVisualPanel.tsx (x10)

- L28:8 **[string]** @/components/ui/alert-dialog
- L71:37 **[jsx_text]** pattern.test(trimmed))) return true;      // Note extrême (1 ou 5) avec commentaire très court   if ((rating === 1 || rating === 5) && trimmed.length
- L265:29 **[string]** reviews:imported
- L266:45 **[string]** reviews:imported
- L288:75 **[string]** btn-close-reviews-visual
- L327:33 **[string]** establishment-subtitle
- L332:77 **[string]** btn-close-reviews-visual
- L346:16 **[jsx_text]** : !summary || summary.total === 0 ?
- L534:29 **[string]** establishment-reviews-table
- L544:33 **[string]** btn-delete-all-reviews

## src/components/SavedEstablishmentsList.tsx (x31)

- L92:23 **[string]** Erreur chargement établissements:
- L154:31 **[string]** Erreur lors de la sélection automatique:
- L162:21 **[string]** Erreur lors du chargement de la liste:
- L205:19 **[string]** [SavedEstablishmentsList] handleAddClick triggered
- L211:21 **[string]** [SavedEstablishmentsList] Subscription status:
- L212:21 **[string]** [SavedEstablishmentsList] Current establishments:
- L218:23 **[string]** [SavedEstablishmentsList] User NOT subscribed, showing subscription modal
- L227:23 **[string]** [SavedEstablishmentsList] Quota exceeded, showing addon modal
- L239:21 **[string]** [SavedEstablishmentsList] Under quota, allowing navigation
- L243:21 **[string]** [SavedEstablishmentsList] Error checking subscription:
- L253:19 **[string]** [SavedEstablishmentsList] handleProceedToCheckout triggered
- L271:23 **[string]** [SavedEstablishmentsList] Creator bypass mode
- L277:25 **[string]** [SavedEstablishmentsList] Creator: Activating pro plan first
- L289:25 **[string]** [SavedEstablishmentsList] Creator: Activating addon
- L311:23 **[string]** [SavedEstablishmentsList] Updating addon quantity
- L318:45 **[string]** update-addon-quantity
- L324:25 **[string]** [SavedEstablishmentsList] Update addon error:
- L342:21 **[string]** [SavedEstablishmentsList] Creating new subscription
- L357:21 **[string]** [SavedEstablishmentsList] create-subscription response:
- L363:23 **[string]** [SavedEstablishmentsList] Edge function error:
- L368:23 **[string]** [SavedEstablishmentsList] Response error:
- L380:23 **[string]** [SavedEstablishmentsList] Redirecting to Stripe checkout:
- L382:32 **[string]** stripeCheckoutStarted
- L385:23 **[string]** [SavedEstablishmentsList] No URL in response:
- L389:21 **[string]** [SavedEstablishmentsList] Unexpected error:
- L418:23 **[string]** Erreur définition établissement actif:
- L439:44 **[string]** card-mon-etablissement
- L445:21 **[string]** Erreur:
- L506:149 **[jsx_text]** /mois
- L529:82 **[jsx_text]** /mois
- L571:78 **[jsx_text]** /mois

## src/components/SaveEstablishmentButton.tsx (x24)

- L17:8 **[string]** @/components/ui/dialog
- L23:21 **[string]** thomas.jacquesgaugain@gmail.com
- L98:23 **[string]** [SaveEstablishmentButton] Admin bypass detected for
- L117:21 **[string]** [SaveEstablishmentButton] Creating subscription checkout...
- L125:23 **[string]** [SaveEstablishmentButton] Error creating checkout:
- L134:23 **[string]** [SaveEstablishmentButton] Redirecting to:
- L136:32 **[string]** stripeCheckoutStarted
- L145:23 **[string]** [SaveEstablishmentButton] No URL in response:
- L149:21 **[string]** [SaveEstablishmentButton] Checkout error:
- L189:23 **[string]** Erreur sauvegarde établissements:
- L230:23 **[string]** [SaveEstablishmentButton] Creator bypass for addon
- L244:21 **[string]** [SaveEstablishmentButton] Updating addon quantity to:
- L246:63 **[string]** update-addon-quantity
- L251:23 **[string]** [SaveEstablishmentButton] Update addon error:
- L264:21 **[string]** [SaveEstablishmentButton] Addon error:
- L291:21 **[string]** [SaveEstablishmentButton] Checking subscription status...
- L295:21 **[string]** [SaveEstablishmentButton] Subscription status:
- L296:21 **[string]** [SaveEstablishmentButton] Current establishment count:
- L302:23 **[string]** [SaveEstablishmentButton] No subscription, showing subscription modal
- L312:23 **[string]** [SaveEstablishmentButton] Quota exceeded, showing addon modal
- L323:21 **[string]** [SaveEstablishmentButton] Under quota, saving immediately
- L328:21 **[string]** [SaveEstablishmentButton] Error checking subscription:
- L395:135 **[jsx_text]** +4,99 €/mois
- L421:82 **[jsx_text]** /mois

## src/components/SignUpForm.tsx (x1)

- L306:54 **[string]** confirmPassword-error

## src/components/SignupSection.tsx (x2)

- L22:23 **[jsx_text]** Créer un compte
- L23:29 **[jsx_text]** Remplissez le formulaire ci-dessous pour créer votre compte

## src/components/SubscriptionCard.tsx (x1)

- L28:23 **[string]** [SubscriptionCard] Creator bypass - activating pro plan

## src/components/SubscriptionManagementModal.tsx (x5)

- L8:8 **[string]** @/components/ui/dialog
- L30:8 **[string]** @/components/ui/alert-dialog
- L197:70 **[string]** update-addon-quantity
- L425:33 **[string]** bg-[#F59E0B]
- L494:24 **[jsx_text]** ) : establishments.length === 0 ? (

## src/components/SubscriptionPlanCard.tsx (x1)

- L60:63 **[jsx_text]** /mois

## src/components/TrendModal.tsx (x2)

- L8:8 **[string]** @/components/ui/dialog
- L150:16 **[jsx_text]** ) : hasInsufficientData ? (

## src/components/ui/accordion.tsx (x6)

- L10:50 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L17:4 **[jsx_text]** )) AccordionItem.displayName = "AccordionItem"  const AccordionTrigger = React.forwardRef
- L22:53 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L29:9 **[string]** flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180
- L37:30 **[jsx_text]** )) AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName  const AccordionContent = React.forwardRef
- L42:53 **[jsx_text]** ,   React.ComponentPropsWithoutRef

## src/components/ui/alert-dialog.tsx (x14)

- L14:55 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L19:7 **[string]** fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
- L24:4 **[jsx_text]** )) AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName  const AlertDialogContent = React.forwardRef
- L29:55 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L37:9 **[string]** fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg
- L70:4 **[jsx_text]** ) AlertDialogFooter.displayName = "AlertDialogFooter"  const AlertDialogTitle = React.forwardRef
- L75:53 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L82:4 **[jsx_text]** )) AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName  const AlertDialogDescription = React.forwardRef
- L87:59 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L94:4 **[jsx_text]** )) AlertDialogDescription.displayName =   AlertDialogPrimitive.Description.displayName  const AlertDialogAction = React.forwardRef
- L100:54 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L107:4 **[jsx_text]** )) AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName  const AlertDialogCancel = React.forwardRef
- L112:54 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L119:7 **[string]** mt-2 sm:mt-0

## src/components/ui/alert.tsx (x5)

- L7:3 **[string]** relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground
- L13:11 **[string]** border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive
- L24:38 **[jsx_text]** & VariantProps
- L31:4 **[jsx_text]** )) Alert.displayName = "Alert"  const AlertTitle = React.forwardRef
- L43:4 **[jsx_text]** )) AlertTitle.displayName = "AlertTitle"  const AlertDescription = React.forwardRef

## src/components/ui/avatar.tsx (x5)

- L7:47 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L17:4 **[jsx_text]** )) Avatar.displayName = AvatarPrimitive.Root.displayName  const AvatarImage = React.forwardRef
- L22:48 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L29:4 **[jsx_text]** )) AvatarImage.displayName = AvatarPrimitive.Image.displayName  const AvatarFallback = React.forwardRef
- L34:51 **[jsx_text]** ,   React.ComponentPropsWithoutRef

## src/components/ui/badge.tsx (x1)

- L27:46 **[jsx_text]** ,     VariantProps

## src/components/ui/breadcrumb.tsx (x3)

- L12:77 **[jsx_text]** ) Breadcrumb.displayName = "Breadcrumb"  const BreadcrumbList = React.forwardRef
- L26:4 **[jsx_text]** )) BreadcrumbList.displayName = "BreadcrumbList"  const BreadcrumbItem = React.forwardRef
- L38:4 **[jsx_text]** )) BreadcrumbItem.displayName = "BreadcrumbItem"  const BreadcrumbLink = React.forwardRef

## src/components/ui/button.tsx (x4)

- L8:3 **[string]** inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
- L25:18 **[string]** h-10 px-4 py-2
- L28:15 **[string]** h-10 w-10
- L39:55 **[jsx_text]** ,     VariantProps

## src/components/ui/calendar.tsx (x4)

- L30:30 **[string]** absolute left-1
- L31:26 **[string]** absolute right-1
- L37:15 **[string]** h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20
- L40:11 **[string]** h-9 w-9 p-0 font-normal aria-selected:opacity-100

## src/components/ui/card.tsx (x5)

- L16:4 **[jsx_text]** )) Card.displayName = "Card"  const CardHeader = React.forwardRef
- L28:4 **[jsx_text]** )) CardHeader.displayName = "CardHeader"  const CardTitle = React.forwardRef
- L43:4 **[jsx_text]** )) CardTitle.displayName = "CardTitle"  const CardDescription = React.forwardRef
- L55:4 **[jsx_text]** )) CardDescription.displayName = "CardDescription"  const CardContent = React.forwardRef
- L63:68 **[jsx_text]** )) CardContent.displayName = "CardContent"  const CardFooter = React.forwardRef

## src/components/ui/carousel.tsx (x9)

- L23:50 **[jsx_text]** [0]   api: ReturnType
- L37:21 **[string]** useCarousel must be used within a <Carousel />
- L185:9 **[string]** min-w-0 shrink-0 grow-0 basis-full
- L209:13 **[string]** -left-12 top-1/2 -translate-y-1/2
- L210:13 **[string]** -top-12 left-1/2 -translate-x-1/2 rotate-90
- L218:32 **[jsx_text]** Previous slide
- L238:13 **[string]** -right-12 top-1/2 -translate-y-1/2
- L239:13 **[string]** -bottom-12 left-1/2 -translate-x-1/2 rotate-90
- L247:32 **[jsx_text]** Next slide

## src/components/ui/chart.tsx (x11)

- L7:35 **[string]** .dark
- L29:21 **[string]** useChart must be used within a <ChartContainer />
- L53:11 **[string]** flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none
- L91:9 **[string]** \n
- L95:17 **[string]** \n
- L105:56 **[jsx_text]** &     React.ComponentProps
- L195:19 **[string]** flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground
- L204:41 **[jsx_text]** ) : (                       !hideIndicator && (
- L211:31 **[string]** h-2.5 w-2.5
- L261:29 **[jsx_text]** &     Pick
- L294:17 **[string]** flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground

## src/components/ui/checkbox.tsx (x2)

- L8:49 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L14:7 **[string]** peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground

## src/components/ui/command.tsx (x14)

- L10:43 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L39:49 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L52:8 **[jsx_text]** ))  CommandInput.displayName = CommandPrimitive.Input.displayName  const CommandList = React.forwardRef
- L58:48 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L65:4 **[jsx_text]** ))  CommandList.displayName = CommandPrimitive.List.displayName  const CommandEmpty = React.forwardRef
- L71:49 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L78:4 **[jsx_text]** ))  CommandEmpty.displayName = CommandPrimitive.Empty.displayName  const CommandGroup = React.forwardRef
- L84:49 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L90:7 **[string]** overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground
- L94:4 **[jsx_text]** ))  CommandGroup.displayName = CommandPrimitive.Group.displayName  const CommandSeparator = React.forwardRef
- L100:53 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L107:4 **[jsx_text]** )) CommandSeparator.displayName = CommandPrimitive.Separator.displayName  const CommandItem = React.forwardRef
- L112:48 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L118:7 **[string]** relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50

## src/components/ui/context-menu.tsx (x18)

- L20:58 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L28:7 **[string]** flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground
- L36:36 **[jsx_text]** )) ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName  const ContextMenuSubContent = React.forwardRef
- L41:58 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L47:7 **[string]** z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2
- L51:4 **[jsx_text]** )) ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName  const ContextMenuContent = React.forwardRef
- L56:55 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L63:9 **[string]** z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2
- L68:32 **[jsx_text]** )) ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName  const ContextMenuItem = React.forwardRef
- L73:52 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L86:4 **[jsx_text]** )) ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName  const ContextMenuCheckboxItem = React.forwardRef
- L91:60 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L109:38 **[jsx_text]** )) ContextMenuCheckboxItem.displayName =   ContextMenuPrimitive.CheckboxItem.displayName  const ContextMenuRadioItem = React.forwardRef
- L115:57 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L132:35 **[jsx_text]** )) ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName  const ContextMenuLabel = React.forwardRef
- L137:53 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L150:4 **[jsx_text]** )) ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName  const ContextMenuSeparator = React.forwardRef
- L155:57 **[jsx_text]** ,   React.ComponentPropsWithoutRef

## src/components/ui/dialog.tsx (x8)

- L16:50 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L22:7 **[string]** fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
- L26:4 **[jsx_text]** )) DialogOverlay.displayName = DialogPrimitive.Overlay.displayName  interface DialogContentProps extends React.ComponentPropsWithoutRef
- L43:9 **[string]** fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg
- L84:4 **[jsx_text]** ) DialogFooter.displayName = "DialogFooter"  const DialogTitle = React.forwardRef
- L89:48 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L99:4 **[jsx_text]** )) DialogTitle.displayName = DialogPrimitive.Title.displayName  const DialogDescription = React.forwardRef
- L104:54 **[jsx_text]** ,   React.ComponentPropsWithoutRef

## src/components/ui/drawer.tsx (x8)

- L13:4 **[jsx_text]** ) Drawer.displayName = "Drawer"  const DrawerTrigger = DrawerPrimitive.Trigger  const DrawerPortal = DrawerPrimitive.Portal  const DrawerClose = DrawerPrimitive.Close  const DrawerOverlay = React.forwardRef
- L24:50 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L31:4 **[jsx_text]** )) DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName  const DrawerContent = React.forwardRef
- L36:50 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L74:4 **[jsx_text]** ) DrawerFooter.displayName = "DrawerFooter"  const DrawerTitle = React.forwardRef
- L79:48 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L89:4 **[jsx_text]** )) DrawerTitle.displayName = DrawerPrimitive.Title.displayName  const DrawerDescription = React.forwardRef
- L94:54 **[jsx_text]** ,   React.ComponentPropsWithoutRef

## src/components/ui/dropdown-menu.tsx (x18)

- L20:59 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L28:7 **[string]** flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent
- L36:37 **[jsx_text]** )) DropdownMenuSubTrigger.displayName =   DropdownMenuPrimitive.SubTrigger.displayName  const DropdownMenuSubContent = React.forwardRef
- L42:59 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L48:7 **[string]** z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2
- L52:4 **[jsx_text]** )) DropdownMenuSubContent.displayName =   DropdownMenuPrimitive.SubContent.displayName  const DropdownMenuContent = React.forwardRef
- L58:56 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L66:9 **[string]** z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2
- L71:33 **[jsx_text]** )) DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName  const DropdownMenuItem = React.forwardRef
- L76:53 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L89:4 **[jsx_text]** )) DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName  const DropdownMenuCheckboxItem = React.forwardRef
- L94:61 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L112:39 **[jsx_text]** )) DropdownMenuCheckboxItem.displayName =   DropdownMenuPrimitive.CheckboxItem.displayName  const DropdownMenuRadioItem = React.forwardRef
- L118:58 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L135:36 **[jsx_text]** )) DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName  const DropdownMenuLabel = React.forwardRef
- L140:54 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L153:4 **[jsx_text]** )) DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName  const DropdownMenuSeparator = React.forwardRef
- L158:58 **[jsx_text]** ,   React.ComponentPropsWithoutRef

## src/components/ui/form.tsx (x5)

- L20:39 **[jsx_text]** = FieldPath
- L31:39 **[jsx_text]** = FieldPath
- L50:21 **[string]** useFormField should be used within <FormField>
- L88:46 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L105:31 **[jsx_text]** ,   React.ComponentPropsWithoutRef

## src/components/ui/hover-card.tsx (x2)

- L11:53 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L19:7 **[string]** z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2

## src/components/ui/input-otp.tsx (x7)

- L8:35 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L19:4 **[jsx_text]** )) InputOTP.displayName = "InputOTP"  const InputOTPGroup = React.forwardRef
- L24:25 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L27:77 **[jsx_text]** )) InputOTPGroup.displayName = "InputOTPGroup"  const InputOTPSlot = React.forwardRef
- L32:25 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L43:21 **[string]** z-10 ring-2 ring-ring ring-offset-background
- L60:25 **[jsx_text]** ,   React.ComponentPropsWithoutRef

## src/components/ui/label.tsx (x2)

- L12:46 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L13:60 **[jsx_text]** &     VariantProps

## src/components/ui/menubar.tsx (x23)

- L18:48 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L28:4 **[jsx_text]** )) Menubar.displayName = MenubarPrimitive.Root.displayName  const MenubarTrigger = React.forwardRef
- L33:51 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L39:7 **[string]** flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground
- L43:4 **[jsx_text]** )) MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName  const MenubarSubTrigger = React.forwardRef
- L48:54 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L56:7 **[string]** flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground
- L64:32 **[jsx_text]** )) MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName  const MenubarSubContent = React.forwardRef
- L69:54 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L75:7 **[string]** z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2
- L79:4 **[jsx_text]** )) MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName  const MenubarContent = React.forwardRef
- L84:51 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L98:11 **[string]** z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2
- L103:30 **[jsx_text]** ) ) MenubarContent.displayName = MenubarPrimitive.Content.displayName  const MenubarItem = React.forwardRef
- L109:48 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L122:4 **[jsx_text]** )) MenubarItem.displayName = MenubarPrimitive.Item.displayName  const MenubarCheckboxItem = React.forwardRef
- L127:56 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L145:34 **[jsx_text]** )) MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName  const MenubarRadioItem = React.forwardRef
- L150:53 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L167:31 **[jsx_text]** )) MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName  const MenubarLabel = React.forwardRef
- L172:49 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L185:4 **[jsx_text]** )) MenubarLabel.displayName = MenubarPrimitive.Label.displayName  const MenubarSeparator = React.forwardRef
- L190:53 **[jsx_text]** ,   React.ComponentPropsWithoutRef

## src/components/ui/navigation-menu.tsx (x15)

- L9:55 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L22:33 **[jsx_text]** )) NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName  const NavigationMenuList = React.forwardRef
- L27:55 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L37:4 **[jsx_text]** )) NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName  const NavigationMenuItem = NavigationMenuPrimitive.Item  const navigationMenuTriggerStyle = cva(   "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50" )  const NavigationMenuTrigger = React.forwardRef
- L44:3 **[string]** group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50
- L48:58 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L61:36 **[jsx_text]** )) NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName  const NavigationMenuContent = React.forwardRef
- L66:58 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L72:7 **[string]** left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto
- L76:4 **[jsx_text]** )) NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName  const NavigationMenuLink = NavigationMenuPrimitive.Link  const NavigationMenuViewport = React.forwardRef
- L83:59 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L89:9 **[string]** origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]
- L95:8 **[jsx_text]** )) NavigationMenuViewport.displayName =   NavigationMenuPrimitive.Viewport.displayName  const NavigationMenuIndicator = React.forwardRef
- L101:60 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L107:7 **[string]** top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in

## src/components/ui/pagination.tsx (x8)

- L13:4 **[jsx_text]** ) Pagination.displayName = "Pagination"  const PaginationContent = React.forwardRef
- L25:4 **[jsx_text]** )) PaginationContent.displayName = "PaginationContent"  const PaginationItem = React.forwardRef
- L39:29 **[jsx_text]** &   React.ComponentProps
- L67:5 **[attr:aria-label]** Go to previous page
- L67:16 **[string]** Go to previous page
- L83:5 **[attr:aria-label]** Go to next page
- L83:16 **[string]** Go to next page
- L104:30 **[jsx_text]** More pages

## src/components/ui/popover.tsx (x2)

- L11:51 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L20:9 **[string]** z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2

## src/components/ui/progress.tsx (x1)

- L7:49 **[jsx_text]** ,   React.ComponentPropsWithoutRef

## src/components/ui/radio-group.tsx (x2)

- L8:51 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L22:51 **[jsx_text]** ,   React.ComponentPropsWithoutRef

## src/components/ui/resizable.tsx (x2)

- L12:7 **[string]** flex h-full w-full data-[panel-group-direction=vertical]:flex-col
- L30:7 **[string]** relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90

## src/components/ui/scroll-area.tsx (x3)

- L7:51 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L20:29 **[jsx_text]** )) ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName  const ScrollBar = React.forwardRef
- L25:66 **[jsx_text]** ,   React.ComponentPropsWithoutRef

## src/components/ui/select.tsx (x17)

- L14:50 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L20:7 **[string]** flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1
- L29:28 **[jsx_text]** )) SelectTrigger.displayName = SelectPrimitive.Trigger.displayName  const SelectScrollUpButton = React.forwardRef
- L34:57 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L46:35 **[jsx_text]** )) SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName  const SelectScrollDownButton = React.forwardRef
- L51:59 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L63:37 **[jsx_text]** )) SelectScrollDownButton.displayName =   SelectPrimitive.ScrollDownButton.displayName  const SelectContent = React.forwardRef
- L69:50 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L76:9 **[string]** relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2
- L78:11 **[string]** data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1
- L89:13 **[string]** h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]
- L96:27 **[jsx_text]** )) SelectContent.displayName = SelectPrimitive.Content.displayName  const SelectLabel = React.forwardRef
- L101:48 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L108:4 **[jsx_text]** )) SelectLabel.displayName = SelectPrimitive.Label.displayName  const SelectItem = React.forwardRef
- L113:47 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L131:25 **[jsx_text]** )) SelectItem.displayName = SelectPrimitive.Item.displayName  const SelectSeparator = React.forwardRef
- L136:52 **[jsx_text]** ,   React.ComponentPropsWithoutRef

## src/components/ui/separator.tsx (x3)

- L7:50 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L20:40 **[string]** h-[1px] w-full
- L20:59 **[string]** h-full w-[1px]

## src/components/ui/sheet.tsx (x12)

- L17:49 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L22:7 **[string]** fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
- L32:3 **[string]** fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500
- L36:14 **[string]** inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top
- L38:11 **[string]** inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom
- L39:15 **[string]** inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm
- L41:11 **[string]** inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm
- L51:71 **[jsx_text]** ,   VariantProps
- L99:4 **[jsx_text]** ) SheetFooter.displayName = "SheetFooter"  const SheetTitle = React.forwardRef
- L104:47 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L111:4 **[jsx_text]** )) SheetTitle.displayName = SheetPrimitive.Title.displayName  const SheetDescription = React.forwardRef
- L116:53 **[jsx_text]** ,   React.ComponentPropsWithoutRef

## src/components/ui/sidebar.tsx (x57)

- L18:8 **[string]** @/components/ui/tooltip
- L20:29 **[string]** sidebar:state
- L42:21 **[string]** useSidebar must be used within a SidebarProvider.
- L142:15 **[string]** group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar
- L226:13 **[string]** group-data-[collapsible=offcanvas]:w-0
- L227:13 **[string]** group-data-[side=right]:rotate-180
- L229:17 **[string]** group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]
- L230:17 **[string]** group-data-[collapsible=icon]:w-[--sidebar-width-icon]
- L237:17 **[string]** left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]
- L238:17 **[string]** right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]
- L241:17 **[string]** p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]
- L242:17 **[string]** group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l
- L261:33 **[jsx_text]** ,   React.ComponentProps
- L280:32 **[jsx_text]** Toggle Sidebar
- L296:7 **[attr:aria-label]** Toggle Sidebar
- L296:18 **[string]** Toggle Sidebar
- L299:7 **[attr:title]** Toggle Sidebar
- L299:13 **[string]** Toggle Sidebar
- L301:9 **[string]** absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex
- L302:9 **[string]** [[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize
- L303:9 **[string]** [[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize
- L304:9 **[string]** group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar
- L305:9 **[string]** [[data-side=left][data-collapsible=offcanvas]_&]:-right-2
- L306:9 **[string]** [[data-side=right][data-collapsible=offcanvas]_&]:-left-2
- L324:9 **[string]** peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow
- L334:32 **[jsx_text]** ,   React.ComponentProps
- L382:36 **[jsx_text]** ,   React.ComponentProps
- L405:9 **[string]** flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden
- L440:9 **[string]** duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0
- L441:9 **[string]** group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0
- L461:9 **[string]** absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0
- L463:9 **[string]** after:absolute after:-inset-2 after:md:hidden
- L464:9 **[string]** group-data-[collapsible=icon]:hidden
- L482:4 **[jsx_text]** )) SidebarGroupContent.displayName = "SidebarGroupContent"  const SidebarMenu = React.forwardRef
- L495:4 **[jsx_text]** )) SidebarMenu.displayName = "SidebarMenu"  const SidebarMenuItem = React.forwardRef
- L513:3 **[string]** peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0
- L519:11 **[string]** bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]
- L524:13 **[string]** h-12 text-sm group-data-[collapsible=icon]:!p-0
- L607:9 **[string]** absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0
- L609:9 **[string]** after:absolute after:-inset-2 after:md:hidden
- L610:9 **[string]** peer-data-[size=sm]/menu-button:top-1
- L611:9 **[string]** peer-data-[size=default]/menu-button:top-1.5
- L612:9 **[string]** peer-data-[size=lg]/menu-button:top-2.5
- L613:9 **[string]** group-data-[collapsible=icon]:hidden
- L615:11 **[string]** group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0
- L633:7 **[string]** peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground
- L634:7 **[string]** peer-data-[size=sm]/menu-button:top-1
- L635:7 **[string]** peer-data-[size=default]/menu-button:top-1.5
- L636:7 **[string]** peer-data-[size=lg]/menu-button:top-2.5
- L637:7 **[string]** group-data-[collapsible=icon]:hidden
- L641:4 **[jsx_text]** )) SidebarMenuBadge.displayName = "SidebarMenuBadge"  const SidebarMenuSkeleton = React.forwardRef
- L692:7 **[string]** group-data-[collapsible=icon]:hidden
- L696:4 **[jsx_text]** )) SidebarMenuSub.displayName = "SidebarMenuSub"  const SidebarMenuSubItem = React.forwardRef
- L703:52 **[jsx_text]** ) SidebarMenuSubItem.displayName = "SidebarMenuSubItem"  const SidebarMenuSubButton = React.forwardRef
- L723:9 **[string]** flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground
- L724:9 **[string]** data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground
- L727:9 **[string]** group-data-[collapsible=icon]:hidden

## src/components/ui/sonner.tsx (x1)

- L18:24 **[string]** group-[.toast]:text-muted-foreground

## src/components/ui/switch.tsx (x3)

- L7:48 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L12:7 **[string]** peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input
- L20:9 **[string]** pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0

## src/components/ui/table.tsx (x10)

- L15:8 **[jsx_text]** )) Table.displayName = "Table"  const TableHeader = React.forwardRef
- L23:77 **[jsx_text]** )) TableHeader.displayName = "TableHeader"  const TableBody = React.forwardRef
- L35:4 **[jsx_text]** )) TableBody.displayName = "TableBody"  const TableFooter = React.forwardRef
- L46:7 **[string]** border-t bg-muted/50 font-medium [&>tr]:last:border-b-0
- L50:4 **[jsx_text]** )) TableFooter.displayName = "TableFooter"  const TableRow = React.forwardRef
- L61:7 **[string]** border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted
- L65:4 **[jsx_text]** )) TableRow.displayName = "TableRow"  const TableHead = React.forwardRef
- L76:7 **[string]** h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0
- L80:4 **[jsx_text]** )) TableHead.displayName = "TableHead"  const TableCell = React.forwardRef
- L92:4 **[jsx_text]** )) TableCell.displayName = "TableCell"  const TableCaption = React.forwardRef

## src/components/ui/tabs.tsx (x7)

- L9:45 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L19:4 **[jsx_text]** )) TabsList.displayName = TabsPrimitive.List.displayName  const TabsTrigger = React.forwardRef
- L24:48 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L30:7 **[string]** inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm
- L34:4 **[jsx_text]** )) TabsTrigger.displayName = TabsPrimitive.Trigger.displayName  const TabsContent = React.forwardRef
- L39:48 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L45:7 **[string]** mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2

## src/components/ui/toast.tsx (x13)

- L11:51 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L26:3 **[string]** group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full
- L42:47 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L43:61 **[jsx_text]** &     VariantProps
- L57:49 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L67:4 **[jsx_text]** )) ToastAction.displayName = ToastPrimitives.Action.displayName  const ToastClose = React.forwardRef
- L72:48 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L85:26 **[jsx_text]** )) ToastClose.displayName = ToastPrimitives.Close.displayName  const ToastTitle = React.forwardRef
- L90:48 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L97:4 **[jsx_text]** )) ToastTitle.displayName = ToastPrimitives.Title.displayName  const ToastDescription = React.forwardRef
- L102:54 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L109:4 **[jsx_text]** )) ToastDescription.displayName = ToastPrimitives.Description.displayName  type ToastProps = React.ComponentPropsWithoutRef
- L113:62 **[jsx_text]** type ToastActionElement = React.ReactElement

## src/components/ui/toaster.tsx (x1)

- L9:8 **[string]** @/components/ui/toast

## src/components/ui/toggle-group.tsx (x5)

- L16:52 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L17:66 **[jsx_text]** &     VariantProps
- L28:30 **[jsx_text]** ))  ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName  const ToggleGroupItem = React.forwardRef
- L34:52 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L35:66 **[jsx_text]** &     VariantProps

## src/components/ui/toggle.tsx (x6)

- L8:3 **[string]** inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground
- L17:18 **[string]** h-10 px-3
- L18:13 **[string]** h-9 px-2.5
- L19:13 **[string]** h-11 px-5
- L30:47 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L31:61 **[jsx_text]** &     VariantProps

## src/components/ui/tooltip.tsx (x2)

- L13:51 **[jsx_text]** ,   React.ComponentPropsWithoutRef
- L20:7 **[string]** z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2

## src/components/WhyReviewsvisor.tsx (x4)

- L37:66 **[jsx_text]** 🎯
- L50:66 **[jsx_text]** 🧠
- L63:82 **[jsx_text]** 📈
- L78:18 **[jsx_text]** 💵

## src/config/subscriptionPlans.ts (x17)

- L20:11 **[string]** Abonnement Pro
- L23:18 **[string]** 14 jours offerts, puis 14,99 €/mois – engagement 12 mois
- L24:12 **[string]** 💎 Meilleur prix
- L26:14 **[string]** price_1SZT7tGkt979eNWB0MF2xczP
- L29:7 **[string]** Accès complet à Reviewsvisor
- L30:7 **[string]** 14 jours offerts
- L31:7 **[string]** Engagement 12 mois
- L37:11 **[string]** Abonnement Pro
- L40:18 **[string]** Sans engagement
- L41:12 **[string]** ⚡ Flexible
- L43:14 **[string]** price_1SXnCbGkt979eNWBttiTM124
- L46:7 **[string]** Accès complet à Reviewsvisor
- L47:7 **[string]** Sans engagement
- L48:7 **[string]** Résiliable à tout moment
- L56:9 **[string]** Établissement supplémentaire
- L59:12 **[string]** price_1ShiPzGkt979eNWBSDapH7aJ
- L60:15 **[string]** addon_multi_etablissements_499

## src/contexts/AuthProvider.tsx (x2)

- L22:21 **[string]** Invité
- L63:10 **[string]** Invité

## src/hooks/use-toast.ts (x1)

- L6:8 **[string]** @/components/ui/toast

## src/hooks/useCreatorBypass.ts (x20)

- L7:32 **[string]** thomas.jacquesgaugain@gmail.com
- L13:31 **[string]** addon_multi_etablissements_499
- L29:26 **[string]** activate-creator-subscription
- L37:22 **[string]** [useCreatorBypass] Client-side creator check failed
- L38:41 **[string]** Non autorisé
- L44:23 **[string]** [useCreatorBypass] Session error:
- L45:9 **[toast:error]** Erreur: Session non disponible
- L45:21 **[string]** Erreur: Session non disponible
- L46:41 **[string]** Session non disponible
- L49:19 **[string]** [useCreatorBypass] Session valid, invoking edge function...
- L55:19 **[string]** [useCreatorBypass] Edge function response:
- L58:23 **[string]** [useCreatorBypass] Edge function error:
- L66:73 **[string]** Erreur inconnue
- L72:21 **[string]** [useCreatorBypass] Activation successful
- L73:9 **[toast:success]** Activé (mode créateur)
- L73:23 **[string]** Activé (mode créateur)
- L76:41 **[string]** Erreur inconnue
- L77:22 **[string]** [useCreatorBypass] Activation failed:
- L82:65 **[string]** Erreur inattendue
- L83:21 **[string]** [useCreatorBypass] Unexpected error:

## src/hooks/useEstablishmentSearch.ts (x2)

- L27:47 **[jsx_text]** ([]);   const sessionRef = useRef
- L28:32 **[jsx_text]** (null);   const debounceRef = useRef

## src/lib/establishmentBilling.ts (x2)

- L18:7 **[string]** update-establishment-quantity
- L26:45 **[string]** No response from server

## src/lib/loadGoogleMaps.ts (x1)

- L3:32 **[jsx_text]** | null = null; let isLoaded = false;  export async function loadGoogleMaps(): Promise

## src/lib/loadGooglePlaces.ts (x1)

- L1:26 **[jsx_text]** | null = null;  export function loadGooglePlaces(): Promise

## src/lib/reponses.ts (x4)

- L47:69 **[jsx_text]** r.id));      // Éviter le sur-comptage : certaines entrées dans `reponses` peuvent référencer des avis qui     // n'existent plus dans `reviews` (ou ne font pas partie du périmètre courant).     const validatedIdsInReviews = new Set
- L52:36 **[jsx_text]** reviewIds.has(id))     );      const directRespondedIds = new Set
- L92:21 **[string]** Vous devez être connecté pour valider une réponse
- L117:38 **[string]** Erreur lors de la validation de la réponse

## src/lib/stripe.ts (x3)

- L21:15 **[string]** price_1SSJ0sGkt979eNWBhN9cZmG2
- L22:11 **[string]** Abonnement Pro
- L23:12 **[string]** 14,99€/mois

## src/pages/Abonnement.tsx (x1)

- L8:37 **[string]** thomas.jacquesgaugain@gmail.com

## src/pages/Compte.tsx (x3)

- L85:22 **[string]** Could not load current establishment:
- L145:24 **[string]** Could not reload establishment:
- L362:21 **[string]** [Compte] Erreur complète lors de la mise à jour du compte:

## src/pages/Contact.tsx (x2)

- L55:24 **[string]** mailto:contact@reviewsvisor.fr
- L58:110 **[jsx_text]** contact@reviewsvisor.fr

## src/pages/Dashboard.tsx (x160)

- L235:27 **[jsx_text]** (prev
- L516:21 **[jsx_text]** b.length - a.length)       .map(escapeRegExp)       .join('|');     if (!escaped) return raw;      // Bornes de mot unicode (lettres/chiffres) pour éviter les match partiels.     const re = new RegExp(`(?
- L539:53 **[jsx_text]** (r?.rating ?? 0)
- L544:16 **[string]** Temps d'attente
- L624:7 **[string]** service / attente
- L625:7 **[string]** qualité des plats
- L627:7 **[string]** qualité / goût
- L628:7 **[string]** ambiance agréable
- L629:7 **[string]** rapidité
- L633:7 **[string]** rapport qualité/prix
- L841:58 **[jsx_text]** (r.rating || 0)
- L893:26 **[jsx_text]** = 4.0 && avgRating
- L1036:58 **[jsx_text]** (r.rating || 0)
- L1330:21 **[string]** [Dashboard] Erreur chargement établissements:
- L1346:29 **[string]** establishment:updated
- L1349:34 **[string]** establishment:updated
- L1473:29 **[jsx_text]** (b.rating || 0) - (a.rating || 0))               .slice(0, 5);             setTopReviews(bestReviews);                          // Top 5 pires avis (note
- L1479:26 **[jsx_text]** r.rating && r.rating
- L1480:29 **[jsx_text]** (a.rating || 0) - (b.rating || 0))               .slice(0, 5);             setWorstReviews(badReviews);                          // Calculer les stats par plateforme             const statsByPlatform: Record
- L1622:52 **[jsx_text]** | null = null;     let refreshTimeout: ReturnType
- L1868:34 **[jsx_text]** ) : establishments.length === 0 ? (
- L1906:70 **[string]** establishment:updated
- L1933:27 **[string]** Importer vos avis
- L1993:42 **[jsx_text]** r.rating && r.rating
- L2231:39 **[string]** année
- L2237:38 **[jsx_text]** 0 ? (
- L2301:26 **[jsx_text]** ))                 ) : (
- L2336:26 **[jsx_text]** ))                 ) : (
- L2402:77 **[jsx_text]** 78%
- L2449:38 **[jsx_text]** = 4) positiveCount++;                           else if (rating
- L2752:65 **[string]** \u00A0
- L2819:65 **[string]** \u00A0
- L3041:65 **[string]** \u00A0
- L3406:24 **[jsx_text]** ))               ) : (
- L3487:57 **[string]** Conseils personnalisés basés sur l'analyse de vos avis clients
- L3620:49 **[jsx_text]** Assistant IA pour répondre à vos avis
- L3631:49 **[jsx_text]** Assistant IA pour répondre à vos avis
- L3636:53 **[jsx_text]** L'agent IA analyse automatiquement vos avis et génère des réponses personnalisées adaptées à chaque situation.
- L3644:69 **[jsx_text]** Réponses automatiques intelligentes
- L3645:62 **[jsx_text]** Génération de réponses adaptées au ton et au contenu de chaque avis
- L3651:69 **[jsx_text]** Personnalisation avancée
- L3652:62 **[jsx_text]** Adaptation du style et du contenu selon le type d'avis (positif, négatif, neutre)
- L3658:69 **[jsx_text]** Validation avant envoi
- L3659:62 **[jsx_text]** Vous pouvez modifier et valider chaque réponse avant de la publier
- L3856:39 **[jsx_text]** ) : hasAiResponse ? (
- L4038:52 **[jsx_text]** Centre de réponse
- L4039:51 **[jsx_text]** Gérez vos réponses aux avis clients
- L4053:57 **[jsx_text]** En attente
- L4069:57 **[jsx_text]** Répondu
- L4098:57 **[jsx_text]** Validées
- L4113:58 **[jsx_text]** Analyse du contenu
- L4114:57 **[jsx_text]** Classification IA des avis
- L4130:60 **[jsx_text]** Filtrer par note
- L4131:59 **[jsx_text]** Avis classés par étoiles
- L4147:60 **[jsx_text]** Priorité
- L4148:59 **[jsx_text]** Avis classés par urgence
- L4165:59 **[jsx_text]** Avis classés par source
- L4209:43 **[string]** Avec une plainte
- L4219:71 **[jsx_text]** 🔴 Avec une plainte
- L4264:69 **[string]** Date d'importation
- L4272:54 **[string]** Répondu
- L4272:66 **[string]** En attente
- L4280:39 **[jsx_text]** Voir la réponse
- L4293:74 **[jsx_text]** Répondre
- L4303:89 **[jsx_text]** Réponse publiée :
- L4305:112 **[string]** Merci pour votre avis, nous sommes ravis que vous ayez apprécié votre expérience !
- L4321:29 **[string]** Contient une suggestion
- L4331:74 **[jsx_text]** 💡 Contient une suggestion
- L4375:69 **[string]** Date d'importation
- L4383:54 **[string]** Répondu
- L4383:66 **[string]** En attente
- L4391:39 **[jsx_text]** Voir la réponse
- L4404:74 **[jsx_text]** Répondre
- L4419:29 **[string]** Ton négatif détecté
- L4429:74 **[jsx_text]** 😠 Ton négatif détecté
- L4473:69 **[string]** Date d'importation
- L4481:54 **[string]** Répondu
- L4481:66 **[string]** En attente
- L4489:39 **[jsx_text]** Voir la réponse
- L4502:74 **[jsx_text]** Répondre
- L4517:29 **[string]** Avis positif
- L4527:73 **[jsx_text]** 👍 Avis positif
- L4571:69 **[string]** Date d'importation
- L4579:54 **[string]** Répondu
- L4579:66 **[string]** En attente
- L4584:72 **[jsx_text]** Répondre
- L4603:33 **[string]** 1-2 étoiles
- L4605:85 **[jsx_text]** = 1 && r.rating
- L4613:75 **[jsx_text]** ⭐ 1-2 étoiles
- L4657:73 **[string]** Date d'importation
- L4665:58 **[string]** Répondu
- L4665:70 **[string]** En attente
- L4670:97 **[jsx_text]** Voir la réponse
- L4675:78 **[jsx_text]** Répondre
- L4690:33 **[string]** 3 étoiles
- L4700:78 **[jsx_text]** ⭐ 3 étoiles
- L4745:58 **[string]** Répondu
- L4745:70 **[string]** En attente
- L4750:97 **[jsx_text]** Voir la réponse
- L4755:78 **[jsx_text]** Répondre
- L4770:33 **[string]** 4-5 étoiles
- L4772:86 **[jsx_text]** = 4 && r.rating
- L4780:77 **[jsx_text]** ⭐ 4-5 étoiles
- L4825:58 **[string]** Répondu
- L4825:70 **[string]** En attente
- L4830:97 **[jsx_text]** Voir la réponse
- L4835:78 **[jsx_text]** Répondre
- L4855:33 **[string]** Priorité haute
- L4869:75 **[jsx_text]** 🔥 Priorité haute
- L4914:58 **[string]** Répondu
- L4914:70 **[string]** En attente
- L4919:97 **[jsx_text]** Voir la réponse
- L4924:78 **[jsx_text]** Répondre
- L4939:33 **[string]** À surveiller
- L4949:78 **[jsx_text]** ⚠️ À surveiller
- L4994:58 **[string]** Répondu
- L4994:70 **[string]** En attente
- L4999:97 **[jsx_text]** Voir la réponse
- L5004:78 **[jsx_text]** Répondre
- L5019:33 **[string]** Réponses rapides
- L5029:77 **[jsx_text]** ✅ Réponses rapides
- L5074:58 **[string]** Répondu
- L5074:70 **[string]** En attente
- L5079:97 **[jsx_text]** Voir la réponse
- L5084:78 **[jsx_text]** Répondre
- L5159:58 **[string]** Répondu
- L5159:70 **[string]** En attente
- L5164:97 **[jsx_text]** Voir la réponse
- L5169:78 **[jsx_text]** Répondre
- L5239:58 **[string]** Répondu
- L5239:70 **[string]** En attente
- L5244:97 **[jsx_text]** Voir la réponse
- L5249:78 **[jsx_text]** Répondre
- L5319:58 **[string]** Répondu
- L5319:70 **[string]** En attente
- L5324:97 **[jsx_text]** Voir la réponse
- L5329:78 **[jsx_text]** Répondre
- L5404:60 **[string]** Répondu
- L5404:72 **[string]** En attente
- L5409:78 **[jsx_text]** Répondre
- L5425:25 **[jsx_text]** ) : (                         /* Tableau par défaut - toujours visible quand aucune carte de groupement n'est ouverte */
- L5471:60 **[string]** Répondu
- L5471:72 **[string]** En attente
- L5479:45 **[jsx_text]** Voir la réponse
- L5492:80 **[jsx_text]** Répondre
- L5502:95 **[jsx_text]** Réponse publiée :
- L5504:118 **[string]** Merci pour votre avis, nous sommes ravis que vous ayez apprécié votre expérience !
- L5516:69 **[string]** Aucun avis en attente
- L5516:124 **[string]** Aucun avis répondu
- L5516:147 **[string]** Aucun avis disponible
- L5658:51 **[jsx_text]** Suivez l'avancement de vos actions
- L5684:56 **[jsx_text]** Avis liés
- L5686:51 **[jsx_text]** Avis freinant votre progression vers l'objectif
- L5714:51 **[jsx_text]** Estimez l'impact de vos améliorations
- L5738:51 **[jsx_text]** Suivez l'avancement de vos actions
- L5761:45 **[jsx_text]** Avis liés
- L5762:51 **[jsx_text]** Avis freinant votre progression vers l'objectif
- L5767:57 **[jsx_text]** Aucun avis lié trouvé.
- L5802:51 **[jsx_text]** Estimez l'impact de vos améliorations
- L5806:53 **[jsx_text]** Si vous corrigez ces points, voici l'impact estimé sur votre note :

## src/pages/Debug.tsx (x1)

- L12:48 **[jsx_text]** Diagnostic OAuth Google

## src/pages/DebugEnv.tsx (x10)

- L43:22 **[string]** Configuré
- L53:58 **[jsx_text]** Debug - Variables d'environnement
- L54:45 **[jsx_text]** Vérification des variables d'environnement pour l'edge function analyze-reviews
- L61:21 **[jsx_text]** Test de connectivité
- L62:27 **[jsx_text]** Ping de l'edge function pour vérifier les variables d'environnement
- L70:65 **[jsx_text]** Test en cours...
- L74:15 **[string]** Ping analyze-reviews
- L95:54 **[jsx_text]** Variables d'environnement
- L109:63 **[jsx_text]** Variables détectées
- L117:49 **[jsx_text]** Réponse brute

## src/pages/DebugInsights.tsx (x16)

- L83:42 **[jsx_text]** Aucune donnée de résumé
- L92:53 **[jsx_text]** Collectés
- L114:60 **[jsx_text]** Problèmes principaux
- L130:62 **[jsx_text]** Points forts
- L159:58 **[jsx_text]** Debug - Insights d'avis
- L160:45 **[jsx_text]** Consulter et analyser les insights stockés pour un établissement
- L167:21 **[jsx_text]** Recherche d'insights
- L168:27 **[jsx_text]** Entrez un Place ID pour charger les analyses existantes
- L174:38 **[jsx_text]** Place ID
- L179:15 **[attr:placeholder]** Ex: ChIJN1t_tDeuEmsRUsoyG83frY4
- L179:27 **[string]** Ex: ChIJN1t_tDeuEmsRUsoyG83frY4
- L191:67 **[jsx_text]** Chargement...
- L205:67 **[jsx_text]** Analyse...
- L209:17 **[string]** Analyser & enregistrer
- L252:68 **[jsx_text]** Données brutes JSON
- L268:61 **[jsx_text]** Aucun insight trouvé pour ce Place ID

## src/pages/DebugReviews.tsx (x21)

- L55:58 **[jsx_text]** Debug - Analyses d'avis
- L56:45 **[jsx_text]** Tester l'analyse d'avis avec l'edge function analyze-reviews
- L63:21 **[jsx_text]** Paramètres d'analyse
- L64:27 **[jsx_text]** Entrez les détails de l'établissement à analyser
- L70:38 **[jsx_text]** Place ID (requis)
- L75:15 **[attr:placeholder]** Ex: ChIJN1t_tDeuEmsRUsoyG83frY4
- L75:27 **[string]** Ex: ChIJN1t_tDeuEmsRUsoyG83frY4
- L80:34 **[jsx_text]** Nom (optionnel)
- L85:15 **[attr:placeholder]** Ex: Restaurant Le Bistrot
- L85:27 **[string]** Ex: Restaurant Le Bistrot
- L90:37 **[jsx_text]** Adresse (optionnel)
- L95:15 **[attr:placeholder]** Ex: 123 rue de la République, Paris
- L95:27 **[string]** Ex: 123 rue de la République, Paris
- L107:67 **[jsx_text]** Test...
- L121:67 **[jsx_text]** Analyse...
- L125:17 **[string]** Analyser & enregistrer
- L135:59 **[jsx_text]** Résultat de l'analyse
- L153:61 **[jsx_text]** Avis collectés
- L172:55 **[jsx_text]** Métadonnées Google
- L180:65 **[jsx_text]** Mode dry-run - Aucune donnée n'a été enregistrée
- L196:49 **[jsx_text]** Réponse complète

## src/pages/Etablissement.tsx (x8)

- L272:25 **[string]** Erreur lors de la vérification des établissements:
- L279:23 **[string]** Erreur lors de la vérification des établissements:
- L324:50 **[string]** btn-analyser-etablissement
- L326:53 **[string]** btn-analyser-etablissement
- L504:19 **[string]** reviews-visual-anchor
- L510:19 **[string]** import-avis-toolbar-anchor
- L523:14 **[jsx_text]** ) : showImportBar ? (
- L547:28 **[string]** section-etablissements-enregistres

## src/pages/Fonctionnalites.tsx (x1)

- L7:8 **[string]** @/components/ui/accordion

## src/pages/ForgotPassword.tsx (x3)

- L42:23 **[string]** Erreur lors de la vérification de l'email:
- L61:23 **[string]** Erreur lors de l'envoi de l'email:
- L71:21 **[string]** Erreur inattendue:

## src/pages/GoogleOAuthCallback.tsx (x5)

- L40:65 **[string]** google-oauth-callback
- L45:25 **[string]** Edge Function error:
- L49:22 **[string]** OAuth success:
- L53:23 **[string]** Callback processing error:
- L73:41 **[string]** noindex,nofollow

## src/pages/MerciInscription.tsx (x2)

- L17:35 **[string]** scale(1.5, 1)
- L20:13 **[jsx_text]** 🎉

## src/pages/NotFound.tsx (x1)

- L12:7 **[string]** 404 Error: User attempted to access non-existent route:

## src/pages/Onboarding.tsx (x3)

- L30:19 **[string]** Redirecting to checkout for plan:
- L42:32 **[string]** stripeCheckoutStarted
- L48:21 **[string]** Checkout error:

## src/pages/ResetPassword.tsx (x5)

- L59:25 **[string]** Erreur lors de la vérification du token:
- L67:21 **[string]** Token vérifié avec succès, session établie
- L71:23 **[string]** Erreur inattendue lors de la vérification:
- L110:23 **[string]** Erreur lors de la mise à jour du mot de passe:
- L128:21 **[string]** Erreur inattendue:

## src/services/establishments.ts (x3)

- L330:21 **[string]** Nom d'établissement manquant
- L349:23 **[string]** Erreur lors de la mise à jour de l'établissement
- L373:21 **[string]** Erreur lors de la création de l'établissement

## src/services/reviewsService.ts (x1)

- L454:18 **[jsx_text]** = 1 && r.rating

## src/types/analyse.ts (x3)

- L6:44 **[string]** Très négatif
- L6:61 **[string]** Négatif
- L6:96 **[string]** Très positif

## src/utils/baselineScore.ts (x1)

- L193:13 **[jsx_text]** 0) return 'increase';   if (delta

## src/utils/generatePdfReport.ts (x8)

- L8:89 **[jsx_text]** ;   topStrengths: Array
- L9:95 **[jsx_text]** ;   themes?: Array
- L10:67 **[jsx_text]** ;   recentReviews: Array
- L104:12 **[string]** Rapport d'analyse des avis clients
- L149:12 **[string]** Avis analyses
- L434:16 **[jsx_text]** = 1 && rating
- L816:13 **[string]** Notre objectif : offrir une experience client irreprochable, chaque jour.
- L1042:13 **[string]** Nous nous engageons a appliquer ces actions au quotidien.

## src/utils/getDisplayAuthor.ts (x2)

- L19:12 **[string]** Nom du client
- L20:12 **[string]** nom du client

## src/utils/parsePastedReviews.ts (x2)

- L99:41 **[jsx_text]** = 1 && rating
- L252:39 **[jsx_text]** = 1 && rating

## src/utils/ratingEvolution.ts (x1)

- L149:27 **[string]** 'S'w
