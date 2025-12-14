import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const MerciInscription = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <h1 className="text-2xl font-bold text-foreground">
            Compte créé avec succès 🎉
          </h1>
          
          <p className="text-muted-foreground">
            Merci d'avoir rejoint Reviewsvisor. Votre compte est prêt, vous pouvez maintenant accéder à votre espace d'analyse.
          </p>
          
          <div className="space-y-3 pt-2">
            <Button asChild className="w-full bg-[#2F6BFF] hover:bg-[#2555CC]">
              <Link to="/tableau-de-bord">
                Accéder à mon tableau de bord
              </Link>
            </Button>
            
            <Link 
              to="/" 
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Retour à l'accueil
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MerciInscription;
