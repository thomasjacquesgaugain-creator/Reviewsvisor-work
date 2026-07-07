import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import JSZip from "https://esm.sh/jszip@3.10.1";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "Content-Disposition",
};

type BillingInvoiceRow = {
  invoice_id: string;
  invoice_number: string | null;
  status: string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  created_at: string;
  period_start: string | null;
  period_end: string | null;
  subscription_id: string | null;
  plan_name: string | null;
  establishment_address: string | null;
  establishment_country: string | null;
  invoice_pdf_url: string | null;
  hosted_invoice_url: string | null;
};

type BillingPaymentMethod = {
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
  cardholder_name: string | null;
  funding: string | null;
  country: string | null;
};

type BillingInformation = {
  business_name: string | null;
  name: string | null;
  email: string | null;
  currency: string | null;
  tax_exempt: string | null;
  tax_display: string | null;
  tax_ids: string[];
  address: {
    line1: string | null;
    line2: string | null;
    postal_code: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
  } | null;
};

type LocalSubscriptionRow = {
  provider_subscription_id: string | null;
  establishment?: { 
    name?: string | null
    formatted_address?: string | null;
    country?: string | null;
   } | null;
};

type BillingReportsRequest = {
  format?: "json" | "zip" | "pdf";
  invoice_ids?: string[];
  language?: string;
};

type InvoiceLanguage = "fr" | "en";

type InvoicePdfCopy = {
  locale: string;
  invoiceTitle: string;
  paid: string;
  invoiceNumber: string;
  issueDate: string;
  issuer: string;
  establishment: string;
  designation: string;
  quantity: string;
  unitExclTax: string;
  tax: string;
  amountExclTax: string;
  period: (start: string, end: string) => string;
  totalExclTax: string;
  taxLine: (country: string, percentage: string, taxableAmount: string) => string;
  totalInclTax: string;
  defaultEstablishment: string;
  defaultDescription: string;
};

const INVOICE_PDF_COPY: Record<InvoiceLanguage, InvoicePdfCopy> = {
  fr: {
    locale: "fr-FR",
    invoiceTitle: "FACTURE",
    paid: "Payée",
    invoiceNumber: "N° de facture",
    issueDate: "Date d'émission",
    issuer: "ÉMETTEUR",
    establishment: "ÉTABLISSEMENT CONCERNÉ",
    designation: "DÉSIGNATION",
    quantity: "QTÉ",
    unitExclTax: "P.U. HT",
    tax: "TVA",
    amountExclTax: "MONTANT HT",
    period: (start, end) => `Période du ${start} au ${end}`,
    totalExclTax: "Total HT",
    taxLine: (country, percentage, taxableAmount) =>
      `TVA - ${country} (${percentage} % sur ${taxableAmount})`,
    totalInclTax: "TOTAL TTC",
    defaultEstablishment: "Etablissement",
    defaultDescription: "Abonnement Reviewsvisor",
  },
  en: {
    locale: "en-US",
    invoiceTitle: "INVOICE",
    paid: "Paid",
    invoiceNumber: "Invoice no.",
    issueDate: "Issue date",
    issuer: "ISSUER",
    establishment: "ESTABLISHMENT",
    designation: "DESCRIPTION",
    quantity: "QTY",
    unitExclTax: "UNIT EXCL. TAX",
    tax: "VAT",
    amountExclTax: "AMOUNT EXCL. TAX",
    period: (start, end) => `Period from ${start} to ${end}`,
    totalExclTax: "Total excl. tax",
    taxLine: (country, percentage, taxableAmount) =>
      `VAT - ${country} (${percentage}% on ${taxableAmount})`,
    totalInclTax: "TOTAL INCL. TAX",
    defaultEstablishment: "Establishment",
    defaultDescription: "Reviewsvisor subscription",
  }
};

const PDF_PAGE = {
  width: 595,
  height: 842,
  margin: 40,
};

