export type TakeawayTone = "neutral" | "positive" | "warning" | "critical";

export interface ProblemItem {
  theme: string;
  count: number;
  percentage: number;
}

export interface StrengthItem {
  theme: string;
  count: number;
  percentage: number;
}

export interface Review {
  note?: number;
  rating?: number;
  published_at?: string;
  create_time?: string;
  inserted_at?: string;
  created_at?: string;
  date?: string;
  text?:string;
  texte?:string;
}
export interface ReviewDash {
  note?: number;
  rating?: number;
  published_at?: string;
  create_time?: string;
  inserted_at?: string;
  created_at?: string;
  date?: string;
  text?:string;
  texte?:string;
}
export interface ActionPoint {
  ease: number;
  issue:string;
  impact:number;
  first_step:string;
  why_it_matters:string
}

export interface ScoreStatus {
  label: string;
  tone: TakeawayTone;
  ring: string;
  ringSoft: string;
  accent: string;
}

export interface ScoreGlobalSectionProps {
  reviewCount: number;
  avgRating?:number;
  positivePct?:number;
  ratingChange?:number;
  reviews?: Review[];
}

export interface MainProblemsSectionProps {
  problems: ProblemItem[];
  setMainIssue?: (issue: string) => void;
}

export interface MainStrengthsSectionProps {
  strengths: StrengthItem[];
}

export interface RiskAlertSectionProps {
   reviews?: Review[];
}

export interface OverallTrendSectionProps {
reviews?: Review[];
}

export interface RecommendedActionSectionProps {
  points: ActionPoint[];
  mainIssue: string;
}

export interface PotentialGainSectionProps {
  reviews?: Review[];
  recommendedActions?: ActionPoint[];
  mainIssue?: string;
  handleClick?:()=>void;
}

export interface KeyTakeawaysPanelProps {
  avgRating?:number;
  positivePct?:number;
  reviewCount?:number;
  mainProblems?: ProblemItem[];
  mainStrengths?: StrengthItem[];
  recommendedActions?: ActionPoint[];
  className?: string;
  reviews?: Review[];
  handleClick?:()=>void;
}

