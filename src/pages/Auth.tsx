import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().trim().email({ message: "Email invalide" }).max(255),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }).max(100),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/tableau-de-bord');
      }
    };
    checkUser();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate('/tableau-de-bord');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = signUpSchema.parse({ email, password, confirmPassword });

      const { error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/tableau-de-bord`
        }
      });

      if (error) {
        toast({
          title: "Erreur d'inscription",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Inscription réussie",
          description: "Vérifiez votre email pour confirmer votre compte.",
        });
        navigate('/login');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur inattendue s'est produite.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

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
            Créez votre espace d&apos;analyse
          </h1>
        </div>

        {/* Sign Up Card */}
        <div className="container mx-auto px-4 max-w-md">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Créer un compte</h2>
                <p className="text-gray-600">Commencez à analyser vos avis clients</p>
              </div>

              <form className="space-y-6" onSubmit={handleSignUp}>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 px-4 bg-gray-50 border-gray-200 rounded-xl"
                    required
                    maxLength={255}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 px-4 pr-12 bg-gray-50 border-gray-200 rounded-xl"
                      required
                      maxLength={100}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirmer le mot de passe
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirmez votre mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 px-4 bg-gray-50 border-gray-200 rounded-xl"
                    required
                    maxLength={100}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
                  disabled={loading}
                >
                  {loading ? "Inscription..." : "S'inscrire"}
                </Button>
              </form>

              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Déjà un compte ?{" "}
                  <Link to="/login" className="text-blue-600 font-medium hover:underline">
                    Se connecter
                  </Link>
                </p>

                <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Un compte est requis pour analyser vos avis clients
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;