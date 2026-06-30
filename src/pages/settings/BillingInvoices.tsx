import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowLeft, Calendar, Download, FileText, Info, Loader2 } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, Locale } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import {
  downloadBillingInvoicesZip,
  getBillingReports,
  type BillingInformation,
  type BillingInvoice,
  type BillingPaymentMethod,
} from "@/lib/stripe";

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

function useBillingInvoices() {
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<BillingPaymentMethod | null>(null);
  const [billingInformation, setBillingInformation] = useState<BillingInformation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const reports = await getBillingReports();
        if (!cancelled) {
          setInvoices(reports.invoices);
          setPaymentMethod(reports.payment_method);
          setBillingInformation(reports.billing_information);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
          setInvoices([]);
          setPaymentMethod(null);
          setBillingInformation(null);
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

  return { invoices, paymentMethod, billingInformation, loading, error };
}

function formatBillingInvoiceAmount(invoice: BillingInvoice) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: invoice.currency.toUpperCase(),
  }).format((invoice.amount_paid || invoice.amount_due) / 100);
}

function getBillingInvoiceDownloadUrl(invoice: BillingInvoice) {
  return invoice.invoice_pdf_url || invoice.hosted_invoice_url;
}

function openBillingInvoice(invoice: BillingInvoice) {
  const downloadUrl = getBillingInvoiceDownloadUrl(invoice);
  if (downloadUrl) {
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
  }
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function BillingInvoicesTable({
  className,
  onStateChange,
}: {
  className?: string;
  onStateChange?: (state: {
    invoices: BillingInvoice[];
    paymentMethod: BillingPaymentMethod | null;
    billingInformation: BillingInformation | null;
    loading: boolean;
    error: string | null;
  }) => void;
}) {
  const { t, i18n } = useTranslation();
  const { invoices, paymentMethod, billingInformation, loading, error } = useBillingInvoices();
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ invoices, paymentMethod, billingInformation, loading, error });
  }, [billingInformation, error, invoices, loading, onStateChange, paymentMethod]);

  const filteredInvoices = useMemo(() => {
    const query = invoiceSearch.trim().toLowerCase();

    return invoices.filter((invoice) => {
      if (!query) return true;

      return (
        invoice.invoice_number?.toLowerCase().includes(query) ||
        invoice.invoice_id.toLowerCase().includes(query) ||
        invoice.plan_name?.toLowerCase().includes(query)
      );
    });
  }, [invoices, invoiceSearch]);

  const formatDate = (value?: string | Date | null) => {
    if (!value) return "-";

    return new Date(value).toLocaleDateString(
      i18n.resolvedLanguage || i18n.language,
      {
        month: "long",
        day: "numeric",
        year: "numeric",
      },
    );
  };

  const downloadableInvoices = useMemo(
    () => filteredInvoices.filter((invoice) => getBillingInvoiceDownloadUrl(invoice)),
    [filteredInvoices],
  );

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    setDownloadError(null);

    try {
      const { blob, fileName } = await downloadBillingInvoicesZip(
        downloadableInvoices.map((invoice) => invoice.invoice_id),
      );
      saveBlob(
        blob,
        fileName || `reviewsvisor-invoices-${new Date().toISOString().slice(0, 10)}.zip`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setDownloadError(message);
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex flex-col gap-3 lg:flex-row">
        <Input
          value={invoiceSearch}
          onChange={(event) => setInvoiceSearch(event.target.value)}
          placeholder={t("settings.BillingAndSubscription.invoices.searchByNumberOrEstablishment")}
          className="h-10 rounded-xl border-slate-200 bg-white shadow-none"
        />
        <Button
          variant="outline"
          className="h-10 gap-2 rounded-xl border-slate-200 bg-white px-8"
          disabled={downloadingAll || downloadableInvoices.length === 0}
          onClick={handleDownloadAll}
        >
          {downloadingAll ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Download className="h-5 w-5" />
          )}
          {t("settings.BillingAndSubscription.invoices.downloadAllInvoices")}
        </Button>
      </div>

      {downloadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {downloadError}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="grid grid-cols-[1.1fr_0.9fr_1.8fr_0.8fr_0.7fr_0.6fr] bg-slate-50 px-5 py-4 text-[11px] font-semibold uppercase text-slate-400 max-lg:hidden">
          <span>{t("settings.BillingAndSubscription.invoices.invoiceNumber")}</span>
          <span>{t("settings.BillingAndSubscription.invoices.date")}</span>
          <span>{t("settings.BillingAndSubscription.invoices.establishment")}</span>
          <span>{t("settings.BillingAndSubscription.invoices.amount")}</span>
          <span>{t("settings.BillingAndSubscription.invoices.status")}</span>
          <span />
        </div>

        {loading ? (
          <div className="flex items-center gap-3 border-t border-slate-100 px-5 py-8 text-sm font-medium text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("settings.BillingAndSubscription.invoices.loadingInvoices")}
          </div>
        ) : error ? (
          <div className="border-t border-slate-100 px-5 py-10 text-sm font-medium text-slate-500">
            {error}
          </div>
        ) : filteredInvoices.length > 0 ? (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.invoice_id}
              className="grid gap-4 border-t border-slate-100 px-5 py-3.5 text-sm lg:grid-cols-[1.1fr_0.9fr_1.8fr_0.8fr_0.7fr_0.6fr] lg:items-center"
            >
              <p className="text-sm font-semibold text-slate-900">{invoice.invoice_number || invoice.invoice_id}</p>
              <p className="text-sm text-slate-500">{formatDate(invoice.created_at)}</p>
              <p className="text-sm text-slate-500">{invoice.plan_name || "Subscription invoice"}</p>
              <p className="text-sm font-semibold text-slate-900">{formatBillingInvoiceAmount(invoice)}</p>
              <span className={`inline-flex items-center gap-2 text-sm font-medium capitalize ${invoice.status === "paid" ? "text-emerald-700" : "text-red-700"}`}>
                <span className={`h-2 w-2 rounded-full ${invoice.status === "paid" ? "bg-emerald-600" : "bg-red-600"}`}/>
                {t(`settings.BillingAndSubscription.invoices.payStatus.${invoice.status.toLowerCase()}`, invoice.status)}
              </span>
              <Button
                variant="outline"
                className="h-8 gap-1 rounded-lg px-3 text-xs font-medium"
                disabled={!getBillingInvoiceDownloadUrl(invoice)}
                onClick={() => openBillingInvoice(invoice)}
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          ))
        ) : (
          <div className="border-t border-slate-100 px-5 py-10 text-sm font-medium text-slate-500">
            {t("settings.BillingAndSubscription.invoices.noInvoiceAvailable")}
          </div>
        )}
      </div>

      <p className="flex items-start gap-2 px-1 text-sm font-medium text-slate-500">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <span>{t("settings.BillingAndSubscription.invoices.exampleDataNote")}</span>
      </p>
    </div>
  );
}

export function BillingInvoices() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { invoices, loading, error } = useBillingInvoices();

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
          <span>{t("settings.myMonthlyInvoices.back")}</span>
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
          {t("settings.myMonthlyInvoices.title")}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t("settings.myMonthlyInvoices.monthlyReportDescription")}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-600 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
         {t("settings.BillingAndSubscription.invoices.loadingInvoices")}
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
                    {monthInvoices.length}  {t("settings.myMonthlyInvoices.invoice")}{monthInvoices.length > 1 ? "s" : ""}
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
                              <p className="text-xs text-slate-500 dark:text-slate-400"> {t("settings.myMonthlyInvoices.stripeInvoice")}</p>
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
                              {t("settings.myMonthlyInvoices.download")}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-sm text-slate-500 dark:text-slate-400">
                      {t("settings.myMonthlyInvoices.noInvoice")}
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
          <p className="text-slate-500 dark:text-slate-400"> {t("settings.myMonthlyInvoices.noInvoiceAvailable")}</p>
        </div>
      )}
    </div>
  );
}
