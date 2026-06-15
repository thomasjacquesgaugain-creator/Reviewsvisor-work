import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("SB_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SB_SERVICE_ROLE_KEY") ||
  "";
const APP_URL = Deno.env.get("APP_URL") || "https://reviewsvisor.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MonthlyReportData {
  userId: string;
  userEmail: string;
  firstName: string;
  lastName: string;
  establishmentName: string;
  reportMonthName: string;
  previousMonthName: string;
  reportMonthKey: string;
  previousMonthKey: string;
  currentMonth: {
    avgRating: number;
    totalReviews: number;
    positiveReviews: number;
    negativeReviews: number;
    responsesSent: number;
    responseRate: number;
    topPositives: string[];
    topNegatives: string[];
  };
  previousMonth: {
    avgRating: number;
    totalReviews: number;
    positiveReviews: number;
    negativeReviews: number;
  };
  recommendations: string[];
}

interface ReportMonthWindow {
  reportMonthStart: Date;
  reportMonthEnd: Date;
  comparisonMonthStart: Date;
  comparisonMonthEnd: Date;
  reportMonthName: string;
  previousMonthName: string;
  reportMonthKey: string;
  previousMonthKey: string;
}

type ReportStatus =
  | "ready"
  | "db_failed"
  | "email_failed"
  | "partial_failure";

type Establishment = {
  id: string;
  name: string;
  place_id: string;
  rating: number;
};

type ReportPersistenceResult = {
  rowId: string | null;
  error: string | null;
};

function getPerformanceBadge(ratingDiff: number): { label: string; color: string; bgColor: string } {
  if (ratingDiff >= 0.7) {
    return { label: "Incroyable", color: "#8B5CF6", bgColor: "#F3E8FF" };
  } else if (ratingDiff >= 0.5) {
    return { label: "Excellent", color: "#3B82F6", bgColor: "#DBEAFE" };
  } else if (ratingDiff >= 0.3) {
    return { label: "Très bien", color: "#10B981", bgColor: "#D1FAE5" };
  } else if (ratingDiff >= 0.1) {
    return { label: "Bon", color: "#84CC16", bgColor: "#ECFCCB" };
  } else {
    return { label: "À améliorer", color: "#F59E0B", bgColor: "#FEF3C7" };
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function formatReviewSnippet(text: string | null | undefined, fallback: string): string {
  const cleaned = (text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return fallback;

  const truncated = truncateText(cleaned, 50);
  if (!truncated || truncated === "...") return fallback;

  return truncated;
}

function resolveReportMonthWindow(reportMonth?: string): ReportMonthWindow {
  let year: number;
  let monthIndex: number;

  if (reportMonth && /^\d{4}-\d{2}$/.test(reportMonth)) {
    const [parsedYear, parsedMonth] = reportMonth.split("-").map(Number);
    year = parsedYear;
    monthIndex = parsedMonth - 1;
  } else {
    const now = new Date();
    // const now = new Date("2026-06-01");
    year = now.getFullYear();
    monthIndex = now.getMonth() - 1;
  }

  const reportMonthStart = new Date(year, monthIndex, 1);
  const reportMonthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  const comparisonMonthStart = new Date(year, monthIndex - 1, 1);
  const comparisonMonthEnd = new Date(
    year,
    monthIndex,
    0,
    23,
    59,
    59,
    999,
  );

  const reportMonthKey = `${reportMonthStart.getFullYear()}-${String(
    reportMonthStart.getMonth() + 1,
  ).padStart(2, "0")}`;
  const previousMonthKey = `${comparisonMonthStart.getFullYear()}-${String(
    comparisonMonthStart.getMonth() + 1,
  ).padStart(2, "0")}`;

  return {
    reportMonthStart,
    reportMonthEnd,
    comparisonMonthStart,
    comparisonMonthEnd,
    reportMonthName: reportMonthStart.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    }),
    previousMonthName: comparisonMonthStart.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    }),
    reportMonthKey,
    previousMonthKey,
  };
}

