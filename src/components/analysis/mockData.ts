import { CompleteAnalysisData } from "@/types/analysis";

export const mockAnalysisData: CompleteAnalysisData = {
  overview: {
    averageRating: 4.2,
    totalReviews: 156,
    positivePercentage: 68.5,
    negativePercentage: 18.2,
    neutralPercentage: 13.3,
    trend: 'up',
    trendValue: 5.2
  },
  history: [
    { date: '2024-01', rating: 4.0, count: 12 },
    { date: '2024-02', rating: 4.1, count: 15 },
    { date: '2024-03', rating: 4.2, count: 18 },
    { date: '2024-04', rating: 4.3, count: 20 },
    { date: '2024-05', rating: 4.2, count: 22 },
    { date: '2024-06', rating: 4.3, count: 25 },
    { date: '2024-07', rating: 4.2, count: 24 }
  ],
  sentiment: {
    positive: 107,
    neutral: 21,
    negative: 28
  },
  paretoIssues: [
    { name: 'Temps d\'attente', count: 45, percentage: 28.8 },
    { name: 'Qualité des plats', count: 32, percentage: 20.5 },
    { name: 'Prix', count: 18, percentage: 11.5 }
  ],
  paretoStrengths: [
    { name: 'Qualité de la cuisine', count: 78, percentage: 50.0 },
    { name: 'Ambiance agréable', count: 56, percentage: 35.9 },
    { name: 'Service sympathique', count: 42, percentage: 26.9 }
  ],
  themes: [
    {
      theme: 'Service',
      score: 0.75,
      count: 65,
      verbatims: [
        'Service rapide et efficace',
        'Personnel très accueillant'
      ]
    },
    {
      theme: 'Qualité',
      score: 0.85,
      count: 89,
      verbatims: [
        'Plats délicieux et bien préparés',
        'Qualité irréprochable'
      ]
    },
    {
      theme: 'Prix',
      score: 0.60,
      count: 42,
      verbatims: [
        'Rapport qualité-prix correct',
        'Un peu cher pour ce que c\'est'
      ]
    },
    {
      theme: 'Ambiance',
      score: 0.80,
      count: 58,
      verbatims: [
        'Ambiance chaleureuse',
        'Cadre agréable'
      ]
    }
  ],
  qualitative: {
    topKeywords: [
      { word: 'délicieux', count: 45 },
      { word: 'excellent', count: 38 },
      { word: 'service', count: 32 },
      { word: 'ambiance', count: 28 },
      { word: 'qualité', count: 25 },
      { word: 'attente', count: 22 },
      { word: 'prix', count: 18 },
      { word: 'recommandé', count: 15 }
    ],
    keyVerbatims: [
      {
        text: 'Excellent restaurant, plats délicieux et service impeccable. Je recommande vivement !',
        rating: 5,
        sentiment: 'positive'
      },
      {
        text: 'Très bon rapport qualité-prix, ambiance agréable. Un peu d\'attente mais ça vaut le coup.',
        rating: 4,
        sentiment: 'positive'
      },
      {
        text: 'Service un peu lent mais la qualité des plats compense largement.',
        rating: 3,
        sentiment: 'neutral'
      },
      {
        text: 'Trop cher pour ce que c\'est, et l\'attente était vraiment longue.',
        rating: 2,
        sentiment: 'negative'
      }
    ]
  },
  diagnostic: {
    summary: 'Votre établissement bénéficie d\'une excellente réputation avec une note moyenne de 4.2/5. Les points forts principaux sont la qualité de la cuisine et l\'ambiance agréable. Les principaux points d\'amélioration concernent les temps d\'attente et la perception des prix.',
    topStrengths: [
      { theme: 'Qualité de la cuisine', count: 78, percentage: 50.0 },
      { theme: 'Ambiance agréable', count: 56, percentage: 35.9 },
      { theme: 'Service sympathique', count: 42, percentage: 26.9 }
    ],
    topWeaknesses: [
      { theme: 'Temps d\'attente', count: 45, percentage: 28.8 },
      { theme: 'Qualité des plats', count: 32, percentage: 20.5 },
      { theme: 'Prix', count: 18, percentage: 11.5 }
    ],
    recommendations: [
      'Optimiser les temps d\'attente en améliorant l\'organisation du service',
      'Communiquer davantage sur la qualité des produits utilisés pour justifier les prix',
      'Maintenir la qualité de la cuisine qui est votre principal atout'
    ]
  }
};
