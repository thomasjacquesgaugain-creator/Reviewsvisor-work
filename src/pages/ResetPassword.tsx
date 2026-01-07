import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BackArrow from "@/components/BackArrow";
import { useTranslation } from "react-i18next";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  useEffect(() => {
    const verifyToken = async () => {
      setVerifying(true);
      setError("");

      // Récupérer le token depuis l'URL (query params ou hash fragments)
      const accessToken = searchParams.get("access_token");
      const type = searchParams.get("type");
      
      // Vérifier aussi les hash fragments (Supabase utilise souvent #access_token=...)
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.substring(1));
      const hashAccessToken = hashParams.get("access_token");
      const hashType = hashParams.get("type");
      
      const finalAccessToken = accessToken || hashAccessToken;
      const finalType = type || hashType;

      if (!finalAccessToken || finalType !== "recovery") {
        setError(t("auth.invalidLink"));
        setTokenVerified(false);
        setVerifying(false);
        return;
      }

      try {
        // Vérifier le token OTP pour établir la session
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: finalAccessToken,
          type: 'recovery',
        });

        if (verifyError || !data) {
          console.error("Erreur lors de la vérification du token:", verifyError);
          setError(t("auth.invalidLink"));
          setTokenVerified(false);
          setVerifying(false);
          return;
        }

        // Token vérifié avec succès, la session est maintenant établie
        console.log("Token vérifié avec succès, session établie");
        setTokenVerified(true);
        setVerifying(false);
      } catch (err: any) {
        console.error("Erreur inattendue lors de la vérification:", err);
        setError(t("auth.invalidLink"));
        setTokenVerified(false);
        setVerifying(false);
      }
    };

    verifyToken();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!password || !confirmPassword) {
      toast.error(t("errors.required"));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }

    if (password.length < 8) {
      toast.error(t("errors.passwordTooShort"));
      return;
    }

    setLoading(true);

    try {
      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error("Erreur lors de la mise à jour du mot de passe:", updateError);
        toast.error(updateError.message || t("errors.generic"));
        setError(updateError.message || t("errors.generic"));
        return;
      }

      // Succès
      toast.success(t("auth.passwordUpdated"));
      setSuccess(true);

      // Déconnecter l'utilisateur après la mise à jour du mot de passe
      await supabase.auth.signOut();

      // Rediriger vers /connexion après 2 secondes
      setTimeout(() => {
        navigate("/connexion");
      }, 2000);
    } catch (error: any) {
      console.error("Erreur inattendue:", error);
      toast.error(error?.message || t("common.error"));
      setError(error?.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // État de chargement pendant la vérification du token
  if (verifying) {
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
          <div className="container mx-auto px-4 max-w-md py-20">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
              <CardContent className="p-8 space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {t("auth.verifyingLink")}
                </h2>
                <p className="text-gray-600">
                  {t("auth.pleaseWaitVerification")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // État d'erreur : token invalide ou expiré
  if (!tokenVerified && error) {
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
          <div className="container mx-auto px-4 max-w-md py-20">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
              <CardContent className="p-8 space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {t("auth.invalidLinkTitle")}
                </h2>
                <p className="text-gray-600">
                  {error || t("auth.invalidLinkMessage")}
                </p>
                <div className="pt-4">
                  <Link to="/mot-de-passe-oublie">
                    <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
                      {t("auth.requestNewLink")}
                    </Button>
                  </Link>
                </div>
                <div className="pt-2">
                  <Link 
                    to="/connexion" 
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {t("auth.backToLogin")}
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // État de succès : mot de passe modifié
  if (success) {
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
          <div className="container mx-auto px-4 max-w-md py-20">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
              <CardContent className="p-8 space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {t("auth.passwordChanged")}
                </h2>
                <p className="text-gray-600">
                  {t("auth.passwordChangedMessage")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Formulaire de réinitialisation (affiché seulement si token vérifié)
  if (!tokenVerified) {
    return null; // Ne devrait pas arriver, mais sécurité
  }

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
            {t("auth.resetPasswordTitle")}
          </h1>
        </div>

        {/* Reset Password Card */}
        <div className="container mx-auto px-4 max-w-md mb-8 pb-4">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {t("auth.newPasswordTitle")}
                </h2>
                <p className="text-gray-600">
                  {t("auth.chooseSecurePassword")}
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    {t("auth.newPassword")}
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.minimum8Chars")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 px-4 pr-12 bg-gray-50 border-gray-200 rounded-xl"
                      required
                      minLength={8}
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
                    {t("auth.confirmNewPassword")}
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t("auth.confirmPasswordPlaceholder")}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 px-4 pr-12 bg-gray-50 border-gray-200 rounded-xl"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
                  disabled={loading || !!error}
                >
                  {loading ? t("auth.updating") : t("auth.updatePassword")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
