import { ReactNode, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Building2, Shield, Bell, Globe, CreditCard, FileText, Palette, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { AppPageBackground } from "@/components/AppPageBackground";

interface SettingsNavItem {
  id: string;
  label: string;
  path: string;
  icon?: ReactNode;
}

interface SettingsLayoutProps {
  children: ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const settingsNavItems: SettingsNavItem[] = [
  {
    id: "profile",
    label: t("settings.personalInformation.title"),
    path: "/settings/profile",
    icon: <User className="h-4 w-4" />,
  },
  {
    id: "establishments",
    label: t("settings.establishmentAndAccess.title"),
    path: "/settings/establishments",
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    id: "establishment-info",
    label: t("settings.establishmentInformation.title"),
    path: "/settings/establishment-info",
    icon: <Info className="h-4 w-4" />,
  },
  {
    id: "security",
    label: t("settings.connectionAndSecurity.title"),
    path: "/settings/security",
    icon: <Shield className="h-4 w-4" />,
  },
  {
    id: "notifications",
    label: t("settings.notifications.title"),
    path: "/settings/notifications",
    icon: <Bell className="h-4 w-4" />,
  },
  {
    id: "language",
    label: t("settings.LanguageRegionAndCurrency.title"),
    path: "/settings/language",
    icon: <Globe className="h-4 w-4" />,
  },
  {
    id: "billing",
    label: t("settings.BillingAndSubscription.title"),
    path: "/settings/billing",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    id: "billing-reports",
    label: t("settings.myMonthlyReports.title"),
    path: "/settings/billing/reports",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "customization",
    label: t("settings.personalization.title"),
    path: "/settings/customization",
    icon: <Palette className="h-4 w-4" />,
  },
];

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
  "hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950",
  isActive(item.path)
    ? "bg-primary/10 dark:bg-primary/15 text-primary font-medium"
    : "text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
)}
        >
          {item.icon}
          <span className="text-sm">{item.label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className="app-page-shell">
      <AppPageBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Mobile: Sheet menu */}
        <div className="lg:hidden mb-6">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
  variant="outline"
  size="sm"
  className="gap-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
>
                <Menu className="h-4 w-4" />
                <span>Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
  side="left"
  className="w-80 p-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800"
>
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t("settings.title")}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                    className="h-8 w-8 text-gray-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900">
                <NavContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop: 2-column layout */}
        <div className="flex gap-8 text-gray-900 dark:text-slate-100">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-8 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">{t("settings.title")}</h2>
              <NavContent />
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
