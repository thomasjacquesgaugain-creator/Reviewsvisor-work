import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Line, Label, Legend, LabelList, ReferenceLine, Customized } from "recharts";
import { ParetoItem, ThemeAnalysis, QualitativeData, Review } from "@/types/analysis";
import { useTranslation,Trans } from "react-i18next";
import { AlertTriangle, CheckCircle, TrendingDown, TrendingUp, BarChart3, ArrowRight } from "lucide-react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { analyzeRootCauses } from "@/utils/rootCauseAnalysis";
import { RootCauseAnalysisModal } from "./RootCauseAnalysisModal";
import { useAnalysisFilters } from "./AnalysisFiltersContext";

interface ParetoSectionProps {
  issues: ParetoItem[];
  strengths: ParetoItem[];
  themes?: ThemeAnalysis[];
  qualitative?: QualitativeData;
}

// Composant personnalisé pour le tag "Seuil 80%" (callout à droite)
// Utilise la scale de l'axe Y droit (% cumulé) pour un alignement parfait avec la ReferenceLine
const ThresholdTag = ({ offset, fill = "#ef4444", label = "Seuil 80%" }: any) => {
  const threshold = 80;

  // offset = zone de tracé réelle (prend en compte margins)
  // offset: { left, top, width, height }
  if (!offset) return null;

  const y = offset.top + (1 - threshold / 100) * offset.height; // ✅ Y exact sur l'axe % (0..100)
  const x = offset.left + offset.width + 32; // ✅ dans la marge droite

  // const label = `Seuil ${threshold}%`;
  const fontSize = 12;
  const paddingX = 10;
  const paddingY = 6;

  // largeur approx (suffisant ici)
  const w = label.length * 7 + paddingX * 2;
  const h = fontSize + paddingY * 2;

  return (
    <g>
      <rect
        x={x}
        y={y - h / 2}
        width={w}
        height={h}
        rx={6}
        fill="hsl(var(--background))"
        stroke={fill}
        strokeWidth={1}
      />
      <text
        x={x + w / 2}
        y={y + fontSize / 2 - 2}
        textAnchor="middle"
        fill={fill}
        fontSize={fontSize}
        fontWeight={600}
      >
        {label}
      </text>
    </g>
  );
};

const ISSUE_COLORS = ['#ef4444', '#f97316', '#eab308']; // red, orange, yellow
const STRENGTH_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6']; // green, blue, purple
const CHART_GRID = "hsl(var(--border))";
const CHART_TEXT = "hsl(var(--muted-foreground))";
const CHART_FOREGROUND = "hsl(var(--foreground))";
const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--background))",
  borderColor: "hsl(var(--border))",
  borderRadius: "0.75rem",
  color: "hsl(var(--foreground))",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.18)",
};

// Fonction pour générer l'analyse des irritants
function generateIssuesAnalysis(items: ParetoItem[],t: (key: string, opts?: any) => string): JSX.Element {
  if (!items || items.length === 0) {
    return <p>{t("analysis.pareto.noData")}</p>;
  }

  const totalMentions = items.reduce((sum, item) => sum + item.count, 0);
  const topItems = items.slice(0, 3);
  const topItemsTotal = topItems.reduce((sum, item) => sum + item.count, 0);
  const topItemsPercentage = totalMentions > 0 ? Math.round((topItemsTotal / totalMentions) * 100) : 0;

  const paragraphs: JSX.Element[] = [];

  paragraphs.push(
    <p key="pareto-principle">
      <Trans
      i18nKey="analysis.pareto.issuesParetoPrinciple"
      values={{ percentage: topItemsPercentage, count: topItems.length }}
      components={{ bold: <strong className="text-slate-900 dark:text-slate-100" /> }}
    />    </p>
  );

  const itemsList = topItems.map((item, index) => {
    // Pourcentage basé sur le total des mentions d'irritants (arrondi à 1 décimale max pour cohérence avec le tooltip)
    const percentage = totalMentions > 0 ? Math.round(((item.count / totalMentions) * 100) * 10) / 10 : 0;
    return (
      <p key={`item-${index}`} className="ml-4">
        <Trans
        i18nKey="analysis.pareto.issuesItem"
        values={{ rank: index + 1, name: item.name, percentage, count: item.count }}
        components={{ bold: <strong className="text-slate-900 dark:text-slate-100" /> }}
      />      
      </p>
    );
  });

  paragraphs.push(<div key="items-list">{itemsList}</div>);

  if (topItems.length > 0) {
    const mainIssue = topItems[0];
    paragraphs.push(
      <p key="recommendation" className="mt-2">
      <Trans
      i18nKey="analysis.pareto.issuesRecommendation"
      values={{ name: mainIssue.name }}
      components={{ bold: <strong className="text-slate-900 dark:text-slate-100" /> }}
    />      
    </p>
    );
  }

  return <>{paragraphs}</>;
}

