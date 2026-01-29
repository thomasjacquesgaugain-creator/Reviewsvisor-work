/**
 * Composant pour afficher les thèmes universels et métier selon la confidence
 * Affiche toujours les thèmes universels
 * Affiche les thèmes métier uniquement si confidence >= 75
 */

import { BusinessTypeIndicator } from "./BusinessTypeIndicator";
import { BusinessType } from "@/config/industry";

interface Theme {
  theme: string;
  count?: number;
  importance?: number;
  sentiment?: 'positive' | 'mixed' | 'negative';
}

interface ThemesDisplayProps {
  themesUniversal?: Theme[];
  themesIndustry?: Theme[];
  businessType?: BusinessType | null;
  businessTypeConfidence?: number | null;
  businessTypeCandidates?: Array<{ type: BusinessType; confidence: number }>;
  totalReviews?: number;
  onOverrideClick?: () => void;
}

export function ThemesDisplay({
  themesUniversal = [],
  themesIndustry = [],
  businessType,
  businessTypeConfidence,
  businessTypeCandidates = [],
  totalReviews = 1,
  onOverrideClick
}: ThemesDisplayProps) {
  const hasUniversalThemes = themesUniversal && Array.isArray(themesUniversal) && themesUniversal.length > 0;
  const hasIndustryThemes = themesIndustry && Array.isArray(themesIndustry) && themesIndustry.length > 0;
  const showIndustryThemes = businessTypeConfidence !== null && businessTypeConfidence !== undefined && businessTypeConfidence >= 75;

  // Si aucun thème, retourner null (le parent gère l'affichage)
  if (!hasUniversalThemes && !hasIndustryThemes) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Thèmes universels - TOUJOURS affichés */}
      {hasUniversalThemes && (
        <div>
          <h4 className="font-semibold text-lg mb-4">Thèmes universels</h4>
          <div className="space-y-2">
            {themesUniversal.map((theme, index) => {
              const themeName = theme.theme || 'Thématique';
              const count = theme.count || Math.round((theme.importance || 0) / 10) || 0;
              const percentage = Math.round((count / totalReviews) * 100);
              
              return (
                <div key={index} className="flex items-center justify-between bg-[#f0f3ff] rounded-lg px-4 py-3">
                  <span className="font-medium">{themeName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{count} mention{count > 1 ? 's' : ''}</span>
                    <span className="px-3 py-1 rounded-full border border-[#5048e5] text-[#5048e5] text-sm font-medium">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Thèmes métier - UNIQUEMENT si confidence >= 75 */}
      {showIndustryThemes && hasIndustryThemes && (
        <div>
          <h4 className="font-semibold text-lg mb-4">Thèmes spécifiques au secteur</h4>
          <div className="space-y-2">
            {themesIndustry.map((theme, index) => {
              const themeName = theme.theme || 'Thématique';
              const count = theme.count || Math.round((theme.importance || 0) / 10) || 0;
              const percentage = Math.round((count / totalReviews) * 100);
              
              return (
                <div key={index} className="flex items-center justify-between bg-[#e8f5e9] rounded-lg px-4 py-3 border border-green-200">
                  <span className="font-medium">{themeName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{count} mention{count > 1 ? 's' : ''}</span>
                    <span className="px-3 py-1 rounded-full border border-green-600 text-green-700 text-sm font-medium">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Indicateur de type si confidence faible */}
      {businessTypeConfidence !== null && businessTypeConfidence !== undefined && businessTypeConfidence < 75 && (
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
