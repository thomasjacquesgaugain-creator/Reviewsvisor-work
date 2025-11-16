import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createCheckoutSession } from "@/lib/stripe";
import { StepHeader } from "@/components/StepHeader";

const Onboarding = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();
    
    // Validation
    if (!trimmedEmail) {
      toast.error("Veuillez saisir votre adresse email");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      toast.error("Format d'email invalide");
      return;
    }

    setLoading(true);
    
    try {
      console.log("Creating checkout session for:", trimmedEmail);
      
      // Store email for later use
      sessionStorage.setItem("onboarding_email", trimmedEmail);
      
      // Create checkout session
      const url = await createCheckoutSession(trimmedEmail);
      
      if (!url) {
        throw new Error("No checkout URL returned");
      }

      console.log("Redirecting to Stripe Checkout:", url);
      
      // Redirect to Stripe Checkout
      window.location.href = url;
      
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Le paiement n'a pas pu être initialisé. Réessayez.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md">
        <StepHeader currentStep={1} />
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Abonnement Pro</CardTitle>
            <CardDescription>Accédez à toutes les fonctionnalités premium</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pricing info */}
          <div className="bg-primary/5 rounded-lg p-4 text-center">
            <div className="text-4xl font-bold text-primary">14,99 €</div>
            <div className="text-sm text-muted-foreground">par mois</div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">Analyses illimitées d'établissements</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">Réponses automatiques aux avis</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">Statistiques avancées</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">Support prioritaire</span>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubscribe} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                autoComplete="email"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirection vers Stripe...
                </>
              ) : (
                "Continuer – 14,99€/mois"
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              <a href="/login" className="underline hover:text-foreground">
                J'ai déjà un compte
              </a>
            </p>
          </form>
        </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
