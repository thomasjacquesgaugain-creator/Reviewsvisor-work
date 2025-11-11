import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SignUpForm from "@/components/SignUpForm";
import { PreSignupSubscriptionCard } from "@/components/PreSignupSubscriptionCard";
import { useNavigate } from "react-router-dom";

export function SignupSection() {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Subscription Card */}
        <PreSignupSubscriptionCard onLoginClick={handleLoginClick} />

        {/* Signup Form */}
        <Card>
          <CardHeader>
            <CardTitle>Créer un compte</CardTitle>
            <CardDescription>
              Remplissez le formulaire ci-dessous pour créer votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
