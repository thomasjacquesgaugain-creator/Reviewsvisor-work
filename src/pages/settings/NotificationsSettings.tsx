import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

type NotificationToggleKey =
  | "newReviews"
  | "weeklyReport"
  | "importantUpdates"
  | "inAppNotifications";

export function NotificationsSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [newReviews, setNewReviews] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [importantUpdates, setImportantUpdates] = useState(true);
  const { t } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    const loadNotificationPreferences = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading notification preferences:", error);
        return;
      }

      const profile = data as {
        monthly_report_enabled?: boolean | null;
        new_reviews_enabled?: boolean | null;
        important_updates_enabled?: boolean | null;
        in_app_notifications_enabled?: boolean | null;
      } | null;

      if (profile?.monthly_report_enabled !== null && profile?.monthly_report_enabled !== undefined) {
        setWeeklyReport(profile.monthly_report_enabled);
      }

      if (profile?.new_reviews_enabled !== null && profile?.new_reviews_enabled !== undefined) {
        setNewReviews(profile.new_reviews_enabled);
      }

      if (profile?.important_updates_enabled !== null && profile?.important_updates_enabled !== undefined) {
        setImportantUpdates(profile.important_updates_enabled);
      }

      if (profile?.in_app_notifications_enabled !== null && profile?.in_app_notifications_enabled !== undefined) {
        setInAppNotifications(profile.in_app_notifications_enabled);
      }
    };

    void loadNotificationPreferences();
  }, [user]);

  const handleToggle = async (key: NotificationToggleKey, value: boolean) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const columnByKey = {
        newReviews: "new_reviews_enabled",
        weeklyReport: "monthly_report_enabled",
        importantUpdates: "important_updates_enabled",
        inAppNotifications: "in_app_notifications_enabled",
      } as const;

      const profileUpdate = {
        user_id: user.id,
        [columnByKey[key]]: value,
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(profileUpdate, { onConflict: "user_id" });

      if (error) {
        throw error;
      }

      toast.success(t("settings.notifications.validation.preferencesUpdated"));
    } catch (error) {
      console.error("Error updating notification preferences:", error);

      if (key === "newReviews") setNewReviews(!value);
      if (key === "weeklyReport") setWeeklyReport(!value);
      if (key === "importantUpdates") setImportantUpdates(!value);
      if (key === "inAppNotifications") setInAppNotifications(!value);

      toast.error(t("common.error"));
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-8">{t("settings.notifications.title")}</h1>

      {/* Notifications email */}
      <div className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-slate-100">{t("settings.notifications.notificationsParEmail")}</h2>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="new-reviews" className="text-base font-medium text-gray-900 dark:text-slate-100">
                {t("settings.notifications.newReviews")}
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                {t("settings.notifications.newReviewsDescription")}
              </p>
            </div>
            <Switch
              id="new-reviews"
              checked={newReviews}
              onCheckedChange={(checked) => {
                setNewReviews(checked);
                handleToggle("newReviews", checked);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="weekly-report" className="text-base font-medium text-gray-900 dark:text-slate-100">
                {t("settings.notifications.weeklyReport")}
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                {t("settings.notifications.weeklyReportDescription")}
              </p>
            </div>
            <Switch
              id="weekly-report"
              checked={weeklyReport}
              onCheckedChange={(checked) => {
                setWeeklyReport(checked);
                handleToggle("weeklyReport", checked);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="important-updates" className="text-base font-medium text-gray-900 dark:text-slate-100">
                {t("settings.notifications.importantUpdates")}
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                {t("settings.notifications.importantUpdatesDescription")}
              </p>
            </div>
            <Switch
              id="important-updates"
              checked={importantUpdates}
              onCheckedChange={(checked) => {
                setImportantUpdates(checked);
                handleToggle("importantUpdates", checked);
              }}
            />
          </div>
        </div>
      </div>

      {/* Notifications in-app */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-slate-100">{t("settings.notifications.inAppNotifications")}</h2>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="in-app" className="text-base font-medium text-gray-900 dark:text-slate-100">
                {t("settings.notifications.enableInAppNotifications")}
              </Label>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t("settings.notifications.inAppNotificationsDescription")}
              </p>
            </div>
            <Switch
              id="in-app"
              checked={inAppNotifications}
              onCheckedChange={(checked) => {
                setInAppNotifications(checked);
                handleToggle("inAppNotifications", checked);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
