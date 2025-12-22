import { useState, useEffect } from "react";
import { Building2, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { STORAGE_KEY, EVT_SAVED, EVT_ESTABLISHMENT_UPDATED } from "@/types/etablissement";
import { useNavigate } from "react-router-dom";

export interface EstablishmentOption {
  id: string;
  place_id: string;
  name: string;
  formatted_address: string | null;
}

interface EstablishmentSelectorProps {
  selectedEstablishment: EstablishmentOption | null;
  onSelect: (establishment: EstablishmentOption) => void;
}

export function EstablishmentSelector({ selectedEstablishment, onSelect }: EstablishmentSelectorProps) {
  const [establishments, setEstablishments] = useState<EstablishmentOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadEstablishments = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("establishments")
          .select("id, place_id, name, formatted_address")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (!error && data) {
          setEstablishments(data as EstablishmentOption[]);
        }
      } catch (err) {
        console.error("Erreur chargement établissements:", err);
      } finally {
        setLoading(false);
      }
    };

    loadEstablishments();

    // Reload when establishment is updated
    const onUpdated = () => loadEstablishments();
    window.addEventListener(EVT_ESTABLISHMENT_UPDATED, onUpdated);
    window.addEventListener(EVT_SAVED, onUpdated);

    return () => {
      window.removeEventListener(EVT_ESTABLISHMENT_UPDATED, onUpdated);
      window.removeEventListener(EVT_SAVED, onUpdated);
    };
  }, []);

  const handleSelect = (est: EstablishmentOption) => {
    // Update localStorage for other components
    const localData = {
      place_id: est.place_id,
      name: est.name,
      address: est.formatted_address || "",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));

    // Dispatch events
    window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: localData }));
    window.dispatchEvent(new CustomEvent(EVT_ESTABLISHMENT_UPDATED));

    onSelect(est);
    setOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Building2 className="w-5 h-5" />
        <span>Chargement...</span>
      </div>
    );
  }

  if (establishments.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate("/etablissement")}
        className="flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Créer un établissement
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-3 h-auto py-2 px-3 min-w-[200px] justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div className="text-left">
              <div className="font-medium text-foreground truncate max-w-[180px]">
                {selectedEstablishment?.name || "Sélectionner"}
              </div>
              {selectedEstablishment?.formatted_address && (
                <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {selectedEstablishment.formatted_address}
                </div>
              )}
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="end">
        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground px-3 py-2">
            Mes Établissements
          </div>
          {establishments.map((est) => (
            <Button
              key={est.id}
              variant="ghost"
              className={`w-full justify-start p-3 h-auto text-left hover:bg-muted ${
                selectedEstablishment?.id === est.id ? "bg-muted" : ""
              }`}
              onClick={() => handleSelect(est)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{est.name}</div>
                  {est.formatted_address && (
                    <div className="text-sm text-muted-foreground truncate">
                      {est.formatted_address}
                    </div>
                  )}
                </div>
              </div>
            </Button>
          ))}
          
          {/* Option pour ajouter un nouvel établissement */}
          <div className="border-t border-border mt-2 pt-2">
            <Button
              variant="ghost"
              className="w-full justify-start p-3 h-auto text-left hover:bg-muted"
              onClick={() => {
                setOpen(false);
                navigate("/etablissement");
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="font-medium text-muted-foreground">
                  Ajouter un établissement
                </div>
              </div>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
