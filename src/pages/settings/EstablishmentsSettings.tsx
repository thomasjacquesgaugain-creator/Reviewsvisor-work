import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { getUserEstablishments, EstablishmentData } from "@/services/establishments";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";
import { Button } from "@/components/ui/button";
import { Building2, Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function EstablishmentsSettings() {
  const { user } = useAuth();
  const currentEstablishment = useCurrentEstablishment();
  const navigate = useNavigate();
  const [establishments, setEstablishments] = useState<EstablishmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadEstablishments();
    }
  }, [user]);

  const loadEstablishments = async () => {
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
  };

  const handleSetActive = async (establishment: EstablishmentData) => {
    // TODO: Implémenter la mise à jour de l'établissement actif
    toast.success(`${establishment.name} est maintenant l'établissement actif`);
    // Recharger pour mettre à jour l'affichage
    await loadEstablishments();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
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
            const isActive = currentEstablishment?.id === est.id || currentEstablishment?.place_id === est.place_id;
            return (
              <div
                key={est.id || est.place_id}
                className={cn(
                  "border rounded-lg p-4 transition-colors",
                  isActive ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-gray-400")} />
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
                      <p className="text-sm text-gray-500">{est.formatted_address}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(est)}
                        className="gap-2"
                      >
                        <Check className="h-4 w-4" />
                        <span>Définir comme actif</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/etablissement?id=${est.id || est.place_id}`)}
                      className="gap-2"
                    >
                      <span>Gérer</span>
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
