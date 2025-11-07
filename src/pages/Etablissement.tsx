import { useEffect, useState } from "react";
import { loadGooglePlaces } from "@/lib/loadGooglePlaces";
import MonEtablissementCard from "@/components/MonEtablissementCard";
import SaveEstablishmentButton from "@/components/SaveEstablishmentButton";
import SavedEstablishmentsList from "@/components/SavedEstablishmentsList";
import { AnalyzeEstablishmentButton } from "@/components/AnalyzeEstablishmentButton";
import ImportAvisToolbar from "@/components/ImportAvisToolbar";
import { ReviewsVisualPanel } from "@/components/ReviewsVisualPanel";
import GoogleOAuthDebugPanel from "@/components/GoogleOAuthDebugPanel";
import { Etab } from "@/types/etablissement";
import { Button } from "@/components/ui/button";
import { Building2, Home, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";

export default function EtablissementPage() {
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

  // Fonction pour récupérer les détails d'un lieu
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
            'international_phone_number',
            'website',
            'rating',
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
      phone: place.international_phone_number || "",
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
        await loadGooglePlaces();
        const g = (window as any).google;
        
        const autocomplete = new g.maps.places.Autocomplete(input, {
          types: ['establishment'],
          componentRestrictions: { country: 'fr' },
          fields: [
            'place_id',
            'name',
            'formatted_address',
            'international_phone_number',
            'website',
            'rating',
            'geometry'
          ]
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place || !place.place_id) return;
          setSelected(serializePlace(place));
        });
      } catch (error: any) {
        console.error('Erreur de chargement Google Places:', error);
        setPlacesError(error?.message || 'Erreur Google Places');
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
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/lovable-uploads/62ee8352-36cc-4657-89b4-5c00321ab74c.png" alt="Analytics Logo" className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900">analytique</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6">
                <Link to="/tableau-de-bord" className="text-gray-600 hover:text-blue-600 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Accueil
                </Link>
                <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 flex items-center gap-2">
                  Dashboard
                </Link>
                <Button variant="ghost" className="text-blue-600 font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Établissement
                </Button>
              </div>
              
              <div className="flex items-center gap-4 ml-auto">
                <div className="text-gray-700 font-medium">
                  Bonjour, Yohan Lopes
                </div>
                <Button variant="ghost" className="text-gray-600 hover:text-red-600 flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Établissement</h1>
        
        <div className="space-y-6">
          {/* Google OAuth Debug Panel */}
          <GoogleOAuthDebugPanel />
          
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