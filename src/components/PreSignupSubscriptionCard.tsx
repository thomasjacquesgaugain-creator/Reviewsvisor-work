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
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    setCheckoutLoading(true);
    try {
      // Store intent to create account after payment
      sessionStorage.setItem('pendingSignup', 'true');
      
      const url = await createCheckoutSession();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement. Veuillez vous connecter d'abord.",
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
              Abonnement Pro
            </CardTitle>
            <CardDescription>Accédez à toutes les fonctionnalités premium</CardDescription>
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
            <span className="text-sm">Analyses illimitées d'établissements</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm">Réponses automatiques aux avis</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm">Statistiques avancées</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm">Support prioritaire</span>
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
              Chargement...
            </>
          ) : (
            <>
              <Crown className="mr-2 h-4 w-4" />
              S'abonner et créer mon compte
            </>
          )}
        </Button>
        <button
          type="button"
          onClick={onLoginClick}
          className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
        >
          J'ai déjà un compte
        </button>
      </CardFooter>
    </Card>
  );
}
