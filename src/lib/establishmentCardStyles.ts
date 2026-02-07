/**
 * Styles partagés pour les cartes d'établissement (Établissements enregistrés + Établissements & accès).
 * Hover identique : transition douce, léger lift, shadow, bordure/teinte.
 */

/** Classe commune pour l'effet hover des cartes établissement (transition + lift + shadow). */
export const ESTABLISHMENT_CARD_HOVER =
  "transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md";

/** Classes hover pour une carte non active (teinte + bordure). */
export const ESTABLISHMENT_CARD_HOVER_NEUTRAL =
  "hover:bg-accent/5 hover:border-primary/20";

/** Classes hover pour une carte active (conserve le bleu, bordure un peu plus marquée au survol). */
export const ESTABLISHMENT_CARD_HOVER_ACTIVE = "hover:border-blue-300";
