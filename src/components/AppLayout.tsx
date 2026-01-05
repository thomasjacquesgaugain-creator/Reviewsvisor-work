import { useLocation } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  
  // Pages où on ne veut pas afficher le footer ou la navbar
  const hideFooterPaths = ['/debug', '/api/auth/callback/google', '/reset-password', '/mot-de-passe-oublie', '/connexion', '/login'];
  const shouldHideFooter = hideFooterPaths.some(path => location.pathname.startsWith(path));
  
  // Pages où on ne veut pas afficher la navbar (comme les callbacks OAuth, pages auth standalone)
  const hideNavBarPaths = ['/api/auth/callback/google', '/reset-password', '/mot-de-passe-oublie', '/connexion', '/login'];
  const shouldHideNavBar = hideNavBarPaths.some(path => location.pathname.startsWith(path));

  return (
    <div className="flex flex-col min-h-screen">
      {!shouldHideNavBar && <NavBar />}
      <main className="flex-1">
        {children}
      </main>
      {!shouldHideFooter && <Footer />}
    </div>
  );
}
