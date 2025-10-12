export type Avis = {
  id: string;
  etablissementId: string;
  source?: "google" | "facebook" | "thefork" | "autre";
  note: number;     // 1..5
  texte: string;
  date: string;     // ISO
};