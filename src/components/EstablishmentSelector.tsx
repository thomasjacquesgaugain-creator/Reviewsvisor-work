import { useState, useEffect } from "react";
import { Building2, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { EVT_SAVED, EVT_ESTABLISHMENT_UPDATED } from "@/types/etablissement";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
export interface EstablishmentOption {
  id: string;
  place_id: string;
  name: string;
  formatted_address: string | null;
  is_active?: boolean | null;
}
interface EstablishmentSelectorProps {
  selectedEstablishment: EstablishmentOption | null;
  onSelect: (establishment: EstablishmentOption) => void;
}
export function EstablishmentSelector({
  selectedEstablishment,
  onSelect
}: EstablishmentSelectorProps) {
  const { t } = useTranslation();
  const [establishments, setEstablishments] = useState<EstablishmentOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const loadEstablishments = async () => {
    setLoading(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        setEstablishments([]);
        return;
      }
      const {
        data,
        error
      } = await supabase.from("établissements").select("id, place_id, nom, adresse, is_active, updated_at").eq("user_id", user.id).order("updated_at", {
        ascending: false
      });
      if (error) throw error;
      const mapped: EstablishmentOption[] = (data ?? []).map(row => ({
        id: row.id,
        place_id: row.place_id,
        name: row.nom,
        formatted_address: row.adresse ?? null,
        is_active: row.is_active ?? null
      }));
      setEstablishments(mapped);

      // Détermine l'établissement affiché: actif si défini, sinon plus récent
      const selectedId = selectedEstablishment?.id;
      const selectedStillExists = selectedId ? mapped.some(e => e.id === selectedId) : false;
      if ((!selectedEstablishment || !selectedStillExists) && mapped.length > 0) {
        const active = mapped.find(e => e.is_active) ?? mapped[0];
        onSelect(active);
      }
    } catch (err) {
      console.error("Erreur chargement établissements:", err);
      setEstablishments([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadEstablishments();
    const onUpdated = () => loadEstablishments();
    window.addEventListener(EVT_ESTABLISHMENT_UPDATED, onUpdated);
    window.addEventListener(EVT_SAVED, onUpdated);
    return () => {
      window.removeEventListener(EVT_ESTABLISHMENT_UPDATED, onUpdated);
      window.removeEventListener(EVT_SAVED, onUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEstablishment?.id]);
  const handleSelect = async (est: EstablishmentOption) => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();

      // Persist: définir comme "actif" en DB (source de vérité)
      if (user) {
        const {
          error
        } = await supabase.from("établissements").update({
          is_active: true
        }).eq("user_id", user.id).eq("id", est.id);
        if (error) throw error;
      }
      const detail = {
        place_id: est.place_id,
        name: est.name,
        address: est.formatted_address || ""
      };
      window.dispatchEvent(new CustomEvent(EVT_SAVED, {
        detail
      }));
      window.dispatchEvent(new CustomEvent(EVT_ESTABLISHMENT_UPDATED));
      onSelect(est);
    } catch (err) {
      console.error("Erreur sélection établissement:", err);
      // UI réactive même si la mise à jour DB échoue
      onSelect(est);
    } finally {
      setOpen(false);
    }
  };
  if (loading) {
    return <div className="flex items-center gap-2 text-muted-foreground">
        <Building2 className="w-5 h-5" />
        <span>{t("common.loading")}</span>
      </div>;
  }
  if (establishments.length === 0) {
    return <Button variant="outline" size="sm" onClick={() => navigate("/etablissement")} className="flex items-center gap-2">
        <Plus className="w-4 h-4" />
        {t("establishment.createEstablishment")}
      </Button>;
  }
  return <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-3 h-auto py-3 px-4 min-w-[320px] max-w-[420px] justify-between bg-primary-foreground hover:bg-primary-foreground hover:text-foreground hover:border-border">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left min-w-0">
                <div className="font-medium text-base text-foreground truncate max-w-[320px]">
                  {selectedEstablishment?.name || t("establishment.select")}
                </div>
                {selectedEstablishment?.formatted_address && <div className="text-sm text-muted-foreground truncate max-w-[320px]">
                    {selectedEstablishment.formatted_address}
                  </div>}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] max-w-[420px] p-2 overflow-hidden" align="end" sideOffset={4} avoidCollisions={true} collisionPadding={8}>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground px-3 py-2">
              {t("establishment.myEstablishments")}
            </div>
            {establishments.map(est => (
              <button
                key={est.id}
                type="button"
                className={`w-full flex items-center gap-3 p-3 text-left rounded-lg cursor-pointer transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  selectedEstablishment?.id === est.id ? 'bg-blue-50 border-2 border-blue-600' : ''
                }`}
                onClick={() => handleSelect(est)}
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-base text-gray-900 truncate">{est.name}</span>
                    {est.is_active && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded flex-shrink-0">{t("establishment.active")}</span>
                    )}
                  </div>
                  {est.formatted_address && (
                    <div className="text-sm text-gray-500 truncate">{est.formatted_address}</div>
                  )}
                </div>
              </button>
            ))}
            
            {/* Option pour ajouter un nouvel établissement */}
            <div className="border-t border-border mt-2 pt-2">
              <Button variant="ghost" className="w-full justify-start p-3 h-auto text-left hover:bg-muted" onClick={() => {
              setOpen(false);
              navigate("/etablissement");
            }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="font-medium text-muted-foreground truncate">
                    {t("establishment.addEstablishment")}
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>;
}