import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Crown } from "lucide-react";
import SignUpForm from "@/components/SignUpForm";
import { STRIPE_PRODUCTS } from "@/lib/stripe";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

export function SignupSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLoginClick = () => {
    navigate('/login');
  };

  // Hide subscription card if user is already logged in
  const showSubscriptionCard = !user;

  return (
    <section 
      id="inscription" 
      className="container mx-auto px-4 py-12 scroll-mt-20"
      aria-labelledby="signup-title"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Subscription Card - only show if not logged in */}
        {showSubscriptionCard && (
          <Card 
            className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl shadow-lg"
            role="region"
            aria-labelledby="subscription-card-title"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle id="subscription-card-title" className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    Abonnement Pro
                  </CardTitle>
                  <CardDescription>Accédez à toutes les fonctionnalités premium</CardDescription>
                </div>
                <Badge variant="outline" className="bg-background">Mensuel</Badge>
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
              <div className="pt-2">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    // Just keep focus on the section, the form is right below
                    const formElement = document.getElementById('signup-form');
                    if (formElement) {
                      formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                  }}
                >
                  Continuer
                </Button>
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="w-full mt-3 text-sm text-muted-foreground hover:text-primary transition-colors underline"
                >
                  J'ai déjà un compte
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signup Form */}
        <Card id="signup-form" className="rounded-2xl">
          <CardHeader>
            <CardTitle id="signup-title">Créer un compte</CardTitle>
            <CardDescription>
              Remplissez le formulaire ci-dessous pour créer votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
