import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StepHeader } from "@/components/StepHeader";
import { SubscriptionPlanCard } from "@/components/SubscriptionPlanCard";
import { subscriptionPlans, getPlanBySlug, getDefaultPlan } from "@/config/subscriptionPlans";
import { supabase } from "@/integrations/supabase/client";
import BackArrow from "@/components/BackArrow";
import { useTranslation } from "react-i18next";

const Onboarding = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  
  // Pré-sélection via URL param ?plan=pro-annual ou ?plan=pro-24
  const urlPlanSlug = searchParams.get("plan");
  const initialPlan = urlPlanSlug ? getPlanBySlug(urlPlanSlug) : getDefaultPlan();
  
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlan?.id || subscriptionPlans[0].id);
  const [loading, setLoading] = useState(false);

  const selectedPlan = subscriptionPlans.find(p => p.id === selectedPlanId) || subscriptionPlans[0];

  const handleContinue = async () => {
    setLoading(true);
    
    try {
      console.log("Redirecting to checkout for plan:", selectedPlan.id);
      
      // Store plan for later use
      sessionStorage.setItem("onboarding_plan", selectedPlan.id);
      
      // Call edge function to create Stripe Checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: selectedPlan.priceId },
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
      toast.error(t("subscription.paymentInitError"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <BackArrow />
      <div className="w-full max-w-5xl">
        <StepHeader currentStep={1} />
        
        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {subscriptionPlans.map((plan) => (
            <SubscriptionPlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlanId === plan.id}
              onSelect={() => setSelectedPlanId(plan.id)}
              showSelectButton={true}
              loading={loading}
            />
          ))}
        </div>

        {/* CTA Section */}
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
          <Button 
            onClick={handleContinue}
            className="w-full h-12 text-base font-semibold" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("subscription.redirectingToStripe")}
              </>
            ) : (
              t("onboarding.continueWithPrice", { price: selectedPlan.priceLabel })
            )}
          </Button>

          <a href="/login" className="text-sm text-muted-foreground underline hover:text-foreground">
            {t("hero.haveAccount")}
          </a>

          <p className="text-center text-sm text-muted-foreground">
            🔒 {t("subscription.securePaymentStripe")} • {t("subscription.easyCancellation")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
