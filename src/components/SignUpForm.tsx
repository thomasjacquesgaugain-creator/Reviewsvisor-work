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

const signUpSchema = z.object({
  email: z.string().min(1, { message: "Veuillez renseigner ce champ." }).email({ message: "Veuillez renseigner un email valide." }),
  firstName: z.string().min(1, { message: "Veuillez renseigner ce champ." }),
  lastName: z.string().min(1, { message: "Veuillez renseigner ce champ." }),
  company: z.string().min(1, { message: "Veuillez renseigner ce champ." }),
  address: z.string().min(1, { message: "Veuillez renseigner ce champ." }),
  password: z.string().min(1, { message: "Veuillez renseigner ce champ." }).min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
  confirmPassword: z.string().min(1, { message: "Veuillez renseigner ce champ." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  prefilledEmail?: string;
}

export default function SignUpForm({ prefilledEmail }: SignUpFormProps = {}) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
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
          title: "Erreur d'inscription",
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

        // Clean up local storage
        localStorage.removeItem("subscribed_ok");
        localStorage.removeItem("subscribed_email");
      }

      toast({
        title: "Compte créé avec succès !",
        description: "Bienvenue ! Vous allez être redirigé."
      });

      // Redirection vers la page de remerciement
      navigate("/merci-inscription");
      
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="votre@email.com"
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
        <Label htmlFor="firstName">Prénom</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="firstName"
            placeholder="Votre prénom"
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
        <Label htmlFor="lastName">Nom</Label>
        <div className="relative">
          <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="lastName"
            placeholder="Votre nom"
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
        <Label htmlFor="company">Entreprise</Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="company"
            placeholder="Nom de votre entreprise"
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
        <Label htmlFor="address">Adresse de l'établissement</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="address"
            placeholder="Adresse complète du restaurant"
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
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          placeholder="Votre mot de passe"
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
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirmez votre mot de passe"
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
        {loading ? "Création..." : "Créer mon compte"}
      </Button>
    </form>
  );
}
