import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { User, UserCircle, Building2, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

type SignUpFormData = {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  address: string;
  password: string;
  confirmPassword: string;
};

interface SignUpFormProps {
  prefilledEmail?: string;
}

export default function SignUpForm({ prefilledEmail }: SignUpFormProps = {}) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Create schema with translated messages
  const signUpSchemaTranslated = z.object({
    email: z.string().min(1, { message: t("errors.required") }).email({ message: t("errors.invalidEmail") }),
    firstName: z.string().min(1, { message: t("errors.required") }),
    lastName: z.string().min(1, { message: t("errors.required") }),
    company: z.string().min(1, { message: t("errors.required") }),
    address: z.string().min(1, { message: t("errors.required") }),
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
    setValue,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchemaTranslated),
    mode: "onSubmit",
    defaultValues: {
      email: prefilledEmail || "",
      firstName: "",
      lastName: "",
      company: "",
      address: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (prefilledEmail) {
      setValue("email", prefilledEmail);
    }
  }, [prefilledEmail, setValue]);

  async function onSubmit(formData: SignUpFormData) {
    setLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      // 1. Créer le compte avec metadata
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: { 
          data: { 
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            company: formData.company.trim()
          },
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: t("auth.signupError"),
          description: error.message
        });
        return;
      }

      // 2. Upsert dans profiles
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            user_id: data.user.id,
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
            company: formData.company.trim(),
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'id'
          });

        if (profileError) {
          console.error('Erreur lors de la mise à jour du profil:', profileError);
        }

        // 3. Link subscription by email
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({ user_id: data.user.id })
          .or(`user_id.is.null,email.eq.${formData.email.trim()}`);

        if (subError) {
          console.error('Erreur lors du lien de l\'abonnement:', subError);
        }

        // 4. Envoyer l'email de bienvenue (non bloquant)
        supabase.functions.invoke('send-welcome-email', {
          body: {
            email: formData.email.trim(),
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
          },
        }).then(({ error: emailError }) => {
          if (emailError) {
            console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', emailError);
          } else {
            console.log('Email de bienvenue envoyé avec succès');
          }
        });

        // Clean up local storage
        localStorage.removeItem("subscribed_ok");
        localStorage.removeItem("subscribed_email");
      }

      toast({
        title: t("auth.signupSuccess"),
        description: t("auth.signupSuccessDesc")
      });

      // Redirection vers la page de remerciement
      navigate("/merci-inscription");
      
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder={t("auth.emailPlaceholder")}
          autoComplete="email"
          {...register("email")}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          required
        />
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
        <Label htmlFor="company">{t("auth.companyLabel")}</Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="company"
            placeholder={t("auth.companyNamePlaceholder")}
            autoComplete="organization"
            {...register("company")}
            aria-invalid={!!errors.company}
            aria-describedby={errors.company ? "company-error" : undefined}
            required
            maxLength={100}
            className="pl-10"
          />
        </div>
        {errors.company && (
          <p id="company-error" className="text-sm text-destructive">{errors.company.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">{t("auth.addressLabel")}</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="address"
            placeholder={t("auth.addressPlaceholder")}
            autoComplete="street-address"
            {...register("address")}
            aria-invalid={!!errors.address}
            aria-describedby={errors.address ? "address-error" : undefined}
            required
            maxLength={200}
            className="pl-10"
          />
        </div>
        {errors.address && (
          <p id="address-error" className="text-sm text-destructive">{errors.address.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">{t("auth.passwordLabel")}</Label>
        <Input
          id="password"
          type="password"
          placeholder={t("auth.passwordPlaceholder")}
          autoComplete="new-password"
          {...register("password")}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          required
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("auth.confirmPasswordLabel")}</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder={t("auth.confirmPasswordPlaceholder")}
          autoComplete="new-password"
          {...register("confirmPassword")}
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
          required
        />
        {errors.confirmPassword && (
          <p id="confirmPassword-error" className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>
      
      <Button 
        type="submit" 
        disabled={loading}
        className="w-full"
      >
        {loading ? t("auth.signingUp") : t("auth.signupAction")}
      </Button>
    </form>
  );
}
