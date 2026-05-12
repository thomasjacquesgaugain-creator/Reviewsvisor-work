import { RootCauseAnalysis } from "@/utils/rootCauseAnalysis";
import { ParetoItem } from "@/types/analysis";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { RootCauseCategory } from "@/utils/rootCauseAnalysis";

/* ── Impact: spec §7.2 — % of negative reviews mentioning this cause
   < 10% → Low | 10–25% → Medium | > 25% → High              */
function getImpact(count: number, total: number): "High" | "Medium" | "Low" {
  const pct = (count / Math.max(total, 1)) * 100;
  if (pct > 25) return "High";
  if (pct >= 10) return "Medium";
  return "Low";
}

/* ── Effort: spec §7.2 5M table mapped from Ishikawa category name
   Méthodes / Environnement     → Low
   Main-d'œuvre / Processus     → Medium
   Outils & systèmes / Produit  → High                        */
function getEffortFromCause(cause: string): "High" | "Medium" | "Low" {
  const c = cause.toLowerCase();
  if (c.includes("système") || c.includes("outil") || c.includes("produit")) return "High";
  if (c.includes("processus") || c.includes("gestion") || c.includes("main") || c.includes("uvre")) return "Medium";
  if (c.includes("méthode") || c.includes("environnement") || c.includes("personnel") || c.includes("formation")) return "Low";
  return "Medium";
}

/* ---------------- ACTION MAP — uses cause descriptions directly ---------------- */

function getGenericActions(cause: string): string[] {
  return [
    `Analyser en détail la cause : ${cause}`,
    `Mettre en place un plan d'amélioration pour "${cause}"`,
    `Suivre les indicateurs liés à "${cause}"`
  ];
}

export function generateActionsFromCauses(
  categories: RootCauseCategory[]
): { action: string; cause: string }[] {
  const actions: { action: string; cause: string }[] = [];
  const usedActions = new Set<string>();

  categories.forEach(category => {
    category.causes.forEach(cause => {
      // Use cause.description directly as the action (from new RCA output)
      const baseActions = getGenericActions(cause.description);

      baseActions.forEach(action => {
        if (!usedActions.has(action)) {
          actions.push({ action: cause.description, cause: cause.description });
          usedActions.add(cause.description);
        }
      });
    });
  });

  return actions;
}

/* ---------------- buildImpactEffortMatrix ---------------- */

export function buildImpactEffortMatrix(
  rca: RootCauseAnalysis,
  paretoIssues: ParetoItem[],
  effortOverride?: "Low" | "Medium" | "High" 
) {
  if (!rca || !rca.categories?.length) return [];

  // Total negative reviews for this pareto issue
  const total = Math.max(
    paretoIssues.reduce((sum, i) => sum + i.count, 0),
    1
  );

  const rows: {
    action: string;
    impact: "High" | "Medium" | "Low";
    effort: "High" | "Medium" | "Low";
  }[] = [];

  const usedActions = new Set<string>();

  rca.categories.forEach(category => {
    category.causes.forEach(cause => {
      if (usedActions.has(cause.description)) return;
      usedActions.add(cause.description);
      // Impact from spec: cause.count / total negative reviews
      const impact = getImpact(cause.count || 1, total);

      // Effort from spec 5M: derived from Ishikawa category name
      const effort = effortOverride ?? getEffortFromCause(category.name);

      rows.push({
        action: cause.description, // description IS the action
        impact,
        effort
      });
    });
  });

  // Ranking
  const score = (r: typeof rows[number]) => {
    const impactScore = r.impact === "High" ? 3 : r.impact === "Medium" ? 2 : 1;
    const effortScore = r.effort === "Low" ? 3 : r.effort === "Medium" ? 2 : 1;
    return impactScore + effortScore;
  };

  return rows
    .sort((a, b) => score(b) - score(a))
}


/* ---------------- EffortMatrix COMPONENT — UNCHANGED ---------------- */

export const EffortMatrix = ({ analysisData }) => {
  const { t } = useTranslation();

  const rcaByIssue = analysisData?.rcaByIssue || {};
  const paretoIssues = (analysisData?.paretoIssues || []).slice(0, 1);

  console.log("RCA BY ISSUE:", rcaByIssue);

  if (!paretoIssues.length) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No issues available
      </p>
    );
  }

  return (
    <div>
      <h4 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">
        {t("dashboard.actionPrioritization")}
      </h4>

      {paretoIssues.map((issue, idx) => {
        const rca = rcaByIssue[issue.name];

        if (!rca) return null;

        const rows = buildImpactEffortMatrix(rca, [issue]);

        if (!rows.length) return null;

        return (
          <div key={idx} className="mb-6">
            <h5 className="mb-2 font-medium text-slate-700 dark:text-slate-300">
              {issue.name}
            </h5>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-3">
                      {t("dashboard.action")}
                    </th>
                    <th className="text-center py-2 px-3">
                      {t("dashboard.impact")}
                    </th>
                    <th className="text-center py-2 px-3">
                      {t("dashboard.effort")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 px-3">
                        {row.action}
                      </td>

                      <td className="text-center">
                        <Badge className="bg-red-100 text-red-700">
                          {row.impact}
                        </Badge>
                      </td>

                      <td className="text-center">
                        <Badge className="bg-yellow-100 text-yellow-700">
                          {row.effort}
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