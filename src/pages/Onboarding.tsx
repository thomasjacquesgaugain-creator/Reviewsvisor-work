import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StepHeader } from "@/components/StepHeader";
import { SubscriptionPlanCard } from "@/components/SubscriptionPlanCard";
import { subscriptionPlans, getPlanBySlug, getDefaultPlan } from "@/config/subscriptionPlans";

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Pré-sélection via URL param ?plan=pro-14 ou ?plan=pro-24
  const urlPlanSlug = searchParams.get("plan");
  const initialPlan = urlPlanSlug ? getPlanBySlug(urlPlanSlug) : getDefaultPlan();
  
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlan?.id || subscriptionPlans[0].id);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedPlan = subscriptionPlans.find(p => p.id === selectedPlanId) || subscriptionPlans[0];

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();
    
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
      console.log("Redirecting to checkout for plan:", selectedPlan.id, "email:", trimmedEmail);
      
      // Store email and plan for later use
      sessionStorage.setItem("onboarding_email", trimmedEmail);
      sessionStorage.setItem("onboarding_plan", selectedPlan.id);
      
      // Redirect to Stripe Checkout using the plan's checkout URL
      // Add email as prefill parameter
      const checkoutUrl = new URL(selectedPlan.checkoutUrl);
      checkoutUrl.searchParams.set("prefilled_email", trimmedEmail);
      
      window.location.href = checkoutUrl.toString();
      
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Le paiement n'a pas pu être initialisé. Réessayez.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
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

        {/* Email Form */}
        <div className="bg-card rounded-2xl shadow-lg p-6 max-w-md mx-auto">
          <form onSubmit={handleSubscribe} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Votre email</Label>
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

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirection vers Stripe...
                </>
              ) : (
                `Continuer – ${selectedPlan.priceLabel}/mois`
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              <a href="/login" className="underline hover:text-foreground">
                J'ai déjà un compte
              </a>
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          🔒 Paiement sécurisé par Stripe • Annulation simple en ligne
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
