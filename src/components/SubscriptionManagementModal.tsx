import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, AlertTriangle, X, Building2, MapPin, Trash2, ArrowRight } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { subscriptionPlans, establishmentAddon } from "@/config/subscriptionPlans";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr, enUS, it, es, ptBR } from "date-fns/locale";
import { Etab, STORAGE_KEY, EVT_SAVED, EVT_LIST_UPDATED } from "@/types/etablissement";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubscriptionManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionManagementModal({
  open,
  onOpenChange,
}: SubscriptionManagementModalProps) {
  const { subscription, loading, refresh } = useSubscription();
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showChangeConfirm, setShowChangeConfirm] = useState(false);
  const [targetPlanId, setTargetPlanId] = useState<string | null>(null);
  const [establishments, setEstablishments] = useState<Array<{ id: string; place_id: string; name: string; address: string | null; is_active: boolean; lat?: number | null; lng?: number | null; phone?: string | null; website?: string | null; url?: string | null; rating?: number | null }>>([]);
  const [establishmentsLoading, setEstablishmentsLoading] = useState(false);
  const [updatingEstablishment, setUpdatingEstablishment] = useState<string | null>(null);
  const { t, i18n } = useTranslation();

  // Détermine le plan actif
  const activePlan = useMemo(() => {
    if (!subscription.subscribed || !subscription.price_id) {
      return null;
    }
    return subscriptionPlans.find((p) => p.priceId === subscription.price_id) || null;
  }, [subscription.subscribed, subscription.price_id]);

  // Plans disponibles (excluant le plan actif)
  const availablePlans = useMemo(() => {
    return subscriptionPlans.filter((plan) => plan.id !== activePlan?.id);
  }, [activePlan]);

  const subscriptionEndDate = subscription.subscription_end
    ? format(new Date(subscription.subscription_end), "d MMMM yyyy", { 
        locale: i18n.language === 'fr' ? fr : 
               i18n.language === 'it' ? it :
               i18n.language === 'es' ? es :
               i18n.language === 'pt' ? ptBR : enUS
      })
    : null;

  // Charger les établissements
  useEffect(() => {
    if (!open || !subscription.subscribed) return;

    const loadEstablishments = async () => {
      setEstablishmentsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("établissements")
          .select("id, place_id, nom, adresse, is_active, lat, lng, telephone, website, google_maps_url, rating")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (error) throw error;

        setEstablishments(
          (data || []).map((row) => ({
            id: row.id,
            place_id: row.place_id,
            name: row.nom,
            address: row.adresse,
            is_active: row.is_active ?? false,
            lat: row.lat,
            lng: row.lng,
            phone: row.telephone,
            website: row.website,
            url: row.google_maps_url,
            rating: row.rating,
          }))
        );
      } catch (error) {
        console.error("Error loading establishments:", error);
        toast.error(t("establishment.loadError"));
      } finally {
        setEstablishmentsLoading(false);
      }
    };

    loadEstablishments();
  }, [open, subscription.subscribed]);

  // Calculer le prix total
  // Le premier établissement est inclus dans l'abonnement de base
  // Les établissements supplémentaires sont facturés à 4,99 €/mois chacun
  const totalPrice = useMemo(() => {
    if (!activePlan) return 0;
    const totalCount = establishments.length;
    const additionalCount = Math.max(0, totalCount - 1);
    return activePlan.price + additionalCount * establishmentAddon.price;
  }, [activePlan, establishments]);

  // Supprimer un établissement
  const handleDeleteEstablishment = async (establishmentId: string) => {
    if (!subscription.subscribed) {
      toast.error(t("subscription.mustHaveActiveSubscription"));
      return;
    }

    setUpdatingEstablishment(establishmentId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Supprimer l'établissement de la base de données
      const { error: deleteError } = await supabase
        .from("établissements")
        .delete()
        .eq("id", establishmentId)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      // Mettre à jour la liste locale
      const remainingEstablishments = establishments.filter((e) => e.id !== establishmentId);
      setEstablishments(remainingEstablishments);

      // Si des établissements restent, sélectionner automatiquement le premier
      if (remainingEstablishments.length > 0) {
        const firstRemaining = remainingEstablishments[0];
        
        // Marquer comme actif dans la DB
        await supabase
          .from("établissements")
          .update({ is_active: true })
          .eq("user_id", user.id)
          .eq("place_id", firstRemaining.place_id);

        // Mettre à jour localStorage pour synchroniser avec useCurrentEstablishment
        const etabData: Etab = {
          place_id: firstRemaining.place_id,
          name: firstRemaining.name,
          address: firstRemaining.address || "",
          phone: firstRemaining.phone || undefined,
          website: firstRemaining.website || undefined,
          url: firstRemaining.url || undefined,
          rating: firstRemaining.rating || undefined,
          lat: firstRemaining.lat || null,
          lng: firstRemaining.lng || null,
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(etabData));
        
        // Notifier les autres composants
        window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: etabData }));
        
        toast.success(t("establishment.autoSelected", { name: firstRemaining.name }), {
          duration: 3000,
        });
      } else {
        // Aucun établissement restant, nettoyer localStorage
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent(EVT_SAVED));
      }

      // Calculer le nouveau nombre d'établissements (premier inclus, les suivants en supplément)
      const newTotalCount = remainingEstablishments.length;
      const additionalCount = Math.max(0, newTotalCount - 1);

      // Mettre à jour la quantité dans Stripe
      const { error: stripeError } = await supabase.functions.invoke("update-addon-quantity", {
        body: { new_addon_quantity: additionalCount },
      });

      if (stripeError) {
        console.error("Error updating Stripe:", stripeError);
        toast.error(t("subscription.billingUpdateError"));
      } else {
        // Recharger les établissements depuis la DB pour avoir les données à jour
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { data: updatedEstablishments } = await supabase
            .from("établissements")
            .select("id, place_id, nom, adresse, is_active, lat, lng, telephone, website, google_maps_url, rating")
            .eq("user_id", currentUser.id)
            .order("updated_at", { ascending: false });
          
          if (updatedEstablishments) {
            setEstablishments(
              updatedEstablishments.map((row) => ({
                id: row.id,
                place_id: row.place_id,
                name: row.nom,
                address: row.adresse,
                is_active: row.is_active ?? false,
                lat: row.lat,
                lng: row.lng,
                phone: row.telephone,
                website: row.website,
                url: row.google_maps_url,
                rating: row.rating,
              }))
            );
          }
        }
        
        window.dispatchEvent(new CustomEvent(EVT_LIST_UPDATED));
        toast.success(t("establishment.deleted"));
        await refresh();
      }
    } catch (error: any) {
      console.error("Error deleting establishment:", error);
      toast.error(error?.message || t("establishment.deleteError"));
    } finally {
      setUpdatingEstablishment(null);
    }
  };

  const handleChangePlan = async (planId: string) => {
    setTargetPlanId(planId);
    setShowChangeConfirm(true);
  };

  const confirmChangePlan = async () => {
    if (!targetPlanId) return;

    const targetPlan = subscriptionPlans.find((p) => p.id === targetPlanId);
    if (!targetPlan) return;

    setChangingPlan(targetPlanId);
    setShowChangeConfirm(false);

    try {
      const { data, error } = await supabase.functions.invoke("update-subscription", {
        body: { new_price_id: targetPlan.priceId },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success(t("subscription.updateSuccess"));
      await refresh();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating subscription:", error);
      toast.error(error?.message || t("subscription.updateError"));
    } finally {
      setChangingPlan(null);
      setTargetPlanId(null);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription");

      if (error) {
        throw new Error(error.message);
      }

      toast.success(t("subscription.cancelSuccess"));
      await refresh();
      setShowCancelDialog(false);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      toast.error(error?.message || t("subscription.cancelError"));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl" hideCloseButton>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none"
          >
            <ArrowRight className="w-6 h-6 text-blue-600 hover:text-blue-700" />
            <span className="sr-only">{t("common.close")}</span>
          </button>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!subscription.subscribed || !activePlan) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl" hideCloseButton>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none"
          >
            <ArrowRight className="w-6 h-6 text-blue-600 hover:text-blue-700" />
            <span className="sr-only">{t("common.close")}</span>
          </button>
          <DialogHeader>
            <DialogTitle>{t("subscription.manageSubscription")}</DialogTitle>
            <DialogDescription>
              {t("subscription.noActiveSubscription")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {t("subscription.visitPricingPage")}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const targetPlan = targetPlanId
    ? subscriptionPlans.find((p) => p.id === targetPlanId)
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" hideCloseButton>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none"
          >
            <ArrowRight className="w-6 h-6 text-blue-600 hover:text-blue-700" />
            <span className="sr-only">{t("common.close")}</span>
          </button>
          <DialogHeader>
            <DialogTitle>{t("subscription.manageSubscription")}</DialogTitle>
            <DialogDescription>
              {t("subscription.manageSubscriptionDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Abonnement actuel */}
            <Card className="border border-gray-200 bg-white rounded-xl shadow-md hover:border-blue-600 hover:shadow-md transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{t("subscription.currentPlan")}</CardTitle>
                  <Badge className="bg-blue-600 text-white border-0">{t("common.current")}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("subscription.planType")}</span>
                  <span className="font-medium">
                    {activePlan.name} {activePlan.id === "pro-engagement" ? t("subscription.withCommitment") : t("subscription.withoutCommitment")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("subscription.currentPrice")}</span>
                  <span className="font-medium">{activePlan.priceLabel}{t("common.perMonth")}</span>
                </div>
                {subscriptionEndDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("subscription.renewalDate")}</span>
                    <span className="font-medium">{subscriptionEndDate}</span>
                  </div>
                )}
                <div className="pt-3 border-t mt-3">
                  <button
                    type="button"
                    onClick={() => setShowCancelDialog(true)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full font-medium transition-colors"
                  >
                    {t("subscription.unsubscribe")}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Options disponibles */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t("subscription.availableOptions")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availablePlans.map((plan) => {
                  const isFlexible = plan.badgeColor === "blue";
                  return (
                    <Card
                      key={plan.id}
                      className="relative overflow-hidden bg-white rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 border-border"
                    >
                      {plan.badge && (
                        <div
                          className={`absolute top-0 right-0 text-white px-4 py-1.5 text-xs font-semibold rounded-bl-xl ${
                            plan.badgeColor === "purple"
                              ? "bg-purple-600"
                              : "bg-[#F59E0B]"
                          }`}
                        >
                          {plan.badge}
                        </div>
                      )}
                      <CardHeader className="pb-4 pt-8">
                        <CardTitle className="text-xl font-bold text-foreground mb-2">
                          {plan.name} {plan.id === "pro-engagement" ? t("subscription.withCommitment") : t("subscription.withoutCommitment")}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground min-h-[40px]">
                          {plan.description}
                        </p>
                        <div className="mt-4">
                          <span
                            className={`text-4xl font-bold ${
                              plan.badgeColor === "purple" ? "text-purple-600" : "text-blue-600"
                            }`}
                          >
                            {plan.priceLabel}
                          </span>
                          <span className="text-lg text-muted-foreground ml-2">{t("common.perMonth")}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pb-6">
                        <ul className="space-y-3">
                          {plan.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <CheckCircle2
                                className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                                  plan.badgeColor === "purple" ? "text-purple-600" : "text-blue-600"
                                }`}
                              />
                              <span className="text-foreground">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          className={`w-full mt-4 h-11 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all rounded-lg ${
                            plan.badgeColor === "purple"
                              ? "bg-purple-600 hover:bg-purple-700"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                          onClick={() => handleChangePlan(plan.id)}
                          disabled={changingPlan === plan.id}
                        >
                          {changingPlan === plan.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t("common.updating")}
                            </> 
                          ) : (
                            t("subscription.changeToThisPlan")
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Gérer les établissements */}
            {subscription.subscribed && (
              <div>
                <h3 className="text-lg font-semibold mb-4">{t("subscription.manageEstablishments")}</h3>
                {establishmentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : establishments.length === 0 ? (
                  <Card>
                    <CardContent className="py-6 text-center text-muted-foreground">
                      {t("establishment.noEstablishmentsSaved")}
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      {establishments.map((est, index) => {
                        const isFirst = index === 0;
                        return (
                          <Card key={est.id} className="border border-gray-200 rounded-lg shadow-sm">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                                    <h4 className="font-medium text-foreground truncate">{est.name}</h4>
                                    {isFirst ? (
                                      <Badge className="bg-blue-100 text-blue-600 border-blue-600 text-xs">
                                        {t("subscription.included")}
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-purple-100 text-purple-700 border-purple-300 text-xs">
                                        {t("subscription.additional")}
                                      </Badge>
                                    )}
                                  </div>
                                  {est.address && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <MapPin className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{est.address}</span>
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEstablishment(est.id)}
                                  disabled={updatingEstablishment === est.id}
                                  className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={t("establishment.delete")}
                                >
                                  {updatingEstablishment === est.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    {activePlan && (() => {
                      const additionalCount = Math.max(0, establishments.length - 1);
                      return (
                        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{t("subscription.totalMonthlyPrice")}</span>
                              <span className="text-lg font-bold text-blue-600">
                                {totalPrice.toFixed(2).replace(".", ",")} €{t("common.perMonth")}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {activePlan.priceLabel}{t("common.perMonth")} ({t("subscription.basePlan")}) +{" "}
                              {additionalCount > 0 ? `${additionalCount} × ${establishmentAddon.price.toFixed(2).replace(".", ",")} €` : "0 €"} ({t("subscription.additionalEstablishments")})
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })()}
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de changement */}
      <AlertDialog open={showChangeConfirm} onOpenChange={setShowChangeConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("subscription.confirmChangePlan")}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{t("subscription.confirmChangePlanQuestion")}</p>
              {targetPlan && (
                <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("subscription.newPrice")}:</span>
                    <span className="font-medium">{targetPlan.priceLabel}{t("common.perMonth")}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("subscription.effectiveDate")}:</span>
                    <span className="font-medium">{t("subscription.immediate")}</span>
                  </div>
                  {activePlan && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("subscription.oldPrice")}:</span>
                      <span className="font-medium line-through">{activePlan.priceLabel}{t("common.perMonth")}</span>
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {t("subscription.changeEffectiveImmediately")}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChangePlan}>
              {t("subscription.confirmChange")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation d'annulation */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              {t("subscription.cancelSubscription")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2">
                {t("subscription.confirmCancelSubscriptionQuestion")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("subscription.confirmCancelSubscriptionDesc")}{subscriptionEndDate ? ` (${subscriptionEndDate})` : ""}.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              className="bg-red-600 hover:bg-red-700"
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("subscription.cancelling")}
                </>
              ) : (
                t("subscription.confirmCancellation")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

