import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { getBillingSummary } from "@/services/billingSummary";
import { CurrentPlanCard } from "@/components/CurrentPlanCard";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";

export function BillingSettings() {
  const navigate = useNavigate();
  const { subscription, loading } = useSubscription();
  const summary = getBillingSummary(subscription);
  const isFree = summary.status === "inactive";

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Facturation / Abonnement</h1>

      {/* Plan actuel */}
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
          <CurrentPlanCard summary={summary} />
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
            <Button onClick={() => navigate("/abonnement")}>
              Gérer mon abonnement
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
