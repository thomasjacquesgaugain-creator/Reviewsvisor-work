import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Loader2, Users, Share2, Wrench, Package, Building2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

/* ─────────────────────────────────────────────
   TYPES  (unchanged)
───────────────────────────────────────────── */

export type IshikawaKey =
  | "manpower"
  | "method"
  | "machine"
  | "material"
  | "measurement";

export type IshikawaScores = Record<IshikawaKey, number | null>;

export const ISHIKAWA_CATEGORY_MAP: Record<IshikawaKey, string> = {
  manpower:    "manpower",
  method:      "method",
  machine:     "machine",
  material:    "material",
  measurement: "measurement",
};

export const EFFORT_BY_5M: Record<IshikawaKey, "Low" | "Medium" | "High"> = {
  manpower:    "Medium",
  method:      "Low",
  machine:     "High",
  material:    "High",
  measurement: "Low",
};

export interface QuestionnaireResult {
  paretoIssue: { key: string; en: string; fr: string };
  scores: IshikawaScores;
  dominantCategory: string;
  dominantEffort: "Low" | "Medium" | "High";
  confirmedCategories: {
    key: IshikawaKey;
    categoryName: string;
    score: number;
    effort: "Low" | "Medium" | "High";
    label: string;
  }[];
  isComplete: boolean;
}

export function buildQuestionnaireResult(
  paretoIssue: any,
  scores: IshikawaScores,
  scoreLabels: Record<number, string>
): QuestionnaireResult {
  const confirmedCategories = (
    Object.entries(scores) as [IshikawaKey, number | null][]
  )
    .filter(([, score]) => score !== null && score > 0)
    .map(([key, score]) => ({
      key,
      categoryName: ISHIKAWA_CATEGORY_MAP[key],
      score: score as number,
      effort: EFFORT_BY_5M[key],
      label: scoreLabels[score as number],
    }))
    .sort((a, b) => b.score - a.score);

  const dominant = confirmedCategories[0];

  return {
    paretoIssue,
    scores,
    dominantCategory: dominant?.categoryName ?? "Methods",
    dominantEffort:   dominant?.effort       ?? "Low",
    confirmedCategories,
    isComplete: Object.values(scores).every((s) => s !== null),
  };
}

/* ─────────────────────────────────────────────
   CATEGORY STYLES
───────────────────────────────────────────── */

const CATEGORY_STYLES: Record<
  IshikawaKey,
  { icon: React.ElementType; accent: string; soft: string }
> = {
  manpower:    { icon: Users,     accent: "#6366f1", soft: "#eef0ff" },
  method:      { icon: Share2,    accent: "#2563eb", soft: "#eaf1ff" },
  machine:     { icon: Wrench,    accent: "#64748b", soft: "#f1f5f9" },
  material:    { icon: Package,   accent: "#d97706", soft: "#fff4e0" },
  measurement: { icon: Building2, accent: "#0d9488", soft: "#e6faf6" },
};

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/* ─────────────────────────────────────────────
   SEGMENT CONTROL
───────────────────────────────────────────── */

