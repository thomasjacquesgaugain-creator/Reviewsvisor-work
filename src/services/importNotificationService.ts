import { supabase } from "@/integrations/supabase/client";
import i18n from "@/i18n/config";

export type ReviewImportSource = "paste" | "csv_upload" | "json_upload" | "google" | "outscraper";

export interface ReviewImportNotificationInput {
  establishmentName: string;
  source: ReviewImportSource;
  inserted: number;
  updated?: number;
  skipped?: number;
  total?: number;
}

type ImportLanguage = "fr" | "en";

interface ImportStrings {
  title: string;
  greeting: string;
  body: string;
  imported: string;
  updated: string;
  skipped: string;
  account: string;
  dashboardCta: string;
  sourceLabels: Record<ReviewImportSource, string>;
}

function getImportLanguage(): ImportLanguage {
  return String(i18n.language || "fr").toLowerCase().startsWith("fr") ? "fr" : "en";
}

function getImportStrings(language: ImportLanguage): ImportStrings {
  if (language === "fr") {
    return {
      title: "Avis importés avec succès",
      greeting: "Bonjour",
      body: "Votre import d'avis a bien été terminé depuis",
      imported: "Importés",
      updated: "Mis à jour",
      skipped: "Ignorés",
      account: "Compte",
      dashboardCta: "Ouvrir le tableau de bord",
      sourceLabels: {
        paste: "Import collé",
        csv_upload: "Import CSV",
        json_upload: "Import JSON",
        google: "Import Google",
        outscraper: "Import Outscraper",
      },
    };
  }

  return {
    title: "Reviews imported successfully",
    greeting: "Hi",
    body: "Your review import has completed successfully from",
    imported: "Imported",
    updated: "Updated",
    skipped: "Skipped",
    account: "Account",
    dashboardCta: "Open dashboard",
    sourceLabels: {
      paste: "Paste import",
      csv_upload: "CSV upload",
      json_upload: "JSON upload",
      google: "Google import",
      outscraper: "Outscraper import",
    },
  };
}

function buildImportEmailHtml(
  input: ReviewImportNotificationInput,
  userEmail: string,
  displayName: string,
  strings: ImportStrings
): string {
  const totalImported = input.total ?? input.inserted + (input.updated ?? 0);
  const updated = input.updated ?? 0;
  const skipped = input.skipped ?? 0;
  const sourceLabel = strings.sourceLabels[input.source];

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; background:#f8fafc; padding:24px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #2F6BFF 0%, #1E40AF 100%); color:#fff; padding:32px;">
          <h1 style="margin:0; font-size:24px; line-height:1.2;">${strings.title}</h1>
          <p style="margin:8px 0 0 0; opacity:0.9;">${input.establishmentName}</p>
        </div>
        <div style="padding:32px; color:#1f2937;">
          <p style="margin:0 0 16px 0; font-size:16px;">${strings.greeting} ${displayName},</p>
          <p style="margin:0 0 24px 0; font-size:16px; line-height:1.7;">
            ${strings.body} <strong>${sourceLabel}</strong>.
          </p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px;">
            <div style="background:#f9fafb; border-radius:12px; padding:16px;">
              <div style="font-size:12px; color:#6b7280;">${strings.imported}</div>
              <div style="font-size:28px; font-weight:700; margin-top:4px;">${totalImported}</div>
            </div>
            <div style="background:#f9fafb; border-radius:12px; padding:16px;">
              <div style="font-size:12px; color:#6b7280;">${strings.updated}</div>
              <div style="font-size:28px; font-weight:700; margin-top:4px;">${updated}</div>
            </div>
            <div style="background:#f9fafb; border-radius:12px; padding:16px;">
              <div style="font-size:12px; color:#6b7280;">${strings.skipped}</div>
              <div style="font-size:28px; font-weight:700; margin-top:4px;">${skipped}</div>
            </div>
            <div style="background:#f9fafb; border-radius:12px; padding:16px;">
              <div style="font-size:12px; color:#6b7280;">${strings.account}</div>
              <div style="font-size:16px; font-weight:600; margin-top:8px; word-break:break-word;">${userEmail}</div>
            </div>
          </div>
          <div style="text-align:center; margin-top:28px;">
            <a href="{{DASHBOARD_URL}}" style="display:inline-block; background:#2F6BFF; color:#fff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:600;">
              ${strings.dashboardCta}
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function sendReviewImportNotification(input: ReviewImportNotificationInput): Promise<boolean> {
  const totalImported = input.total ?? input.inserted + (input.updated ?? 0);
  if (totalImported <= 0) {
    return false;
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user?.email) {
    console.warn("[importNotification] Skipping email: no authenticated user email", authError);
    return false;
  }

  const language = getImportLanguage();
  const strings = getImportStrings(language);

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, new_reviews_enabled")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (profile?.new_reviews_enabled !== true) {
    console.log("[importNotification] Skipping email: new review notifications disabled");
    return false;
  }

  const firstName = (profile?.first_name || authData.user.user_metadata?.first_name || "").trim();
  const lastName = (profile?.last_name || authData.user.user_metadata?.last_name || "").trim();
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || authData.user.email;

  const html = buildImportEmailHtml(input, authData.user.email, displayName, strings);
  const subject = language === "fr"
    ? `Avis importés pour ${input.establishmentName}`
    : `Reviews imported for ${input.establishmentName}`;

  const { error } = await supabase.functions.invoke("send-email", {
    body: {
      to: authData.user.email,
      subject,
      html,
    },
  });

  if (error) {
    console.warn("[importNotification] Failed to send email", error);
    return false;
  }

  return true;
}
