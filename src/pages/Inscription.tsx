import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { User, UserCircle, Mail, Lock, Eye, EyeOff, CreditCard } from "lucide-react";
import BackArrow from "@/components/BackArrow";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n/config";

type InscriptionFormData = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
};

export default function Inscription() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentLanguage = (SUPPORTED_LANGUAGES.includes((window.localStorage.getItem("rv_lang") || "fr") as SupportedLanguage)
    ? (window.localStorage.getItem("rv_lang") as SupportedLanguage)
    : "fr");

  // Create schema with translated messages
  const inscriptionSchemaTranslated = z.object({
    email: z.string().min(1, { message: t("errors.required") }).email({ message: t("errors.invalidEmail") }),
    firstName: z.string().min(1, { message: t("errors.required") }),
    lastName: z.string().min(1, { message: t("errors.required") }),
    password: z.string()
      .min(1, { message: t("errors.required") })
      .min(8, { message: t("auth.passwordMinLength") })
      .regex(/[A-Z]/, { message: t("auth.passwordRequiresUppercase") })
      .regex(/[a-z]/, { message: t("auth.passwordRequiresLowercase") })
      .regex(/[0-9]/, { message: t("auth.passwordRequiresNumber") }),
    confirmPassword: z.string().min(1, { message: t("errors.required") }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("auth.passwordMismatch"),
    path: ["confirmPassword"],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InscriptionFormData>({
    resolver: zodResolver(inscriptionSchemaTranslated),
    mode: "onSubmit",
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });



async function onSubmit(formData: InscriptionFormData) {
  setLoading(true);
  setFormError(null);
  try {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email: formData.email.trim(),
      password: formData.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          display_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        },
      },
    });

    if (error) {
      let message=""
      if (error.message==="User already registered"){
         message =
          t("auth.accountAlreadyExists", {
            defaultValue: "Un compte existe déjà avec cette adresse email.",
          });
      }
      else{
        message=error.message
      }
      setFormError(message);
      // toast({ variant: "destructive", title: t("errors.title"), description: message });
      return;
    }

    if (!data.user) {
      const message = t(
        "auth.accountAlreadyExists",
        {
          defaultValue: "Un compte existe déjà avec cette adresse email.",
        },
      );
      setFormError(message);
      toast({ variant: "destructive", title: t("errors.title"), description: message });
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          user_id: data.user.id,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          company: "",
          role: "worker",
          preferred_language: currentLanguage,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.warn("Profile upsert warning:", profileError.message);
    }


    supabase.functions.invoke("send-welcome-email", {
      body: {
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      },
    }).then(({ error: emailError }) => {
      if (emailError) console.error("Welcome email error:", emailError);
      else console.log("Welcome email sent");
    }).catch((err) => console.error("Welcome email call error:", err));

    sessionStorage.removeItem("pendingUser");
    localStorage.removeItem("subscribed_ok");
    localStorage.removeItem("subscribed_email");

    toast({
      title: t("auth.signupSuccess") || "Compte créé !",
      description: "Bienvenue ! Ajoutez votre établissement pour commencer.",
    });

    navigate("/etablissement");

  } catch (err) {
    console.error("Erreur inattendue:", err);
    toast({ variant: "destructive", title: t("errors.title"), description: t("errors.generic") });
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-12">
      <BackArrow />
      {/* Background with organic shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full blur-3xl opacity-30"></div>

        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-orange-200 to-yellow-200 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-full blur-3xl opacity-40"></div>

        <div className="absolute bottom-20 right-20 w-60 h-60 bg-gradient-to-bl from-blue-300 to-cyan-300 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full blur-2xl opacity-25"></div>
      </div>
      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Indicateur d'étapes - au-dessus de la card */}
        {/* <div className="flex items-center justify-center gap-6 mb-6">
          Step 1: Créer un compte (actif) - GAUCHE
          <div className="flex items-center gap-3 flex-nowrap">
            <div className="bg-[#2F4FF7] text-white rounded-full flex items-center justify-center border border-[#2F4FF7] h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
              <User className="text-white h-4 w-4 md:h-5 md:w-5" />
            </div>
            <span className="text-sm md:text-base whitespace-nowrap text-[#2F4FF7] font-semibold">
              Créer un compte
            </span>
          </div>

          Separator line
          <div className="h-px w-10 md:w-14 bg-border flex-shrink-0" />

          Step 2: Abonnement (inactif) - DROITE
          <div className="flex items-center gap-3 flex-nowrap">
            <div className="bg-transparent text-foreground rounded-full flex items-center justify-center border border-[#E3E8F2] h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
              <CreditCard className="text-[#96A0B5] h-4 w-4 md:h-5 md:w-5" />
            </div>
            <span className="text-sm md:text-base whitespace-nowrap text-[#96A0B5]">
              Abonnement
            </span>
          </div>
        </div> */}

        <Card className="w-full bg-white/90 dark:bg-white/[0.05] backdrop-blur-sm dark:backdrop-blur-xl border-0 dark:border dark:border-white/[0.08] shadow-xl dark:shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-2 text-center pb-2">
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">{t("auth.signup") || "Inscription"}</CardTitle>
              <p className="text-gray-600 dark:text-gray-400">{t("auth.startAnalyzing")}</p>
            </CardHeader>
        <CardContent>
          {formError && (
            <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  autoComplete="email"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  required
                  className="h-12 pl-10 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("auth.firstNameLabel")}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-500" />
                <Input
                  id="firstName"
                  placeholder={t("auth.firstNamePlaceholder")}
                  autoComplete="given-name"
                  {...register("firstName")}
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? "firstName-error" : undefined}
                  required
                  maxLength={80}
                  className="h-12 pl-10 pr-10 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>
              {errors.firstName && (
                <p id="firstName-error" className="text-sm text-red-600 dark:text-red-400">{errors.firstName.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("auth.lastNameLabel")}</Label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-500" />
                <Input
                  id="lastName"
                  placeholder={t("auth.lastNamePlaceholder")}
                  autoComplete="family-name"
                  {...register("lastName")}
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? "lastName-error" : undefined}
                  required
                  maxLength={80}
                  className="h-12 pl-10 pr-10 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>
              {errors.lastName && (
                <p id="lastName-error" className="text-sm text-red-600 dark:text-red-400">{errors.lastName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("auth.passwordLabel")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-500 z-10 pointer-events-none" aria-hidden />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.passwordPlaceholder")}
                  autoComplete="new-password"
                  {...register("password")}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  required
                  className="h-12 pl-10 pr-10 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-gray-500 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded z-10"
                  aria-label={showPassword ? t("auth.hidePassword", "Masquer le mot de passe") : t("auth.showPassword", "Afficher le mot de passe")}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("auth.confirmPasswordLabel")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-500 z-10 pointer-events-none" aria-hidden />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                  required
                  className="h-12 pl-10 pr-10 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-gray-500 hover:text-foreground dark:hover:text-white focus:outline-none rounded z-10"
                  aria-label={showConfirmPassword ? t("auth.hidePassword", "Masquer le mot de passe") : t("auth.showPassword", "Afficher le mot de passe")}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium"
            >
              {loading ? t("auth.signingUp") || "Création..." : t("auth.createAccount")|| "Créer mon compte"}
            </Button>
            <div className="text-center pt-2">
              <p className="text-gray-600 dark:text-gray-400">
                {t("auth.alreadyHaveAccount", "Already have an account?")}{" "}
                <button
                  type="button"
                  onClick={() => navigate("/connexion")}
                  className="text-primary font-medium hover:underline"
                >
                  {t("auth.login", "Login")}
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
