import { ThemeAnalysis, QualitativeData, ParetoItem, Review } from "@/types/analysis";
import { analyzeRootCauses, ProbabilityLevel } from "@/utils/rootCauseAnalysis";
import { useMemo } from "react";
import {
  AlertCircle, Clock, HelpCircle,
  Users, Share2, Wrench, Package, Building2,
  Sparkles, Target,
} from "lucide-react";
import { useState } from "react";
import Questionnaire, { QuestionnaireResult } from "./Questionare";
import { useSmartStore } from "@/store/smartStore";
import { useEffect } from "react";
import { useEstablishmentStore } from "@/store/establishmentStore";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface RootCause {
  description: string;
  probability: ProbabilityLevel;
  evidence?: string[];
  count: number;
  confidence?: number;
}

export interface RootCauseCategory {
  name: string;
  category_key?: string;
  causes: RootCause[];
}

interface RootCauseSectionProps {
  paretoIssues: ParetoItem[];
  themes?: ThemeAnalysis[];
  qualitative?: QualitativeData;
  reviews?: Review[];
}

// Shape of one root_cause entry coming from the edge function
interface AiRootCause {
  label:        string;
  importance:   string;        // "dominant" | "secondary" | "monitor"
  category:     string;        // display name, already in output language
  category_key: string;        // "workforce"|"methods"|"equipment"|"materials"|"environment"
  confidence:   number;        // 0-100
  causes:       string[];
  evidence:     string[];
}

// Internal enriched category shape used only inside this component
interface ResolvedCategory extends RootCauseCategory {
  isPrimary:    boolean;
  _isMainCard:  boolean;  // AI confidence >= 60
  _isExtraCard: boolean;  // user selected "Very Likely" but AI was not confident
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function buildRootCauseFromAI(
  problem: string,
  aiRootCauses: AiRootCause[],
  questionnaire?: Record<string, number>,
  lang: "fr" | "en" = "fr",
): { problem: string; categories: ResolvedCategory[]; summary: string } {
  const userHighKeys = new Set(
    Object.entries(questionnaire ?? {})
      .filter(([, v]) => v >= 4)
      .map(([k]) => k),
  );

  const aiByKey = new Map<string, AiRootCause>(
    aiRootCauses.map((rc) => [rc.category_key, rc]),
  );

  const visibleKeys = new Set<string>([
    ...aiRootCauses.filter((rc) => rc.confidence >= 60).map((rc) => rc.category_key),
    ...userHighKeys,
  ]);

  const sorted = [...visibleKeys].sort((a, b) => {
    const confA = aiByKey.get(a)?.confidence ?? 0;
    const confB = aiByKey.get(b)?.confidence ?? 0;
    return confB - confA;
  });

  const categories: ResolvedCategory[] = sorted.map((key, idx) => {
    const rc          = aiByKey.get(key);
    const isAiConf    = (rc?.confidence ?? 0) >= 60;
    const isUserHigh  = userHighKeys.has(key);
    const isExtraCard = isUserHigh && !isAiConf;
    const effectiveConf = rc ? (isExtraCard ? 40 : rc.confidence) : 0;

    return {
      name:         rc?.category_key ?? key,
      category_key: key,
      causes: rc
        ? rc.causes.map((desc, i) => ({
            description: desc,
            probability: isExtraCard ? "Possible" : confidenceToProbability(rc.confidence),
            evidence:    i === 0 ? rc.evidence : [],
            count:       Math.round((effectiveConf / 100) * 10),
            confidence:  effectiveConf,
          }))
        : [],
      isPrimary:    idx === 0,
      _isMainCard:  isAiConf,
      _isExtraCard: isExtraCard,
    };
  });

  const importanceOrder: Record<string, number> = { dominant: 0, secondary: 1, monitor: 2 };
  const sortedAI = [...aiRootCauses].sort((a, b) => {
    const imp = (importanceOrder[a.importance] ?? 2) - (importanceOrder[b.importance] ?? 2);
    return imp !== 0 ? imp : b.confidence - a.confidence;
  });
  const dominantCause = sortedAI[0];

  const summary =
    dominantCause && dominantCause.confidence >= 30
      ? lang === "fr"
        ? `Les causes principales de "${problem}" sont liées à ${dominantCause.category.toLowerCase()} (confiance ${dominantCause.confidence}%).`
        : `The main causes of "${problem}" relate to ${dominantCause.category.toLowerCase()} (confidence ${dominantCause.confidence}%).`
      : lang === "fr"
      ? `Analyse insuffisante pour "${problem}" — investigation terrain recommandée.`
      : `Insufficient signal for "${problem}" — on-site investigation recommended.`;

  return { problem, categories, summary };
}

function confidenceToProbability(confidence: number): ProbabilityLevel {
  if (confidence >= 60) return "Probable";
  if (confidence >= 30) return "Possible";
  return "Occasionnelle";
}

/** Returns true when the edge fn has produced the new 5-category shape */
function hasNewRootCauseShape(rootCauses: any[]): boolean {
  return (
    Array.isArray(rootCauses) &&
    rootCauses.length === 5 &&
    rootCauses.every(
      (rc) => typeof rc.confidence === "number" && typeof rc.category_key === "string",
    )
  );
}

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────

const COLORS = {
  violet:       "#6d28d9",
  indigo:       "#6366f1",
  critical:     "#e11d48",
  criticalSoft: "#fff1f3",
  criticalText: "#be123c",
  warning:      "#d97706",
  warningSoft:  "#fffaf0",
  warningText:  "#b45309",
  text:         "#1e1b4b",
  text2:        "#5b6478",
  text3:        "#9aa1b4",
  text4:        "#c3c8d6",
  border:       "#eef0f7",
  surface:      "#ffffff",
  surface2:     "#f8fafc",
  surface3:     "#f1f5f9",
};

// Covers both legacy display-name keys AND new category_key values
const CATEGORY_STYLES: Record<
  string,
  { color: string; soft: string; tint: string; icon: React.ElementType }
> = {
  
  
  // ── new stable category_key values ───────────────────────────────────────
  manpower: { color: "#6366f1", soft: "#eef0ff", tint: "#f7f7ff", icon: Users },
  material:      { color: "#6366f1", soft: "#eef0ff", tint: "#f7f7ff", icon: Users },
  method:        { color: "#2563eb", soft: "#eaf1ff", tint: "#f5f8ff", icon: Share2 },
  machine:        { color: "#64748b", soft: "#f1f5f9", tint: "#fafbfc", icon: Wrench },
  environment:    { color: "#0d9488", soft: "#e6faf6", tint: "#f5fdfb", icon: Building2 },
};

const DEFAULT_CAT_STYLE = {
  color: "#6366f1", soft: "#eef0ff", tint: "#f7f7ff", icon: Target,
};

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/* ─────────────────────────────────────────────
   PROBABILITY CONFIG
───────────────────────────────────────────── */

const probabilityConfig: Record<
  ProbabilityLevel,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  Probable: {
    label: "probable", color: "#be123c", bg: "#fff1f3", border: "#fda4af", icon: AlertCircle,
  },
  Possible: {
    label: "possible", color: "#b45309", bg: "#fffaf0", border: "#fcd34d", icon: Clock,
  },
  Occasionnelle: {
    label: "occasional", color: "#1d4ed8", bg: "#eff6ff", border: "#93c5fd", icon: HelpCircle,
  },
};

