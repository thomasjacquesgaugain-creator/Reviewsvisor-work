import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

interface RequireGuestProps {
  children: React.ReactNode;
}

/**
 * Guard component that only renders children for unauthenticated users.
 * Redirects authenticated users to the dashboard.
 */
export default function RequireGuest({ children }: RequireGuestProps) {
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  const isCreator = user?.email === "thomas.jacquesgaugain@gmail.com";

  // Show nothing while loading to prevent flash
  if (loading) {
    return null;
  }

  // Allow creator to access public pages even when authenticated
  if (isCreator) {
    return <>{children}</>;
  }

  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    return <Navigate to="/tableau-de-bord" replace />;
  }

  return <>{children}</>;
}
