import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QualitativeData, Review } from "@/types/analysis";
import { useTranslation } from "react-i18next";
import { MessageSquare, Star, TrendingUp, TrendingDown, ShoppingBag, Users } from "lucide-react";
import { useState, useMemo } from "react";
import { mapTextToTheme, mapThemeLabel, CanonicalTheme, computeSentimentFromRating, normalizeRating } from "@/utils/reviewProcessing";

interface QualitativeSectionProps {
  data: QualitativeData;
  reviews?: Review[];
}

// Classification des mots par thématique
type WordCategory = 'produit' | 'experience' | 'positif' | 'friction';

interface ClassifiedWord {
  word: string;
  count: number;
  category: WordCategory;
  sentiment: 'positive' | 'neutral' | 'negative';
}

// Mots-clés pour la classification automatique
const PRODUCT_KEYWORDS = ['cocktail', 'cuisine', 'tapas', 'plat', 'menu', 'vin', 'boisson', 'dessert', 'fromage', 'charcuterie', 'burger', 'pizza', 'salade', 'pasta', 'repas', 'assiette'];
const EXPERIENCE_KEYWORDS = ['ambiance', 'accueil', 'serveur', 'service', 'décor', 'musique', 'terrasse', 'salle', 'réservation', 'staff', 'équipe', 'personnel'];
const POSITIVE_KEYWORDS = ['super', 'nickel', 'excellent', 'parfait', 'génial', 'top', 'recommandé', 'adore', 'fantastique', 'merveilleux', 'remarquable', 'formidable'];
const FRICTION_KEYWORDS = ['attente', 'longue', 'trop', 'lent', 'cher', 'bruit', 'serré', 'froid', 'chaud', 'petit', 'déçu', 'décevant', 'long'];

// Configuration des thématiques avec couleurs Reviewsvisor pastels (mode Fréquence)
const THEMES = {
  produit: {
    label: 'Produits / Offre',
    icon: ShoppingBag,
    bgColor: '#DBEAFE', // Bleu Reviewsvisor pastel
    textColor: '#1E40AF',
    badgeColor: '#3B82F6' // Bleu Reviewsvisor plus foncé pour badge
  },
  experience: {
    label: 'Expérience client',
    icon: Users,
    bgColor: '#F1F5F9', // Gris/Bleu neutre pastel
    textColor: '#475569',
    badgeColor: '#64748B' // Gris plus foncé pour badge
  },
  positif: {
    label: 'Appréciations positives',
    icon: TrendingUp,
    bgColor: '#ECFDF5', // Vert Reviewsvisor pastel
    textColor: '#065F46',
    badgeColor: '#10B981' // Vert Reviewsvisor plus foncé pour badge
  },
  friction: {
    label: 'Points de friction',
    icon: TrendingDown,
    bgColor: '#FEE2E2', // Rouge pastel
    textColor: '#DC2626', // Rouge explicite (red-600)
    badgeColor: '#EF4444' // Rouge Reviewsvisor plus foncé pour badge
  }
} as const;

// Configuration pour le mode Sentiment avec couleurs Reviewsvisor pastels
const SENTIMENT_THEMES = {
  positive: {
    label: 'Positif',
    icon: TrendingUp,
    bgColor: '#ECFDF5', // Vert Reviewsvisor pastel
    textColor: '#065F46',
    badgeColor: '#10B981' // Vert Reviewsvisor plus foncé
  },
  neutral: {
    label: 'Neutre',
    icon: Users,
    bgColor: '#FEF3C7', // Orange pastel (cohérent avec Répartition des avis)
    textColor: '#D97706', // Orange foncé
    badgeColor: '#F59E0B' // Orange Reviewsvisor (orange-500)
  },
  negative: {
    label: 'Négatif',
    icon: TrendingDown,
    bgColor: '#FEE2E2', // Rouge pastel
    textColor: '#DC2626', // Rouge explicite (red-600)
    badgeColor: '#EF4444' // Rouge Reviewsvisor plus foncé
  }
} as const;

