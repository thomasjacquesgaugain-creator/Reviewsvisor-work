import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { getUserEstablishments, EstablishmentData } from "@/services/establishments";
import { useEstablishmentStore } from "@/store/establishmentStore";
import { toastActiveEstablishment } from "@/lib/toastActiveEstablishment";
import {
  ESTABLISHMENT_CARD_HOVER,
  ESTABLISHMENT_CARD_HOVER_ACTIVE,
  ESTABLISHMENT_CARD_HOVER_NEUTRAL,
} from "@/lib/establishmentCardStyles";
import { sortEstablishmentsWithActiveFirst } from "@/utils/sortEstablishmentsWithActiveFirst";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Check, Plus, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { updateSubscriptionQuantity } from "@/lib/stripe";
import { EVT_LIST_UPDATED } from "@/types/etablissement";

export function EstablishmentsSettings() {
  const { user } = useAuth();
  const { activePlaceId, setActivePlace } = useEstablishmentStore();
  const navigate = useNavigate();
  const [establishments, setEstablishments] = useState<EstablishmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingActiveId, setSettingActiveId] = useState<string | null>(null);
  const [establishmentToDelete, setEstablishmentToDelete] = useState<EstablishmentData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadEstablishments = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getUserEstablishments();
      setEstablishments(data);
    } catch (error) {
      console.error("Error loading establishments:", error);
      toast.error("Erreur lors du chargement des établissements");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadEstablishments();
    }
  }, [user, loadEstablishments]);

  const sortedEstablishments = useMemo(
    () => sortEstablishmentsWithActiveFirst(establishments, activePlaceId),
    [establishments, activePlaceId]
  );

  const handleSetActive = async (establishment: EstablishmentData) => {
    setSettingActiveId(establishment.place_id);
    try {
      await setActivePlace(establishment.place_id, {
        place_id: establishment.place_id,
        name: establishment.name,
        formatted_address: establishment.formatted_address,
        lat: establishment.lat,
        lng: establishment.lng,
        phone: establishment.phone,
        website: establishment.website,
        rating: establishment.rating,
      });
      toastActiveEstablishment(establishment.name);
      await loadEstablishments();
    } catch (error) {
      toast.error("Impossible de définir l'établissement actif");
    } finally {
      setSettingActiveId(null);
    }
  };

  const handleDeleteClick = (est: EstablishmentData) => {
    setEstablishmentToDelete(est);
  };

  const handleDeleteConfirm = async () => {
    if (!establishmentToDelete || !user) return;
    const est = establishmentToDelete;
    setDeletingId(est.id ?? est.place_id);
    try {
      let query = supabase
        .from("établissements")
        .delete()
        .eq("user_id", user.id);
      if (est.id) {
        query = query.eq("id", est.id);
      } else {
        query = query.eq("place_id", est.place_id);
      }
      const { error } = await query;
      if (error) throw error;
      setEstablishmentToDelete(null);
      const remaining = establishments.filter(
        (e) => (e.id ?? e.place_id) !== (est.id ?? est.place_id)
      );
      setEstablishments(remaining);
      if (remaining.length > 0 && activePlaceId === est.place_id) {
        const first = remaining[0];
        await setActivePlace(first.place_id, {
          place_id: first.place_id,
          name: first.name,
          formatted_address: first.formatted_address,
          lat: first.lat,
          lng: first.lng,
          phone: first.phone,
          website: first.website,
          rating: first.rating,
        });
      }
      await loadEstablishments();
      window.dispatchEvent(new CustomEvent(EVT_LIST_UPDATED));

      // Mettre à jour la quantité d'établissements supplémentaires dans Stripe (1 inclus dans le plan)
      const newExtraQuantity = Math.max(0, remaining.length - 1);
      try {
        await updateSubscriptionQuantity(newExtraQuantity);
      } catch (stripeErr) {
        console.error("Erreur mise à jour Stripe après suppression:", stripeErr);
        toast.error("Abonnement mis à jour en base, mais la facturation Stripe n'a pas pu être synchronisée.");
      }

      toast.success("Établissement supprimé");
    } catch (error: unknown) {
      console.error("Error deleting establishment:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la suppression"
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Chargement des établissements...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Établissements & accès</h1>
        <Button onClick={() => navigate("/etablissement")} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Ajouter un établissement</span>
        </Button>
      </div>

      {sortedEstablishments.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Aucun établissement</p>
          <Button onClick={() => navigate("/etablissement")} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Ajouter votre premier établissement</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedEstablishments.map((est) => {
            const isActive = activePlaceId === est.place_id;
            const isSettingActive = settingActiveId === est.place_id;
            return (
              <div
                key={est.id ?? est.place_id}
                className={cn(
                  "border rounded-lg p-4 shadow-sm",
                  ESTABLISHMENT_CARD_HOVER,
                  isActive
                    ? "border-blue-200 bg-blue-50"
                    : "border-gray-200 bg-white",
                  isActive ? ESTABLISHMENT_CARD_HOVER_ACTIVE : ESTABLISHMENT_CARD_HOVER_NEUTRAL
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className={cn("h-5 w-5 shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />
                      <h3 className={cn("text-lg font-medium", isActive ? "text-blue-900" : "text-gray-900")}>
                        {est.name}
                      </h3>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <Check className="h-3 w-3" />
                          Actif
                        </span>
                      )}
                    </div>
                    {est.formatted_address && (
                      <p className="text-sm text-gray-500 ml-7">{est.formatted_address}</p>
                    )}
                    {est.rating != null && (
                      <p className="flex items-center gap-1 text-sm text-gray-500 ml-7 mt-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span>{Number(est.rating).toFixed(1)}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex flex-row gap-2">
                      {!isActive && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSetActive(est)}
                          disabled={isSettingActive}
                          className="gap-2"
                        >
                          {isSettingActive ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          <span>Définir comme actif</span>
                        </Button>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate("/etablissement")}
                        className="gap-2 bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-500"
                      >
                        Gérer
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(est)}
                      className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 self-end"
                      aria-label="Supprimer cet établissement"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!establishmentToDelete} onOpenChange={(open) => !open && setEstablishmentToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;établissement</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet établissement ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEstablishmentToDelete(null)}
              disabled={!!deletingId}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={!!deletingId}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
