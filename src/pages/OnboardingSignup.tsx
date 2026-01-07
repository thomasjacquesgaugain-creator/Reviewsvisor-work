import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SignUpForm from "@/components/SignUpForm";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { StepHeader } from "@/components/StepHeader";
import { useTranslation } from "react-i18next";

const OnboardingSignup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [subscribedEmail, setSubscribedEmail] = useState("");

  useEffect(() => {
    const checkSubscription = () => {
      const subscribed = localStorage.getItem("subscribed_ok");
      const email = localStorage.getItem("subscribed_email");

      if (subscribed !== "1" || !email) {
        toast.error(t("onboarding.accessDeniedMustSubscribe"));
        navigate("/onboarding");
        return;
      }

      setSubscribedEmail(email);
      setVerifying(false);
    };

    checkSubscription();
  }, [navigate]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("onboarding.verifyingSubscription")}</p>
        </div>
      </div>
    );
  }

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
          <SignUpForm prefilledEmail={subscribedEmail} />
        </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingSignup;
