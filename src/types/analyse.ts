export type AnalyseIA = {
  id: string;
  etablissementId: string;
  createdAt: string; // ISO
  resume: string;
  sentimentGlobal: { score: number; label: "Très négatif" | "Négatif" | "Neutre" | "Positif" | "Très positif" };
  stats: { totalAvis: number; moyenne: number; positifsPct: number; negatifsPct: number; periode: { from?: string; to?: string } };
  themes: Array<{ theme: string; score: number; verbatims: string[] }>;
  elogesTop3: string[];
  irritantsTop3: string[];
  recommandations: string[];
  tendances: string;
};