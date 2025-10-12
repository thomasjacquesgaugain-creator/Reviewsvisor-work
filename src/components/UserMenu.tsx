import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<{ full_name?: string } | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        setUserProfile(data);
      }
    };

    fetchUserProfile();
  }, [user]);
  
  return (
    <div className="flex items-center gap-3">
      {user ? (
        <>
          <span className="text-sm text-muted-foreground">
            Bonjour {userProfile?.full_name || user.email?.split('@')[0] || 'Utilisateur'}
          </span>
          <Button onClick={signOut} variant="outline" size="sm">
            Se déconnecter
          </Button>
        </>
      ) : (
        <Button asChild variant="outline" size="sm">
          <Link to="/auth">Se connecter</Link>
        </Button>
      )}
    </div>
  );
}