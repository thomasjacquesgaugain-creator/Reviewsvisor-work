import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  const handleCreateSubscription = async () => {
    if (!email) {
      toast({
        title: "Email requis",
        description: "Veuillez saisir votre adresse email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: { email },
      });

      if (error) throw error;

      setClientSecret(data.clientSecret);
      toast({
        title: "Prêt pour le paiement",
        description: "Veuillez saisir vos informations de carte bancaire",
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'abonnement. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientSecret) {
      await handleCreateSubscription();
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          receipt_email: email,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Erreur de paiement",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        localStorage.setItem("subscribed_email", email);
        localStorage.setItem("subscribed_ok", "1");
        
        toast({
          title: "Paiement réussi !",
          description: "Votre abonnement est actif. Créez maintenant votre compte.",
        });

        navigate("/onboarding/signup");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!!clientSecret}
          required
        />
      </div>

      {clientSecret && (
        <div className="space-y-2">
          <Label>Informations de paiement</Label>
          <div className="border rounded-md p-3 bg-background">
            <PaymentElement />
          </div>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading || !stripe}>
        {loading ? "Traitement..." : "Continuer – 14,99€/mois"}
      </Button>

      <p className="text-sm text-center text-muted-foreground">
        <a href="/login" className="underline hover:text-foreground">
          J'ai déjà un compte
        </a>
      </p>
    </form>
  );
}

const Onboarding = () => {
  const [clientSecret, setClientSecret] = useState("");

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
          <Elements 
            stripe={stripePromise} 
            options={{ 
              clientSecret: clientSecret || undefined,
              appearance: {
                theme: 'stripe',
              }
            }}
          >
            <PaymentForm />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
