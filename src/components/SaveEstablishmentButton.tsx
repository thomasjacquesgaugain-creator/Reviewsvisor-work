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
import { useTranslation } from "react-i18next";

// Quota included in base plan
const INCLUDED_ESTABLISHMENTS = 1;
const ADMIN_EMAIL = "thomas.jacquesgaugain@gmail.com";

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
  const { t } = useTranslation();

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
      // ======= ADMIN BYPASS - Vérification explicite AVANT Stripe =======
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        if (!import.meta.env.PROD) {
          console.log("[SaveEstablishmentButton] Admin bypass detected for", user.email);
        }
        
        // Activer l'abonnement Pro directement
        const result = await activateCreatorSubscription(PRODUCT_KEYS.PRO_1499_12M);
        
        if (result.success) {
          setShowSubscriptionModal(false);
          sonnerToast.success(t("subscription.activatedSuccess"));
          // Re-run the save process
          await performSave();
          return;
        } else {
          sonnerToast.error(result.error || t("subscription.activationError"));
          return;
        }
      }
      
      if (!import.meta.env.PROD) {
        console.log("[SaveEstablishmentButton] Creating subscription checkout...");
      }
      
      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: {}
      });

      if (error) {
        console.error("[SaveEstablishmentButton] Error creating checkout:", error);
        sonnerToast.error(t("subscription.paymentInitError"), {
          description: error.message
        });
        return;
      }

      if (data?.url) {
        if (!import.meta.env.PROD) {
          console.log("[SaveEstablishmentButton] Redirecting to:", data.url);
        }
        sessionStorage.setItem("stripeCheckoutStarted", "true");
        window.location.href = data.url;
      } else if (data?.has_subscription) {
        // User already has a subscription, close modal and proceed
        setShowSubscriptionModal(false);
        sonnerToast.success(t("subscription.alreadySubscribed"));
        // Re-run the save process
        await performSave();
      } else {
        console.error("[SaveEstablishmentButton] No URL in response:", data);
        sonnerToast.error(t("subscription.paymentUrlNotReceived"));
      }
    } catch (err) {
      console.error("[SaveEstablishmentButton] Checkout error:", err);
      sonnerToast.error(t("subscription.paymentRedirectError"));
    } finally {
      setRedirectingToCheckout(false);
    }
  }

  // Perform the actual save operation
  async function performSave() {
    if (!selected) return;

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      sonnerToast.info(t("auth.mustBeLoggedInToSaveEstablishment"), { duration: 5000 });
      return;
    }

    setSaving(true);

    try {
      // Sauvegarder dans la table établissements (source de vérité)
      const { error: etabError } = await supabase.from("établissements").upsert({
        user_id: user.id,
        place_id: selected.place_id,
        nom: selected.name,
        adresse: selected.address,
        telephone: selected.phone || null,
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
        sonnerToast.error(t("establishment.saveError"));
        return;
      }

      // Notifier les composants
      window.dispatchEvent(new CustomEvent(EVT_SAVED));
      window.dispatchEvent(new CustomEvent(EVT_LIST_UPDATED));
      setIsAlreadySaved(true);

      // Sync billing with Stripe (update quantity if subscribed)
      syncEstablishmentBilling().then(result => {
        if (result.success) {
          if (!import.meta.env.PROD) {
            console.log('[SaveEstablishmentButton] Billing synced:', result);
          }
        } else {
          console.warn('[SaveEstablishmentButton] Billing sync issue:', result.error);
        }
      }).catch(err => console.warn('[SaveEstablishmentButton] Billing sync error:', err));

      sonnerToast.success(t("establishment.establishmentSaved"), {
        description: t("establishment.addedToYourList"),
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
        if (!import.meta.env.PROD) {
          console.log("[SaveEstablishmentButton] Creator bypass for addon");
        }
        const addonResult = await activateCreatorSubscription(PRODUCT_KEYS.ADDON_MULTI_ETABLISSEMENTS);
        if (!addonResult.success) {
          sonnerToast.error(addonResult.error || t("subscription.addonActivationError"));
          return;
        }
        setShowAddonModal(false);
        await performSave();
        return;
      }

      // ======= NORMAL STRIPE FLOW =======
      if (!import.meta.env.PROD) {
        console.log("[SaveEstablishmentButton] Updating addon quantity to:", newAddonQty);
      }
      const { data, error } = await supabase.functions.invoke("update-addon-quantity", {
        body: { new_addon_quantity: newAddonQty }
      });
      
      if (error) {
        console.error("[SaveEstablishmentButton] Update addon error:", error);
        sonnerToast.error(`${t("common.error")}: ${error.message}`);
        return;
      }
      
      if (data?.success) {
        sonnerToast.success(t("subscription.establishmentAdded"));
        setShowAddonModal(false);
        await performSave();
      } else {
        sonnerToast.error(data?.error || t("common.updateError"));
      }
    } catch (err) {
      console.error("[SaveEstablishmentButton] Addon error:", err);
      sonnerToast.error(t("errors.generic"));
    } finally {
      setUpdatingAddon(false);
    }
  }

  async function handleSave() {
    if (!selected) return;

    // 1) Vérifier l'authentification
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      sonnerToast.info(t("auth.mustBeLoggedInToSaveEstablishment"), { duration: 5000 });
      return;
    }

    // 2) Si déjà enregistré, informer l'utilisateur
    if (isAlreadySaved) {
      sonnerToast.info(t("establishment.alreadySaved"), { duration: 3000 });
      return;
    }

    // 3) BILLING GATE: Vérifier l'abonnement AVANT de sauvegarder
    setCheckingSubscription(true);
    try {
      if (!import.meta.env.PROD) {
        console.log("[SaveEstablishmentButton] Checking subscription status...");
      }
      const subscriptionStatus = await checkSubscription();
      if (!import.meta.env.PROD) {
        console.log("[SaveEstablishmentButton] Subscription status:", subscriptionStatus);
        console.log("[SaveEstablishmentButton] Current establishment count:", currentEstablishmentCount);
      }

      if (!subscriptionStatus.subscribed) {
        // Pas d'abonnement -> afficher modal abonnement
        if (!import.meta.env.PROD) {
          console.log("[SaveEstablishmentButton] No subscription, showing subscription modal");
        }
        setShowSubscriptionModal(true);
        return;
      }

      // 4) QUOTA CHECK: Vérifier si le quota inclus est dépassé
      if (currentEstablishmentCount >= INCLUDED_ESTABLISHMENTS) {
        // Quota dépassé -> afficher modal addon
        if (!import.meta.env.PROD) {
          console.log("[SaveEstablishmentButton] Quota exceeded, showing addon modal", {
            current: currentEstablishmentCount,
            included: INCLUDED_ESTABLISHMENTS
          });
        }
        setShowAddonModal(true);
        return;
      }

      // Sous le quota -> procéder à la sauvegarde immédiate
      if (!import.meta.env.PROD) {
        console.log("[SaveEstablishmentButton] Under quota, saving immediately");
      }
      await performSave();

    } catch (err) {
      console.error("[SaveEstablishmentButton] Error checking subscription:", err);
      sonnerToast.error(t("subscription.checkError"));
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
        title={isAlreadySaved ? t("subscription.alreadySaved") : t("subscription.saveEstablishment")}
      >
        {checkingSubscription 
          ? `⏳ ${t("common.checking")}` 
          : saving 
            ? `⏳ ${t("common.saving")}` 
            : isAlreadySaved 
              ? `✅ ${t("subscription.alreadySaved")}` 
              : `💾 ${t("subscription.saveEstablishment")}`}
      </button>

      {/* Modal Abonnement Requis */}
      <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("subscription.subscriptionRequired")}</DialogTitle>
            <DialogDescription>
              {t("subscription.toAddEstablishment")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <p className="font-semibold">{t("subscription.proPlan1499")}</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ {t("subscription.oneEstablishmentIncluded")}</li>
                <li>✓ {t("subscription.unlimitedReviewAnalysis")}</li>
                <li>✓ {t("subscription.aiResponseGeneration")}</li>
                <li>✓ {t("subscription.completeDashboard")}</li>
                <li className="text-xs italic">{t("subscription.perAdditionalEstablishment")}</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSubscriptionModal(false)}
              disabled={redirectingToCheckout}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={redirectToCheckout}
              disabled={redirectingToCheckout}
              className="gap-2"
            >
              {redirectingToCheckout ? t("common.redirecting") : t("subscription.proceedToPayment")}
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
            <DialogTitle className="text-base font-bold">{t("subscription.additionalEstablishment")}</DialogTitle>
            <DialogDescription className="text-sm">
              {t("subscription.youAlreadyHaveEstablishments", { count: currentEstablishmentCount })}.
              {t("subscription.addingNewEstablishmentCostsExtra")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2 space-y-2">
            <div className="relative bg-white rounded-xl shadow-lg border-2 border-purple-200">
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-base font-bold text-foreground">
                      {t("subscription.establishmentNumber", { number: currentEstablishmentCount + 1 })}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {t("subscription.willBeAddedToSubscription")}
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
                      {t("subscription.reviewAnalysisForThisEstablishment")}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-flex w-4 h-4 rounded-full bg-purple-100 items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-purple-600" />
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("subscription.personalizedAIResponses")}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-flex w-4 h-4 rounded-full bg-purple-100 items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-purple-600" />
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("subscription.immediateProratedBilling")}
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
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleAddonConfirm}
              disabled={updatingAddon}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
            >
              {updatingAddon ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t("subscription.addingInProgress")}
                </>
              ) : (
                t("subscription.confirmAddonPrice", { price: "4,99" })
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}