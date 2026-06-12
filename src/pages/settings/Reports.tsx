import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { enUS, fr, type Locale } from "date-fns/locale";
import { Download, FileText, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  downloadMonthlyReportPdf,
  getMonthlyReportsByEstablishment,
  type MonthlyReportRow,
} from "@/services/monthlyReports";
import { useEstablishmentStore } from "@/store/establishmentStore";

type GroupedReportsByYear = {
  year: string;
  reports: MonthlyReportRow[];
};

export function Reports() {
  const { t, i18n } = useTranslation();
  const activeEstablishmentId = useEstablishmentStore(
    (state) => state.activeEstablishmentId ?? state.selectedEstablishment?.id ?? null,
  );
  const activeEstablishmentName = useEstablishmentStore(
    (state) => state.selectedEstablishment?.name ?? null,
  );
  const [reports, setReports] = useState<MonthlyReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const localeMap: Record<string, Locale> = {
    fr,
    en: enUS,
  };
  const locale = localeMap[i18n.language] || enUS;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!activeEstablishmentId) {
        setReports([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const rows = await getMonthlyReportsByEstablishment(activeEstablishmentId);
        if (!cancelled) {
          setReports(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setReports([]);
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeEstablishmentId]);

  const groupedReports = useMemo<GroupedReportsByYear[]>(() => {
    const groups = reports.reduce<Map<string, GroupedReportsByYear>>((acc, report) => {
      const year = format(parseISO(report.report_month), "yyyy");

      if (!acc.has(year)) {
        acc.set(year, {
          year,
          reports: [],
        });
      }

      acc.get(year)!.reports.push(report);
      return acc;
    }, new Map());

    return Array.from(groups.values()).sort((a, b) => Number(b.year) - Number(a.year));
  }, [reports]);

  const handleDownload = async (report: MonthlyReportRow) => {
    try {
      setDownloadingKey(report.id);
      const language = i18n.language?.startsWith("en") ? "en" : "fr";
      const { blob, fileName } = await downloadMonthlyReportPdf({
        reportId: report.id,
        language,
      });
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = fileName || `${report.report_month_key}-${language}.pdf`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(
        t(
          "settings.reports.downloadError",
          "Unable to prepare the report download right now.",
        ),
      );
      console.error("Monthly report download failed:", message);
    } finally {
      setDownloadingKey(null);
    }
  };

  const formatMonthLabel = (reportMonth: string) =>
    format(parseISO(reportMonth), "MMMM yyyy", { locale });

  const formatPeriod = (value: string) =>
    format(parseISO(value), "dd MMM yyyy", { locale });

  return (
    <div className="p-8 text-gray-900 dark:text-slate-100">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">
          {t("settings.reports.title", "Monthly Reports")}
        </h1>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t(
            "settings.reports.description",
            "Download the monthly reports already generated for your active establishment.",
          )}
        </p>

        {activeEstablishmentName ? (
          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("settings.reports.activeEstablishment", "Active establishment")}:{" "}
            <span className="text-gray-900 dark:text-slate-100">
              {activeEstablishmentName}
            </span>
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t("settings.reports.loading", "Loading reports...")}
        </div>
      ) : !activeEstablishmentId ? (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="py-16">
            <div className="text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-slate-400 dark:text-slate-500" />

              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">
                {t("settings.reports.noActiveEstablishmentTitle", "No active establishment selected")}
              </h3>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "settings.reports.noActiveEstablishmentDescription",
                  "Select an establishment first to view its monthly reports.",
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20">
          <CardContent className="p-6 text-sm text-red-700 dark:text-red-300">
            {error}
          </CardContent>
        </Card>
      ) : groupedReports.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="py-16">
            <div className="text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-slate-400 dark:text-slate-500" />

              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">
                {t("settings.reports.emptyTitle", "No reports available")}
              </h3>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "settings.reports.emptyDescription",
                  "Monthly reports will appear here after a complete month has been processed.",
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groupedReports.map((group) => (
            <section
              key={group.year}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  {group.year}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t("settings.reports.groupDescription", "Only months saved in your report history are shown here.")}
                </p>
              </div>

              <div className="space-y-3 p-5">
                {group.reports.map((report) => {
                  const isDownloading = downloadingKey === report.id;

                  return (
                    <Card
                      key={report.id}
                      className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>

                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-slate-100">
                              {formatMonthLabel(report.report_month)}
                            </h3>

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {t("settings.reports.period", "Report period")}:{" "}
                              {formatPeriod(report.period_start)} -{" "}
                              {formatPeriod(report.period_end)}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-slate-300 bg-white text-gray-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                          disabled={isDownloading}
                          onClick={() => {
                            void handleDownload(report);
                          }}
                        >
                          {isDownloading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          {t("settings.reports.download", "Download")}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}