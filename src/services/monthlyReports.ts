import { supabase } from "@/integrations/supabase/client";

export type MonthlyReportRow = {
  id: string;
  establishment_id: string;
  report_month: string;
  report_month_key: string;
  report_month_label: string;
  period_start: string;
  period_end: string;
  status: string;
  error_message: string | null;
  establishment: {
    id: string;
    name: string;
  } | null;
};

export async function getMonthlyReportsByEstablishment(
  establishmentId: string,
): Promise<MonthlyReportRow[]> {
  const { data, error } = await supabase
    .from("monthly_reports")
    .select(`
      id,
      establishment_id,
      report_month,
      report_month_key,
      report_month_label,
      period_start,
      period_end,
      status,
      error_message,
      establishment:establishment_id (
        id,
        name
      )
    `)
    .eq("establishment_id", establishmentId)
    .order("report_month", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as MonthlyReportRow[];
}

function getFileNameFromContentDisposition(header: string | null): string | null {
  if (!header) {
    return null;
  }

  const match = header.match(/filename="([^"]+)"/i);
  return match?.[1] || null;
}

export async function downloadMonthlyReportPdf({
  reportId,
  language,
}: {
  reportId: string;
  language: string;
}): Promise<{ blob: Blob; fileName: string | null }> {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError || !sessionData.session?.access_token) {
    throw new Error(sessionError?.message || "Authentication required");
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("VITE_SUPABASE_URL is not configured");
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/download-monthly-report`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sessionData.session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reportId, language }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.error || `Download failed with status ${response.status}`,
    );
  }

  return {
    blob: await response.blob(),
    fileName: getFileNameFromContentDisposition(
      response.headers.get("Content-Disposition"),
    ),
  };
}