import { useState, useEffect } from "react";
import { Building2, Coffee, UtensilsCrossed, ShoppingBag, Car, Heart, Star, BarChart3, Trash2, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishmentStore } from "@/store/establishmentStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { runAnalyze } from "@/lib/runAnalyze";
import { STORAGE_KEY, EVT_SAVED, Etab } from "@/types/etablissement";

// Icons disponibles pour les établissements
const ESTABLISHMENT_ICONS = [
  { name: "Restaurant", icon: UtensilsCrossed, color: "text-red-500" },
  { name: "Café", icon: Coffee, color: "text-amber-600" },
  { name: "Commerce", icon: ShoppingBag, color: "text-blue-500" },
  { name: "Service", icon: Car, color: "text-green-500" },
  { name: "Santé", icon: Heart, color: "text-pink-500" },
  { name: "Hôtel", icon: Building2, color: "text-gray-600" },
];

interface SavedEstablishment {
  id: string;
  name: string;
  formatted_address: string;
  place_id: string;
  rating: number | null;
  icon_type: string;
  created_at: string;
}

export function SavedEstablishmentsList() {
  const { user } = useAuth();
  const { setSelectedEstablishment } = useEstablishmentStore();
  const [establishments, setEstablishments] = useState<SavedEstablishment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string | null>(null);
  const { toast } = useToast();

  // Charger tous les établissements de l'utilisateur
  useEffect(() => {
    const fetchEstablishments = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('establishments')
          .select('id, name, formatted_address, place_id, rating, icon_type, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching establishments:', error);
        } else {
          setEstablishments(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstablishments();

    // Écouter les nouveaux établissements ajoutés
    const handleEstablishmentSaved = () => {
      fetchEstablishments();
    };

    window.addEventListener('establishment-saved', handleEstablishmentSaved);
    return () => window.removeEventListener('establishment-saved', handleEstablishmentSaved);
  }, [user?.id]);

  // Analyser un établissement
  const handleAnalyze = async (establishment: SavedEstablishment) => {
    setAnalyzingId(establishment.id);
    
    try {
      const result = await runAnalyze({
        place_id: establishment.place_id,
        name: establishment.name,
        address: establishment.formatted_address
      });

      if (result.ok) {
        toast({
          title: "Analyse terminée",
          description: `${result.counts?.collected || 0} avis analysés pour ${establishment.name}`,
        });
      } else {
        toast({
          title: "Erreur d'analyse",
          description: `Impossible d'analyser ${establishment.name}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setAnalyzingId(null);
    }
  };

  // Sélectionner un établissement (l'afficher dans "Mon Établissement")
  const handleSelect = (establishment: SavedEstablishment) => {
    const etabData: Etab = {
      place_id: establishment.place_id,
      name: establishment.name,
      address: establishment.formatted_address,
      lat: null, // Ces données ne sont pas stockées dans establishments
      lng: null,
      phone: null,
      website: null,
      rating: establishment.rating
    };

    // Marquer cet établissement comme sélectionné
    setSelectedEstablishmentId(establishment.id);

    // Sauvegarder dans localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(etabData));
    
    // Déclencher l'événement pour mettre à jour MonEtablissementCard
    window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: etabData }));
  };

  // Supprimer un établissement
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) return;

    try {
      const { error } = await supabase
        .from('establishments')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer l'établissement",
          variant: "destructive",
        });
      } else {
        setEstablishments(prev => prev.filter(e => e.id !== id));
        toast({
          title: "Supprimé",
          description: `${name} a été supprimé`,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    }
  };

  // Obtenir l'icône et la couleur pour un type donné
  const getEstablishmentIcon = (iconType: string) => {
    const found = ESTABLISHMENT_ICONS.find(i => i.name === iconType);
    return found || ESTABLISHMENT_ICONS[0]; // Défaut: Restaurant
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Chargement de vos établissements...</p>
        </CardContent>
      </Card>
    );
  }

  if (establishments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Aucun établissement enregistré</p>
          <p className="text-sm text-gray-400">Utilisez la recherche ci-dessus pour ajouter votre premier établissement</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Mes Établissements ({establishments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {establishments.map((establishment) => {
            const iconData = getEstablishmentIcon(establishment.icon_type || "Restaurant");
            const IconComponent = iconData.icon;
            const isAnalyzing = analyzingId === establishment.id;

            return (
              <div
                key={establishment.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative"
              >
                {/* Icône de validation si cet établissement est sélectionné */}
                {selectedEstablishmentId === establishment.id && (
                  <div className="absolute -top-2 -right-2 bg-green-500 rounded p-1">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <IconComponent className={`w-8 h-8 ${iconData.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {establishment.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate mb-2">
                      {establishment.formatted_address}
                    </p>
                    
                    {establishment.rating && (
                      <div className="flex items-center gap-1 mb-3">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{establishment.rating.toFixed(1)}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {iconData.name}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {new Date(establishment.created_at).toLocaleDateString('fr-FR')}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSelect(establishment)}
                    className="flex-1"
                  >
                    Sélectionner
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handleAnalyze(establishment)}
                    disabled={isAnalyzing}
                    className="flex-1"
                  >
                    {isAnalyzing ? (
                      <>
                        <BarChart3 className="w-4 h-4 mr-2 animate-spin" />
                        Analyse...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analyser
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(establishment.id, establishment.name)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}