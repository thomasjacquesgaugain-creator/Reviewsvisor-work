import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function BillingCancel() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">{t("billing.paymentCanceledTitle")}</CardTitle>
          <CardDescription>
            {t("billing.paymentCanceledDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={() => navigate("/onboarding")}
            >
              {t("billing.retryPayment")}
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate("/")}
            >
              {t("billing.backToHome")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
