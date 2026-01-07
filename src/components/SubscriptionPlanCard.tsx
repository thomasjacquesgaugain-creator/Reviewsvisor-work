import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { SubscriptionPlan } from "@/config/subscriptionPlans";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  isSelected?: boolean;
  onSelect?: () => void;
  showSelectButton?: boolean;
  loading?: boolean;
}

export function SubscriptionPlanCard({
  plan,
  isSelected = false,
  onSelect,
  showSelectButton = true,
  loading = false,
}: SubscriptionPlanCardProps) {
  const { t } = useTranslation();
  const colorClasses = plan.badgeColor === "purple" 
    ? {
        badge: "bg-purple-600",
        price: "text-purple-600",
        check: "text-purple-600",
        button: "bg-purple-600 hover:bg-purple-700",
        ring: "ring-purple-600",
      }
    : {
        badge: "bg-blue-600",
        price: "text-blue-600",
        check: "text-blue-600",
        button: "bg-blue-600 hover:bg-blue-700",
        ring: "ring-blue-600",
      };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden bg-white rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 cursor-pointer h-full flex flex-col",
        isSelected ? `ring-2 ${colorClasses.ring} border-transparent` : "border-border"
      )}
      onClick={onSelect}
    >
      <div className={cn("absolute top-0 right-0 text-white px-4 py-1.5 text-xs font-semibold rounded-bl-xl", colorClasses.badge)}>
        {plan.badge}
      </div>
      <CardHeader className="pb-4 pt-8">
        <CardTitle className="text-2xl font-bold text-foreground mb-2">
          {plan.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground min-h-[40px]">
          {plan.description}
        </p>
        <div className="mt-4">
          <span className={cn("text-5xl font-bold", colorClasses.price)}>{plan.priceLabel}</span>
          <span className="text-lg text-muted-foreground ml-2">/mois</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 pb-8">
        <ul className="space-y-4 flex-1">
          {plan.benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className={cn("w-5 h-5 mt-0.5 flex-shrink-0", colorClasses.check)} />
              <span className="text-foreground">{benefit}</span>
            </li>
          ))}
        </ul>
        {showSelectButton && (
          <Button 
            className={cn("w-full h-12 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all rounded-lg mt-6", colorClasses.button)}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            disabled={loading}
          >
            {isSelected ? `✓ ${t("subscription.planSelected")}` : t("subscription.chooseThisPlan")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
