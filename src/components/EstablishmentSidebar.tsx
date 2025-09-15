import { useState, useEffect } from "react";
import { Building2, Coffee, UtensilsCrossed, ShoppingBag, Car, Heart, Star, MapPin, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishmentStore } from "@/store/establishmentStore";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Icons disponibles pour les établissements
const ESTABLISHMENT_ICONS = [
  { name: "Restaurant", icon: UtensilsCrossed, color: "text-red-500" },
  { name: "Café", icon: Coffee, color: "text-amber-600" },
  { name: "Commerce", icon: ShoppingBag, color: "text-blue-500" },
  { name: "Service", icon: Car, color: "text-green-500" },
  { name: "Santé", icon: Heart, color: "text-pink-500" },
  { name: "Hôtel", icon: Building2, color: "text-gray-600" },
];

interface EstablishmentData {
  id: string;
  name: string;
  formatted_address: string;
  place_id: string;
  rating: number | null;
  icon_type: string;
  created_at: string;
}

export function EstablishmentSidebar() {
  const { user } = useAuth();
  const { collapsed } = useSidebar();
  const { selectedEstablishment, setSelectedEstablishment } = useEstablishmentStore();
  const [establishments, setEstablishments] = useState<EstablishmentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  // Sélectionner un établissement
  const selectEstablishment = (establishment: EstablishmentData) => {
    setSelectedEstablishment({
      id: establishment.id,
      place_id: establishment.place_id,
      name: establishment.name,
      formatted_address: establishment.formatted_address,
      rating: establishment.rating,
    });
  };

  // Obtenir l'icône et la couleur pour un type donné
  const getEstablishmentIcon = (iconType: string) => {
    const found = ESTABLISHMENT_ICONS.find(i => i.name === iconType);
    return found || ESTABLISHMENT_ICONS[0]; // Défaut: Restaurant
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-80"} collapsible>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            {!collapsed && "Mes Établissements"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                <SidebarMenuItem>
                  <div className="p-2 text-sm text-muted-foreground">
                    {collapsed ? "..." : "Chargement..."}
                  </div>
                </SidebarMenuItem>
              ) : establishments.length === 0 ? (
                <SidebarMenuItem>
                  <div className="p-2 text-sm text-muted-foreground">
                    {collapsed ? "0" : "Aucun établissement"}
                  </div>
                </SidebarMenuItem>
              ) : (
                establishments.map((establishment) => {
                  const iconData = getEstablishmentIcon(establishment.icon_type || "Restaurant");
                  const IconComponent = iconData.icon;
                  const isSelected = selectedEstablishment?.place_id === establishment.place_id;

                  return (
                    <SidebarMenuItem key={establishment.id}>
                      <SidebarMenuButton 
                        onClick={() => selectEstablishment(establishment)}
                        className={`w-full ${isSelected ? 'bg-primary/10 border-l-2 border-primary' : ''}`}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <IconComponent className={`w-5 h-5 ${iconData.color} flex-shrink-0`} />
                          {!collapsed && (
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {establishment.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {establishment.formatted_address}
                              </div>
                              {establishment.rating && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                  <span className="text-xs">{establishment.rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {isSelected && !collapsed && (
                            <Badge variant="secondary" className="text-xs">
                              Actuel
                            </Badge>
                          )}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="p-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => window.location.href = '/etablissement'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un établissement
            </Button>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}