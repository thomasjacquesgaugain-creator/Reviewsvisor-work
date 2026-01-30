import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { getUserEstablishments, EstablishmentData } from "@/services/establishments";
import { useEstablishmentStore } from "@/store/establishmentStore";
import { toastActiveEstablishment } from "@/lib/toastActiveEstablishment";
import { Button } from "@/components/ui/button";
import { Building2, Check, Plus, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function EstablishmentsSettings() {
  const { user } = useAuth();
  const { activePlaceId, setActivePlace } = useEstablishmentStore();
  const navigate = useNavigate();
  const [establishments, setEstablishments] = useState<EstablishmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingActiveId, setSettingActiveId] = useState<string | null>(null);

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

      {establishments.length === 0 ? (
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
          {establishments.map((est) => {
            const isActive = activePlaceId === est.place_id;
            const isSettingActive = settingActiveId === est.place_id;
            return (
              <div
                key={est.id ?? est.place_id}
                className={cn(
                  "border rounded-lg p-4 transition-colors",
                  isActive ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
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
                  <div className="flex items-center gap-2 shrink-0">
                    {!isActive && (
                      <Button
                        variant="outline"
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
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/etablissement")}
                      className="gap-2"
                    >
                      Gérer
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
