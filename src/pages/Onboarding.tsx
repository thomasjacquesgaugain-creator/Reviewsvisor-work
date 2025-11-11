import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createCheckoutSession } from "@/lib/stripe";

const Onboarding = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Veuillez saisir votre adresse email");
      return;
    }

    setLoading(true);
    try {
      // Store email for later signup
      sessionStorage.setItem("onboarding_email", email);
      
      const url = await createCheckoutSession(email);
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Impossible de créer la session de paiement");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
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
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirection...
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
  );
};

export default Onboarding;
