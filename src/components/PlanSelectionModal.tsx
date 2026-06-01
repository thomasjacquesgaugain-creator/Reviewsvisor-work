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
import { useTranslation } from "react-i18next";

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
  color: string;
}[] = [
  { key: "basic",    label: "Basic",color: "green" },
  { key: "standard", label: "Standard", color: "blue"},
  { key: "pro",      label: "Pro", color: "purple" },
  { key: "premium",  label: "Premium",color: "pink"},
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
    border: "border-[#2563eb]",
    badge: "bg-[#2563eb]",
    check: "text-[#2563eb]",
    selected: "border-[#2563eb] bg-[#2563eb]/10",
    recommended: "bg-[#2563eb]",
    recommendedText: "text-[#2563eb]",
    disabledBg: "bg-gray-50",
  },
  blue:   {
    border: "border-[#2563eb]",
    badge: "bg-[#2563eb]",
    check: "text-[#2563eb]",
    selected: "border-[#2563eb] bg-[#2563eb]/10",
    recommended: "bg-[#2563eb]",
    recommendedText: "text-[#2563eb]",
    disabledBg: "bg-gray-50",
  },
  purple: {
    border: "border-[#2563eb]",
    badge: "bg-[#2563eb]",
    check: "text-[#2563eb]",
    selected: "border-[#2563eb] bg-[#2563eb]/10",
    recommended: "bg-[#2563eb]",
    recommendedText: "text-[#2563eb]",
    disabledBg: "bg-gray-50",
  },
  pink:   {
    border: "border-[#2563eb]",
    badge: "bg-[#2563eb]",
    check: "text-[#2563eb]",
    selected: "border-[#2563eb] bg-[#2563eb]/10",
    recommended: "bg-[#2563eb]",
    recommendedText: "text-[#2563eb]",
    disabledBg: "bg-gray-50",
  },
};

interface Props {
  open: boolean;
  onClose: () => void;
  establishment: Etab | null;
  reviewCountLast12Months?: number | null;
}

export function PlanSelectionModal({
  open,
  onClose,
  establishment,
  reviewCountLast12Months,
}: Props) {
  const { t,i18n } = useTranslation();
  const recommendedTier = getRecommendedTier(
    reviewCountLast12Months != null ? reviewCountLast12Months / 12 : 10
  );

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
          language: i18n.language,
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
                type_etablissement: establishment.types ?? null,
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
      ? t("subscription.annualSavingsHint", {
      saving: saving.toFixed(2).replace(".", ",")
    })
      : null;
  })();
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-xl font-bold text-center">
             {t("subscription.modalTitle")}
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
           {t("subscription.modalDescription")}
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
               {t("subscription.monthly")}
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
              {t("subscription.annual")}
            </button>
          </div>
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
                quota={t(`subscription.tiers.${tier.key}.quota`)}
                audience={t(`subscription.tiers.${tier.key}.audience`)}
                recommendedLabel={t("subscription.recommended")}
                flexibleLabel={t("subscription.flexible")}
                selectedLabel={t("subscription.selected")}
                chooseLabel={t("subscription.choose")}
                perMonthLabel={t("subscription.perMonth")}
                onSelect={() => {
                  if (!isDisabled) setSelectedPlanId(plan.id);
                }}
              />
            );
          })}
        </div>

        {billingCycle === "annual" && selectedPlan?.annualTotalTTC && (
          <p className="text-xs text-center text-muted-foreground">
            {t("subscription.annualPriceInfo", {
              total: selectedPlan.annualTotalTTC.toFixed(0),
              monthly: selectedPlan.priceHT.toFixed(2).replace(".", ",")
            })}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 border-t pt-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("subscription.later")}
          </Button>
          <Button
            onClick={handleSubscribe}
            disabled={!selectedPlanId || loading}
            className="bg-primary hover:bg-primary/90 min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {t("subscription.redirecting")}
              </>
            ) : (
              t("subscription.subscribe")
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
  quota: string;
  audience: string;
  recommendedLabel: string;
  flexibleLabel: string;
  selectedLabel: string;
  chooseLabel: string;
  perMonthLabel: string;
  onSelect: () => void;
}

function PlanCard({
  plan,
  tier,
  colors,
  isRecommended,
  isDisabled,
  isSelected,
  quota,
  audience, 
  recommendedLabel, 
  flexibleLabel,
  selectedLabel, 
  chooseLabel, 
  perMonthLabel,
  onSelect,
}: PlanCardProps) {
    const { t } = useTranslation();
  return (
    <div className="relative pt-4">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
        {isRecommended ? (
          <span
            className={cn(
              "text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1",
              colors.recommended
            )}
          >
            ★ {recommendedLabel}
          </span>
        ) : (
          <span className="bg-gray-200 text-gray-500 text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            {flexibleLabel}
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
              "absolute top-1.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center",
              colors.badge
            )}
          >
            <Check className="w-3 h-3 text-white" />
          </div>
        )}

        {isDisabled && (
          <div className="absolute top-1.5 right-2.5 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
            <Lock className="w-3 h-3 text-gray-400" />
          </div>
        )}

        <p className="text-sm font-black text-foreground mb-1 mt-4">{tier.label}</p>

        <div className="mb-0.5">
          <span className="text-lg font-bold text-foreground leading-none">
            {plan.priceTTC.toFixed(2).replace(".", ",")} € TTC
          </span>
          <span className="text-xs text-muted-foreground">{perMonthLabel}</span>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          {plan.priceHT.toFixed(2).replace(".", ",")} € HT
          <span className="text-xs text-muted-foreground">{perMonthLabel}</span>
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
          {isSelected ? selectedLabel: chooseLabel}
        </button>

        <div className="border-t border-border mb-2" />

        <ul className="space-y-1.5 flex-1">
          {plan.benefitKeys.slice(0, 4).map((key, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <Check
                className={cn(
                  "w-3 h-3 mt-0.5 flex-shrink-0",
                  isDisabled ? "text-gray-300" : colors.check
                )}
              />
              <span className="text-[11px] text-muted-foreground leading-snug">
                {t(key)}
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
             {quota}
          </span>
        </div>
      </button>
    </div>
  );
}