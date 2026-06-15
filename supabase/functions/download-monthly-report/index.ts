import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  generateMonthlyReportPdf,
  type MonthlyReportLanguage,
} from "../../../src/utils/monthlyReportPdf.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "Content-Disposition",
};

type MonthlyReportData = Parameters<typeof generateMonthlyReportPdf>[0];

function normalizeLanguage(value: unknown): MonthlyReportLanguage {
  return value === "en" ? "en" : "fr";
}

function sanitizeFileSegment(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return normalized || "monthly-report";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      throw new Error("Missing authorization token");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      throw new Error("Invalid authorization token");
    }

    const { reportId, language } = await req.json().catch(() => ({}));

    if (!reportId || typeof reportId !== "string") {
      throw new Error("Missing required field: reportId");
    }

    const selectedLanguage = normalizeLanguage(language);

    const { data: report, error: reportError } = await supabaseAdmin
      .from("monthly_reports")
      .select("id, user_id, report_month_key, report_data")
      .eq("id", reportId)
      .eq("user_id", userData.user.id)
      .single();

    if (reportError || !report) {
      throw new Error(reportError?.message || "Report not found");
    }

    const reportData = report.report_data as MonthlyReportData;
    const pdfBytes = await generateMonthlyReportPdf(reportData, selectedLanguage);
    const establishmentName = sanitizeFileSegment(
      reportData.establishmentName || "monthly-report",
    );
    const fileName =
      `${establishmentName}-${report.report_month_key}-${selectedLanguage}.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("download-monthly-report failed:", message);

    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});