import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
} from "recharts";
import { listAll } from "@/services/reviewsService";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: string;
  establishmentName?: string;
}

interface MonthlyData {
  month: string;
  monthLabel: string;
  avgRating: number;
  totalCount: number;
}

export function TrendModal({
  open,
  onOpenChange,
  establishmentId,
  establishmentName,
}: TrendModalProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [maxCount, setMaxCount] = useState(50);

  useEffect(() => {
    if (!open || !establishmentId) {
      return;
    }

    const loadTrendData = async () => {
      setIsLoading(true);

      try {
        // Récupérer tous les avis de l'établissement
        const allReviews = await listAll(establishmentId);

        if (!allReviews || allReviews.length === 0) {
          setMonthlyData([]);
          return;
        }

        // Calculer les 12 derniers mois glissants
        const now = new Date();
        const months: Record<string, { ratings: number[]; count: number }> = {};

        // Initialiser les 12 derniers mois
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          months[monthKey] = { ratings: [], count: 0 };
        }

        // Agréger les avis par mois (utiliser published_at, create_time ou inserted_at comme fallback)
        allReviews.forEach((review) => {
          if (review.rating) {
            // Utiliser published_at en priorité, puis create_time, puis inserted_at
            const dateStr = review.published_at || review.create_time || review.inserted_at;
            if (dateStr) {
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

                if (months[monthKey]) {
                  months[monthKey].ratings.push(review.rating);
                  months[monthKey].count++;
                }
              }
            }
          }
        });

        // Convertir en tableau avec calcul de la moyenne
        const data: MonthlyData[] = Object.entries(months)
          .map(([monthKey, data]) => {
            const avgRating =
              data.ratings.length > 0
                ? data.ratings.reduce((sum, r) => sum + r, 0) /
                  data.ratings.length
                : 0;

            return {
              month: monthKey,
              monthLabel: monthKey, // Format "2025-03"
              avgRating: Math.round(avgRating * 10) / 10, // Arrondir à 1 décimale
              totalCount: data.count,
            };
          });

        // Ne pas filtrer les mois sans données - afficher tous les mois pour avoir un graphique complet
        // Calculer le maximum pour l'axe Y droit (arrondir à la dizaine supérieure, min 10, max 50)
        const maxTotalCount = data.length > 0 ? Math.max(...data.map(d => d.totalCount), 0) : 0;
        const roundedMax = maxTotalCount > 0 
          ? Math.min(Math.max(Math.ceil(maxTotalCount / 10) * 10, 10), 50)
          : 50;
        setMaxCount(roundedMax);
        setMonthlyData(data);
      } catch (error) {
        console.error("Error loading trend data:", error);
        setMonthlyData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrendData();
  }, [open, establishmentId]);

  const hasInsufficientData = !isLoading && monthlyData.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Tendance des avis</DialogTitle>
          <DialogDescription>
            {establishmentName
              ? `Évolution des avis pour ${establishmentName}`
              : "Évolution des avis sur les 12 derniers mois"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="h-96">
            <Skeleton className="h-full w-full" />
          </div>
        ) : hasInsufficientData ? (
          <div className="h-96 flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">
              Pas assez de données pour afficher une tendance.
            </p>
          </div>
        ) : (
          <div className="h-96 py-4">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlyData}
                  margin={{
                    top: 20,
                    right: 50,
                    left: 50,
                    bottom: 60,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="monthLabel"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    label={{
                      value: "Note",
                      angle: -90,
                      position: "insideLeft",
                      offset: -10,
                      style: { textAnchor: 'middle' }
                    }}
                    domain={[1.0, 5.0]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{
                      value: "Avis",
                      angle: 90,
                      position: "insideRight",
                      offset: -10,
                      style: { textAnchor: 'middle' }
                    }}
                    domain={[0, maxCount]}
                  />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name === "avgRating" || name === "Note moyenne") {
                        return [`${value}/5`, "Note moyenne"];
                      }
                      return [value, "Nombre d'avis"];
                    }}
                    labelFormatter={(label) => `Mois: ${label}`}
                  />
                  <Legend
                    formatter={(value) => {
                      if (value === "avgRating" || value === "Note moyenne") return "Note moyenne";
                      if (value === "totalCount" || value === "Nombre d'avis") return "Nombre d'avis";
                      return value;
                    }}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="totalCount"
                    fill="#F59E0B"
                    name="Nombre d'avis"
                  >
                    <LabelList 
                      dataKey="totalCount" 
                      position="top" 
                      style={{ fontSize: '11px', fill: '#666' }}
                    />
                  </Bar>
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="avgRating"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ fill: "#8B5CF6", r: 5, strokeWidth: 2 }}
                    name="Note moyenne"
                    label={{ 
                      formatter: (value: number) => value > 0 ? value.toFixed(1) : '',
                      position: 'top',
                      style: { fontSize: '11px', fill: '#8B5CF6', fontWeight: 'bold' }
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

