import { useState } from "react";
import { Check, Loader2, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { subscriptionPlans, type SubscriptionPlan } from "@/config/subscriptionPlans";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Etab } from "@/types/etablissement";

const MONTHLY_AVERAGE_REVIEWS = 66; // TODO: replace with dynamic value

function getRecommendedTier(avgReviews: number): TierKey {
  if (avgReviews <= 25)  return "basic";
  if (avgReviews <= 50)  return "standard";
  if (avgReviews <= 100) return "pro";
  return "premium";
}

type TierKey = "basic" | "standard" | "pro" | "premium";

const TIERS: {
  key: TierKey;
  label: string;
  quota: string;
  color: string;
  audience: string;
}[] = [
  { key: "basic",    label: "Basic",    quota: "Jusqu'à 25 avis / mois",   color: "green",  audience: "Idéal pour les petites entreprises." },
  { key: "standard", label: "Standard", quota: "Jusqu'à 50 avis / mois",   color: "blue",   audience: "Pour les restaurants et commerces actifs." },
  { key: "pro",      label: "Pro",      quota: "Jusqu'à 100 avis / mois",  color: "purple", audience: "Pour les grands établissements." },
  { key: "premium",  label: "Premium",  quota: "Plus de 100 avis / mois",  color: "pink",   audience: "Pour les établissements à fort volume." },
];

const TIER_COLORS: Record<string, {
  border: string;
  badge: string;
  check: string;
  selected: string;
  recommended: string;
  recommendedText: string;
  disabledBg: string;
}> = {
  green:  {
    border: "border-green-400",
    badge: "bg-green-600",
    check: "text-green-600",
    selected: "border-green-500 bg-green-50",
    recommended: "bg-green-600",
    recommendedText: "text-green-700",
    disabledBg: "bg-gray-50",
  },
  blue:   {
    border: "border-blue-400",
    badge: "bg-blue-600",
    check: "text-blue-600",
    selected: "border-blue-500 bg-blue-50",
    recommended: "bg-blue-600",
    recommendedText: "text-blue-700",
    disabledBg: "bg-gray-50",
  },
  purple: {
    border: "border-violet-400",
    badge: "bg-violet-600",
    check: "text-violet-600",
    selected: "border-violet-500 bg-violet-50",
    recommended: "bg-violet-600",
    recommendedText: "text-violet-700",
    disabledBg: "bg-gray-50",
  },
  pink:   {
    border: "border-pink-400",
    badge: "bg-pink-600",
    check: "text-pink-600",
    selected: "border-pink-500 bg-pink-50",
    recommended: "bg-pink-600",
    recommendedText: "text-pink-700",
    disabledBg: "bg-gray-50",
  },
};

interface Props {
  open: boolean;
  onClose: () => void;
  establishment: Etab | null;
}

