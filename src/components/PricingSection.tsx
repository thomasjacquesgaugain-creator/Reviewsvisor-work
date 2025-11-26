import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

export function PricingSection() {
  const handleSubscribe = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="w-full py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Choisissez la formule qui vous correspond
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Offre 1: Avec engagement - Violet */}
          <Card className="relative overflow-hidden bg-white rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 border-border">
            <div className="absolute top-0 right-0 bg-purple-600 text-white px-4 py-1.5 text-xs font-semibold rounded-bl-xl">
              💎 Meilleur prix
            </div>
            <CardHeader className="pb-6 pt-8">
              <CardTitle className="text-2xl font-bold text-foreground mb-2">
                Abonnement Pro
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Engagement 12 mois
              </p>
              <div className="mt-6">
                <span className="text-5xl font-bold text-purple-600">14,99 €</span>
                <span className="text-lg text-muted-foreground ml-2">/mois</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Accès complet à Reviewsvisor</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">14 jours d'essai gratuit</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Engagement 12 mois</span>
                </li>
              </ul>
              <Button 
                className="w-full h-12 text-base font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all rounded-lg"
                onClick={() => handleSubscribe('https://buy.stripe.com/bJebJ1dqp0uD9oI1s6gjC01')}
              >
                Essayer gratuitement
              </Button>
            </CardContent>
          </Card>

          {/* Offre 2: Sans engagement - Bleu */}
          <Card className="relative overflow-hidden bg-white rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 border-border">
            <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1.5 text-xs font-semibold rounded-bl-xl">
              ⚡ Flexible
            </div>
            <CardHeader className="pb-6 pt-8">
              <CardTitle className="text-2xl font-bold text-foreground mb-2">
                Abonnement Pro
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Sans engagement
              </p>
              <div className="mt-6">
                <span className="text-5xl font-bold text-blue-600">24,99 €</span>
                <span className="text-lg text-muted-foreground ml-2">/mois</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Accès complet à Reviewsvisor</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Sans engagement</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Résiliable à tout moment</span>
                </li>
              </ul>
              <Button 
                className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all rounded-lg"
                onClick={() => handleSubscribe('https://buy.stripe.com/cNi14n1HHgtBeJ29YCgjC02')}
              >
                S'abonner maintenant
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          🔒 Paiement sécurisé par Stripe • Annulation simple en ligne
        </p>
      </div>
    </section>
  );
}
