import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetLink }: PasswordResetRequest = await req.json();

    console.log("Sending password reset email to:", email);

    const emailResponse = await resend.emails.send({
      from: "L'équipe ReviewsVisor <onboarding@resend.dev>",
      to: [email],
      subject: "Réinitialisation de votre mot de passe ReviewsVisor",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 10px;
                padding: 40px;
                text-align: center;
              }
              .content {
                background: white;
                border-radius: 8px;
                padding: 30px;
                margin-top: 20px;
              }
              h1 {
                color: white;
                margin: 0 0 10px 0;
                font-size: 28px;
              }
              .subtitle {
                color: rgba(255, 255, 255, 0.9);
                margin: 0;
                font-size: 16px;
              }
              p {
                margin: 15px 0;
                color: #555;
              }
              .button {
                display: inline-block;
                padding: 14px 32px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 20px 0;
                transition: transform 0.2s;
              }
              .button:hover {
                transform: translateY(-2px);
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #888;
                font-size: 14px;
              }
              .lock-icon {
                font-size: 48px;
                margin-bottom: 10px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🔒 ReviewsVisor</h1>
              <p class="subtitle">Réinitialisation de mot de passe</p>
              
              <div class="content">
                <div class="lock-icon">🔑</div>
                <h2 style="color: #333; margin-top: 0;">Réinitialisez votre mot de passe</h2>
                
                <p>Bonjour,</p>
                
                <p>Vous avez demandé à réinitialiser votre mot de passe ReviewsVisor.</p>
                
                <p>Cliquez sur le bouton ci-dessous pour en choisir un nouveau :</p>
                
                <a href="${resetLink}" class="button">
                  Réinitialiser mon mot de passe
                </a>
                
                <p style="font-size: 14px; color: #888;">
                  Ce lien est valable pendant 1 heure.
                </p>
                
                <div class="footer">
                  <p>
                    <strong>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</strong>
                  </p>
                  <p>
                    Besoin d'aide ? Répondez à cet email ou contactez-nous.
                  </p>
                  <p style="margin-top: 20px;">
                    L'équipe ReviewsVisor 💙
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
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
