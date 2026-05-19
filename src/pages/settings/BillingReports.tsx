import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Download, FileText, Loader2 } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, Locale } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { listBillingInvoices, type BillingInvoice } from "@/lib/stripe";

type MonthGroup = {
  monthKey: string;
  label: string;
  startDate: string;
  endDate: string;
};

const statusStyles: Record<string, string> = {
  paid:
    "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300",

  open:
    "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",

  draft:
    "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",

  void:
    "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300",

  uncollectible:
    "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300",
};

export function BillingReports() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localeMap: Record<string, Locale> = {
    fr,
    en: enUS,
  };
  const locale = localeMap[i18n.language] || enUS;

  const months: MonthGroup[] = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const date = subMonths(new Date(), i);
        return {
          monthKey: format(date, "yyyy-MM", { locale }),
          label: format(date, "MMMM yyyy", { locale }),
          startDate: format(startOfMonth(date), "dd/MM/yyyy", { locale }),
          endDate: format(endOfMonth(date), "dd/MM/yyyy", { locale }),
        };
      }),
    [locale]
  );

  const invoicesByMonth = useMemo(() => {
    return invoices.reduce<Record<string, BillingInvoice[]>>((acc, invoice) => {
      const key = format(new Date(invoice.created_at), "yyyy-MM", { locale });
      if (!acc[key]) acc[key] = [];
      acc[key].push(invoice);
      return acc;
    }, {});
  }, [invoices, locale]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await listBillingInvoices();
        if (!cancelled) {
          setInvoices(rows);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
          setInvoices([]);
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
  }, []);

  const formatMoney = (amount: number, currency: string) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);

  return (
    <div className="p-8 text-gray-900 dark:text-slate-100">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/settings/billing")}
          className="mb-4 gap-2 text-gray-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("settings.myMonthlyReports.back")}</span>
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
          {t("settings.myMonthlyReports.title")}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t("settings.myMonthlyReports.monthlyReportDescription")}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-600 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
         {t("settings.myMonthlyReports.loadingInvoices")}
        </div>
      ) : error ? (
        <Card className="border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-6 text-sm text-red-700 dark:text-red-300">
            {error}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {months.map((month) => {
            const monthInvoices = invoicesByMonth[month.monthKey] ?? [];

            return (
              <section
                key={month.monthKey}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                        {month.label}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {month.startDate} - {month.endDate}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {monthInvoices.length}  {t("settings.myMonthlyReports.invoice")}{monthInvoices.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-3 p-5">
                  {monthInvoices.length > 0 ? (
                    monthInvoices.map((invoice) => {
                      const downloadUrl =
                        invoice.invoice_pdf_url || invoice.hosted_invoice_url;
                      const statusClass =
                        statusStyles[invoice.status] || "bg-gray-100 text-gray-700";

                      return (
                        <div
                          key={invoice.invoice_id}
                          className="flex flex-col gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-gray-900 dark:text-slate-100">
                                {invoice.invoice_number || invoice.invoice_id}
                              </span>
                              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass}`}>
                                {invoice.status}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {invoice.plan_name || "Subscription invoice"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(invoice.created_at).toLocaleDateString("fr-FR")}
                              {invoice.period_start && invoice.period_end && (
                                <>
                                  {" "}
                                  · {new Date(invoice.period_start).toLocaleDateString("fr-FR")}
                                  {" - "}
                                  {new Date(invoice.period_end).toLocaleDateString("fr-FR")}
                                </>
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                {formatMoney(invoice.amount_paid || invoice.amount_due, invoice.currency)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400"> {t("settings.myMonthlyReports.stripeInvoice")}</p>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                              disabled={!downloadUrl}
                              onClick={() => {
                                if (downloadUrl) {
                                  window.open(downloadUrl, "_blank", "noopener,noreferrer");
                                }
                              }}
                            >
                              <Download className="h-4 w-4" />
                              {t("settings.myMonthlyReports.download")}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-sm text-slate-500 dark:text-slate-400">
                      {t("settings.myMonthlyReports.noInvoice")}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {!loading && invoices.length === 0 && !error && (
        <div className="mt-8 text-center py-12">
          <FileText className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400"> {t("settings.myMonthlyReports.noInvoiceAvailable")}</p>
        </div>
      )}
    </div>
  );
}
