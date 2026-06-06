import { ParetoItem } from "@/types/analysis";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useSmartStore } from "@/store/smartStore";

// ── Effort from category name (5M/Ishikawa table) ───────────
function getEffortFromCategory(category: string): "high" | "medium" | "low" {
  const c = category.toLowerCase();

  if (
    c.includes("method") || c.includes("méthode") ||
    c.includes("milieu") || c.includes("environment") ||
    c.includes("environnement") || c.includes("measurement") ||
    c.includes("mesure")
  ) return "low";

  if (
    c.includes("workforce") || c.includes("main-d") ||
    c.includes("manpower") || c.includes("people") ||
    c.includes("personnel") || c.includes("organization") ||
    c.includes("skills") || c.includes("compétence") ||
    c.includes("formation") || c.includes("training")
  ) return "medium";

  if (
    c.includes("machine") || c.includes("material") ||
    c.includes("matière") || c.includes("matériel") ||
    c.includes("equipment") || c.includes("système") ||
    c.includes("system") || c.includes("outil") || c.includes("tool")
  ) return "high";

  return "medium";
}

// ── Build matrix rows from paretoIssue.root_causes ──────────
function buildMatrixFromRootCauses(issue: ParetoItem) {
  const rows: {
    action: string;
    category: string;
    impact: "high" | "medium" | "low";
    effort: "high" | "medium" | "low";
  }[] = [];

  const usedActions = new Set<string>();

  (issue.root_causes ?? []).forEach((rc: any) => {
    // effort ← category name (per 5M table)
    const effort = getEffortFromCategory(rc.category ?? "");
    // impact ← importance field
    const impact: "high" | "medium" | "low" =
      rc.importance === "dominant"  ? "high"   :
      rc.importance === "secondary" ? "medium" : "low";

    (rc.causes ?? []).forEach((causeDesc: string) => {
      if (usedActions.has(causeDesc)) return;
      usedActions.add(causeDesc);
      rows.push({
        action:   causeDesc,
        category: rc.category ?? "",
        impact,
        effort,
      });
    });
  });

  // Sort: high impact + low effort first (quick wins at top)
  const score = (r: typeof rows[number]) => {
    const i = r.impact === "high" ? 3 : r.impact === "medium" ? 2 : 1;
    const e = r.effort === "low"  ? 3 : r.effort === "medium" ? 2 : 1;
    return i + e;
  };

  return rows.sort((a, b) => score(b) - score(a));
}

// ── Badge styles ─────────────────────────────────────────────
const impactStyle = {
  high:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  low:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const effortStyle = {
  low:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  high:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

// ── COMPONENT ────────────────────────────────────────────────
export const EffortMatrix = ({ analysisData }: { analysisData: any }) => {
  const { t } = useTranslation();
  const { objectives } = useSmartStore();

  const activeObjective = objectives.find(o => o.status === "in_progress");

  const paretoIssues: ParetoItem[] = activeObjective
    ? (analysisData?.paretoIssues ?? []).filter(
        (p: ParetoItem) =>
          p.key.toLowerCase() === activeObjective?.pareto_cause?.key?.toLowerCase()
      )
    : (() => {
        const top = [...(analysisData?.paretoIssues ?? [])]
          .sort((a: ParetoItem, b: ParetoItem) => b.count - a.count)[0];
        return top ? [top] : [];
      })();

  if (!paretoIssues.length) {
    return (
      <p className="text-sm text-gray-500 dark:text-slate-400">
        {t("recommendations.smart.noParetoIssues")}
      </p>
    );
  }

  return (
    <div>
      <h4 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">
        {t("dashboard.actionPrioritization")}
      </h4>

      {paretoIssues.map((issue, idx) => {
        if (!issue.root_causes?.length) return null;

        const rows = buildMatrixFromRootCauses(issue);
        if (!rows.length) return null;

        return (
          <div key={idx} className="mb-6">
            <h5 className="mb-2 font-medium text-slate-700 dark:text-slate-300">
              {issue.name}
            </h5>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                    <th className="text-left py-2 px-3 text-slate-600 dark:text-slate-300">
                      {t("dashboard.action")}
                    </th>
                    <th className="text-center py-2 px-3 text-slate-600 dark:text-slate-300">
                      {t("dashboard.impact")}
                    </th>
                    <th className="text-center py-2 px-3 text-slate-600 dark:text-slate-300">
                      {t("dashboard.effort")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                        {row.action}
                      </td>
                      <td className="text-center py-2 px-3">
                        <Badge className={impactStyle[row.impact]}>
                          {t(`dashboard.${row.impact}`)}
                        </Badge>
                      </td>
                      <td className="text-center py-2 px-3">
                        <Badge className={effortStyle[row.effort]}>
                          {t(`dashboard.${row.effort}`)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <p className="mt-4 text-sm italic text-slate-500 dark:text-slate-400">
        {t("dashboard.recommendedStartHighImpactLowEffort")}
      </p>
    </div>
  );
};