// Fonction pour générer l'analyse des satisfactions
function generateStrengthsAnalysis(items: ParetoItem[],t: (key: string, opts?: any) => string): JSX.Element {
  if (!items || items.length === 0) {
    return <p>{t("analysis.pareto.noData")}</p>;
  }

  const totalMentions = items.reduce((sum, item) => sum + item.count, 0);
  // Afficher les 3 premiers items (cohérent avec le graphique qui affiche 3 barres)
  const topItems = items.slice(0, 3);

  const paragraphs: JSX.Element[] = [];

  paragraphs.push(
    <p key="intro">
    <Trans
      i18nKey="analysis.pareto.strengthsIntro"
      components={{ bold: <strong className="text-slate-900 dark:text-slate-100" /> }}
    />   
    </p>
  );

  const itemsList = topItems.map((item, index) => {
    // Pourcentage basé sur le total des mentions de satisfactions (arrondi à 1 décimale max pour cohérence avec le tooltip)
    const percentage = totalMentions > 0 ? Math.round(((item.count / totalMentions) * 100) * 10) / 10 : 0;
    return (
      <p key={`item-${index}`} className="ml-4">
      <Trans
        i18nKey="analysis.pareto.strengthsItem"
        values={{ rank: index + 1, name: item.name, percentage, count: item.count }}
        components={{ bold: <strong className="text-slate-900 dark:text-slate-100" /> }}
      />      
      </p>
    );
  });

  paragraphs.push(<div key="items-list">{itemsList}</div>);

  paragraphs.push(
    <p key="recommendation" className="mt-2">
    <Trans
      i18nKey="analysis.pareto.strengthsRecommendation"
      components={{ bold: <strong className="text-slate-900 dark:text-slate-100" /> }}
    />    
    </p>
  );

  return <>{paragraphs}</>;
}