const SegmentControl = ({
  categoryKey,
  value,
  onChange,
  options,
}: {
  categoryKey: IshikawaKey;
  value: number | null;
  onChange: (val: number) => void;
  options: { label: string; value: number }[];
}) => {
  const accent = CATEGORY_STYLES[categoryKey].accent;
  return (
    <div style={{
      display: "flex",
      background: "#f8fafc",
      borderRadius: "11px",
      padding: "4px",
      gap: "2px",
      border: "1px solid #eef0f7",
    }}>
      {options.map((opt) => {
        const sel = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              padding: "9px 4px",
              border: sel ? `1.5px solid ${accent}` : "1.5px solid transparent",
              background: sel ? "#ffffff" : "transparent",
              borderRadius: "8px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "12px",
              color: sel ? accent : "#9aa1b4",
              fontWeight: sel ? 600 : 500,
              transition: `all 0.2s ${EASE}`,
              whiteSpace: "nowrap",
              boxShadow: sel ? "0 2px 6px rgba(30,27,75,0.08)" : "none",
              transform: sel ? "translateY(-0.5px)" : "none",
              letterSpacing: "-0.005em",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────
   QUESTION ROW
───────────────────────────────────────────── */

const QuestionRow = ({
  sectionKey, title, subtitle, value, onChange, options, animDelay,
}: {
  sectionKey: IshikawaKey;
  title: string;
  subtitle: string;
  value: number | null;
  onChange: (val: number) => void;
  options: { label: string; value: number }[];
  animDelay: number;
}) => {
  const s = CATEGORY_STYLES[sectionKey];
  const Icon = s.icon;
  return (
    <div style={{
      padding: "16px 0 14px",
      borderBottom: "1px solid #eef0f7",
      animation: `wqFade 0.4s ${EASE} ${animDelay}s backwards`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <span style={{
          width: "30px", height: "30px", borderRadius: "9px",
          background: s.soft, color: s.accent,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={15} />
        </span>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e1b4b", lineHeight: 1.2 }}>
          {title}
        </span>
      </div>
      <div style={{ fontSize: "13.5px", color: "#5b6478", lineHeight: 1.5, marginBottom: "10px" }}>
        {subtitle}
      </div>
      <SegmentControl
        categoryKey={sectionKey}
        value={value}
        onChange={onChange}
        options={options}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */

type Props = {
  isOpen: boolean;
  onClose: () => void;
  problemTitle: string;
  establishmentId: string;
  smartObjectiveId: string;
  initialScores: any;
  onSuccess: (result: QuestionnaireResult) => void;
  onSkip?: () => void;
};

const Questionnaire = ({
  isOpen, onClose, problemTitle, establishmentId,
  smartObjectiveId, initialScores, onSuccess, onSkip,
}: Props) => {

  const [scores, setScores] = useState<IshikawaScores>(
    initialScores ?? { manpower: null, method: null, machine: null, material: null, measurement: null }
  );
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animate in/out without touching body scroll at all
  const [mounted, setMounted]   = useState(false);  // in DOM?
  const [visible, setVisible]   = useState(false);  // CSS opacity/transform active?
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // one rAF so the mount paint happens before the transition starts
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      // keep in DOM until transition finishes (400 ms), then unmount
      closeTimerRef.current = setTimeout(() => setMounted(false), 420);
    }
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [isOpen]);

  // sync scores when issue changes
  useEffect(() => {
    setScores(initialScores ?? {
      manpower: null, method: null, machine: null, material: null, measurement: null,
    });
  }, [initialScores]);

  // Escape key – does NOT touch body overflow
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  /* ── i18n constants ── */
  const OPTIONS = [
    { label: t("questionnaire.options.no"),         value: 0 },
    { label: t("questionnaire.options.unlikely"),   value: 1 },
    { label: t("questionnaire.options.uncertain"),  value: 2 },
    { label: t("questionnaire.options.likely"),     value: 3 },
    { label: t("questionnaire.options.veryLikely"), value: 4 },
  ];

  const SCORE_LABELS: Record<number, string> = {
    0: t("questionnaire.options.no"),
    1: t("questionnaire.options.unlikely"),
    2: t("questionnaire.options.uncertain"),
    3: t("questionnaire.options.likely"),
    4: t("questionnaire.options.veryLikely"),
  };

  const SECTIONS: { key: IshikawaKey; title: string; subtitle: string }[] = [
    { key: "manpower",    title: t("questionnaire.sections.manpower.title"),    subtitle: t("questionnaire.sections.manpower.subtitle") },
    { key: "method",      title: t("questionnaire.sections.method.title"),      subtitle: t("questionnaire.sections.method.subtitle") },
    { key: "machine",     title: t("questionnaire.sections.machine.title"),     subtitle: t("questionnaire.sections.machine.subtitle") },
    { key: "material",    title: t("questionnaire.sections.material.title"),    subtitle: t("questionnaire.sections.material.subtitle") },
    { key: "measurement", title: t("questionnaire.sections.measurement.title"), subtitle: t("questionnaire.sections.measurement.subtitle") },
  ];

  /* ── validation — only require all answered ── */
  const answeredCount = Object.values(scores).filter((v) => v !== null).length;
  const isComplete    = answeredCount === SECTIONS.length;
  const canSubmit     = isComplete;

  const handleChange = (key: IshikawaKey, val: number) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const result = buildQuestionnaireResult(problemTitle, scores, SCORE_LABELS);
      await onSuccess(result);
      onClose();
    } catch (err: any) {
      // silent — no validation UI
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLabel = isSubmitting
    ? null
    : !isComplete
    ? t("questionnaire.button.answerAll", { answered: answeredCount, total: 5 })
    : t("questionnaire.button.submit");

  /* ── render ── */
  if (!mounted) return null;

  const modalContent = (
    <>
      <style>{`
        @keyframes wqFade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rvSpin { to { transform: rotate(360deg); } }
        .rv-wz-close:hover  { background: #f1f5f9 !important; color: #1e1b4b !important; }
        .rv-wz-body::-webkit-scrollbar { display: none; }
        .rv-wz-body { scrollbar-width: none; }
        .rv-wz-body > div:last-child { border-bottom: none !important; padding-bottom: 8px; }
      `}</style>

      {/* ── BACKDROP — pointer-events only on the translucent layer, not the wizard ── */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(30,27,75,0.5)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          opacity: visible ? 1 : 0,
          transition: `opacity 0.3s ${EASE}`,
          // DO NOT set overflow or touch body scroll
        }}
      />

      {/* ── WIZARD PANEL — separate stacking context so its own scroll works ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          // pointer-events: none on the centering wrapper so clicks pass through to backdrop
          pointerEvents: "none",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: "auto",           // re-enable inside the panel
            background: "#ffffff",
            borderRadius: "22px",
            maxWidth: "580px",
            width: "100%",
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 24px 60px rgba(30,27,75,0.2)",
            border: "1px solid #eef0f7",
            transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
            transition: `transform 0.4s ${EASE}`,
            overflow: "hidden",             // clips radius; inner body scrolls itself
          }}
        >

          {/* ── HEADER (fixed) ── */}
          <div style={{
            padding: "20px 24px 18px",
            borderBottom: "1px solid #eef0f7",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2, color: "#1e1b4b" }}>
                {t("analysis.ishikawa.refineTitle") || "Affiner le diagnostic"}
              </div>
              <div style={{ fontSize: "13px", color: "#5b6478", marginTop: "6px", lineHeight: 1.4, maxWidth: "460px" }}>
                {t("questionnaire.help") || "Aidez à confirmer les causes du problème détecté."}
              </div>
              <div style={{ fontSize: "12px", color: "#9aa1b4", marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                {t("analysis.ishikawa.problem") || "Problème"}{" · "}
                <strong style={{ color: "#6366f1", fontWeight: 700, textTransform: "none", letterSpacing: 0, fontSize: "13px" }}>
                  {problemTitle}
                </strong>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rv-wz-close"
              aria-label="Fermer"
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                width: "32px", height: "32px", borderRadius: "9px",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                color: "#9aa1b4", transition: "background 0.15s, color 0.15s", flexShrink: 0,
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* ── BODY (scrollable on its own — does NOT touch window scroll) ── */}
          <div
            className="rv-wz-body"
            style={{ flex: 1, overflowY: "auto", padding: "6px 24px 12px" }}
          >
            {SECTIONS.map((sec, i) => (
              <QuestionRow
                key={sec.key}
                sectionKey={sec.key}
                title={sec.title}
                subtitle={sec.subtitle}
                value={scores[sec.key]}
                onChange={(val) => handleChange(sec.key, val)}
                options={OPTIONS}
                animDelay={0.04 + i * 0.03}
              />
            ))}

          </div>

          {/* ── FOOTER (fixed) ── */}
          <div style={{
            padding: "14px 24px 16px",
            borderTop: "1px solid #eef0f7",
            background: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            flexWrap: "wrap",
            flexShrink: 0,
          }}>
            {/* Progress */}
            <div style={{ flex: 1, minWidth: "140px" }}>
              <span style={{ fontSize: "11.5px", color: "#5b6478", display: "block", marginBottom: "5px" }}>
                <strong style={{ color: "#1e1b4b" }}>{answeredCount}</strong> / 5{" "}
                {t("questionnaire.answers") || "réponses"}
              </span>
              <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #8b5cf6, #6366f1)",
                  borderRadius: "999px",
                  width: `${(answeredCount / 5) * 100}%`,
                  transition: `width 0.5s ${EASE}`,
                }} />
              </div>
            </div>

            {/* Skip */}
            {onSkip && (
              <button
                type="button"
                onClick={() => { onSkip(); onClose(); }}
                style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  fontSize: "12.5px", color: "#9aa1b4", textDecoration: "underline",
                  fontFamily: "inherit",
                }}
              >
                {t("questionnaire.button.skip")}
              </button>
            )}

            {/* Validate */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              style={{
                cursor: canSubmit && !isSubmitting ? "pointer" : "not-allowed",
                border: "none", fontFamily: "inherit",
                display: "inline-flex", alignItems: "center", gap: "7px",
                padding: "11px 18px", borderRadius: "11px",
                fontSize: "13.5px", fontWeight: 600, color: "white",
                background: canSubmit && !isSubmitting
                  ? "linear-gradient(145deg, #8b5cf6, #6d28d9)" : "#c3c8d6",
                boxShadow: canSubmit && !isSubmitting
                  ? "0 6px 16px -5px rgba(124,58,237,0.5)" : "none",
                transition: `transform 0.2s ${EASE}`,
                minWidth: "170px", justifyContent: "center",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} style={{ animation: "rvSpin 1s linear infinite" }} />
                  {t("questionnaire.button.saving")}
                </>
              ) : (
                <>
                  {submitLabel}
                  {canSubmit && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5l10 -10" />
                    </svg>
                  )}
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </>
  );

  // Portal to document.body so it's completely outside the page DOM tree
  return createPortal(modalContent, document.body);
};

export default Questionnaire;