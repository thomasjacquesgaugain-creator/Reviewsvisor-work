<<<<<<< HEAD
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

interface RootCauseSectionProps {
  paretoIssues: ParetoItem[];
  themes?: ThemeAnalysis[];
  qualitative?: QualitativeData;
  reviews?: Review[];
}

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */

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

const CATEGORY_STYLES: Record<
  string,
  { color: string; soft: string; tint: string; icon: React.ElementType }
> = {
  "Main-d'œuvre": { color: "#6366f1", soft: "#eef0ff", tint: "#f7f7ff", icon: Users },
  Méthodes:       { color: "#2563eb", soft: "#eaf1ff", tint: "#f5f8ff", icon: Share2 },
  Matériel:       { color: "#64748b", soft: "#f1f5f9", tint: "#fafbfc", icon: Wrench },
  Matières:       { color: "#d97706", soft: "#fff4e0", tint: "#fffdf6", icon: Package },
  Milieu:         { color: "#0d9488", soft: "#e6faf6", tint: "#f5fdfb", icon: Building2 },
  Manpower:       { color: "#6366f1", soft: "#eef0ff", tint: "#f7f7ff", icon: Users },
  Methods:        { color: "#2563eb", soft: "#eaf1ff", tint: "#f5f8ff", icon: Share2 },
  Machine:        { color: "#64748b", soft: "#f1f5f9", tint: "#fafbfc", icon: Wrench },
  Material:       { color: "#d97706", soft: "#fff4e0", tint: "#fffdf6", icon: Package },
  Measurement:    { color: "#0d9488", soft: "#e6faf6", tint: "#f5fdfb", icon: Building2 },
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
  category, causes, isPrimary, animDelay, t,
}: {
  category: string;
  causes: { description: string; probability: ProbabilityLevel }[];
  isPrimary: boolean;
  animDelay: number;
  t: (k: string) => string;
}) => {
  const catStyle = CATEGORY_STYLES[category] ?? DEFAULT_CAT_STYLE;
  const Icon = catStyle.icon;
  console.log("category",category)
  console.log("causes",causes)


  return (
    <div
      className="rv-cause-card"
      style={{
        background:   COLORS.surface,
        border:       `${isPrimary ? 2 : 1.5}px solid ${catStyle.color}`,
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
          background: catStyle.soft, color: catStyle.color,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, boxShadow: "inset 0 0 0 1px rgba(30,27,75,0.03)",
        }}>
          <Icon size={21} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: "16.5px", fontWeight: 700, lineHeight: 1.15,
            letterSpacing: "-0.015em", color: COLORS.text,
          }}>
            {category}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", minHeight: "18px" }}>
            {isPrimary && (
              <span style={{
                fontSize: "9px", fontWeight: 700, color: catStyle.color,
                background: COLORS.surface, border: `1px solid ${catStyle.color}`,
                padding: "2px 7px", borderRadius: "999px",
                letterSpacing: "0.4px", textTransform: "uppercase", flexShrink: 0,
              }}>
                {t("analysis.ishikawa.primary") || "Principale"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Causes list */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {causes.map((cause, i) => {
          const prob    = probabilityConfig[cause.probability];
          const ProbIcon = prob.icon;
          return (
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
                  background: catStyle.color, marginTop: "7px", flexShrink: 0,
                }} />
                {cause.description}
              </span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                padding: "3px 8px", borderRadius: "999px",
                fontSize: "11px", fontWeight: 600,
                color: prob.color, background: prob.bg, border: `1px solid ${prob.border}`,
                flexShrink: 0, whiteSpace: "nowrap",
              }}>
                <ProbIcon size={11} />
                {t(`analysis.pareto.rootCause.probability.${prob.label}`) || prob.label}
              </span>
            </li>
          );
        })}
      </ul>
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

  const currentIssue = paretoIssues?.length > 0 ? paretoIssues[currentStep] : null;

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
    return safeObjectives.find(
      (obj) => obj.pareto_cause?.key.toLowerCase() === currentIssue.key?.toLowerCase()
    ) ?? null;
  }, [safeObjectives, currentIssue]);

  const rootCauseAnalysis = useMemo(() => {
    if (!currentIssue || !qualitative) return null;
    return analyzeRootCauses(currentIssue.name, themes, qualitative, paretoIssues, reviews);
  }, [currentIssue, themes, qualitative, paretoIssues, reviews]);

  console.log("root cause analysis", rootCauseAnalysis)

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
      rootCauseAnalysis,
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
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                borderRadius: "16px", border: "1px solid #fda4af",
                background: COLORS.criticalSoft, padding: "16px 20px",
              }}>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: COLORS.criticalText, margin: "0 0 4px" }}>
                    ⚠️ {t("analysis.ishikawa.questionareWarning") || "Questionnaire non complété"}
                  </p>
                  <p style={{ fontSize: "13px", color: "#e11d48", margin: 0 }}>
                    {t("analysis.ishikawa.recommendMessage") || "Complétez le questionnaire pour affiner le diagnostic."}
                  </p>
                </div>
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

            {rootCauseAnalysis.categories.length > 0 ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(225px, 1fr))",
                gap: "16px",
                animation: `rvPaneFade 0.35s ${EASE} 0.05s backwards`,
              }}>
                {rootCauseAnalysis.categories.map((category, catIdx) => (
                  <CauseCard
                    key={catIdx}
                    category={category.name}
                    causes={category.causes}
                    isPrimary={catIdx === 0}
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
                <p>{t("analysis.pareto.rootCause.noCause") || "Aucune cause spécifique identifiée."}</p>
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
                        <strong>
                          {t(`questionnaire.sections.${currentQuestionnaire?.dominantCategory}.title`) || currentQuestionnaire?.dominantCategory}
                        </strong>
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
=======
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeAnalysis, QualitativeData, ParetoItem, Review } from "@/types/analysis";
import { analyzeRootCauses, ProbabilityLevel } from "@/utils/rootCauseAnalysis";
import { useMemo } from "react";
import { AlertCircle, Clock, HelpCircle } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Button } from "../ui/button";
import { useState } from "react";
import Questionnaire, { QuestionnaireResult,IshikawaScores,} from "./Questionare";
import { useSmartStore } from "@/store/smartStore";
import { useEffect } from "react";
import { useEstablishmentStore } from "@/store/establishmentStore";

import { useTranslation } from "react-i18next";

interface RootCauseSectionProps {
  paretoIssues: ParetoItem[];
  themes?: ThemeAnalysis[];
  qualitative?: QualitativeData;
  reviews?: Review[];
  // Each pareto issue maps to an existing smart_objectives row
}

// Per-issue questionnaire state



const probabilityConfig: Record<ProbabilityLevel, { label: string; color: string; icon: typeof AlertCircle }> = {
  "Probable": {
    label: "probable",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: AlertCircle
  },
  "Possible": {
    label: "possible",
    color: "bg-amber-100 text-amber-700 border-amber-300",
    icon: Clock
  },
  "Occasionnelle": {
    label: "occasional",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: HelpCircle
  }
};

// export function RootCauseSection({
//   paretoIssues,
//   themes = [],
//   qualitative,
//   reviews = []
// }: RootCauseSectionProps) {
//   // Identifier le problème prioritaire (première cause du Pareto)


//   function handleQuestionareClick(){
//         <Questionare problemTitle={paretoIssues[0].name}/>
// }




//   const mainIssue = paretoIssues && paretoIssues.length > 0 ? paretoIssues[0] : null;

//   // Analyser les causes racines
//   const rootCauseAnalysis = useMemo(() => {
//     if (!mainIssue || !qualitative) return null;
//     return analyzeRootCauses(
//       mainIssue.name,
//       themes,
//       qualitative,
//       paretoIssues,
//       reviews
//     );
//   }, [mainIssue, themes, qualitative, paretoIssues, reviews]);

//   // Si pas de problème prioritaire ou pas d'analyse possible, ne rien afficher
//   if (!mainIssue || !rootCauseAnalysis) {
//     return null;
//   }









//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           6. Analyse des causes racines (Ishikawa IA)
//           <InfoTooltip 
//             content="Analyse des causes racines (Ishikawa) : outil pour identifier les causes profondes d'un problème récurrent. Bénéfice : vous comprenez pourquoi un problème survient et pouvez agir à la source."
//           />
//         </CardTitle>
//         <Button onClick={handleQuestionareClick}>View Questionare</Button>
//       </CardHeader>
//       <CardContent className="space-y-6">
//         {/* 6.1 Problème analysé */}
//         <div>
//           <h3 className="text-lg font-semibold text-gray-800 mb-3">
//             6.1 Problème analysé
//           </h3>
//           <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
//             <p className="text-lg font-semibold text-gray-900">
//               {mainIssue.name} – {mainIssue.percentage.toFixed(0)} % des irritants
//             </p>
//             <p className="text-sm text-gray-500 mt-1">
//               Données issues du diagramme de Pareto des avis négatifs.
//             </p>
//           </div>
//         </div>

//         {/* 6.2 Causes probables identifiées par l'IA */}
//         <div>
//           <h3 className="text-lg font-semibold text-gray-800 mb-4">
//             6.2 Causes probables identifiées par l'IA
//           </h3>
          
//           {rootCauseAnalysis.categories.length > 0 ? (
//             <div className="space-y-4">
//               {rootCauseAnalysis.categories.map((category, catIndex) => (
//                 <div key={catIndex} className="border border-gray-200 rounded-lg p-4 bg-white">
//                   <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
//                     <span className="w-2 h-2 rounded-full bg-gray-400"></span>
//                     {category.name}
//                   </h4>
                  
//                   <ul className="space-y-2">
//                     {category.causes.map((cause, causeIndex) => {
//                       const probConfig = probabilityConfig[cause.probability];
//                       const Icon = probConfig.icon;
                      
//                       return (
//                         <li key={causeIndex} className="flex items-start justify-between gap-3 pl-2">
//                           <span className="text-gray-700 flex-1">{cause.description}</span>
//                           <Badge 
//                             variant="outline" 
//                             className={`${probConfig.color} border flex items-center gap-1 text-xs`}
//                           >
//                             <Icon className="w-3 h-3" />
//                             {probConfig.label}
//                           </Badge>
//                         </li>
//                       );
//                     })}
//                   </ul>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
//               <p>Aucune cause spécifique n'a pu être identifiée à partir des données disponibles.</p>
//               <p className="text-sm mt-2">Une analyse sur le terrain serait recommandée.</p>
//             </div>
//           )}
//         </div>

//         {/* 6.3 Niveau de probabilité - Légende */}
//         <div>
//           <h3 className="text-lg font-semibold text-gray-800 mb-3">
//             6.3 Niveau de probabilité
//           </h3>
//           <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
//             <div className="flex flex-wrap gap-4">
//               <div className="flex items-center gap-2">
//                 <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 flex items-center gap-1">
//                   <AlertCircle className="w-3 h-3" />
//                   Probable
//                 </Badge>
//                 <span className="text-sm text-gray-600">Cause fréquemment mentionnée dans les avis</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 flex items-center gap-1">
//                   <Clock className="w-3 h-3" />
//                   Possible
//                 </Badge>
//                 <span className="text-sm text-gray-600">Cause suggérée par certains avis</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1">
//                   <HelpCircle className="w-3 h-3" />
//                   Occasionnelle
//                 </Badge>
//                 <span className="text-sm text-gray-600">Cause rarement mentionnée</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* 6.4 Synthèse automatique */}
//         <div>
//           <h3 className="text-lg font-semibold text-gray-800 mb-3">
//             6.4 Synthèse automatique
//           </h3>
//           <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
//             <p className="text-gray-700 leading-relaxed">
//               {rootCauseAnalysis.summary}
//             </p>
//           </div>
//         </div>

//       </CardContent>
//     </Card>
//   );
// }



/* ─────────────────────────────────────────────


/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */

export function RootCauseSection({
  paretoIssues,
  themes = [],
  qualitative,
  reviews = [],
}: RootCauseSectionProps) {

  const { setQuestionnaireResult , fetchObjectives ,generateSmart ,saveQuestionnaireOnly, 
  questionnaireByIssue,
 objectives: smartObjectives,} = useSmartStore() 

  /* ── Step navigation (one issue at a time) ── */
  const [currentStep, setCurrentStep] = useState(0);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireSkipped, setQuestionnaireSkipped] = useState(false);
  const [showQuestionare, setShowQuestionare] = useState(false);
  const { t } = useTranslation();
  const activeEstablishmentId = useEstablishmentStore(
  s => s.activeEstablishmentId
);
const selectedEstablishment = useEstablishmentStore(
  s => s.selectedEstablishment
);
const resolvedEstablishmentId = activeEstablishmentId ?? selectedEstablishment?.id ?? null;

/* ── Current issue ── */
const currentIssue =
  paretoIssues && paretoIssues.length > 0
    ? paretoIssues[currentStep]
    : null;

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
      setQuestionnaireResult(obj.pareto_cause, {
        paretoIssue: obj.pareto_cause,
        scores: obj.questionnaire_scores,
        dominantCategory: obj.ishikawa_top_category,
        dominantEffort: obj.effort,
        confirmedCategories: [],
        isComplete: true,
      });
    }
  });
}, [smartObjectives,setQuestionnaireResult]);


