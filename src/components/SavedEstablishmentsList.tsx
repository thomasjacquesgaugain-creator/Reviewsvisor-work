import { useEffect, useState, useCallback, useMemo } from "react";
import { Etab, EVT_LIST_UPDATED, EVT_SAVED } from "../types/etablissement";
import EstablishmentItem from "./EstablishmentItem";
import { Building2, Plus, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { checkSubscription } from "@/lib/stripe";
import { useSubscription } from "@/hooks/useSubscription";
import { useCreatorBypass, PRODUCT_KEYS } from "@/hooks/useCreatorBypass";
import { subscriptionPlans, establishmentAddon } from "@/config/subscriptionPlans";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useEstablishmentStore } from "@/store/establishmentStore";
interface SavedEstablishmentsListProps {
  onAddClick?: () => void;
}
export default function SavedEstablishmentsList({
  onAddClick
}: SavedEstablishmentsListProps) {
  const [establishments, setEstablishments] = useState<Etab[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingActive, setSettingActive] = useState<string | null>(null);
  const activePlaceId = useEstablishmentStore((s) => s.activePlaceId ?? s.selectedEstablishment?.place_id ?? null);
  const setActivePlace = useEstablishmentStore((s) => s.setActivePlace);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const {
    subscription,
    refresh: refreshSubscription
  } = useSubscription();
  const {
    isCreator,
    activateCreatorSubscription
  } = useCreatorBypass();
  const { t } = useTranslation();

  // Détermine le plan actif de l'utilisateur basé sur le price_id
  const activePlan = useMemo(() => {
    if (!subscription.subscribed || !subscription.price_id) {
      // Fallback sur le plan engagement par défaut
      return subscriptionPlans.find(p => p.id === "pro-engagement") || subscriptionPlans[0];
    }
    const plan = subscriptionPlans.find(p => p.priceId === subscription.price_id);
    return plan || subscriptionPlans[0];
  }, [subscription.subscribed, subscription.price_id]);

  // Calcul dynamique du prix basé sur le nombre d'établissements
  const pricingInfo = useMemo(() => {
    const currentCount = establishments.length;
    const newCount = currentCount + 1; // +1 for the one they want to add
    const additionalCount = Math.max(0, newCount - 1); // First one is included in base plan

    const basePlanPrice = activePlan.price;
    const addonUnitPrice = establishmentAddon.price;
    const addonTotal = additionalCount * addonUnitPrice;
    const totalMonthly = basePlanPrice + addonTotal;
    return {
      currentCount,
      newCount,
      additionalCount,
      basePlanPrice,
      addonUnitPrice,
      addonTotal,
      totalMonthly,
      formattedTotal: totalMonthly.toFixed(2).replace('.', ',') + ' €',
      formattedAddonTotal: addonTotal > 0 ? `+${addonTotal.toFixed(2).replace('.', ',')} €` : null
    };
  }, [establishments.length, activePlan.price]);

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
      
      // Trouver l'établissement actif
      const activeEtab = etablissements?.find(e => e.is_active);
      const activePlaceIdFromDb = activeEtab?.place_id ?? null;

      // Trier: établissement actif en premier, puis les autres (ordre created_at desc conservé)
      const sortedDbList = activePlaceIdFromDb
        ? [
            ...dbList.filter(e => e.place_id === activePlaceIdFromDb),
            ...dbList.filter(e => e.place_id !== activePlaceIdFromDb),
          ]
        : dbList;

      setEstablishments(sortedDbList);
      if (activeEtab) {
        const activeEtabFormatted: Etab = {
          place_id: activeEtab.place_id,
          name: activeEtab.nom,
          address: activeEtab.adresse || "",
          lat: activeEtab.lat || null,
          lng: activeEtab.lng || null,
          phone: activeEtab.telephone || undefined,
          website: activeEtab.website || undefined,
          url: activeEtab.google_maps_url || undefined,
          rating: activeEtab.rating || null
        };
        window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: activeEtabFormatted }));
      } else if (dbList.length === 1) {
        const firstEtab = dbList[0];
        setActivePlace(firstEtab.place_id, {
          place_id: firstEtab.place_id,
          name: firstEtab.name,
          formatted_address: firstEtab.address,
          lat: firstEtab.lat ?? undefined,
          lng: firstEtab.lng ?? undefined,
          website: firstEtab.website,
          phone: firstEtab.phone,
          rating: firstEtab.rating ?? undefined,
        }).then(() => {
          window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: firstEtab }));
        });
      }
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
      sonnerToast.success(t("subscription.paymentSuccess"));
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("canceled") === "true") {
      sonnerToast.info(t("subscription.paymentCanceled"));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Quota included in base plan
  const INCLUDED_ESTABLISHMENTS = 1;

  // Handle add button click with subscription AND quota check
  const handleAddClick = async () => {
    if (!import.meta.env.PROD) {
      console.log("[SavedEstablishmentsList] handleAddClick triggered");
    }
    setCheckingSubscription(true);
    try {
      const status = await checkSubscription();
      if (!import.meta.env.PROD) {
        console.log("[SavedEstablishmentsList] Subscription status:", status);
        console.log("[SavedEstablishmentsList] Current establishments:", establishments.length);
      }

      // CASE 1: Not subscribed at all
      if (!status.subscribed) {
        if (!import.meta.env.PROD) {
          console.log("[SavedEstablishmentsList] User NOT subscribed, showing subscription modal");
        }
        setShowSubscriptionModal(true);
        return;
      }

      // CASE 2: Subscribed but quota exceeded (already has 1+ establishments)
      if (establishments.length >= INCLUDED_ESTABLISHMENTS) {
        if (!import.meta.env.PROD) {
          console.log("[SavedEstablishmentsList] Quota exceeded, showing addon modal", {
            current: establishments.length,
            included: INCLUDED_ESTABLISHMENTS
          });
        }
        // Show addon modal instead of navigating
        setShowSubscriptionModal(true);
        return;
      }

      // CASE 3: Subscribed and under quota - navigate directly
      if (!import.meta.env.PROD) {
        console.log("[SavedEstablishmentsList] Under quota, allowing navigation");
      }
      onAddClick?.();
    } catch (error) {
      console.error("[SavedEstablishmentsList] Error checking subscription:", error);
      sonnerToast.error(t("subscription.checkError"));
    } finally {
      setCheckingSubscription(false);
    }
  };

  // Create Stripe checkout session, update addon quantity, or use creator bypass
  const handleProceedToCheckout = async () => {
    if (!import.meta.env.PROD) {
      console.log("[SavedEstablishmentsList] handleProceedToCheckout triggered");
    }
    setCreatingCheckout(true);
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        sonnerToast.error(t("auth.mustBeLoggedIn"));
        return;
      }
      const newAddonQty = pricingInfo.additionalCount;

      // ======= CREATOR BYPASS =======
      if (isCreator()) {
        if (!import.meta.env.PROD) {
          console.log("[SavedEstablishmentsList] Creator bypass mode");
        }

        // If not subscribed yet, activate pro plan first
        if (!subscription.subscribed) {
          if (!import.meta.env.PROD) {
            console.log("[SavedEstablishmentsList] Creator: Activating pro plan first");
          }
          const proResult = await activateCreatorSubscription(PRODUCT_KEYS.PRO_1499_12M);
          if (!proResult.success) {
            sonnerToast.error(proResult.error || t("subscription.proActivationError"));
            return;
          }
        }

        // If adding an addon (additional establishment beyond the first)
        if (newAddonQty > 0) {
          if (!import.meta.env.PROD) {
            console.log("[SavedEstablishmentsList] Creator: Activating addon", {
              newAddonQty
            });
          }
          const addonResult = await activateCreatorSubscription(PRODUCT_KEYS.ADDON_MULTI_ETABLISSEMENTS);
          if (!addonResult.success) {
            sonnerToast.error(addonResult.error || t("subscription.addonActivationError"));
            return;
          }
        }
        await refreshSubscription();
        setShowSubscriptionModal(false);
        onAddClick?.();
        return;
      }

      // ======= NORMAL STRIPE FLOW =======

      // Check if user already has an active subscription
      if (subscription.subscribed) {
        // User is subscribed - update addon quantity
        if (!import.meta.env.PROD) {
          console.log("[SavedEstablishmentsList] Updating addon quantity", {
            newAddonQty
          });
        }
        const {
          data,
          error
        } = await supabase.functions.invoke("update-addon-quantity", {
          body: {
            new_addon_quantity: newAddonQty
          }
        });
        if (error) {
          console.error("[SavedEstablishmentsList] Update addon error:", error);
          sonnerToast.error(`${t("common.error")}: ${error.message}`);
          return;
        }
        if (data?.success) {
          sonnerToast.success(t("subscription.establishmentAdded"));
          await refreshSubscription();
          setShowSubscriptionModal(false);
          onAddClick?.();
        } else {
          sonnerToast.error(data?.error || t("common.updateError"));
        }
        return;
      }

      // New subscription checkout
      const establishmentsCount = establishments.length;
      if (!import.meta.env.PROD) {
        console.log("[SavedEstablishmentsList] Creating new subscription", {
          establishmentsCount,
          newTotal: establishmentsCount + 1
        });
      }
      const {
        data,
        error
      } = await supabase.functions.invoke("create-subscription", {
        body: {
          establishments_count: establishmentsCount + 1,
          priceId: activePlan.priceId
        }
      });
      if (!import.meta.env.PROD) {
        console.log("[SavedEstablishmentsList] create-subscription response:", {
          data,
          error
        });
      }
      if (error) {
        console.error("[SavedEstablishmentsList] Edge function error:", error);
        sonnerToast.error(`${t("common.error")}: ${error.message}`);
        return;
      }
      if (data?.error) {
        console.error("[SavedEstablishmentsList] Response error:", data.error);
        if (data.has_subscription) {
          sonnerToast.success(t("subscription.alreadySubscribed"));
          setShowSubscriptionModal(false);
          onAddClick?.();
        } else {
          sonnerToast.error(data.error);
        }
        return;
      }
      if (data?.url) {
        if (!import.meta.env.PROD) {
          console.log("[SavedEstablishmentsList] Redirecting to Stripe checkout:", data.url);
        }
        sessionStorage.setItem("stripeCheckoutStarted", "true");
        window.location.href = data.url;
      } else {
        console.error("[SavedEstablishmentsList] No URL in response:", data);
        sonnerToast.error(t("subscription.cannotCreatePaymentSession"));
      }
    } catch (error) {
      console.error("[SavedEstablishmentsList] Unexpected error:", error);
      sonnerToast.error(t("subscription.paymentCreationError"));
    } finally {
      setCreatingCheckout(false);
    }
  };

  const handleSelectEstablishment = async (etab: Etab) => {
    setSettingActive(etab.place_id);
    try {
      const payload = {
        place_id: etab.place_id,
        name: etab.name,
        formatted_address: etab.address,
        lat: etab.lat ?? undefined,
        lng: etab.lng ?? undefined,
        website: etab.website,
        phone: etab.phone,
        rating: etab.rating ?? undefined,
      };
      await setActivePlace(etab.place_id, payload);
      setEstablishments(prev => [
        etab,
        ...prev.filter(e => e.place_id !== etab.place_id),
      ]);
      window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: etab }));
      document.querySelector('[data-testid="card-mon-etablissement"]')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      sonnerToast.success(t("establishment.setAsActive", { name: etab.name }));
    } catch (err) {
      sonnerToast.error(t("common.error"));
    } finally {
      setSettingActive(null);
    }
  };

  // Ne rien afficher pendant le chargement ou si aucun établissement
  if (loading || establishments.length === 0) {
    return null;
  }
  return <>
      <section className="p-4 border border-border rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          {t("establishment.savedEstablishments")}
        </h3>
        
        <div className="flex flex-wrap gap-3">
          {establishments.map(etab => <EstablishmentItem key={etab.place_id} etab={etab} onSelect={handleSelectEstablishment} isActive={activePlaceId === etab.place_id} />)}
          
          {/* Bouton Ajouter un établissement - with billing gate */}
          <button onClick={handleAddClick} disabled={checkingSubscription} className="cursor-pointer bg-card border border-dashed border-border rounded-lg p-3 min-w-[200px] max-w-[250px] shadow-sm hover:shadow-md hover:bg-accent/10 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-2 min-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed" title={t("establishment.add")}>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {checkingSubscription ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <Plus className="w-5 h-5 text-primary" />}
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {checkingSubscription ? t("common.loading") : t("establishment.add")}
            </span>
          </button>
        </div>
        
        {establishments.length === 0 && <p className="text-muted-foreground text-sm mt-3">
            {t("establishment.noEstablishmentsSaved")}
          </p>}
      </section>

      {/* Subscription required modal */}
      <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
          {/* Badge Multi-établissements - positioned in modal header */}
          <div className="absolute -top-3 -right-3 bg-purple-600 text-white px-3 py-1 text-xs font-semibold rounded-lg shadow-md z-10">
            {t("subscription.multiEstablishments")}
          </div>
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-bold">{t("subscription.subscriptionRequired")}</DialogTitle>
            <DialogDescription className="text-sm">
              {t("subscription.mustSubscribeToAddEstablishments")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2 space-y-2 overflow-visible">
            {/* Plan principal - affiché dynamiquement selon l'abonnement actif */}
            <div className="rounded-xl p-3 border border-border bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-base font-bold text-foreground">{activePlan.name}</span>
                  <p className="text-xs text-muted-foreground">
                    {activePlan.id === "pro-engagement" ? t("subscription.commitment12Months") : t("subscription.withoutCommitment")}
                  </p>
                </div>
                <span className="text-lg font-bold text-blue-600">{activePlan.priceLabel}<span className="text-sm font-normal text-muted-foreground">/mois</span></span>
              </div>
            </div>
            
            {/* Établissement supplémentaire - avec quantité dynamique */}
            <div className="relative bg-white rounded-xl shadow-lg border-2 border-border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 my-1">
              <div className="px-3 py-1">
                {/* Header with title and dynamic quantity/price */}
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <div>
                    <h4 className="text-base font-bold text-foreground">
                      {t("subscription.additionalEstablishment")}
                      {pricingInfo.additionalCount > 0 && <span className="ml-2 text-xs font-normal text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                          ×{pricingInfo.additionalCount}
                        </span>}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {pricingInfo.additionalCount === 0 ? t("subscription.firstEstablishmentIncluded") : t("subscription.additionalEstablishmentPrice", { count: pricingInfo.additionalCount, price: "4,99" })}
                    </p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="text-xl font-bold text-purple-600">
                      {pricingInfo.formattedAddonTotal || "+0 €"}
                      <span className="text-xs font-normal text-muted-foreground">/mois</span>
                    </span>
                  </div>
                </div>
                
                {/* Feature list - same style as pricing cards */}
                <ul className="space-y-0">
                  <li className="flex items-center gap-2">
                    <span className="inline-flex w-4 h-4 rounded-full bg-purple-100 items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-purple-600" />
                    </span>
                    <span className="text-sm text-foreground leading-tight">{t("subscription.centralizeAllLocations")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-flex w-4 h-4 rounded-full bg-purple-100 items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-purple-600" />
                    </span>
                    <span className="text-sm text-foreground leading-tight">{t("subscription.idealForGroupsFranchises")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-flex w-4 h-4 rounded-full bg-purple-100 items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-purple-600" />
                    </span>
                    <span className="text-sm text-foreground leading-tight">{t("subscription.independentTrackingPerEstablishment")}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Total mensuel dynamique */}
            <div className="rounded-xl p-3 border-2 border-blue-600 bg-primary-foreground">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-base font-bold text-foreground">{t("subscription.monthlyTotal")}</span>
                  <p className="text-xs text-muted-foreground">
                    {pricingInfo.newCount === 1 
                      ? t("subscription.establishmentAfterAdd") 
                      : t("subscription.establishmentsAfterAdd", { count: pricingInfo.newCount })}
                  </p>
                </div>
                <span className="text-xl font-bold text-blue-600">
                  {pricingInfo.formattedTotal}
                  <span className="text-sm font-normal text-muted-foreground">/mois</span>
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2 sm:gap-0 pt-1">
            <Button variant="outline" onClick={() => setShowSubscriptionModal(false)} disabled={creatingCheckout}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleProceedToCheckout} disabled={creatingCheckout} className="bg-blue-600 hover:bg-blue-700 text-white">
              {creatingCheckout ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.redirecting")}
                </> : t("subscription.subscribe")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
}