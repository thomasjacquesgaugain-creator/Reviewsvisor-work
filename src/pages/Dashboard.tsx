import { AnalyseDashboard } from "@/components/AnalyseDashboard";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart3, TrendingUp, User, LogOut, Home, Eye, Trash2, AlertTriangle, CheckCircle, Lightbulb, Target, ChevronDown, ChevronUp, ChevronRight, Building2, Star, UtensilsCrossed, Wine, Users, MapPin, Clock, MessageSquare, Info, Loader2, Copy, Calendar, Download, ClipboardList, Bot, X, Reply, List, Sparkles, AlertCircle, Frown, ThumbsUp, Flag, Zap, Flame, Globe, Layers, CheckSquare, Square } from "lucide-react";
import { Link } from "react-router-dom";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthProvider";
import { useEstablishmentStore } from "@/store/establishmentStore";
import { Etab, STORAGE_KEY, EVT_SAVED, STORAGE_KEY_LIST } from "@/types/etablissement";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, BarChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { getRatingEvolution, formatRegistrationDate, Granularity } from "@/utils/ratingEvolution";
import { validateReponse, getReponsesStats } from "@/lib/reponses";
import { generatePdfReport } from "@/utils/generatePdfReport";
import { extractOriginalText } from "@/utils/extractOriginalText";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { fr, enUS, it, es, ptBR } from "date-fns/locale";
import { DashboardTabs } from "@/components/DashboardTabs";


