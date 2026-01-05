import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BackArrow from "@/components/BackArrow";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Veuillez entrer votre adresse email");
      return;
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }

    setLoading(true);

    try {
      // Vérifier si l'email existe avant d'envoyer le lien
      const { data: checkData, error: checkError } = await supabase.functions.invoke("check-email-exists", {
        body: { email },
      });

      if (checkError) {
        console.error("Erreur lors de la vérification de l'email:", checkError);
        toast.error("Une erreur est survenue lors de la vérification de l'email");
        setLoading(false);
        return;
      }

      // Si l'email n'existe pas, afficher l'erreur
      if (!checkData || !checkData.exists) {
        toast.error("Aucun compte n'est associé à cette adresse email");
        setLoading(false);
        return;
      }

      // L'email existe, on peut envoyer l'email de réinitialisation
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("Erreur lors de l'envoi de l'email:", error);
        toast.error(error.message || "Une erreur est survenue lors de l'envoi de l'email");
        setLoading(false);
        return;
      }

      // Succès
      toast.success("Un email vous a été envoyé avec un lien pour réinitialiser votre mot de passe");
      setEmailSent(true);
    } catch (error: any) {
      console.error("Erreur inattendue:", error);
      toast.error(error?.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackArrow />

      {/* Background with organic shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100">
        <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-orange-200 to-yellow-200 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-gradient-to-bl from-blue-300 to-cyan-300 rounded-full blur-2xl opacity-25"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-2xl font-medium text-gray-600">
            Mot de passe oublié
          </h1>
        </div>

        {/* Forgot Password Card */}
        <div className="container mx-auto px-4 max-w-md mb-8 pb-4">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {emailSent ? "Email envoyé !" : "Mot de passe oublié ?"}
                </h2>
                <p className="text-gray-600">
                  {emailSent 
                    ? "Un email vous a été envoyé avec un lien pour réinitialiser votre mot de passe"
                    : "Entrez votre adresse email pour recevoir un lien de réinitialisation"
                  }
                </p>
              </div>

              {emailSent ? (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Vérifiez votre boîte de réception (et vos spams) pour le lien de réinitialisation.
                  </p>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Adresse email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 px-4 bg-gray-50 border-gray-200 rounded-xl"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
                    disabled={loading}
                  >
                    {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
                  </Button>
                </form>
              )}

              <div className="text-center">
                <Link 
                  to="/connexion" 
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Retour à la connexion
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

