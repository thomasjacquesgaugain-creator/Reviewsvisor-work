import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function NotificationsSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [newReviews, setNewReviews] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [importantUpdates, setImportantUpdates] = useState(true);
  const { t } = useTranslation();

  const handleToggle = async (key: string, value: boolean) => {
    // TODO: Sauvegarder les préférences
    toast.success(t("settings.notifications.validation.preferencesUpdated"));
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">{t("settings.notifications.title")}</h1>

      {/* Notifications email */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">{t("settings.notifications.notificationsParEmail")}</h2>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="new-reviews" className="text-base font-medium text-gray-900">
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
              <Label htmlFor="weekly-report" className="text-base font-medium text-gray-900">
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
              <Label htmlFor="important-updates" className="text-base font-medium text-gray-900">
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
          <MessageSquare className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">{t("settings.notifications.inAppNotifications")}</h2>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="in-app" className="text-base font-medium text-gray-900">
                {t("settings.notifications.enableInAppNotifications")}
              </Label>
              <p className="text-sm text-gray-500 mt-1">
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