export function PlanSelectionModal({ open, onClose, establishment }: Props) {
  const recommendedTier = getRecommendedTier(MONTHLY_AVERAGE_REVIEWS);

  const defaultPlan = subscriptionPlans.find(
    (p) => p.tier === recommendedTier && p.billing === "annual"
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string>(defaultPlan?.id ?? "");
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");
  const [loading, setLoading] = useState(false);

  const handleBillingChange = (cycle: "annual" | "monthly") => {
    setBillingCycle(cycle);
    const currentPlan = subscriptionPlans.find((p) => p.id === selectedPlanId);
    if (currentPlan) {
      const sameTierOtherCycle = subscriptionPlans.find(
        (p) => p.tier === currentPlan.tier && p.billing === cycle
      );
      if (sameTierOtherCycle) setSelectedPlanId(sameTierOtherCycle.id);
    } else {
      const fallback = subscriptionPlans.find(
        (p) => p.tier === recommendedTier && p.billing === cycle
      );
      if (fallback) setSelectedPlanId(fallback.id);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlanId) return;
    const plan = subscriptionPlans.find((p) => p.id === selectedPlanId);
    if (!plan) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (establishment) {
        sessionStorage.setItem("pendingEstablishment", JSON.stringify(establishment));
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceId: plan.priceId,
          pendingEstablishment: establishment
            ? {
                place_id: establishment.place_id,
                name: establishment.name,
                address: establishment.address,
                phone: establishment.phone ?? null,
                website: establishment.website ?? null,
                rating: establishment.rating ?? null,
                lat: establishment.lat ?? null,
                lng: establishment.lng ?? null,
                type_etablissement: establishment.type_etablissement ?? null,
              }
            : null,
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (error) throw error;

      if (data?.url) {
        sessionStorage.setItem("stripeCheckoutStarted", "true");
        window.location.href = data.url;
      } else {
        toast.error("Impossible de créer la session de paiement.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = subscriptionPlans.find((p) => p.id === selectedPlanId);

  const annualSavingsHint = (() => {
    if (billingCycle !== "annual") return null;
    const annualPlan = subscriptionPlans.find(
      (p) => p.tier === recommendedTier && p.billing === "annual"
    );
    const monthlyPlan = subscriptionPlans.find(
      (p) => p.tier === recommendedTier && p.billing === "monthly"
    );
    if (!annualPlan || !monthlyPlan) return null;
    const saving = monthlyPlan.priceTTC - annualPlan.priceTTC;
    return saving > 0
      ? `Économisez 20% — soit ${saving.toFixed(2).replace(".", ",")} € / mois`
      : null;
  })();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-xl font-bold text-center">
            Offre associée à votre établissement
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            Basé sur les informations de votre{" "}
            <strong>établissement</strong>, l'offre appropriée est :
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-1 py-2">
          <div className="flex items-center bg-muted rounded-full p-1 gap-1">
            <button
              onClick={() => handleBillingChange("monthly")}
              className={cn(
                "px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200",
                billingCycle === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-muted-foreground hover:text-gray-700"
              )}
            >
              Mensuel
            </button>
            <button
              onClick={() => handleBillingChange("annual")}
              className={cn(
                "px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                billingCycle === "annual"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-muted-foreground hover:text-gray-700"
              )}
            >
              • Annuel
            </button>
          </div>
          {billingCycle === "annual" && annualSavingsHint && (
            <p className="text-xs text-green-700 font-medium">
              Facturation annuelle, {annualSavingsHint}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-2">
          {TIERS.map((tier) => {
            const plan = subscriptionPlans.find(
              (p) => p.tier === tier.key && p.billing === billingCycle
            );
            if (!plan) return null;

            const isRecommended = tier.key === recommendedTier;
            const isDisabled = !isRecommended;
            const isSelected = selectedPlanId === plan.id;
            const colors = TIER_COLORS[tier.color];

            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                tier={tier}
                colors={colors}
                isRecommended={isRecommended}
                isDisabled={isDisabled}
                isSelected={isSelected}
                onSelect={() => {
                  if (!isDisabled) setSelectedPlanId(plan.id);
                }}
              />
            );
          })}
        </div>

        {billingCycle === "annual" && selectedPlan?.annualTotalTTC && (
          <p className="text-xs text-center text-muted-foreground">
            Prix annuel de{" "}
            <strong>{selectedPlan.annualTotalTTC.toFixed(0)} € TTC</strong>{" "}
            (TVA 20% incluse), soit{" "}
            <strong>{selectedPlan.priceHT.toFixed(2).replace(".", ",")} € / mois HT</strong>.
          </p>
        )}

        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Plus tard
          </Button>
          <Button
            onClick={handleSubscribe}
            disabled={!selectedPlanId || loading}
            className="bg-primary hover:bg-primary/90 min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Redirection...
              </>
            ) : (
              "S'abonner →"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PlanCardProps {
  plan: SubscriptionPlan;
  tier: (typeof TIERS)[number];
  colors: (typeof TIER_COLORS)[string];
  isRecommended: boolean;
  isDisabled: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

function PlanCard({
  plan,
  tier,
  colors,
  isRecommended,
  isDisabled,
  isSelected,
  onSelect,
}: PlanCardProps) {
  return (
    <div className="relative pt-4">
      <div className="absolute -top-0 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
        {isRecommended ? (
          <span
            className={cn(
              "text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1",
              colors.recommended
            )}
          >
            ★ Recommandé pour vous
          </span>
        ) : (
          <span className="bg-gray-200 text-gray-500 text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            {plan.billing === "annual" ? "Flexible" : "Flexible"}
          </span>
        )}
      </div>

      <button
        onClick={onSelect}
        disabled={isDisabled}
        className={cn(
          "relative w-full rounded-2xl border-2 p-3 text-left transition-all duration-200 flex flex-col h-full",
          isDisabled
            ? "border-border bg-gray-50 opacity-60 cursor-not-allowed"
            : isSelected
            ? cn(colors.selected, colors.border, "shadow-md cursor-pointer")
            : "border-border bg-white hover:border-gray-300 hover:shadow-sm cursor-pointer"
        )}
      >
        {isSelected && !isDisabled && (
          <div
            className={cn(
              "absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center",
              colors.badge
            )}
          >
            <Check className="w-3 h-3 text-white" />
          </div>
        )}

        {isDisabled && (
          <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
            <Lock className="w-3 h-3 text-gray-400" />
          </div>
        )}

        <p className="text-sm font-black text-foreground mb-1">{tier.label}</p>

        <div className="mb-0.5">
          <span className="text-lg font-bold text-foreground leading-none">
            {plan.priceTTC.toFixed(2).replace(".", ",")} € TTC
          </span>
          <span className="text-xs text-muted-foreground">/mois</span>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          {plan.priceHT.toFixed(2).replace(".", ",")} € HT
        </p>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isDisabled) onSelect();
          }}
          disabled={isDisabled}
          className={cn(
            "w-full py-1.5 rounded-lg text-xs font-semibold transition-all mb-3",
            isDisabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : isSelected
              ? cn("text-white", colors.badge)
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          {isSelected ? "Sélectionné" : "Choisir"}
        </button>

        <div className="border-t border-border mb-2" />

        <ul className="space-y-1.5 flex-1">
          {plan.benefits.slice(0, 4).map((benefit, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <Check
                className={cn(
                  "w-3 h-3 mt-0.5 flex-shrink-0",
                  isDisabled ? "text-gray-300" : colors.check
                )}
              />
              <span className="text-[11px] text-muted-foreground leading-snug">
                {benefit}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-3 pt-2 border-t border-border">
          <span
            className={cn(
              "inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full",
              isDisabled
                ? "bg-gray-100 text-gray-400"
                : cn(
                    plan.billing === "annual" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  )
            )}
          >
            {tier.quota}
          </span>
        </div>
      </button>
    </div>
  );
}