import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function PricingSection() {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    setLoadingPriceId(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });
      
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de paiement non reçue");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Erreur lors de la redirection vers le paiement");
    } finally {
      setLoadingPriceId(null);
    }
  };

  return (
    <section id="abonnements" className="w-full py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          {subscriptionPlans.map((plan) => {
            const colorClasses = plan.badgeColor === "purple" 
              ? {
                  badge: "bg-purple-600",
                  price: "text-purple-600",
                  check: "text-purple-600",
                  button: "bg-purple-600 hover:bg-purple-700",
                }
              : {
                  badge: "bg-blue-600",
                  price: "text-blue-600",
                  check: "text-blue-600",
                  button: "bg-blue-600 hover:bg-blue-700",
                };

            return (
              <Card 
                key={plan.id}
                className="relative overflow-hidden bg-white rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 border-border h-full flex flex-col"
              >
                <div className={cn("absolute top-0 right-0 text-white px-4 py-1.5 text-xs font-semibold rounded-bl-xl", colorClasses.badge)}>
                  {plan.badge}
                </div>
                <CardHeader className="pb-4 pt-8">
                  <CardTitle className="text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground min-h-[40px]">
                    {plan.description}
                  </p>
                  <div className="mt-4">
                    <span className={cn("text-5xl font-bold", colorClasses.price)}>{plan.priceLabel}</span>
                    <span className="text-lg text-muted-foreground ml-2">/mois</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 pb-8">
                  <ul className="space-y-4 flex-1">
                    {plan.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className={cn("w-5 h-5 mt-0.5 flex-shrink-0", colorClasses.check)} />
                        <span className="text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={cn("w-full h-12 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all rounded-lg mt-6", colorClasses.button)}
                    onClick={() => handleCheckout(plan.priceId)}
                    disabled={loadingPriceId === plan.priceId}
                  >
                    {loadingPriceId === plan.priceId 
                      ? "Redirection..." 
                      : plan.id === "pro-engagement" 
                        ? "Profiter des 14 jours offerts" 
                        : "S'abonner maintenant"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          🔒 Paiement sécurisé par Stripe • Annulation simple en ligne
        </p>
      </div>
    </section>
  );
}