function generateReportHTML(data: MonthlyReportData): string {
  const ratingDiff = data.currentMonth.avgRating - data.previousMonth.avgRating;
  const ratingDiffFormatted = ratingDiff >= 0 ? `+${ratingDiff.toFixed(1)}` : ratingDiff.toFixed(1);
  const badge = getPerformanceBadge(ratingDiff);

  const dashboardUrl = `${APP_URL}/tableau-de-bord`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport mensuel Reviewsvisor - ${data.reportMonthName}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="background: linear-gradient(135deg, #2F6BFF 0%, #1E40AF 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center; color: white;">
    <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">📊 Rapport Mensuel</h1>
    <p style="margin: 0; font-size: 16px; opacity: 0.9;">${data.reportMonthName}</p>
  </div>

  <div style="background: white; border-radius: 0 0 16px 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
    <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0;">
      Bonjour ${data.firstName} ${data.lastName},
    </p>
    <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0;">
      Voici votre rapport mensuel pour <strong>${data.establishmentName}</strong>. Découvrez l'évolution de votre réputation en ligne et les actions à mettre en place.
    </p>

    <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #2F6BFF;">
      <h2 style="color: #1F2937; font-size: 20px; font-weight: 700; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px;">📈</span> Évolution de la note
      </h2>

      <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 16px;">
        <div style="flex: 1;">
          <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">Note ${data.previousMonthName}</p>
          <p style="color: #1F2937; font-size: 32px; font-weight: 700; margin: 0;">${data.previousMonth.avgRating.toFixed(1)}/5</p>
        </div>
        <div style="font-size: 24px; color: #9CA3AF;">→</div>
        <div style="flex: 1;">
          <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">Note ${data.reportMonthName}</p>
          <p style="color: #1F2937; font-size: 32px; font-weight: 700; margin: 0;">${data.currentMonth.avgRating.toFixed(1)}/5</p>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 16px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
        <div>
          <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">Évolution</p>
          <p style="color: ${badge.color}; font-size: 24px; font-weight: 700; margin: 0;">${ratingDiffFormatted}</p>
        </div>
        <div style="margin-left: auto;">
          <span style="background: ${badge.bgColor}; color: ${badge.color}; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">
            ${badge.label}
          </span>
        </div>
      </div>
    </div>

    <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #10B981;">
      <h2 style="color: #1F2937; font-size: 20px; font-weight: 700; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px;">✅</span> Actions réalisées ce mois
      </h2>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div style="background: white; padding: 16px; border-radius: 8px;">
          <p style="color: #6B7280; font-size: 12px; margin: 0 0 4px 0;">Avis reçus</p>
          <p style="color: #1F2937; font-size: 24px; font-weight: 700; margin: 0;">${data.currentMonth.totalReviews}</p>
        </div>
        <div style="background: white; padding: 16px; border-radius: 8px;">
          <p style="color: #6B7280; font-size: 12px; margin: 0 0 4px 0;">Réponses envoyées</p>
          <p style="color: #1F2937; font-size: 24px; font-weight: 700; margin: 0;">${data.currentMonth.responsesSent}</p>
        </div>
        <div style="background: white; padding: 16px; border-radius: 8px;">
          <p style="color: #6B7280; font-size: 12px; margin: 0 0 4px 0;">Avis positifs</p>
          <p style="color: #10B981; font-size: 24px; font-weight: 700; margin: 0;">${data.currentMonth.positiveReviews}</p>
        </div>
        <div style="background: white; padding: 16px; border-radius: 8px;">
          <p style="color: #6B7280; font-size: 12px; margin: 0 0 4px 0;">Taux de réponse</p>
          <p style="color: #1F2937; font-size: 24px; font-weight: 700; margin: 0;">${data.currentMonth.responseRate}%</p>
        </div>
      </div>

      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 14px; margin: 0;">
          <strong style="color: #1F2937;">${data.currentMonth.positiveReviews}</strong> avis positifs (4-5 étoiles)
          vs <strong style="color: #EF4444;">${data.currentMonth.negativeReviews}</strong> avis négatifs (1-2 étoiles)
        </p>
      </div>
    </div>

    <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #F59E0B;">
      <h2 style="color: #1F2937; font-size: 20px; font-weight: 700; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px;">💬</span> Résumé des avis
      </h2>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <h3 style="color: #10B981; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">👍 Points positifs</h3>
          <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
            ${data.currentMonth.topPositives.length > 0
              ? data.currentMonth.topPositives.map((p) => `<li>${p}</li>`).join("")
              : '<li style="color: #9CA3AF;">Aucun point positif identifié ce mois</li>'}
          </ul>
        </div>

        <div>
          <h3 style="color: #EF4444; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">👎 Points à améliorer</h3>
          <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
            ${data.currentMonth.topNegatives.length > 0
              ? data.currentMonth.topNegatives.map((n) => `<li>${n}</li>`).join("")
              : '<li style="color: #9CA3AF;">Aucun point négatif identifié ce mois</li>'}
          </ul>
        </div>
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #F59E0B;">
      <h2 style="color: #1F2937; font-size: 20px; font-weight: 700; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px;">💡</span> Recommandations pour le mois prochain
      </h2>

      <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.8;">
        ${data.recommendations.length > 0
          ? data.recommendations.map((r) => `<li style="margin-bottom: 8px;">${r}</li>`).join("")
          : '<li style="color: #9CA3AF;">Continuez vos efforts !</li>'}
      </ul>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}"
         style="background: #2F6BFF; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
        Voir mon tableau de bord
      </a>
    </div>

    <div style="border-top: 1px solid #E5E7EB; padding-top: 24px; margin-top: 32px;">
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
        Ce rapport est généré automatiquement chaque mois. Vous pouvez modifier vos préférences dans les paramètres de votre compte.
      </p>
      <p style="color: #6b7280; font-size: 14px; margin: 12px 0 0 0;">
        À bientôt,<br>
        <strong style="color: #374151;">L'équipe Reviewsvisor</strong>
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      © ${new Date().getFullYear()} Reviewsvisor. Tous droits réservés.
    </p>
  </div>
