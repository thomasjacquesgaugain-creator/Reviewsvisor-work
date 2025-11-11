import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { toast } from "sonner";

export default function BillingSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Show success toast
    toast.success("Paiement réussi ! Votre abonnement est activé.");

    // Auto-redirect authenticated users to dashboard after 3 seconds
    if (user) {
      const timer = setTimeout(() => {
        setRedirecting(true);
        navigate("/tableau-de-bord");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  const handleContinue = () => {
    if (user) {
      navigate("/tableau-de-bord");
    } else {
      // Redirect to signup for new users
      const email = sessionStorage.getItem("onboarding_email");
      navigate(`/onboarding/signup${email ? `?email=${encodeURIComponent(email)}` : ""}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Paiement réussi !</CardTitle>
          <CardDescription>
            Votre abonnement Pro a été activé avec succès
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {sessionId && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Session ID</p>
              <p className="text-xs font-mono break-all">{sessionId}</p>
            </div>
          )}

          <div className="space-y-3 text-left">
            <h3 className="font-semibold text-sm">Vos avantages :</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                Analyses illimitées d'établissements
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                Réponses automatiques aux avis
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                Statistiques avancées
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                Support prioritaire
              </li>
            </ul>
          </div>

          <Button 
            className="w-full" 
            onClick={handleContinue}
            disabled={redirecting}
          >
            {redirecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirection...
              </>
            ) : user ? (
              "Accéder au tableau de bord"
            ) : (
              "Créer mon compte"
            )}
          </Button>

          {user && (
            <p className="text-xs text-muted-foreground">
              Redirection automatique dans quelques secondes...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
