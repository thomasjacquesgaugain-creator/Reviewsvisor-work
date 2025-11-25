import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

export default function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/connexion" replace />;
  
  return children;
}