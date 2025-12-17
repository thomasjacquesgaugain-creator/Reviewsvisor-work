import { useEffect, useState } from "react";
import { loadGooglePlaces } from "@/lib/loadGooglePlaces";
import MonEtablissementCard from "@/components/MonEtablissementCard";
import SaveEstablishmentButton from "@/components/SaveEstablishmentButton";
import SavedEstablishmentsList from "@/components/SavedEstablishmentsList";
import { AnalyzeEstablishmentButton } from "@/components/AnalyzeEstablishmentButton";
import ImportAvisToolbar from "@/components/ImportAvisToolbar";
import { ReviewsVisualPanel } from "@/components/ReviewsVisualPanel";

import { Etab, STORAGE_KEY, EVT_SAVED } from "@/types/etablissement";
import { Button } from "@/components/ui/button";
import { Building2, Home, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";
import { useAuth } from "@/contexts/AuthProvider";
import { toast } from "sonner";


export default function EtablissementPage() {
  const { displayName, loading, signOut } = useAuth();
  const [selected, setSelected] = useState<Etab | null>(null);
  const [showImportBar, setShowImportBar] = useState(false);
  const [showReviewsVisual, setShowReviewsVisual] = useState(false);
  const [visualEstablishment, setVisualEstablishment] = useState<{
    id: string;
    name: string;
    placeId: string;
  } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [placesError, setPlacesError] = useState<string | null>(null);
  
  const currentEstablishment = useCurrentEstablishment();

  // Callback to refresh reviews data after import
  const handleImportSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Callback to open visual panel after import
  const handleOpenVisualPanel = () => {
    if (currentEstablishment) {
      setVisualEstablishment({
        id: currentEstablishment.id || currentEstablishment.place_id,
        name: currentEstablishment.name,
        placeId: currentEstablishment.place_id
      });
      setShowReviewsVisual(true);
    }
  };

  // Mapping des erreurs Google Places
  function mapPlacesStatus(status: string, errorMessage?: string): string | null {
    const g = (window as any).google;
    if (!g?.maps?.places) return 'Google Places non chargé';
    
    switch (status) {
      case g.maps.places.PlacesServiceStatus.OK:
      case g.maps.places.PlacesServiceStatus.ZERO_RESULTS:
        return null;
      case g.maps.places.PlacesServiceStatus.REQUEST_DENIED:
        return 'Clé Google invalide ou non autorisée (référents/API).';
      case g.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
        return 'Quota dépassé. Réessayez plus tard.';
      case g.maps.places.PlacesServiceStatus.INVALID_REQUEST:
        return 'Requête invalide (paramètre manquant).';
      default:
        return errorMessage || status || 'Erreur inconnue Google Places';
    }
  }

  // Fonction pour récupérer les détails d'un lieu via Places Details (New)
  async function fetchPlaceDetails(placeId: string): Promise<any> {
    await loadGooglePlaces();
    const g = (window as any).google;
    const service = new g.maps.places.PlacesService(document.createElement('div'));
    
    return new Promise((resolve, reject) => {
      service.getDetails(
        {
          placeId,
          fields: [
            'place_id',
            'name',
            'formatted_address',
            'formatted_phone_number',
            'website',
            'rating',
            'url',
            'geometry'
          ]
        },
        (result: any, status: string) => {
          const err = mapPlacesStatus(status);
          if (err) {
            reject(new Error(err));
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error('Aucun résultat'));
          }
        }
      );
    });
  }

  // Fonction pour sérialiser un lieu Google Places
  function serializePlace(place: any): Etab {
    return {
      place_id: place.place_id || "",
      name: place.name || "",
      address: place.formatted_address || "",
      lat: place.geometry?.location?.lat() ?? null,
      lng: place.geometry?.location?.lng() ?? null,
      website: place.website || "",
      phone: place.formatted_phone_number || "",
      url: place.url || "",
      rating: place.rating ?? null,
    };
  }

  // Initialize Google Places autocomplete
  useEffect(() => {
    const initPlaces = async () => {
      const input = document.getElementById('places-input') as HTMLInputElement;
      if (!input) return;

      try {
        setPlacesError(null);
        console.log('🔍 Initialisation de l\'autocomplete Google Places...');
        await loadGooglePlaces();
        const g = (window as any).google;
        
        if (!g?.maps?.places) {
          throw new Error('Google Maps Places API non disponible');
        }
        
        const autocomplete = new g.maps.places.Autocomplete(input, {
          types: ['establishment'],
          componentRestrictions: { country: 'fr' },
          fields: ['place_id'] // Only get place_id from autocomplete
        });

        autocomplete.addListener('place_changed', async () => {
          const autocompletePlace = autocomplete.getPlace();
          if (!autocompletePlace || !autocompletePlace.place_id) return;
          
          console.log('🔍 Place sélectionnée, récupération des détails via Places Details API...');
          
          try {
            // Appel explicite à Places Details (New) avec tous les champs
            const placeDetails = await fetchPlaceDetails(autocompletePlace.place_id);
            
            console.log('✅ Détails récupérés:', {
              name: placeDetails.name,
              formatted_address: placeDetails.formatted_address,
              formatted_phone_number: placeDetails.formatted_phone_number,
              website: placeDetails.website,
              rating: placeDetails.rating,
              url: placeDetails.url
            });
            
            // Sérialiser les détails complets
            const etab = serializePlace(placeDetails);
            
            // Mettre à jour l'état local
            setSelected(etab);
            
            // Sauvegarder dans localStorage et déclencher le rafraîchissement de la carte
            localStorage.setItem(STORAGE_KEY, JSON.stringify(etab));
            window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: etab }));
            
            toast.success(`${etab.name} sélectionné`);
            
          } catch (error: any) {
            console.error('❌ Erreur lors de la récupération des détails:', error);
            toast.error(error?.message || 'Impossible de récupérer les détails de l\'établissement');
          }
        });
        
        console.log('✅ Autocomplete initialisé avec succès');
      } catch (error: any) {
        console.error('❌ Erreur de chargement Google Places:', error);
        let errorMsg = 'Erreur Google Maps. ';
        
        if (error?.message?.includes('manquante')) {
          errorMsg += 'Clé API manquante dans la configuration.';
        } else if (error?.message?.includes('Échec')) {
          errorMsg += 'Vérifiez que votre domaine est autorisé dans Google Cloud Console (https://reviewsvisor.fr/*)';
        } else {
          errorMsg += error?.message || 'Erreur inconnue';
        }
        
        setPlacesError(errorMsg);
      }
    };

    initPlaces();
  }, []);

  // Handle import button click and analysis button click and ESC key
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target && (target.closest('[data-testid="btn-import-avis"]'))) {
        setShowImportBar(true);
        setTimeout(() => {
          document.getElementById('import-avis-toolbar-anchor')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 50);
      }
      if (target && (target.closest('[data-testid="btn-analyser-etablissement"]'))) {
        if (currentEstablishment) {
          setVisualEstablishment({
            id: currentEstablishment.id || currentEstablishment.place_id,
            name: currentEstablishment.name,
            placeId: currentEstablishment.place_id
          });
        }
        setShowReviewsVisual(!showReviewsVisual);
        setTimeout(() => {
          document.getElementById('reviews-visual-anchor')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 50);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showImportBar) {
          setShowImportBar(false);
        }
        if (showReviewsVisual) {
          setShowReviewsVisual(false);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showImportBar, showReviewsVisual]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Établissement</h1>
        
        <div className="space-y-6">
          {/* Section de recherche d'établissement */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Rechercher un établissement</h2>
            
            <div className="space-y-2">
              <input
                id="places-input"
                className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Rechercher un établissement…"
              />
              
              {placesError && (
                <div className="text-sm text-destructive">
                  {placesError}
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Powered by Google
              </div>
              
              {selected && (
                <div className="inline-flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
                  <span>✅ Sélectionné :</span>
                  <strong>{selected.name}</strong>
                </div>
              )}
            </div>
            
            <SaveEstablishmentButton selected={selected} />
            
            {selected && (
              <div className="mt-4">
                <AnalyzeEstablishmentButton
                  place_id={selected.place_id}
                  name={selected.name}
                  address={selected.address}
                />
              </div>
            )}
          </div>

          {/* Section Mon Établissement */}
          <section 
            className="border border-border rounded-lg p-4"
            data-testid="card-mon-etablissement"
          >
            <h2 className="text-xl font-semibold mb-3">🏢 Mon Établissement</h2>
            <MonEtablissementCard />
          </section>

          {/* Anchor for reviews visual panel */}
          <div id="reviews-visual-anchor" />

          {/* Reviews Visual Panel */}
          {showReviewsVisual && (
            <ReviewsVisualPanel 
              establishmentId={visualEstablishment?.id}
              establishmentName={visualEstablishment?.name}
              onClose={() => setShowReviewsVisual(false)}
              key={refreshTrigger} // Force re-render on import success
            />
          )}

          {/* Anchor pour le scroll vers la barre d'import */}
          <div id="import-avis-toolbar-anchor" />

          {/* Barre d'outils d'import (affichée conditionnellement) */}
          {showImportBar && (
            <ImportAvisToolbar 
              onClose={() => setShowImportBar(false)}
              onFileAnalyzed={() => {
                // TODO: Rafraîchir les données du dashboard
                console.log("Fichier analysé, rafraîchissement des données...");
              }}
              onImportSuccess={handleImportSuccess}
              onOpenVisualPanel={handleOpenVisualPanel}
              placeId={currentEstablishment?.place_id || selected?.place_id}
              establishmentName={currentEstablishment?.name || selected?.name}
            />
          )}

          {/* Liste des établissements enregistrés */}
          <div data-testid="section-etablissements-enregistres">
            <SavedEstablishmentsList />
          </div>
        </div>
      </div>
    </div>
  );
}