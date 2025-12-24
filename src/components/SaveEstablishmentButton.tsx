import { useState, useEffect } from "react";
import { Etab, EVT_SAVED, EVT_LIST_UPDATED } from "../types/etablissement";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { checkSubscription } from "@/lib/stripe";
import { syncEstablishmentBilling } from "@/lib/establishmentBilling";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [redirectingToCheckout, setRedirectingToCheckout] = useState(false);

  // Fonction de vérification DB
  const checkIfSaved = async () => {
    if (!selected?.place_id) {
      setIsAlreadySaved(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsAlreadySaved(false);
      return;
    }

    const { data } = await supabase
      .from("établissements")
      .select("place_id")
      .eq("user_id", user.id)
      .eq("place_id", selected.place_id)
      .maybeSingle();

    setIsAlreadySaved(!!data);
  };

  // Vérifier quand la sélection change OU quand la liste est mise à jour
  useEffect(() => {
    checkIfSaved();
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

      if (!subscriptionStatus.subscribed) {
        // Pas d'abonnement -> afficher modal
        console.log("[SaveEstablishmentButton] No subscription, showing modal");
        setShowSubscriptionModal(true);
        return;
      }

      // A un abonnement -> procéder à la sauvegarde
      console.log("[SaveEstablishmentButton] Has subscription, proceeding to save");
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
    </>
  );
}