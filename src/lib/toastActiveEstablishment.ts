import { toast } from 'sonner';
import i18n from '@/i18n/config';

/**
 * Affiche le toast de confirmation quand l'utilisateur définit un établissement comme actif.
 * À appeler uniquement après une action utilisateur (sélection dans Dashboard ou page Établissement),
 * pas au chargement initial de la page.
 */
export function toastActiveEstablishment(name: string): void {
  toast.success(i18n.t('establishment.setAsActive', { name }));
}
