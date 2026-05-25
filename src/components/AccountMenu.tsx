import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  MessageSquare,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function AccountMenu() {
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

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
            "group inline-flex h-10 items-center gap-2 px-4 rounded-lg transition-colors duration-150 ease-in-out cursor-pointer",
            "bg-transparent text-gray-700 dark:text-slate-300",
            "hover:bg-primary hover:text-primary-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950",
            isActive("/settings") || isActive("/compte") ? "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground" : ""
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
        className="w-80 p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground shadow-xl dark:shadow-black/40"
        sideOffset={8}
      >
        {/* Header avec avatar + nom + email */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <User className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{displayName}</p>
              {user.email && (
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Menu items */}
        <DropdownMenuGroup className="p-1">
          <DropdownMenuItem
            onClick={() => navigate("/settings/establishments")}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer",
              isActive("/settings/establishments") && "bg-primary/10 text-primary"
            )}
          >
            <Building2 className="h-4 w-4" />
            <span className="text-sm">{t("headerAccountMenu.establishment")}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/messages")}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer",
              isActive("/messages") && "bg-primary/10 text-primary"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm">{t("headerAccountMenu.messages")}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/settings/billing")}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer",
              isActive("/settings/billing") && "bg-primary/10 text-primary"
            )}
          >
            <CreditCard className="h-4 w-4" />
            <span className="text-sm">{t("headerAccountMenu.billingAndSubscription")}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => navigate("/settings/profile")}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer",
              isActive("/settings/profile") && "bg-primary/10 text-primary"
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm">{t("headerAccountMenu.accountSettings")}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/aide")}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="text-sm">{t("headerAccountMenu.help")}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">{t("headerAccountMenu.logout")}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