/* ─────────────────────────────────────────────
   CAUSE CARD
───────────────────────────────────────────── */

const CauseCard = ({
  category,
  categoryKey,
  causes,
  isPrimary,
  isExtraCard,
  isUserValidated,
  animDelay,
  t,
}: {
  category:        string;
  categoryKey?:    string;
  causes:          { description: string; probability: ProbabilityLevel }[];
  isPrimary:       boolean;
  isExtraCard?:    boolean;
  isUserValidated?: boolean; // AI-confident card also confirmed by user
  animDelay:       number;
  t:               (k: string) => string;
}) => {
  // Resolve style: stable key first, display name fallback
  const catStyle =
    CATEGORY_STYLES[categoryKey ?? ""] ??
    CATEGORY_STYLES[category] ??
    DEFAULT_CAT_STYLE;
  const Icon = catStyle.icon;

  const borderColor = isExtraCard ? "#059669" : catStyle.color;

  return (
    <div
      className="rv-cause-card"
      style={{
        background:   COLORS.surface,
        border:       `${isPrimary ? 2 : 1.5}px solid ${borderColor}`,
        borderRadius: "18px",
        padding:      "20px 20px 18px",
        position:     "relative",
        animation:    `rvPaneFade 0.35s ${EASE} ${animDelay}s backwards`,
        transition:   `transform 0.3s ${EASE}, box-shadow 0.3s ${EASE}`,
        cursor:       "default",
      }}
    >
      {/* Head */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
        <span style={{
          width: "44px", height: "44px", borderRadius: "13px",
          background: isExtraCard ? "#f0fdf4" : catStyle.soft,
          color:      isExtraCard ? "#059669" : catStyle.color,
          display:    "inline-flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          boxShadow:  "inset 0 0 0 1px rgba(30,27,75,0.03)",
        }}>
          <Icon size={21} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: "16.5px", fontWeight: 700, lineHeight: 1.15,
            letterSpacing: "-0.015em", color: COLORS.text,
          }}>
            {t(`analysis.ishikawa.categories.${category}`)}
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            marginTop: "4px", minHeight: "18px", flexWrap: "wrap",
          }}>
            {isPrimary && !isExtraCard && (
              <span style={{
                fontSize: "9px", fontWeight: 700,
                color: catStyle.color,
                background: COLORS.surface,
                border: `1px solid ${catStyle.color}`,
                padding: "2px 7px", borderRadius: "999px",
                letterSpacing: "0.4px", textTransform: "uppercase", flexShrink: 0,
              }}>
                {t("analysis.ishikawa.primary") || "Principale"}
              </span>
            )}
            {isExtraCard && (
              <span style={{
                fontSize: "9px", fontWeight: 700, color: "#059669",
                background: "#f0fdf4", border: "1px solid #6ee7b7",
                padding: "2px 7px", borderRadius: "999px",
                letterSpacing: "0.4px", textTransform: "uppercase", flexShrink: 0,
              }}>
                {t("analysis.ishikawa.fromQuestionnaire") || "Vous"}
              </span>
            )}
            {/* Show a small "✓ Confirmed" pill when user also rated this AI card highly */}
            {isUserValidated && !isExtraCard && (
              <span style={{
                fontSize: "9px", fontWeight: 700, color: "#059669",
                background: "#f0fdf4", border: "1px solid #6ee7b7",
                padding: "2px 7px", borderRadius: "999px",
                letterSpacing: "0.4px", textTransform: "uppercase", flexShrink: 0,
              }}>
                ✓ {t("analysis.ishikawa.confirmedByYou") || "Confirmé"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Causes list */}
    {causes.length > 0 ? (
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {causes.map((cause, i) => (
          <li key={i} style={{
            display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", gap: "10px", padding: "4px 0",
          }}>
            <span style={{
              display: "flex", alignItems: "flex-start", gap: "10px",
              flex: 1, fontSize: "14px", color: COLORS.text2, lineHeight: 1.5,
            }}>
              <span style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: isExtraCard ? "#059669" : catStyle.color,
                marginTop: "7px", flexShrink: 0,
              }} />
              {cause.description}
            </span>
          </li>
        ))}
      </ul>
    ) : (
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "10px 12px",
        borderRadius: "12px",
        background: "#f8fafc",
        border: "1px dashed #cbd5e1",
        marginTop: "4px",
      }}>
        <div>
          <p style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#64748b",
            margin: "0 0 2px",
            lineHeight: 1.4,
          }}>
            {t("analysis.ishikawa.noCausesUserCategory") || "Catégorie sélectionnée par vous"}
          </p>
          <p style={{
            fontSize: "12.5px",
            color: "#94a3b8",
            margin: 0,
            lineHeight: 1.5,
          }}>
            {t("analysis.ishikawa.noCausesUserCategoryHint") ||
              "L'IA n'a pas identifié de causes spécifiques pour cette catégorie. Une investigation terrain est recommandée."}
          </p>
        </div>
      </div>
    )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */

