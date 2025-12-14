import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const resetPasswordSchema = z.object({
  email: z.string().min(1, { message: "Veuillez renseigner ce champ." }).email({ message: "Veuillez renseigner un email valide." }),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onSubmit",
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(formData: ResetPasswordFormData) {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email.trim(), {
        redirectTo: "https://reviewsvisor.fr/reset-password-update",
      });

      if (error) {
        console.error("Erreur réinitialisation mot de passe:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message
        });
        return;
      }

      // Succès
      setSubmittedEmail(formData.email.trim());
      setEmailSent(true);
      reset(); // Vide le champ email
      
      toast({
        title: "Email envoyé !",
        description: "Un email de réinitialisation vient de vous être envoyé."
      });
      
    } catch (err) {
      console.error('Erreur inattendue:', err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue s'est produite"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
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
            Réinitialisation de mot de passe
          </h1>
        </div>

        {/* Reset Card */}
        <div className="container mx-auto px-4 max-w-md mb-8 pb-4">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Mot de passe oublié ?
                </h2>
                <p className="text-gray-600">
                  Entrez votre email pour recevoir un lien de réinitialisation
                </p>
              </div>

              {!emailSent ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Adresse email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      autoComplete="email"
                      {...register("email")}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      className="h-12 px-4 bg-gray-50 border-gray-200 rounded-xl"
                      required
                    />
                    {errors.email && (
                      <p id="email-error" className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
                    disabled={loading}
                  >
                    {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <p className="mt-4 rounded-md bg-green-100 p-4 text-sm text-green-800">
                    ✅ Un email de réinitialisation a été envoyé à <strong>{submittedEmail}</strong><br />
                    📬 <strong>Astuce :</strong> Vérifie aussi ton dossier <em>Spam</em> ou <em>Courrier indésirable</em>, il peut parfois s'y glisser par erreur.
                  </p>
                </div>
              )}

              <div className="text-center">
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
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

export default ResetPassword;
