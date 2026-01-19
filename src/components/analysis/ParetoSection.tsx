import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ParetoItem } from "@/types/analysis";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";

interface ParetoSectionProps {
  issues: ParetoItem[];
  strengths: ParetoItem[];
}

const ISSUE_COLORS = ['#ef4444', '#f97316', '#eab308']; // red, orange, yellow
const STRENGTH_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6']; // green, blue, purple

export function ParetoSection({ issues, strengths }: ParetoSectionProps) {
  const { t } = useTranslation();
  const [activeIssueIndex, setActiveIssueIndex] = useState<number | null>(null);
  const [activeStrengthIndex, setActiveStrengthIndex] = useState<number | null>(null);

  const safeIssues = issues || [];
  const safeStrengths = strengths || [];

  return (
    <div className="space-y-6">

      {/* Irritants */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <CardTitle>{t("analysis.pareto.issues", "Top irritants")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {safeIssues.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={safeIssues}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={90}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => [
                      `${value} (${props.payload.percentage.toFixed(1)}%)`,
                      t("analysis.pareto.mentions", "Mentions")
                    ]}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {safeIssues.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={ISSUE_COLORS[index % ISSUE_COLORS.length]}
                        style={{
                          filter: activeIssueIndex === index ? 'brightness(1.15) drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none',
                          transform: activeIssueIndex === index ? 'scaleY(1.02)' : 'scaleY(1)',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={() => setActiveIssueIndex(index)}
                        onMouseLeave={() => setActiveIssueIndex(null)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>{t("analysis.pareto.noIssues", "Aucun irritant identifié")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points forts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <CardTitle>{t("analysis.pareto.strengths", "Top satisfactions")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {safeStrengths.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={safeStrengths}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={90}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => [
                      `${value} (${props.payload.percentage.toFixed(1)}%)`,
                      t("analysis.pareto.mentions", "Mentions")
                    ]}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {safeStrengths.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STRENGTH_COLORS[index % STRENGTH_COLORS.length]}
                        style={{
                          filter: activeStrengthIndex === index ? 'brightness(1.15) drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none',
                          transform: activeStrengthIndex === index ? 'scaleY(1.02)' : 'scaleY(1)',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={() => setActiveStrengthIndex(index)}
                        onMouseLeave={() => setActiveStrengthIndex(null)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>{t("analysis.pareto.noStrengths", "Aucune satisfaction identifiée")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
