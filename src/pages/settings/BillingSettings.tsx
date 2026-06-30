import { useMemo, useState } from "react";
import { getBillingSummary } from "@/services/billingSummary";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { useSubscription } from "@/hooks/useSubscription";
import {
  createCustomerPortalSession,
  type BillingInformation,
  type BillingInvoice,
  type BillingPaymentMethod,
} from "@/lib/stripe";
import { BillingInvoicesTable } from "@/pages/settings/BillingInvoices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  DollarSign,
  FileText,
  Home,
  Loader2,
  Pencil,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const planBadgeStyles = {
  basic: "bg-slate-100 text-slate-600",
  standard: "bg-blue-50 text-blue-700",
  pro: "bg-indigo-50 text-indigo-700",
};

const cycleBadgeStyles = {
  annual: "bg-emerald-50 text-emerald-700",
  monthly: "bg-orange-50 text-orange-700",
};

export function BillingSettings() {
  const { subscription, loading } = useSubscription();
  const { t, i18n } = useTranslation();
  const summary = getBillingSummary(subscription);

  const [portalLoading, setPortalLoading] = useState(false);
  const [invoiceState, setInvoiceState] = useState<{
    invoices: BillingInvoice[];
    paymentMethod: BillingPaymentMethod | null;
    billingInformation: BillingInformation | null;
    loading: boolean;
    error: string | null;
  }>({
    invoices: [],
    paymentMethod: null,
    billingInformation: null,
    loading: true,
    error: null,
  });
  const [subscriptionSearch, setSubscriptionSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<
    "all" | "basic" | "standard" | "pro"
  >("all");
  const [activeTab, setActiveTab] = useState("subscriptions");

  const subscriptions = summary.activeSubscriptions;

  const enrichedSubscriptions = useMemo(
    () =>
      subscriptions.map((sub) => {
        const plan =
          subscriptionPlans.find((item) => item.priceId === sub.priceId) ??
          null;

        return {
          ...sub,
          plan,
        };
      }),
    [subscriptions],
  );

  const filteredSubscriptions = useMemo(() => {
    const query = subscriptionSearch.trim().toLowerCase();

    return enrichedSubscriptions.filter((sub) => {
      const matchesPlan = planFilter === "all" || sub.planTier === planFilter;
      const matchesSearch =
        !query ||
        sub.establishmentName?.toLowerCase().includes(query) ||
        sub.planName?.toLowerCase().includes(query);

      return matchesPlan && matchesSearch;
    });
  }, [enrichedSubscriptions, planFilter, subscriptionSearch]);

  const activePlanCount = subscriptions.length;
  const annualCount = enrichedSubscriptions.filter(
    (sub) => sub.planBilling === "annual",
  ).length;
  const monthlyCount = enrichedSubscriptions.filter(
    (sub) => sub.planBilling === "monthly",
  ).length;

  const monthlyTotalTTC = enrichedSubscriptions.reduce(
    (total, sub) => total + (sub.plan?.priceTTC ?? 0),
    0,
  );
  const monthlyTotalHT = enrichedSubscriptions.reduce(
    (total, sub) => total + (sub.plan?.priceHT ?? 0),
    0,
  );

  const nextRenewalInfo = useMemo(() => {
    const today = new Date();

    const upcomingRenewals = subscriptions
      .filter((sub) => sub.periodEnd)
      .map((sub) => ({
        ...sub,
        renewalDate: new Date(sub.periodEnd!),
      }))
      .filter((sub) => sub.renewalDate >= today)
      .sort((a, b) => a.renewalDate.getTime() - b.renewalDate.getTime());

    if (upcomingRenewals.length === 0) {
      return null;
    }

    const nextDate = upcomingRenewals[0].renewalDate;

    const establishmentCount = upcomingRenewals.filter((sub) => {
      const d = sub.renewalDate;

      return (
        d.getFullYear() === nextDate.getFullYear() &&
        d.getMonth() === nextDate.getMonth() &&
        d.getDate() === nextDate.getDate()
      );
    }).length;

    const daysRemaining = Math.max(
      0,
      Math.ceil((nextDate.getTime() - today.getTime()) / 86400000),
    );

    return {
      date: nextDate,
      daysRemaining,
      establishmentCount,
    };
  }, [subscriptions]);

  const lastInvoice = useMemo(() => {
    return [...invoiceState.invoices].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
  }, [invoiceState.invoices]);
console.log("invoiceState.billingInformation", invoiceState.billingInformation)
  const paymentMethod = invoiceState.paymentMethod;
  const billingInformation = invoiceState.billingInformation;
  const cardBrand = paymentMethod?.brand
    ? paymentMethod.brand.toUpperCase()
    : "CARD";
  const cardLast4 = paymentMethod?.last4 ?? "----";
  const cardholderName =
    paymentMethod?.cardholder_name || billingInformation?.name || "-";
  const cardExpiry =
    paymentMethod?.exp_month && paymentMethod.exp_year
      ? `${String(paymentMethod.exp_month).padStart(2, "0")} / ${String(paymentMethod.exp_year).slice(-2)}`
      : "-";
  const billingCurrency =
    billingInformation?.currency || lastInvoice?.currency?.toUpperCase() || "EUR";
  const accountType = summary.planBilling
    ? `${summary.planName} (${summary.planBilling})`
    : summary.planName || "-";

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const url = await createCustomerPortalSession();
      if (url) {
        window.location.href = url;
        return;
      }
      toast.error("Impossible d'ouvrir le portail de facturation");
    } catch (err) {
      console.error("Customer portal error:", err);
      toast.error("Impossible d'ouvrir le portail de facturation");
    } finally {
      setPortalLoading(false);
    }
  };

  const formatEuro = (amount: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);

  const formatInvoiceAmount = (invoice: BillingInvoice) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: invoice.currency.toUpperCase(),
    }).format((invoice.amount_paid || invoice.amount_due) / 100);

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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {t("settings.BillingAndSubscription.title")}
          </h1>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-400">
            {t("settings.BillingAndSubscription.description")}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-10 min-w-[160px] px-5 justify-center gap-2 rounded-xl text-sm font-medium",
              activeTab === "invoices"
                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white"
                : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50 hover:text-slate-900",
            )}
            onClick={() => setActiveTab("invoices")}
          >
            <FileText className="h-5 w-5" />
            {t("settings.BillingAndSubscription.myInvoices")}
          </Button>
          <Button
            type="button"
            className={cn(
              "h-10 min-w-[220px] px-5 justify-center gap-2 rounded-xl text-sm font-medium",
              activeTab === "subscriptions"
                ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                : "bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 hover:text-slate-900",
            )}
            onClick={openPortal}
            disabled={portalLoading}
          >
            {portalLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Pencil className="h-5 w-5" />
            )}
            {portalLoading
              ? t("settings.BillingAndSubscription.opening")
              : t("settings.BillingAndSubscription.manageMySubscription")}
          </Button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          highlighted
          icon={<DollarSign className="h-4 w-4" />}
          title={t("settings.BillingAndSubscription.monthlyTotal")}
          loading={loading}
          value={activePlanCount > 0 ? formatEuro(monthlyTotalTTC) : "-"}
          description={
            activePlanCount > 0
              ? t("settings.BillingAndSubscription.monthlyTotalDescription", {
                  monthlyHT: formatEuro(monthlyTotalHT),
                  yearlyTTC: formatEuro(monthlyTotalTTC * 12),
                })
              : t("settings.BillingAndSubscription.noActiveSubscription")
          }
        />
        <MetricCard
          icon={<Home className="h-4 w-4" />}
          title={t("settings.BillingAndSubscription.activeSubscription")}
          loading={loading}
          value={String(activePlanCount)}
          description={t(
            "settings.BillingAndSubscription.subscriptionBreakdown",
            {
              annual: annualCount,
              monthly: monthlyCount,
            },
          )}
        />
        <MetricCard
          icon={<CalendarDays className="h-4 w-4" />}
          title={t("settings.BillingAndSubscription.nextRenewal")}
          loading={loading}
          value={nextRenewalInfo ? formatDate(nextRenewalInfo.date) : "-"}
          description={
            nextRenewalInfo
              ? t("settings.BillingAndSubscription.inDays", {
                  count: nextRenewalInfo.daysRemaining,
                })
              : t("settings.BillingAndSubscription.noActiveRenewal")
          }
          secondaryText={
            nextRenewalInfo
              ? t("settings.BillingAndSubscription.establishments", {
                  count: nextRenewalInfo.establishmentCount,
                })
              : undefined
          }
          accent
        />
        <MetricCard
          icon={<FileText className="h-4 w-4" />}
          title={t("settings.BillingAndSubscription.lastInvoice")}
          loading={invoiceState.loading}
          value={lastInvoice ? formatInvoiceAmount(lastInvoice) : "-"}
          description={
            lastInvoice
              ? `${lastInvoice.invoice_number || lastInvoice.invoice_id} - ${formatDate(lastInvoice.created_at)}. ${t(`settings.BillingAndSubscription.invoices.payStatus.${lastInvoice.status.toLowerCase()}`, lastInvoice.status)}`
              : t("settings.BillingAndSubscription.noInvoice")
          }
        />
      </section>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-200 p-4">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:w-auto sm:grid-cols-3">
            <TabsTrigger
              value="subscriptions"
              className="group h-10 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 data-[state=active]:border-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <span>
                {t("settings.BillingAndSubscription.subscriptions.title")}
              </span>

              <span
                className="
                  ml-3 rounded-full px-3 py-0.5 text-xs font-semibold
                  bg-slate-100 text-slate-500
                  group-data-[state=active]:bg-white/20
                  group-data-[state=active]:text-white
                "
              >
                {activePlanCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="invoices"
              className="group h-10 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 data-[state=active]:border-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <span>{t("settings.BillingAndSubscription.invoices.title")}</span>

              <span
                className="
                  ml-3 rounded-full px-3 py-0.5 text-xs font-semibold
                  bg-slate-100 text-slate-500
                  group-data-[state=active]:bg-white/20
                  group-data-[state=active]:text-white
                "
              >
                {invoiceState.invoices.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-500 shadow-none data-[state=active]:border-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20"
              value="payment-method"
            >
              {t("settings.BillingAndSubscription.paymentMethods.title")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="subscriptions" className="m-0 p-5 sm:p-7">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={subscriptionSearch}
                onChange={(event) => setSubscriptionSearch(event.target.value)}
                placeholder={t(
                  "settings.BillingAndSubscription.subscriptions.searchForLocation",
                )}
                className="h-10 rounded-xl border-slate-200 bg-white pl-11 shadow-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "basic", "standard", "pro"] as const).map((filter) => (
                <Button
                  key={filter}
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-9 rounded-full text-sm border-slate-200 px-5 capitalize",
                    planFilter === filter &&
                      "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white",
                  )}
                  onClick={() => setPlanFilter(filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid gap-4 grid-cols-[1.5fr_0.7fr_0.7fr_1fr_1fr_0.7fr] bg-slate-50 px-5 py-4 text-xs font-semibold uppercase text-slate-400 max-lg:hidden">
              <span>
                {t("settings.BillingAndSubscription.subscriptions.location")}
              </span>
              <span>
                {t("settings.BillingAndSubscription.subscriptions.plan")}
              </span>
              <span>
                {t("settings.BillingAndSubscription.subscriptions.cycle")}
              </span>
              <span>
                {t("settings.BillingAndSubscription.subscriptions.rate")}
              </span>
              <span>
                {t("settings.BillingAndSubscription.subscriptions.renewal")}
              </span>
              <span>
                {t("settings.BillingAndSubscription.subscriptions.status")}
              </span>
            </div>

            {loading ? (
              <LoadingRow
                label={t("settings.BillingAndSubscription.loadingPlan")}
              />
            ) : filteredSubscriptions.length > 0 ? (
              filteredSubscriptions.map((sub) => (
                <div
                  key={sub.subscriptionId}
                  className="grid gap-4 border-t border-slate-100 px-5 py-3.5 text-sm text-slate-600 lg:grid-cols-[1.5fr_0.7fr_0.7fr_1fr_1fr_0.7fr] lg:items-center"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {sub.establishmentName || "-"}
                    </p>
                    <p className="text-xs font-medium text-slate-400">
                      {sub.plan?.reviewQuota ?? "-"} reviews/month
                    </p>
                  </div>
                  <Badge className={planBadgeStyles[sub.planTier ?? "pro"]}>
                    {sub.planTier === "pro"
                      ? `💎 ${sub.planName}`
                      : sub.planName || "-"}
                  </Badge>
                  <Badge
                    className={cycleBadgeStyles[sub.planBilling ?? "monthly"]}
                  >
                    {sub.planBilling === "annual" ? (
                      <ShieldCheck className="h-3 w-3" />
                    ) : (
                      <Zap className="h-3 w-3" />
                    )}
                    {sub.planBilling || "-"}
                  </Badge>
                  <div>
                    <p className="font-bold text-slate-900">
                      {sub.plan ? formatEuro(sub.plan.priceTTC) : "-"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {sub.plan
                        ? `${formatEuro(sub.plan.priceHT)} excl. VAT / month`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {sub.periodEnd &&
                      new Date(sub.periodEnd).getMonth() ===
                        new Date().getMonth() &&
                      new Date(sub.periodEnd).getFullYear() ===
                        new Date().getFullYear() && (
                        <span className="text-amber-600">⏳</span>
                      )}

                    <span
                      className={cn(
                        "font-medium",
                        sub.periodEnd &&
                          new Date(sub.periodEnd).getMonth() ===
                            new Date().getMonth() &&
                          new Date(sub.periodEnd).getFullYear() ===
                            new Date().getFullYear()
                          ? "text-amber-600"
                          : "text-slate-500",
                      )}
                    >
                      {formatDate(sub.periodEnd)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      {t(
                        "settings.BillingAndSubscription.subscriptions.active",
                      )}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg px-3 text-xs"
                      onClick={openPortal}
                    >
                      {t(
                        "settings.BillingAndSubscription.subscriptions.manage",
                      )}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                label={t(
                  "settings.BillingAndSubscription.noActiveSubscription",
                )}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="invoices"
          forceMount
          className="m-0 p-5 data-[state=inactive]:hidden sm:p-7"
        >
          <BillingInvoicesTable onStateChange={setInvoiceState} />
        </TabsContent>

        <TabsContent value="payment-method" className="m-0 p-5 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr] items-stretch">
            <section className="rounded-2xl border border-slate-200 p-4 flex flex-col">
              <h2 className="text-lg font-base text-slate-900">
                {t("settings.BillingAndSubscription.paymentMethods.cardSaved")}
              </h2>
              <div className="mt-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 p-5 text-white shadow-lg min-h-[180px]">
                {invoiceState.loading ? (
                  <div className="flex h-[140px] items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-white/80" />
                  </div>
                ) : paymentMethod ? (
                  <>
                    <div className="text-base tracking-[0.25em] text-white/70">
                      {cardBrand}
                    </div>
                    <div className="mt-10 flex items-center justify-between text-lg font-semibold tracking-[0.25em]">
                      <span>....</span>
                      <span>....</span>
                      <span>....</span>
                      <span>{cardLast4}</span>
                    </div>
                    <div className="mt-7 flex items-end justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase text-white/45">
                          Cardholder
                        </p>
                        <p className="mt-1 truncate text-base font-bold tracking-wide">
                          {cardholderName}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-semibold uppercase text-white/45">
                          Expires
                        </p>
                        <p className="mt-1 text-base font-bold">{cardExpiry}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-[140px] flex-col justify-center gap-2">
                    <p className="text-base font-semibold">No saved card</p>
                    <p className="text-sm text-white/65">
                      Add a payment method from the billing portal.
                    </p>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                className="mt-auto h-10 w-full rounded-xl text-sm"
                onClick={openPortal}
              >
                {t("settings.BillingAndSubscription.paymentMethods.editCard")}
              </Button>
            </section>

            <section className="rounded-2xl border border-slate-200 p-4 flex flex-col">
              <h2 className="text-lg font-base text-slate-900">
                {t(
                  "settings.BillingAndSubscription.paymentMethods.billingInformation",
                )}
              </h2>
              {invoiceState.loading ? (
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-8 text-sm font-medium text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("settings.BillingAndSubscription.paymentMethods.loadingBillingInfo")}
                </div>
              ) : (
                <div className="mt-1 divide-y divide-slate-100">
                  <InfoLine
                    label={t("settings.BillingAndSubscription.paymentMethods.companyName")}
                    value={
                      billingInformation?.business_name ||
                      billingInformation?.name ||
                      "-"
                    }
                    prominent
                  />
                  <InfoLine
                    label={t("settings.BillingAndSubscription.paymentMethods.accountType")}
                    value={accountType}
                  />
                  <InfoLine
                    label={t("settings.BillingAndSubscription.paymentMethods.vat")}
                    value={billingInformation?.tax_display || "-"}
                    prominent
                  />
                  <InfoLine label={t("settings.BillingAndSubscription.paymentMethods.currency")} value={billingCurrency} prominent />
                  <InfoLine
                    label={t("settings.BillingAndSubscription.paymentMethods.billingDate")}
                    value={nextRenewalInfo ? formatDate(nextRenewalInfo.date) : "-"}
                  />
                </div>
              )}
              <Button
                variant="outline"
                className="mt-auto h-10 w-full rounded-xl text-sm"
                onClick={openPortal}
              >
                {t(
                  "settings.BillingAndSubscription.paymentMethods.editInformation",
                )}
              </Button>
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  secondaryText,
  icon,
  loading,
  highlighted,
  accent,
}: {
  title: string;
  value: string;
  description: string;
  secondaryText?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  highlighted?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm min-h-[120px]",
        highlighted &&
          "border-blue-600 bg-blue-600 text-white shadow-blue-600/20",
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <span className={cn("text-blue-600", highlighted && "text-white")}>
            {icon}
          </span>
        )}

        <p
          className={cn(
            "text-xs font-semibold text-slate-500",
            highlighted && "text-blue-100",
          )}
        >
          {title}
        </p>
      </div>

      <div className="mt-2 flex min-h-[30px] items-center">
        {loading ? (
          <Loader2
            className={cn(
              "h-8 w-8 animate-spin text-blue-600",
              highlighted && "text-white",
            )}
          />
        ) : (
          <p
            className={cn(
              "text-lg font-bold text-slate-950",
              highlighted && "text-white",
            )}
          >
            {value}
          </p>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2">
        <span
          className={cn(
            "text-xs font-medium",
            highlighted
              ? "text-blue-100"
              : accent
                ? "text-orange-600"
                : "text-slate-500",
          )}
        >
          {description}
        </span>

        {secondaryText && (
          <span
            className={cn(
              "text-xs font-medium",
              highlighted ? "text-blue-100/80" : "text-slate-400",
            )}
          >
            {secondaryText}
          </span>
        )}
      </div>
    </div>
  );
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-md px-3 py-1 text-xs font-bold capitalize",
        className,
      )}
    >
      {children}
    </span>
  );
}

function LoadingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 border-t border-slate-100 px-5 py-8 text-sm font-medium text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      {label}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="border-t border-slate-100 px-5 py-10 text-sm font-medium text-slate-500">
      {label}
    </div>
  );
}

function InfoLine({
  label,
  value,
  prominent,
}: {
  label: string;
  value: string;
  prominent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <span className="text-sm font-medium text-slate-500">{label}</span>

      <span
        className={cn(
          "text-right text-sm font-semibold text-slate-950",
          prominent && "text-sm",
        )}
      >
        {value}
      </span>
    </div>
  );
}