// Configuration pour le mode Thème avec couleurs Reviewsvisor pastels
const THEME_GROUPS = {
  service: {
    label: 'Service',
    icon: Users,
    bgColor: '#F1F5F9', // Gris/Bleu neutre pastel
    textColor: '#475569',
    badgeColor: '#64748B', // Gris plus foncé
    keywords: ['serveur', 'attente', 'longue', 'accueil', 'services', 'service', 'staff', 'équipe', 'personnel', 'lent']
  },
  cuisine: {
    label: 'Cuisine / Produits',
    icon: ShoppingBag,
    bgColor: '#DBEAFE', // Bleu Reviewsvisor pastel
    textColor: '#1E40AF',
    badgeColor: '#3B82F6', // Bleu Reviewsvisor plus foncé
    keywords: ['cocktail', 'cuisine', 'tapas', 'plat', 'plats', 'menu', 'vin', 'boisson', 'dessert', 'fromage', 'charcuterie', 'burger', 'pizza', 'salade', 'pasta', 'repas', 'assiette']
  },
  ambiance: {
    label: 'Ambiance',
    icon: TrendingUp,
    bgColor: '#ECFDF5', // Vert Reviewsvisor pastel
    textColor: '#065F46',
    badgeColor: '#10B981', // Vert Reviewsvisor plus foncé
    keywords: ['ambiance', 'bonne', 'super', 'nickel', 'excellent', 'parfait', 'génial', 'top', 'décor', 'musique', 'terrasse', 'salle']
  },
  prix: {
    label: 'Prix',
    icon: TrendingDown,
    bgColor: '#FEE2E2', // Rouge pastel pour contrainte prix
    textColor: '#DC2626', // Rouge explicite (red-600)
    badgeColor: '#EF4444', // Rouge plus foncé
    keywords: ['prix', 'tarif', 'cher', 'chère', 'coût', 'rapport qualité/prix', 'qualité/prix', 'value', 'expensive', 'price', 'pricing', 'prix élevés', 'trop cher', 'coûteux', 'coûteuse', 'bon marché', 'pas cher', 'raisonnable', 'addition', 'facture']
  }
} as const;

// Fonction pour classifier un mot par catégorie (pour mode Fréquence)
// Utilise le sentiment réel de l'avis si disponible, sinon fallback sur les mots-clés
function classifyWord(word: string, sentiment?: 'positive' | 'neutral' | 'negative'): { category: WordCategory; sentiment: 'positive' | 'neutral' | 'negative' } {
  const wordLower = word.toLowerCase().trim();
  
  // Si le sentiment est fourni (venant de l'avis réel), l'utiliser
  if (sentiment) {
    // Déterminer la catégorie basée sur le sentiment + le mot
    if (sentiment === 'positive') {
      if (PRODUCT_KEYWORDS.some(k => wordLower.includes(k))) {
        return { category: 'produit', sentiment: 'positive' };
      }
      if (EXPERIENCE_KEYWORDS.some(k => wordLower.includes(k))) {
        return { category: 'experience', sentiment: 'positive' };
      }
      return { category: 'positif', sentiment: 'positive' };
    }
    
    if (sentiment === 'negative') {
      if (FRICTION_KEYWORDS.some(k => wordLower.includes(k))) {
        return { category: 'friction', sentiment: 'negative' };
      }
      // Mots négatifs dans un contexte produit ou expérience
      if (PRODUCT_KEYWORDS.some(k => wordLower.includes(k))) {
        return { category: 'produit', sentiment: 'negative' };
      }
      if (EXPERIENCE_KEYWORDS.some(k => wordLower.includes(k))) {
        return { category: 'experience', sentiment: 'negative' };
      }
      return { category: 'friction', sentiment: 'negative' };
    }
    
    // sentiment === 'neutral'
    if (PRODUCT_KEYWORDS.some(k => wordLower.includes(k))) {
      return { category: 'produit', sentiment: 'neutral' };
    }
    if (EXPERIENCE_KEYWORDS.some(k => wordLower.includes(k))) {
      return { category: 'experience', sentiment: 'neutral' };
    }
    return { category: 'experience', sentiment: 'neutral' };
  }
  
  // Fallback: classification basée uniquement sur le mot (ancien comportement)
  if (POSITIVE_KEYWORDS.some(k => wordLower.includes(k))) {
    return { category: 'positif', sentiment: 'positive' };
  }
  
  if (FRICTION_KEYWORDS.some(k => wordLower.includes(k))) {
    return { category: 'friction', sentiment: 'negative' };
  }
  
  if (PRODUCT_KEYWORDS.some(k => wordLower.includes(k))) {
    return { category: 'produit', sentiment: 'neutral' };
  }
  
  if (EXPERIENCE_KEYWORDS.some(k => wordLower.includes(k))) {
    return { category: 'experience', sentiment: 'neutral' };
  }
  
  return { category: 'experience', sentiment: 'neutral' };
}

