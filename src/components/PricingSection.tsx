import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

export function PricingSection() {
  const handleSubscribe = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="w-full py-16 lg:py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Choisissez votre formule
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Accédez à toutes les fonctionnalités de Reviewsvisor et transformez vos avis en croissance
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Offre 1: Avec engagement */}
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-2">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold rounded-bl-lg">
              💎 Meilleur prix
            </div>
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Abonnement Pro</CardTitle>
              <CardDescription className="text-base">
                Avec engagement 12 mois
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">14,99 €</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Accès complet à Reviewsvisor</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>14 jours d'essai gratuit</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Engagement de 12 mois</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Support prioritaire</span>
                </li>
              </ul>
              <Button 
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
                onClick={() => handleSubscribe('https://buy.stripe.com/bJebJ1dqp0uD9oI1s6gjC01')}
              >
                Essayer gratuitement
              </Button>
            </CardContent>
          </Card>

          {/* Offre 2: Sans engagement */}
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-2">
            <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-4 py-1 text-sm font-semibold rounded-bl-lg">
              ⚡ Flexible
            </div>
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Abonnement Pro</CardTitle>
              <CardDescription className="text-base">
                Sans engagement
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">24,99 €</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <span>Accès complet à Reviewsvisor</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <span>Sans engagement</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <span>Résiliable à tout moment</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <span>Support standard</span>
                </li>
              </ul>
              <Button 
                className="w-full h-12 text-base font-semibold bg-accent hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all"
                onClick={() => handleSubscribe('https://buy.stripe.com/cNi14n1HHgtBeJ29YCgjC02')}
              >
                S'abonner maintenant
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          🔒 Paiement sécurisé par Stripe • Annulation simple en ligne
        </p>
      </div>
    </section>
  );
}
