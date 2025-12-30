import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const UpdatePassword = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: t("common.error"),
        description: t("updatePassword.passwordMismatch"),
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: t("common.error"),
        description: t("updatePassword.passwordMinLength"),
        variant: "destructive",
      });
      return;
    }

    if (!/[A-Z]/.test(password)) {
      toast({
        title: t("common.error"),
        description: t("updatePassword.passwordUppercase"),
        variant: "destructive",
      });
      return;
    }

    if (!/[a-z]/.test(password)) {
      toast({
        title: t("common.error"),
        description: t("updatePassword.passwordLowercase"),
        variant: "destructive",
      });
      return;
    }

    if (!/[0-9]/.test(password)) {
      toast({
        title: t("common.error"),
        description: t("updatePassword.passwordNumber"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast({
          title: t("common.error"),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t("updatePassword.passwordChanged"),
          description: t("updatePassword.passwordChangedDesc"),
        });
        navigate('/login');
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("updatePassword.unexpectedError"),
        variant: "destructive",
      });
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
            {t("updatePassword.title")}
          </h1>
        </div>

        {/* Update Password Card */}
        <div className="container mx-auto px-4 max-w-md mb-8 pb-4">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {t("updatePassword.title")}
                </h2>
                <p className="text-gray-600">
                  {t("updatePassword.subtitle")}
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    {t("updatePassword.newPassword")}
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("updatePassword.placeholder")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 px-4 pr-12 bg-gray-50 border-gray-200 rounded-xl"
                      required
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
                    {t("updatePassword.confirmPassword")}
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t("updatePassword.confirmPlaceholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 px-4 bg-gray-50 border-gray-200 rounded-xl"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
                  disabled={loading}
                >
                  {loading ? t("updatePassword.updating") : t("updatePassword.updateButton")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;