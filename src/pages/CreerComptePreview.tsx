import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SignUpForm from "@/components/SignUpForm";
import { CheckCircle2 } from "lucide-react";
import { StepHeader } from "@/components/StepHeader";

/**
 * Page de prévisualisation du formulaire "Créer un compte"
 * Cette page affiche le même contenu que l'étape 2 du flux /abonnement
 * mais sans vérification d'abonnement ni dépendance à Stripe.
 * 
 * Route: /creer-compte-preview
 * Pour supprimer: retirer cette page et la route dans App.tsx
 */
const CreerComptePreview = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md">
        <StepHeader currentStep={2} />
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Abonnement actif
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">Créer mon compte</CardTitle>
            <CardDescription>
              Complétez votre inscription pour accéder à votre tableau de bord
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm prefilledEmail="preview@example.com" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreerComptePreview;
