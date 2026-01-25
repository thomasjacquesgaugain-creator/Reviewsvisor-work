import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

// Fonction pour obtenir le badge de performance basé sur l'évolution
function getPerformanceBadge(ratingDiff: number): { label: string; color: string; bgColor: string } {
  if (ratingDiff >= 0.7) {
    return { label: "Incroyable", color: "#8B5CF6", bgColor: "#F3E8FF" }; // Violet
  } else if (ratingDiff >= 0.5) {
    return { label: "Excellent", color: "#3B82F6", bgColor: "#DBEAFE" }; // Bleu
  } else if (ratingDiff >= 0.3) {
    return { label: "Très bien", color: "#10B981", bgColor: "#D1FAE5" }; // Vert
  } else if (ratingDiff >= 0.1) {
    return { label: "Bon", color: "#84CC16", bgColor: "#ECFCCB" }; // Vert clair
  } else {
    return { label: "À améliorer", color: "#F59E0B", bgColor: "#FEF3C7" }; // Orange
  }
}

// Fonction pour générer le template HTML du rapport
function generateReportHTML(data: MonthlyReportData): string {
  const ratingDiff = data.currentMonth.avgRating - data.previousMonth.avgRating;
  const ratingDiffFormatted = ratingDiff >= 0 ? `+${ratingDiff.toFixed(1)}` : ratingDiff.toFixed(1);
  const badge = getPerformanceBadge(ratingDiff);
  
  const appUrl = "https://reviewsvisor.com";
  const dashboardUrl = `${appUrl}/tableau-de-bord`;
  
  const currentMonthName = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const previousMonthName = new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport mensuel Reviewsvisor - ${currentMonthName}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #2F6BFF 0%, #1E40AF 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center; color: white;">
    <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">📊 Rapport Mensuel</h1>
    <p style="margin: 0; font-size: 16px; opacity: 0.9;">${currentMonthName}</p>
  </div>

  <!-- Main Content -->
  <div style="background: white; border-radius: 0 0 16px 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
    
    <!-- Greeting -->
    <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0;">
      Bonjour ${data.firstName} ${data.lastName},
    </p>
    <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0;">
      Voici votre rapport mensuel pour <strong>${data.establishmentName}</strong>. Découvrez l'évolution de votre réputation en ligne et les actions à mettre en place.
    </p>

    <!-- 1. ÉVOLUTION DE LA NOTE -->
    <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #2F6BFF;">
      <h2 style="color: #1F2937; font-size: 20px; font-weight: 700; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px;">📈</span> Évolution de la note
      </h2>
      
      <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 16px;">
        <div style="flex: 1;">
          <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">Note ${previousMonthName}</p>
          <p style="color: #1F2937; font-size: 32px; font-weight: 700; margin: 0;">${data.previousMonth.avgRating.toFixed(1)}/5</p>
        </div>
        <div style="font-size: 24px; color: #9CA3AF;">→</div>
        <div style="flex: 1;">
          <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">Note ${currentMonthName}</p>
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

    <!-- 2. ACTIONS RÉALISÉES CE MOIS -->
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

    <!-- 3. RÉSUMÉ DES AVIS -->
    <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #F59E0B;">
      <h2 style="color: #1F2937; font-size: 20px; font-weight: 700; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px;">💬</span> Résumé des avis
      </h2>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Points positifs -->
        <div>
          <h3 style="color: #10B981; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">👍 Points positifs</h3>
          <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
            ${data.currentMonth.topPositives.length > 0 
              ? data.currentMonth.topPositives.map(p => `<li>${p}</li>`).join('')
              : '<li style="color: #9CA3AF;">Aucun point positif identifié ce mois</li>'
            }
          </ul>
        </div>
        
        <!-- Points négatifs -->
        <div>
          <h3 style="color: #EF4444; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">👎 Points à améliorer</h3>
          <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
            ${data.currentMonth.topNegatives.length > 0 
              ? data.currentMonth.topNegatives.map(n => `<li>${n}</li>`).join('')
              : '<li style="color: #9CA3AF;">Aucun point négatif identifié ce mois</li>'
            }
          </ul>
        </div>
      </div>
    </div>

    <!-- 4. RECOMMANDATIONS -->
    <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #F59E0B;">
      <h2 style="color: #1F2937; font-size: 20px; font-weight: 700; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px;">💡</span> Recommandations pour le mois prochain
      </h2>
      
      <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.8;">
        ${data.recommendations.length > 0 
          ? data.recommendations.map(r => `<li style="margin-bottom: 8px;">${r}</li>`).join('')
          : '<li style="color: #9CA3AF;">Continuez vos efforts !</li>'
        }
      </ul>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" 
         style="background: #2F6BFF; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
        Voir mon tableau de bord
      </a>
    </div>

    <!-- Footer -->
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
  
  <!-- Bottom Footer -->
  <div style="text-align: center; margin-top: 20px;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      © ${new Date().getFullYear()} Reviewsvisor. Tous droits réservés.
    </p>
  </div>
</body>
</html>
  `;
}

// Fonction principale pour générer et envoyer le rapport
async function generateAndSendReport(userId: string, supabaseAdmin: any): Promise<void> {
  try {
    // Récupérer les informations utilisateur depuis auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      console.error(`Error fetching user ${userId}:`, userError);
      return;
    }

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error(`Error fetching profile for user ${userId}:`, profileError);
      return;
    }

    const userEmail = userData.user.email;
    if (!userEmail) {
      console.error(`No email found for user ${userId}`);
      return;
    }

    // MODIFIÉ: Récupérer l'établissement actif depuis la table 'établissements' (avec accent)
    const { data: establishment, error: estabError } = await supabaseAdmin
      .from('établissements')
      .select('id, nom, place_id, rating')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (estabError || !establishment) {
      console.error(`Error fetching establishment for user ${userId}:`, estabError);
      return;
    }

    // Calculer les dates du mois actuel et précédent
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Récupérer les avis du mois actuel
    const { data: currentMonthReviews, error: currentError } = await supabaseAdmin
      .from('reviews')
      .select('rating, text, owner_reply_text, published_at')
      .eq('user_id', userId)
      .eq('place_id', establishment.place_id)
      .gte('published_at', currentMonthStart.toISOString())
      .lte('published_at', now.toISOString());

    if (currentError) {
      console.error(`Error fetching current month reviews:`, currentError);
      return;
    }

    // Récupérer les avis du mois précédent
    const { data: previousMonthReviews, error: previousError } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('user_id', userId)
      .eq('place_id', establishment.place_id)
      .gte('published_at', previousMonthStart.toISOString())
      .lte('published_at', previousMonthEnd.toISOString());

    if (previousError) {
      console.error(`Error fetching previous month reviews:`, previousError);
      return;
    }

    // Calculer les statistiques du mois actuel
    const currentReviews = currentMonthReviews || [];
    const currentRatings = currentReviews.filter(r => r.rating).map(r => r.rating!);
    const currentAvgRating = currentRatings.length > 0
      ? currentRatings.reduce((sum, r) => sum + r, 0) / currentRatings.length
      : establishment.rating || 0; // Utiliser la note de l'établissement si pas d'avis ce mois
    const currentPositive = currentRatings.filter(r => r >= 4).length;
    const currentNegative = currentRatings.filter(r => r <= 2).length;
    const currentResponses = currentReviews.filter(r => r.owner_reply_text).length;
    const currentResponseRate = currentReviews.length > 0
      ? Math.round((currentResponses / currentReviews.length) * 100)
      : 0;

    // Calculer les statistiques du mois précédent
    const previousReviews = previousMonthReviews || [];
    const previousRatings = previousReviews.filter(r => r.rating).map(r => r.rating!);
    const previousAvgRating = previousRatings.length > 0
      ? previousRatings.reduce((sum, r) => sum + r, 0) / previousRatings.length
      : establishment.rating || 0; // Utiliser la note de l'établissement si pas d'avis le mois précédent
    const previousPositive = previousRatings.filter(r => r >= 4).length;
    const previousNegative = previousRatings.filter(r => r <= 2).length;

    // Extraire les top points positifs et négatifs
    const topPositives = currentReviews
      .filter(r => r.rating && r.rating >= 4)
      .slice(0, 3)
      .map(r => r.text?.substring(0, 50) + '...' || 'Point positif')
      .filter((v, i, a) => a.indexOf(v) === i);

    const topNegatives = currentReviews
      .filter(r => r.rating && r.rating <= 2)
      .slice(0, 3)
      .map(r => r.text?.substring(0, 50) + '...' || 'Point à améliorer')
      .filter((v, i, a) => a.indexOf(v) === i);

    // Générer des recommandations basiques
    const recommendations: string[] = [];
    if (currentResponseRate < 50) {
      recommendations.push(`Répondez à plus d'avis clients (taux actuel: ${currentResponseRate}%)`);
    }
    if (currentNegative > 0) {
      recommendations.push(`Concentrez-vous sur la résolution des ${currentNegative} avis négatifs reçus ce mois`);
    }
    if (currentAvgRating < 4.0) {
      recommendations.push(`Travaillez à améliorer votre note moyenne (actuellement ${currentAvgRating.toFixed(1)}/5)`);
    }
    if (recommendations.length === 0) {
      recommendations.push('Continuez vos efforts pour maintenir votre excellente réputation !');
    }

    // Préparer les données du rapport
    const reportData: MonthlyReportData = {
      userId,
      userEmail: userEmail,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      establishmentName: establishment.nom, // MODIFIÉ: utiliser 'nom' au lieu de 'name'
      currentMonth: {
        avgRating: currentAvgRating,
        totalReviews: currentReviews.length,
        positiveReviews: currentPositive,
        negativeReviews: currentNegative,
        responsesSent: currentResponses,
        responseRate: currentResponseRate,
        topPositives: topPositives.length > 0 ? topPositives : ['Service apprécié', 'Qualité reconnue', 'Accueil chaleureux'],
        topNegatives: topNegatives.length > 0 ? topNegatives : ['Temps d\'attente', 'Qualité à améliorer', 'Service à renforcer'],
      },
      previousMonth: {
        avgRating: previousAvgRating,
        totalReviews: previousReviews.length,
        positiveReviews: previousPositive,
        negativeReviews: previousNegative,
      },
      recommendations,
    };

    // Générer le HTML du rapport
    const htmlContent = generateReportHTML(reportData);

    // Envoyer l'email
    console.log(`Sending monthly report to ${reportData.userEmail} for ${reportData.establishmentName}`);
    const emailResponse = await resend.emails.send({
      from: "Reviewsvisor <contact@reviewsvisor.fr>",
      to: [reportData.userEmail],
      subject: `📊 Rapport mensuel Reviewsvisor - ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
      html: htmlContent,
    });

    console.log(`Monthly report sent successfully to ${reportData.userEmail}:`, emailResponse);
  } catch (error) {
    console.error(`Error generating report for user ${userId}:`, error);
    throw error;
  }
}

// Handler principal
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

    // Si un userId est fourni dans le body, générer le rapport pour cet utilisateur
    // Sinon, récupérer tous les utilisateurs avec monthly_report_enabled = true
    const { userId } = await req.json().catch(() => ({}));

    if (userId) {
      // Mode test : générer le rapport pour un utilisateur spécifique
      await generateAndSendReport(userId, supabaseAdmin);
      return new Response(
        JSON.stringify({ success: true, message: `Report sent to user ${userId}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Mode production : récupérer tous les utilisateurs avec rapports activés
      const { data: usersList, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

      if (usersError) {
        throw new Error(`Error fetching users: ${usersError.message}`);
      }

      // Récupérer les profils avec monthly_report_enabled = true
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('user_id, monthly_report_enabled, report_frequency')
        .eq('monthly_report_enabled', true);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Créer un map des profils pour vérification rapide
      const enabledUsers = new Set(
        (profiles || [])
          .filter(p => p.monthly_report_enabled === true)
          .map(p => p.user_id)
      );

      const results = [];
      for (const user of usersList?.users || []) {
        if (!user.email) continue; // Skip users without email
        if (!enabledUsers.has(user.id)) continue; // Skip users who disabled reports
        
        try {
          await generateAndSendReport(user.id, supabaseAdmin);
          results.push({ userId: user.id, status: 'success' });
        } catch (error: any) {
          results.push({ userId: user.id, status: 'error', error: error.message });
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Reports sent to ${results.filter(r => r.status === 'success').length} users`,
          results 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Error in send-monthly-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);