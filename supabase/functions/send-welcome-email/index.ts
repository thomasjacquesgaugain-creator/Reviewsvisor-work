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

    console.log("Tentative d'envoi d'email à:", email);
    console.log("Données utilisateur:", { email, firstName, lastName });

    const appUrl = "https://reviewsvisor.com";
    const dashboardUrl = `${appUrl}/tableau-de-bord`;

    console.log("Appel API Resend pour envoyer l'email de bienvenue");
    const emailResponse = await resend.emails.send({
      from: "Reviewsvisor <contact@reviewsvisor.com>",
      to: [email],
      subject: "Bienvenue sur Reviewsvisor – Confirmation de votre compte",
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2F6BFF; font-size: 24px; margin: 0 0 8px 0;">
                Votre compte Reviewsvisor a bien été créé 🎉
              </h1>
            </div>
            
            <div style="margin-bottom: 24px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0;">
                Bonjour ${firstName} ${lastName},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0;">
                Merci de votre inscription. Votre compte est maintenant prêt, vous pouvez accéder à votre tableau de bord et commencer à analyser vos avis clients.
              </p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${dashboardUrl}" 
                 style="background: #2F6BFF; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                Accéder à mon tableau de bord
              </a>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                Si vous avez des questions, n'hésitez pas à nous contacter.
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
      `,
    });

    console.log("Réponse Resend:", emailResponse);
    console.log("Email de bienvenue envoyé avec succès à:", email);

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
