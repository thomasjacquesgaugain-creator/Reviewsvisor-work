import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { User, UserCircle } from "lucide-react";

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!firstName.trim()) {
      newErrors.firstName = "Le prénom est requis";
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = "Le nom est requis";
    }
    
    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email invalide";
    }
    
    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = "Veuillez confirmer le mot de passe";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      // 1. Créer le compte avec metadata
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { 
          data: { 
            first_name: firstName.trim(),
            last_name: lastName.trim()
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
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`,
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'id'
          });

        if (profileError) {
          console.error('Erreur lors de la mise à jour du profil:', profileError);
          // On ne bloque pas l'inscription même si l'upsert échoue
        }
      }

      toast({
        title: "Compte créé avec succès !",
        description: "Bienvenue ! Vous pouvez maintenant utiliser l'application."
      });

      // Redirection
      navigate("/tableau-de-bord");
      
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
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="votre@email.com"
          autoComplete="email"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            setErrors(prev => ({ ...prev, email: "" }));
          }}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          required
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">{errors.email}</p>
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
            value={firstName}
            onChange={e => {
              setFirstName(e.target.value);
              setErrors(prev => ({ ...prev, firstName: "" }));
            }}
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? "firstName-error" : undefined}
            required
            maxLength={80}
            className="pl-10"
          />
        </div>
        {errors.firstName && (
          <p id="firstName-error" className="text-sm text-destructive">{errors.firstName}</p>
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
            value={lastName}
            onChange={e => {
              setLastName(e.target.value);
              setErrors(prev => ({ ...prev, lastName: "" }));
            }}
            aria-invalid={!!errors.lastName}
            aria-describedby={errors.lastName ? "lastName-error" : undefined}
            required
            maxLength={80}
            className="pl-10"
          />
        </div>
        {errors.lastName && (
          <p id="lastName-error" className="text-sm text-destructive">{errors.lastName}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          placeholder="Votre mot de passe"
          autoComplete="new-password"
          value={password}
          onChange={e => {
            setPassword(e.target.value);
            setErrors(prev => ({ ...prev, password: "" }));
          }}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          required
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirmez votre mot de passe"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={e => {
            setConfirmPassword(e.target.value);
            setErrors(prev => ({ ...prev, confirmPassword: "" }));
          }}
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
          required
        />
        {errors.confirmPassword && (
          <p id="confirmPassword-error" className="text-sm text-destructive">{errors.confirmPassword}</p>
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