import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Crown } from "lucide-react";
import { createCheckoutSession, STRIPE_PRODUCTS } from "@/lib/stripe";
import { useToast } from "@/hooks/use-toast";

interface PreSignupSubscriptionCardProps {
  onLoginClick: () => void;
}

export function PreSignupSubscriptionCard({ onLoginClick }: PreSignupSubscriptionCardProps) {
  const { t } = useTranslation();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    setCheckoutLoading(true);
    try {
      // Store intent to create account after payment
      sessionStorage.setItem('pendingSignup', 'true');
      
      const url = await createCheckoutSession();
      if (url) {
        sessionStorage.setItem("stripeCheckoutStarted", "true");
        window.location.href = url;
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("errors.cannotCreatePaymentSession"),
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              {t("subscription.proSubscription")}
            </CardTitle>
            <CardDescription>{t("subscription.accessAllPremiumFeatures")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-3xl font-bold text-primary">
          {STRIPE_PRODUCTS.pro.price}
        </div>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm">{t("billing.benefit1")}</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm">{t("billing.benefit2")}</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm">{t("billing.benefit3")}</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm">{t("billing.benefit4")}</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <Button 
          className="w-full" 
          size="lg" 
          onClick={handleSubscribe}
          disabled={checkoutLoading}
        >
          {checkoutLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.loading")}
            </>
          ) : (
            <>
              <Crown className="mr-2 h-4 w-4" />
              {t("subscription.subscribeAndCreateAccount")}
            </>
          )}
        </Button>
        <button
          type="button"
          onClick={onLoginClick}
          className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
        >
          {t("auth.alreadyHaveAccount")}
        </button>
      </CardFooter>
    </Card>
  );
}
