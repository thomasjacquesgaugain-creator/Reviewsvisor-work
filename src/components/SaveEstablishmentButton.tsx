import { useState, useEffect } from "react";
import { Etab, EVT_SAVED, EVT_LIST_UPDATED } from "../types/etablissement";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { checkSubscription } from "@/lib/stripe";
import { syncEstablishmentBilling } from "@/lib/establishmentBilling";
import { useCreatorBypass, PRODUCT_KEYS } from "@/hooks/useCreatorBypass";
import { establishmentAddon } from "@/config/subscriptionPlans";
import { Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Quota included in base plan
const INCLUDED_ESTABLISHMENTS = 1;

export default function SaveEstablishmentButton({
  selected,
  disabled,
  onSaveSuccess,
}: {
  selected: Etab | null;
  disabled?: boolean;
  onSaveSuccess?: () => void;
}) {
  const [isAlreadySaved, setIsAlreadySaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkVersion, setCheckVersion] = useState(0);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [redirectingToCheckout, setRedirectingToCheckout] = useState(false);
  const [currentEstablishmentCount, setCurrentEstablishmentCount] = useState(0);
  const [updatingAddon, setUpdatingAddon] = useState(false);
  
  const { isCreator, activateCreatorSubscription } = useCreatorBypass();

  // Fonction de vérification DB + count
  const checkIfSavedAndCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsAlreadySaved(false);
      setCurrentEstablishmentCount(0);
      return;
    }

    // Get all establishments for count
    const { data: allEstablishments } = await supabase
      .from("établissements")
      .select("place_id")
      .eq("user_id", user.id);
    
    setCurrentEstablishmentCount(allEstablishments?.length || 0);

    // Check if selected is already saved
    if (!selected?.place_id) {
      setIsAlreadySaved(false);
      return;
    }

    const isSaved = allEstablishments?.some(e => e.place_id === selected.place_id);
    setIsAlreadySaved(!!isSaved);
  };

  // Vérifier quand la sélection change OU quand la liste est mise à jour
  useEffect(() => {
    checkIfSavedAndCount();
  }, [selected?.place_id, checkVersion]);

  // Écouter les mises à jour de la liste (après ajout/suppression)
  useEffect(() => {
    const onListUpdated = () => {
      // Forcer une re-vérification depuis la DB
      setCheckVersion(v => v + 1);
    };
    window.addEventListener(EVT_LIST_UPDATED, onListUpdated);
    return () => window.removeEventListener(EVT_LIST_UPDATED, onListUpdated);
  }, []);

  // Redirect to Stripe Checkout
  async function redirectToCheckout() {
    setRedirectingToCheckout(true);
    try {
      console.log("[SaveEstablishmentButton] Creating subscription checkout...");
      
      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: {}
      });

      if (error) {
        console.error("[SaveEstablishmentButton] Error creating checkout:", error);
        sonnerToast.error("Erreur lors de la création du paiement", {
          description: error.message
        });
        return;
      }

      if (data?.url) {
        console.log("[SaveEstablishmentButton] Redirecting to:", data.url);
        window.location.href = data.url;
      } else if (data?.has_subscription) {
        // User already has a subscription, close modal and proceed
        setShowSubscriptionModal(false);
        sonnerToast.success("Vous avez déjà un abonnement actif !");
        // Re-run the save process
        await performSave();
      } else {
        console.error("[SaveEstablishmentButton] No URL in response:", data);
        sonnerToast.error("Erreur: URL de paiement non reçue");
      }
    } catch (err) {
      console.error("[SaveEstablishmentButton] Checkout error:", err);
      sonnerToast.error("Erreur lors de la redirection vers le paiement");
    } finally {
      setRedirectingToCheckout(false);
    }
  }

  // Perform the actual save operation
  async function performSave() {
    if (!selected) return;

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      sonnerToast.info("Connectez-vous pour enregistrer un établissement.", { duration: 5000 });
      return;
    }

    setSaving(true);

    try {
      // Sauvegarder dans la table établissements avec TOUTES les infos (source de vérité)
      const { error: etabError } = await supabase.from("établissements").upsert({
        user_id: user.id,
        place_id: selected.place_id,
        nom: selected.name,
        adresse: selected.address,
        telephone: selected.phone || null,
        type: "Restaurant",
        website: selected.website || null,
        rating: selected.rating || null,
        google_maps_url: selected.url || null,
        lat: selected.lat || null,
        lng: selected.lng || null,
        is_active: true,
      }, {
        onConflict: 'user_id,place_id',
        ignoreDuplicates: false
      });
      
      if (etabError) {
        console.error("Erreur sauvegarde établissements:", etabError);
        sonnerToast.error("Impossible d'enregistrer l'établissement");
        return;
      }

      // Notifier les composants
      window.dispatchEvent(new CustomEvent(EVT_SAVED));
      window.dispatchEvent(new CustomEvent(EVT_LIST_UPDATED));
      setIsAlreadySaved(true);

      // Sync billing with Stripe (update quantity if subscribed)
      syncEstablishmentBilling().then(result => {
        if (result.success) {
          console.log('[SaveEstablishmentButton] Billing synced:', result);
        } else {
          console.warn('[SaveEstablishmentButton] Billing sync issue:', result.error);
        }
      }).catch(err => console.warn('[SaveEstablishmentButton] Billing sync error:', err));

      sonnerToast.success("Établissement enregistré", {
        description: "L'établissement a été ajouté à votre liste.",
        duration: 3000,
      });

      onSaveSuccess?.();
    } finally {
      setSaving(false);
    }
  }

  // Handle addon confirmation (quota exceeded)
  async function handleAddonConfirm() {
    setUpdatingAddon(true);
    try {
      const newAddonQty = currentEstablishmentCount; // -1 for included + 1 for new = same as count
      
      // ======= CREATOR BYPASS =======
      if (isCreator()) {
        console.log("[SaveEstablishmentButton] Creator bypass for addon");
        const addonResult = await activateCreatorSubscription(PRODUCT_KEYS.ADDON_MULTI_ETABLISSEMENTS);
        if (!addonResult.success) {
          sonnerToast.error(addonResult.error || "Erreur d'activation addon");
          return;
        }
        setShowAddonModal(false);
        await performSave();
        return;
      }

      // ======= NORMAL STRIPE FLOW =======
      console.log("[SaveEstablishmentButton] Updating addon quantity to:", newAddonQty);
      const { data, error } = await supabase.functions.invoke("update-addon-quantity", {
        body: { new_addon_quantity: newAddonQty }
      });
      
      if (error) {
        console.error("[SaveEstablishmentButton] Update addon error:", error);
        sonnerToast.error(`Erreur: ${error.message}`);
        return;
      }
      
      if (data?.success) {
        sonnerToast.success("Établissement supplémentaire ajouté à votre abonnement !");
        setShowAddonModal(false);
        await performSave();
      } else {
        sonnerToast.error(data?.error || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      console.error("[SaveEstablishmentButton] Addon error:", err);
      sonnerToast.error("Une erreur est survenue");
    } finally {
      setUpdatingAddon(false);
    }
  }

  async function handleSave() {
    if (!selected) return;

    // 1) Vérifier l'authentification
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      sonnerToast.info("Connectez-vous pour enregistrer un établissement.", { duration: 5000 });
      return;
    }

    // 2) Si déjà enregistré, informer l'utilisateur
    if (isAlreadySaved) {
      sonnerToast.info("Cet établissement est déjà enregistré.", { duration: 3000 });
      return;
    }

    // 3) BILLING GATE: Vérifier l'abonnement AVANT de sauvegarder
    setCheckingSubscription(true);
    try {
      console.log("[SaveEstablishmentButton] Checking subscription status...");
      const subscriptionStatus = await checkSubscription();
      console.log("[SaveEstablishmentButton] Subscription status:", subscriptionStatus);
      console.log("[SaveEstablishmentButton] Current establishment count:", currentEstablishmentCount);

      if (!subscriptionStatus.subscribed) {
        // Pas d'abonnement -> afficher modal abonnement
        console.log("[SaveEstablishmentButton] No subscription, showing subscription modal");
        setShowSubscriptionModal(true);
        return;
      }

      // 4) QUOTA CHECK: Vérifier si le quota inclus est dépassé
      if (currentEstablishmentCount >= INCLUDED_ESTABLISHMENTS) {
        // Quota dépassé -> afficher modal addon
        console.log("[SaveEstablishmentButton] Quota exceeded, showing addon modal", {
          current: currentEstablishmentCount,
          included: INCLUDED_ESTABLISHMENTS
        });
        setShowAddonModal(true);
        return;
      }

      // Sous le quota -> procéder à la sauvegarde immédiate
      console.log("[SaveEstablishmentButton] Under quota, saving immediately");
      await performSave();

    } catch (err) {
      console.error("[SaveEstablishmentButton] Error checking subscription:", err);
      sonnerToast.error("Erreur lors de la vérification de l'abonnement");
    } finally {
      setCheckingSubscription(false);
    }
  }

  return (
    <>
      <button
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded px-4 py-3 disabled:opacity-50 transition-colors"
        onClick={handleSave}
        disabled={!selected || disabled || saving || isAlreadySaved || checkingSubscription}
        title={isAlreadySaved ? "Déjà enregistré" : "Enregistrer l'établissement"}
      >
        {checkingSubscription 
          ? "⏳ Vérification..." 
          : saving 
            ? "⏳ Enregistrement..." 
            : isAlreadySaved 
              ? "✅ Déjà enregistré" 
              : "💾 Enregistrer l'établissement"}
      </button>

      {/* Modal Abonnement Requis */}
      <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Abonnement requis</DialogTitle>
            <DialogDescription>
              Pour ajouter un établissement, vous devez disposer d'un abonnement actif.
              Notre formule Pro vous permet de gérer vos avis et d'analyser vos performances.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <p className="font-semibold">Abonnement Pro - 14,99€/mois</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ 1 établissement inclus</li>
                <li>✓ Analyse des avis illimitée</li>
                <li>✓ Génération de réponses IA</li>
                <li>✓ Tableau de bord complet</li>
                <li className="text-xs italic">+4,99€/mois par établissement supplémentaire</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSubscriptionModal(false)}
              disabled={redirectingToCheckout}
            >
              Annuler
            </Button>
            <Button
              onClick={redirectToCheckout}
              disabled={redirectingToCheckout}
              className="gap-2"
            >
              {redirectingToCheckout ? "Redirection..." : "Procéder au paiement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Établissement supplémentaire (quota dépassé) */}
      <Dialog open={showAddonModal} onOpenChange={setShowAddonModal}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
          <div className="absolute -top-3 -right-3 bg-purple-600 text-white px-3 py-1 text-xs font-semibold rounded-lg shadow-md z-10">
            +4,99 €/mois
          </div>
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-bold">Établissement supplémentaire</DialogTitle>
            <DialogDescription className="text-sm">
              Vous avez déjà {currentEstablishmentCount} établissement{currentEstablishmentCount > 1 ? 's' : ''}.
              L'ajout d'un nouvel établissement entraîne un coût supplémentaire.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2 space-y-2">
            <div className="relative bg-white rounded-xl shadow-lg border-2 border-purple-200">
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-base font-bold text-foreground">
                      Établissement #{currentEstablishmentCount + 1}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Sera ajouté à votre abonnement
                    </p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="text-xl font-bold text-purple-600">
                      +{establishmentAddon.price.toFixed(2).replace('.', ',')} €
                      <span className="text-xs font-normal text-muted-foreground">/mois</span>
                    </span>
                  </div>
                </div>
                
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="inline-flex w-4 h-4 rounded-full bg-purple-100 items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-purple-600" />
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Analyse des avis pour cet établissement
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-flex w-4 h-4 rounded-full bg-purple-100 items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-purple-600" />
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Réponses IA personnalisées
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-flex w-4 h-4 rounded-full bg-purple-100 items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-purple-600" />
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Facturation immédiate au prorata
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowAddonModal(false)}
              disabled={updatingAddon}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddonConfirm}
              disabled={updatingAddon}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
            >
              {updatingAddon ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Ajout en cours...
                </>
              ) : (
                "Confirmer +4,99 €/mois"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}