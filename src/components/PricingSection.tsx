import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { cn } from "@/lib/utils";

export function PricingSection() {
  const handleSubscribe = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="w-full py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
                className="relative overflow-hidden bg-white rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 border-border"
              >
                <div className={cn("absolute top-0 right-0 text-white px-4 py-1.5 text-xs font-semibold rounded-bl-xl", colorClasses.badge)}>
                  {plan.badge}
                </div>
                <CardHeader className="pb-6 pt-8">
                  <CardTitle className="text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mb-2">
                    {plan.description}
                  </p>
                  <div className="mt-6">
                    <span className={cn("text-5xl font-bold", colorClasses.price)}>{plan.priceLabel}</span>
                    <span className="text-lg text-muted-foreground ml-2">/mois</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pb-8">
                  <ul className="space-y-4">
                    {plan.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className={cn("w-5 h-5 mt-0.5 flex-shrink-0", colorClasses.check)} />
                        <span className="text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={cn("w-full h-12 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all rounded-lg", colorClasses.button)}
                    onClick={() => handleSubscribe(plan.checkoutUrl)}
                  >
                    {plan.id === "pro-engagement" ? "Profiter des 14 jours offerts" : "S'abonner maintenant"}
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
