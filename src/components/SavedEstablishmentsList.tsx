import { useEffect, useState, useCallback } from "react";
import { Etab, EVT_LIST_UPDATED, EVT_SAVED } from "../types/etablissement";
import EstablishmentItem from "./EstablishmentItem";
import { Building2, Plus, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { checkSubscription } from "@/lib/stripe";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
interface SavedEstablishmentsListProps {
  onAddClick?: () => void;
}
export default function SavedEstablishmentsList({
  onAddClick
}: SavedEstablishmentsListProps) {
  const [establishments, setEstablishments] = useState<Etab[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingActive, setSettingActive] = useState<string | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [creatingCheckout, setCreatingCheckout] = useState(false);

  // Fonction pour charger les établissements UNIQUEMENT depuis la DB
  const loadEstablishmentsFromDb = useCallback(async () => {
    try {
      const {
        data: {
          user
        },
        error: authError
      } = await supabase.auth.getUser();
      if (authError || !user) {
        setEstablishments([]);
        return;
      }

      // Charger depuis la table "établissements" (source de vérité unique)
      const {
        data: etablissements,
        error
      } = await supabase.from("établissements").select("*").eq("user_id", user.id).order("created_at", {
        ascending: false
      });
      if (error) {
        console.error("Erreur chargement établissements:", error);
        setEstablishments([]);
        return;
      }

      // Convertir vers le format Etab avec toutes les infos de la DB
      const dbList: Etab[] = (etablissements || []).map(etab => ({
        place_id: etab.place_id,
        name: etab.nom,
        address: etab.adresse || "",
        lat: etab.lat || null,
        lng: etab.lng || null,
        phone: etab.telephone || undefined,
        website: etab.website || undefined,
        url: etab.google_maps_url || undefined,
        rating: etab.rating || null
      }));
      setEstablishments(dbList);
    } catch (error) {
      console.error("Erreur lors du chargement de la liste:", error);
      setEstablishments([]);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    const load = async () => {
      await loadEstablishmentsFromDb();
      setLoading(false);
    };
    load();
  }, [loadEstablishmentsFromDb]);

  // Écouter les mises à jour de la liste (après ajout/suppression)
  useEffect(() => {
    const onListUpdated = () => {
      loadEstablishmentsFromDb();
    };
    window.addEventListener(EVT_LIST_UPDATED, onListUpdated);
    return () => window.removeEventListener(EVT_LIST_UPDATED, onListUpdated);
  }, [loadEstablishmentsFromDb]);

  // Check URL params for success/canceled on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      sonnerToast.success("Paiement réussi ! Vous pouvez maintenant ajouter des établissements.");
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("canceled") === "true") {
      sonnerToast.info("Paiement annulé");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Handle add button click with subscription check
  const handleAddClick = async () => {
    console.log("[SavedEstablishmentsList] handleAddClick triggered");
    setCheckingSubscription(true);
    try {
      const status = await checkSubscription();
      console.log("[SavedEstablishmentsList] Subscription status:", status);
      if (status.subscribed) {
        // User has active subscription, allow adding
        console.log("[SavedEstablishmentsList] User is subscribed, allowing add");
        onAddClick?.();
      } else {
        // User doesn't have active subscription, show modal
        console.log("[SavedEstablishmentsList] User NOT subscribed, showing modal");
        setShowSubscriptionModal(true);
      }
    } catch (error) {
      console.error("[SavedEstablishmentsList] Error checking subscription:", error);
      sonnerToast.error("Erreur lors de la vérification de l'abonnement");
    } finally {
      setCheckingSubscription(false);
    }
  };

  // Create Stripe checkout session
  const handleProceedToCheckout = async () => {
    console.log("[SavedEstablishmentsList] Creating checkout session...");
    setCreatingCheckout(true);
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        sonnerToast.error("Vous devez être connecté pour vous abonner");
        return;
      }

      // Count current establishments for billing
      const establishmentsCount = establishments.length;
      console.log("[SavedEstablishmentsList] Current establishments count:", establishmentsCount);
      const {
        data,
        error
      } = await supabase.functions.invoke("create-subscription", {
        body: {
          establishments_count: establishmentsCount + 1 // +1 for the new one they want to add
        }
      });
      console.log("[SavedEstablishmentsList] create-subscription response:", {
        data,
        error
      });
      if (error) {
        console.error("[SavedEstablishmentsList] Edge function error:", error);
        sonnerToast.error(`Erreur: ${error.message}`);
        return;
      }
      if (data?.error) {
        console.error("[SavedEstablishmentsList] Response error:", data.error);
        if (data.has_subscription) {
          sonnerToast.success("Vous êtes déjà abonné ! Vous pouvez ajouter des établissements.");
          setShowSubscriptionModal(false);
          onAddClick?.();
        } else {
          sonnerToast.error(data.error);
        }
        return;
      }
      if (data?.url) {
        console.log("[SavedEstablishmentsList] Redirecting to Stripe checkout:", data.url);
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        console.error("[SavedEstablishmentsList] No URL in response:", data);
        sonnerToast.error("Impossible de créer la session de paiement");
      }
    } catch (error) {
      console.error("[SavedEstablishmentsList] Unexpected error:", error);
      sonnerToast.error("Une erreur est survenue lors de la création du paiement");
    } finally {
      setCreatingCheckout(false);
    }
  };

  // Définir un établissement comme actif dans la DB (source de vérité)
  const handleSelectEstablishment = async (etab: Etab) => {
    setSettingActive(etab.place_id);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        sonnerToast.error("Vous devez être connecté");
        return;
      }

      // Mettre à jour is_active=true dans la DB
      // Le trigger va automatiquement désactiver les autres
      const {
        error
      } = await supabase.from("établissements").update({
        is_active: true
      }).eq("user_id", user.id).eq("place_id", etab.place_id);
      if (error) {
        console.error("Erreur définition établissement actif:", error);
        sonnerToast.error("Impossible de sélectionner cet établissement");
        return;
      }

      // Notifier MonEtablissementCard de recharger depuis la DB
      window.dispatchEvent(new CustomEvent(EVT_SAVED));

      // Scroll smooth vers le haut
      document.querySelector('[data-testid="card-mon-etablissement"]')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      sonnerToast.success(`"${etab.name}" défini comme établissement actif`);
    } catch (err) {
      console.error("Erreur:", err);
      sonnerToast.error("Une erreur est survenue");
    } finally {
      setSettingActive(null);
    }
  };

  // Ne rien afficher pendant le chargement ou si aucun établissement
  if (loading || establishments.length === 0) {
    return null;
  }
  return <>
      <section className="p-4 border border-border rounded-lg bg-card/50">
        <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Établissements enregistrés
        </h3>
        
        <div className="flex flex-wrap gap-3">
          {establishments.map(etab => <EstablishmentItem key={etab.place_id} etab={etab} onSelect={handleSelectEstablishment} />)}
          
          {/* Bouton Ajouter un établissement - with billing gate */}
          <button onClick={handleAddClick} disabled={checkingSubscription} className="cursor-pointer bg-card border border-dashed border-border rounded-lg p-3 min-w-[200px] max-w-[250px] shadow-sm hover:shadow-md hover:bg-accent/10 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-2 min-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed" title="Ajouter un établissement">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {checkingSubscription ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <Plus className="w-5 h-5 text-primary" />}
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {checkingSubscription ? "Vérification..." : "Ajouter"}
            </span>
          </button>
        </div>
        
        {establishments.length === 0 && <p className="text-muted-foreground text-sm mt-3">
            Aucun établissement enregistré pour le moment.
          </p>}
      </section>

      {/* Subscription required modal */}
      <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
          {/* Badge Multi-établissements - positioned in modal header */}
          <div className="absolute -top-3 -right-3 bg-purple-600 text-white px-3 py-1 text-xs font-semibold rounded-lg shadow-md z-10">
            Multi-établissements
          </div>
          <DialogHeader className="pb-2">
            <DialogTitle>Abonnement requis</DialogTitle>
            <DialogDescription className="text-sm">
              Pour ajouter des établissements, vous devez souscrire à un abonnement.
              Votre premier établissement est inclus dans l'abonnement de base.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2 space-y-2 overflow-visible">
            {/* Plan principal */}
            <div className="rounded-xl p-3 border border-border bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-foreground">Abonnement Pro</span>
                  <p className="text-xs text-muted-foreground">Engagement 12 mois</p>
                </div>
                <span className="text-lg font-bold text-blue-600">14,99 €<span className="text-sm font-normal text-muted-foreground">/mois</span></span>
              </div>
            </div>
            
            {/* Établissement supplémentaire - styled as mini pricing card */}
            <div className="relative bg-white rounded-xl shadow-md border-2 border-border">
              <div className="p-3">
                {/* Header with title and price */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-base font-bold text-foreground">Établissement supplémentaire</h4>
                    <p className="text-xs text-muted-foreground">Facturé par mois</p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="text-xl font-bold text-purple-600">+4,99 €<span className="text-xs font-normal text-muted-foreground">/mois</span></span>
                  </div>
                </div>
                
                {/* Feature list - same style as pricing cards */}
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="inline-flex w-4 h-4 rounded-full bg-purple-100 items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-purple-600" />
                    </span>
                    <span className="text-sm text-foreground leading-tight">Centralisez la gestion de tous vos lieux</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-flex w-4 h-4 rounded-full bg-purple-100 items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-purple-600" />
                    </span>
                    <span className="text-sm text-foreground leading-tight">Idéal pour groupes et franchises</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-flex w-4 h-4 rounded-full bg-purple-100 items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-purple-600" />
                    </span>
                    <span className="text-sm text-foreground leading-tight">Suivi indépendant par établissement</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2 sm:gap-0 pt-1">
            <Button variant="outline" onClick={() => setShowSubscriptionModal(false)} disabled={creatingCheckout}>
              Annuler
            </Button>
            <Button 
              onClick={handleProceedToCheckout} 
              disabled={creatingCheckout}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {creatingCheckout ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirection...
                </> : "S'abonner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
}