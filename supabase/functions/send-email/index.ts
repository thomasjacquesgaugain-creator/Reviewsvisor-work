import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SEND-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      throw new Error("Missing required fields: to, subject, html");
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const appUrl = Deno.env.get("APP_URL") || "https://reviewsvisor.com";
    const dashboardUrl = `${appUrl}/tableau-de-bord`;
    const finalHtml = typeof html === "string"
      ? html
          .replaceAll("{{APP_URL}}", appUrl)
          .replaceAll("{{DASHBOARD_URL}}", dashboardUrl)
      : html;
    const resend = new Resend(resendApiKey);

    logStep("Sending email", { to, subject });

    const { data, error } = await resend.emails.send({
      from: "Reviewsvisor <contact@reviewsvisor.fr>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html: finalHtml,
    });

    if (error) {
      logStep("Resend API error", error);
      throw new Error(error.message || "Failed to send email");
    }

    logStep("Email sent successfully", { id: data?.id });

    return new Response(
      JSON.stringify({ success: true, id: data?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error", { error: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
