import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function BillingCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Paiement annulé</CardTitle>
          <CardDescription>
            Votre abonnement n'a pas été activé
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Vous pouvez réessayer à tout moment depuis votre compte.
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
