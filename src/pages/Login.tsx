import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, User, UserCircle, Lock, LockKeyholeOpen } from "lucide-react";
import { PasswordField } from "@/components/ui/PasswordField";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BackArrow from "@/components/BackArrow";
import { useTranslation } from "react-i18next";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    }
  }, []);

  // Réinitialiser l'erreur quand l'utilisateur change de mode ou commence à taper
  useEffect(() => {
    setLoginError("");
  }, [isSignUp, email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");

    try {
      if (isSignUp) {
        // Inscription
        if (password !== confirmPassword) {
          toast.error(t("auth.passwordMismatch"));
          setLoading(false);
          return;
        }

        if (!firstName.trim() || !lastName.trim()) {
          toast.error(t("auth.fillNameFields"));
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim()
            },
            emailRedirectTo: `${window.location.origin}/tableau-de-bord`
          }
        });

        if (error) {
          toast.error(t("auth.signupError"), {
            description: error.message,
          });
        } else {
          // Upsert dans profiles
          if (data.user) {
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: data.user.id,
                user_id: data.user.id,
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                full_name: `${firstName.trim()} ${lastName.trim()}`,
                updated_at: new Date().toISOString()
              }, { 
                onConflict: 'id'
              });

            if (profileError) {
              console.error('Erreur profil:', profileError);
            }
          }

          toast.success(t("auth.signupSuccess"), {
            description: t("auth.signupSuccessDesc"),
          });
          navigate('/tableau-de-bord');
        }
      } else {
        // Connexion
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Vider les champs email et mot de passe
          setEmail("");
          setPassword("");
          
          // Afficher un message d'erreur sur la page et en toast
          const errorMessage = t("auth.invalidCredentials");
          setLoginError(errorMessage);
          toast.error(errorMessage);
        } else {
          toast.success(t("auth.loginSuccess"), {
            description: t("auth.loginSuccessDesc"),
          });
          navigate('/tableau-de-bord');
        }
      }
    } catch (error) {
      toast.error(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackArrow />

      {/* Background with organic shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-orange-200 to-yellow-200 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-gradient-to-bl from-blue-300 to-cyan-300 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full blur-2xl opacity-25"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-2xl font-medium text-gray-600 dark:text-gray-300">
            {isSignUp ? t("auth.createAnalysisSpace") : t("auth.connectToAnalysisSpace")}
          </h1>
        </div>

        {/* Login Card */}
        <div className="container mx-auto px-4 max-w-md mb-8 pb-4">
          <Card className="bg-white/90 dark:bg-white/[0.05] backdrop-blur-sm dark:backdrop-blur-xl border-0 dark:border dark:border-white/[0.08] shadow-xl dark:shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isSignUp ? t("auth.signup") : t("auth.login")}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {isSignUp 
                    ? t("auth.startAnalyzing")
                    : t("auth.accessAnalytics")
                  }
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {isSignUp && (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("auth.firstName")}
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder={t("auth.firstNamePlaceholder")}
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="h-12 pl-12 pr-4 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl dark:text-white"
                          autoComplete="given-name"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("auth.lastName")}
                      </label>
                      <div className="relative">
                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                        <Input
                          id="lastName"
                          type="text"
                          placeholder={t("auth.lastNamePlaceholder")}
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="h-12 pl-12 pr-4 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl dark:text-white"
                          autoComplete="family-name"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("auth.email")}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 px-4 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl dark:text-white"
                    required
                  />
                </div>


                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("auth.password")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-500 z-10 pointer-events-none" aria-hidden />
                    <PasswordField
                      id="password"
                      placeholder={t("auth.passwordPlaceholder")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pl-10 pr-10 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl dark:text-white"
                      required
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("auth.confirmPassword")}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden />
                      <PasswordField
                        id="confirmPassword"
                        placeholder={t("auth.confirmPasswordPlaceholder")}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 pl-12 pr-12 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl dark:text-white"
                        required
                      />
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium"
                  disabled={loading}
                >
                  {loading 
                    ? (isSignUp ? t("auth.signingUp") : t("auth.loggingIn")) 
                    : (isSignUp ? t("auth.signupAction") : t("auth.login"))
                  }
                </Button>

                {!isSignUp && loginError && (
                  <div className="text-center">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                      {loginError}
                    </p>
                  </div>
                )}
              </form>

              {!isSignUp && (
                <div className="text-center">
                  <Link 
                    to="/mot-de-passe-oublie" 
                    className="inline-flex items-center gap-2 text-sm text-primary hover:text-blue-700 hover:underline"
                  >
                    <LockKeyholeOpen className="h-4 w-4" /> {t("auth.forgotPassword")}
                  </Link>
                </div>
              )}

              <div className="text-center space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  {isSignUp ? t("auth.hasAccount") : t("auth.noAccount")}{" "}
                  {isSignUp ? (
                    <button 
                      onClick={() => setIsSignUp(false)}
                      className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                    >
                      {t("auth.login")}
                    </button>
                  ) : (
                    <Link 
                      to="/inscription" 
                      className="text-primary font-medium hover:underline"
                    >
                      {t("auth.signup")}
                    </Link>
                  )}
                </p>

                <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl border border-yellow-200 dark:border-yellow-900">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {t("auth.accountRequired")}
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

export default Login;