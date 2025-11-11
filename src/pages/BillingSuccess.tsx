import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function BillingSuccess() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const checkPendingSignup = async () => {
      const pendingSignup = sessionStorage.getItem('pendingSignup');
      const sessionId = searchParams.get('session_id');

      if (pendingSignup && sessionId) {
        // Clear the pending signup flag
        sessionStorage.removeItem('pendingSignup');
        
        toast({
          title: "Abonnement activé – bienvenue 👋",
          description: "Votre paiement a été validé. Créez maintenant votre compte pour continuer.",
        });

        // Redirect to signup with session info
        navigate('/login?mode=signup&subscribed=true');
      } else {
        toast({
          title: "Paiement réussi !",
          description: "Votre abonnement a été activé avec succès.",
        });
        setProcessing(false);
      }
    };

    checkPendingSignup();
  }, [toast, navigate, searchParams]);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Vérification de votre paiement...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Paiement réussi !</CardTitle>
          <CardDescription>
            Votre abonnement Pro est maintenant actif
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Vous avez maintenant accès à toutes les fonctionnalités premium de l'application.
          </p>
          <Button 
            className="w-full" 
            onClick={() => navigate("/tableau-de-bord")}
          >
            Accéder au tableau de bord
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