export function QualitativeSection({ data, reviews }: QualitativeSectionProps) {
  const { t } = useTranslation();
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'frequency' | 'sentiment' | 'theme'>('frequency');

  // Calculer le sentiment global de chaque thème basé sur les avis réels
  const getThemeGlobalSentiment = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return () => 'neutral' as const;
    }

    // Créer un cache des sentiments par thème
    const themeSentimentCounts = new Map<keyof typeof THEME_GROUPS, { positive: number; negative: number; neutral: number }>();

    reviews.forEach(review => {
      const text = (review as any).text || review.texte || '';
      if (!text) return;

      const rating = normalizeRating(review.note || (review as any).rating || 0);
      const sentiment = computeSentimentFromRating(rating);
      const textLower = text.toLowerCase();

      // Vérifier chaque thème
      Object.entries(THEME_GROUPS).forEach(([themeKey, themeConfig]) => {
        // Vérifier si le texte mentionne ce thème (via keywords ou mapping canonique)
        const mentionsTheme = themeConfig.keywords.some(kw => textLower.includes(kw.toLowerCase())) ||
          (themeKey === 'service' && mapTextToTheme(text) === 'SERVICE') ||
          (themeKey === 'cuisine' && mapTextToTheme(text) === 'CUISINE') ||
          (themeKey === 'ambiance' && mapTextToTheme(text) === 'AMBIANCE') ||
          (themeKey === 'prix' && mapTextToTheme(text) === 'PRIX');

        if (mentionsTheme) {
          if (!themeSentimentCounts.has(themeKey as keyof typeof THEME_GROUPS)) {
            themeSentimentCounts.set(themeKey as keyof typeof THEME_GROUPS, { positive: 0, negative: 0, neutral: 0 });
          }
          const counts = themeSentimentCounts.get(themeKey as keyof typeof THEME_GROUPS)!;
          if (sentiment === 'positive') counts.positive++;
          else if (sentiment === 'negative') counts.negative++;
          else counts.neutral++;
        }
      });
    });

    return (themeKey: keyof typeof THEME_GROUPS): 'positive' | 'negative' | 'neutral' => {
      const counts = themeSentimentCounts.get(themeKey) || { positive: 0, negative: 0, neutral: 0 };
      const total = counts.positive + counts.negative + counts.neutral;
      
      if (total === 0) return 'neutral';
      
      // Déterminer le sentiment dominant
      // Si positiveCount > negativeCount * 1.2 → positif
      // Si negativeCount > positiveCount * 1.2 → négatif
      // Sinon → neutre
      if (counts.positive > counts.negative * 1.2) return 'positive';
      if (counts.negative > counts.positive * 1.2) return 'negative';
      return 'neutral';
    };
  }, [reviews]);

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("analysis.qualitative.title", "Analyse qualitative")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            <p>{t("analysis.qualitative.noData", "Aucune donnée disponible")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topKeywords = data.topKeywords || [];
  const keyVerbatims = data.keyVerbatims || [];

  const ALL_KEYWORDS = useMemo(
    () =>
      Array.from(
        new Set([
          ...PRODUCT_KEYWORDS,
          ...EXPERIENCE_KEYWORDS,
          ...POSITIVE_KEYWORDS,
          ...FRICTION_KEYWORDS,
        ])
      ),
    []
  );

  const highlightText = (text: string, extraWords: string[] = []) => {
    const keywords = Array.from(new Set([...ALL_KEYWORDS, ...extraWords]))
      .filter(Boolean)
      .map((w) => w.toLowerCase());

    if (!keywords.length) {
      return <>{text}</>;
    }

    const tokens = text.split(/(\s+)/);

    return (
      <>
        {tokens.map((token, index) => {
          const lower = token.toLowerCase();
          const isKeyword = keywords.some((kw) => lower.includes(kw));

          if (isKeyword) {
            return (
              <span
                key={index}
                className="bg-yellow-100 text-gray-900 font-semibold px-0.5 rounded-sm"
              >
                {token}
              </span>
            );
          }

          return <span key={index}>{token}</span>;
        })}
      </>
    );
  };

  // Classifier et organiser les mots en utilisant le sentiment réel de l'avis
  const classifiedWords = useMemo(() => {
    return topKeywords.map(kw => {
      // Utiliser le sentiment réel de l'avis si disponible, sinon fallback
      const sentiment = kw.sentiment || 'neutral';
      const classification = classifyWord(kw.word, sentiment);
      
      return {
        word: kw.word,
        count: kw.count,
        category: classification.category,
        sentiment: sentiment // Utiliser le sentiment réel, pas celui de classifyWord
      } as ClassifiedWord;
    }).filter(w => w.word.length > 2); // Filtrer les mots trop courts
  }, [topKeywords]);

  // Pour le mode Fréquence : organiser par sentiment réel (positif/négatif/neutre) plutôt que par catégorie
  // Cela garantit que tous les mots négatifs sont visibles
  const wordsBySentimentForFrequency = useMemo(() => {
    const grouped: Record<'positive' | 'neutral' | 'negative', ClassifiedWord[]> = {
      positive: [],
      neutral: [],
      negative: []
    };
    
    classifiedWords.forEach(word => {
      grouped[word.sentiment].push(word);
    });
    
    // Trier par fréquence
    Object.keys(grouped).forEach(key => {
      grouped[key as 'positive' | 'neutral' | 'negative'].sort((a, b) => b.count - a.count);
    });
    
    return grouped;
  }, [classifiedWords]);

  // Organiser par thématique (mode Fréquence)
  const wordsByCategory = useMemo(() => {
    const grouped: Record<WordCategory, ClassifiedWord[]> = {
      produit: [],
      experience: [],
      positif: [],
      friction: []
    };
    
    classifiedWords.forEach(word => {
      grouped[word.category].push(word);
    });
    
    // Trier par fréquence
    Object.keys(grouped).forEach(key => {
      grouped[key as WordCategory].sort((a, b) => b.count - a.count);
    });
    
    return grouped;
  }, [classifiedWords]);

  // Organiser par sentiment (mode Sentiment)
  const wordsBySentiment = useMemo(() => {
    const grouped: Record<'positive' | 'neutral' | 'negative', ClassifiedWord[]> = {
      positive: [],
      neutral: [],
      negative: []
    };
    
    classifiedWords.forEach(word => {
      grouped[word.sentiment].push(word);
    });
    
    // Trier par fréquence
    Object.keys(grouped).forEach(key => {
      grouped[key as 'positive' | 'neutral' | 'negative'].sort((a, b) => b.count - a.count);
    });
    
    return grouped;
  }, [classifiedWords]);

  // Organiser par thème (mode Thème)
  const wordsByTheme = useMemo(() => {
    const grouped: Record<keyof typeof THEME_GROUPS, ClassifiedWord[]> = {
      service: [],
      cuisine: [],
      ambiance: [],
      prix: []
    };
    
    classifiedWords.forEach(word => {
      // Utiliser le mapping canonique pour déterminer le thème
      const canonicalTheme = mapTextToTheme(word.word);
      
      if (canonicalTheme === 'SERVICE') {
        grouped.service.push(word);
      } else if (canonicalTheme === 'CUISINE') {
        grouped.cuisine.push(word);
      } else if (canonicalTheme === 'AMBIANCE') {
        grouped.ambiance.push(word);
      } else if (canonicalTheme === 'PRIX') {
        grouped.prix.push(word);
      } else {
        // Fallback: utiliser les keywords si le mapping canonique ne trouve rien
        const wordLower = word.word.toLowerCase();
        let assigned = false;
        for (const [themeKey, themeConfig] of Object.entries(THEME_GROUPS)) {
          if (!assigned && themeConfig.keywords.some(kw => wordLower.includes(kw))) {
            grouped[themeKey as keyof typeof THEME_GROUPS].push(word);
            assigned = true;
            break;
          }
        }
        // Si toujours non assigné, ne pas l'ajouter (éviter le fallback automatique en service)
      }
    });
    
    // Trier par fréquence
    Object.keys(grouped).forEach(key => {
      grouped[key as keyof typeof THEME_GROUPS].sort((a, b) => b.count - a.count);
    });
    
    return grouped;
  }, [classifiedWords]);

  // Trouver les verbatims contenant un mot
  const getVerbatimsForWord = (word: string) => {
    return keyVerbatims.filter(v => 
      v.text.toLowerCase().includes(word.toLowerCase())
    ).slice(0, 3);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("analysis.qualitative.title", "Analyse qualitative")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Synthèse rapide */}
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">
              {t("analysis.qualitative.quickSummary", "Synthèse rapide")}
            </h3>
            <p className="text-xs text-gray-600 leading-5">
              {classifiedWords.length > 0
                ? `Les avis font surtout ressortir les thèmes "${wordsByCategory.produit[0]?.word || wordsByCategory.experience[0]?.word || "produits et expérience"}" côté points forts, et "${wordsByCategory.friction[0]?.word || "certains irritants"}" comme principaux points de vigilance.`
                : "Les premiers mots-clés analysés permettront de faire ressortir vos forces et vos principaux irritants."}
            </p>
          </div>

          {/* Carte des mots-clés récurrents */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {t("analysis.qualitative.keywordsMap", "Carte des mots-clés récurrents")}
            </h3>
            
            {/* Tri et filtres */}
            <div className="flex flex-col gap-1 mb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Trier par :</span>
                <div className="flex gap-2">
                <button
                  onClick={() => setSortMode('frequency')}
                  className={`px-3 py-1 text-sm rounded-md border transition-colors duration-200 ease-in-out ${
                    sortMode === 'frequency'
                      ? 'bg-blue-900 text-white border-blue-900/30 shadow-sm'
                      : 'bg-white text-blue-950 border-slate-200 hover:bg-blue-50 hover:text-blue-950 hover:border-blue-200'
                  }`}
                >
                  Fréquence
                </button>
                <button
                  onClick={() => setSortMode('sentiment')}
                  className={`px-3 py-1 text-sm rounded-md border transition-colors duration-200 ease-in-out ${
                    sortMode === 'sentiment'
                      ? 'bg-blue-900 text-white border-blue-900/30 shadow-sm'
                      : 'bg-white text-blue-950 border-slate-200 hover:bg-blue-50 hover:text-blue-950 hover:border-blue-200'
                  }`}
                >
                  Sentiment
                </button>
                <button
                  onClick={() => setSortMode('theme')}
                  className={`px-3 py-1 text-sm rounded-md border transition-colors duration-200 ease-in-out ${
                    sortMode === 'theme'
                      ? 'bg-blue-900 text-white border-blue-900/30 shadow-sm'
                      : 'bg-white text-blue-950 border-slate-200 hover:bg-blue-50 hover:text-blue-950 hover:border-blue-200'
                  }`}
                >
                  Thème
                </button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Fréquence = mots les plus cités · Sentiment = tonalité globale · Thème = regroupement par Service, Cuisine, Ambiance, Prix.
              </p>
            </div>

            {/* Vue analytique par barres horizontales */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 md:p-6">
              {/* Mode Fréquence */}
              {sortMode === 'frequency' && (
                <div className="grid gap-y-6 md:grid-cols-2 md:gap-x-12 lg:gap-x-16 transition-opacity duration-200">
                  {Object.entries(SENTIMENT_THEMES).map(([sentimentKey, theme]) => {
                    const words = [...wordsBySentimentForFrequency[sentimentKey as 'positive' | 'neutral' | 'negative']];
                    const Icon = theme.icon;

                    if (!words.length) {
                      return (
                        <div key={sentimentKey} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" style={{ color: theme.textColor }} />
                            <span className="text-[13px] font-semibold tracking-tight text-slate-800">
                              {theme.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Aucune donnée disponible pour ce sentiment.</p>
                        </div>
                      );
                    }

                    // Tri par fréquence décroissante
                    words.sort((a, b) => b.count - a.count);
                    const maxCount = Math.max(...words.map((w) => w.count));

                    // Couleurs selon le sentiment du MOT (pas du thème)
                    const barBg =
                      sentimentKey === 'positive' ? "bg-emerald-50" 
                      : sentimentKey === 'negative' ? "bg-red-50" 
                      : "bg-amber-50"; // Orange pastel pour neutre
                    const barFill =
                      sentimentKey === 'positive' ? "bg-emerald-500" 
                      : sentimentKey === 'negative' ? "bg-red-500" 
                      : "bg-amber-500"; // Orange pour neutre

                    return (
                      <div key={sentimentKey} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color: theme.textColor }} />
                          <span className="text-[13px] font-semibold tracking-tight text-slate-800">
                            {theme.label}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {words.slice(0, 8).map((word) => {
                            const widthPercent =
                              maxCount > 0 ? Math.max(10, (word.count / maxCount) * 100) : 0;

                            // Clé unique incluant le sentiment pour permettre la redondance (même mot, différents sentiments)
                            return (
                              <div
                                key={`frequency-${sentimentKey}-${word.word}-${word.sentiment}`}
                                className="flex items-center gap-3 group"
                              >
                                <div className="w-32 text-xs text-slate-700 truncate">
                                  {word.word}
                                </div>
                                <div className="flex-1">
                                  <div className={`h-2 rounded-full ${barBg}`}>
                                    <div
                                      className={`h-2 rounded-full ${barFill} transition-all duration-150 group-hover:opacity-90 group-hover:scale-[1.01]`}
                                      style={{ width: `${widthPercent}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="w-8 text-right text-xs font-medium text-slate-500">
                                  {word.count}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Mode Sentiment */}
              {sortMode === 'sentiment' && (
                <div className="grid gap-y-6 md:grid-cols-2 md:gap-x-10 lg:grid-cols-3 lg:gap-x-14 transition-opacity duration-200">
                  {Object.entries(SENTIMENT_THEMES).map(([sentimentKey, theme]) => {
                    const words = [...wordsBySentiment[sentimentKey as 'positive' | 'neutral' | 'negative']];
                    const Icon = theme.icon;

                    if (!words.length) {
                      return (
                        <div key={sentimentKey} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" style={{ color: theme.textColor }} />
                            <span className="text-[13px] font-semibold tracking-tight text-slate-800">
                              {theme.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Aucune donnée disponible pour ce sentiment.</p>
                        </div>
                      );
                    }

                    // Tri par fréquence décroissante
                    words.sort((a, b) => b.count - a.count);
                    const maxCount = Math.max(...words.map((w) => w.count));

                    // Couleurs selon le sentiment
                    const barBg =
                      sentimentKey === 'positive' ? "bg-emerald-50" 
                      : sentimentKey === 'negative' ? "bg-red-50" 
                      : "bg-amber-50"; // Orange pastel pour neutre
                    const barFill =
                      sentimentKey === 'positive' ? "bg-emerald-500" 
                      : sentimentKey === 'negative' ? "bg-red-500" 
                      : "bg-amber-500"; // Orange pour neutre

                    return (
                      <div key={sentimentKey} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color: theme.textColor }} />
                          <span className="text-[13px] font-semibold tracking-tight text-slate-800">
                            {theme.label}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {words.slice(0, 8).map((word) => {
                            const widthPercent =
                              maxCount > 0 ? Math.max(10, (word.count / maxCount) * 100) : 0;

                            // Clé unique incluant le sentiment pour permettre la redondance (même mot, différents sentiments)
                            return (
                              <div
                                key={`sentiment-${sentimentKey}-${word.word}-${word.sentiment}`}
                                className="flex items-center gap-3 group"
                              >
                                <div className="w-32 text-xs text-slate-700 truncate">
                                  {word.word}
                                </div>
                                <div className="flex-1">
                                  <div className={`h-2 rounded-full ${barBg}`}>
                                    <div
                                      className={`h-2 rounded-full ${barFill} transition-all duration-150 group-hover:opacity-90 group-hover:scale-[1.01]`}
                                      style={{ width: `${widthPercent}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="w-8 text-right text-xs font-medium text-slate-500">
                                  {word.count}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Mode Thème */}
              {sortMode === 'theme' && (
                <div className="grid gap-y-6 md:grid-cols-2 md:gap-x-12 lg:gap-x-16 transition-opacity duration-200">
                  {Object.entries(THEME_GROUPS).map(([themeKey, theme]) => {
                    const words = [...wordsByTheme[themeKey as keyof typeof THEME_GROUPS]];
                    const Icon = theme.icon;

                    if (!words.length) {
                      return (
                        <div key={themeKey} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" style={{ color: theme.textColor }} />
                            <span className="text-[13px] font-semibold tracking-tight text-slate-800">
                              {theme.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Aucune donnée disponible pour ce thème.</p>
                        </div>
                      );
                    }

                    // Tri par fréquence décroissante
                    words.sort((a, b) => b.count - a.count);
                    const maxCount = Math.max(...words.map((w) => w.count));

                    // Calculer le sentiment global du thème
                    const themeSentiment = getThemeGlobalSentiment(themeKey as keyof typeof THEME_GROUPS);
                    
                    // Déterminer l'icône et les couleurs selon le sentiment global du thème
                    let IconComponent = Icon;
                    let iconColor = theme.textColor;
                    let barBg = "bg-amber-50"; // Orange pastel par défaut pour neutre
                    let barFill = "bg-amber-500"; // Orange par défaut pour neutre
                    
                    if (themeSentiment === 'positive') {
                      IconComponent = TrendingUp;
                      iconColor = '#10B981'; // Vert
                      barBg = "bg-emerald-50";
                      barFill = "bg-emerald-500";
                    } else if (themeSentiment === 'negative') {
                      IconComponent = TrendingDown;
                      iconColor = '#EF4444'; // Rouge
                      barBg = "bg-red-50";
                      barFill = "bg-red-500";
                    } else {
                      // Neutre
                      IconComponent = Icon;
                      iconColor = '#F59E0B'; // Orange (cohérent avec Répartition des avis)
                      barBg = "bg-amber-50";
                      barFill = "bg-amber-500";
                    }

                    return (
                      <div key={themeKey} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" style={{ color: iconColor }} />
                          <span className="text-[13px] font-semibold tracking-tight text-slate-800">
                            {theme.label}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {words.slice(0, 8).map((word) => {
                            const widthPercent =
                              maxCount > 0 ? Math.max(10, (word.count / maxCount) * 100) : 0;

                            // Couleur selon le sentiment INDIVIDUEL du mot-clé (pas du thème)
                            const wordSentiment = word.sentiment || 'neutral';
                            const wordBarBg =
                              wordSentiment === 'positive' ? "bg-emerald-50" 
                              : wordSentiment === 'negative' ? "bg-red-50" 
                              : "bg-amber-50"; // Orange pastel pour neutre
                            const wordBarFill =
                              wordSentiment === 'positive' ? "bg-emerald-500" 
                              : wordSentiment === 'negative' ? "bg-red-500" 
                              : "bg-amber-500"; // Orange pour neutre

                            // Clé unique incluant le sentiment pour permettre la redondance (même mot, différents sentiments)
                            return (
                              <div
                                key={`theme-${themeKey}-${word.word}-${word.sentiment}`}
                                className="flex items-center gap-3 group"
                              >
                                <div className="w-32 text-xs text-slate-700 truncate">
                                  {word.word}
                                </div>
                                <div className="flex-1">
                                  <div className={`h-2 rounded-full ${wordBarBg}`}>
                                    <div
                                      className={`h-2 rounded-full ${wordBarFill} transition-all duration-150 group-hover:opacity-90 group-hover:scale-[1.01]`}
                                      style={{ width: `${widthPercent}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="w-8 text-right text-xs font-medium text-slate-500">
                                  {word.count}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* État vide global si aucun mode n'a de données */}
              {sortMode === 'frequency' && Object.values(wordsBySentimentForFrequency).every(arr => arr.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">Aucune donnée disponible pour ce mode.</p>
                </div>
              )}
              {sortMode === 'sentiment' && Object.values(wordsBySentiment).every(arr => arr.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">Aucune donnée disponible pour ce mode.</p>
                </div>
              )}
              {sortMode === 'theme' && Object.values(wordsByTheme).every(arr => arr.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">Aucune donnée disponible pour ce mode.</p>
                </div>
              )}
            </div>
            
            {/* Affichage des verbatims du mot sélectionné */}
            {selectedWord && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Extraits d'avis pour "{selectedWord}"</h4>
                  <button
                    onClick={() => setSelectedWord(null)}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2">
                  {getVerbatimsForWord(selectedWord).length > 0 ? (
                    getVerbatimsForWord(selectedWord).map((v, vIndex) => (
                      <div key={vIndex} className="p-3 bg-white rounded border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Star
                            className={`w-4 h-4 ${
                              v.rating >= 4
                                ? 'text-yellow-500 fill-yellow-500'
                                : v.rating >= 3
                                ? 'text-gray-400'
                                : 'text-red-500'
                            }`}
                          />
                          <span className="text-xs font-medium text-gray-600">
                            {v.rating}/5
                  </span>
                        <Badge
                          variant={
                            v.sentiment === 'positive'
                              ? 'default'
                              : v.sentiment === 'negative'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className={`ml-2 text-xs ${
                            v.sentiment === 'neutral' 
                              ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600' 
                              : ''
                          }`}
                        >
                          {v.sentiment === 'positive' ? 'Positif' : v.sentiment === 'negative' ? 'Négatif' : 'Neutre'}
                        </Badge>
                        </div>
                       <p className="text-sm text-gray-700 italic leading-relaxed">
                         “{highlightText(v.text, selectedWord ? [selectedWord] : [])}”
                       </p>
              </div>
                    ))
            ) : (
                    <p className="text-sm text-gray-500">Aucun extrait disponible pour ce mot-clé.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Verbatims clés */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {t("analysis.qualitative.keyVerbatims", "Verbatims clés")}
            </h3>
            {keyVerbatims.length > 0 ? (
              <div className="space-y-3">
                {keyVerbatims.map((verbatim, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg bg-white"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Star
                          className={`w-4 h-4 ${
                            verbatim.rating >= 4
                              ? 'text-yellow-500 fill-yellow-500'
                              : verbatim.rating >= 3
                              ? 'text-gray-400'
                              : 'text-red-500'
                          }`}
                        />
                        <span className="text-sm font-medium">
                          {verbatim.rating}/5
                        </span>
                        <Badge
                          variant={
                            verbatim.sentiment === 'positive'
                              ? 'default'
                              : verbatim.sentiment === 'negative'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className={`ml-2 ${
                            verbatim.sentiment === 'neutral' 
                              ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600' 
                              : ''
                          }`}
                        >
                          {verbatim.sentiment === 'positive'
                            ? t("analysis.qualitative.positive", "Positif")
                            : verbatim.sentiment === 'negative'
                            ? t("analysis.qualitative.negative", "Négatif")
                            : t("analysis.qualitative.neutral", "Neutre")}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground italic">
                       “{highlightText(verbatim.text)}”
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <p>{t("analysis.qualitative.noVerbatims", "Aucun verbatim disponible")}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
