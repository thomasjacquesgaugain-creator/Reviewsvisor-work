import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, ArrowLeft } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, Locale } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

export function BillingReports() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const localeMap: Record<string, Locale> = {
    fr: fr,
    en: enUS,
  };
  const locale = localeMap[i18n.language] || enUS;

  // Générer la liste des 12 derniers mois
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      month: format(date, "MMMM yyyy", { locale }),
      monthKey: format(date, "yyyy-MM"),
      startDate: format(startOfMonth(date), "dd/MM/yyyy", { locale }),
      endDate: format(endOfMonth(date), "dd/MM/yyyy", { locale }),
    };
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/settings/billing")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("settings.myMonthlyReports.back")}</span>
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">{t("settings.myMonthlyReports.title")}</h1>
        <p className="text-sm text-gray-500 mt-2">
          {t("settings.myMonthlyReports.monthlyReportDescription")}
        </p>
      </div>

      <div className="space-y-4">
        {months.map((month) => (
          <div
            key={month.monthKey}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">{month.month}</h3>
                <p className="text-xs text-gray-500">
                  {month.startDate} - {month.endDate}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                // TODO: Implémenter le téléchargement du rapport
                console.log(`Télécharger le rapport pour ${month.monthKey}`);
              }}
            >
              <Download className="h-4 w-4" />
              <span>{t("settings.myMonthlyReports.download")}</span>
            </Button>
          </div>
        ))}
      </div>

      {months.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun rapport disponible</p>
        </div>
      )}
    </div>
  );
}
