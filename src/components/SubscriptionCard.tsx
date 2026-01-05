import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, CreditCard, Crown } from "lucide-react";
import { createCheckoutSession, createCustomerPortalSession, STRIPE_PRODUCTS } from "@/lib/stripe";
import { useSubscription } from "@/hooks/useSubscription";
import { useCreatorBypass, PRODUCT_KEYS } from "@/hooks/useCreatorBypass";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function SubscriptionCard() {
  const { subscription, loading, refresh } = useSubscription();
  const { isCreator, activateCreatorSubscription } = useCreatorBypass();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      // ======= CREATOR BYPASS =======
      if (isCreator()) {
        if (!import.meta.env.PROD) {
          console.log("[SubscriptionCard] Creator bypass - activating pro plan");
        }
        const result = await activateCreatorSubscription(PRODUCT_KEYS.PRO_1499_12M);
        if (result.success) {
          await refresh();
          return;
        } else {
          toast({
            title: "Erreur",
            description: result.error || "Erreur d'activation",
            variant: "destructive",
          });
          return;
        }
      }

      // ======= NORMAL STRIPE FLOW =======
      const url = await createCheckoutSession();
      if (url) {
        window.open(url, "_blank");
        
        // Refresh subscription status after 3 seconds
        setTimeout(() => {
          refresh();
        }, 3000);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    // Creator bypass users don't have Stripe portal
    if (subscription.creator_bypass) {
      toast({
        title: "Mode créateur",
        description: "La gestion d'abonnement n'est pas disponible en mode créateur",
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
        title: "Erreur",
        description: "Impossible d'accéder au portail client",
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
                Abonnement Pro
              </CardTitle>
              <CardDescription>Accédez à toutes les fonctionnalités premium</CardDescription>
            </div>
            <Badge variant="outline">Gratuit</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
        <div className="text-3xl font-bold text-primary">
            {STRIPE_PRODUCTS.pro.price}
          </div>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm">Analyses illimitées d'établissements</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm">Réponses automatiques aux avis</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm">Statistiques avancées</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm">Support prioritaire</span>
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
                Chargement...
              </>
            ) : (
              <>
                <Crown className="mr-2 h-4 w-4" />
                Passer en Pro
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const subscriptionEndDate = subscription.subscription_end
    ? format(new Date(subscription.subscription_end), "d MMMM yyyy", { locale: fr })
    : null;

  return (
    <Card className="border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Abonnement Pro
            </CardTitle>
            <CardDescription>
              Votre abonnement est actif
              {subscription.creator_bypass && " (mode créateur)"}
            </CardDescription>
          </div>
          <Badge className="bg-primary">
            {subscription.creator_bypass ? "Créateur" : "Actif"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Formule</span>
            <span className="font-medium">{STRIPE_PRODUCTS.pro.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Prix</span>
            <span className="font-medium">{STRIPE_PRODUCTS.pro.price}</span>
          </div>
          {subscriptionEndDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Renouvellement</span>
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
              Chargement...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Gérer mon abonnement
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
