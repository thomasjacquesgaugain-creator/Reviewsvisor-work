import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { getBillingSummary } from "@/services/billingSummary";
import { subscriptionPlans, establishmentAddon } from "@/config/subscriptionPlans";
import { createCustomerPortalSession } from "@/lib/stripe";
import { CurrentPlanCard } from "@/components/CurrentPlanCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Download, ExternalLink, Loader2, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function BillingSettings() {
  const navigate = useNavigate();
  const { subscription, loading } = useSubscription();
  const summary = getBillingSummary(subscription);
  const isFree = summary.status === "inactive";

  // const [extraEstablishmentsCount, setExtraEstablishmentsCount] = useState<number | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const { t } = useTranslation();

  // useEffect(() => {
  //   let cancelled = false;
  //   (async () => {
  //     const { data: { user }, error: userError } = await supabase.auth.getUser();
  //     if (userError || !user || cancelled) {
  //       if (!cancelled) setExtraEstablishmentsCount(0);
  //       return;
  //     }
  //     // change establishment from établissements
  //     const { count, error } = await supabase
  //       .from("establishments")
  //       .select("*", { count: "exact", head: true })
  //       .eq("user_id", user.id);
  //     if (cancelled) return;
  //     if (error) {
  //       console.error("Erreur comptage établissements:", error);
  //       setExtraEstablishmentsCount(0);
  //       return;
  //     }
  //     const total = count ?? 0;
  //     setExtraEstablishmentsCount(Math.max(0, total - 1));
  //   })();
  //   return () => { cancelled = true; };
  // }, []);

const activePlan = useMemo(
  () =>
    summary.activeSubscriptions.length > 0
      ? subscriptionPlans.find(
          (p) => p.priceId === summary.activeSubscriptions[0].priceId
        ) ?? null
      : null,
  [summary.activeSubscriptions]
);

  // const basePlanMonthly = activePlan
  //   ? activePlan.id === "pro-engagement"
  //     ? activePlan.price / 12
  //     : activePlan.price
  //   : 0;
  // const extraCount = extraEstablishmentsCount ?? 0;
  // const addonTotal = extraCount * establishmentAddon.price;
  // const totalMonthly = basePlanMonthly + addonTotal;
  const formatEuro = (n: number) => n.toFixed(2).replace(".", ",");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">{t("settings.BillingAndSubscription.title")}</h1>

      {/* Plan actuel - carte style /abonnement si plan Pro, sinon bloc simple */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        {/* <div className="flex items-center gap-3 mb-6">
          <CreditCard className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">{t("settings.BillingAndSubscription.currentPlan")}</h2>
        </div> */}

        {loading ? (
          <div className="flex items-center gap-3 text-muted-foreground py-6">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t("settings.BillingAndSubscription.loadingPlan")}</span>
          </div>
        ) : (
          <>
            <CurrentPlanCard summary={summary} activePlan={activePlan} />
            {/* Établissements supplémentaires : calculé depuis la table établissements (total - 1). Masqué si 0 ou négatif. */}
           {summary.activeSubscriptions.length > 0 && (
  <div className="mt-8">
    <div className="flex items-center gap-3 mb-4">
      <CreditCard className="h-5 w-5 text-gray-400" />
      <h2 className="text-lg font-medium text-gray-900">
       {t("subscription.activeSubscriptions")} ({summary.activeSubscriptions.length})
      </h2>
    </div>
    <div className="space-y-3 max-w-3xl">
      {summary.activeSubscriptions.map((sub, i) => (
        <Card key={sub.subscriptionId} className="bg-white border border-border rounded-xl">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground">
                {sub.planName}
                {sub.planBilling && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    · {sub.planBilling === "annual" ? t("subscription.yearly") : t("subscription.monthly")}
                  </span>
                )}
              </p>
              {sub.periodEnd && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {sub.cancelAtPeriodEnd ? t("subscription.endsOn") :t("subscription.renewsOn")}{" "}
                  {new Date(sub.periodEnd).toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                {t("subscription.active")}
              </span>
              {/* {(sub.latestInvoicePdfUrl || sub.latestInvoiceHostedUrl) ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    const url = sub.latestInvoicePdfUrl || sub.latestInvoiceHostedUrl;
                    if (url) {
                      window.open(url, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  Télécharger la facture
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Facture indisponible
                </Button>
              )} */}
            </div>
          </CardContent>
        </Card>
      ))}
                </div>
              </div>
            )}
            {summary.activeSubscriptions.length === 0 && !isFree && (
              <p className="mt-6 text-sm text-muted-foreground">
                {t("settings.BillingAndSubscription.noAdditionalEstablishments")}
              </p>
            )}
          </>
        )}
      </div>

      {/* Gestion de la facturation */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">{t("settings.BillingAndSubscription.billingManagement")}</h2>
        <div className="flex flex-wrap gap-3">
          {isFree ? (
            <Button onClick={() => navigate("/abonnement")}>
              {t("settings.BillingAndSubscription.viewAvailablePlans")}
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
                  t("settings.BillingAndSubscription.manageMySubscription")
              )}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate("/settings/billing/reports")}
            className="ml-0 sm:ml-0"
          >
            {t("settings.BillingAndSubscription.invoiceHistory")}
          </Button>
        </div>
      </div>
    </div>
  );
}
