import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export function NotificationsSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [newReviews, setNewReviews] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [importantUpdates, setImportantUpdates] = useState(true);

  const handleToggle = async (key: string, value: boolean) => {
    // TODO: Sauvegarder les préférences
    toast.success("Préférences mises à jour");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Notifications</h1>

      {/* Notifications email */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Notifications par email</h2>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="new-reviews" className="text-base font-medium text-gray-900">
                Nouveaux avis
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Recevoir un email à chaque nouvel avis
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
                Rapport hebdomadaire
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Recevoir un résumé hebdomadaire de vos performances
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
                Mises à jour importantes
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Recevoir des notifications sur les changements importants
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
          <h2 className="text-lg font-medium text-gray-900">Notifications in-app</h2>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="in-app" className="text-base font-medium text-gray-900">
                Activer les notifications in-app
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Recevoir des notifications dans l'application
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
