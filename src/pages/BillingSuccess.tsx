import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export default function BillingSuccess() {
  const navigate = useNavigate();
  const { refresh } = useSubscription();

  useEffect(() => {
    // Refresh subscription status when landing on success page
    refresh();
  }, []);

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
            onClick={() => navigate("/")}
          >
            Retour à l'accueil
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
