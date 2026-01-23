import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function BillingSuccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Nettoyer le sessionStorage
    sessionStorage.removeItem("pendingUser");

    // Show success toast
    toast.success(t("billing.paymentSuccess"));

    // Auto-redirect authenticated users to dashboard after 3 seconds
    if (user) {
      const timer = setTimeout(() => {
        setRedirecting(true);
        navigate("/tableau-de-bord");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, navigate, t]);

  const handleContinue = () => {
    navigate("/merci-inscription");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">{t("billing.paymentSuccessTitle")}</CardTitle>
          <CardDescription>
            {t("billing.proSubscriptionActivated")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 text-left">
            <h3 className="font-semibold text-sm">{t("billing.yourBenefits")}:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                {t("billing.benefit1")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                {t("billing.benefit2")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                {t("billing.benefit3")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                {t("billing.benefit4")}
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
                {t("common.redirecting")}
              </>
            ) : (
              "Continuer"
            )}
          </Button>

          {user && (
            <p className="text-xs text-muted-foreground">
              {t("billing.autoRedirectMessage")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
