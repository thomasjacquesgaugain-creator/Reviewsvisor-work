import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";
import { getUserEstablishments } from "@/services/establishments";
import { EstablishmentData } from "@/services/establishments";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Check,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function AccountMenu() {
  const { user, displayName, signOut } = useAuth();
  const currentEstablishment = useCurrentEstablishment();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [establishments, setEstablishments] = useState<EstablishmentData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadEstablishments();
    }
  }, [user]);

  const loadEstablishments = async () => {
    try {
      setLoading(true);
      const data = await getUserEstablishments();
      setEstablishments(data);
    } catch (error) {
      console.error("Error loading establishments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-150 ease-in-out cursor-pointer",
            "bg-transparent text-gray-700",
            "hover:bg-blue-600 hover:text-white",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            isActive("/settings") || isActive("/compte") ? "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white" : ""
          )}
          aria-label="Menu compte"
        >
          <User className="h-4 w-4 transition-colors duration-150 ease-in-out" />
          <span className="hidden sm:inline text-sm font-medium transition-colors duration-150 ease-in-out">{displayName}</span>
          <ChevronDown className="h-4 w-4 hidden sm:inline transition-colors duration-150 ease-in-out" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
      >
        {/* Header avec avatar + nom + email */}
        <div className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
              {user.email && (
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              )}
            </div>
          </div>

          {/* Établissement actif */}
          {currentEstablishment && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-medium text-gray-500 mb-2">Établissement actif</p>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentEstablishment.name}
                </p>
              </div>
            </div>
          )}

          {/* Sélecteur d'établissement (si plusieurs) */}
          {establishments.length > 1 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-medium text-gray-500 mb-2">Changer d'établissement</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {establishments.map((est) => {
                  const isCurrent = currentEstablishment?.id === est.id || currentEstablishment?.place_id === est.place_id;
                  return (
                    <button
                      key={est.id || est.place_id}
                      onClick={() => {
                        // TODO: Implémenter le changement d'établissement
                        // updateCurrentEstablishment(est.id);
                        navigate("/settings/establishments");
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm",
                        "hover:bg-gray-50 transition-colors",
                        isCurrent && "bg-blue-50"
                      )}
                    >
                      {isCurrent && <Check className="h-4 w-4 text-blue-600" />}
                      <span className={cn(
                        "flex-1 truncate",
                        isCurrent ? "text-blue-600 font-medium" : "text-gray-700"
                      )}>
                        {est.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Menu items */}
        <DropdownMenuGroup className="p-1">
          <DropdownMenuItem
            onClick={() => navigate("/dashboard")}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer",
              isActive("/dashboard") && "bg-blue-50 text-blue-600"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-sm">Dashboard</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/settings/establishments")}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer",
              isActive("/settings/establishments") && "bg-blue-50 text-blue-600"
            )}
          >
            <Building2 className="h-4 w-4" />
            <span className="text-sm">Établissements</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/messages")}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer",
              isActive("/messages") && "bg-blue-50 text-blue-600"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm">Messages</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/settings/billing")}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer",
              isActive("/settings/billing") && "bg-blue-50 text-blue-600"
            )}
          >
            <CreditCard className="h-4 w-4" />
            <span className="text-sm">Facturation / Abonnement</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => navigate("/settings/profile")}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer",
              isActive("/settings/profile") && "bg-blue-50 text-blue-600"
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm">Paramètres du compte</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/aide")}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="text-sm">Aide</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Déconnexion</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
