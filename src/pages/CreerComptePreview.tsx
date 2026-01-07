import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SignUpForm from "@/components/SignUpForm";
import { CheckCircle2 } from "lucide-react";
import { StepHeader } from "@/components/StepHeader";
import { useTranslation } from "react-i18next";

/**
 * Page de prévisualisation du formulaire "Créer un compte"
 * Cette page affiche le même contenu que l'étape 2 du flux /abonnement
 * mais sans vérification d'abonnement ni dépendance à Stripe.
 * 
 * Route: /creer-compte-preview
 * Pour supprimer: retirer cette page et la route dans App.tsx
 */
const CreerComptePreview = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md">
        <StepHeader currentStep={2} />
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t("onboarding.activeSubscription")}
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">{t("onboarding.createMyAccount")}</CardTitle>
            <CardDescription>
              {t("onboarding.completeSignupToAccessDashboard")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreerComptePreview;