const Dashboard = () => {
  // ============================================
  // 1. TOUS LES HOOKS (useContext, useTranslation, etc.)
  // ============================================
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const etablissementId = searchParams.get('etablissementId');
  const {
    user,
    displayName,
    loading,
    signOut
  } = useAuth();
  const {
    selectedEstablishment
  } = useEstablishmentStore();

  // ============================================
  // 2. TOUS LES useState (regroupés)
  // ============================================
  // Interface pour ChecklistAction (déclarée avant les useState qui l'utilisent)
  interface ChecklistAction {
    id: string;
    text: string;
    completed: boolean;
    completedAt?: string;
  }

  // États UI généraux
  const [showAvis, setShowAvis] = useState(false);
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [selectedContentCategory, setSelectedContentCategory] = useState<string | null>(null);
  const [selectedNoteCategory, setSelectedNoteCategory] = useState<string | null>(null);
  const [selectedPriorityCategory, setSelectedPriorityCategory] = useState<string | null>(null);
  const [selectedPlatformCategory, setSelectedPlatformCategory] = useState<string | null>(null);
  const [showAgent, setShowAgent] = useState(false);
  const [showObjectif, setShowObjectif] = useState(false);
  const [showReponseAuto, setShowReponseAuto] = useState(false);
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [showParetoChart, setShowParetoChart] = useState(false);
  const [showParetoPoints, setShowParetoPoints] = useState(false);
  const [granularityEvolution, setGranularityEvolution] = useState<Granularity>("mois");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('indicateurs');

  // Établissements
  const [selectedEtab, setSelectedEtab] = useState<Etab | null>(null);
  const [establishments, setEstablishments] = useState<Etab[]>([]);
  const [showEstablishmentsDropdown, setShowEstablishmentsDropdown] = useState(false);
  const [establishmentsLoading, setEstablishmentsLoading] = useState(true);
  const [establishmentDbId, setEstablishmentDbId] = useState<string | null>(null);
  const [establishmentCreatedAt, setEstablishmentCreatedAt] = useState<string | null>(null);

  // Review insights data
  const [insight, setInsight] = useState<any>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [topReviews, setTopReviews] = useState<any[]>([]);
  const [worstReviews, setWorstReviews] = useState<any[]>([]);
  const [allReviewsForChart, setAllReviewsForChart] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState<Record<string, { count: number; avgRating: number }>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // États pour l'édition des réponses automatiques
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editedResponses, setEditedResponses] = useState<Record<string, string>>({});
  const [validatedReviews, setValidatedReviews] = useState<Set<number>>(new Set());
  const [validatedResponsesText, setValidatedResponsesText] = useState<Map<number, string>>(new Map());
  const [isValidatingReview, setIsValidatingReview] = useState<Record<number, boolean>>({});
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [reponsesStats, setReponsesStats] = useState<{ validated: number; total: number }>({ validated: 0, total: 0 });
  const [currentReviewIndex, setCurrentReviewIndex] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'replied'>('pending');
  const [selectedReviewForReply, setSelectedReviewForReply] = useState<any>(null);
  const [expandedReplyId, setExpandedReplyId] = useState<string | null>(null);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState<Record<string, boolean>>({});
  const [aiGeneratedResponses, setAiGeneratedResponses] = useState<Record<string, string>>({});

  // Checklist opérationnelle
  const [checklistActions, setChecklistActions] = useState<ChecklistAction[]>([]);
  const [completedActionsCount, setCompletedActionsCount] = useState<number>(0);
  const [removingActionId, setRemovingActionId] = useState<string | null>(null);

  // États supplémentaires
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  // ============================================
  // 3. TOUS LES useRef
  // ============================================
  const reponseAutomatiqueRef = useRef<HTMLDivElement>(null);

  // ============================================
  // 4. FONCTIONS UTILITAIRES
  // ============================================
  // Fonction pour traduire les thèmes dynamiques
  const translateTheme = (theme: string): string => {
    const themeLower = theme.toLowerCase();
    const translations: Record<string, string> = {
      "service / attente": t("charts.problems.serviceWait"),
      "qualité des plats": t("charts.problems.foodQuality"),
      "prix": t("charts.problems.price"),
      "qualité / goût": t("charts.strengths.tasteQuality"),
      "ambiance agréable": t("charts.strengths.niceAmbiance"),
      "rapidité": t("dashboard.speed"),
      "cuisine": t("dashboard.cuisine"),
      "service": t("dashboard.service"),
      "ambiance": t("dashboard.ambiance"),
      "rapport qualité/prix": t("charts.strengths.valueForMoney"),
    };
    
    // Chercher une correspondance exacte ou partielle
    for (const [key, value] of Object.entries(translations)) {
      if (themeLower.includes(key) || key.includes(themeLower)) {
        return value;
      }
    }
    
    return theme; // Retourner le thème original si aucune traduction trouvée
  };

  // Fonction pour générer des actions basées UNIQUEMENT sur les avis clients réels
  // Format : [Constat basé sur les avis] → [Action concrète terrain]
  const generateActionPlan = (insightData: any, reviewsData: any[]): Array<{
    title: string;
    priority: 'high' | 'medium' | 'low';
    status: 'todo' | 'inProgress' | 'completed';
    issue: string;
  }> => {
    console.log('[generateActionPlan] Début de génération', { 
      hasInsightData: !!insightData, 
      hasTopIssues: !!insightData?.top_issues,
      topIssuesCount: insightData?.top_issues?.length || 0,
      reviewsDataCount: reviewsData?.length || 0
    });

    if (!insightData?.top_issues || !Array.isArray(insightData.top_issues) || insightData.top_issues.length === 0) {
      console.log('[generateActionPlan] Aucun problème identifié dans les insights');
      return [];
    }

    // On n'a pas besoin de reviewsData pour générer les actions, on utilise directement count des insights
    // Mais on vérifie qu'il y a des avis pour confirmer qu'on peut générer des actions basées sur des données réelles
    if (!reviewsData || reviewsData.length === 0) {
      console.log('[generateActionPlan] Aucun avis disponible');
      return [];
    }

    const actions: Array<{
      title: string;
      priority: 'high' | 'medium' | 'low';
      status: 'todo' | 'inProgress' | 'completed';
      issue: string;
    }> = [];

    // Trier les problèmes par priorité (count décroissant)
    const sortedIssues = [...insightData.top_issues].sort((a: any, b: any) => {
      const countA = a.count || 0;
      const countB = b.count || 0;
      return countB - countA;
    });

    console.log('[generateActionPlan] Problèmes triés:', sortedIssues.map((i: any) => ({ theme: i.theme, count: i.count })));

    sortedIssues.forEach((issue: any, index: number) => {
      const theme = (issue.theme || issue).toLowerCase();
      const count = issue.count || 0;
      const severity = issue.severity || (index < 2 ? 'high' : index < 4 ? 'medium' : 'low');
      
      console.log(`[generateActionPlan] Traitement du problème: ${theme}, count: ${count}, severity: ${severity}`);
      
      // Déterminer la priorité basée sur le count et la severity
      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (severity === 'high' || count >= 5) {
        priority = 'high';
      } else if (severity === 'low' || count <= 2) {
        priority = 'low';
      }

      // Générer des actions basées sur les mentions réelles dans les avis (count vient des insights)
      const generatedActions: string[] = [];

      // On utilise directement count qui vient des insights (basé sur les vrais avis)
      // Pas besoin de filtrer les avis car count est déjà calculé à partir des avis réels
      if (count > 0) {
        // Actions concrètes et actionnables par le gérant lui-même (pas de décisions RH/financières)
        if (theme.includes('service') || theme.includes('attente') || theme.includes('lent')) {
          if (count >= 5) {
            generatedActions.push(`${count} clients mentionnent une attente trop longue → briefer l'équipe sur la rapidité de service`);
            generatedActions.push(`Le problème d'attente revient dans ${count} avis → observer le service ce soir pour identifier les points de blocage`);
          } else {
            generatedActions.push(`${count} clients se plaignent de l'attente → rappeler à l'équipe l'importance de servir rapidement`);
          }
        } else if (theme.includes('qualité') || theme.includes('plat') || theme.includes('cuisson') || theme.includes('froid') || theme.includes('chaud')) {
          if (count >= 5) {
            generatedActions.push(`Le problème de qualité des plats revient dans ${count} avis → vérifier le process en cuisine ce soir`);
            generatedActions.push(`${count} clients mentionnent des problèmes de cuisson → observer la préparation des plats en cuisine`);
          } else {
            generatedActions.push(`${count} clients signalent un problème de qualité → vérifier en cuisine si le problème est résolu`);
          }
        } else if (theme.includes('prix') || theme.includes('cher') || theme.includes('coûteux')) {
          // Pour le prix, on constate et on observe, on ne suggère jamais de modifier les prix
          generatedActions.push(`${count} clients trouvent les prix élevés → observer les réactions clients sur les prix et noter les plaintes`);
        } else if (theme.includes('accueil') || theme.includes('sourire') || theme.includes('froid') || theme.includes('sympathie')) {
          if (count >= 3) {
            generatedActions.push(`${count} clients mentionnent un accueil froid → discuter avec l'équipe de l'importance du sourire et de l'accueil chaleureux`);
          } else {
            generatedActions.push(`${count} clients se plaignent de l'accueil → faire un point avec l'équipe sur l'accueil`);
          }
        } else if (theme.includes('bruit') || theme.includes('bruyant') || theme.includes('ambiance') || theme.includes('musique')) {
          generatedActions.push(`${count} clients mentionnent le bruit ou l'ambiance → identifier les sources de nuisance sonore ce soir`);
        } else if (theme.includes('propreté') || theme.includes('sale') || theme.includes('nettoyage')) {
          if (count >= 3) {
            generatedActions.push(`${count} clients signalent des problèmes de propreté → vérifier la propreté des tables et sanitaires ce soir`);
          } else {
            generatedActions.push(`${count} clients mentionnent la propreté → observer le nettoyage des tables entre les services`);
          }
        } else {
          // Pour les autres problèmes, générer une action concrète basée sur les avis
          generatedActions.push(`${count} clients mentionnent "${translateTheme(theme)}" → analyser les avis concernant ce point et faire un point avec l'équipe`);
        }
      }

      // Ajouter 1-2 actions par problème (prioriser les plus importantes)
      const actionsToAdd = generatedActions.slice(0, priority === 'high' ? 2 : 1);
      actionsToAdd.forEach((actionTitle) => {
        actions.push({
          title: actionTitle,
          priority,
          status: 'todo' as const,
          issue: theme
        });
      });
    });

    // Trier les actions par priorité (high > medium > low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    console.log('[generateActionPlan] Actions générées:', actions.length, actions.map(a => ({ title: a.title, priority: a.priority })));

    return actions;
  };

  // Fonction pour générer des conseils personnalisés comme un consultant expert (jusqu'à 10 conseils)
  // Ton : humain, direct, tutoiement, bienveillant
  // Règle stricte : constater, alerter, valoriser - JAMAIS suggérer de décisions RH/financières/stratégiques
  // Interdit absolu : recruter, embaucher, former, licencier, changer les prix, modifier l'offre, augmenter les portions, créer de nouvelles offres
  // Format : constats chiffrés avec pourcentages, ton direct et bienveillant, tutoiement
  // Note: Cette fonction utilise validatedReviewsSet qui doit être passé en paramètre
  const generateConsultantAdvice = (insightData: any, reviewsData: any[], validatedReviewsSet: Set<number>): string[] => {
    if (!insightData || !reviewsData || reviewsData.length === 0) {
      return [];
    }

    const advice: string[] = [];
    const topIssues = insightData.top_issues || [];
    const topStrengths = insightData.top_praises || [];
    const avgRating = insightData.avg_rating || 0;
    const positiveRatio = insightData.positive_ratio || 0;
    const totalReviews = insightData.total_count || reviewsData.length;

    // Filtrer les avis négatifs et positifs
    const negativeReviews = reviewsData.filter((r: any) => (r.rating || 0) <= 2);
    const positiveReviews = reviewsData.filter((r: any) => (r.rating || 0) >= 4);

    // 1. Analyser le problème principal (priorité haute)
    if (topIssues.length > 0) {
      const mainIssue = topIssues[0];
      const issueTheme = (mainIssue.theme || mainIssue).toLowerCase();
      const issueCount = mainIssue.count || 0;
      const issuePercentage = totalReviews > 0 ? Math.round((issueCount / totalReviews) * 100) : 0;

      if (issuePercentage >= 30) {
        if (issueTheme.includes('service') || issueTheme.includes('attente')) {
          advice.push(`Le temps d'attente est très souvent mentionné négativement (${issuePercentage}% des avis). C'est le premier point qui ressort dans les retours clients.`);
        } else if (issueTheme.includes('qualité') || issueTheme.includes('plat')) {
          advice.push(`La qualité des plats revient souvent dans les avis négatifs (${issuePercentage}% des mentions). C'est un point qui impacte la perception de tes clients.`);
        } else if (issueTheme.includes('prix')) {
          advice.push(`Les prix sont souvent perçus comme élevés (${issuePercentage}% des avis). C'est une tendance à surveiller dans les retours clients.`);
        } else {
          advice.push(`${translateTheme(issueTheme)} revient fréquemment dans les avis (${issuePercentage}% des mentions). C'est un point récurrent à analyser.`);
        }
      } else if (issuePercentage >= 15) {
        if (issueTheme.includes('service') || issueTheme.includes('attente')) {
          advice.push(`L'attente revient régulièrement dans les avis (${issuePercentage}% des mentions). C'est une tendance à surveiller.`);
        } else {
          advice.push(`${translateTheme(issueTheme)} est mentionné dans ${issuePercentage}% des avis. C'est un point à prendre en compte dans tes réflexions.`);
        }
      }
    }

    // 2. Analyser les points forts à capitaliser
    if (topStrengths.length > 0) {
      const mainStrength = topStrengths[0];
      const strengthTheme = (mainStrength.theme || mainStrength.strength || mainStrength).toLowerCase();
      const strengthCount = mainStrength.count || 0;
      const strengthPercentage = totalReviews > 0 ? Math.round((strengthCount / totalReviews) * 100) : 0;

      if (strengthPercentage >= 40) {
        if (strengthTheme.includes('ambiance') || strengthTheme.includes('agréable')) {
          advice.push(`L'ambiance est un point fort récurrent (${strengthPercentage}% des avis positifs). C'est un atout à conserver selon tes clients.`);
        } else if (strengthTheme.includes('qualité') || strengthTheme.includes('goût') || strengthTheme.includes('délicieux')) {
          advice.push(`La qualité de ta cuisine revient souvent dans les avis positifs (${strengthPercentage}% des mentions). C'est un point fort à valoriser.`);
        } else if (strengthTheme.includes('accueil') || strengthTheme.includes('sympathie')) {
          advice.push(`L'accueil est souvent mentionné positivement (${strengthPercentage}% des avis). C'est un atout selon tes clients.`);
        } else {
          advice.push(`${translateTheme(strengthTheme)} revient dans ${strengthPercentage}% des avis positifs. C'est un point fort à prendre en compte.`);
        }
      }
    }

    // 3. Constats sur la note globale
    if (avgRating < 3.5 && totalReviews >= 10) {
      advice.push(`Ta note moyenne est à ${avgRating.toFixed(1)}/5, en dessous de la moyenne du secteur. C'est une tendance à analyser dans les retours clients.`);
    } else if (avgRating >= 4.0 && avgRating < 4.5) {
      advice.push(`Ta note moyenne est de ${avgRating.toFixed(1)}/5. Les points qui reviennent souvent dans les avis pourraient être des pistes d'amélioration.`);
    } else if (avgRating >= 4.5) {
      advice.push(`Ta note moyenne est excellente (${avgRating.toFixed(1)}/5). Les points forts mentionnés dans les avis sont des atouts à conserver.`);
    }

    // 4. Constats sur le ratio positif/négatif
    const negativePercentage = Math.round((1 - positiveRatio) * 100);
    if (negativePercentage >= 40 && totalReviews >= 10) {
      advice.push(`${negativePercentage}% d'avis négatifs dans tes retours clients. C'est une tendance à analyser, le problème principal revient souvent.`);
    } else if (positiveRatio >= 0.7) {
      advice.push(`${Math.round(positiveRatio * 100)}% d'avis positifs dans tes retours. Les points forts mentionnés sont des atouts à valoriser.`);
    }

    // 5. Conseils sur les opportunités manquées (réponses aux avis)
    if (positiveReviews.length > 0 && negativeReviews.length > 0) {
      const responseRate = validatedReviewsSet.size / totalReviews;
      if (responseRate < 0.3) {
        advice.push(`Tu réponds à moins de ${Math.round(responseRate * 100)}% des avis. C'est une tendance à analyser dans ta gestion des retours clients.`);
      } else if (responseRate >= 0.7) {
        advice.push(`Tu réponds à ${Math.round(responseRate * 100)}% des avis. C'est une bonne pratique dans la gestion de tes retours clients.`);
      }
    }

    // 6. Conseils sur les problèmes secondaires
    if (topIssues.length >= 2) {
      const secondIssue = topIssues[1];
      const secondIssueTheme = (secondIssue.theme || secondIssue).toLowerCase();
      const secondIssueCount = secondIssue.count || 0;
      const secondIssuePercentage = totalReviews > 0 ? Math.round((secondIssueCount / totalReviews) * 100) : 0;
      
      if (secondIssuePercentage >= 20) {
        advice.push(`En plus du problème principal, ${translateTheme(secondIssueTheme)} revient aussi souvent (${secondIssuePercentage}% des avis). C'est un point secondaire à analyser.`);
      }
    }

    // 7. Conseils sur le positionnement et la communication
    if (topStrengths.length > 0 && topStrengths.length >= 2) {
      const secondStrength = topStrengths[1];
      const secondStrengthTheme = (secondStrength.theme || secondStrength.strength || secondStrength).toLowerCase();
      const secondStrengthCount = secondStrength.count || 0;
      const secondStrengthPercentage = totalReviews > 0 ? Math.round((secondStrengthCount / totalReviews) * 100) : 0;
      
      if (secondStrengthPercentage >= 25) {
        advice.push(`${translateTheme(secondStrengthTheme)} revient souvent dans les avis positifs (${secondStrengthPercentage}%). C'est un point fort à prendre en compte.`);
      }
    }

    // 8. Conseils sur la fidélisation
    if (positiveReviews.length > 0 && avgRating >= 4.0) {
      const recentPositiveReviews = positiveReviews.filter((r: any) => {
        if (!r.published_at) return false;
        const reviewDate = new Date(r.published_at);
        const daysAgo = (new Date().getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 30;
      });
      
      if (recentPositiveReviews.length >= 5) {
        advice.push(`Tu as ${recentPositiveReviews.length} avis positifs récents. C'est une tendance positive dans les retours clients.`);
      }
    }

    // 9. Conseils sur l'amélioration continue
    if (topIssues.length >= 3) {
      const thirdIssue = topIssues[2];
      const thirdIssueTheme = (thirdIssue.theme || thirdIssue).toLowerCase();
      const thirdIssueCount = thirdIssue.count || 0;
      const thirdIssuePercentage = totalReviews > 0 ? Math.round((thirdIssueCount / totalReviews) * 100) : 0;
      
      if (thirdIssuePercentage >= 15) {
        advice.push(`${translateTheme(thirdIssueTheme)} revient aussi (${thirdIssuePercentage}% des avis). C'est un point secondaire à surveiller.`);
      }
    }

    // 10. Conseils sur la différenciation et la croissance
    if (topStrengths.length > 0 && avgRating >= 4.0) {
      const mainStrength = topStrengths[0];
      const strengthTheme = (mainStrength.theme || mainStrength.strength || mainStrength).toLowerCase();
      
      if (strengthTheme.includes('ambiance') || strengthTheme.includes('agréable')) {
        advice.push(`L'ambiance est un point fort récurrent selon tes clients. C'est un atout à conserver.`);
      } else if (strengthTheme.includes('qualité') || strengthTheme.includes('goût')) {
        advice.push(`Ta cuisine est souvent appréciée dans les avis. C'est un point fort à valoriser.`);
      }
    }

    // 11. Conseils sur la gestion proactive
    if (negativeReviews.length > 0 && negativeReviews.length < positiveReviews.length) {
      const recentNegativeReviews = negativeReviews.filter((r: any) => {
        if (!r.published_at) return false;
        const reviewDate = new Date(r.published_at);
        const daysAgo = (new Date().getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 7;
      });
      
      if (recentNegativeReviews.length > 0) {
        advice.push(`Tu as ${recentNegativeReviews.length} avis négatifs récents. C'est une tendance à surveiller dans tes retours clients.`);
      }
    }

    // 12. Conseils sur l'expérience client globale
    if (totalReviews >= 20) {
      const ratingDistribution: Record<number, number> = {};
      reviewsData.forEach((r: any) => {
        const rating = r.rating || 0;
        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
      });
      
      const veryPositiveCount = ratingDistribution[5] || 0;
      const veryPositivePercentage = Math.round((veryPositiveCount / totalReviews) * 100);
      
      if (veryPositivePercentage >= 30) {
        advice.push(`${veryPositivePercentage}% de tes clients donnent 5 étoiles. C'est une tendance très positive dans les retours.`);
      }
    }

    // Limiter à 10 conseils maximum
    return advice.slice(0, 10);
  };

  // Fonction pour générer des actions de checklist basées sur les avis réels
  // Ton : tutoiement, actions concrètes et rapides que le gérant peut faire lui-même
  // Règle stricte : actions terrain uniquement - JAMAIS suggérer de décisions RH/financières/stratégiques
  // Interdit absolu : recruter, embaucher, former, licencier, changer les prix, modifier l'offre, augmenter les portions
  // Autorisé : répondre aux avis, observer, tester, vérifier, briefer l'équipe, discuter, noter
  const generateChecklistActions = (insightData: any, reviewsData: any[], validatedReviewsSet: Set<number>): ChecklistAction[] => {
    if (!insightData || !reviewsData || reviewsData.length === 0) {
      return [];
    }

    const actions: ChecklistAction[] = [];
    const topIssues = insightData.top_issues || [];
    const topStrengths = insightData.top_praises || [];
    const pendingReviews = reviewsData.filter((r: any) => {
      const hasResponse = validatedReviewsSet.has(r.id);
      const hasOwnerReply = !!(r.owner_reply_text && r.owner_reply_text.trim());
      const hasRespondedAt = !!r.responded_at;
      return !hasResponse && !hasOwnerReply && !hasRespondedAt;
    });
    const negativeReviews = reviewsData.filter((r: any) => (r.rating || 0) <= 2 && !validatedReviewsSet.has(r.id));
    const positiveReviews = reviewsData.filter((r: any) => (r.rating || 0) >= 5);
    const recentNegativeReviews = negativeReviews.filter((r: any) => {
      if (!r.published_at) return false;
      const reviewDate = new Date(r.published_at);
      const daysAgo = (new Date().getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    });
    const thisWeekPendingReviews = pendingReviews.filter((r: any) => {
      if (!r.published_at) return false;
      const reviewDate = new Date(r.published_at);
      const daysAgo = (new Date().getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    });

    // Action 1 : Répondre aux avis en attente
    if (pendingReviews.length > 0) {
      const count = Math.min(pendingReviews.length, 10);
      actions.push({
        id: `action-respond-${count}`,
        text: `Réponds à ${count} avis clients`,
        completed: false
      });
    }

    // Action 2 : Répondre aux avis négatifs récents
    if (recentNegativeReviews.length > 0) {
      const count = Math.min(recentNegativeReviews.length, 3);
      actions.push({
        id: `action-respond-negative-${count}`,
        text: `Réponds aux ${count} derniers avis négatifs`,
        completed: false
      });
    }

    // Action 3 : Répondre aux avis de la semaine
    if (thisWeekPendingReviews.length > 0) {
      actions.push({
        id: `action-respond-week-${thisWeekPendingReviews.length}`,
        text: `Réponds aux avis en attente de cette semaine (${thisWeekPendingReviews.length})`,
        completed: false
      });
    }

    // Action 4 : Remercier les clients 5 étoiles
    if (positiveReviews.length > 0) {
      const recentPositive = positiveReviews.filter((r: any) => {
        if (!r.published_at) return false;
        const reviewDate = new Date(r.published_at);
        const daysAgo = (new Date().getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 30;
      });
      if (recentPositive.length > 0) {
        const count = Math.min(recentPositive.length, 5);
        actions.push({
          id: `action-thank-positive-${count}`,
          text: `Remercie les ${count} derniers clients qui ont laissé 5 étoiles`,
          completed: false
        });
      }
    }

    // Action 5 : Actions spécifiques basées sur les problèmes identifiés dans les avis
    if (topIssues.length > 0) {
      const mainIssue = topIssues[0];
      const issueTheme = (mainIssue.theme || mainIssue).toLowerCase();
      const issueCount = mainIssue.count || 0;
      
      if (issueTheme.includes('service') || issueTheme.includes('attente') || issueTheme.includes('lent')) {
        if (issueCount >= 5) {
          actions.push({
            id: 'action-brief-speed',
            text: 'Briefe l\'équipe sur la rapidité de service',
            completed: false
          });
          actions.push({
            id: 'action-observe-service',
            text: 'Observe le service ce soir pour identifier les points de blocage',
            completed: false
          });
        } else {
          actions.push({
            id: 'action-point-wait',
            text: 'Fais un point avec l\'équipe sur le problème d\'attente',
            completed: false
          });
        }
        actions.push({
          id: 'action-test-wait-time',
          text: 'Teste le temps d\'attente réel aux heures de pointe',
          completed: false
        });
      } else if (issueTheme.includes('qualité') || issueTheme.includes('plat') || issueTheme.includes('cuisson') || issueTheme.includes('froid') || issueTheme.includes('chaud')) {
        if (issueCount >= 5) {
          actions.push({
            id: 'action-check-quality',
            text: 'Vérifie en cuisine si le problème de qualité est résolu',
            completed: false
          });
          actions.push({
            id: 'action-observe-cuisine',
            text: 'Observe la préparation des plats en cuisine ce soir',
            completed: false
          });
        } else {
          actions.push({
            id: 'action-check-quality-single',
            text: 'Vérifie en cuisine si le problème de qualité signalé est résolu',
            completed: false
          });
        }
      } else if (issueTheme.includes('prix') || issueTheme.includes('cher') || issueTheme.includes('coûteux')) {
        actions.push({
          id: 'action-note-price-reactions',
          text: 'Note les réactions clients sur les prix pendant le service',
          completed: false
        });
      } else if (issueTheme.includes('accueil') || issueTheme.includes('sourire') || issueTheme.includes('froid') || issueTheme.includes('sympathie')) {
        if (issueCount >= 3) {
          actions.push({
            id: 'action-discuss-welcome',
            text: 'Discute avec l\'équipe de l\'importance du sourire et de l\'accueil chaleureux',
            completed: false
          });
        } else {
          actions.push({
            id: 'action-point-welcome',
            text: 'Fais un point avec l\'équipe sur l\'accueil',
            completed: false
          });
        }
      } else if (issueTheme.includes('bruit') || issueTheme.includes('bruyant') || issueTheme.includes('ambiance') || issueTheme.includes('musique')) {
        actions.push({
          id: 'action-identify-noise',
          text: 'Identifie les sources de nuisance sonore ce soir',
          completed: false
        });
      } else if (issueTheme.includes('propreté') || issueTheme.includes('sale') || issueTheme.includes('nettoyage')) {
        if (issueCount >= 3) {
          actions.push({
            id: 'action-check-cleanliness',
            text: 'Vérifie la propreté des tables et sanitaires ce soir',
            completed: false
          });
        } else {
          actions.push({
            id: 'action-observe-cleaning',
            text: 'Observe le nettoyage des tables entre les services',
            completed: false
          });
        }
      }
    }

    // Action 6 : Informer l'équipe du problème prioritaire (action générique récurrente)
    if (topIssues.length > 0) {
      const mainIssue = topIssues[0];
      actions.push({
        id: 'action-inform-team',
        text: `Informe ton équipe du problème prioritaire : ${translateTheme(mainIssue.theme || mainIssue)}`,
        completed: false
      });
    }

    // Action 7 : Brief avec l'équipe (action générique récurrente)
    if (reviewsData.length >= 10) {
      actions.push({
        id: 'action-brief-team',
        text: 'Fais un brief avec ton équipe sur les retours clients de la semaine',
        completed: false
      });
    }

    // Action 8 : Analyser les patterns récurrents
    if (topIssues.length >= 2) {
      actions.push({
        id: 'action-analyze-patterns',
        text: 'Analyse les patterns récurrents dans les avis pour identifier les causes racines',
        completed: false
      });
    }

    return actions.slice(0, 5); // Limiter à 5 actions affichées
  };

  // Charger les actions complétées depuis localStorage
  useEffect(() => {
    if (!selectedEtab?.place_id) return;
    
    const storageKey = `checklist_actions_${selectedEtab.place_id}`;
    const completedKey = `checklist_completed_${selectedEtab.place_id}`;
    
    try {
      const storedActions = localStorage.getItem(storageKey);
      const storedCompleted = localStorage.getItem(completedKey);
      
      if (storedActions) {
        const parsed = JSON.parse(storedActions);
        setChecklistActions(parsed);
      } else {
        // Générer de nouvelles actions si aucune n'existe
        const newActions = generateChecklistActions(insight, allReviewsForChart, validatedReviews);
        if (newActions.length > 0) {
          setChecklistActions(newActions);
          localStorage.setItem(storageKey, JSON.stringify(newActions));
        }
      }
      
      if (storedCompleted) {
        setCompletedActionsCount(parseInt(storedCompleted, 10) || 0);
      }
    } catch (error) {
      console.error('Error loading checklist actions:', error);
    }
  }, [selectedEtab?.place_id, insight, allReviewsForChart, validatedReviews]);

  // Fonction pour cocher une action
  const handleChecklistActionComplete = (actionId: string) => {
    setRemovingActionId(actionId);
    
    setTimeout(() => {
      setChecklistActions(prev => {
        const updated = prev.filter(action => action.id !== actionId);
        const completedAction = prev.find(action => action.id === actionId);
        
        if (completedAction) {
          setCompletedActionsCount(prev => {
            const newCount = prev + 1;
            if (selectedEtab?.place_id) {
              const completedKey = `checklist_completed_${selectedEtab.place_id}`;
              localStorage.setItem(completedKey, newCount.toString());
            }
            return newCount;
          });
        }
        
        // Générer une nouvelle action si nécessaire
        if (updated.length < 5) {
          const newActions = generateChecklistActions(insight, allReviewsForChart, validatedReviews);
          const existingIds = new Set(updated.map(a => a.id));
          const availableNewActions = newActions.filter(a => !existingIds.has(a.id));
          
          if (availableNewActions.length > 0) {
            updated.push(availableNewActions[0]);
          }
        }
        
        // Sauvegarder dans localStorage
        if (selectedEtab?.place_id) {
          const storageKey = `checklist_actions_${selectedEtab.place_id}`;
          localStorage.setItem(storageKey, JSON.stringify(updated));
        }
        
        return updated;
      });
      
      setRemovingActionId(null);
    }, 300); // Animation de 300ms
  };

  // Charger les établissements depuis la DB (source de vérité unique)
  const loadEstablishmentsFromDB = async () => {
    if (!user?.id) {
      setEstablishmentsLoading(false);
      return;
    }

    setEstablishmentsLoading(true);
    try {
      const { data, error } = await supabase
        .from("établissements")
        .select("id, place_id, nom, adresse, is_active, lat, lng, website, telephone, rating, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const mapped: Etab[] = (data ?? []).map((row) => ({
        place_id: row.place_id,
        name: row.nom,
        address: row.adresse ?? "",
        lat: row.lat ?? null,
        lng: row.lng ?? null,
        website: row.website ?? undefined,
        phone: row.telephone ?? undefined,
        rating: row.rating ?? null,
        is_active: row.is_active ?? false,
      }));

      setEstablishments(mapped);

      // Détermine l'établissement affiché: actif si défini, sinon plus récent
      if (mapped.length > 0) {
        const active = mapped.find((e) => e.is_active) ?? mapped[0];
        setSelectedEtab(active);
      } else {
        setSelectedEtab(null);
      }
    } catch (err) {
      console.error("[Dashboard] Erreur chargement établissements:", err);
      setEstablishments([]);
    } finally {
      setEstablishmentsLoading(false);
    }
  };

  useEffect(() => {
    loadEstablishmentsFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Écouter les événements de mise à jour
  useEffect(() => {
    const onUpdated = () => loadEstablishmentsFromDB();
    window.addEventListener(EVT_SAVED, onUpdated);
    window.addEventListener("establishment:updated", onUpdated);
    return () => {
      window.removeEventListener(EVT_SAVED, onUpdated);
      window.removeEventListener("establishment:updated", onUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Empêcher le scroll automatique quand le contenu s'ouvre
  useEffect(() => {
    if (openCard === 'thematiques' || openCard === 'analyseDetaillee') {
      // Sauvegarder la position de scroll actuelle
      const scrollY = window.scrollY;
      // Attendre que le DOM soit mis à jour
      requestAnimationFrame(() => {
        // Restaurer la position de scroll si elle a changé
        if (Math.abs(window.scrollY - scrollY) > 10) {
          window.scrollTo(0, scrollY);
        }
      });
    }
  }, [openCard]);

  // Synchroniser avec le store si mis à jour
  useEffect(() => {
    if (selectedEstablishment) {
      setSelectedEtab({
        place_id: selectedEstablishment.place_id,
        name: selectedEstablishment.name,
        address: selectedEstablishment.formatted_address || "",
        lat: selectedEstablishment.lat ?? null,
        lng: selectedEstablishment.lng ?? null,
        website: selectedEstablishment.website,
        phone: selectedEstablishment.phone,
        rating: selectedEstablishment.rating ?? null
      });
    }
  }, [selectedEstablishment]);

  // Ces déclarations ont été déplacées en haut du composant

  // Mocked data for Pareto charts (will be updated below after variables are declared)
  const defaultParetoData = [{
    name: t("charts.problems.slowService"),
    count: 45,
    percentage: 32.1,
    cumulative: 32.1
  }, {
    name: t("charts.problems.coldFood"),
    count: 38,
    percentage: 27.1,
    cumulative: 59.2
  }, {
    name: t("charts.problems.longWait"),
    count: 25,
    percentage: 17.9,
    cumulative: 77.1
  }];
  const defaultParetoPointsData = [{
    name: t("charts.strengths.tasteQuality"),
    count: 52,
    percentage: 35.4,
    cumulative: 35.4
  }, {
    name: t("charts.strengths.fastService"),
    count: 41,
    percentage: 27.9,
    cumulative: 63.3
  }, {
    name: t("charts.strengths.niceAmbiance"),
    count: 28,
    percentage: 19.0,
    cumulative: 82.3
  }];

  // Fetch review insights data
  useEffect(() => {
    const fetchInsights = async () => {
      // Utiliser selectedEtab (localStorage) ou selectedEstablishment (store)
      const currentEstab = selectedEtab || selectedEstablishment;
      if (!user?.id || !currentEstab?.place_id) return;
      
      setIsLoadingInsight(true);
      try {
        const {
          data: insightData,
          error
        } = await supabase.from('review_insights').select('total_count, avg_rating, top_issues, top_praises, positive_ratio, last_analyzed_at, summary, themes').eq('place_id', currentEstab.place_id).eq('user_id', user.id).order('last_analyzed_at', {
          ascending: false
        }).limit(1).maybeSingle();
        if (error) {
          console.error('[dashboard] review_insights error:', error);
        } else {
          if (!import.meta.env.PROD) {
            console.log('[dashboard] Insights loaded:', insightData);
          }
          setInsight(insightData);
        }
        
        // Charger les vrais avis récents
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .eq('place_id', currentEstab.place_id)
          .eq('user_id', user.id)
          .order('published_at', { ascending: false });
          
        if (reviewsError) {
          console.error('[dashboard] reviews error:', reviewsError);
        } else if (reviewsData) {
          // Si pas d'avis, réinitialiser tous les états
          if (reviewsData.length === 0) {
            setRecentReviews([]);
            setAllReviewsForChart([]);
            setTopReviews([]);
            setWorstReviews([]);
            setPlatformStats({});
            setPendingReviews([]);
            // Reset insight si plus d'avis
            setInsight(null);
          } else {
            setRecentReviews(reviewsData.slice(0, 3));
            setAllReviewsForChart(reviewsData);
            
            // Top 5 meilleurs avis (note >= 4)
            const bestReviews = reviewsData
              .filter(r => r.rating && r.rating >= 4)
              .sort((a, b) => (b.rating || 0) - (a.rating || 0))
              .slice(0, 5);
            setTopReviews(bestReviews);
            
            // Top 5 pires avis (note <= 2)
            const badReviews = reviewsData
              .filter(r => r.rating && r.rating <= 2)
              .sort((a, b) => (a.rating || 0) - (b.rating || 0))
              .slice(0, 5);
            setWorstReviews(badReviews);
            
            // Calculer les stats par plateforme
            const statsByPlatform: Record<string, { count: number; totalRating: number; avgRating: number }> = {};
            reviewsData.forEach(review => {
              const source = review.source || 'google';
              if (!statsByPlatform[source]) {
                statsByPlatform[source] = { count: 0, totalRating: 0, avgRating: 0 };
              }
              statsByPlatform[source].count++;
              if (review.rating) {
                statsByPlatform[source].totalRating += review.rating;
              }
            });
            
            // Calculer les moyennes
            Object.keys(statsByPlatform).forEach(source => {
              const stat = statsByPlatform[source];
              stat.avgRating = stat.count > 0 ? stat.totalRating / stat.count : 0;
            });
            
            setPlatformStats(statsByPlatform);
            
            // Charger les réponses validées et construire la liste des avis à valider
            if (currentEstab?.place_id && user?.id) {
              const { data: responsesData } = await supabase
                .from('reponses')
                .select('avis_id, contenu')
                .eq('etablissement_id', currentEstab.place_id)
                .eq('user_id', user.id)
                .eq('statut', 'valide');
              
              if (responsesData) {
                const validatedSet = new Set(responsesData.map(r => parseInt(r.avis_id)));
                setValidatedReviews(validatedSet);
                
                // Stocker les textes des réponses validées
                const responsesMap = new Map<number, string>();
                responsesData.forEach(r => {
                  const reviewId = parseInt(r.avis_id);
                  if (r.contenu) {
                    responsesMap.set(reviewId, r.contenu);
                  }
                });
                setValidatedResponsesText(responsesMap);
                
                // Filtrer les avis pour exclure ceux qui ont une réponse
                // Un avis a une réponse si :
                // 1. Il est dans validatedSet (réponse validée dans la table reponses)
                // 2. Il a owner_reply_text (réponse directe sur la plateforme)
                // 3. Il a responded_at (date de réponse)
                const pending = reviewsData.filter(review => {
                  const hasValidatedResponse = validatedSet.has(review.id);
                  const hasOwnerReply = !!(review.owner_reply_text && review.owner_reply_text.trim());
                  const hasRespondedAt = !!review.responded_at;
                  return !hasValidatedResponse && !hasOwnerReply && !hasRespondedAt;
                });
                setPendingReviews(pending);
                
                // Mettre à jour les statistiques des réponses
                if (currentEstab?.place_id && user?.id) {
                  const stats = await getReponsesStats(currentEstab.place_id, user.id);
                  setReponsesStats(stats);
                }
              } else {
                // Si pas de réponses validées, calculer quand même les avis en attente
                const pending = reviewsData.filter(review => {
                  const hasOwnerReply = !!(review.owner_reply_text && review.owner_reply_text.trim());
                  const hasRespondedAt = !!review.responded_at;
                  return !hasOwnerReply && !hasRespondedAt;
                });
                setPendingReviews(pending);
              }
            } else {
              // Si pas d'établissement ou utilisateur, calculer quand même les avis en attente
              const pending = reviewsData.filter(review => {
                const hasOwnerReply = !!(review.owner_reply_text && review.owner_reply_text.trim());
                const hasRespondedAt = !!review.responded_at;
                return !hasOwnerReply && !hasRespondedAt;
              });
              setPendingReviews(pending);
            }
          }
        }

        // Récupérer la date de création et l'id de l'établissement
        const { data: establishmentData, error: estError } = await supabase
          .from('establishments')
          .select('id, created_at')
          .eq('place_id', currentEstab.place_id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!import.meta.env.PROD) {
          console.log('[Dashboard] Récupération établissement:', {
            place_id: currentEstab.place_id,
            user_id: user.id,
            found: !!establishmentData,
            error: estError,
            data: establishmentData
          });
        }
        
        if (!estError && establishmentData) {
          setEstablishmentCreatedAt(establishmentData.created_at);
          setEstablishmentDbId(establishmentData.id);
          if (!import.meta.env.PROD) {
            console.log('[Dashboard] ✅ Établissement ID récupéré:', establishmentData.id);
          }
        } else {
          console.warn('[Dashboard] ⚠️ Établissement non trouvé dans la base pour:', {
            place_id: currentEstab.place_id,
            user_id: user.id,
            error: estError
          });
          setEstablishmentDbId(null);
          // Fallback: utiliser la date du plus ancien avis ou aujourd'hui
          if (reviewsData && reviewsData.length > 0) {
            const oldestReview = reviewsData
              .filter(r => r.published_at || r.inserted_at)
              .sort((a, b) => {
                const dateA = new Date(a.published_at || a.inserted_at || '');
                const dateB = new Date(b.published_at || b.inserted_at || '');
                return dateA.getTime() - dateB.getTime();
              })[0];
            
            if (oldestReview) {
              setEstablishmentCreatedAt(oldestReview.published_at || oldestReview.inserted_at);
            }
          }
        }
      } catch (error) {
        console.error('[dashboard] fetch insights error:', error);
      } finally {
        setIsLoadingInsight(false);
      }
    };
    fetchInsights();
    
    // Listen to reviews:imported event to reload data
    const handleReviewsImported = () => {
      fetchInsights();
    };
    
    window.addEventListener('reviews:imported', handleReviewsImported);
    
    return () => {
      window.removeEventListener('reviews:imported', handleReviewsImported);
    };
  }, [user?.id, selectedEstablishment?.place_id, selectedEtab?.place_id]);

  // Mise à jour de l'heure en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Formatage de la date et de l'heure
  const formatDateTime = (date: Date) => {
    const locale = i18n.language === 'fr' ? fr : 
                  i18n.language === 'it' ? it :
                  i18n.language === 'es' ? es :
                  i18n.language === 'pt' ? ptBR : enUS;
    return {
      date: format(date, "EEEE d MMMM yyyy", { locale }),
      time: format(date, "HH:mm", { locale })
    };
  };
  const {
    date,
    time
  } = formatDateTime(currentDateTime);

  // Map insight data to variables used by UI components
  // Utiliser 0 ou des valeurs par défaut quand il n'y a pas d'avis
  const hasReviews = allReviewsForChart.length > 0;
  const totalAnalyzed = insight?.total_count ?? 0;
  const avgRating = hasReviews ? (insight?.avg_rating ?? 0) : 0;
  const totalReviews = hasReviews ? (insight?.total_count ?? 0) : 0;
  const positivePct = hasReviews && insight?.positive_ratio != null ? Math.round(insight.positive_ratio * 100) : 0;
  const negativePct = hasReviews ? (100 - positivePct) : 0;
  const topIssues = hasReviews ? (insight?.top_issues ?? []) : [];
  const topStrengths = hasReviews ? (insight?.top_praises ?? []) : [];

  // Map top issues to Pareto data format
  const paretoData = topIssues.length > 0 ? topIssues.slice(0, 3).map((issue: any, index: number) => {
    const count = issue.count || issue.mentions || 0;
    const percentage = totalAnalyzed > 0 ? count / totalAnalyzed * 100 : 0;
    return {
      name: translateTheme(issue.theme || issue.issue || t("dashboard.problemBadge", { number: index + 1 })),
      count,
      percentage,
      cumulative: 0 // Will be calculated below
    };
  }) : defaultParetoData;

  // Calculate cumulative percentages for issues
  let cumulativeIssues = 0;
  paretoData.forEach((item: any) => {
    cumulativeIssues += item.percentage;
    item.cumulative = cumulativeIssues;
  });

  // Map top strengths to Pareto data format
  const paretoPointsData = topStrengths.length > 0 ? topStrengths.slice(0, 3).map((strength: any, index: number) => {
    const count = strength.count || strength.mentions || 0;
    const percentage = totalAnalyzed > 0 ? count / totalAnalyzed * 100 : 0;
    return {
      name: translateTheme(strength.theme || strength.strength || t("dashboard.strengthBadge", { number: index + 1 })),
      count,
      percentage,
      cumulative: 0 // Will be calculated below
    };
  }) : defaultParetoPointsData;

  // Calculate cumulative percentages for strengths
  let cumulativeStrengths = 0;
  paretoPointsData.forEach((item: any) => {
    cumulativeStrengths += item.percentage;
    item.cumulative = cumulativeStrengths;
  });
  // Formatter une date pour l'affichage
  const formatReviewDate = (dateStr: string | null) => {
    if (!dateStr) return t("dashboard.unknownDate");
    const date = new Date(dateStr);
    const locale = i18n.language === 'fr' ? fr : 
                  i18n.language === 'it' ? it :
                  i18n.language === 'es' ? es :
                  i18n.language === 'pt' ? ptBR : enUS;
    return format(date, "dd/MM/yyyy", { locale });
  };

  // Calculer l'évolution de la note depuis l'enregistrement
  const courbeNoteData = useMemo(() => {
    if (!establishmentCreatedAt || allReviewsForChart.length === 0) {
      // Pas de données : retourner une courbe vide ou par défaut
      return [];
    }
    
    return getRatingEvolution(allReviewsForChart, establishmentCreatedAt, granularityEvolution, i18n.language);
  }, [allReviewsForChart, establishmentCreatedAt, granularityEvolution, i18n.language]);

  // If we have an etablissementId in URL, show analysis dashboard
  if (etablissementId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <AnalyseDashboard />
        </div>
      </div>
    );
  }


  return <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-slate-100 via-blue-50 to-violet-100">
      {/* Background with organic shapes - fixed to viewport */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-violet-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-200 to-yellow-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-30"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 bg-white shadow-sm rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
              <div className="flex items-center gap-2 text-gray-600 mt-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>{t("dashboard.analysisOfReviews", { count: totalAnalyzed })}</span>
          </div>
        </div>

            {/* Carte établissement au milieu */}
            {selectedEtab && <Card className="w-[600px]">
            <CardContent className="p-4">
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    {/* Flèche vers le bas en haut à droite de l'icône */}
                    <Popover open={showEstablishmentsDropdown} onOpenChange={setShowEstablishmentsDropdown}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="absolute -top-1 -right-1 text-gray-400 hover:text-gray-600 p-0.5 h-auto w-auto bg-white border border-gray-200 rounded-full shadow-sm" title={t("establishment.chooseAnotherEstablishment")}>
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-2 bg-white z-50 shadow-lg border" align="start">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-700 px-3 py-2">
                            {t("establishment.myEstablishments")}
                          </div>
                          {establishmentsLoading ? (
                            <div className="text-sm text-gray-500 px-3 py-2 flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {t("common.loading")}
                            </div>
                          ) : establishments.length === 0 ? (
                            <div className="text-sm text-gray-500 px-3 py-2">
                              {t("establishment.noEstablishmentsSaved")}
                            </div>
                          ) : establishments.map(etab => (
                            <button
                              key={etab.place_id}
                              type="button"
                              className={`w-full flex items-center gap-3 p-3 text-left rounded-lg cursor-pointer transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                selectedEtab?.place_id === etab.place_id ? 'bg-blue-50' : ''
                              }`}
                              onClick={async () => {
                                // Persist en DB : marquer comme actif
                                if (user?.id) {
                                  try {
                                    // D'abord désactiver tous les établissements
                                    await supabase
                                      .from("établissements")
                                      .update({ is_active: false })
                                      .eq("user_id", user.id);
                                    
                                    // Puis activer celui sélectionné
                                    await supabase
                                      .from("établissements")
                                      .update({ is_active: true })
                                      .eq("user_id", user.id)
                                      .eq("place_id", etab.place_id);
                                  } catch (err) {
                                    console.error(t("errors.updateEstablishmentActiveError"), err);
                                  }
                                }
                                
                                setSelectedEtab(etab);
                                setShowEstablishmentsDropdown(false);
                                
                                // Déclencher les événements pour mettre à jour d'autres composants
                                window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: etab }));
                                window.dispatchEvent(new CustomEvent("establishment:updated"));
                              }}
                            >
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 truncate">{etab.name}</span>
                                  {selectedEtab?.place_id === etab.place_id && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{t("establishment.active")}</span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 truncate">{etab.address}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{selectedEtab.name}</div>
                    <div className="text-sm text-gray-500">{selectedEtab.address}</div>
                  </div>
                </div>
                
                {/* Icône "Importer vos avis" au milieu en bas */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                  
                </div>
                
                {/* Icônes en bas à droite */}
                <div className="absolute bottom-0 right-0 flex gap-1">
                  {/* Bouton analyser établissement */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={async () => {
                      if (!selectedEtab?.place_id) {
                        console.error(t("errors.missingPlaceId"));
                        return;
                      }
                      
                      setIsAnalyzing(true);
                      try {
                        console.log(t("dashboard.startingAnalysis"), selectedEtab.place_id);
                        const { runAnalyze } = await import('@/lib/runAnalyze');
                        const result = await runAnalyze({
                          place_id: selectedEtab.place_id,
                          name: selectedEtab.name,
                          address: selectedEtab.address
                        });
                        
                        if (result.ok) {
                          console.log(t("dashboard.analysisComplete"), result);
                          // Recharger les insights au lieu de recharger toute la page
                          const { data: insightData } = await supabase
                            .from('review_insights')
                            .select('total_count, avg_rating, top_issues, top_praises, positive_ratio, last_analyzed_at, summary, themes')
                            .eq('place_id', selectedEtab.place_id)
                            .eq('user_id', user?.id)
                            .order('last_analyzed_at', { ascending: false })
                            .limit(1)
                            .maybeSingle();
                          
                          if (insightData) {
                            setInsight(insightData);
                            console.log(t("dashboard.insightsReloaded"), insightData);
                          }
                          
                          // Recharger aussi les avis
                          const { data: reviewsData } = await supabase
                            .from('reviews')
                            .select('*')
                            .eq('place_id', selectedEtab.place_id)
                            .eq('user_id', user?.id)
                            .order('published_at', { ascending: false });
                            
                          if (reviewsData) {
                            setRecentReviews(reviewsData.slice(0, 3));
                            const bestReviews = reviewsData
                              .filter(r => r.rating && r.rating >= 4)
                              .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                              .slice(0, 5);
                            setTopReviews(bestReviews);
                            const badReviews = reviewsData
                              .filter(r => r.rating && r.rating <= 2)
                              .sort((a, b) => (a.rating || 0) - (b.rating || 0))
                              .slice(0, 5);
                            setWorstReviews(badReviews);
                          }
                          
                          // Recalculer les stats par plateforme
                          if (reviewsData) {
                            const statsByPlatform: Record<string, { count: number; totalRating: number; avgRating: number }> = {};
                            reviewsData.forEach(review => {
                              const source = review.source || 'unknown';
                              if (!statsByPlatform[source]) {
                                statsByPlatform[source] = { count: 0, totalRating: 0, avgRating: 0 };
                              }
                              statsByPlatform[source].count++;
                              if (review.rating) {
                                statsByPlatform[source].totalRating += review.rating;
                              }
                            });
                            Object.keys(statsByPlatform).forEach(source => {
                              const stat = statsByPlatform[source];
                              stat.avgRating = stat.count > 0 ? stat.totalRating / stat.count : 0;
                            });
                            setPlatformStats(statsByPlatform);
                          }
                        } else {
                          console.error(t("dashboard.analysisError"), result.error);
                        }
                      } catch (error) {
                        console.error(t("dashboard.analysisErrorDuring"), error);
                      } finally {
                        setIsAnalyzing(false);
                      }
                    }} 
                    disabled={isAnalyzing}
                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 h-auto" 
                    title={t("establishment.analyzeThisEstablishment")}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <BarChart3 className="w-4 h-4" />
                    )}
                  </Button>
                  
                  {/* Bouton oublier établissement */}
                  <Button variant="ghost" size="sm" onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setSelectedEtab(null);
              }} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto" title={t("establishment.forgetThisEstablishment")}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>}

            {/* Bouton Télécharger le rapport */}
            {(selectedEtab || selectedEstablishment) && (
              <Button
                className="download-report-btn"
                onClick={() => {
                  if (!import.meta.env.PROD) {
                    console.log('[Dashboard] 🔘 Clic sur Télécharger le rapport PDF');
                  }
                  
                  const currentEstab = selectedEtab || selectedEstablishment;
                  if (!currentEstab) {
                    toast.error(t("common.error"), {
                      description: t("establishment.noEstablishmentSelected"),
                    });
                    return;
                  }

                  if (!hasReviews || allReviewsForChart.length === 0) {
                    toast.info(t("dashboard.noReportAvailable"), {
                      description: t("dashboard.importReviewsToGenerateReport"),
                    });
                    return;
                  }

                  setIsDownloadingReport(true);

                  try {
                    // Préparer les données pour le PDF
                    const reportData = {
                      establishmentName: currentEstab.name || 'Établissement',
                      totalReviews: totalAnalyzed || allReviewsForChart.length,
                      avgRating: avgRating,
                      positiveRatio: positivePct / 100,
                      topIssues: topIssues,
                      topStrengths: topStrengths,
                      themes: insight?.themes || [],
                      recentReviews: allReviewsForChart,
                      summary: insight?.summary || '',
                    };

                    if (!import.meta.env.PROD) {
                      console.log('[Dashboard] 📄 Génération du PDF avec:', reportData);
                    }

                    // Générer et télécharger le PDF
                    generatePdfReport(reportData);

                    toast.success(t("dashboard.reportDownloaded"), {
                      description: t("dashboard.reportGeneratedSuccess"),
                    });
                  } catch (error) {
                    console.error('[Dashboard] ❌ Erreur génération PDF:', error);
                    toast.error(t("common.error"), {
                      description: t("dashboard.reportGenerationError"),
                    });
                  } finally {
                    setIsDownloadingReport(false);
                  }
                }}
              >
                {isDownloadingReport ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("dashboard.generating")}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    {t("dashboard.downloadReport")}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Établissement sélectionné */}
        {selectedEstablishment && <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{selectedEstablishment.name}</div>
                  <div className="text-sm text-gray-500">{selectedEstablishment.formatted_address}</div>
                </div>
              </div>
            </CardContent>
          </Card>}

        {/* Navigation par onglets */}
        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'indicateurs' && (
          <>
        {/* Métriques */}
        {/* 4 cartes de statistiques */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1" onClick={() => setOpenCard(openCard === 'courbeNote' ? null : 'courbeNote')}>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold">{avgRating.toFixed(1)}</span>
              </div>
              <p className="text-sm text-gray-600">{t("dashboard.averageRating")}</p>
              <p className="text-xs text-gray-500">{t("dashboard.basedOnReviews", { count: totalReviews })}</p>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenCard(openCard === 'courbeNote' ? null : 'courbeNote'); }} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-yellow-50">
                {openCard === 'courbeNote' ? <ChevronUp className="w-3 h-3 text-yellow-600" /> : <ChevronDown className="w-3 h-3 text-yellow-600" />}
              </Button>
            </CardContent>
          </Card>

          <Card className="relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1" onClick={() => setOpenCard(openCard === 'plateformes' ? null : 'plateformes')}>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="text-2xl font-bold text-blue-600">{totalReviews}</span>
                <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
              </div>
              <p className="text-sm text-gray-600">{t("dashboard.totalReviews")}</p>
              <p className="text-xs text-gray-500">{t("dashboard.allPlatforms")}</p>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenCard(openCard === 'plateformes' ? null : 'plateformes'); }} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-blue-50">
                {openCard === 'plateformes' ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />}
              </Button>
            </CardContent>
          </Card>

          <Card className="relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1" onClick={() => setOpenCard(openCard === 'avisPositifs' ? null : 'avisPositifs')}>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="text-2xl font-bold text-green-600">{positivePct}%</span>
              </div>
              <p className="text-sm text-gray-600">{t("dashboard.positiveReviews")}</p>
              <p className="text-xs text-gray-500">{t("dashboard.rating4StarsOrMore")}</p>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenCard(openCard === 'avisPositifs' ? null : 'avisPositifs'); }} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-green-50">
                {openCard === 'avisPositifs' ? <ChevronUp className="w-3 h-3 text-green-600" /> : <ChevronDown className="w-3 h-3 text-green-600" />}
              </Button>
            </CardContent>
          </Card>

          <Card className="relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1" onClick={() => setOpenCard(openCard === 'avisNegatifs' ? null : 'avisNegatifs')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">{t("dashboard.negativeReviews")}</div>
                  <div className="text-2xl font-bold">{negativePct}%</div>
                  <div className="text-xs text-gray-400">{t("dashboard.negativeReviews")}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenCard(openCard === 'avisNegatifs' ? null : 'avisNegatifs'); }} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-red-50">
                {openCard === 'avisNegatifs' ? <ChevronUp className="w-3 h-3 text-red-600" /> : <ChevronDown className="w-3 h-3 text-red-600" />}
              </Button>
            </CardContent>
          </Card>

          
        </div>

        {/* Contenus dépliés des cartes de statistiques */}
        {/* Courbe de progression de la note */}
        {openCard === 'courbeNote' && <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    {t("dashboard.averageRatingEvolution")}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{t("dashboard.ratingProgressionDescription", { granularity: granularityEvolution })}</p>
                </div>
                <Select value={granularityEvolution} onValueChange={(value) => setGranularityEvolution(value as Granularity)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="jour">{t("dashboard.day")}</SelectItem>
                    <SelectItem value="semaine">{t("dashboard.week")}</SelectItem>
                    <SelectItem value="mois">{t("dashboard.month")}</SelectItem>
                    <SelectItem value="année">{t("dashboard.year")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {courbeNoteData.length > 0 ? (
                <>
                  {courbeNoteData.length < 2 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">{t("dashboard.limitedDataForGranularity")}</p>
                      <p className="text-xs text-gray-400 mt-1">{t("dashboard.selectWiderPeriodOrWait")}</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={courbeNoteData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mois" />
                            <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
                            <Tooltip formatter={value => [`${value}/5`, t("dashboard.averageRating")]} />
                            <Line type="monotone" dataKey="note" stroke="#eab308" strokeWidth={3} dot={{
                          fill: '#eab308',
                          strokeWidth: 2,
                          r: 4
                        }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-sm text-gray-500 mt-4">
                        {t("dashboard.registrationDate")}: {establishmentCreatedAt ? formatRegistrationDate(establishmentCreatedAt, i18n.language) : t("dashboard.unknown")}
                      </p>
                    </>
                  )}
                </>
              ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                  {t("dashboard.noDataForRatingEvolution")}
                </p>
              )}
            </CardContent>
          </Card>}

        {/* Pires avis */}
        {openCard === 'avisNegatifs' && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                {t("dashboard.top5WorstReviews")}
              </CardTitle>
              <p className="text-sm text-gray-600">{t("dashboard.worstReviewsDescription")}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {worstReviews.length > 0 ? (
                  worstReviews.map((avis, index) => (
                    <div key={avis.id} className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-red-700">#{index + 1}</span>
                          <span className="font-medium">{avis.author || t("dashboard.anonymous")}</span>
                          <span className="text-yellow-500">{'★'.repeat(Math.round(avis.rating || 0))}{'☆'.repeat(5 - Math.round(avis.rating || 0))}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{avis.source}</span>
                          <span className="text-xs text-gray-500">{formatReviewDate(avis.published_at)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 italic">"{extractOriginalText(avis.text) || t("dashboard.noComment")}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">{t("dashboard.noNegativeReviewsFound")}</p>
                )}
              </div>
            </CardContent>
          </Card>}

        {/* Meilleurs avis */}
        {openCard === 'avisPositifs' && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                {t("dashboard.top5BestReviews")}
              </CardTitle>
              <p className="text-sm text-gray-600">{t("dashboard.bestReviewsDescription")}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topReviews.length > 0 ? (
                  topReviews.map((avis, index) => (
                    <div key={avis.id} className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-700">#{index + 1}</span>
                          <span className="font-medium">{avis.author || t("dashboard.anonymous")}</span>
                          <span className="text-yellow-500">{'★'.repeat(Math.round(avis.rating || 0))}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{avis.source}</span>
                          <span className="text-xs text-gray-500">{formatReviewDate(avis.published_at)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 italic">"{extractOriginalText(avis.text) || t("dashboard.noComment")}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">{t("dashboard.noPositiveReviewsFound")}</p>
                )}
              </div>
            </CardContent>
          </Card>}

        {/* Plateformes connectées */}
        {openCard === 'plateformes' && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">{t("dashboard.connectedPlatforms")}</CardTitle>
              <p className="text-sm text-gray-600">{t("dashboard.managePlatformPresences")}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(platformStats).length > 0 ? (
                  Object.entries(platformStats).map(([source, stats]) => {
                    // Configuration des plateformes
                    const platformConfig: Record<string, { name: string; color: string; initial: string }> = {
                      google: { name: t("platforms.google"), color: 'bg-red-100 text-red-600', initial: 'G' },
                      yelp: { name: t("platforms.yelp"), color: 'bg-yellow-100 text-yellow-600', initial: 'Y' },
                      tripadvisor: { name: t("platforms.tripadvisor"), color: 'bg-green-100 text-green-600', initial: 'T' },
                      facebook: { name: t("platforms.facebook"), color: 'bg-blue-100 text-blue-600', initial: 'F' },
                    };
                    
                    const config = platformConfig[source.toLowerCase()] || { 
                      name: source.charAt(0).toUpperCase() + source.slice(1), 
                      color: 'bg-gray-100 text-gray-600', 
                      initial: source.charAt(0).toUpperCase() 
                    };
                    
                    return (
                      <div key={source} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                            <span className="font-bold">{config.initial}</span>
                          </div>
                          <div>
                            <div className="font-medium">{config.name}</div>
                            <div className="text-sm text-gray-500">
                              {t("dashboard.reviewsAndStars", { count: stats.count, rating: stats.avgRating.toFixed(1) })}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">{t("dashboard.connected")}</Badge>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">{t("dashboard.noPlatformConnected")}</p>
                    <p className="text-xs mt-1">{t("dashboard.analyzeEstablishmentToSeePlatforms")}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>}

        {/* Analyse par thématiques et Décryptage des avis */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1" onClick={() => setOpenCard(openCard === 'thematiques' ? null : 'thematiques')}>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5" style={{color: '#9234ea'}} />
                <p className="text-2xl font-bold" style={{color: '#9234ea'}}>78%</p>
              </div>
              <p className="text-sm text-gray-600">{t("dashboard.themesAnalysis")}</p>
              <p className="text-xs text-gray-500">{t("dashboard.reviewsDistributionByCategories")}</p>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenCard(openCard === 'thematiques' ? null : 'thematiques'); }} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-violet-50">
                {openCard === 'thematiques' ? <ChevronUp className="w-3 h-3 text-violet-700" /> : <ChevronDown className="w-3 h-3 text-violet-700" />}
              </Button>
            </CardContent>
          </Card>

          {/* Décryptage des avis */}
          <Card className="relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1" onClick={() => setOpenCard(openCard === 'analyseDetaillee' ? null : 'analyseDetaillee')}>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-[#5048e5]" />
                <p className="text-2xl font-bold text-[#5048e5]">{totalReviews}</p>
              </div>
              <p className="text-sm text-gray-600">{t("dashboard.reviewsDecryption")}</p>
              <p className="text-xs text-gray-500">{t("dashboard.completeDetailsRatingsThemes")}</p>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenCard(openCard === 'analyseDetaillee' ? null : 'analyseDetaillee'); }} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-blue-50">
                {openCard === 'analyseDetaillee' ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contenu Analyse par thématiques - EN DESSOUS, pleine largeur */}
        {openCard === 'thematiques' && (
          <Card className="mt-4 mb-8" id="thematiques-content">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {insight?.themes && insight.themes.length > 0 ? (
                  (() => {
                    const totalReviews = insight?.total_count || 1;
                    
                    // Calculer les pourcentages bruts
                    const themesWithPercentages = insight.themes.map((theme: any) => {
                      const themeCount = theme.count || 0;
                      const rawPercentage = (themeCount / totalReviews) * 100;
                      
                      // Calculer positifs et négatifs pour cette thématique
                      let positiveCount = 0;
                      let negativeCount = 0;
                      
                      if (theme.reviews && Array.isArray(theme.reviews)) {
                        theme.reviews.forEach((review: any) => {
                          const rating = review.rating || 0;
                          if (rating >= 4) positiveCount++;
                          else if (rating <= 2) negativeCount++;
                        });
                      } else {
                        const globalPositiveRatio = insight?.positive_ratio || 0.7;
                        positiveCount = Math.round(themeCount * globalPositiveRatio);
                        negativeCount = Math.round(themeCount * (1 - globalPositiveRatio));
                      }
                      
                      const totalCounted = positiveCount + negativeCount;
                      const positivePercent = totalCounted > 0 ? Math.round((positiveCount / totalCounted) * 100) : 0;
                      const negativePercent = totalCounted > 0 ? Math.round((negativeCount / totalCounted) * 100) : 0;
                      
                      return {
                        ...theme,
                        rawPercentage,
                        positivePercent,
                        negativePercent
                      };
                    });
                    
                    const totalPercentage = themesWithPercentages.reduce((sum: number, t: any) => sum + t.rawPercentage, 0);
                    
                    const themesNormalized = themesWithPercentages.map((theme: any) => ({
                      ...theme,
                      percentage: totalPercentage > 0 ? Math.round((theme.rawPercentage / totalPercentage) * 100) : 0
                    }));
                    
                    const getThemeIcon = (themeName: string) => {
                      const name = themeName.toLowerCase();
                      if (name.includes('cuisine') || name.includes('plat') || name.includes('nourriture')) {
                        return <UtensilsCrossed className="w-4 h-4 text-purple-500" />;
                      } else if (name.includes('service') || name.includes('personnel') || name.includes('accueil')) {
                        return <Users className="w-4 h-4 text-purple-500" />;
                      } else if (name.includes('ambiance') || name.includes('atmosphère') || name.includes('décor')) {
                        return <Wine className="w-4 h-4 text-purple-500" />;
                      } else if (name.includes('emplacement') || name.includes('localisation') || name.includes('lieu')) {
                        return <MapPin className="w-4 h-4 text-purple-500" />;
                      }
                      return <BarChart3 className="w-4 h-4 text-purple-500" />;
                    };

                    const SentimentBadges: React.FC<{ positivePct?: number; negativePct?: number; className?: string }> = ({ positivePct, negativePct, className }) => {
                      const clampPct = (n?: number) => {
                        if (typeof n !== "number" || isNaN(n)) return 0;
                        return Math.max(0, Math.min(100, Math.round(n)));
                      };
                      const p = clampPct(positivePct);
                      const n = clampPct(negativePct);
                      return (
                        <div className={`flex items-center gap-2 ${className ?? ""}`}>
                          <span
                            title={t("dashboard.positive")}
                            className="inline-flex items-center justify-center min-w-[48px] h-9 px-3 rounded-xl text-sm font-semibold shadow-sm bg-green-50 text-green-600"
                          >
                            {p}%
                          </span>
                          <span
                            title={t("dashboard.negative")}
                            className="inline-flex items-center justify-center min-w-[48px] h-9 px-3 rounded-xl text-sm font-semibold shadow-sm bg-red-50 text-red-600"
                          >
                            {n}%
                          </span>
                        </div>
                      );
                    };

                    return themesNormalized.map((theme: any, index: number) => (
                      <div key={index} className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getThemeIcon(theme.theme)}
                          <div className="flex-1">
                            <div className="font-medium">{translateTheme(theme.theme)}</div>
                            <div className="text-sm text-gray-500">{t("dashboard.percentageOfReviews", { percentage: theme.percentage })}</div>
                          </div>
                          <div className="ml-auto">
                            <SentimentBadges
                              positivePct={theme.positivePercent}
                              negativePct={theme.negativePercent}
                            />
                          </div>
                        </div>
                      </div>
                    ));
                  })()
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">{t("dashboard.noThemesIdentified")}</p>
                    <p className="text-xs mt-1">{t("dashboard.analyzeEstablishmentToSeeThemes")}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contenu Décryptage des avis - EN DESSOUS, pleine largeur */}
        {openCard === 'analyseDetaillee' && (
          <Card className="mt-4 mb-8">
            <CardContent>
              <div className="mt-6 space-y-8">
                {/* Répartition des avis par note */}
                <div>
                  <h4 className="font-semibold text-lg mb-4">Répartition des avis par note</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <span className="w-20 text-sm text-gray-600 font-medium">5 étoiles</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div className="bg-green-500 h-3 rounded-full" style={{width: '30%'}}></div>
                      </div>
                      <span className="text-sm text-gray-600 w-20 text-right">3 (30.0%)</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="w-20 text-sm text-gray-600 font-medium">4 étoiles</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div className="bg-green-500 h-3 rounded-full" style={{width: '40%'}}></div>
                      </div>
                      <span className="text-sm text-gray-600 w-20 text-right">4 (40.0%)</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="w-20 text-sm text-gray-600 font-medium">3 étoiles</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div className="bg-yellow-500 h-3 rounded-full" style={{width: '20%'}}></div>
                      </div>
                      <span className="text-sm text-gray-600 w-20 text-right">2 (20.0%)</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="w-20 text-sm text-gray-600 font-medium">2 étoiles</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div className="bg-red-500 h-3 rounded-full" style={{width: '10%'}}></div>
                      </div>
                      <span className="text-sm text-gray-600 w-20 text-right">1 (10.0%)</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="w-20 text-sm text-gray-600 font-medium">1 étoile</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div className="bg-gray-300 h-3 rounded-full" style={{width: '0%'}}></div>
                      </div>
                      <span className="text-sm text-gray-600 w-20 text-right">0 (0.0%)</span>
                    </div>
                  </div>
                </div>
                
                {/* Thématiques récurrentes */}
                <div>
                  <h4 className="font-semibold text-lg mb-4">Thématiques récurrentes</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-[#f0f3ff] rounded-lg px-4 py-3">
                      <span className="font-medium">Rapidité</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">8 mentions</span>
                        <span className="px-3 py-1 rounded-full border border-[#5048e5] text-[#5048e5] text-sm font-medium">80.0%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-[#f0f3ff] rounded-lg px-4 py-3">
                      <span className="font-medium">Cuisine</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">7 mentions</span>
                        <span className="px-3 py-1 rounded-full border border-[#5048e5] text-[#5048e5] text-sm font-medium">70.0%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-[#f0f3ff] rounded-lg px-4 py-3">
                      <span className="font-medium">Service / attente</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">6 mentions</span>
                        <span className="px-3 py-1 rounded-full border border-[#5048e5] text-[#5048e5] text-sm font-medium">60.0%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-[#f0f3ff] rounded-lg px-4 py-3">
                      <span className="font-medium">Ambiance agréable</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">5 mentions</span>
                        <span className="px-3 py-1 rounded-full border border-[#5048e5] text-[#5048e5] text-sm font-medium">50.0%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-[#f0f3ff] rounded-lg px-4 py-3">
                      <span className="font-medium">Prix</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">1 mention</span>
                        <span className="px-3 py-1 rounded-full border border-[#5048e5] text-[#5048e5] text-sm font-medium">10.0%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

          </>
        )}

        {activeTab === 'analyse' && (
          <>
        {/* Problèmes et Points forts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Problèmes prioritaires */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <CardTitle className="text-lg">{t("dashboard.top3PriorityProblems")}</CardTitle>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground cursor-pointer transition-transform ${showParetoChart ? 'rotate-180' : ''}`} onClick={() => setShowParetoChart(!showParetoChart)} />
              </div>
              <p className="text-sm text-gray-500">{t("dashboard.mostMentionedByFrequency")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasReviews ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm font-medium">{t("dashboard.noReviewsAvailable")}</p>
                  <p className="text-xs mt-1">{t("dashboard.importReviewsToSeeProblems")}</p>
                </div>
              ) : topIssues.length > 0 ? (
                topIssues.slice(0, 3).map((issue: any, index: number) => {
                  const severity = issue.severity || (index === 0 ? 'high' : index === 1 ? 'medium' : 'low');
                  const isCritical = severity === 'high';
                  const mentionCount = issue.count || issue.mentions || 0;
                  const percentage = totalAnalyzed > 0 && mentionCount > 0 
                    ? Math.round((mentionCount / totalAnalyzed) * 100) 
                    : 0;
                  
                  return (
                    <div key={index} className={`flex items-center justify-between p-3 ${isCritical ? 'bg-red-50' : 'bg-yellow-50'} rounded-lg`}>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-4 h-4 ${isCritical ? 'text-red-500' : 'text-yellow-600'}`} />
                        <div>
                          <div className="font-medium">{translateTheme(issue.theme || issue.issue || t("dashboard.unspecifiedProblem"))}</div>
                          <div className="text-sm text-gray-500">
                            {percentage > 0 ? t("dashboard.percentageOfReviews", { percentage }) : t("dashboard.identifiedByAI")}
                          </div>
                        </div>
                      </div>
                      <Badge variant={isCritical ? 'destructive' : 'default'} className={!isCritical ? 'bg-yellow-500 text-white' : ''}>
                        {isCritical ? t("dashboard.critical") : t("dashboard.medium")}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">{t("dashboard.noProblemsIdentified")}</p>
                  <p className="text-xs mt-1">{t("dashboard.analyzeEstablishmentToSeeProblems")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Points forts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <CardTitle className="text-lg">{t("dashboard.top3Strengths")}</CardTitle>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground cursor-pointer transition-transform ${showParetoPoints ? 'rotate-180' : ''}`} onClick={() => setShowParetoPoints(!showParetoPoints)} />
              </div>
              <p className="text-sm text-gray-500">{t("dashboard.mostMentionedStrengths")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasReviews ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm font-medium">{t("dashboard.noReviewsAvailable")}</p>
                  <p className="text-xs mt-1">{t("dashboard.importReviewsToSeeStrengths")}</p>
                </div>
              ) : topStrengths.length > 0 ? (
                topStrengths.slice(0, 3).map((strength: any, index: number) => {
                  const mentionCount = strength.count || strength.mentions || 0;
                  const percentage = totalAnalyzed > 0 && mentionCount > 0 
                    ? Math.round((mentionCount / totalAnalyzed) * 100) 
                    : 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div>
                          <div className="font-medium">{translateTheme(strength.theme || strength.strength || t("dashboard.unspecifiedStrength"))}</div>
                          <div className="text-sm text-gray-500">
                            {percentage > 0 ? t("dashboard.percentageOfReviews", { percentage }) : t("dashboard.identifiedByAI")}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-green-500 text-white">{t("dashboard.strength")}</Badge>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">{t("dashboard.noStrengthsIdentified")}</p>
                  <p className="text-xs mt-1">{t("dashboard.analyzeEstablishmentToSeeStrengths")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Diagramme de Pareto des Points Forts */}
        {showParetoPoints && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                {t("dashboard.paretoStrengths")}
              </CardTitle>
              <p className="text-sm text-gray-600">{t("dashboard.paretoStrengthsDescription")}</p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {(() => {
                  // Helper pour espaces insécables
                  const nbsp = (s: string) => s.split(" ").join("\u00A0");
                  
                  // Mapping couleurs pour points forts (identique aux autres graphiques)
                  const getStrengthColor = (name: string): string => {
                    const lowerName = name.toLowerCase();
                    if (lowerName.includes('qualité') || lowerName.includes('goût') || lowerName.includes('gout') || lowerName.includes('plat')) {
                      return 'hsl(142, 76%, 36%)'; // Vert
                    }
                    if (lowerName.includes('ambiance') || lowerName.includes('cadre') || lowerName.includes('décor')) {
                      return 'hsl(221, 83%, 53%)'; // Bleu
                    }
                    if (lowerName.includes('service') || lowerName.includes('accueil') || lowerName.includes('personnel')) {
                      return 'hsl(280, 65%, 60%)'; // Violet
                    }
                    if (lowerName.includes('rapport') || lowerName.includes('prix')) {
                      return 'hsl(45, 93%, 47%)'; // Jaune
                    }
                    return 'hsl(142, 76%, 36%)'; // Fallback vert
                  };
                  
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={paretoPointsData} margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60
                      }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                        <Tooltip 
                          cursor={false}
                          formatter={(value, name) => {
                            if (name === 'Cumulative') return [`${value}%`, t("dashboard.cumulativePercent")];
                            return [value, t("dashboard.positiveMentions")];
                          }} 
                        />
                        <Bar yAxisId="left" dataKey="count" name={t("dashboard.positiveMentions")}>
                          {paretoPointsData.map((entry: any, index: number) => (
                            <Cell key={`pareto-strength-${index}`} fill={getStrengthColor(entry.name)} />
                          ))}
                        </Bar>
                        <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="hsl(215, 16%, 47%)" strokeWidth={2} dot={{
                          fill: "hsl(215, 16%, 47%)",
                          strokeWidth: 2,
                          r: 4
                        }} name="Cumulative" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
              <p className="text-sm text-gray-500 mt-1 mb-0 leading-tight">{t("dashboard.barRepresentsStrengths")}</p>
              
              {/* Camembert + Barres - Répartition des points forts */}
              <div className="mt-2">
                <h4 className="text-sm font-medium text-gray-700 mb-3 mt-0">{t("dashboard.strengthsDistribution")}</h4>
                {(() => {
                  const strengthPieData = paretoPointsData.map((item: any) => ({
                    name: item.name,
                    value: item.count
                  }));
                  const strengthTotal = strengthPieData.reduce((sum: number, item: any) => sum + item.value, 0);
                  
                  // Helper pour espaces insécables
                  const nbsp = (s: string) => s.split(" ").join("\u00A0");
                  
                  // Mapping couleurs pour points forts: Vert (qualité), Bleu (ambiance), Violet (autre)
                  const getStrengthColor = (name: string): string => {
                    const lowerName = name.toLowerCase();
                    if (lowerName.includes('qualité') || lowerName.includes('goût') || lowerName.includes('gout') || lowerName.includes('plat')) {
                      return 'hsl(142, 76%, 36%)'; // Vert
                    }
                    if (lowerName.includes('ambiance') || lowerName.includes('cadre') || lowerName.includes('décor')) {
                      return 'hsl(221, 83%, 53%)'; // Bleu
                    }
                    if (lowerName.includes('service') || lowerName.includes('accueil') || lowerName.includes('personnel')) {
                      return 'hsl(280, 65%, 60%)'; // Violet
                    }
                    if (lowerName.includes('rapport') || lowerName.includes('prix')) {
                      return 'hsl(45, 93%, 47%)'; // Jaune
                    }
                    return 'hsl(142, 76%, 36%)'; // Fallback vert
                  };
                  
                  if (strengthTotal === 0) {
                    return (
                      <p className="text-sm text-gray-500 text-center py-4">
                        {t("dashboard.noDataForCharts")}
                      </p>
                    );
                  }
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Camembert */}
                      <div>
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={strengthPieData}
                              cx="50%"
                              cy="50%"
                              labelLine={{
                                stroke: 'currentColor',
                                strokeWidth: 1
                              }}
                              outerRadius={95}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ cx, cy, midAngle, outerRadius, name, percent }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = outerRadius + 30;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                const labelText = `${nbsp(name)}\u00A0(${(percent * 100).toFixed(0)}%)`;
                                const color = getStrengthColor(name);
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    fill={color}
                                    textAnchor={x > cx ? 'start' : 'end'}
                                    dominantBaseline="central"
                                    fontSize={10}
                                    fontWeight={500}
                                    style={{ whiteSpace: 'nowrap' }}
                                  >
                                    {labelText}
                                  </text>
                                );
                              }}
                            >
                              {strengthPieData.map((entry: any, index: number) => (
                                <Cell key={`strength-cell-${index}`} fill={getStrengthColor(entry.name)} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number, name: string) => {
                                const pct = strengthTotal > 0 ? ((value / strengthTotal) * 100).toFixed(1) : 0;
                                return [`${value} ${t("dashboard.mentions")} (${pct}%)`, name];
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Diagramme en barres verticales */}
                      <div>
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={strengthPieData} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
                            <XAxis 
                              dataKey="name" 
                              interval={0}
                              height={50}
                              tick={(props: any) => {
                                const { x, y, payload } = props;
                                const value = nbsp(String(payload?.value ?? ""));
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    dy={16}
                                    textAnchor="middle"
                                    fill="#6b7280"
                                    fontSize={9}
                                    style={{ pointerEvents: "none" }}
                                  >
                                    {value}
                                  </text>
                                );
                              }}
                            />
                            <YAxis hide />
                            <Tooltip 
                              cursor={false}
                              formatter={(value: number, name: string) => {
                                const pct = strengthTotal > 0 ? ((value / strengthTotal) * 100).toFixed(1) : 0;
                                return [`${value} ${t("dashboard.mentions")} (${pct}%)`, t("dashboard.mentions")];
                              }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 11, fill: 'hsl(var(--foreground))' }}>
                              {strengthPieData.map((entry: any, index: number) => (
                                <Cell key={`strength-bar-${index}`} fill={getStrengthColor(entry.name)} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Légende globale sous les graphiques */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(142, 76%, 36%)' }}></div>
                    <span className="text-muted-foreground">{t("charts.strengths.tasteQuality")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(221, 83%, 53%)' }}></div>
                    <span className="text-muted-foreground">{t("charts.strengths.niceAmbiance")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(280, 65%, 60%)' }}></div>
                    <span className="text-muted-foreground">{t("charts.strengths.friendlyStaff")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(45, 93%, 47%)' }}></div>
                    <span className="text-muted-foreground">{t("charts.strengths.valueForMoney")}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>}

        {/* Diagramme de Pareto */}
        {showParetoChart && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                {t("dashboard.paretoProblems")}
              </CardTitle>
              <p className="text-sm text-gray-600">{t("dashboard.paretoProblemsDescription")}</p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {(() => {
                  // Mapping couleurs par catégorie: Rouge (critique), Orange (important), Jaune (secondaire)
                  const getCategoryColor = (name: string): string => {
                    const lowerName = name.toLowerCase();
                    if (lowerName.includes('service') || lowerName.includes('attente') || lowerName.includes('lent')) {
                      return 'hsl(0, 84%, 60%)'; // Rouge
                    }
                    if (lowerName.includes('qualité') || lowerName.includes('plat') || lowerName.includes('qualite')) {
                      return 'hsl(25, 95%, 53%)'; // Orange
                    }
                    if (lowerName.includes('prix') || lowerName.includes('cher')) {
                      return 'hsl(45, 93%, 47%)'; // Jaune
                    }
                    return 'hsl(0, 84%, 60%)'; // Fallback rouge
                  };
                  
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={paretoData} margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60
                      }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                        <Tooltip formatter={(value, name) => {
                          if (name === 'Cumulative') return [`${value}%`, t("dashboard.cumulativePercent")];
                          return [value, t("dashboard.occurrences")];
                        }} />
                        <Bar yAxisId="left" dataKey="count" name={t("dashboard.occurrences")}>
                          {paretoData.map((entry: any, index: number) => (
                            <Cell key={`pareto-cell-${index}`} fill={getCategoryColor(entry.name)} />
                          ))}
                        </Bar>
                        <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" strokeWidth={2} dot={{
                          fill: "hsl(var(--primary))",
                          strokeWidth: 2,
                          r: 4
                        }} name="Cumulative" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
              <p className="text-sm text-gray-500 mt-1 mb-0 leading-tight">{t("dashboard.barRepresentsProblems")}</p>
              
              {/* Camembert + Barres - Répartition des problèmes */}
              <div className="mt-2">
                <h4 className="text-sm font-medium text-gray-700 mb-3 mt-0">{t("dashboard.problemsDistribution")}</h4>
                {(() => {
                  const pieData = paretoData.map((item: any) => ({
                    name: item.name,
                    value: item.count
                  }));
                  const total = pieData.reduce((sum: number, item: any) => sum + item.value, 0);
                  
                  // Helper pour espaces insécables (empêche les retours à la ligne)
                  const nbsp = (s: string) => s.split(" ").join("\u00A0");
                  
                  // Mapping couleurs par catégorie: Rouge (critique), Orange (important), Jaune (secondaire)
                  const getCategoryColor = (name: string): string => {
                    const lowerName = name.toLowerCase();
                    if (lowerName.includes('service') || lowerName.includes('attente')) {
                      return 'hsl(0, 84%, 60%)'; // Rouge
                    }
                    if (lowerName.includes('qualité') || lowerName.includes('plat')) {
                      return 'hsl(25, 95%, 53%)'; // Orange
                    }
                    if (lowerName.includes('prix')) {
                      return 'hsl(45, 93%, 47%)'; // Jaune
                    }
                    // Fallback pour autres catégories
                    return 'hsl(0, 84%, 60%)';
                  };
                  
                  if (total === 0) {
                    return (
                      <p className="text-sm text-gray-500 text-center py-4">
                        {t("dashboard.noDataForCharts")}
                      </p>
                    );
                  }
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Camembert */}
                      <div>
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              labelLine={{
                                stroke: 'currentColor',
                                strokeWidth: 1
                              }}
                              outerRadius={95}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ cx, cy, midAngle, outerRadius, name, percent }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = outerRadius + 30;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                const labelText = `${nbsp(name)}\u00A0(${(percent * 100).toFixed(0)}%)`;
                                const color = getCategoryColor(name);
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    fill={color}
                                    textAnchor={x > cx ? 'start' : 'end'}
                                    dominantBaseline="central"
                                    fontSize={10}
                                    fontWeight={500}
                                    style={{ whiteSpace: 'nowrap' }}
                                  >
                                    {labelText}
                                  </text>
                                );
                              }}
                            >
                              {pieData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number, name: string) => {
                                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return [`${value} ${t("dashboard.occurrences")} (${pct}%)`, name];
                              }}
                            />
                            
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Diagramme en barres verticales */}
                      <div>
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={pieData} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
                            <XAxis 
                              dataKey="name" 
                              interval={0}
                              height={50}
                              tick={(props: any) => {
                                const { x, y, payload } = props;
                                const value = nbsp(String(payload?.value ?? ""));
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    dy={16}
                                    textAnchor="middle"
                                    fill="#6b7280"
                                    fontSize={9}
                                    style={{ pointerEvents: "none" }}
                                  >
                                    {value}
                                  </text>
                                );
                              }}
                            />
                            <YAxis hide />
                            <Tooltip 
                              cursor={false}
                              formatter={(value: number, name: string) => {
                                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return [`${value} ${t("dashboard.occurrences")} (${pct}%)`, t("dashboard.occurrences")];
                              }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 11, fill: 'hsl(var(--foreground))' }}>
                              {pieData.map((entry: any, index: number) => (
                                <Cell key={`bar-${index}`} fill={getCategoryColor(entry.name)} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Légende globale sous les graphiques */}
                <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(0, 84%, 60%)' }}></div>
                    <span className="text-muted-foreground">{t("charts.problems.serviceWait")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(25, 95%, 53%)' }}></div>
                    <span className="text-muted-foreground">{t("charts.problems.foodQuality")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(45, 93%, 47%)' }}></div>
                    <span className="text-muted-foreground">{t("charts.problems.price")}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>}
          </>
        )}

        {activeTab === 'recommandations' && (
          <>
        {/* LIGNE 1 : 2 sections pour Recommandations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Recommandations */}
          <Card className="relative h-full flex flex-col cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1" onClick={() => setOpenCard(openCard === 'recommandations' ? null : 'recommandations')}>
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center mb-2">
                <Lightbulb className="w-5 h-5 text-blue-500 mb-2" />
                <span className="text-lg font-semibold">{t("dashboard.actionableRecommendations")}</span>
              </div>
              <p className="text-sm text-gray-600">{t("dashboard.concreteActions")}</p>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenCard(openCard === 'recommandations' ? null : 'recommandations'); }} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-blue-50">
                {openCard === 'recommandations' ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />}
              </Button>
            </CardContent>
          </Card>

          {/* Checklist opérationnelle */}
          <Card className="relative h-full flex flex-col cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1" onClick={() => setOpenCard(openCard === 'checklist' ? null : 'checklist')}>
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center mb-2">
                <ClipboardList className="w-5 h-5 text-emerald-600 mb-2" />
                <span className="text-lg font-semibold">{t("dashboard.operationalChecklist")}</span>
              </div>
              <p className="text-sm text-gray-600">{t("dashboard.concreteActions")}</p>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenCard(openCard === 'checklist' ? null : 'checklist'); }} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-emerald-50">
                {openCard === 'checklist' ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contenu des sections - Affichés en dessous de la grille */}
        {openCard === 'recommandations' && <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">{t("dashboard.actionableRecommendations")}</CardTitle>
            <p className="text-sm text-gray-600">{t("dashboard.concreteActions")}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Section 1 - Checklist opérationnelle */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">{t("dashboard.operationalChecklist")}</h4>
                <div className="space-y-3">
                  {/* Action prioritaire */}
                  <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-red-500 text-white text-xs">{t("dashboard.priorityAction")}</Badge>
                    </div>
                    <p className="text-sm text-gray-700">
                      {topIssues.length > 0 
                        ? t("dashboard.fixMainFrictionPoint", { issue: translateTheme(topIssues[0]?.theme || topIssues[0]?.issue || t("dashboard.notIdentified")) })
                        : t("dashboard.analyzeReviewsToIdentifyFrictionPoints")}
                    </p>
                  </div>
                  
                  {/* Court terme */}
                  <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-yellow-500 text-white text-xs">{t("dashboard.shortTerm")}</Badge>
                    </div>
                    <ul className="space-y-2">
                      <li className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        {t("dashboard.trainTeamOnIdentifiedImprovements")}
                      </li>
                      <li className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        {topStrengths.length > 0 
                          ? t("dashboard.enhanceStrengths", { strength: translateTheme(topStrengths[0]?.theme || topStrengths[0]?.strength || t("dashboard.notIdentified")) })
                          : t("dashboard.identifyAndEnhanceExistingStrengths")}
                      </li>
                    </ul>
                  </div>
                  
                  {/* Gestion des avis */}
                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-500 text-white text-xs">{t("dashboard.reviewManagement")}</Badge>
                    </div>
                    <ul className="space-y-2">
                      <li className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        {t("dashboard.respondSystematically")}
                      </li>
                      <li className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        {t("dashboard.setUpRegularTracking")}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Séparateur visuel */}
              <div className="border-t border-gray-200"></div>

              {/* Section 2 - Priorisation des actions */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">{t("dashboard.actionPrioritization")}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("dashboard.action")}</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">{t("dashboard.impact")}</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">{t("dashboard.effort")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-700">{t("dashboard.fixMainFrictionPointIdentified")}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-red-100 text-red-700 border-red-200">{t("dashboard.high")}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t("dashboard.medium")}</Badge>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-700">{t("dashboard.trainTeamOnIdentifiedImprovements")}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t("dashboard.medium")}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-green-100 text-green-700 border-green-200">{t("dashboard.low")}</Badge>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-700">{t("dashboard.respondSystematically")}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t("dashboard.medium")}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-green-100 text-green-700 border-green-200">{t("dashboard.low")}</Badge>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-700">{t("dashboard.enhanceStrengthsGeneric")}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t("dashboard.medium")}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-green-100 text-green-700 border-green-200">{t("dashboard.low")}</Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-500 mt-4 italic">
                  {t("dashboard.recommendedStartHighImpactLowEffort")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>}

        {openCard === 'checklist' && <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{t("dashboard.operationalChecklist")}</CardTitle>
                <p className="text-sm text-gray-600">{t("dashboard.concreteActions")}</p>
              </div>
              {completedActionsCount > 0 && (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  {completedActionsCount} {completedActionsCount === 1 ? 'action complétée' : 'actions complétées'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checklistActions.length > 0 ? (
                checklistActions.map((action) => (
                  <div
                    key={action.id}
                    className={`flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 transition-all duration-300 ${
                      removingActionId === action.id 
                        ? 'opacity-0 transform scale-95 -translate-x-4' 
                        : 'opacity-100 transform scale-100 translate-x-0'
                    } hover:bg-gray-50`}
                  >
                    <button
                      onClick={() => handleChecklistActionComplete(action.id)}
                      className="mt-0.5 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                      aria-label={`Marquer "${action.text}" comme complétée`}
                    >
                      {action.completed ? (
                        <CheckSquare className="w-5 h-5 text-green-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                    <span className={`text-sm flex-1 ${action.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {action.text}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">{t("dashboard.noChecklistActionsAvailable") || "Aucune action disponible"}</p>
                  <p className="text-xs mt-1">{t("dashboard.analyzeEstablishmentToGetActions") || "Analysez votre établissement pour obtenir des actions personnalisées"}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>}



        {/* LIGNE 2 : 2 sections côte à côte */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Conseiller */}
          <Card className="relative h-full flex flex-col cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1" onClick={() => setOpenCard(openCard === 'conseiller' ? null : 'conseiller')}>
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center mb-2">
                <Lightbulb className="w-5 h-5 text-yellow-500 mb-2" />
                <span className="text-lg font-semibold">{t("dashboard.advisor")}</span>
                      </div>
              <p className="text-sm text-gray-600">{t("dashboard.personalizedAdviceForEstablishment")}</p>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenCard(openCard === 'conseiller' ? null : 'conseiller'); }} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-yellow-50">
                {openCard === 'conseiller' ? <ChevronUp className="w-3 h-3 text-yellow-500" /> : <ChevronDown className="w-3 h-3 text-yellow-500" />}
              </Button>
            </CardContent>
          </Card>

          {/* Plan d'actions */}
          <Card className="relative h-full flex flex-col cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1" onClick={() => setOpenCard(openCard === 'planActions' ? null : 'planActions')}>
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center mb-2">
                <ClipboardList className="w-5 h-5 text-indigo-500 mb-2" />
                <span className="text-lg font-semibold">{t("dashboard.actionPlan")}</span>
                        </div>
              <p className="text-sm text-gray-600">{t("dashboard.followImprovementActions")}</p>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenCard(openCard === 'planActions' ? null : 'planActions'); }} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-indigo-50">
                {openCard === 'planActions' ? <ChevronUp className="w-3 h-3 text-indigo-500" /> : <ChevronDown className="w-3 h-3 text-indigo-500" />}
              </Button>
          </CardContent>
          </Card>
              </div>

        {/* Contenu Conseiller */}
        {openCard === 'conseiller' && <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">{t("dashboard.advisor")}</CardTitle>
            <p className="text-sm text-gray-600">{t("dashboard.personalizedAdviceForEstablishment")}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Conseils générés dynamiquement par le consultant */}
              {(() => {
                const consultantAdvice = generateConsultantAdvice(insight, allReviewsForChart, validatedReviews);
                
                if (consultantAdvice.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">{t("dashboard.noAdviceAvailable") || "Aucun conseil disponible"}</p>
                      <p className="text-xs mt-1">{t("dashboard.analyzeEstablishmentToGetAdvice") || "Analysez votre établissement pour obtenir des conseils personnalisés"}</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {consultantAdvice.map((advice, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-900 flex-1 leading-relaxed">{advice}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Message d'information */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-600">
                  {t("dashboard.advisorDescription") || "Conseils personnalisés basés sur l'analyse de vos avis clients"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>}

        {/* Contenu Plan d'actions */}
        {openCard === 'planActions' && <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">{t("dashboard.actionPlan")}</CardTitle>
            <p className="text-sm text-gray-600">{t("dashboard.followImprovementActions")}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Liste des actions générées dynamiquement */}
              {(() => {
                const actionPlan = generateActionPlan(insight, allReviewsForChart);
                
                if (actionPlan.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">{t("dashboard.noActionsAvailable") || "Aucune action disponible"}</p>
                      <p className="text-xs mt-1">{t("dashboard.analyzeEstablishmentToGetActions") || "Analysez votre établissement pour obtenir des actions personnalisées"}</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {actionPlan.map((action, index) => {
                      // Déterminer le style du badge de priorité
                      const priorityBadgeClass = action.priority === 'high' 
                        ? 'bg-red-100 text-red-800 border-red-300' 
                        : action.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300';
                      
                      // Déterminer le style du badge de statut
                      const statusBadgeClass = action.status === 'completed'
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : action.status === 'inProgress'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        : 'border-gray-300 text-gray-700';
                      
                      const statusLabel = action.status === 'completed'
                        ? t("dashboard.completed")
                        : action.status === 'inProgress'
                        ? t("dashboard.inProgress")
                        : t("dashboard.toDo");

                      const priorityLabel = action.priority === 'high'
                        ? t("dashboard.highPriority")
                        : action.priority === 'medium'
                        ? t("dashboard.mediumPriority")
                        : t("dashboard.lowPriority");

                      return (
                        <div key={index} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 mb-1">{action.title}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className={`text-xs ${priorityBadgeClass}`}>
                                  {priorityLabel}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {translateTheme(action.issue)}
                                </span>
                              </div>
                            </div>
                            <Badge 
                              variant={action.status === 'completed' ? 'default' : 'outline'} 
                              className={`text-xs ${statusBadgeClass}`}
                            >
                              {statusLabel}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Message d'information */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-600">
                  {t("dashboard.actionPlanDescription")}
                </p>
              </div>
            </div>
            </CardContent>
        </Card>}

        {/* Agent */}
        <Card className="relative h-full flex flex-col cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 mb-8" onClick={() => setOpenCard(openCard === 'agent' ? null : 'agent')}>
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center mb-2">
              <Bot className="w-5 h-5 text-purple-500 mb-2" />
              <span className="text-lg font-semibold">Agent</span>
                          </div>
            <p className="text-sm text-gray-600">Assistant IA pour répondre à vos avis</p>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenCard(openCard === 'agent' ? null : 'agent'); }} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-purple-50">
              {openCard === 'agent' ? <ChevronUp className="w-3 h-3 text-purple-500" /> : <ChevronDown className="w-3 h-3 text-purple-500" />}
            </Button>
          </CardContent>
        </Card>

        {/* Contenu Agent */}
        {openCard === 'agent' && <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Agent</CardTitle>
            <p className="text-sm text-gray-600">Assistant IA pour répondre à vos avis</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-700">
                  L'agent IA analyse automatiquement vos avis et génère des réponses personnalisées adaptées à chaque situation.
                  </p>
                </div>
                <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <Bot className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Réponses automatiques intelligentes</p>
                    <p className="text-xs text-gray-600 mt-1">Génération de réponses adaptées au ton et au contenu de chaque avis</p>
                    </div>
                    </div>
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <Bot className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Personnalisation avancée</p>
                    <p className="text-xs text-gray-600 mt-1">Adaptation du style et du contenu selon le type d'avis (positif, négatif, neutre)</p>
                    </div>
                    </div>
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <Bot className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                    <p className="text-sm font-medium text-gray-900">Validation avant envoi</p>
                    <p className="text-xs text-gray-600 mt-1">Vous pouvez modifier et valider chaque réponse avant de la publier</p>
                </div>
              </div>
              </div>
            </div>
          </CardContent>
        </Card>}
          </>
        )}

        {activeTab === 'reponses' && (
          <>
        {/* Réponse automatique */}
        <div ref={reponseAutomatiqueRef}>
          <Card className="mb-8">
          <CardHeader>
              <CardTitle className="text-xl">{t("dashboard.autoResponse")}</CardTitle>
              <p className="text-sm text-gray-600">{t("dashboard.automatedSystemForReviews")}</p>
          </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mode file d'attente : afficher un seul avis à la fois */}
                {(() => {
                  // Utiliser l'avis sélectionné s'il existe, sinon utiliser l'avis par défaut
                  const reviewToDisplay = selectedReviewForReply || (pendingReviews.length > 0 ? pendingReviews[currentReviewIndex] : null);
                  if (!reviewToDisplay) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-gray-500">{t("dashboard.noPendingReviews")}</p>
                      </div>
                    );
                  }
                  
                  const review = reviewToDisplay;
                    
                    const rating = review.rating || 0;
                    const isPositive = rating >= 4;
                    const authorName = review.author || t("dashboard.anonymous");
                    const reviewText = extractOriginalText(review.text) || t("dashboard.noComment");
                    const reviewId = review.id || `review-${currentReviewIndex}`;
                    
                    // Fonction pour générer une réponse IA personnalisée
                    const generateAiResponse = async (reviewId: string) => {
                      setIsGeneratingResponse(prev => ({ ...prev, [reviewId]: true }));
                      
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session?.access_token) {
                          toast.error(t("auth.sessionExpired"), {
                            description: t("auth.pleaseReconnect"),
                          });
                          return;
                        }

                        const response = await fetch(
                          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-review-response`,
                          {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${session.access_token}`,
                            },
                            body: JSON.stringify({
                              review: {
                                text: extractOriginalText(review.text) || review.text,
                                rating: review.rating,
                                author: review.author || review.author_name,
                                published_at: review.published_at,
                                language: review.language || review.language_code,
                              },
                              establishment: {
                                name: selectedEtab?.name || selectedEstablishment?.name || 'votre établissement',
                                formatted_address: selectedEtab?.address || selectedEstablishment?.formatted_address || '',
                                category: 'restaurant',
                                city: '',
                              },
                            }),
                          }
                        );

                        const data = await response.json();

                        if (!response.ok) {
                          if (response.status === 429) {
                            toast.error(t("dashboard.tooManyRequests"), {
                              description: t("dashboard.waitBeforeRetry"),
                            });
                          } else if (response.status === 402) {
                            toast.error(t("dashboard.insufficientCredits"), {
                              description: t("dashboard.reloadAICredits"),
                            });
                          } else {
                            toast.error(t("common.error"), {
                              description: data.error || t("dashboard.cannotGenerateResponse"),
                            });
                          }
                          return;
                        }

                        if (data.response) {
                          setAiGeneratedResponses(prev => ({ ...prev, [reviewId]: data.response }));
                          setEditedResponses(prev => ({ ...prev, [reviewId]: data.response }));
                          toast.success(t("dashboard.responseGenerated"), {
                            description: t("dashboard.canModifyBeforeValidate"),
                          });
                        }
                      } catch (error) {
                        console.error('Erreur génération réponse IA:', error);
                        toast.error(t("common.error"), {
                          description: t("dashboard.generationError"),
                        });
                      } finally {
                        setIsGeneratingResponse(prev => ({ ...prev, [reviewId]: false }));
                      }
                    };
                    
                    // Réponse par défaut simple (utilisée uniquement si aucune réponse IA n'a été générée)
                    const defaultResponse = isPositive
                      ? t("dashboard.defaultPositiveResponse", { name: authorName.split(' ')[0] })
                      : t("dashboard.defaultNegativeResponse", { name: authorName.split(' ')[0] });
                    
                    const currentResponse = editedResponses[reviewId] || aiGeneratedResponses[reviewId] || defaultResponse;
                    const isEditing = editingReviewId === reviewId;
                    const hasAiResponse = !!aiGeneratedResponses[reviewId];
                    const isGenerating = isGeneratingResponse[reviewId];
                    
                    return (
                      <div key={reviewId} className="border rounded-lg p-4 bg-gray-50 transition-all duration-300">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{authorName}</span>
                            <div className="flex items-center ml-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star 
                                  key={star} 
                                  className={`w-3 h-3 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                          </div>
                          <Badge variant="outline" className={isPositive ? "text-green-600 border-green-600" : "text-orange-600 border-orange-600"}>
                            {t("dashboard.toValidate")}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">"{reviewText.substring(0, 150)}{reviewText.length > 150 ? '...' : ''}"</p>
                        <div className="bg-white border-l-4 border-purple-500 p-3 rounded">
                          <p className="text-sm text-gray-600 font-medium mb-1">{t("dashboard.proposedAutomaticResponse")}:</p>
                          {isEditing ? (
                            <textarea
                              value={currentResponse}
                              onChange={(e) => setEditedResponses(prev => ({ ...prev, [reviewId]: e.target.value }))}
                              className="w-full text-sm text-gray-700 border rounded p-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <p className="text-sm text-gray-700">{currentResponse}</p>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3 items-center justify-between">
                          <div className="flex gap-2">
                            {isEditing ? (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => setEditingReviewId(null)}
                                >
                                  {t("common.save")}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setEditedResponses(prev => {
                                      const newResponses = { ...prev };
                                      delete newResponses[reviewId];
                                      return newResponses;
                                    });
                                    setEditingReviewId(null);
                                  }}
                                >
                                  {t("common.cancel")}
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-purple-600 text-purple-600 hover:bg-purple-50"
                                  disabled={isGenerating}
                                  onClick={() => generateAiResponse(reviewId)}
                                >
                                  {isGenerating ? (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      {t("dashboard.generating")}
                                    </>
                                  ) : hasAiResponse ? (
                                    <>
                                      <Lightbulb className="w-3 h-3 mr-1" />
                                      {t("dashboard.regenerateWithAI")}
                                    </>
                                  ) : (
                                    <>
                                      <Lightbulb className="w-3 h-3 mr-1" />
                                      {t("dashboard.generateWithAI")}
                                    </>
                                  )}
                                </Button>
                                 <Button 
                                  size="sm" 
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  disabled={isValidatingReview[reviewId]}
                                  onClick={async () => {
                                    try {
                                      if (!user?.id || !selectedEtab?.place_id) {
                                        toast.error(t("common.error"), {
                                          description: t("dashboard.userOrEstablishmentNotDefined"),
                                          duration: 4000
                                        });
                                        return;
                                      }
                                      
                                      setIsValidatingReview(prev => ({ ...prev, [reviewId]: true }));
                                      
                                      // Utiliser le module reponses.ts avec les bons paramètres
                                      await validateReponse({
                                        avisId: reviewId.toString(),
                                        contenu: currentResponse,
                                        etablissementId: selectedEtab.place_id,
                                        userId: user.id
                                      });
                                      
                                      // Recharger les réponses validées depuis la base de données
                                      const { data: responsesData } = await supabase
                                        .from('reponses')
                                        .select('avis_id')
                                        .eq('etablissement_id', selectedEtab.place_id)
                                        .eq('user_id', user.id)
                                        .eq('statut', 'valide');
                                      
                                      if (responsesData) {
                                        const validatedSet = new Set(responsesData.map(r => parseInt(r.avis_id)));
                                        setValidatedReviews(validatedSet);
                                      } else {
                                        // Marquer comme validée localement en fallback
                                      setValidatedReviews(prev => new Set([...prev, reviewId]));
                                      }
                                      
                                      // Afficher le toast de succès
                                      toast.success(t("dashboard.responseValidatedAndSaved"), {
                                        description: t("dashboard.responseSavedSuccess"),
                                        duration: 3000
                                      });
                                      
                                      // Déclencher l'événement pour mettre à jour le compteur
                                      window.dispatchEvent(new CustomEvent('response-validated', {
                                        detail: { placeId: selectedEtab.place_id }
                                      }));
                                      
                                      // Mettre à jour les statistiques des réponses
                                      if (selectedEtab?.place_id && user?.id) {
                                        const stats = await getReponsesStats(selectedEtab.place_id, user.id);
                                        setReponsesStats(stats);
                                      }
                                      
                                      // Recalculer les avis en attente
                                      const updatedReviews = allReviewsForChart;
                                      const { data: updatedResponsesData } = await supabase
                                        .from('reponses')
                                        .select('avis_id')
                                        .eq('etablissement_id', selectedEtab.place_id)
                                        .eq('user_id', user.id)
                                        .eq('statut', 'valide');
                                      
                                      if (updatedResponsesData) {
                                        const updatedValidatedSet = new Set(updatedResponsesData.map(r => parseInt(r.avis_id)));
                                        const pending = updatedReviews.filter(review => {
                                          const hasValidatedResponse = updatedValidatedSet.has(review.id);
                                          const hasOwnerReply = !!(review.owner_reply_text && review.owner_reply_text.trim());
                                          const hasRespondedAt = !!review.responded_at;
                                          return !hasValidatedResponse && !hasOwnerReply && !hasRespondedAt;
                                        });
                                        setPendingReviews(pending);
                                      }
                                      
                                      // LOGIQUE FILE D'ATTENTE : passer au prochain avis
                                      // Retirer l'avis validé de la liste
                                      setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
                                      
                                      // Si on a retiré l'avis et qu'il reste d'autres avis, on garde le même index
                                      // (l'avis suivant prendra la place de celui qu'on vient de retirer)
                                      // Sinon, réinitialiser l'index à 0
                                      if (pendingReviews.length - 1 === 0) {
                                        setCurrentReviewIndex(0);
                                      } else if (currentReviewIndex >= pendingReviews.length - 1) {
                                        // Si on était sur le dernier, revenir au premier
                                        setCurrentReviewIndex(0);
                                      }
                                      // Sinon, on garde currentReviewIndex inchangé car le suivant prend la place
                                      
                                      // Réinitialiser l'avis sélectionné après validation
                                      setSelectedReviewForReply(null);
                                      
                                    } catch (error: any) {
                                      console.error('validateReponse', error);
                                      toast.error(t("dashboard.saveFailed"), {
                                        description: error.message || t("common.error"),
                                        duration: 4000
                                      });
                                    } finally {
                                      setIsValidatingReview(prev => ({ ...prev, [reviewId]: false }));
                                    }
                                  }}
                                >
                                  {isValidatingReview[reviewId] ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                      {t("dashboard.validating")}
                                    </>
                                  ) : (
                                    t("dashboard.validate")
                                  )}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setEditingReviewId(reviewId);
                                    if (!editedResponses[reviewId]) {
                                      setEditedResponses(prev => ({ ...prev, [reviewId]: defaultResponse }));
                                    }
                                    // Réinitialiser l'avis sélectionné quand on édite
                                    setSelectedReviewForReply(null);
                                  }}
                                >
                                  {t("common.edit")}
                                </Button>
                              </>
                            )}
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              navigator.clipboard.writeText(currentResponse);
                              toast.success(t("common.copied"), {
                                description: t("dashboard.responseCopiedToClipboard"),
                              });
                            }}
                            title={t("dashboard.copyResponse")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        {hasAiResponse && (
                          <div className="mt-3 text-green-600 text-sm flex items-center gap-1">
                            ✅ {t("dashboard.responseGenerated")} — {t("dashboard.canModifyBeforeValidate")}
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Centre de réponse */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          {/* En-tête */}
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Centre de réponse</h2>
              <p className="text-sm text-gray-600">Gérez vos réponses aux avis clients</p>
            </div>
          </div>

            {/* Cartes récapitulatives */}
            <div className="flex gap-4 mb-6">
              {/* Carte En attente */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md flex-1 ${statusFilter === 'pending' ? 'border-2 border-orange-500 bg-orange-50' : ''}`}
                onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
              >
                <CardContent className="flex items-center px-4 py-3">
                  <Clock className="w-8 h-8 text-orange-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">En attente</p>
                    <p className="text-2xl font-bold">{pendingReviews.length}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Carte Répondu */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md flex-1 ${statusFilter === 'replied' ? 'border-2 border-green-500 bg-green-50' : ''}`}
                onClick={() => setStatusFilter(statusFilter === 'replied' ? 'all' : 'replied')}
              >
                <CardContent className="flex items-center px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mr-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Répondu</p>
                    <p className="text-2xl font-bold">
                      {allReviewsForChart.filter(review => {
                        const hasValidatedResponse = validatedReviews.has(review.id);
                        const hasOwnerReply = !!(review.owner_reply_text && review.owner_reply_text.trim());
                        const hasRespondedAt = !!review.responded_at;
                        return hasValidatedResponse || hasOwnerReply || hasRespondedAt;
                      }).length}
                  </p>
                </div>
                </CardContent>
              </Card>

              {/* Carte récapitulative */}
              <Card className="cursor-pointer transition-all hover:shadow-md flex-1">
                <CardContent className="flex items-center px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mr-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {allReviewsForChart.filter(review => {
                        const hasValidatedResponse = validatedReviews.has(review.id);
                        const hasOwnerReply = !!(review.owner_reply_text && review.owner_reply_text.trim());
                        const hasRespondedAt = !!review.responded_at;
                        return hasValidatedResponse || hasOwnerReply || hasRespondedAt;
                      }).length}/{allReviewsForChart.length} réponses
                    </p>
                    <p className="text-sm text-gray-500">Validées</p>
                </div>
                </CardContent>
              </Card>
              </div>

            {/* Cartes Contenu, Note, Priorité et Plateforme */}
            <div className="flex gap-4 mb-6">
              {/* Carte Contenu */}
              <Card className="relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 flex-1" onClick={() => setOpenCard(openCard === 'contenu' ? null : 'contenu')}>
              <CardContent className="p-6">
                {/* En-tête */}
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Analyse du contenu</h3>
                    <p className="text-sm text-gray-600">Classification IA des avis</p>
              </div>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenCard(openCard === 'contenu' ? null : 'contenu'); }} className="h-6 w-6 p-0 hover:bg-purple-50">
                    {openCard === 'contenu' ? <ChevronUp className="w-4 h-4 text-purple-600" /> : <ChevronDown className="w-4 h-4 text-purple-600" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

              {/* Carte Note */}
              <Card className="relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 flex-1" onClick={() => setOpenCard(openCard === 'note' ? null : 'note')}>
                <CardContent className="p-6">
                  {/* En-tête */}
                  <div className="flex items-center gap-3">
                    <Star className="w-6 h-6 text-yellow-600" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">Filtrer par note</h3>
                      <p className="text-sm text-gray-600">Avis classés par étoiles</p>
                </div>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenCard(openCard === 'note' ? null : 'note'); }} className="h-6 w-6 p-0 hover:bg-yellow-50">
                      {openCard === 'note' ? <ChevronUp className="w-4 h-4 text-yellow-600" /> : <ChevronDown className="w-4 h-4 text-yellow-600" />}
                    </Button>
                </div>
                </CardContent>
              </Card>

              {/* Carte Priorité */}
              <Card className="relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 flex-1" onClick={() => setOpenCard(openCard === 'priorite' ? null : 'priorite')}>
                <CardContent className="p-6">
                  {/* En-tête */}
                  <div className="flex items-center gap-3">
                    <Flag className="w-6 h-6 text-red-600" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">Priorité</h3>
                      <p className="text-sm text-gray-600">Avis classés par urgence</p>
                </div>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenCard(openCard === 'priorite' ? null : 'priorite'); }} className="h-6 w-6 p-0 hover:bg-red-50">
                      {openCard === 'priorite' ? <ChevronUp className="w-4 h-4 text-red-600" /> : <ChevronDown className="w-4 h-4 text-red-600" />}
                    </Button>
              </div>
                </CardContent>
              </Card>

              {/* Carte Plateforme */}
              <Card className="relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 flex-1" onClick={() => setOpenCard(openCard === 'plateforme' ? null : 'plateforme')}>
                <CardContent className="p-6">
                  {/* En-tête */}
                  <div className="flex items-center gap-3">
                    <Globe className="w-6 h-6 text-blue-600" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">Plateforme</h3>
                      <p className="text-sm text-gray-600">Avis classés par source</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenCard(openCard === 'plateforme' ? null : 'plateforme'); }} className="h-6 w-6 p-0 hover:bg-blue-50">
                      {openCard === 'plateforme' ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </div>

            {/* Contenu déplié des cartes */}




            {/* Tableau des avis - Toujours visible */}
            <div className="space-y-6">
              {/* Helper function pour déterminer si un avis est "replied" */}
              {(() => {
                const isReviewReplied = (review: any) => {
                  const hasValidatedResponse = validatedReviews.has(review.id);
                  const hasOwnerReply = !!(review.owner_reply_text && review.owner_reply_text.trim());
                  const hasRespondedAt = !!review.responded_at;
                  return hasValidatedResponse || hasOwnerReply || hasRespondedAt;
                };

                // Filtrer les avis selon le filtre actif
                const filteredReviews = allReviewsForChart.filter(review => {
                  if (statusFilter === 'pending') return !isReviewReplied(review);
                  if (statusFilter === 'replied') return isReviewReplied(review);
                  return true; // 'all' - affiche tous les avis
                });

                  // Déterminer si une carte de groupement est ouverte
                  const hasGroupingCardOpen = openCard === 'contenu' || openCard === 'note' || openCard === 'priorite' || openCard === 'plateforme';

                  return (
                    <>
                      {/* Si une carte de groupement est ouverte, afficher les avis groupés */}
                      {hasGroupingCardOpen ? (
                        <>
                          {/* Groupement par catégorie IA (Analyse du contenu) */}
                          {openCard === 'contenu' ? (
                            <>
                              {/* Section "Avec une plainte" */}
                              {(() => {
                                const plainteReviews = filteredReviews.filter(r => r.rating <= 2);
                                if (plainteReviews.length === 0) return null;
                  return (
                    <div className="bg-red-50 rounded-lg border border-red-200 overflow-hidden">
                      <div className="bg-red-100 px-4 py-3 border-b border-red-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <h3 className="font-semibold text-red-900">🔴 Avec une plainte</h3>
                          </div>
                          <Badge className="bg-red-600 text-white">{plainteReviews.length}</Badge>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-red-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Auteur</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Note</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Commentaire</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Source</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Statut</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-red-100">
                            {plainteReviews.slice(0, 10).map((review, index) => {
                              const hasResponse = validatedReviews.has(review.id);
                              const isUrgent = (review.rating === 1 || review.rating === 2) && !hasResponse;
                              return (
                                <React.Fragment key={review.id || index}>
                                  <tr className="hover:bg-red-50">
                                  <td className="px-4 py-3 text-sm">{review.author || review.author_name || t("dashboard.anonymous")}</td>
                                  <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                      </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                    {extractOriginalText(review.text) || review.text || t("dashboard.noComment")}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="outline" className="text-xs">
                                      {review.source || "Google"}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {review.published_at ? format(new Date(review.published_at), 'dd/MM/yyyy') : '-'}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge className={hasResponse ? "bg-green-100 text-green-800" : isUrgent ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>
                                      {hasResponse ? "Répondu" : "En attente"}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    {hasResponse ? (
                                      <Badge 
                                        className="bg-green-100 text-green-800 text-xs cursor-pointer hover:bg-green-200"
                                        onClick={() => setExpandedReplyId(expandedReplyId === review.id ? null : review.id)}
                                      >
                                        Voir la réponse
                                      </Badge>
                                    ) : (
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="text-xs"
                                        onClick={() => {
                                          setSelectedReviewForReply(review);
                                          reponseAutomatiqueRef.current?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                      >
                                        <Reply className="w-3 h-3 mr-1" />
                                        Répondre
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                                {expandedReplyId === review.id && hasResponse && (
                                  <tr>
                                    <td colSpan={7} className="p-4 bg-green-50">
                                      <div className="border-l-4 border-green-500 pl-4">
                                        <p className="font-semibold text-green-700 mb-2">Réponse publiée :</p>
                                        <p className="text-gray-700">
                                          {review.owner_reply_text || validatedResponsesText.get(review.id) || "Merci pour votre avis, nous sommes ravis que vous ayez apprécié votre expérience !"}
                                        </p>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                  </div>
                    </div>
                  );
                })()}

                {/* Section "Contient une suggestion" */}
                {(() => {
                  const suggestionReviews = filteredReviews.filter(r => r.rating === 3);
                  if (suggestionReviews.length === 0) return null;
                  return (
                    <div className="bg-yellow-50 rounded-lg border border-yellow-200 overflow-hidden">
                      <div className="bg-yellow-100 px-4 py-3 border-b border-yellow-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-yellow-600" />
                            <h3 className="font-semibold text-yellow-900">💡 Contient une suggestion</h3>
                          </div>
                          <Badge className="bg-yellow-600 text-white">{suggestionReviews.length}</Badge>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-yellow-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Auteur</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Note</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Commentaire</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Source</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Statut</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-yellow-100">
                            {suggestionReviews.slice(0, 10).map((review, index) => {
                              const hasResponse = validatedReviews.has(review.id);
                              const isUrgent = (review.rating === 1 || review.rating === 2) && !hasResponse;
                              return (
                                <tr key={review.id || index} className="hover:bg-yellow-50">
                                  <td className="px-4 py-3 text-sm">{review.author || review.author_name || t("dashboard.anonymous")}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                    {extractOriginalText(review.text) || review.text || t("dashboard.noComment")}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="outline" className="text-xs">
                                      {review.source || "Google"}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {review.published_at ? format(new Date(review.published_at), 'dd/MM/yyyy') : '-'}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge className={hasResponse ? "bg-green-100 text-green-800" : isUrgent ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>
                                      {hasResponse ? "Répondu" : "En attente"}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    {hasResponse ? (
                                      <Badge 
                                        className="bg-green-100 text-green-800 text-xs cursor-pointer hover:bg-green-200"
                                        onClick={() => setExpandedReplyId(expandedReplyId === review.id ? null : review.id)}
                                      >
                                        Voir la réponse
                                      </Badge>
                                    ) : (
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="text-xs"
                                        onClick={() => {
                                          setSelectedReviewForReply(review);
                                          reponseAutomatiqueRef.current?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                      >
                                        <Reply className="w-3 h-3 mr-1" />
                                        Répondre
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
              </div>
                    </div>
                  );
                })()}

                {/* Section "Ton négatif détecté" */}
                {(() => {
                  const negatifReviews = filteredReviews.filter(r => r.rating <= 2);
                  if (negatifReviews.length === 0) return null;
                  return (
                    <div className="bg-orange-50 rounded-lg border border-orange-200 overflow-hidden">
                      <div className="bg-orange-100 px-4 py-3 border-b border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                            <Frown className="w-5 h-5 text-orange-600" />
                            <h3 className="font-semibold text-orange-900">😠 Ton négatif détecté</h3>
              </div>
                          <Badge className="bg-orange-600 text-white">{negatifReviews.length}</Badge>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-orange-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Auteur</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Note</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Commentaire</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Source</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Statut</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-orange-100">
                            {negatifReviews.slice(0, 10).map((review, index) => {
                              const hasResponse = validatedReviews.has(review.id);
                              const isUrgent = (review.rating === 1 || review.rating === 2) && !hasResponse;
                              return (
                                <tr key={review.id || index} className="hover:bg-orange-50">
                                  <td className="px-4 py-3 text-sm">{review.author || review.author_name || t("dashboard.anonymous")}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                    {extractOriginalText(review.text) || review.text || t("dashboard.noComment")}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="outline" className="text-xs">
                                      {review.source || "Google"}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {review.published_at ? format(new Date(review.published_at), 'dd/MM/yyyy') : '-'}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge className={hasResponse ? "bg-green-100 text-green-800" : isUrgent ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>
                                      {hasResponse ? "Répondu" : "En attente"}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    {hasResponse ? (
                                      <Badge 
                                        className="bg-green-100 text-green-800 text-xs cursor-pointer hover:bg-green-200"
                                        onClick={() => setExpandedReplyId(expandedReplyId === review.id ? null : review.id)}
                                      >
                                        Voir la réponse
                                      </Badge>
                                    ) : (
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="text-xs"
                                        onClick={() => {
                                          setSelectedReviewForReply(review);
                                          reponseAutomatiqueRef.current?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                      >
                                        <Reply className="w-3 h-3 mr-1" />
                                        Répondre
              </Button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
            </div>
                </div>
                  );
                })()}

                {/* Section "Avis positif" */}
                {(() => {
                  const positifReviews = filteredReviews.filter(r => r.rating >= 4);
                  if (positifReviews.length === 0) return null;
                  return (
                    <div className="bg-green-50 rounded-lg border border-green-200 overflow-hidden">
                      <div className="bg-green-100 px-4 py-3 border-b border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ThumbsUp className="w-5 h-5 text-green-600" />
                            <h3 className="font-semibold text-green-900">👍 Avis positif</h3>
                </div>
                          <Badge className="bg-green-600 text-white">{positifReviews.length}</Badge>
              </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-green-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Auteur</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Note</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Commentaire</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Source</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Statut</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-green-100">
                            {positifReviews.slice(0, 10).map((review, index) => {
                              const hasResponse = validatedReviews.has(review.id);
                              const isUrgent = (review.rating === 1 || review.rating === 2) && !hasResponse;
                              return (
                                <tr key={review.id || index} className="hover:bg-green-50">
                                  <td className="px-4 py-3 text-sm">{review.author || review.author_name || t("dashboard.anonymous")}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                    {extractOriginalText(review.text) || review.text || t("dashboard.noComment")}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="outline" className="text-xs">
                                      {review.source || "Google"}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {review.published_at ? format(new Date(review.published_at), 'dd/MM/yyyy') : '-'}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge className={hasResponse ? "bg-green-100 text-green-800" : isUrgent ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>
                                      {hasResponse ? "Répondu" : "En attente"}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Button size="sm" variant="outline" className="text-xs">
                                      <Reply className="w-3 h-3 mr-1" />
                                      Répondre
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
                  </>
                ) : null}

                {/* Groupement par note (Filtrer par note) */}
                {openCard === 'note' ? (
                  <>
                    {/* Section "1-2 étoiles" */}
                    {(() => {
                      const lowRatingReviews = filteredReviews.filter(r => r.rating >= 1 && r.rating <= 2);
                      if (lowRatingReviews.length === 0) return null;
                      return (
                        <div className="bg-red-50 rounded-lg border border-red-200 overflow-hidden">
                          <div className="bg-red-100 px-4 py-3 border-b border-red-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 fill-red-500 text-red-500" />
                                <h3 className="font-semibold text-red-900">⭐ 1-2 étoiles</h3>
              </div>
                              <Badge className="bg-red-600 text-white">{lowRatingReviews.length}</Badge>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-red-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Auteur</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Note</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Commentaire</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Source</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Statut</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Action</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-red-100">
                                {lowRatingReviews.slice(0, 10).map((review, index) => {
                                  const hasResponse = validatedReviews.has(review.id);
                                  const isUrgent = (review.rating === 1 || review.rating === 2) && !hasResponse;
                                  return (
                                    <tr key={review.id || index} className="hover:bg-red-50">
                                      <td className="px-4 py-3 text-sm">{review.author || review.author_name || t("dashboard.anonymous")}</td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                          {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                          ))}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                        {extractOriginalText(review.text) || review.text || t("dashboard.noComment")}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-xs">
                                          {review.source || "Google"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-500">
                                        {review.published_at ? format(new Date(review.published_at), 'dd/MM/yyyy') : '-'}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge className={hasResponse ? "bg-green-100 text-green-800" : isUrgent ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>
                                          {hasResponse ? "Répondu" : "En attente"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3">
                                        {hasResponse ? (
                                          <Badge className="bg-green-100 text-green-800 text-xs">
                                            Voir la réponse
                                          </Badge>
                                        ) : (
                                          <Button size="sm" variant="outline" className="text-xs">
                                            <Reply className="w-3 h-3 mr-1" />
                                            Répondre
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Section "3 étoiles" */}
                    {(() => {
                      const midRatingReviews = filteredReviews.filter(r => r.rating === 3);
                      if (midRatingReviews.length === 0) return null;
                      return (
                        <div className="bg-yellow-50 rounded-lg border border-yellow-200 overflow-hidden">
                          <div className="bg-yellow-100 px-4 py-3 border-b border-yellow-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                                <h3 className="font-semibold text-yellow-900">⭐ 3 étoiles</h3>
                </div>
                              <Badge className="bg-yellow-600 text-white">{midRatingReviews.length}</Badge>
                </div>
                </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-yellow-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Auteur</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Note</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Commentaire</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Source</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Statut</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Action</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-yellow-100">
                                {midRatingReviews.slice(0, 10).map((review, index) => {
                                  const hasResponse = validatedReviews.has(review.id);
                                  const isUrgent = (review.rating === 1 || review.rating === 2) && !hasResponse;
                                  return (
                                    <tr key={review.id || index} className="hover:bg-yellow-50">
                                      <td className="px-4 py-3 text-sm">{review.author || review.author_name || t("dashboard.anonymous")}</td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                          {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                          ))}
              </div>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                        {extractOriginalText(review.text) || review.text || t("dashboard.noComment")}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-xs">
                                          {review.source || "Google"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-500">
                                        {review.published_at ? format(new Date(review.published_at), 'dd/MM/yyyy') : '-'}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge className={hasResponse ? "bg-green-100 text-green-800" : isUrgent ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>
                                          {hasResponse ? "Répondu" : "En attente"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3">
                                        {hasResponse ? (
                                          <Badge className="bg-green-100 text-green-800 text-xs">
                                            Voir la réponse
                                          </Badge>
                                        ) : (
                                          <Button size="sm" variant="outline" className="text-xs">
                                            <Reply className="w-3 h-3 mr-1" />
                                            Répondre
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Section "4-5 étoiles" */}
                    {(() => {
                      const highRatingReviews = filteredReviews.filter(r => r.rating >= 4 && r.rating <= 5);
                      if (highRatingReviews.length === 0) return null;
                      return (
                        <div className="bg-green-50 rounded-lg border border-green-200 overflow-hidden">
                          <div className="bg-green-100 px-4 py-3 border-b border-green-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 fill-green-500 text-green-500" />
                                <h3 className="font-semibold text-green-900">⭐ 4-5 étoiles</h3>
              </div>
                              <Badge className="bg-green-600 text-white">{highRatingReviews.length}</Badge>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-green-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Auteur</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Note</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Commentaire</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Source</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Statut</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Action</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-green-100">
                                {highRatingReviews.slice(0, 10).map((review, index) => {
                                  const hasResponse = validatedReviews.has(review.id);
                                  const isUrgent = (review.rating === 1 || review.rating === 2) && !hasResponse;
                                  return (
                                    <tr key={review.id || index} className="hover:bg-green-50">
                                      <td className="px-4 py-3 text-sm">{review.author || review.author_name || t("dashboard.anonymous")}</td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                          {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                          ))}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                        {extractOriginalText(review.text) || review.text || t("dashboard.noComment")}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-xs">
                                          {review.source || "Google"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-500">
                                        {review.published_at ? format(new Date(review.published_at), 'dd/MM/yyyy') : '-'}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge className={hasResponse ? "bg-green-100 text-green-800" : isUrgent ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>
                                          {hasResponse ? "Répondu" : "En attente"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3">
                                        {hasResponse ? (
                                          <Badge className="bg-green-100 text-green-800 text-xs">
                                            Voir la réponse
                                          </Badge>
                                        ) : (
                                          <Button size="sm" variant="outline" className="text-xs">
                                            <Reply className="w-3 h-3 mr-1" />
                                            Répondre
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : null}

                {/* Groupement par priorité */}
                {openCard === 'priorite' ? (
                  <>
                    {/* Section "Priorité haute" */}
                    {(() => {
                      const highPriorityReviews = filteredReviews.filter(r => {
                        const isNegative = r.rating <= 2;
                        const isRecent = r.published_at ? (new Date().getTime() - new Date(r.published_at).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
                        return isNegative && isRecent;
                      });
                      if (highPriorityReviews.length === 0) return null;
                      return (
                        <div className="bg-red-50 rounded-lg border border-red-200 overflow-hidden">
                          <div className="bg-red-100 px-4 py-3 border-b border-red-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Flame className="w-5 h-5 text-red-600" />
                                <h3 className="font-semibold text-red-900">🔥 Priorité haute</h3>
                              </div>
                              <Badge className="bg-red-600 text-white">{highPriorityReviews.length}</Badge>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-red-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Auteur</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Note</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Commentaire</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Source</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Statut</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Action</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-red-100">
                                {highPriorityReviews.slice(0, 10).map((review, index) => {
                                  const hasResponse = validatedReviews.has(review.id);
                                  const isUrgent = (review.rating === 1 || review.rating === 2) && !hasResponse;
                                  return (
                                    <tr key={review.id || index} className="hover:bg-red-50">
                                      <td className="px-4 py-3 text-sm">{review.author || review.author_name || t("dashboard.anonymous")}</td>
                                      <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                                          {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                          ))}
                      </div>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                        {extractOriginalText(review.text) || review.text || t("dashboard.noComment")}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-xs">
                                          {review.source || "Google"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-500">
                                        {review.published_at ? format(new Date(review.published_at), 'dd/MM/yyyy') : '-'}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge className={hasResponse ? "bg-green-100 text-green-800" : isUrgent ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>
                                          {hasResponse ? "Répondu" : "En attente"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3">
                                        {hasResponse ? (
                                          <Badge className="bg-green-100 text-green-800 text-xs">
                                            Voir la réponse
                                          </Badge>
                                        ) : (
                                          <Button size="sm" variant="outline" className="text-xs">
                                            <Reply className="w-3 h-3 mr-1" />
                                            Répondre
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                    </div>
                        </div>
                      );
                    })()}

                    {/* Section "À surveiller" */}
                    {(() => {
                      const watchReviews = filteredReviews.filter(r => r.rating === 3);
                      if (watchReviews.length === 0) return null;
                      return (
                        <div className="bg-orange-50 rounded-lg border border-orange-200 overflow-hidden">
                          <div className="bg-orange-100 px-4 py-3 border-b border-orange-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                                <h3 className="font-semibold text-orange-900">⚠️ À surveiller</h3>
                              </div>
                              <Badge className="bg-orange-600 text-white">{watchReviews.length}</Badge>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-orange-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Auteur</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Note</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Commentaire</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Source</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Statut</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Action</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-orange-100">
                                {watchReviews.slice(0, 10).map((review, index) => {
                                  const hasResponse = validatedReviews.has(review.id);
                                  const isUrgent = (review.rating === 1 || review.rating === 2) && !hasResponse;
                                  return (
                                    <tr key={review.id || index} className="hover:bg-orange-50">
                                      <td className="px-4 py-3 text-sm">{review.author || review.author_name || t("dashboard.anonymous")}</td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                          {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                        {extractOriginalText(review.text) || review.text || t("dashboard.noComment")}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-xs">
                                          {review.source || "Google"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-500">
                                        {review.published_at ? format(new Date(review.published_at), 'dd/MM/yyyy') : '-'}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge className={hasResponse ? "bg-green-100 text-green-800" : isUrgent ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>
                                          {hasResponse ? "Répondu" : "En attente"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3">
                                        {hasResponse ? (
                                          <Badge className="bg-green-100 text-green-800 text-xs">
                                            Voir la réponse
                                          </Badge>
                                        ) : (
                                          <Button size="sm" variant="outline" className="text-xs">
                                            <Reply className="w-3 h-3 mr-1" />
                                            Répondre
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
              </div>
                        </div>
                      );
                    })()}

                    {/* Section "Réponses rapides" */}
                    {(() => {
                      const quickResponseReviews = filteredReviews.filter(r => r.rating >= 4);
                      if (quickResponseReviews.length === 0) return null;
                      return (
                        <div className="bg-green-50 rounded-lg border border-green-200 overflow-hidden">
                          <div className="bg-green-100 px-4 py-3 border-b border-green-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <h3 className="font-semibold text-green-900">✅ Réponses rapides</h3>
                              </div>
                              <Badge className="bg-green-600 text-white">{quickResponseReviews.length}</Badge>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-green-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Auteur</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Note</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Commentaire</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Source</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Statut</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Action</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-green-100">
                                {quickResponseReviews.slice(0, 10).map((review, index) => {
                                  const hasResponse = validatedReviews.has(review.id);
                                  const isUrgent = (review.rating === 1 || review.rating === 2) && !hasResponse;
                                  return (
                                    <tr key={review.id || index} className="hover:bg-green-50">
                                      <td className="px-4 py-3 text-sm">{review.author || review.author_name || t("dashboard.anonymous")}</td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                          {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                          ))}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                        {extractOriginalText(review.text) || review.text || t("dashboard.noComment")}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-xs">
                                          {review.source || "Google"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-500">
                                        {review.published_at ? format(new Date(review.published_at), 'dd/MM/yyyy') : '-'}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge className={hasResponse ? "bg-green-100 text-green-800" : isUrgent ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>
                                          {hasResponse ? "Répondu" : "En attente"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3">
                                        {hasResponse ? (
                                          <Badge className="bg-green-100 text-green-800 text-xs">
                                            Voir la réponse
                                          </Badge>
                                        ) : (
                                          <Button size="sm" variant="outline" className="text-xs">
                                            <Reply className="w-3 h-3 mr-1" />
                                            Répondre
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : null}

                {/* Groupement par plateforme */}
                {openCard === 'plateforme' ? (
                  <>
                    {/* Section "Google" */}
                    {(() => {
                      const googleReviews = filteredReviews.filter(r => (r.source || 'Google') === 'Google');
                      if (googleReviews.length === 0) return null;
                      return (
                        <div className="bg-blue-50 rounded-lg border border-blue-200 overflow-hidden">
                          <div className="bg-blue-100 px-4 py-3 border-b border-blue-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-600" />
                                <h3 className="font-semibold text-blue-900">Google</h3>
                              </div>
                              <Badge className="bg-blue-600 text-white">{googleReviews.length}</Badge>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-blue-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase">Auteur</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase">Note</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase">Commentaire</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase">Source</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase">Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase">Statut</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase">Action</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-blue-100">
                                {googleReviews.slice(0, 10).map((review, index) => {
                                  const hasResponse = validatedReviews.has(review.id);
                                  const isUrgent = (review.rating === 1 || review.rating === 2) && !hasResponse;
                                  return (
                                    <tr key={review.id || index} className="hover:bg-blue-50">
                                      <td className="px-4 py-3 text-sm">{review.author || review.author_name || t("dashboard.anonymous")}</td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                          {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                          ))}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                        {extractOriginalText(review.text) || review.text || t("dashboard.noComment")}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-xs">
                                          {review.source || "Google"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-500">
                                        {review.published_at ? format(new Date(review.published_at), 'dd/MM/yyyy') : '-'}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge className={hasResponse ? "bg-green-100 text-green-800" : isUrgent ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>
                                          {hasResponse ? "Répondu" : "En attente"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3">
                                        {hasResponse ? (
                                          <Badge className="bg-green-100 text-green-800 text-xs">
                                            Voir la réponse
                                          </Badge>
                                        ) : (
                                          <Button size="sm" variant="outline" className="text-xs">
                                            <Reply className="w-3 h-3 mr-1" />
                                            Répondre
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Section "Facebook" */}
                    {(() => {
                      const facebookReviews = filteredReviews.filter(r => (r.source || 'Google') === 'Facebook');
                      if (facebookReviews.length === 0) return null;
                      return (
                        <div className="bg-blue-50 rounded-lg border border-blue-300 overflow-hidden">
                          <div className="bg-blue-200 px-4 py-3 border-b border-blue-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-700" />
                                <h3 className="font-semibold text-blue-900">Facebook</h3>
                              </div>
                              <Badge className="bg-blue-700 text-white">{facebookReviews.length}</Badge>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-blue-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase">Auteur</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase">Note</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase">Commentaire</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase">Source</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase">Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase">Statut</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase">Action</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-blue-100">
                                {facebookReviews.slice(0, 10).map((review, index) => {
                                  const hasResponse = validatedReviews.has(review.id);
                                  const isUrgent = (review.rating === 1 || review.rating === 2) && !hasResponse;
                                  return (
                                    <tr key={review.id || index} className="hover:bg-blue-50">
                                      <td className="px-4 py-3 text-sm">{review.author || review.author_name || t("dashboard.anonymous")}</td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                          {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                          ))}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                        {extractOriginalText(review.text) || review.text || t("dashboard.noComment")}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-xs">
                                          {review.source || "Google"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-500">
                                        {review.published_at ? format(new Date(review.published_at), 'dd/MM/yyyy') : '-'}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge className={hasResponse ? "bg-green-100 text-green-800" : isUrgent ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>
                                          {hasResponse ? "Répondu" : "En attente"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3">
                                        {hasResponse ? (
                                          <Badge className="bg-green-100 text-green-800 text-xs">
                                            Voir la réponse
                                          </Badge>
                                        ) : (
                                          <Button size="sm" variant="outline" className="text-xs">
                                            <Reply className="w-3 h-3 mr-1" />
                                            Répondre
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Section "TripAdvisor" */}
                    {(() => {
                      const tripadvisorReviews = filteredReviews.filter(r => (r.source || 'Google') === 'TripAdvisor');
                      if (tripadvisorReviews.length === 0) return null;
                      return (
                        <div className="bg-green-50 rounded-lg border border-green-200 overflow-hidden">
                          <div className="bg-green-100 px-4 py-3 border-b border-green-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-green-600" />
                                <h3 className="font-semibold text-green-900">TripAdvisor</h3>
                              </div>
                              <Badge className="bg-green-600 text-white">{tripadvisorReviews.length}</Badge>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-green-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Auteur</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Note</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Commentaire</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Source</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Statut</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Action</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-green-100">
                                {tripadvisorReviews.slice(0, 10).map((review, index) => {
                                  const hasResponse = validatedReviews.has(review.id);
                                  const isUrgent = (review.rating === 1 || review.rating === 2) && !hasResponse;
                                  return (
                                    <tr key={review.id || index} className="hover:bg-green-50">
                                      <td className="px-4 py-3 text-sm">{review.author || review.author_name || t("dashboard.anonymous")}</td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                          {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                          ))}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                        {extractOriginalText(review.text) || review.text || t("dashboard.noComment")}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-xs">
                                          {review.source || "Google"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-500">
                                        {review.published_at ? format(new Date(review.published_at), 'dd/MM/yyyy') : '-'}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge className={hasResponse ? "bg-green-100 text-green-800" : isUrgent ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>
                                          {hasResponse ? "Répondu" : "En attente"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3">
                                        {hasResponse ? (
                                          <Badge className="bg-green-100 text-green-800 text-xs">
                                            Voir la réponse
                                          </Badge>
                                        ) : (
                                          <Button size="sm" variant="outline" className="text-xs">
                                            <Reply className="w-3 h-3 mr-1" />
                                            Répondre
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Autres plateformes */}
                    {(() => {
                      const allSources = new Set(allReviewsForChart.map(r => r.source || 'Google'));
                      const knownSources = ['Google', 'Facebook', 'TripAdvisor'];
                      const otherSources = Array.from(allSources).filter(s => !knownSources.includes(s));
                      
                      return otherSources.length > 0 ? otherSources.map(source => {
                        const sourceReviews = filteredReviews.filter(r => (r.source || 'Google') === source);
                        if (sourceReviews.length === 0) return null;
                        return (
                          <div key={source} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Globe className="w-5 h-5 text-gray-600" />
                                  <h3 className="font-semibold text-gray-900">{source}</h3>
                                </div>
                                <Badge className="bg-gray-600 text-white">{sourceReviews.length}</Badge>
                              </div>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Auteur</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Note</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Commentaire</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Source</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Statut</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                  {sourceReviews.slice(0, 10).map((review, index) => {
                                    const hasResponse = validatedReviews.has(review.id);
                                    const isUrgent = (review.rating === 1 || review.rating === 2) && !hasResponse;
                                    return (
                                      <tr key={review.id || index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm">{review.author || review.author_name || t("dashboard.anonymous")}</td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                              <Star key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                            ))}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                          {extractOriginalText(review.text) || review.text || t("dashboard.noComment")}
                                        </td>
                                        <td className="px-4 py-3">
                                          <Badge variant="outline" className="text-xs">
                                            {review.source || "Google"}
                                          </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                          {review.published_at ? format(new Date(review.published_at), 'dd/MM/yyyy') : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                          <Badge className={hasResponse ? "bg-green-100 text-green-800" : isUrgent ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>
                                            {hasResponse ? "Répondu" : "En attente"}
                                          </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                          <Button size="sm" variant="outline" className="text-xs">
                                            <Reply className="w-3 h-3 mr-1" />
                                            Répondre
                                          </Button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      }) : null;
                    })()}
                  </>
                ) : null}
                      </>
                      ) : (
                        /* Tableau par défaut - toujours visible quand aucune carte de groupement n'est ouverte */
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auteur</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commentaire</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {filteredReviews.length > 0 ? (
                                  filteredReviews.slice(0, 10).map((review, index) => {
                                    const hasResponse = validatedReviews.has(review.id);
                                    const isUrgent = (review.rating === 1 || review.rating === 2) && !hasResponse;
                                    return (
                                      <React.Fragment key={review.id || index}>
                                        <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm">{review.author || review.author_name || t("dashboard.anonymous")}</td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                              <Star key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                            ))}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                          {extractOriginalText(review.text) || review.text || t("dashboard.noComment")}
                                        </td>
                                        <td className="px-4 py-3">
                                          <Badge variant="outline" className="text-xs">
                                            {review.source || "Google"}
                                          </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                          {review.published_at ? format(new Date(review.published_at), 'dd/MM/yyyy') : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                          <Badge className={hasResponse ? "bg-green-100 text-green-800" : isUrgent ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>
                                            {hasResponse ? "Répondu" : "En attente"}
                                          </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                          {hasResponse ? (
                                            <Badge 
                                              className="bg-green-100 text-green-800 text-xs cursor-pointer hover:bg-green-200"
                                              onClick={() => setExpandedReplyId(expandedReplyId === review.id ? null : review.id)}
                                            >
                                              Voir la réponse
                                            </Badge>
                                          ) : (
                                            <Button 
                                              size="sm" 
                                              variant="outline" 
                                              className="text-xs"
                                              onClick={() => {
                                                setSelectedReviewForReply(review);
                                                reponseAutomatiqueRef.current?.scrollIntoView({ behavior: 'smooth' });
                                              }}
                                            >
                                              <Reply className="w-3 h-3 mr-1" />
                                              Répondre
                                            </Button>
                                          )}
                                        </td>
                                      </tr>
                                      {expandedReplyId === review.id && hasResponse && (
                                        <tr>
                                          <td colSpan={7} className="p-4 bg-green-50">
                                            <div className="border-l-4 border-green-500 pl-4">
                                              <p className="font-semibold text-green-700 mb-2">Réponse publiée :</p>
                                              <p className="text-gray-700">
                                                {review.owner_reply_text || validatedResponsesText.get(review.id) || "Merci pour votre avis, nous sommes ravis que vous ayez apprécié votre expérience !"}
                                              </p>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                      {statusFilter === 'pending' ? "Aucun avis en attente" : statusFilter === 'replied' ? "Aucun avis répondu" : "Aucun avis disponible"}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
            </div>
        </div>
          </>
        )}

        {activeTab === 'objectif' && (
          <>
        {/* Objectif */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">{t("dashboard.objective")}</CardTitle>
            <p className="text-sm text-gray-600">{t("dashboard.defineProgressionGoals")}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Objectif principal */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">{t("dashboard.mainObjective")}</h4>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-lg font-medium text-gray-900">
                    {t("dashboard.reachAverageRating", { rating: "4.5" })}
                </p>
              </div>
            </div>

              {/* Progression actuelle */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{t("dashboard.currentProgress")}</h4>
                  <span className="text-sm font-medium text-gray-600">
                    {avgRating.toFixed(1)}/5
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{t("dashboard.currentRating")}</span>
                      <span className="text-sm font-medium text-gray-900">{avgRating.toFixed(1)}/5</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${(avgRating / 5) * 100}%` }}
                  />
                </div>
                </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{t("dashboard.targetRating")}</span>
                      <span className="text-sm font-medium text-green-600">4.5/5</span>
              </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-600 rounded-full transition-all"
                        style={{ width: "90%" }}
                      />
              </div>
                      </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{t("dashboard.progressPercentage")}: </span>
                      {((avgRating / 4.5) * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {avgRating < 4.5 
                        ? t("dashboard.remainingToReach", { remaining: (4.5 - avgRating).toFixed(1) })
                        : t("dashboard.objectiveReached")
                      }
                    </p>
                    </div>
                </div>
              </div>

              {/* Date cible */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">{t("dashboard.targetDate")}</h4>
                <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm text-gray-700">{t("dashboard.withinMonths", { months: 3 })}</span>
              </div>
            </div>
            </div>
          </CardContent>
        </Card>
          </>
        )}
        </div>
      </div>
    </div>;
};
export default Dashboard;