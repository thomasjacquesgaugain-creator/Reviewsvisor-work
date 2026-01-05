import { Navigate } from "react-router-dom";
import GoogleOAuthDebugPanel from "@/components/GoogleOAuthDebugPanel";

export default function DebugPage() {
  if (import.meta.env.PROD) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Diagnostic OAuth Google</h1>
        <GoogleOAuthDebugPanel />
      </div>
    </div>
  );
}
