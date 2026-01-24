import { ReactNode, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Building2, Shield, Bell, Globe, CreditCard, FileText, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface SettingsNavItem {
  id: string;
  label: string;
  path: string;
  icon?: ReactNode;
}

interface SettingsLayoutProps {
  children: ReactNode;
}

const settingsNavItems: SettingsNavItem[] = [
  {
    id: "profile",
    label: "Informations personnelles",
    path: "/settings/profile",
    icon: <User className="h-4 w-4" />,
  },
  {
    id: "establishments",
    label: "Établissements & accès",
    path: "/settings/establishments",
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    id: "security",
    label: "Connexion & sécurité",
    path: "/settings/security",
    icon: <Shield className="h-4 w-4" />,
  },
  {
    id: "notifications",
    label: "Notifications",
    path: "/settings/notifications",
    icon: <Bell className="h-4 w-4" />,
  },
  {
    id: "language",
    label: "Langue, Région & Devises",
    path: "/settings/language",
    icon: <Globe className="h-4 w-4" />,
  },
  {
    id: "billing",
    label: "Facturation / Abonnement",
    path: "/settings/billing",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    id: "billing-reports",
    label: "Mes rapports mensuels",
    path: "/settings/billing/reports",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "customization",
    label: "Personnalisation",
    path: "/settings/customization",
    icon: <Palette className="h-4 w-4" />,
  },
];

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const NavContent = () => (
    <nav className="space-y-1">
      {settingsNavItems.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            navigate(item.path);
            setMobileMenuOpen(false);
          }}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors",
            "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            isActive(item.path)
              ? "bg-primary/10 text-primary font-medium"
              : "text-gray-700 hover:text-gray-900"
          )}
        >
          {item.icon}
          <span className="text-sm">{item.label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--app-bg, var(--background)))' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile: Sheet menu */}
        <div className="lg:hidden mb-6">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Menu className="h-4 w-4" />
                <span>Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Paramètres</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <NavContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop: 2-column layout */}
        <div className="flex gap-8">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Paramètres</h2>
              <NavContent />
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
