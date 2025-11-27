/**
 * Fonction utilitaire pour extraire le nom d'auteur d'un avis
 * Cherche dans tous les champs possibles et retourne "Anonyme" si aucun nom n'est trouvé
 */
export function getDisplayAuthor(review: any): string {
  if (!review) return "Anonyme";

  // Liste de tous les champs possibles pour le nom d'auteur, par ordre de priorité
  const possibleFields = [
    // Champs structurés (objets imbriqués)
    review.reviewer?.displayName,
    review.reviewer?.name,
    
    // Champs français courants
    review.Auteur,
    review.auteur,
    review["Nom"],
    review["nom"],
    review["Nom du client"],
    review["nom du client"],
    
    // Champs anglais courants
    review.author,
    review.author_name,
    review.authorName,
    review.user,
    review.user_name,
    review.userName,
    review.reviewer,
    review.reviewerName,
    review.reviewer_name,
    review.displayName,
    review.display_name,
    
    // Autres variantes
    review.name,
    review.customer_name,
    review.customerName,
  ];

  // Chercher le premier champ non vide
  for (const field of possibleFields) {
    if (field && typeof field === 'string') {
      const trimmed = field.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return "Anonyme";
}
