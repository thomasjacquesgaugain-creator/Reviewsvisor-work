import { useLocation } from "react-router-dom";
import { Footer } from "@/components/Footer";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  
  // Pages où on ne veut pas afficher le footer
  const hideFooterPaths = ['/debug', '/api/auth/callback/google'];
  const shouldHideFooter = hideFooterPaths.some(path => location.pathname.startsWith(path));

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {children}
      </main>
      {!shouldHideFooter && <Footer />}
    </div>
  );
}
