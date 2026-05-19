/**
 * Composant pour afficher les thèmes universels et métier selon la confidence
 * Affiche toujours les thèmes universels
 * Affiche les thèmes métier uniquement si confidence >= 75
 */

import { useTranslation } from "react-i18next";
import { BusinessTypeIndicator } from "./BusinessTypeIndicator";
import { BusinessType } from "@/config/industry";

import {
  BarChart3,TrendingUp,User,LogOut,Home,Eye,Trash2,AlertTriangle,CheckCircle,Lightbulb,Target,ChevronDown,ChevronUp,ChevronRight,Building2,Star,UtensilsCrossed,Wine,Users,MapPin,Clock,MessageSquare,Info,Loader2,Copy,Calendar,Download,ClipboardList,Bot,X,Reply,Send,List,Sparkles,AlertCircle,Frown,ThumbsUp,Flag,Zap,Flame,Globe,Layers,Check,
} from "lucide-react";

interface Theme {
  theme: string;
  count?: number;
  importance?: number;
  sentiment?: 'positive' | 'mixed' | 'negative';
}

interface ThemesDisplayProps {
  insight:any,
  themesUniversal?: Theme[];
  themesIndustry?: Theme[];
  businessType?: BusinessType | null;
  businessTypeConfidence?: number | null;
  businessTypeCandidates?: Array<{ type: BusinessType; confidence: number }>;
  totalReviews?: number;
  onOverrideClick?: () => void;
}

export function ThemesDisplay({
  insight,
  themesUniversal = [],
  themesIndustry = [],
  businessType,
  businessTypeConfidence,
  businessTypeCandidates = [],
  totalReviews,
  onOverrideClick
}: ThemesDisplayProps) {
  const { t } = useTranslation();
  const hasUniversalThemes = themesUniversal && Array.isArray(themesUniversal) && themesUniversal.length > 0;
  const hasIndustryThemes = themesIndustry && Array.isArray(themesIndustry) && themesIndustry.length > 0;
  const showIndustryThemes = businessTypeConfidence !== null && businessTypeConfidence !== undefined && businessTypeConfidence >= 45;



  // ✅ GLOBAL TOTAL (KEY FIX)
  const allThemes = [
    ...(insight?.themes_universal || []),
    ...(insight?.themes_industry || [])
  ];

  const totalThemeMentions = allThemes.reduce(
    (sum: number, t: any) => sum + (t.count || 0),
    0
  );

  const translateTheme = (theme: string): string => {
    const themeLower = theme.toLowerCase();
    const map: Record<string, string> = {
      "service / attente": t("charts.problems.serviceWait"),
      "qualité des plats": t("charts.problems.foodQuality"),
      prix: t("charts.problems.price"),
      "qualité / goût": t("charts.strengths.tasteQuality"),
      ambiance: t("dashboard.ambiance"),
      service: t("dashboard.service"),
    };

    for (const [key, val] of Object.entries(map)) {
      if (themeLower.includes(key) || key.includes(themeLower)) return val;
    }
    return theme;
  };

  const getThemeIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("cuisine") || n.includes("plat"))
      return <UtensilsCrossed className="w-4 h-4 text-purple-500" />;
    if (n.includes("service"))
      return <Users className="w-4 h-4 text-purple-500" />;
    if (n.includes("ambiance"))
      return <Wine className="w-4 h-4 text-purple-500" />;
    if (n.includes("emplacement"))
      return <MapPin className="w-4 h-4 text-purple-500" />;
    return <BarChart3 className="w-4 h-4 text-purple-500" />;
  };

  const processThemes = (themes: any[]) => {
    return themes
      .map((theme) => {
        const count = theme.count || 0;

        let positive = 0;
        let negative = 0;

        if (theme.reviews?.length) {
          theme.reviews.forEach((r: any) => {
            if (r.rating >= 4) positive++;
            else if (r.rating <= 2) negative++;
          });
        } else {
          const ratio = insight?.positive_ratio || 0.7;
          positive = Math.round(count * ratio);                             
          negative = Math.round(count * (1 - ratio));                
        }

        const total = positive + negative;

        return {
          ...theme,
          percentage:
            totalThemeMentions > 0
              ? Math.round((count / totalThemeMentions) * 100)            //total theme = 10
              : 0,
          positivePercent:
            total > 0 ? Math.round((positive / total) * 100) : 0,       
          negativePercent:
            total > 0 ? Math.round((negative / total) * 100) : 0,         
        };
      })
      .sort((a, b) => (b.count || 0) - (a.count || 0));
  };

  const SentimentBadges = ({ p, n }: any) => (
    <div className="flex gap-2">
      <span className="rounded-xl bg-green-50 px-3 py-1 text-sm font-semibold text-green-600 dark:bg-green-950/40 dark:text-green-300">
        {p}%
      </span>
      <span className="rounded-xl bg-red-50 px-3 py-1 text-sm font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-300">
        {n}%
      </span>
    </div>
  );

  const renderThemes = (themes: any[]) => {
    if (!themes?.length) {
      return (
        <div className="py-4 text-center text-slate-500 dark:text-slate-400">
          {t("dashboard.noThemesIdentified")}
        </div>
      );
    }

    return processThemes(themes).map((theme, i) => (
      <div key={i} className="rounded-lg bg-purple-50 p-3 dark:bg-slate-950/30">
        <div className="flex items-center gap-3">
          {getThemeIcon(theme.theme)}
          <div className="flex-1">
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {translateTheme(theme.theme)}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {t("dashboard.percentageOfReviews", {
                percentage: theme.percentage,
              })}
            </div>
          </div>
          <SentimentBadges
            p={theme.positivePercent}
            n={theme.negativePercent}
          />
        </div>
      </div>
    ));
  };

  if (!hasUniversalThemes && !hasIndustryThemes) return null;

  return (
    <div className="space-y-6">
      {/* Universal */}
      {hasUniversalThemes && (
        <div>
          <h4 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{t("analysis.overview.universalThemes")}</h4>
          <div className="space-y-2">
            {renderThemes(insight?.themes_universal || [])}
          </div>
        </div>
      )}

      {/* Industry */}
      {showIndustryThemes && hasIndustryThemes && (
        <div>
          <h4 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t("analysis.overview.industryThemes")}
          </h4>
          <div className="space-y-2">
            {renderThemes(insight?.themes_industry || [])}
          </div>
        </div>
      )}

      {/* Low confidence */}
      {businessTypeConfidence !== null &&
        businessTypeConfidence !== undefined &&
        businessTypeConfidence < 45 && (
          <BusinessTypeIndicator
            businessType={businessType || null}
            confidence={businessTypeConfidence}
            candidates={businessTypeCandidates}
            onOverrideClick={onOverrideClick}
          />
        )}
    </div>
  );
}