const safeObjectives = Array.isArray(smartObjectives)
  ? smartObjectives
  : [];

const currentQuestionnaire =
  currentIssue ? questionnaireByIssue[currentIssue.name] : null;

const dbObjective = safeObjectives.find(
  (obj) =>
    obj.pareto_cause?.toLowerCase() ===
    currentIssue?.name?.toLowerCase()
);

const questionnaireSubmitted =
  !!currentQuestionnaire ||
  !!dbObjective?.questionnaire_scores;

const currentSmartObjective = useMemo(() => {
  if (!currentIssue) return null;

  return (
    safeObjectives.find(
      (obj) =>
        obj.pareto_cause?.toLowerCase() ===
        currentIssue.name?.toLowerCase()
    ) ?? null
  );
}, [safeObjectives, currentIssue]);


  /* ── RCA — recomputes per issue ── */
  const rootCauseAnalysis = useMemo(() => {
    if (!currentIssue || !qualitative) return null;
    return analyzeRootCauses(
      currentIssue.name,
      themes,
      qualitative,
      paretoIssues,
      reviews
    );
  }, [currentIssue, themes, qualitative, paretoIssues, reviews]);



  /* ── Navigation ── */
  const goToStep = (step: number) => {
    setCurrentStep(step);
    setShowQuestionnaire(false);
  };

  const nextStep = () =>
    goToStep(Math.min(currentStep + 1, paretoIssues.length - 1));
  const prevStep = () => goToStep(Math.max(currentStep - 1, 0));


  //Questionare submit handler :- perfrom db entry automatically

    const handleQuestionnaireSuccess = async (result: QuestionnaireResult) => {
      if (!currentIssue || !rootCauseAnalysis) return;
      const estId = resolvedEstablishmentId;
      if (!estId) return;

      //  store update
      setQuestionnaireResult(currentIssue.name, result);

      //  save in DB
    
    
      await generateSmart(
        estId,
        currentIssue,
        rootCauseAnalysis,
        result.dominantEffort,
        result.dominantCategory,
        "user_questionnaire",
        result.scores,
        currentIssue.percentage
      );

      setShowQuestionnaire(false);
    };

  const handleQuestionnaireSkip = () => {
  setQuestionnaireSkipped(true);
  setShowQuestionnaire(false);
};

  return (
  <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <CardHeader className="space-y-4">
      <CardTitle className="flex items-center gap-2">
         {t("analysis.ishikawa.title")}
        <InfoTooltip
          content={t("analysis.ishikawa.content")}
        />

        {/* Step indicator */}
        <span className="ml-auto text-sm font-normal text-slate-500 dark:text-slate-400">
          {currentStep + 1} / {paretoIssues.length}
        </span>
      </CardTitle>

      {/* Warning banner */}
      {!questionnaireSubmitted && (
        <div className="flex items-start justify-between rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-200">
               {t("analysis.ishikawa.questionareWarning")}
            </p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {t("analysis.ishikawa.recommendMessage")}
            </p>
          </div>
        </div>
      )}

      {/* Navigation + Questionnaire actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2">
        
        {/* Step navigation */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            {t("common.previous")}
          </Button>

          <Button
            variant="outline"
            onClick={nextStep}
            disabled={currentStep === paretoIssues.length - 1}
          >
             {t("common.next")}
          </Button>
        </div>

        {/* Questionnaire action */}
        <div>
          {!showQuestionnaire ? (
            <Button
              variant="outline"
              onClick={() => setShowQuestionnaire(true)}
              className={
                questionnaireSubmitted
                  ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300 dark:hover:bg-green-700"
                  : "animate-pulse border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-600 hover:text-white dark:border-yellow-900/50 dark:bg-yellow-950/30 dark:text-yellow-300 dark:hover:bg-yellow-700"
              }
            >
              {questionnaireSubmitted
                ? `✏️ ${t("analysis.ishikawa.editQuestionare")}`
                : `⚠️ ${t("analysis.ishikawa.fillQuestionare")}`}
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setShowQuestionnaire(false)}
              className="text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              {`✕ ${t("analysis.ishikawa.closeQuestionare")}`}
            </Button>
          )}
        </div>
      </div>
        {/* Effort override banner */}
        {questionnaireSubmitted && currentQuestionnaire && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
            <span>✅</span>
            <span>
              {t("questionnaire.effortOverridden", {
                effort: currentQuestionnaire?.dominantEffort,
              })}{" "}
              <strong>
                {t(
                  `questionnaire.sections.${currentQuestionnaire?.dominantCategory}.title`
                )}
              </strong>
            </span>
          </div>
        )}
        {/* Skip warning */}
        {questionnaireSkipped && !questionnaireSubmitted && (
          <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-950/30 dark:text-yellow-300">
            {`⚠️ ${t("analysis.ishikawa.questionareSkipped")}`}
            {t("analysis.ishikawa.recommendMessage")}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Questionnaire — inline, per issue, remounts on issue change */}
        {showQuestionnaire && (
          <>
            <Questionnaire
                key={`${resolvedEstablishmentId ?? "no-establishment"}-${currentIssue.name}`}
                problemTitle={currentIssue.name}
                establishmentId={resolvedEstablishmentId ?? ""}
                smartObjectiveId={currentSmartObjective?.id ?? ""}
                initialScores={
                  currentQuestionnaire?.scores ??
                  dbObjective?.questionnaire_scores ??
                  undefined
                }
                onSuccess={handleQuestionnaireSuccess}
                onSkip={handleQuestionnaireSkip}
              />
          </>
        )}

        {/* 6.1 Problème analysé */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
            6.1 {t("analysis.ishikawa.problemAnalyzed")}
          </h3>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {currentIssue.name} –{" "}
              {`${currentIssue.percentage.toFixed(0)} % ${t("dashboard.negativeMentions")}`}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("analysis.ishikawa.dataSrc")}
            </p>
          </div>
        </div>

        {/* 6.2 Causes probables identifiées par l'IA */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            6.2 {t("analysis.ishikawa.probableCausesIdentified")}
          </h3>

          {rootCauseAnalysis.categories.length > 0 ? (
            <div className="space-y-4">
              {rootCauseAnalysis.categories.map((category, catIndex) => (
                <div
                  key={catIndex}
                  className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                >
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    {category.name}
                  </h4>

                  <ul className="space-y-2">
                    {category.causes.map((cause, causeIndex) => {
                      const probConfig = probabilityConfig[cause.probability];
                      const Icon = probConfig.icon;
                      return (
                        <li
                          key={causeIndex}
                          className="flex items-start justify-between gap-3 pl-2"
                        >
                          <span className="flex-1 text-slate-700 dark:text-slate-300">
                            {cause.description}
                          </span>
                          <Badge
                            variant="outline"
                            className={`${probConfig.color} border flex items-center gap-1 text-xs`}
                          >
                            <Icon className="w-3 h-3" />
                           {t(`analysis.pareto.rootCause.probability.${probConfig.label}`)}
                          </Badge>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
              <p>
               {t("analysis.pareto.rootCause.noCause")}
              </p>
              <p className="text-sm mt-2">
               {t("analysis.pareto.rootCause.fieldAnalysisRecommended")}
              </p>
            </div>
          )}
        </div>

        {/* 6.3 Niveau de probabilité — unchanged from original */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
            6.3 {t("analysis.ishikawa.probabilityLevel")}
          </h3>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 border-red-300 bg-red-100 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                >
                  <AlertCircle className="w-3 h-3" />
                  {t("analysis.pareto.rootCause.probability.probable")}
                </Badge>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {t("analysis.ishikawa.causeMentioned")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
                >
                  <Clock className="w-3 h-3" />
                  {t("analysis.pareto.rootCause.probability.possible")}
                </Badge>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {t("analysis.ishikawa.causeSuggested")}

                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"
                >
                  <HelpCircle className="w-3 h-3" />
                   {t("analysis.pareto.rootCause.probability.occasional")}
                </Badge>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {t("analysis.ishikawa.causeRare")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 6.4 Synthèse automatique — unchanged from original */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
            6.4 {t("analysis.ishikawa.automatedSummary")}
          </h3>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">
              {rootCauseAnalysis.summary}
            </p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
>>>>>>> b8a623d00f6eb41d23adbdf5d908baad32a09fcb
