/**
 * Normalisations légères (style "IA light"): on retire accents, casse, espaces multiples, ponctuation faible.
 * La similarité est évaluée avec une métrique simple (Jaro-Winkler ou cosine via une lib locale),
 * mais la barrière principale reste le fingerprint déterministe.
 */
import { remove as removeDiacritics } from "diacritics";
import stringSimilarity from "string-similarity";

export function norm(s: string) {
  return removeDiacritics((s || "").toLowerCase())
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

// hashing simple sans dépendance lourde
function simpleHash(s: string) {
  let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
  return "h" + (h >>> 0).toString(16);
}

/**
 * Fingerprint stable:
 *  - si commentaire présent: platf + auteur + note + commentaire normalisé
 *  - si pas de commentaire: platf + auteur + note + (date JJMMAAAA ou mois/année si floue)
 */
export function makeFingerprint(item: {
  platform: string; author: string; rating: number; comment?: string; review_date?: string | Date;
}) {
  const p = norm(item.platform);
  const a = norm(item.author);
  const r = String(item.rating || 0);
  const c = norm(item.comment || "");
  let d = "";
  if (item.review_date) {
    const dt = new Date(item.review_date);
    // on garde au moins jour/mois/année si dispo, sinon mois/année
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const day = String(dt.getUTCDate()).padStart(2, "0");
    d = `${y}-${m}-${day}`;
  }
  const base = c ? `${p}|${a}|${r}|${c}` : `${p}|${a}|${r}|${d}`;
  return simpleHash(base);
}

/**
 * Déduplication "in-batch" (avant envoi) pour éviter d'envoyer 2 fois quasi le même avis.
 */
export function dedupeBatch(items: any[]) {
  const out: any[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    const fp = makeFingerprint(it);
    it.fingerprint = fp;
    if (!seen.has(fp)) {
      seen.add(fp);
      out.push(it);
    }
  }
  return out;
}

/**
 * Fuzzy check (optionnel): pour un item, vérifier s'il est quasi identique à un existant par similarité texte.
 * Seuils conservateurs: 0.9 si commentaire, 0.8 sinon.
 */
export function isNearDuplicate(a: any, b: any) {
  const hasComment = !!(a.comment || b.comment);
  const s1 = norm(a.comment || `${a.author} ${a.rating}`);
  const s2 = norm(b.comment || `${b.author} ${b.rating}`);
  const score = stringSimilarity.compareTwoStrings(s1, s2); // 0..1
  return score >= (hasComment ? 0.9 : 0.8) && norm(a.platform) === norm(b.platform);
}