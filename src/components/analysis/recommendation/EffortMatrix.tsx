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

const SUMMARY_TONE_STYLES: Record<
  SummaryTone,
  { pill: string }
> = {
  red: {
    pill: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
  amber: {
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  blue: {
    pill: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  },
};

const getIssueTone = (index: number): SummaryTone =>
  ISSUE_TONES[index % ISSUE_TONES.length];

function getEffortFromCategory(category: string): "high" | "medium" | "low" {
  const value = category.toLowerCase();

  if (
    value.includes("method") ||
    value.includes("milieu") ||
    value.includes("environment") ||
    value.includes("environnement") ||
    value.includes("measurement") ||
    value.includes("mesure")
  ) {
    return "low";
  }

  if (
    value.includes("workforce") ||
    value.includes("manpower") ||
    value.includes("people") ||
    value.includes("personnel") ||
    value.includes("organization") ||
    value.includes("skills") ||
    value.includes("formation") ||
    value.includes("training")
  ) {
    return "medium";
  }

  if (
    value.includes("machine") ||
    value.includes("material") ||
    value.includes("equipment") ||
    value.includes("system") ||
    value.includes("outil") ||
    value.includes("tool")
  ) {
    return "high";
  }

  return "medium";
}

function getIssueLabel(issue: ParetoItem, language: string) {
  if (language.toLowerCase().startsWith("fr")) {
    return issue.fr || issue.name;
  }

  return issue.en || issue.name;
}

function getIssueToneClass(tone: SummaryTone) {
  return SUMMARY_TONE_STYLES[tone].pill;
}

function getImpactClass(impact: MatrixRow["impact"]) {
  return {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  }[impact];
}

function getEffortClass(effort: MatrixRow["effort"]) {
  return {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  }[effort];
}

function buildMatrixRows(
  objectives: any[],
  paretoIssues: ParetoItem[],
  language: string
) {
  const issueMap = new Map<string, ParetoItem>();
  const issueToneMap = new Map<string, SummaryTone>();

  [...paretoIssues]
    .slice()
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .forEach((issue, index) => {
      const key = String(issue?.key ?? "").toLowerCase();
      if (!key) return;
      issueToneMap.set(key, getIssueTone(index));
    });

  paretoIssues.forEach((issue) => {
    if (!issue?.key) return;
    issueMap.set(issue.key.toLowerCase(), issue);
  });

  const matchedIssues: ParetoItem[] = [];
  const seenIssueKeys = new Set<string>();

  objectives.forEach((objective) => {
    const key = objective?.pareto_cause?.key?.toLowerCase?.();
    if (!key || seenIssueKeys.has(key)) return;

    const issue = issueMap.get(key);
    if (issue) {
      matchedIssues.push(issue);
      seenIssueKeys.add(key);
    }
  });

  if (!matchedIssues.length) {
    const topIssue = [...issueMap.values()].sort(
      (a, b) => (b.count ?? 0) - (a.count ?? 0)
    )[0];

    if (topIssue) matchedIssues.push(topIssue);
  }

  const rows: MatrixRow[] = [];
  const seenRows = new Set<string>();

  matchedIssues.forEach((issue) => {
    const issueLabel = getIssueLabel(issue, language);
    const rootCauses = Array.isArray(issue.root_causes) ? issue.root_causes : [];
    const dominantCauses = rootCauses.filter(
      (rc: any) => String(rc?.importance ?? "").toLowerCase() === "dominant"
    );

    const causeGroups = dominantCauses.length ? dominantCauses : rootCauses;

    causeGroups.forEach((rc: any) => {
      const importance = String(rc?.importance ?? "").toLowerCase();
      const impact: MatrixRow["impact"] =
        importance === "dominant"
          ? "high"
          : importance === "secondary"
            ? "medium"
            : "low";

      const effort = getEffortFromCategory(String(rc?.category ?? ""));
      const causes = Array.isArray(rc?.causes)
        ? rc.causes
        : rc?.cause
          ? [rc.cause]
          : [];

      causes.forEach((causeDesc: string) => {
        const action = String(causeDesc ?? "").trim();
        if (!action) return;

        const rowKey = `${issueLabel}|${action}`.toLowerCase();
        if (seenRows.has(rowKey)) return;
        seenRows.add(rowKey);

        rows.push({
          action,
          issue: issueLabel,
          tone: issueToneMap.get(String(issue.key ?? "").toLowerCase()) ?? "blue",
          impact,
          effort,
        });
      });
    });
  });

  const score = (row: MatrixRow) => {
    const impactScore = row.impact === "high" ? 3 : row.impact === "medium" ? 2 : 1;
    const effortScore = row.effort === "low" ? 3 : row.effort === "medium" ? 2 : 1;
    return impactScore * 10 + effortScore;
  };

  return rows.sort((a, b) => score(b) - score(a));
}

export const EffortMatrix = ({ analysisData }: { analysisData: any }) => {
  const { t, i18n } = useTranslation();
  const { objectives } = useSmartStore();

  const rows = useMemo(
    () => buildMatrixRows(objectives ?? [], analysisData?.paretoIssues ?? [], i18n.language),
    [analysisData?.paretoIssues, i18n.language, objectives]
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
      <div>
        <h4 className="mb-3 text-sm font-semibold  text-slate-900 dark:text-slate-100">
          {t("dashboard.actionPrioritization")}
        </h4>
      </div>
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
                      className={`rounded-full px-3 py-1 font-semibold ${getIssueToneClass(
                        row.tone
                      )}`}
                    >
                      {row.issue}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-center align-top">
                    <Badge
                      variant="outline"
                      className={`rounded-full px-3 py-1 font-semibold ${getImpactClass(
                        row.impact
                      )}`}
                    >
                      {t(`dashboard.${row.impact}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-center align-top">
                    <Badge
                      variant="outline"
                      className={`rounded-full px-3 py-1 font-semibold ${getEffortClass(
                        row.effort
                      )}`}
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
                  strong: <strong className="font-semibold not-italic text-slate-900 dark:text-slate-100" />,
                }}
              />
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
