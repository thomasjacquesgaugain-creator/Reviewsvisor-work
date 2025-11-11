import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, CreditCard, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createCheckoutSession } from "@/lib/stripe";
import SignUpForm from "@/components/SignUpForm";
import { supabase } from "@/integrations/supabase/client";

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    checkExistingSubscription();
    
    const checkoutStatus = searchParams.get("checkout");
    if (checkoutStatus === "success") {
      setCurrentStep(2);
      setHasActiveSubscription(true);
      toast({
        title: "Paiement réussi !",
        description: "Votre abonnement est actif. Créez votre compte pour continuer.",
      });
    } else if (checkoutStatus === "cancel") {
      toast({
        title: "Paiement annulé",
        description: "Vous pouvez réessayer quand vous le souhaitez.",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  const checkExistingSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", session.user.id)
          .in("status", ["active", "trialing"])
          .limit(1);

        if (subscriptions && subscriptions.length > 0) {
          setHasActiveSubscription(true);
          setCurrentStep(2);
        }
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const url = await createCheckoutSession();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Stepper */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  currentStep >= 1 ? "border-primary bg-primary text-primary-foreground" : "border-muted"
                }`}>
                  {hasActiveSubscription && currentStep >= 2 ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <CreditCard className="h-5 w-5" />
                  )}
                </div>
                <span className={`font-medium ${currentStep >= 1 ? "text-foreground" : "text-muted-foreground"}`}>
                  1. Abonnement
                </span>
              </div>
              <div className={`h-0.5 w-16 ${currentStep >= 2 ? "bg-primary" : "bg-muted"}`} />
              <div className="flex items-center gap-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  currentStep >= 2 ? "border-primary bg-primary text-primary-foreground" : "border-muted"
                }`}>
                  <UserPlus className="h-5 w-5" />
                </div>
                <span className={`font-medium ${currentStep >= 2 ? "text-foreground" : "text-muted-foreground"}`}>
                  2. Créer un compte
                </span>
              </div>
            </div>
          </div>

          {/* Step 1: Subscription */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Abonnement Pro</CardTitle>
                  <Badge variant="secondary">Mensuel</Badge>
                </div>
                <CardDescription>
                  Débloquez toutes les fonctionnalités pour gérer vos avis clients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-primary mb-2">14,99€</div>
                  <div className="text-muted-foreground">par mois</div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Analyses illimitées d'établissements</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Réponses automatiques aux avis</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Statistiques avancées</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Support prioritaire</span>
                  </div>
                </div>

                <Button 
                  onClick={handleSubscribe} 
                  className="w-full" 
                  size="lg"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continuer - 14,99€/mois
                </Button>

                <div className="text-center text-sm">
                  <button
                    onClick={() => navigate("/login")}
                    className="text-primary hover:underline"
                  >
                    J'ai déjà un compte
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Create Account */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {hasActiveSubscription && (
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                      <div>
                        <div className="font-semibold">Abonnement actif</div>
                        <div className="text-sm text-muted-foreground">
                          Votre abonnement Pro est validé
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Créer un compte</CardTitle>
                  <CardDescription>
                    Complétez votre inscription pour accéder à votre tableau de bord
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SignUpForm />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
