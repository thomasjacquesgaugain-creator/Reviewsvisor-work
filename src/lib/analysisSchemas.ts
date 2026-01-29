/**
 * Schémas Zod pour la validation stricte du format d'analyse v2
 * Format: v2-auto-universal
 */

import { z } from 'zod';

export const BusinessTypeSchema = z.enum([
  'restaurant',
  'salon_coiffure',
  'salle_sport',
  'serrurier',
  'retail_chaussures',
  'institut_beaute',
  'autre'
]);

export const BusinessTypeCandidateSchema = z.object({
  type: BusinessTypeSchema,
  confidence: z.number().min(0).max(100)
});

export const ThemeSchema = z.object({
  theme: z.string(),
  sentiment: z.enum(['positive', 'mixed', 'negative']),
  importance: z.number().min(0).max(100),
  evidence_quotes: z.array(z.string()),
  what_it_means: z.string()
});

export const PainPointSchema = z.object({
  issue: z.string(),
  why_it_matters: z.string(),
  impact: z.number().min(0).max(100),
  ease: z.number().min(0).max(100),
  first_step: z.string()
});

export const RecommendationSchema = z.object({
  title: z.string(),
  details: z.string(),
  expected_result: z.string(),
  priority: z.number().min(1).max(5)
});

export const ReplyTemplateSchema = z.object({
  title: z.string(),
  reply: z.string(),
  use_when: z.string()
});

export const AnalysisV2Schema = z.object({
  business_type: BusinessTypeSchema,
  business_type_confidence: z.number().min(0).max(100),
  business_type_candidates: z.array(BusinessTypeCandidateSchema),
  summary: z.object({
    one_liner: z.string(),
    what_customers_love: z.array(z.string()),
    what_customers_hate: z.array(z.string())
  }),
  kpis: z.object({
    avg_rating: z.number().nullable(),
    total_reviews: z.number().nullable(),
    positive_ratio_estimate: z.number().min(0).max(100),
    negative_ratio_estimate: z.number().min(0).max(100)
  }),
  themes_universal: z.array(ThemeSchema),
  themes_industry: z.array(ThemeSchema),
  pain_points_prioritized: z.array(PainPointSchema),
  recommendations: z.object({
    quick_wins_7_days: z.array(RecommendationSchema),
    projects_30_days: z.array(RecommendationSchema)
  }),
  reply_templates: z.object({
    positive: z.array(ReplyTemplateSchema),
    neutral: z.array(ReplyTemplateSchema),
    negative: z.array(ReplyTemplateSchema)
  })
});

export type AnalysisV2 = z.infer<typeof AnalysisV2Schema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type PainPoint = z.infer<typeof PainPointSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type ReplyTemplate = z.infer<typeof ReplyTemplateSchema>;

/**
 * Parser sécurisé avec fallback
 */
export function parseAnalysisV2(data: unknown): { success: true; data: AnalysisV2 } | { success: false; error: string; fallback: Partial<AnalysisV2> } {
  const result = AnalysisV2Schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }

  // Fallback minimal pour éviter de casser le dashboard
  const fallback: Partial<AnalysisV2> = {
    business_type: 'autre',
    business_type_confidence: 0,
    business_type_candidates: [],
    summary: {
      one_liner: 'Analyse en cours...',
      what_customers_love: [],
      what_customers_hate: []
    },
    kpis: {
      avg_rating: null,
      total_reviews: null,
      positive_ratio_estimate: 0,
      negative_ratio_estimate: 0
    },
    themes_universal: [],
    themes_industry: [],
    pain_points_prioritized: [],
    recommendations: {
      quick_wins_7_days: [],
      projects_30_days: []
    },
    reply_templates: {
      positive: [],
      neutral: [],
      negative: []
    }
  };

  return {
    success: false,
    error: result.error.message,
    fallback
  };
}
