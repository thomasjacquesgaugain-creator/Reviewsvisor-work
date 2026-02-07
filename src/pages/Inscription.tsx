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
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
    
    try {
      // Stocker les données dans sessionStorage
      const pendingUserData = {
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        password: formData.password,
      };

      sessionStorage.setItem("pendingUser", JSON.stringify(pendingUserData));

      toast({
        title: t("auth.signupSuccess") || "Informations enregistrées",
        description: "Redirection vers la sélection de l'abonnement..."
      });

      // Redirection vers la page d'abonnement
      navigate("/abonnement");
      
    } catch (err) {
      console.error('Erreur inattendue:', err);
      toast({
        variant: "destructive",
        title: t("errors.title"),
        description: t("errors.generic")
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100 px-4 py-12">
      <BackArrow />
      <div className="w-full max-w-md">
        {/* Indicateur d'étapes - au-dessus de la card */}
        <div className="flex items-center justify-center gap-6 mb-6">
          {/* Step 1: Créer un compte (actif) - GAUCHE */}
          <div className="flex items-center gap-3 flex-nowrap">
            <div className="bg-[#2F4FF7] text-white rounded-full flex items-center justify-center border border-[#2F4FF7] h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
              <User className="text-white h-4 w-4 md:h-5 md:w-5" />
            </div>
            <span className="text-sm md:text-base whitespace-nowrap text-[#2F4FF7] font-semibold">
              Créer un compte
            </span>
          </div>

          {/* Separator line */}
          <div className="h-px w-10 md:w-14 bg-border flex-shrink-0" />

          {/* Step 2: Abonnement (inactif) - DROITE */}
          <div className="flex items-center gap-3 flex-nowrap">
            <div className="bg-transparent text-foreground rounded-full flex items-center justify-center border border-[#E3E8F2] h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
              <CreditCard className="text-[#96A0B5] h-4 w-4 md:h-5 md:w-5" />
            </div>
            <span className="text-sm md:text-base whitespace-nowrap text-[#96A0B5]">
              Abonnement
            </span>
          </div>
        </div>

        <Card className="w-full shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">{t("auth.signup") || "Inscription"}</CardTitle>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  autoComplete="email"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  required
                  className="pl-10"
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="firstName">{t("auth.firstNameLabel")}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  placeholder={t("auth.firstNamePlaceholder")}
                  autoComplete="given-name"
                  {...register("firstName")}
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? "firstName-error" : undefined}
                  required
                  maxLength={80}
                  className="pl-10"
                />
              </div>
              {errors.firstName && (
                <p id="firstName-error" className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">{t("auth.lastNameLabel")}</Label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lastName"
                  placeholder={t("auth.lastNamePlaceholder")}
                  autoComplete="family-name"
                  {...register("lastName")}
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? "lastName-error" : undefined}
                  required
                  maxLength={80}
                  className="pl-10"
                />
              </div>
              {errors.lastName && (
                <p id="lastName-error" className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.passwordLabel")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" aria-hidden />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.passwordPlaceholder")}
                  autoComplete="new-password"
                  {...register("password")}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  required
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded z-10"
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
                <p id="password-error" className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPasswordLabel")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" aria-hidden />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                  required
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded z-10"
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
                <p id="confirmPassword-error" className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full"
            >
              {loading ? t("auth.signingUp") || "Enregistrement..." : "Continuer vers l'abonnement"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
