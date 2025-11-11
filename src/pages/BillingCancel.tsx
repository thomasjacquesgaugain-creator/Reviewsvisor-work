import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export default function BillingCancel() {
  const navigate = useNavigate();

  useEffect(() => {
    toast.error("Paiement annulé. Aucun montant n'a été débité.");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Paiement annulé</CardTitle>
          <CardDescription>
            Votre paiement a été annulé. Aucun montant n'a été débité.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Vous pouvez réessayer à tout moment pour profiter de toutes les fonctionnalités premium.
          </p>

          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={() => navigate("/onboarding")}
            >
              Réessayer le paiement
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate("/")}
            >
              Retour à l'accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