export function ParetoSection({ issues, strengths, themes = [], qualitative }: ParetoSectionProps) {
  const { t } = useTranslation();
  const { filteredReviews } = useAnalysisFilters();
  const [activeIssueIndex, setActiveIssueIndex] = useState<number | null>(null);
  const [activeStrengthIndex, setActiveStrengthIndex] = useState<number | null>(null);
  const [openIssuesModal, setOpenIssuesModal] = useState(false);
  const [openStrengthsModal, setOpenStrengthsModal] = useState(false);
  const [openRootCauseModal, setOpenRootCauseModal] = useState(false);
  

  const safeIssues = issues || [];
  const safeStrengths = strengths || [];
  
  // Inverser l'ordre pour avoir la plus grande barre en bas
  const reversedIssues = [...safeIssues]
  .sort((a, b) => a.count - b.count) // sort ascending by count
  
  const reversedStrengths =  [...safeStrengths].sort(
  (a, b) => a.count - b.count
);

  // Préparer l'analyse des causes racines pour le problème principal
  const mainIssue = safeIssues.length > 0 ? safeIssues[0] : null;
  const rootCauseAnalysis = useMemo(() => {
    if (!mainIssue || !qualitative) return null;
    return analyzeRootCauses(
      mainIssue.name,
      themes,
      qualitative,
      safeIssues,
      filteredReviews
    );
  }, [mainIssue, themes, qualitative, safeIssues, filteredReviews]);

  // Préparer les données pour le diagramme de Pareto détaillé (irritants)
  const detailedIssuesData = useMemo(() => {
    if (!safeIssues || safeIssues.length === 0) return [];
    
    // Trier par ordre décroissant de count
    const sorted = [...safeIssues].sort((a, b) => b.count - a.count);
    const total = sorted.reduce((sum, item) => sum + item.count, 0);
    
    let cumulative = 0;
    return sorted.map((item, index) => {
      cumulative += item.count;
      // Pourcentage basé sur le total des mentions d'irritants (arrondi à 1 décimale max)
      const percentage = total > 0 ? Math.round(((item.count / total) * 100) * 10) / 10 : 0;
      const cumulativePercentage = total > 0 ? Math.round((cumulative / total) * 100) : 0;
      
      return {
        name: item.name,
        count: item.count,
        percentage,
        cumulativePercentage,
        cumulative
      };
    });
  }, [safeIssues]);

  // Préparer les données pour le diagramme de Pareto détaillé (satisfactions)
  const detailedStrengthsData = useMemo(() => {
    if (!safeStrengths || safeStrengths.length === 0) return [];
    
    // Trier par ordre décroissant de count
    const sorted = [...safeStrengths].sort((a, b) => b.count - a.count);
    const total = sorted.reduce((sum, item) => sum + item.count, 0);
    
    let cumulative = 0;
    return sorted.map((item, index) => {
      cumulative += item.count;
      // Pourcentage basé sur le total des mentions de satisfactions (arrondi à 1 décimale max)
      const percentage = total > 0 ? Math.round(((item.count / total) * 100) * 10) / 10 : 0;
      const cumulativePercentage = total > 0 ? Math.round((cumulative / total) * 100) : 0;
      
      return {
        name: item.name,
        count: item.count,
        percentage,
        cumulativePercentage,
        cumulative
      };
    });
  }, [safeStrengths]);

  return (
    <div className="space-y-6">

      {/* Irritants */}
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <CardTitle>{t("analysis.pareto.issues", "Top irritants - Avis négatifs")}</CardTitle>
            </div>
            {safeIssues.length > 0 && (
              <Dialog open={openIssuesModal} onOpenChange={setOpenIssuesModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <BarChart3 className="w-4 h-4" />
                     {t("analysis.pareto.detailedPareto")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t("analysis.pareto.issuesModalTitle")}</DialogTitle>
                  </DialogHeader>
                  <div className="h-96 mt-4 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={detailedIssuesData} margin={{ top: 20, right: 140, bottom: 50, left: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={100}
                          tick={{ fontSize: 12, fill: CHART_TEXT }}
                        />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fontSize: 12, fill: CHART_TEXT }}
                        >
                          <Label value={t("analysis.pareto.mentionsCount")} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 14, fill: CHART_TEXT }} />
                        </YAxis>
                        <YAxis 
                          yAxisId="cumule" 
                          orientation="right"
                          domain={[0, 100]}
                          tick={{ fontSize: 12, fill: CHART_TEXT }}
                          tickFormatter={(value) => `${value}%`}
                          width={50}
                        >
                          <Label value={t("analysis.pareto.cumulativePercent")} angle={90} position="insideRight" style={{ textAnchor: 'middle', fontSize: 14, fill: CHART_TEXT }} />
                        </YAxis>
                        <Tooltip
                          contentStyle={TOOLTIP_STYLE}
                          labelStyle={{ color: CHART_FOREGROUND }}
                          itemStyle={{ color: CHART_FOREGROUND }}
                          formatter={(value: number, name: string, props: any) => {
                            if (name === 'count') {
                              // Utiliser le percentage calculé dans detailedIssuesData (basé sur total des mentions d'irritants)
                              const percentage = props.payload.percentage;
                              return [`${t("analysis.pareto.mentions")} : ${value} (${percentage}%)`, t("analysis.pareto.issuesShare")];
                            } else {
                              return [`${value}%`, t("analysis.pareto.cumulativePercent")];
                            }
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px', color: CHART_FOREGROUND }}
                          payload={[
                            { value: t("analysis.pareto.mentions"), type: 'square', color: '#3B82F6' },
                            { value: t("analysis.pareto.cumulativePercent"), type: 'line', color: CHART_FOREGROUND }
                          ]}
                        />
                        <Bar yAxisId="left" dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                          {detailedIssuesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} />
                          ))}
                          <LabelList 
                            dataKey="percentage" 
                            position="top" 
                            formatter={(value: number) => `${value}%`}
                            style={{ fontSize: '12px', fill: CHART_FOREGROUND }}
                          />
                        </Bar>
                        <Line
                          yAxisId="cumule"
                          type="monotone"
                          dataKey="cumulativePercentage"
                          stroke="hsl(var(--foreground))"
                          strokeWidth={2}
                          dot={{ r: 5, fill: 'hsl(var(--foreground))' }}
                          activeDot={{ r: 7 }}
                        >
                          <LabelList 
                            dataKey="cumulativePercentage" 
                            position="top" 
                            formatter={(value: number) => `${value}%`}
                            style={{ fontSize: '12px', fill: CHART_FOREGROUND }}
                          />
                        </Line>
                        <ReferenceLine 
                          yAxisId="cumule" 
                          y={80} 
                          stroke="#ef4444" 
                          strokeWidth={2} 
                          strokeDasharray="4 4"
                        />
                        <Customized component={(props: any) => <ThresholdTag {...props} fill="#ef4444" label={t("analysis.pareto.threshold")} />} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/30 dark:border-blue-900/50">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <Trans
                        i18nKey="analysis.pareto.issuesParetoInfo"
                        components={{ bold: <strong className="text-slate-900 dark:text-slate-100" /> }}
                      />                   
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {safeIssues.length > 0 ? (
            <>
              {/* Phrase explicative courte */}
              <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800/40 dark:border-slate-700">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <Trans
                    i18nKey="analysis.pareto.frequencyNote"
                    components={{ bold: <strong className="text-slate-900 dark:text-slate-100" /> }}
                  />
                </p>
              </div>
              
              <div className="flex flex-col items-center justify-center w-full px-6">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reversedIssues}
                      layout="vertical"
                      margin={{ top: 5, right: 100, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        dx={-10}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        labelStyle={{ color: CHART_FOREGROUND }}
                        itemStyle={{ color: CHART_FOREGROUND }}
                        formatter={(value: number, name: string, props: any) => {
                          // Recalculer le percentage basé sur le total des mentions d'irritants (cohérent avec detailedIssuesData)
                          const totalMentions = safeIssues.reduce((sum, item) => sum + item.count, 0);
                          const percentage = totalMentions > 0 ? Math.round(((value / totalMentions) * 100) * 10) / 10 : 0;
                          return [`${t("analysis.pareto.mentions")} : ${value} (${percentage}%)`, t("analysis.pareto.issuesShare")];
                        }}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {reversedIssues.map((entry, index) => {
                          const originalIndex = safeIssues.length - 1 - index;
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={ISSUE_COLORS[originalIndex % ISSUE_COLORS.length]}
                              style={{
                                filter: activeIssueIndex === originalIndex ? 'brightness(1.15) drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none',
                                transform: activeIssueIndex === originalIndex ? 'scaleY(1.02)' : 'scaleY(1)',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={() => setActiveIssueIndex(originalIndex)}
                              onMouseLeave={() => setActiveIssueIndex(null)}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Légende axe X - centrée par rapport à l'axe X du graphique */}
                <div className="pl-[100px] flex justify-center" style={{ marginTop: '4px' }}>
                  <p className="text-sm text-slate-700 dark:text-slate-300 text-center">{t("analysis.pareto.xAxisLabel")}</p>
                </div>
              </div>

              {/* Séparation entre graphique et analyse */}
              <div className="pt-6 mt-6">
                {/* Petite ligne décorative centrée */}
                <div className="w-16 h-0.5 bg-slate-200 dark:bg-slate-700 mx-auto my-4"></div>
                
                {/* Section Analyse */}
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b-2 border-red-400 pb-1">
                    {t("analysis.pareto.analysis")}
                  </h3>
                </div>
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
                  {generateIssuesAnalysis(safeIssues,t)}
                  
                  {/* CTA discret sur la cause principale */}
                  {safeIssues.length > 0 && rootCauseAnalysis && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                        onClick={() => setOpenRootCauseModal(true)}
                      >
                        <ArrowRight className="w-4 h-4" />
                        {t("analysis.pareto.analyzeCause", { name: safeIssues[0]?.name })}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>{t("analysis.pareto.noIssues", "Aucun irritant identifié")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points forts */}
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <CardTitle>{t("analysis.pareto.strengths", "Top satisfactions - Avis positifs")}</CardTitle>
            </div>
            {safeStrengths.length > 0 && (
              <Dialog open={openStrengthsModal} onOpenChange={setOpenStrengthsModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <BarChart3 className="w-4 h-4" />
                     {t("analysis.pareto.detailedPareto")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t("analysis.pareto.strengthsModalTitle")}</DialogTitle>
                  </DialogHeader>
                  <div className="h-96 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={detailedStrengthsData} margin={{ top: 20, right: 140, bottom: 50, left: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={100}
                          tick={{ fontSize: 12, fill: CHART_TEXT }}
                        />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fontSize: 12, fill: CHART_TEXT }}
                        >
                          <Label value={t("analysis.pareto.mentionsCount")} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 14, fill: CHART_TEXT }} />
                        </YAxis>
                        <YAxis 
                          yAxisId="cumule" 
                          orientation="right"
                          domain={[0, 100]}
                          tick={{ fontSize: 12, fill: CHART_TEXT }}
                          tickFormatter={(value) => `${value}%`}
                          width={50}
                        >
                          <Label value={t("analysis.pareto.cumulativePercent")} angle={90} position="insideRight" style={{ textAnchor: 'middle', fontSize: 14, fill: CHART_TEXT }} />
                        </YAxis>
                        <Tooltip
                          contentStyle={TOOLTIP_STYLE}
                          labelStyle={{ color: CHART_FOREGROUND }}
                          itemStyle={{ color: CHART_FOREGROUND }}
                          formatter={(value: number, name: string, props: any) => {
                            if (name === 'count') {
                              // Utiliser le percentage calculé dans detailedStrengthsData (basé sur total des mentions de satisfactions)
                              const percentage = props.payload.percentage;
                              return [`${t("analysis.pareto.mentions")} : ${value} (${percentage}%)`, t("analysis.pareto.strengthsShare")];
                            } else {
                              return [`${value}%`, t("analysis.pareto.cumulativePercent")];
                            }
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px', color: CHART_FOREGROUND }}
                          payload={[
                            { value: t("analysis.pareto.mentions"), type: 'square', color: '#3B82F6' },
                            { value: t("analysis.pareto.cumulativePercent"), type: 'line', color: CHART_FOREGROUND }
                          ]}
                        />
                        <Bar yAxisId="left" dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                          {detailedStrengthsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} />
                          ))}
                        </Bar>
                        <Line
                          yAxisId="cumule"
                          type="monotone"
                          dataKey="cumulativePercentage"
                          stroke="hsl(var(--foreground))"
                          strokeWidth={2}
                          dot={{ r: 5, fill: 'hsl(var(--foreground))' }}
                          activeDot={{ r: 7 }}
                        >
                          <LabelList 
                            dataKey="cumulativePercentage" 
                            position="top" 
                            formatter={(value: number) => `${value}%`}
                            style={{ fontSize: '12px', fill: CHART_FOREGROUND }}
                          />
                        </Line>
                        <ReferenceLine 
                          yAxisId="cumule" 
                          y={80} 
                          stroke="#22c55e" 
                          strokeWidth={2} 
                          strokeDasharray="4 4"
                        />
                        <Customized component={(props: any) => <ThresholdTag {...props} fill="#22c55e" label={t("analysis.pareto.threshold")}/>} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/30 dark:border-green-900/50">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <Trans
                        i18nKey="analysis.pareto.strengthsParetoInfo"
                        components={{ bold: <strong className="text-slate-900 dark:text-slate-100" /> }}
                      />
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {safeStrengths.length > 0 ? (
            <>
              {/* Phrase explicative courte */}
              <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800/40 dark:border-slate-700">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <Trans
                    i18nKey="analysis.pareto.strengthsFrequencyNote"
                    components={{ bold: <strong className="text-slate-900 dark:text-slate-100" /> }}
                  />                
                  </p>
              </div>
              
              <div className="flex flex-col items-center justify-center w-full px-6">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reversedStrengths}
                      layout="vertical"
                      margin={{ top: 5, right: 100, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        dx={-10}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        labelStyle={{ color: CHART_FOREGROUND }}
                        itemStyle={{ color: CHART_FOREGROUND }}
                        formatter={(value: number, name: string, props: any) => {
                          // Recalculer le percentage basé sur le total des mentions de satisfactions (cohérent avec detailedStrengthsData)
                          const totalMentions = safeStrengths.reduce((sum, item) => sum + item.count, 0);
                          const percentage = totalMentions > 0 ? Math.round(((value / totalMentions) * 100) * 10) / 10 : 0;
                          return [`${t("analysis.pareto.mentions")} : ${value} (${percentage}%)`, t("analysis.pareto.strengthsShare")];
                        }}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {reversedStrengths.map((entry, index) => {
                          const originalIndex = safeStrengths.length - 1 - index;
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={STRENGTH_COLORS[originalIndex % STRENGTH_COLORS.length]}
                              style={{
                                filter: activeStrengthIndex === originalIndex ? 'brightness(1.15) drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none',
                                transform: activeStrengthIndex === originalIndex ? 'scaleY(1.02)' : 'scaleY(1)',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={() => setActiveStrengthIndex(originalIndex)}
                              onMouseLeave={() => setActiveStrengthIndex(null)}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Légende axe X - centrée par rapport à l'axe X du graphique */}
                <div className="pl-[100px] flex justify-center" style={{ marginTop: '4px' }}>
                  <p className="text-sm text-slate-700 dark:text-slate-300 text-center">{t("analysis.pareto.xAxisLabel")}</p>
                </div>
              </div>

              {/* Séparation entre graphique et analyse */}
              <div className="pt-6 mt-6">
                {/* Petite ligne décorative centrée */}
                <div className="w-16 h-0.5 bg-slate-200 dark:bg-slate-700 mx-auto my-4"></div>
                
                {/* Section Analyse */}
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b-2 border-green-400 pb-1">
                    {t("analysis.pareto.analysis")}
                  </h3>
                </div>
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
                  {generateStrengthsAnalysis(safeStrengths,t)}
                  
                  {/* CTA discret sur le point fort principal */}
                  {safeStrengths.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                        onClick={() => {
                          // Placeholder pour future action d'analyse approfondie
                          console.log('Analyser le point fort:', safeStrengths[0]?.name);
                        }}
                      >
                        <ArrowRight className="w-4 h-4" />
                        {t("analysis.pareto.exploreStrength", { name: safeStrengths[0]?.name })}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>{t("analysis.pareto.noStrengths", "Aucune satisfaction identifiée")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal d'analyse des causes racines */}
      {rootCauseAnalysis && (
        <RootCauseAnalysisModal
          open={openRootCauseModal}
          onOpenChange={setOpenRootCauseModal}
          analysis={rootCauseAnalysis}
        />
      )}
    </div>
  );
}
