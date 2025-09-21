import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function UserMenu() {
  const { user, signOut } = useAuth();
  
  return (
    <div className="flex items-center gap-3">
      {user ? (
        <>
          <span className="text-sm text-muted-foreground">
            Bonjour Thomas Bonder
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