export function RootCauseSection({
  paretoIssues, themes = [], qualitative, reviews = [],
}: RootCauseSectionProps) {
  const {
    setQuestionnaireResult,
    fetchObjectives,
    generateSmart,
    saveQuestionnaireOnly,
    questionnaireByIssue,
    objectives: smartObjectives,
  } = useSmartStore();

  const [currentStep, setCurrentStep]               = useState(0);
  const [showQuestionnaire, setShowQuestionnaire]   = useState(false);
  const [questionnaireSkipped, setQuestionnaireSkipped] = useState(false);
  const { t } = useTranslation();

  const activeEstablishmentId  = useEstablishmentStore((s) => s.activeEstablishmentId);
  const selectedEstablishment  = useEstablishmentStore((s) => s.selectedEstablishment);
  const resolvedEstablishmentId = activeEstablishmentId ?? selectedEstablishment?.id ?? null;
if (Array.isArray(paretoIssues) && paretoIssues.length > 0) {
  paretoIssues.sort((a, b) => b.count - a.count);
}

const currentIssue =
  paretoIssues?.length > 0 ? paretoIssues[currentStep] : null;


  useEffect(() => {
    setCurrentStep(0);
    setShowQuestionnaire(false);
    setQuestionnaireSkipped(false);
  }, [activeEstablishmentId]);

  useEffect(() => {
    if (!resolvedEstablishmentId) return;
    fetchObjectives(resolvedEstablishmentId);
  }, [resolvedEstablishmentId, fetchObjectives]);

  useEffect(() => {
    if (!smartObjectives?.length) return;
    smartObjectives.forEach((obj) => {
      if (obj.questionnaire_scores && obj.pareto_cause) {
        setQuestionnaireResult(obj.pareto_cause.key, {
          paretoIssue:         obj.pareto_cause,
          scores:              obj.questionnaire_scores,
          dominantCategory:    obj.ishikawa_top_category,
          dominantEffort:      obj.effort,
          confirmedCategories: [],
          isComplete:          true,
        });
      }
    });
  }, [smartObjectives, setQuestionnaireResult]);

  const safeObjectives = Array.isArray(smartObjectives) ? smartObjectives : [];

  const currentQuestionnaire = currentIssue ? questionnaireByIssue[currentIssue.key] : null;

  const dbObjective = safeObjectives.find(
    (obj) => obj.pareto_cause.key?.toLowerCase() === currentIssue?.key?.toLowerCase()
  );

  const questionnaireSubmitted = !!currentQuestionnaire || !!dbObjective?.questionnaire_scores;

  const currentSmartObjective = useMemo(() => {
    if (!currentIssue) return null;
    return (
      safeObjectives.find(
        (obj) => obj?.pareto_cause?.key?.toLowerCase() === currentIssue?.key?.toLowerCase(),
      ) ?? null
    );
  }, [safeObjectives, currentIssue]);

  // ─── ROOT CAUSE RESOLUTION ─────────────────────────────────────────────────
  const rootCauseAnalysis = useMemo(() => {
    if (!currentIssue) return null;

    // Questionnaire scores: Record<category_key, 1–5>
    const questionnaireScores: Record<string, number> =
      currentQuestionnaire?.scores ??
      dbObjective?.questionnaire_scores?.scores ??
      {};

    // All category_keys the user rated "Very Likely" (≥ 4)
    const userHighKeys = new Set(
      Object.entries(questionnaireScores)
        .filter(([, v]) => v >= 4)
        .map(([k]) => k),
    );

    const rawRootCauses: AiRootCause[] = currentIssue.root_causes ?? [];

    // ── NEW PATH: edge fn returned all 5 categories with confidence ──────────
    if (hasNewRootCauseShape(rawRootCauses)) {
      // Index AI entries by category_key for O(1) merge lookup
      const aiByKey = new Map<string, AiRootCause>(
        rawRootCauses.map((rc) => [rc.category_key, rc]),
      );

      // Union: AI-confident (≥60) keys + ALL user "Very Likely" keys
      // Using a Set guarantees no duplicate keys — same category_key
      // can only appear once, merging AI + user signal into one card.
      const visibleKeys = new Set<string>([
        ...rawRootCauses.filter((rc) => rc.confidence >= 60).map((rc) => rc.category_key),
        ...userHighKeys,
      ]);

      // Sort: highest AI confidence first; user-only keys (conf = 0) come last
      const sorted = [...visibleKeys].sort((a, b) => {
        const confA = aiByKey.get(a)?.confidence ?? 0;
        const confB = aiByKey.get(b)?.confidence ?? 0;
        return confB - confA;
      });

      const categories: ResolvedCategory[] = sorted.map((key, idx) => {
        const rc          = aiByKey.get(key);
        const isAiConf    = (rc?.confidence ?? 0) >= 60;
        const isUserHigh  = userHighKeys.has(key);
        // "extra" = user surfaced it AND AI was not confident (no duplicate: same key = same card)
        const isExtraCard = isUserHigh && !isAiConf;
        // When user boosted a low-confidence entry, treat confidence as 40
        const effectiveConf = rc ? (isExtraCard ? 40 : rc.confidence) : 0;

        return {
          name:         rc?.category_key ?? key,
          category_key: key,
          causes: rc
            ? rc.causes.map((desc, i) => ({
                description: desc,
                probability: isExtraCard
                  ? "Possible"
                  : confidenceToProbability(rc.confidence),
                evidence:    i === 0 ? rc.evidence : [],
                count:       Math.round((effectiveConf / 100) * 10),
                confidence:  effectiveConf,
              }))
            : [],
          isPrimary:    idx === 0,
          _isMainCard:  isAiConf,
          _isExtraCard: isExtraCard,
          // Extra flag to show "Confirmed" pill on AI cards the user also validated
          _isUserValidated: isAiConf && isUserHigh,
        } as ResolvedCategory & { _isUserValidated: boolean };
      });

      return { categories, summary: currentIssue.ai_synthesis ?? "", userHighKeys };
    }

    // ── LEGACY PATH: old shape with 1–3 cats, no confidence field ───────────
    const importanceToProbability = (importance: string): ProbabilityLevel => {
      if (importance === "dominant")  return "Probable";
      if (importance === "secondary") return "Possible";
      return "Occasionnelle";
    };

    // Build a map from legacy AI output, then layer in any user-only keys
    const legacyByKey = new Map<string, any>(
      rawRootCauses.map((rc: any) => [rc.category_key ?? rc.category, rc]),
    );
    userHighKeys.forEach((k) => {
      if (!legacyByKey.has(k)) legacyByKey.set(k, null);
    });

    const categories: ResolvedCategory[] = [...legacyByKey.entries()].map(
      ([key, rc], idx) => ({
        name:         rc?.category ?? key,
        category_key: rc?.category_key ?? key,
        causes: rc
          ? (rc.causes ?? []).map((desc: string) => ({
              description: desc,
              probability: importanceToProbability(rc.importance),
              count:       0,
            }))
          : [],
        isPrimary:    idx === 0,
        _isMainCard:  rc != null,
        _isExtraCard: rc == null || (userHighKeys.has(key) && rc.importance !== "dominant"),
        _isUserValidated: rc != null && userHighKeys.has(key),
      } as ResolvedCategory & { _isUserValidated: boolean }),
    );

    return { categories, summary: currentIssue.ai_synthesis ?? "", userHighKeys };
  }, [currentIssue, currentQuestionnaire, dbObjective]);


  const goToStep = (step: number) => {
    setCurrentStep(step);
    setShowQuestionnaire(false);
  };

  /* ─────────────────────────────────────────
     handleQuestionnaireSuccess
     Only updates local cache if DB save succeeded.
     Modal stays open on failure so user can retry.
  ───────────────────────────────────────── */
  const handleQuestionnaireSuccess = async (result: QuestionnaireResult) => {
    if (!currentIssue || !rootCauseAnalysis) return;
    const estId = resolvedEstablishmentId;
    if (!estId) return;

    const saved = await generateSmart(
      estId,
      currentIssue,
      currentIssue.root_causes,
      result.dominantEffort,
      result.dominantCategory,
      "user_questionnaire",
      result.scores,
      currentIssue.percentage,
    );

    if (saved) {
      setQuestionnaireResult(currentIssue.key, result);
      setShowQuestionnaire(false);
    }
    // if saved === false: toast already fired in store, modal stays open for retry
  };

  const handleQuestionnaireSkip = () => {
    setQuestionnaireSkipped(true);
    setShowQuestionnaire(false);
  };

  if (!currentIssue || !rootCauseAnalysis) return null;

  // ─── GRID LAYOUT HELPERS ──────────────────────────────────────────────────
  // Rule:
  //   Row 1 → primary AI card + all "extra" (user-only) cards, up to 3 columns
  //   Row 2+ → remaining AI-confident cards
  // Because the Set-union dedup already merges same-key cards, there are never
  // two cards for the same category — extra cards are genuinely new categories.
  const mainCards  = rootCauseAnalysis.categories.filter(
    (c) => !(c as any)._isExtraCard,
  );
  const extraCards = rootCauseAnalysis.categories.filter(
    (c) => (c as any)._isExtraCard,
  );

  // Build ordered array: [primary, ...extras, ...remainingMain]
  const primaryCard   = mainCards[0] ?? null;
  const remainingMain = mainCards.slice(1);
  const orderedCards  = [
    ...(primaryCard ? [primaryCard] : []),
    ...extraCards,
    ...remainingMain,
  ];

  return (
    <>
      <style>{`
        @keyframes rvPaneFade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rv-cause-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 32px -10px rgba(80,60,140,0.16);
        }
        .rv-btn-synth:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 26px -6px rgba(124,58,237,0.55) !important;
        }
      `}</style>

      <div style={{
        background:     "linear-gradient(165deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.92) 100%)",
        border:         "1px solid rgba(255,255,255,0.7)",
        borderRadius:   "30px",
        padding:        "36px",
        boxShadow:      "0 30px 70px -25px rgba(80,60,140,0.3)",
        backdropFilter: "blur(8px)",
      }}>

        {/* ── APP HEADER ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "26px", padding: "0 2px" }}>
          <div style={{
            width: "62px", height: "62px", borderRadius: "18px",
            background: "linear-gradient(150deg, #9b6cf0, #6366f1)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: "white", flexShrink: 0,
            boxShadow: "0 10px 24px -6px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}>
            <Sparkles size={30} />
          </div>
          <div>
            <h2 style={{
              fontSize: "28px", fontWeight: 700, letterSpacing: "-0.03em",
              lineHeight: 1.05, color: COLORS.text, margin: 0,
            }}>
              {t("analysis.ishikawa.title") || "Diagnostic IA des causes"}
            </h2>
            <p style={{ fontSize: "14px", color: COLORS.text2, marginTop: "6px", maxWidth: "620px" }}>
              {t("analysis.ishikawa.subtitle") || "Identifiez les causes probables de vos problèmes détectés."}
            </p>
          </div>
          <span style={{ marginLeft: "auto", fontSize: "13px", color: COLORS.text3, fontWeight: 500 }}>
            {currentStep + 1} / {paretoIssues.length}
          </span>
        </div>

        {/* ── MAIN CARD ── */}
        <div style={{
          background:   COLORS.surface,
          borderRadius: "24px",
          border:       `1px solid ${COLORS.border}`,
          boxShadow:    "0 4px 20px -6px rgba(80,60,140,0.1), 0 1px 3px rgba(30,27,75,0.04)",
          overflow:     "hidden",
        }}>

          {/* ── PROBLEM TABS ── */}
          <div style={{
            display: "flex", gap: 0, padding: "0 16px",
            borderBottom: `1px solid ${COLORS.border}`,
            overflowX: "auto", scrollbarWidth: "none",
          }}>
            {paretoIssues.map((issue, idx) => {
              const isActive = idx === currentStep;
              return (
                <button
                  key={issue.key ?? idx}
                  onClick={() => goToStep(idx)}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    flex: 1, padding: "16px 14px 15px",
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "9px",
                    fontFamily: "inherit", fontSize: "14px",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? COLORS.text : COLORS.text3,
                    transition: `color 0.2s ${EASE}`,
                    whiteSpace: "nowrap", letterSpacing: "-0.01em", position: "relative",
                  }}
                >
                  <span style={{
                    width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
                    background: issue.percentage >= 30 ? COLORS.critical : COLORS.warning,
                  }} />
                  <span>{issue.name}</span>
                  {isActive && (
                    <span style={{
                      position: "absolute", bottom: "-1px", left: "16px", right: "16px",
                      height: "2.5px", background: COLORS.indigo, borderRadius: "3px 3px 0 0",
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── PROBLEM ANALYZED ── */}
          <div style={{ padding: "24px 26px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              fontSize: "11px", fontWeight: 700, color: COLORS.indigo,
              letterSpacing: "1px", textTransform: "uppercase", marginBottom: "14px",
            }}>
              <AlertCircle size={15} />
              {t("analysis.ishikawa.problemAnalyzed") || "Problème analysé"}
            </div>

            <div style={{
              border: `1.5px solid ${currentIssue.percentage >= 30 ? COLORS.critical : COLORS.warning}`,
              borderRadius: "18px", padding: "22px 24px",
              background: "linear-gradient(180deg, #fdfdff 0%, #fbfbfe 100%)",
              animation: `rvPaneFade 0.35s ${EASE}`,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "18px" }}>
                <div style={{
                  width: "60px", height: "60px", borderRadius: "16px",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  background: currentIssue.percentage >= 30
                    ? "linear-gradient(150deg, #fff0f3, #ffe0e7)"
                    : "linear-gradient(150deg, #fff8ec, #ffeecc)",
                  color: currentIssue.percentage >= 30 ? COLORS.critical : COLORS.warning,
                }}>
                  <AlertCircle size={30} />
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingTop: "2px" }}>
                  <div style={{
                    fontSize: "25px", fontWeight: 700, letterSpacing: "-0.025em",
                    lineHeight: 1.15, color: COLORS.text,
                  }}>
                    {currentIssue.name}
                  </div>
                  <div style={{ fontSize: "15px", color: COLORS.text2, marginTop: "8px", lineHeight: 1.5 }}>
                    {currentIssue.percentage.toFixed(0)}%{" "}
                    {t("dashboard.negativeMentions") || "des mentions négatives"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "16px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "7px",
                      padding: "7px 14px", borderRadius: "999px",
                      fontSize: "13px", fontWeight: 600,
                      background: currentIssue.percentage >= 30 ? COLORS.criticalSoft : COLORS.warningSoft,
                      color:      currentIssue.percentage >= 30 ? COLORS.criticalText : COLORS.warningText,
                    }}>
                      {currentIssue.percentage >= 30
                        ? <AlertCircle size={14} />
                        : <Clock size={14} />}
                      {currentIssue.percentage >= 40
                        ? t("analysis.ishikawa.highImpact")   || "Impact élevé"
                        : t("analysis.ishikawa.mediumImpact") || "Impact modéré"}
                    </span>
                    <span style={{ fontSize: "13px", color: COLORS.text3 }}>
                      {t("analysis.ishikawa.dataSrc") || "Source: avis clients"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── WARNING BANNER ── */}
          {!questionnaireSubmitted && (
            <div style={{ padding: "0 26px 16px" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "14px",
                borderRadius: "16px", border: "1px solid #e8e4fb",
                background: "linear-gradient(135deg, #f4f0fe 0%, #eef1fe 100%)",
                padding: "14px 18px",
              }}>
                <span style={{
                  width: "36px", height: "36px", borderRadius: "10px",
                  background: "linear-gradient(145deg, #8b5cf6, #6366f1)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  color: "white", flexShrink: 0,
                  boxShadow: "0 4px 10px -3px rgba(124,58,237,0.4)",
                }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2"/>
                    <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z"/>
                    <path d="M9 12l.01 0"/><path d="M13 12l2 0"/>
                    <path d="M9 16l.01 0"/><path d="M13 16l2 0"/>
                  </svg>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13.5px", fontWeight: 600, color: COLORS.violet, margin: "0 0 2px" }}>
                    {t("analysis.ishikawa.questionareWarning") || "Questionnaire non complété"}
                  </p>
                  <p style={{ fontSize: "13px", color: COLORS.text2, margin: 0 }}>
                    {t("analysis.ishikawa.recommendMessage") || "Complétez le questionnaire pour affiner le diagnostic."}
                  </p>
                </div>
                <button
                  onClick={() => setShowQuestionnaire(true)}
                  style={{
                    cursor: "pointer", border: "none", fontFamily: "inherit",
                    padding: "8px 16px", borderRadius: "10px",
                    fontSize: "13px", fontWeight: 600, color: "white",
                    background: "linear-gradient(145deg, #8b5cf6, #6d28d9)",
                    boxShadow: "0 4px 12px -4px rgba(124,58,237,0.45)",
                    whiteSpace: "nowrap", flexShrink: 0,
                    transition: `transform 0.2s ${EASE}, box-shadow 0.2s ${EASE}`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 18px -4px rgba(124,58,237,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px -4px rgba(124,58,237,0.45)";
                  }}
                >
                  {t("analysis.ishikawa.fillQuestionare") || "Répondre →"}
                </button>
              </div>
            </div>
          )}

          {/* ── QUESTIONNAIRE MODAL (portal via createPortal in Questionnaire) ── */}
          <Questionnaire
            key={`${resolvedEstablishmentId ?? "no-est"}-${currentIssue.name}`}
            isOpen={showQuestionnaire}
            onClose={() => setShowQuestionnaire(false)}
            problemTitle={currentIssue.name}
            establishmentId={resolvedEstablishmentId ?? ""}
            smartObjectiveId={currentSmartObjective?.id ?? ""}
            initialScores={
              currentQuestionnaire?.scores ?? dbObjective?.questionnaire_scores ?? undefined
            }
            onSuccess={handleQuestionnaireSuccess}
            onSkip={handleQuestionnaireSkip}
          />

          {/* ── CAUSES GRID ── */}
          <div style={{ padding: "0 26px 24px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              fontSize: "11px", fontWeight: 700, color: COLORS.indigo,
              letterSpacing: "1px", textTransform: "uppercase", marginBottom: "14px",
            }}>
              <Target size={15} />
              {t("analysis.ishikawa.probableCausesIdentified") || "Causes principales détectées"}
            </div>

            {orderedCards.length > 0 ? (
              <div style={{
                display: "grid",
                // Up to 3 columns; extra cards naturally land right of the primary card
                // because of the [primary, ...extras, ...remaining] ordering above.
                gridTemplateColumns: "repeat(3, minmax(0, 340px))",
                gap: "16px",
                animation: `rvPaneFade 0.35s ${EASE} 0.05s backwards`,
              }}>
                {orderedCards.map((category, catIdx) => (
                  <CauseCard
                    key={(category as any).category_key ?? catIdx}
                    category={category.name}
                    categoryKey={(category as any).category_key}
                    causes={category.causes}
                    isPrimary={(category as ResolvedCategory)._isMainCard && catIdx === 0}
                    isExtraCard={(category as ResolvedCategory)._isExtraCard}
                    isUserValidated={(category as any)._isUserValidated === true}
                    animDelay={0.05 + catIdx * 0.04}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                padding: "24px", background: COLORS.surface2,
                border: `1px solid ${COLORS.border}`, borderRadius: "18px",
                textAlign: "center", color: COLORS.text3,
              }}>
                <p>{t("analysis.pareto.rootCause.noCauses") || "Aucune cause spécifique identifiée."}</p>
                <p style={{ fontSize: "13px", marginTop: "8px" }}>
                  {t("analysis.pareto.rootCause.fieldAnalysisRecommended") || "Une analyse terrain est recommandée."}
                </p>
              </div>
            )}

            <div style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              marginTop: "16px", fontSize: "12.5px", color: COLORS.text3,
            }}>
              <HelpCircle size={14} color={COLORS.text4} />
              <span>{t("analysis.ishikawa.dataSrc") || "Basé sur l'analyse des avis clients"}</span>
            </div>
          </div>

          {/* ── AI SYNTHESIS BOX ── */}
          <div style={{ padding: "0 26px 26px" }}>
            <div style={{
              background: "linear-gradient(135deg, #f4f0fe 0%, #eef1fe 100%)",
              border: "1px solid #e8e4fb", borderRadius: "20px",
              padding: "24px 26px", position: "relative", overflow: "hidden",
              animation: `rvPaneFade 0.35s ${EASE} 0.1s backwards`,
            }}>
              <div style={{
                fontSize: "11px", fontWeight: 700, color: COLORS.violet,
                letterSpacing: "1px", textTransform: "uppercase", marginBottom: "14px",
              }}>
                {t("analysis.ishikawa.automatedSummary") || "Synthèse IA"}
              </div>

              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                {/* AI avatar */}
                <div style={{
                  width: "44px", height: "44px", borderRadius: "50%",
                  background: "linear-gradient(145deg, #8b5cf6, #6366f1)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  color: "white", flexShrink: 0,
                  boxShadow: "0 6px 16px -4px rgba(124,58,237,0.4)",
                }}>
                  <Sparkles size={21} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: "17px", lineHeight: 1.5, marginBottom: "18px",
                    maxWidth: "560px", letterSpacing: "-0.01em",
                    fontWeight: 500, color: COLORS.text,
                  }}>
                    {rootCauseAnalysis.summary}
                  </p>

                  {/* Questionnaire CTA */}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
                    <button
                      onClick={() => setShowQuestionnaire(true)}
                      className="rv-btn-synth"
                      style={{
                        cursor: "pointer", border: "none", fontFamily: "inherit",
                        display: "inline-flex", alignItems: "center", gap: "9px",
                        padding: "13px 22px", borderRadius: "13px",
                        fontSize: "14.5px", fontWeight: 600, color: "white",
                        background: questionnaireSubmitted
                          ? "linear-gradient(145deg, #059669, #047857)"
                          : "linear-gradient(145deg, #8b5cf6, #6d28d9)",
                        boxShadow: questionnaireSubmitted
                          ? "0 8px 20px -6px rgba(5,150,105,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"
                          : "0 8px 20px -6px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
                        transition: `transform 0.2s ${EASE}, box-shadow 0.2s ${EASE}`,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {questionnaireSubmitted ? (
                        <>✏️ {t("analysis.ishikawa.editQuestionare") || "Modifier le questionnaire"}</>
                      ) : (
                        <>
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2"/>
                            <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z"/>
                            <path d="M9 12l.01 0"/><path d="M13 12l2 0"/>
                            <path d="M9 16l.01 0"/><path d="M13 16l2 0"/>
                          </svg>
                          {t("analysis.ishikawa.fillQuestionare") || "Répondre au questionnaire"}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12l14 0"/><path d="M13 18l6 -6"/><path d="M13 6l6 6"/>
                          </svg>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Effort override banner */}
                  {questionnaireSubmitted && currentQuestionnaire && (
                    <div style={{
                      marginTop: "12px", display: "inline-flex", alignItems: "center", gap: "8px",
                      borderRadius: "10px", border: "1px solid #6ee7b7",
                      background: "#f0fdf4", padding: "8px 12px",
                      fontSize: "12px", color: "#065f46",
                    }}>
                      <span>✅</span>
                      <span>
                        {t("questionnaire.effortOverridden", { effort: currentQuestionnaire?.dominantEffort }) || "Effort déterminé par le questionnaire :"}{" "}
                        {/* <strong>
                          {t(`questionnaire.sections.${currentQuestionnaire?.dominantCategory}.title`) || currentQuestionnaire?.dominantCategory}
                        </strong> */}
                      </span>
                    </div>
                  )}

                  {/* Skip warning */}
                  {questionnaireSkipped && !questionnaireSubmitted && (
                    <div style={{
                      marginTop: "12px", borderRadius: "10px",
                      border: "1px solid #fcd34d", background: COLORS.warningSoft,
                      padding: "8px 12px", fontSize: "12px", color: COLORS.warningText,
                    }}>
                      ⚠️ {t("analysis.ishikawa.questionareSkipped") || "Questionnaire ignoré."}{" "}
                      {t("analysis.ishikawa.recommendMessage")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── PROBABILITY LEGEND ── */}
          <div style={{
            padding: "16px 26px 24px",
            borderTop: `1px solid ${COLORS.border}`,
            background: COLORS.surface2,
          }}>
            <div style={{
              fontSize: "11px", fontWeight: 700, color: COLORS.indigo,
              letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px",
            }}>
              {t("analysis.ishikawa.probabilityLevel") || "Niveau de probabilité"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
              {(["Probable", "Possible", "Occasionnelle"] as ProbabilityLevel[]).map((level) => {
                const cfg  = probabilityConfig[level];
                const Icon = cfg.icon;
                return (
                  <div key={level} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      padding: "4px 10px", borderRadius: "999px",
                      fontSize: "12px", fontWeight: 600,
                      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
                    }}>
                      <Icon size={12} />
                      {t(`analysis.pareto.rootCause.probability.${cfg.label}`) || level}
                    </span>
                    <span style={{ fontSize: "13px", color: COLORS.text2 }}>
                      {level === "Probable"
                        ? t("analysis.ishikawa.causeMentioned")  || "Cause fréquemment mentionnée"
                        : level === "Possible"
                        ? t("analysis.ishikawa.causeSuggested")  || "Cause suggérée par certains avis"
                        : t("analysis.ishikawa.causeRare")       || "Cause rarement mentionnée"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}