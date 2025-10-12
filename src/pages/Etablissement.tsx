import { useEffect, useState } from "react";
import MonEtablissementCard from "@/components/MonEtablissementCard";
import SaveEstablishmentButton from "@/components/SaveEstablishmentButton";
import SavedEstablishmentsList from "@/components/SavedEstablishmentsList";
import { AnalyzeEstablishmentButton } from "@/components/AnalyzeEstablishmentButton";
import ImportAvisToolbar from "@/components/ImportAvisToolbar";
import { ReviewsVisualPanel } from "@/components/ReviewsVisualPanel";
import { Etab } from "@/types/etablissement";
import { Button } from "@/components/ui/button";
import { Building2, Home, LogOut, Loader2, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";
import { useEstablishmentSearch } from "@/hooks/useEstablishmentSearch";
import { fetchPlaceDetails } from "@/utils/placesClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  const currentEstablishment = useCurrentEstablishment();
  const { q, setQ, results, loading, error } = useEstablishmentSearch();

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

  const handleSelectSuggestion = async (prediction: any) => {
    setQ(prediction.structured_formatting.main_text);
    setShowSuggestions(false);
    setDetailsLoading(true);
    
    try {
      const details = await fetchPlaceDetails(prediction.place_id);
      const etab: Etab = {
        place_id: details.place_id,
        name: details.name,
        address: details.formatted_address,
        lat: details.geometry?.location?.lat ?? null,
        lng: details.geometry?.location?.lng ?? null,
        url: details.url ?? "",
        website: details.website ?? "",
        phone: details.international_phone_number ?? "",
        rating: details.rating ?? null,
      };
      setSelected(etab);
    } catch (err) {
      console.error("Erreur lors de la récupération des détails:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

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
          {/* Section de recherche d'établissement */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Rechercher un établissement</h2>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2 relative">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  {loading || detailsLoading ? (
                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                  ) : (
                    <Search className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full border border-border rounded-lg pl-11 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Rechercher un établissement…"
                  autoComplete="off"
                />
              </div>
              
              {showSuggestions && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-y-auto">
                  {results.map((prediction) => (
                    <button
                      key={prediction.place_id}
                      type="button"
                      onClick={() => handleSelectSuggestion(prediction)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-gray-900">
                        {prediction.structured_formatting.main_text}
                      </div>
                      <div className="text-sm text-gray-500">
                        {prediction.structured_formatting.secondary_text}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {showSuggestions && results.length === 0 && q.trim().length >= 2 && !loading && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl p-4 text-sm text-gray-500">
                  Aucun résultat trouvé
                </div>
              )}
              
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