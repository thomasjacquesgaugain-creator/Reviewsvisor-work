import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignUpForm } from "@/components/SignUpForm";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const OnboardingSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [subscribedEmail, setSubscribedEmail] = useState("");

  useEffect(() => {
    const checkSubscription = async () => {
      const subscribed = localStorage.getItem("subscribed_ok");
      const email = localStorage.getItem("subscribed_email");

      if (subscribed !== "1" || !email) {
        toast({
          title: "Accès refusé",
          description: "Vous devez d'abord souscrire à l'abonnement",
          variant: "destructive",
        });
        navigate("/onboarding");
        return;
      }

      // Optional: verify subscription in database
      try {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("email", email)
          .in("status", ["trialing", "active"])
          .single();

        if (error || !data) {
          toast({
            title: "Vérification échouée",
            description: "Impossible de vérifier votre abonnement. Veuillez réessayer.",
            variant: "destructive",
          });
          navigate("/onboarding");
          return;
        }

        setSubscribedEmail(email);
        setVerifying(false);
      } catch (error) {
        console.error("Error verifying subscription:", error);
        // Allow to continue anyway if local storage is set
        setSubscribedEmail(email);
        setVerifying(false);
      }
    };

    checkSubscription();
  }, [navigate, toast]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Vérification de votre abonnement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
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
          <SignUpForm prefilledEmail={subscribedEmail} />
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingSignup;
