import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { CreditCard, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function BillingSettings() {
  const navigate = useNavigate();
  const subscription = useSubscription();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Facturation / Abonnement</h1>

      {/* Plan actuel */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Plan actuel</h2>
        </div>

        {subscription?.isActive ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Check className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">
                {subscription.planName || "Plan actif"}
              </h3>
            </div>
            <p className="text-sm text-green-700">
              Votre abonnement est actif
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <X className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Aucun abonnement actif</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Vous utilisez actuellement le plan gratuit
            </p>
            <Button onClick={() => navigate("/abonnement")}>
              Voir les plans disponibles
            </Button>
          </div>
        )}
      </div>

      {/* Gestion de la facturation */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Gestion de la facturation</h2>
        <div className="space-y-3">
          <Button variant="outline" onClick={() => navigate("/abonnement")} className="w-full sm:w-auto">
            Gérer l'abonnement
          </Button>
          <Button variant="outline" onClick={() => navigate("/abonnement")} className="w-full sm:w-auto ml-0 sm:ml-2">
            Historique des factures
          </Button>
        </div>
      </div>
    </div>
  );
}
