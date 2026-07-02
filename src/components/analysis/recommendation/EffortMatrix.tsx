import { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { useSmartStore } from "@/store/smartStore";
import { ParetoItem } from "@/types/analysis";
import { InfoIcon } from "lucide-react";

type MatrixRow = {
  action: string;
  issue: string;
  tone: SummaryTone;
  impact: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
};

type SummaryTone = "red" | "amber" | "blue";

const ISSUE_TONES: SummaryTone[] = ["red", "amber", "blue"];

const SUMMARY_TONE_STYLES: Record<SummaryTone, { pill: string }> = {
  red:   { pill: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" },
  amber: { pill: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  blue:  { pill: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
};

const getIssueTone = (index: number): SummaryTone =>
  ISSUE_TONES[index % ISSUE_TONES.length];

function getLocalizedObjectiveSynthesis(objective: any, language: string) {
  if (!objective) return null;
  const synthesis = objective?.synthesis ?? objective?.ishikawa_synthesis ?? null;
  if (!synthesis) return null;
  const lang = language.split("-")[0].toLowerCase();
  return synthesis[lang] ?? synthesis.en ?? synthesis.fr ?? synthesis ?? null;
}

function normalizeLevel(val: string | undefined): "high" | "medium" | "low" {
  const v = (val ?? "").toLowerCase();
  if (v === "high") return "high";
  if (v === "low")  return "low";
  return "medium";
}

function getEffortFromCategory(category: string): "high" | "medium" | "low" {
  const v = category.toLowerCase();
  if (v.includes("method") || v.includes("milieu") || v.includes("environment") ||
      v.includes("environnement") || v.includes("measurement") || v.includes("mesure"))
    return "low";
  if (v.includes("machine") || v.includes("material") || v.includes("equipment") ||
      v.includes("system") || v.includes("outil") || v.includes("tool"))
    return "high";
  return "medium";
}

function getIssueLabel(issue: ParetoItem, objective: any | null, language: string): string {
  if (objective) {
    return (
      objective?.pareto_cause?.[language] ||
      objective?.pareto_cause?.en ||
      objective?.pareto_cause?.fr ||
      ""
    );
  }
  const lang = language.split("-")[0].toLowerCase();
  if (lang === "fr") return issue.fr || issue.name || "";
  return issue.en || issue.name || "";
}

function getIssueToneClass(tone: SummaryTone) {
  return SUMMARY_TONE_STYLES[tone].pill;
}

function getLevelClass(level: "high" | "medium" | "low") {
  return {
    high:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    low:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  }[level];
}

function buildMatrixRows(
  paretoIssues: ParetoItem[],
  objectives: any[],
  language: string,
): MatrixRow[] {

  const objectiveByKey = new Map<string, any>();
  (objectives ?? []).forEach((obj) => {
    const key = String(obj?.pareto_cause?.key ?? "").toLowerCase();
    if (key) objectiveByKey.set(key, obj);
  });

  const issuesWithObjectives = (paretoIssues ?? []).filter((issue) => {
    const issueKey = String(issue.key ?? "").toLowerCase();
    return objectiveByKey.has(issueKey);
  });

  const topIssues = [...issuesWithObjectives]
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 3);

  const rows: MatrixRow[] = [];
  const seenRows = new Set<string>();

  topIssues.forEach((issue, issueIndex) => {
    const issueKey      = String(issue.key ?? "").toLowerCase();
    const objective     = objectiveByKey.get(issueKey) ?? null;
    const tone          = getIssueTone(issueIndex);
    const issueLabel    = getIssueLabel(issue, objective, language);

    const impact: MatrixRow["impact"] = objective?.impact
      ? normalizeLevel(objective.impact)
      : "medium";

    const effort: MatrixRow["effort"] = objective?.effort
      ? normalizeLevel(objective.effort)
      : (() => {
          const firstRc = (issue.root_causes ?? [])[0];
          return firstRc?.category
            ? getEffortFromCategory(String(firstRc.category))
            : "medium";
        })();

    const rootCauseItems: string[] = (issue.root_causes ?? [])
      .flatMap((rc: any) =>
        (rc.causes ?? []).map((cause: string) => String(cause || "").trim())
      )
      .filter(Boolean)
      .slice(0, 3);

    const causeTexts: string[] =
      rootCauseItems.length > 0
        ? rootCauseItems
        : (() => {
            const synthesis = getLocalizedObjectiveSynthesis(objective, language);
            const topPriority = synthesis?.top_priority;
            return topPriority ? [String(topPriority).trim()] : [];
          })();

    if (!causeTexts.length) return;

    causeTexts.forEach((action) => {
      const rowKey = `${issueLabel}|${action}`.toLowerCase();
      if (seenRows.has(rowKey)) return;
      seenRows.add(rowKey);
      rows.push({ action, issue: issueLabel, tone, impact, effort });
    });
  });

  return rows;
}

export const EffortMatrix = ({ analysisData }: { analysisData: any }) => {
  const { t, i18n } = useTranslation();
  const { objectives } = useSmartStore();

  const rows = useMemo(
    () =>
      buildMatrixRows(
        analysisData?.paretoIssues ?? [],
        objectives ?? [],
        i18n.language,
      ),
    [analysisData?.paretoIssues, objectives, i18n.language],
  );

  if (!rows.length) {
    return (
      <p className="text-sm text-gray-500 dark:text-slate-400">
        {t("recommendations.smart.noParetoIssues")}
      </p>
    );
  }

  return (
    <>
      <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {t("dashboard.actionPrioritization")}
      </h4>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="px-4 py-3">ACTION</th>
                <th className="px-4 py-3">{t("dashboard.issue")}</th>
                <th className="px-4 py-3 text-center">IMPACT</th>
                <th className="px-4 py-3 text-center">EFFORT</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={`${row.issue}-${row.action}-${index}`}
                  className="border-t border-slate-100 dark:border-slate-800"
                >
                  <td className="px-4 py-4 align-top text-slate-700 dark:text-slate-200">
                    {row.action}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Badge
                      variant="outline"
                      className={`rounded-full px-3 py-1 font-semibold ${getIssueToneClass(row.tone)}`}
                    >
                      {row.issue}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-center align-top">
                    <Badge
                      variant="outline"
                      className={`rounded-full px-3 py-1 font-semibold ${getLevelClass(row.impact)}`}
                    >
                      {t(`dashboard.${row.impact}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-center align-top">
                    <Badge
                      variant="outline"
                      className={`rounded-full px-3 py-1 font-semibold ${getLevelClass(row.effort)}`}
                    >
                      {t(`dashboard.${row.effort}`)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="flex items-start gap-2">
            <InfoIcon className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
            <p className="text-sm italic text-slate-600 dark:text-slate-400">
              <Trans
                i18nKey="dashboard.recommendedStartHighImpactLowEffort"
                components={{
                  strong: (
                    <strong className="font-semibold not-italic text-slate-900 dark:text-slate-100" />
                  ),
                }}
              />
            </p>
          </div>
        </div>
      </div>
    </>
  );
};