const PDF_COLORS = {
  primary: rgb(0.2, 0.39, 0.89),
  dark: rgb(0.08, 0.11, 0.18),
  text: rgb(0.16, 0.19, 0.26),
  muted: rgb(0.45, 0.48, 0.56),
  light: rgb(0.93, 0.95, 0.98),
  border: rgb(0.88, 0.9, 0.94),
  success: rgb(0.12, 0.58, 0.35),
  successBg: rgb(0.91, 0.98, 0.95),
  white: rgb(1, 1, 1),
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[BILLING-REPORTS] ${step}${detailsStr}`);
};

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "invoice";
}

function formatTaxPercentage(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : String(value).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

function normalizePdfText(value: string | null | undefined) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2022/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeInvoiceLanguage(language: string | null | undefined): InvoiceLanguage {
  const baseLanguage = (language || "fr").split("-")[0].toLowerCase();
  return ["fr", "en"].includes(baseLanguage)
    ? baseLanguage as InvoiceLanguage
    : "fr";
}

function formatCurrency(amountInCents: number, currency: string, locale = "fr-FR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  })
  .format(amountInCents / 100)
  .replace(/^€/u, "€ ");
}

function formatInvoiceDate(date: Date, locale = "fr-FR") {
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function drawText(
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    size: number;
    font: PDFFont;
    color?: RGB;
    maxWidth?: number;
  },
) {
  const normalizedText = normalizePdfText(text);
  if (!normalizedText) return;

  page.drawText(normalizedText, {
    x: options.x,
    y: options.y,
    size: options.size,
    font: options.font,
    color: options.color ?? PDF_COLORS.text,
    maxWidth: options.maxWidth,
  });
}

function drawRightText(
  page: PDFPage,
  text: string,
  options: {
    rightX: number;
    y: number;
    size: number;
    font: PDFFont;
    color?: RGB;
  },
) {
  const normalizedText = normalizePdfText(text);
  const width = options.font.widthOfTextAtSize(normalizedText, options.size);
  drawText(page, normalizedText, {
    x: options.rightX - width,
    y: options.y,
    size: options.size,
    font: options.font,
    color: options.color,
  });
}

function drawWrappedText(
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    size: number;
    font: PDFFont;
    color?: RGB;
    maxWidth: number;
    lineHeight: number;
    maxLines?: number;
  },
) {
  const words = normalizePdfText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (options.font.widthOfTextAtSize(candidate, options.size) <= options.maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  const visibleLines = typeof options.maxLines === "number"
    ? lines.slice(0, options.maxLines)
    : lines;

  visibleLines.forEach((line, index) => {
    drawText(page, line, {
      x: options.x,
      y: options.y - index * options.lineHeight,
      size: options.size,
      font: options.font,
      color: options.color,
    });
  });

  return visibleLines.length * options.lineHeight;
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  return typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription?.id ??
      invoice.parent?.subscription_details?.subscription ??
      null;
}

function getInvoiceTaxDetails(invoice: Stripe.Invoice) {
  const invoiceWithTax = invoice as Stripe.Invoice & {
    total_taxes?: Array<{
      amount?: number | null;
      tax_rate_details?: {
        tax_rate?: string | Stripe.TaxRate | null;
      } | null;
    }>;
    account_country?: string | null;
  };
  const firstTotalTax = invoiceWithTax.total_taxes?.[0];
  const taxRate = firstTotalTax?.tax_rate_details?.tax_rate;
  const taxRateObject =
    taxRate && typeof taxRate === "object" ? taxRate : null;
  const fallbackTaxRate = invoiceWithTax.default_tax_rates?.[0] ?? null;
  const rate = taxRateObject ?? fallbackTaxRate;
  const percentage = rate?.effective_percentage ?? rate?.percentage ?? null;
  const country =
    rate?.country ??
    invoiceWithTax.customer_address?.country ??
    invoiceWithTax.account_country ??
    "FR";
  const amount =
    invoiceWithTax.total_taxes?.reduce(
      (sum, tax) => sum + (typeof tax.amount === "number" ? tax.amount : 0),
      0,
    ) ??
    (invoice as Stripe.Invoice & { total_tax_amounts?: Array<{ amount: number }> })
      .total_tax_amounts?.reduce((sum, tax) => sum + tax.amount, 0) ??
    0;

  return {
    amount,
    country: country.toUpperCase(),
    percentage,
  };
}

async function drawInvoiceLogo(
  pdfDoc: PDFDocument,
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  options: { x: number; y: number; width: number; height: number },
) {
  const logoUrl = Deno.env.get("REVIEWSVISOR_INVOICE_LOGO_URL");

  if (!logoUrl) {
    return;
  }

  try {
    const response = await fetch(logoUrl);

    if (!response.ok) {
      return;
    }

    const contentType = response.headers.get("content-type") || "";
    const bytes = await response.arrayBuffer();

    const image =
      contentType.includes("jpeg") || contentType.includes("jpg")
        ? await pdfDoc.embedJpg(bytes)
        : await pdfDoc.embedPng(bytes);

    page.drawImage(image, {
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
    });
  } catch (error) {
    logStep("Unable to load invoice logo", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function generateCustomInvoicePdf({
  invoice,
  row,
  customer,
  billingInformation,
  language,
}: {
  invoice: Stripe.Invoice;
  row: BillingInvoiceRow;
  customer: Stripe.Customer;
  billingInformation: BillingInformation;
  language: InvoiceLanguage;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PDF_PAGE.width, PDF_PAGE.height]);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const lineItems = invoice.lines.data;
  const taxDetails = getInvoiceTaxDetails(invoice);
  const currency = row.currency || invoice.currency || "EUR";
  const subtotal =
    invoice.subtotal_excluding_tax ??
    invoice.subtotal ??
    Math.max((invoice.total ?? row.amount_paid ?? row.amount_due ?? 0) - taxDetails.amount, 0);
  const total = invoice.total ?? row.amount_paid ?? row.amount_due ?? 0;
  const issueDate = new Date(invoice.created * 1000);
  const invoiceNumber = row.invoice_number || row.invoice_id;
  const copy = INVOICE_PDF_COPY[language];
  const establishmentName = row.plan_name || copy.defaultEstablishment;
  const statusLabel = row.status === "paid" ? copy.paid : row.status;

  page.drawRectangle({
    x: 0,
    y: PDF_PAGE.height - 5,
    width: PDF_PAGE.width,
    height: 5,
    color: PDF_COLORS.primary,
  });

  const leftX = PDF_PAGE.margin;
  const rightX = PDF_PAGE.width - PDF_PAGE.margin;
  let y = 540;

  await drawInvoiceLogo(pdfDoc, page, { regular, bold }, {
    x: leftX + 2,
    y: 708,
    width: 140,
    height: 29,
  });

  drawRightText(page, copy.invoiceTitle, {
    rightX,
    y: 722,
    size: 29,
    font: bold,
    color: PDF_COLORS.dark,
  });
  page.drawRectangle({
    x: rightX - 48,
    y: 682,
    width: 48,
    height: 18,
    color: PDF_COLORS.successBg,
  });
  page.drawCircle({ x: rightX - 39, y: 691, size: 3.2, color: PDF_COLORS.success });
  drawText(page, statusLabel, {
    x: rightX - 31,
    y: 687,
    size: 9,
    font: bold,
    color: PDF_COLORS.success,
  });

  drawRightText(page, `${copy.invoiceNumber} ${invoiceNumber}`, {
    rightX,
    y: 647,
    size: 10,
    font: bold,
    color: PDF_COLORS.primary,
  });
  drawRightText(page, `${copy.issueDate} ${formatInvoiceDate(issueDate, copy.locale)}`, {
    rightX,
    y: 628,
    size: 10,
    font: bold,
    color: PDF_COLORS.text,
  });

  const columnGap = 76;
  const columnWidth = (PDF_PAGE.width - PDF_PAGE.margin * 2 - columnGap) / 2;
  drawText(page, copy.issuer, { x: leftX, y, size: 10, font: bold, color: PDF_COLORS.primary });
  drawText(page, copy.establishment, {
    x: leftX + columnWidth + columnGap,
    y,
    size: 10,
    font: bold,
    color: PDF_COLORS.primary,
  });

  drawText(page, "Reviewsvisor", { x: leftX, y: y - 25, size: 13, font: bold, color: PDF_COLORS.dark });
  drawText(page, "HAWKMAN SAS", { x: leftX, y: y - 48, size: 10, font: regular, color: PDF_COLORS.muted });
  drawText(page, "36, rue Scheffer", { x: leftX, y: y - 66, size: 10, font: regular, color: PDF_COLORS.muted });
  drawText(page, "75116 Paris, France", { x: leftX, y: y - 84, size: 10, font: regular, color: PDF_COLORS.muted });
  drawText(page, "contact@reviewsvisor.fr", { x: leftX, y: y - 102, size: 10, font: regular, color: PDF_COLORS.muted });

  const customerX = leftX + columnWidth + columnGap;
  const establishmentHeight = drawWrappedText(page, establishmentName, {
  x: customerX,
  y: y - 25,
  size: 13,
  font: bold,
  color: PDF_COLORS.dark,
  maxWidth: columnWidth,
  lineHeight: 16,
  maxLines: 3,
});

let establishmentY = y - 25 - establishmentHeight - 8;

if (row.establishment_address) {
  const addressHeight = drawWrappedText(page, row.establishment_address, {
    x: customerX,
    y: establishmentY,
    size: 10,
    font: regular,
    color: PDF_COLORS.muted,
    maxWidth: columnWidth,
    lineHeight: 14,
    maxLines: 5,
  });

  establishmentY -= addressHeight + 6;
}

if (row.establishment_country) {
  drawText(page, row.establishment_country, {
    x: customerX,
    y: establishmentY,
    size: 10,
    font: regular,
    color: PDF_COLORS.muted,
  });
}

  y = 358;
  const tableX = leftX;
  const tableWidth = PDF_PAGE.width - PDF_PAGE.margin * 2;
  const radius = 6;

  // center rectangle
  page.drawRectangle({
    x: tableX + radius,
    y,
    width: tableWidth - radius * 2,
    height: 30,
    color: PDF_COLORS.primary,
  });

  // left side
  page.drawRectangle({
    x: tableX,
    y: y + radius,
    width: radius,
    height: 30 - radius * 2,
    color: PDF_COLORS.primary,
  });

  // right side
  page.drawRectangle({
    x: tableX + tableWidth - radius,
    y: y + radius,
    width: radius,
    height: 30 - radius * 2,
    color: PDF_COLORS.primary,
  });

  // corners
  page.drawCircle({
    x: tableX + radius,
    y: y + radius,
    size: radius,
    color: PDF_COLORS.primary,
  });

  page.drawCircle({
    x: tableX + radius,
    y: y + 30 - radius,
    size: radius,
    color: PDF_COLORS.primary,
  });

  page.drawCircle({
    x: tableX + tableWidth - radius,
    y: y + radius,
    size: radius,
    color: PDF_COLORS.primary,
  });

  page.drawCircle({
    x: tableX + tableWidth - radius,
    y: y + 30 - radius,
    size: radius,
    color: PDF_COLORS.primary,
  });
  drawText(page, copy.designation, { x: tableX + 10, y: y + 10, size: 9, font: bold, color: PDF_COLORS.white });
  drawRightText(page, copy.quantity, { rightX: tableX + tableWidth - 225, y: y + 10, size: 9, font: bold, color: PDF_COLORS.white });
  drawRightText(page, copy.unitExclTax, { rightX: tableX + tableWidth - 150, y: y + 10, size: 9, font: bold, color: PDF_COLORS.white });
  drawRightText(page, copy.tax, { rightX: tableX + tableWidth - 105, y: y + 10, size: 9, font: bold, color: PDF_COLORS.white });
  drawRightText(page, copy.amountExclTax, { rightX: tableX + tableWidth - 10, y: y + 10, size: 9, font: bold, color: PDF_COLORS.white });

  let rowY = y - 42;
  const visibleLines = lineItems.length > 0 ? lineItems.slice(0, 5) : [];
  for (const item of visibleLines) {
    const quantity = Number(item.quantity ?? 1) || 1;
    const lineSubtotal =
      (item as Stripe.InvoiceLineItem & { amount_excluding_tax?: number | null }).amount_excluding_tax ??
      item.amount ??
      0;
    const unitAmount = Math.round(lineSubtotal / quantity);
    const itemTaxPercentage = taxDetails.percentage ?? 0;
    const description = item.description || row.plan_name || copy.defaultDescription;

    drawWrappedText(page, description, {
      x: tableX + 12,
      y: rowY,
      size: 11,
      font: bold,
      color: PDF_COLORS.dark,
      maxWidth: 250,
      lineHeight: 14,
      maxLines: 2,
    });
    if (item.period?.start && item.period?.end) {
      drawText(
        page,
        copy.period(
          formatInvoiceDate(new Date(item.period.start * 1000), copy.locale),
          formatInvoiceDate(new Date(item.period.end * 1000), copy.locale),
        ),
        {
          x: tableX + 12,
          y: rowY - 28,
          size: 9,
          font: bold,
          color: PDF_COLORS.muted,
        },
      );
    }

    drawRightText(page, String(quantity), {
      rightX: tableX + tableWidth - 225,
      y: rowY,
      size: 10,
      font: bold,
      color: PDF_COLORS.dark,
    });
    drawRightText(page, formatCurrency(unitAmount, currency, copy.locale), {
      rightX: tableX + tableWidth - 150,
      y: rowY,
      size: 10,
      font: bold,
      color: PDF_COLORS.dark,
    });
    drawRightText(page, `${formatTaxPercentage(itemTaxPercentage)} %`, {
      rightX: tableX + tableWidth - 105,
      y: rowY,
      size: 10,
      font: bold,
      color: PDF_COLORS.dark,
    });
    drawRightText(page, formatCurrency(lineSubtotal, currency, copy.locale), {
      rightX: tableX + tableWidth - 12,
      y: rowY,
      size: 10,
      font: bold,
      color: PDF_COLORS.dark,
    });

    page.drawLine({
      start: { x: tableX, y: rowY - 52 },
      end: { x: tableX + tableWidth, y: rowY - 52 },
      thickness: 0.7,
      color: PDF_COLORS.border,
    });
    rowY -= 68;
  }

  const summaryX = tableX + tableWidth - 250;
  let summaryY = 225;
  drawText(page, copy.totalExclTax, { x: summaryX, y: summaryY, size: 10, font: regular, color: PDF_COLORS.muted });
  drawRightText(page, formatCurrency(subtotal, currency, copy.locale), {
    rightX: tableX + tableWidth,
    y: summaryY,
    size: 10,
    font: bold,
    color: PDF_COLORS.dark,
  });
  page.drawLine({ start: { x: summaryX, y: summaryY - 12 }, end: { x: tableX + tableWidth, y: summaryY - 12 }, thickness: 0.7, color: PDF_COLORS.border });
  summaryY -= 29;

  const taxLabel = copy.taxLine(
    taxDetails.country,
    formatTaxPercentage(taxDetails.percentage ?? 0),
    formatCurrency(subtotal, currency, copy.locale),
  );
  drawText(page, taxLabel, { x: summaryX, y: summaryY, size: 10, font: regular, color: PDF_COLORS.muted, maxWidth: 190 });
  drawRightText(page, formatCurrency(taxDetails.amount, currency, copy.locale), {
    rightX: tableX + tableWidth,
    y: summaryY,
    size: 10,
    font: bold,
    color: PDF_COLORS.dark,
  });
  page.drawLine({ start: { x: summaryX, y: summaryY - 12 }, end: { x: tableX + tableWidth, y: summaryY - 12 }, thickness: 0.7, color: PDF_COLORS.border });
  summaryY -= 44;

  page.drawLine({ start: { x: summaryX, y: summaryY + 25 }, end: { x: tableX + tableWidth, y: summaryY + 25 }, thickness: 1.4, color: PDF_COLORS.primary });
  drawText(page, copy.totalInclTax, { x: summaryX, y: summaryY, size: 12, font: bold, color: PDF_COLORS.primary });
  drawRightText(page, formatCurrency(total, currency, copy.locale), {
    rightX: tableX + tableWidth,
    y: summaryY - 5,
    size: 27,
    font: bold,
    color: PDF_COLORS.dark,
  });
  page.drawLine({ start: { x: summaryX, y: summaryY - 30 }, end: { x: tableX + tableWidth, y: summaryY - 30 }, thickness: 1.4, color: PDF_COLORS.primary });

  return await pdfDoc.save();
}

function getInvoiceTaxDisplay(invoices: Stripe.Invoice[]) {
  for (const invoice of invoices) {
    const invoiceWithTax = invoice as Stripe.Invoice & {
      total_taxes?: Array<{
        tax_rate_details?: {
          tax_rate?: string | Stripe.TaxRate | null;
        } | null;
      }>;
      account_country?: string | null;
    };
    const totalTax = invoiceWithTax.total_taxes?.[0];
    const taxRate = totalTax?.tax_rate_details?.tax_rate;
    const taxRateObject =
      taxRate && typeof taxRate === "object" ? taxRate : null;
    const fallbackTaxRate = invoiceWithTax.default_tax_rates?.[0] ?? null;
    const rate = taxRateObject ?? fallbackTaxRate;
    const country =
      rate?.country ?? invoiceWithTax.customer_address?.country ?? invoiceWithTax.account_country ?? null;
    const percentage =
      rate?.effective_percentage ?? rate?.percentage ?? null;

    if (country && typeof percentage === "number") {
      return `${country.toUpperCase()} • ${formatTaxPercentage(percentage)} %`;
    }
  }

  return null;
}

async function readRequestBody(req: Request): Promise<BillingReportsRequest> {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return {};
  }

  return await req.json().catch(() => ({}));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const body = await readRequestBody(req);
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 10 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found", { email: user.email });
      return new Response(JSON.stringify({
        invoices: [],
        payment_method: null,
        billing_information: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customer = customers.data[0];
    const customerId = customer.id;
    logStep("Found customer", { customerId });

    const defaultPaymentMethodId =
      typeof customer.invoice_settings.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : customer.invoice_settings.default_payment_method?.id ?? null;

    const stripePaymentMethod = defaultPaymentMethodId
      ? await stripe.paymentMethods.retrieve(defaultPaymentMethodId)
      : (
          await stripe.paymentMethods.list({
            customer: customerId,
            type: "card",
            limit: 1,
          })
        ).data[0] ?? null;

    const card = stripePaymentMethod?.card ?? null;
    const paymentMethod: BillingPaymentMethod | null =
      stripePaymentMethod && card
        ? {
            brand: card.brand ?? null,
            last4: card.last4 ?? null,
            exp_month: card.exp_month ?? null,
            exp_year: card.exp_year ?? null,
            cardholder_name: stripePaymentMethod.billing_details?.name ?? customer.name ?? null,
            funding: card.funding ?? null,
            country: card.country ?? null,
          }
        : null;

    const taxIds = await stripe.customers.listTaxIds(customerId, { limit: 10 });
    const billingInformation: BillingInformation = {
      business_name: customer.business_name ?? null,
      name: customer.name ?? null,
      email: customer.email ?? user.email ?? null,
      currency: customer.currency?.toUpperCase() ?? null,
      tax_exempt: customer.tax_exempt ?? null,
      tax_display: null,
      tax_ids: taxIds.data
        .map((taxId) => taxId.value)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
      address: customer.address
        ? {
            line1: customer.address.line1 ?? null,
            line2: customer.address.line2 ?? null,
            postal_code: customer.address.postal_code ?? null,
            city: customer.address.city ?? null,
            state: customer.address.state ?? null,
            country: customer.address.country ?? null,
          }
        : null,
    };

    const { data: dbSubscriptions, error: dbSubscriptionsError } = await supabaseClient
      .from("subscriptions")
      .select(`
        provider_subscription_id,
        establishment:establishment_id (
          name,
          formatted_address,
          country
        )
      `)
      .eq("user_id", user.id);

    if (dbSubscriptionsError) {
      logStep("Error loading local subscriptions", {
        message: dbSubscriptionsError.message,
      });
      return new Response(JSON.stringify({
        invoices: [],
        payment_method: paymentMethod,
        billing_information: billingInformation,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const allowedSubscriptionIds = new Set(
      (dbSubscriptions || [])
        .map((row: LocalSubscriptionRow) => row.provider_subscription_id)
        .filter((id): id is string => typeof id === "string" && id.trim().length > 0),
    );

    const subscriptionNameMap = new Map<
  string,
  {
    name: string;
    address: string | null;
    country: string | null;
  }
>();
    (dbSubscriptions || []).forEach((row: LocalSubscriptionRow) => {
      if (row.provider_subscription_id) {
        subscriptionNameMap.set(
  row.provider_subscription_id,
  {
    name: row.establishment?.name ?? "Invoice",
    address: row.establishment?.formatted_address ?? null,
    country: row.establishment?.country ?? null,
  }
);
      }
    });

    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 100,
      expand: ["data.total_taxes.tax_rate_details.tax_rate"],
    });

    const filteredInvoices = invoices.data.filter((invoice: Stripe.Invoice) => {
      const subscriptionId = getInvoiceSubscriptionId(invoice);
      return !!subscriptionId && allowedSubscriptionIds.has(subscriptionId);
    });

    const filteredInvoiceMap = new Map(
      filteredInvoices.map((invoice) => [invoice.id, invoice]),
    );

    const rows: BillingInvoiceRow[] = filteredInvoices
      .map((invoice: Stripe.Invoice) => {
        const firstLine = invoice.lines.data[0];
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        const planName =
          firstLine?.description ||
          invoice.description ||
          invoice.number ||
          "Invoice";

        const establishmentInfo =
          subscriptionNameMap.get(subscriptionId ?? "");

        return {
          invoice_id: invoice.id,
          invoice_number: invoice.number ?? null,
          status: invoice.status ?? "draft",
          amount_paid: invoice.amount_paid ?? 0,
          amount_due: invoice.amount_due ?? 0,
          currency: (invoice.currency ?? "eur").toUpperCase(),
          created_at: new Date(invoice.created * 1000).toISOString(),
          period_start: firstLine?.period?.start
            ? new Date(firstLine.period.start * 1000).toISOString()
            : null,
          period_end: firstLine?.period?.end
            ? new Date(firstLine.period.end * 1000).toISOString()
            : null,
          subscription_id: subscriptionId,
          plan_name: establishmentInfo?.name ?? planName,
          establishment_address: establishmentInfo?.address ?? null,
          establishment_country: establishmentInfo?.country ?? null,
          invoice_pdf_url: invoice.invoice_pdf ?? null,
          hosted_invoice_url: invoice.hosted_invoice_url ?? null,
        };
      })
      .sort(
        (a: BillingInvoiceRow, b: BillingInvoiceRow) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

    billingInformation.tax_display = getInvoiceTaxDisplay(filteredInvoices);

    if (body.format === "pdf") {
      const invoiceId = body.invoice_ids?.find(
        (id): id is string => typeof id === "string" && id.trim().length > 0,
      );
      const row = rows.find((invoiceRow) => invoiceRow.invoice_id === invoiceId);
      const invoice = invoiceId ? filteredInvoiceMap.get(invoiceId) : null;

      if (!row || !invoice) {
        return new Response(JSON.stringify({ error: "Invoice not found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      const pdfBytes = await generateCustomInvoicePdf({
        invoice,
        row,
        customer,
        billingInformation,
        language: normalizeInvoiceLanguage(body.language),
      });
      const invoiceDate = row.created_at.slice(0, 10);
      const invoiceName = sanitizeFileName(row.invoice_number || row.invoice_id);
      const establishmentName = sanitizeFileName(row.plan_name || "subscription");

      return new Response(pdfBytes, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${invoiceDate}-${invoiceName}-${establishmentName}.pdf"`,
        },
        status: 200,
      });
    }

    if (body.format === "zip") {
      const requestedInvoiceIds = new Set(
        (body.invoice_ids || [])
          .filter((id): id is string => typeof id === "string" && id.trim().length > 0),
      );
      const invoicesForZip = rows.filter((invoice) => {
        if (requestedInvoiceIds.size > 0 && !requestedInvoiceIds.has(invoice.invoice_id)) {
          return false;
        }

        return !!(invoice.invoice_pdf_url || invoice.hosted_invoice_url);
      });

      if (invoicesForZip.length === 0) {
        return new Response(JSON.stringify({ error: "No downloadable invoices found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      const zip = new JSZip();

      console.log("Invoices for ZIP:", invoicesForZip.length);

      for (const row of invoicesForZip) {
        console.log("Generating:", row.invoice_number);

        const invoice = filteredInvoiceMap.get(row.invoice_id);

        if (!invoice) continue;

        const pdfBytes = await generateCustomInvoicePdf({
          invoice,
          row,
          customer,
          billingInformation,
          language: normalizeInvoiceLanguage(body.language),
        });

        const invoiceDate = row.created_at.slice(0, 10);
        const invoiceName = sanitizeFileName(
          row.invoice_number || row.invoice_id
        );
        const establishmentName = sanitizeFileName(
          row.plan_name || "subscription"
        );

        zip.file(
          `${invoiceDate}-${invoiceName}-${establishmentName}.pdf`,
          pdfBytes
        );
      }

      const zipBytes = await zip.generateAsync({
        type: "uint8array",
      });
      console.log("ZIP GENERATED", zipBytes.length);

      return new Response(zipBytes, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="reviewsvisor-invoices-${new Date().toISOString().slice(0, 10)}.zip"`,
        },
        status: 200,
      });
    }

    return new Response(JSON.stringify({
      invoices: rows,
      payment_method: paymentMethod,
      billing_information: billingInformation,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in billing-reports", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
