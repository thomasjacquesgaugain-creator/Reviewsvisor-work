import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { getBillingSummary } from "@/services/billingSummary";
import { subscriptionPlans, establishmentAddon } from "@/config/subscriptionPlans";
import { createCustomerPortalSession } from "@/lib/stripe";
import { CurrentPlanCard } from "@/components/CurrentPlanCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Loader2, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function BillingSettings() {
  const navigate = useNavigate();
  const { subscription, loading } = useSubscription();
  const summary = getBillingSummary(subscription);
  const isFree = summary.status === "inactive";

  const [extraEstablishmentsCount, setExtraEstablishmentsCount] = useState<number | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user || cancelled) {
        if (!cancelled) setExtraEstablishmentsCount(0);
        return;
      }
      const { count, error } = await supabase
        .from("établissements")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (cancelled) return;
      if (error) {
        console.error("Erreur comptage établissements:", error);
        setExtraEstablishmentsCount(0);
        return;
      }
      const total = count ?? 0;
      setExtraEstablishmentsCount(Math.max(0, total - 1));
    })();
    return () => { cancelled = true; };
  }, []);

  const activePlan = useMemo(
    () =>
      subscription?.price_id
        ? subscriptionPlans.find((p) => p.priceId === subscription.price_id) ?? null
        : null,
    [subscription?.price_id]
  );

  const basePlanMonthly = activePlan
    ? activePlan.id === "pro-engagement"
      ? activePlan.price / 12
      : activePlan.price
    : 0;
  const extraCount = extraEstablishmentsCount ?? 0;
  const addonTotal = extraCount * establishmentAddon.price;
  const totalMonthly = basePlanMonthly + addonTotal;
  const formatEuro = (n: number) => n.toFixed(2).replace(".", ",");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Facturation / Abonnement</h1>

      {/* Plan actuel - carte style /abonnement si plan Pro, sinon bloc simple */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Plan actuel</h2>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-muted-foreground py-6">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Chargement du plan...</span>
          </div>
        ) : (
          <>
            <CurrentPlanCard summary={summary} activePlan={activePlan} />
            {/* Établissements supplémentaires : calculé depuis la table établissements (total - 1). Masqué si 0 ou négatif. */}
            {extraEstablishmentsCount !== null && extraEstablishmentsCount > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">Établissements supplémentaires</h2>
                </div>
                <Card className="relative overflow-hidden bg-white rounded-2xl shadow-lg border-2 border-purple-500 w-full max-w-3xl">
                  <CardHeader className="pb-4 pt-6 px-5">
                    <CardTitle className="text-xl font-bold text-foreground">
                      Établissements supplémentaires
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      {extraEstablishmentsCount} établissement{extraEstablishmentsCount > 1 ? "s" : ""} supplémentaire{extraEstablishmentsCount > 1 ? "s" : ""}
                    </p>
                    <div className="mt-4 flex flex-wrap items-baseline gap-4">
                      <div>
                        <span className="text-2xl font-bold text-purple-600">
                          {extraEstablishmentsCount}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          × {establishmentAddon.price.toFixed(2).replace(".", ",")} €/mois
                        </span>
                      </div>
                      <div className="text-lg font-semibold text-purple-600">
                        Total : {(extraEstablishmentsCount * establishmentAddon.price).toFixed(2).replace(".", ",")} €/mois
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-6 px-5 pt-0">
                    <p className="text-sm text-muted-foreground">
                      Prix unitaire : {establishmentAddon.price.toFixed(2).replace(".", ",")} €/mois par établissement
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            {extraEstablishmentsCount === 0 && (
              <p className="mt-6 text-sm text-muted-foreground">Aucun établissement supplémentaire</p>
            )}

            {/* Total mensuel : récap abonnement + établissements supplémentaires */}
            {!loading && activePlan && (
              <div className="mt-8">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">Total mensuel</h2>
                </div>
                <Card className="relative overflow-hidden bg-white rounded-2xl shadow-lg border-2 border-blue-500 w-full max-w-3xl">
                  <CardContent className="p-6">
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex justify-between items-center">
                        <span>Abonnement Pro ({activePlan.priceLabel})</span>
                        <span>{formatEuro(basePlanMonthly)} €/mois</span>
                      </li>
                      {extraCount > 0 && (
                        <li className="flex justify-between items-center">
                          <span>Établissements supplémentaires ({extraCount})</span>
                          <span>{formatEuro(addonTotal)} €/mois</span>
                        </li>
                      )}
                    </ul>
                    <div className="mt-4 pt-4 border-t-2 border-blue-200 flex justify-between items-center">
                      <span className="text-lg font-semibold text-foreground">Total mensuel</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatEuro(totalMonthly)} €/mois
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* Gestion de la facturation */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Gestion de la facturation</h2>
        <div className="flex flex-wrap gap-3">
          {isFree ? (
            <Button onClick={() => navigate("/abonnement")}>
              Voir les plans disponibles
            </Button>
          ) : (
            <Button
              onClick={async () => {
                setPortalLoading(true);
                try {
                  const url = await createCustomerPortalSession();
                  if (url) {
                    window.location.href = url;
                    return;
                  }
                  toast.error("Impossible d'ouvrir le portail de facturation");
                } catch (err) {
                  console.error("Customer portal error:", err);
                  toast.error("Impossible d'ouvrir le portail de facturation");
                } finally {
                  setPortalLoading(false);
                }
              }}
              disabled={portalLoading}
            >
              {portalLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ouverture...
                </>
              ) : (
                "Gérer mon abonnement"
              )}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate("/settings/billing/reports")}
            className="ml-0 sm:ml-0"
          >
            Historique des factures
          </Button>
        </div>
      </div>
    </div>
  );
}
