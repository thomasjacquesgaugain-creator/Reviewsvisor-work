import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    setLoading(false);
    
    if (error) {
      toast({
        variant: "destructive",
        title: t("auth.loginError"),
        description: error.message
      });
      return;
    }

    toast({
      title: t("auth.loginSuccess"),
      description: t("auth.loginSuccessDesc")
    });

    navigate("/tableau-de-bord");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t("auth.emailPlaceholder")}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input
          id="password"
          type="password"
          placeholder={t("auth.passwordPlaceholder")}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={loading}
        className="w-full"
      >
        {loading ? t("auth.loggingIn") : t("auth.login")}
      </Button>
    </form>
  );
}