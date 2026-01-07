import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function UserMenu() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  
  return (
    <div className="flex items-center gap-3">
      {user ? (
        <>
          <span className="text-sm text-muted-foreground">
            {t("auth.connected")}: {user.email}
          </span>
          <Button onClick={signOut} variant="outline" size="sm">
            {t("auth.logout")}
          </Button>
        </>
      ) : (
        <Button asChild variant="outline" size="sm">
          <Link to="/auth">{t("auth.login")}</Link>
        </Button>
      )}
    </div>
  );
}