import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, CreditCard, Crown } from "lucide-react";
import { createCheckoutSession, createCustomerPortalSession, STRIPE_PRODUCTS } from "@/lib/stripe";
import { useSubscription } from "@/hooks/useSubscription";
import { useCreatorBypass, PRODUCT_KEYS } from "@/hooks/useCreatorBypass";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr, enUS, it, es, pt } from "date-fns/locale";

export function SubscriptionCard() {
  const { t, i18n } = useTranslation();
  const { subscription, loading, refresh } = useSubscription();
  const { isCreator, activateCreatorSubscription } = useCreatorBypass();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();

  const getDateLocale = () => {
    const locales: Record<string, typeof fr> = { fr, en: enUS, it, es, pt };
    return locales[i18n.language] || fr;
  };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      if (isCreator()) {
        console.log("[SubscriptionCard] Creator bypass - activating pro plan");
        const result = await activateCreatorSubscription(PRODUCT_KEYS.PRO_1499_12M);
        if (result.success) {
          await refresh();
          return;
        } else {
          toast({
            title: t("common.error"),
            description: result.error || t("errors.generic"),
            variant: "destructive",
          });
          return;
        }
      }

      const url = await createCheckoutSession();
      if (url) {
        window.open(url, "_blank");
        setTimeout(() => {
          refresh();
        }, 3000);
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("subscription.checkoutError"),
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (subscription.creator_bypass) {
      toast({
        title: t("subscription.creatorMode"),
        description: t("subscription.creatorModeDesc"),
      });
      return;
    }

    setPortalLoading(true);
    try {
      const url = await createCustomerPortalSession();
      if (url) {
        window.open(url, "_blank");
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("subscription.portalError"),
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription.subscribed) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                {t("subscription.proPlan")}
              </CardTitle>
              <CardDescription>{t("subscription.proDesc")}</CardDescription>
            </div>
            <Badge variant="outline">{t("subscription.free")}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-3xl font-bold text-primary">
            {STRIPE_PRODUCTS.pro.price}
          </div>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm">{t("subscription.feature1")}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm">{t("subscription.feature2")}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm">{t("subscription.feature3")}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm">{t("subscription.feature4")}</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleUpgrade}
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
                {t("subscription.upgradeToPro")}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const subscriptionEndDate = subscription.subscription_end
    ? format(new Date(subscription.subscription_end), "d MMMM yyyy", { locale: getDateLocale() })
    : null;

  return (
    <Card className="border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              {t("subscription.proPlan")}
            </CardTitle>
            <CardDescription>
              {t("subscription.activeDesc")}
              {subscription.creator_bypass && ` (${t("subscription.creatorMode")})`}
            </CardDescription>
          </div>
          <Badge className="bg-primary">
            {subscription.creator_bypass ? t("subscription.creator") : t("subscription.active")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("subscription.plan")}</span>
            <span className="font-medium">{STRIPE_PRODUCTS.pro.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("subscription.price")}</span>
            <span className="font-medium">{STRIPE_PRODUCTS.pro.price}</span>
          </div>
          {subscriptionEndDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("subscription.renewal")}</span>
              <span className="font-medium">{subscriptionEndDate}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleManageSubscription}
          disabled={portalLoading}
        >
          {portalLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.loading")}
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              {t("subscription.manage")}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