</body>
</html>
  `;
}

async function upsertMonthlyReportRecord({
  userId,
  establishment,
  monthWindow,
  reportData,
  supabaseAdmin,
}: {
  userId: string;
  establishment: Establishment;
  monthWindow: ReportMonthWindow;
  reportData: MonthlyReportData;
  supabaseAdmin: ReturnType<typeof createClient>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("monthly_reports")
    .upsert({
      user_id: userId,
      establishment_id: establishment.id,
      place_id: establishment.place_id,
      report_month: `${monthWindow.reportMonthKey}-01`,
      report_month_key: monthWindow.reportMonthKey,
      report_month_label: monthWindow.reportMonthName,
      period_start: monthWindow.reportMonthStart.toISOString(),
      period_end: monthWindow.reportMonthEnd.toISOString(),
      report_data: reportData,
      status: "ready",
      generated_at: new Date().toISOString(),
      error_message: null,
    }, {
      onConflict: "establishment_id,report_month_key",
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(
      `monthly_reports upsert failed: ${error?.message || "missing row id"}`,
    );
  }

  return data.id;
}

async function updateMonthlyReportStatus({
  reportId,
  status,
  errorMessage,
  supabaseAdmin,
  emailSentAt,
}: {
  reportId: string;
  status: ReportStatus;
  errorMessage?: string | null;
  supabaseAdmin: ReturnType<typeof createClient>;
  emailSentAt?: string | null;
}) {
  const updatePayload: Record<string, string | null> = {
    status,
    error_message: errorMessage || null,
  };

  if (emailSentAt !== undefined) {
    updatePayload.email_sent_at = emailSentAt;
  }

  const { error } = await supabaseAdmin
    .from("monthly_reports")
    .update(updatePayload)
    .eq("id", reportId);

  if (error) {
    console.error(`Failed to update monthly report ${reportId}:`, error);
  }
}

async function markExistingMonthlyReportFailure({
  establishmentId,
  reportMonthKey,
  status,
  errorMessage,
  supabaseAdmin,
}: {
  establishmentId: string;
  reportMonthKey: string;
  status: ReportStatus;
  errorMessage: string;
  supabaseAdmin: ReturnType<typeof createClient>;
}) {
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("monthly_reports")
    .select("id")
    .eq("establishment_id", establishmentId)
    .eq("report_month_key", reportMonthKey)
    .maybeSingle();

  if (lookupError || !existing?.id) {
    if (lookupError) {
      console.error(
        `Failed to lookup monthly report ${establishmentId}/${reportMonthKey}:`,
        lookupError,
      );
    }
    return;
  }

  await updateMonthlyReportStatus({
    reportId: existing.id,
    status,
    errorMessage,
    supabaseAdmin,
  });
}

async function persistMonthlyReport({
  userId,
  establishment,
  monthWindow,
  reportData,
  supabaseAdmin,
}: {
  userId: string;
  establishment: Establishment;
  monthWindow: ReportMonthWindow;
  reportData: MonthlyReportData;
  supabaseAdmin: ReturnType<typeof createClient>;
}): Promise<ReportPersistenceResult> {
  try {
    const rowId = await upsertMonthlyReportRecord({
      userId,
      establishment,
      monthWindow,
      reportData,
      supabaseAdmin,
    });

    return {
      rowId,
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Monthly report DB persistence failed:", {
      establishmentId: establishment.id,
      reportMonthKey: monthWindow.reportMonthKey,
      message,
    });

    await markExistingMonthlyReportFailure({
      establishmentId: establishment.id,
      reportMonthKey: monthWindow.reportMonthKey,
      status: "db_failed",
      errorMessage: message,
      supabaseAdmin,
    });

    return {
      rowId: null,
      error: message,
    };
  }
}

async function sendMonthlyReportEmail({
  userEmail,
  establishmentName,
  reportMonthName,
  htmlContent,
}: {
  userEmail: string;
  establishmentName: string;
  reportMonthName: string;
  htmlContent: string;
}) {
  const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      to: [userEmail],
      subject: `📊 Rapport mensuel – ${establishmentName} – ${reportMonthName}`,
      html: htmlContent,
    }),
  });

  if (!emailResponse.ok) {
    const errorText = await emailResponse.text().catch(() => "");
    throw new Error(`send-email failed: ${emailResponse.status} ${errorText}`);
  }

  return emailResponse.json().catch(() => ({}));
}

async function generateAndSendReport(
  userId: string,
  supabaseAdmin: ReturnType<typeof createClient>,
  reportMonth?: string,
): Promise<Array<Record<string, string | null>>> {
  try {
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      console.error(`Error fetching user ${userId}:`, userError);
      return [{ userId, establishmentId: null, status: "error", error: "user_not_found" }];
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error(`Error fetching profile for user ${userId}:`, profileError);
      return [{ userId, establishmentId: null, status: "error", error: "profile_not_found" }];
    }

    const userEmail = userData.user.email;
    if (!userEmail) {
      console.error(`No email found for user ${userId}`);
      return [{ userId, establishmentId: null, status: "error", error: "email_missing" }];
    }

    const { data: establishments, error: estabError } = await supabaseAdmin
      .from('establishments')
      .select(`
        id,
        name,
        place_id,
        rating,
        subscriptions!inner (
          status
        )
      `)
      .eq('user_id', userId)
      .eq('subscriptions.status', 'active');

    if (estabError || !establishments || establishments.length === 0) {
      console.error(`Error fetching establishments for user ${userId}:`, estabError);
      return [{
        userId,
        establishmentId: null,
        status: "error",
        error: "establishments_not_found",
      }];
    }
    const results: Array<Record<string, string | null>> = [];

    for (const establishment of establishments as Establishment[]) {
      try {
        const result = await generateAndSendReportForEstablishment({
          userId,
          userEmail,
          profile,
          establishment,
          supabaseAdmin,
          reportMonth,
        });

        results.push(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error processing establishment ${establishment.id} for user ${userId}:`, err);
        results.push({
          userId,
          establishmentId: establishment.id,
          reportMonth: reportMonth || null,
          status: "error",
          error: message,
        });
      }
    }
    return results;
  } catch (error) {
    console.error(`Error in generateAndSendReport for user ${userId}:`, error);
    throw error;
  }
}

