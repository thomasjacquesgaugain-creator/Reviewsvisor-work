import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  firstName: string;
  lastName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to: ${email}`);

    const emailResponse = await resend.emails.send({
      from: "Staffly <onboarding@resend.dev>",
      to: [email],
      subject: "Bienvenue sur Staffly ! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 28px; margin: 0;">Bienvenue sur Staffly !</h1>
          </div>
          
          <div style="background: linear-gradient(135deg, #f8fafc, #e2e8f0); padding: 30px; border-radius: 12px; margin-bottom: 20px;">
            <h2 style="color: #1e293b; margin-top: 0;">Salut ${firstName} ${lastName} ! 👋</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              Merci d'avoir rejoint Staffly, la plateforme qui révolutionne la gestion d'équipe dans la restauration.
            </p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              Votre compte a été créé avec succès ! Vous pouvez maintenant :
            </p>
            <ul style="color: #475569; font-size: 16px; line-height: 1.6;">
              <li>Gérer vos plannings d'équipe</li>
              <li>Suivre les performances de votre restaurant</li>
              <li>Analyser vos avis clients</li>
              <li>Optimiser vos opérations</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app') || 'https://your-app.lovable.app'}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Commencer maintenant
            </a>
          </div>
          
          <div style="text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            <p>L'équipe Staffly</p>
          </div>
        </div>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Email envoyé avec succès" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);