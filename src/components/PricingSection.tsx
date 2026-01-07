import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCreatorBypass, ProductKey, PRODUCT_KEYS } from "@/hooks/useCreatorBypass";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { useTranslation } from "react-i18next";

const ADMIN_EMAIL = "thomas.jacquesgaugain@gmail.com";

export function PricingSection() {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const { isCreator, activateCreatorSubscription } = useCreatorBypass();
  const { refresh: refreshSubscription } = useSubscription();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const handleCheckout = async (priceId: string, productKey: string) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.email === "thomas.jacquesgaugain@gmail.com") {
      toast.success(t("subscription.activatedCreatorMode"));
      navigate("/etablissement");
      return;
    }

    setLoadingPriceId(priceId);
    try {
      // ======= ADMIN BYPASS - Vérification explicite AVANT Stripe =======
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        if (!import.meta.env.PROD) {
          console.log("[PricingSection] Admin bypass detected for", user.email);
        }
        
        // Activer l'abonnement Pro directement (même logique que SaveEstablishmentButton)
        const result = await activateCreatorSubscription(PRODUCT_KEYS.PRO_1499_12M);
        
        if (result.success) {
          await refreshSubscription();
          toast.success(t("subscription.activatedSuccess"));
          // Rediriger vers le dashboard
          navigate("/tableau-de-bord");
          return;
        } else {
          toast.error(result.error || t("subscription.activationError"));
          return;
        }
      }

      // ======= CREATOR BYPASS (pour autres créateurs si besoin) =======
      if (isCreator()) {
        if (!import.meta.env.PROD) {
          console.log("[PricingSection] Creator bypass for", productKey);
        }
        const result = await activateCreatorSubscription(productKey as ProductKey);
        if (result.success) {
          await refreshSubscription();
          return;
        } else {
          toast.error(result.error || t("subscription.activationError"));
          return;
        }
      }

      // ======= NORMAL STRIPE FLOW =======
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });
      
      if (error) throw error;
      if (data?.url) {
        sessionStorage.setItem("stripeCheckoutStarted", "true");
        window.location.href = data.url;
      } else {
        throw new Error(t("subscription.paymentUrlNotReceived"));
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(t("subscription.paymentRedirectError"));
    } finally {
      setLoadingPriceId(null);
    }
  };

  return (
    <section id="abonnements" className="w-full py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          {subscriptionPlans.map((plan) => {
            const colorClasses = plan.badgeColor === "purple" 
              ? {
                  badge: "bg-purple-600",
                  price: "text-purple-600",
                  check: "text-purple-600",
                  button: "bg-purple-600 hover:bg-purple-700",
                }
              : {
                  badge: "bg-blue-600",
                  price: "text-blue-600",
                  check: "text-blue-600",
                  button: "bg-blue-600 hover:bg-blue-700",
                };

            return (
              <Card 
                key={plan.id}
                className="relative overflow-hidden bg-white rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 border-border h-full flex flex-col"
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
                    <span className="text-lg text-muted-foreground ml-2">{t("common.perMonth")}</span>
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
                  <Button 
                    className={cn("w-full h-12 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all rounded-lg mt-6", colorClasses.button)}
                    onClick={() => handleCheckout(plan.priceId, plan.productKey)}
                    disabled={loadingPriceId === plan.priceId}
                  >
                    {loadingPriceId === plan.priceId 
                      ? t("subscription.redirecting") 
                      : plan.id === "pro-engagement" 
                        ? t("subscription.enjoy14DaysFree") 
                        : t("subscription.subscribeNow")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          🔒 {t("subscription.securePaymentStripe")} • {t("subscription.easyCancellation")}
        </p>
      </div>
    </section>
  );
}