async function generateAndSendReportForEstablishment({
  userId,
  userEmail,
  profile,
  establishment,
  supabaseAdmin,
  reportMonth,
}: {
  userId: string;
  userEmail: string;
  profile: { first_name: string; last_name: string };
  establishment: Establishment;
  supabaseAdmin: ReturnType<typeof createClient>;
  reportMonth?: string;
}): Promise<Record<string, string | null>> {
  const monthWindow = resolveReportMonthWindow(reportMonth);

  const { data: reportMonthReviews, error: reportError } = await supabaseAdmin
    .from('reviews')
    .select('rating, text, owner_reply_text, published_at')
    .eq('user_id', userId)
    .eq('place_id', establishment.place_id)
    .gte('published_at', monthWindow.reportMonthStart.toISOString())
    .lte('published_at', monthWindow.reportMonthEnd.toISOString());

  if (reportError) {
    throw new Error(`Error fetching report month reviews for establishment ${establishment.id}: ${reportError.message}`);
  }

  const { data: comparisonMonthReviews, error: comparisonError } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('user_id', userId)
    .eq('place_id', establishment.place_id)
    .gte('published_at', monthWindow.comparisonMonthStart.toISOString())
    .lte('published_at', monthWindow.comparisonMonthEnd.toISOString());

  if (comparisonError) {
    throw new Error(`Error fetching comparison month reviews for establishment ${establishment.id}: ${comparisonError.message}`);
  }

  const reportReviews = reportMonthReviews || [];
  const reportRatings = reportReviews.filter((r) => r.rating).map((r) => r.rating!);
  const reportAvgRating = reportRatings.length > 0
    ? reportRatings.reduce((sum, r) => sum + r, 0) / reportRatings.length
    : establishment.rating || 0;
  const reportPositive = reportRatings.filter((r) => r >= 4).length;
  const reportNegative = reportRatings.filter((r) => r <= 2).length;
  const reportResponses = reportReviews.filter((r) => r.owner_reply_text).length;
  const reportResponseRate = reportReviews.length > 0
    ? Math.round((reportResponses / reportReviews.length) * 100)
    : 0;

  const comparisonReviews = comparisonMonthReviews || [];
  const comparisonRatings = comparisonReviews.filter((r) => r.rating).map((r) => r.rating!);
  const comparisonAvgRating = comparisonRatings.length > 0
    ? comparisonRatings.reduce((sum, r) => sum + r, 0) / comparisonRatings.length
    : establishment.rating || 0;
  const comparisonPositive = comparisonRatings.filter((r) => r >= 4).length;
  const comparisonNegative = comparisonRatings.filter((r) => r <= 2).length;

  const topPositives = reportReviews
    .filter((r) => r.rating && r.rating >= 4)
    .slice(0, 3)
    .map((r) => formatReviewSnippet(r.text, 'Point positif'))
    .filter((v, i, a) => a.indexOf(v) === i);

  const topNegatives = reportReviews
    .filter((r) => r.rating && r.rating <= 2)
    .slice(0, 3)
    .map((r) => formatReviewSnippet(r.text, 'Point à améliorer'))
    .filter((v, i, a) => a.indexOf(v) === i);

  const recommendations: string[] = [];
  if (reportResponseRate < 50) {
    recommendations.push(`Répondez à plus d'avis clients (taux actuel: ${reportResponseRate}%)`);
  }
  if (reportNegative > 0) {
    recommendations.push(`Concentrez-vous sur la résolution des ${reportNegative} avis négatifs reçus ce mois`);
  }
  if (reportAvgRating < 4.0) {
    recommendations.push(`Travaillez à améliorer votre note moyenne (actuellement ${reportAvgRating.toFixed(1)}/5)`);
  }
  if (recommendations.length === 0) {
    recommendations.push('Continuez vos efforts pour maintenir votre excellente réputation !');
  }

  const reportData: MonthlyReportData = {
    userId,
    userEmail,
    firstName: profile.first_name || '',
    lastName: profile.last_name || '',
    establishmentName: establishment.name,
    reportMonthName: monthWindow.reportMonthName,
    previousMonthName: monthWindow.previousMonthName,
    reportMonthKey: monthWindow.reportMonthKey,
    previousMonthKey: monthWindow.previousMonthKey,
    currentMonth: {
      avgRating: reportAvgRating,
      totalReviews: reportReviews.length,
      positiveReviews: reportPositive,
      negativeReviews: reportNegative,
      responsesSent: reportResponses,
      responseRate: reportResponseRate,
      topPositives: topPositives.length > 0 ? topPositives : [],
      topNegatives: topNegatives.length > 0 ? topNegatives : [],
    },
    previousMonth: {
      avgRating: comparisonAvgRating,
      totalReviews: comparisonReviews.length,
      positiveReviews: comparisonPositive,
      negativeReviews: comparisonNegative,
    },
    recommendations,
  };

  const htmlContent = generateReportHTML(reportData);
  const persistenceResult = await persistMonthlyReport({
    userId,
    establishment,
    monthWindow,
    reportData,
    supabaseAdmin,
  });

  console.log(`Sending monthly report to ${userEmail} for establishment: ${establishment.name}`);

  try {
    const emailResponse = await sendMonthlyReportEmail({
      userEmail,
      establishmentName: establishment.name,
      reportMonthName: monthWindow.reportMonthName,
      htmlContent,
    });

    const status: ReportStatus = persistenceResult.error
      ? "partial_failure"
      : "ready";
    if (persistenceResult.rowId) {
      await updateMonthlyReportStatus({
        reportId: persistenceResult.rowId,
        status,
        errorMessage: persistenceResult.error,
        emailSentAt: new Date().toISOString(),
        supabaseAdmin,
      });
    }

    console.log(`Report sent for ${establishment.name}:`, emailResponse);

    return {
      userId,
      establishmentId: establishment.id,
      reportMonth: monthWindow.reportMonthKey,
      status,
      error: persistenceResult.error,
    };
  } catch (emailError) {
    const message = emailError instanceof Error
      ? emailError.message
      : String(emailError);

    if (persistenceResult.rowId) {
      await updateMonthlyReportStatus({
        reportId: persistenceResult.rowId,
        status: persistenceResult.error ? "partial_failure" : "email_failed",
        errorMessage: persistenceResult.error
          ? `${persistenceResult.error}; ${message}`
          : message,
        supabaseAdmin,
        emailSentAt: null,
      });
    }

    throw new Error(message);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { userId, reportMonth } = await req.json().catch(() => ({}));

    if (userId) {
      const results = await generateAndSendReport(userId, supabaseAdmin, reportMonth);
      return new Response(
        JSON.stringify({success: true, message: `Report processed for user ${userId}`, results }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
      const { data: usersList, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

      if (usersError) {
        throw new Error(`Error fetching users: ${usersError.message}`);
      }

      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('user_id, monthly_report_enabled')
        .eq('monthly_report_enabled', true);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }

      const enabledUsers = new Set(
        (profiles || [])
          .filter((p) => p.monthly_report_enabled === true)
          .map((p) => p.user_id),
      );

      const results: Array<Record<string, string | null>> = [];
      for (const user of usersList?.users || []) {
        if (!user.email) continue;
        if (!enabledUsers.has(user.id)) continue;

      try {
        const userResults = await generateAndSendReport(
          user.id,
          supabaseAdmin,
          reportMonth,
        );
        results.push(...userResults);
      } catch (error: unknown) {
        results.push({userId: user.id, establishmentId: null, reportMonth: reportMonth || null, status: "error", error: error instanceof Error ? error.message : String(error)});
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reports processed for ${results.length} establishment runs`,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error in send-monthly-report function:", error);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
};

serve(handler);
