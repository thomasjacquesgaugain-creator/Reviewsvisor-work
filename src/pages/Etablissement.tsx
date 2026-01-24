import { useEffect, useState, useRef } from "react";
import { loadGooglePlaces } from "@/lib/loadGooglePlaces";
import MonEtablissementCard from "@/components/MonEtablissementCard";
import SaveEstablishmentButton from "@/components/SaveEstablishmentButton";
import SavedEstablishmentsList from "@/components/SavedEstablishmentsList";
import ImportAvisToolbar from "@/components/ImportAvisToolbar";
import { ReviewsVisualPanel } from "@/components/ReviewsVisualPanel";
import { Etab, STORAGE_KEY, EVT_SAVED, EVT_ESTABLISHMENT_UPDATED, EVT_LIST_UPDATED } from "@/types/etablissement";
import { Button } from "@/components/ui/button";
import { Building2, Home, LogOut, X, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";
import { useAuth } from "@/contexts/AuthProvider";
import { toast } from "sonner";
import { getCurrentEstablishment } from "@/services/establishments";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
export default function EtablissementPage() {
  const {
    displayName,
    loading,
    signOut
  } = useAuth();
  const [selected, setSelected] = useState<Etab | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showImportBar, setShowImportBar] = useState(false);
  const [showReviewsVisual, setShowReviewsVisual] = useState(false);
  const [isEstablishmentBeingAdded, setIsEstablishmentBeingAdded] = useState(false);
  const isEstablishmentBeingAddedRef = useRef(false);
  const [hasRegisteredEstablishments, setHasRegisteredEstablishments] = useState(false);
  const [visualEstablishment, setVisualEstablishment] = useState<{
    id: string;
    name: string;
    placeId: string;
  } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const { establishment: currentEstablishment } = useCurrentEstablishment();
  const { t } = useTranslation();

  // Synchroniser visualEstablishment avec currentEstablishment quand il change
  // MAIS seulement si le panel n'est pas déjà ouvert (pour éviter d'écraser l'établissement choisi manuellement)
  useEffect(() => {
    // Ne pas écraser visualEstablishment si le panel est ouvert
    // Cela permet au clic sur le bouton d'utiliser l'établissement affiché dans "Mon Établissement"
    if (showReviewsVisual) {
      return; // Garder l'établissement actuellement affiché dans le panel
    }
    
    if (currentEstablishment) {
      setVisualEstablishment({
        id: currentEstablishment.place_id, // Utiliser place_id comme id car les services utilisent place_id
        name: currentEstablishment.name,
        placeId: currentEstablishment.place_id
      });
    } else {
      // Si aucun établissement n'est sélectionné, réinitialiser visualEstablishment
      setVisualEstablishment(null);
    }
  }, [currentEstablishment?.place_id, currentEstablishment?.name, showReviewsVisual]);

  // Sync the local establishment card from the DB (source of truth)
  // IMPORTANT: préserver le rating local si la DB n'en a pas
  useEffect(() => {
    const syncFromDb = async () => {
      try {
        const est = await getCurrentEstablishment();
        if (!est) return;
        let prev: any = {};
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          prev = raw ? JSON.parse(raw) : {};
        } catch {
          prev = {};
        }

        // Si l'établissement dans la DB est le même que celui en local, on merge
        // Sinon on remplace entièrement
        const isSamePlace = prev.place_id === est.place_id;
        const etab: Etab = {
          ...prev,
          place_id: est.place_id,
          name: est.name,
          address: est.formatted_address || prev.address || "",
          phone: est.phone ?? prev.phone,
          website: est.website ?? prev.website,
          // CRUCIAL: préserver le rating local si la DB n'en a pas (null/undefined)
          rating: est.rating != null ? est.rating : isSamePlace ? prev.rating : null
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(etab));
        window.dispatchEvent(new CustomEvent(EVT_SAVED, {
          detail: etab
        }));
      } catch (err) {
        console.warn("Impossible de synchroniser l'établissement depuis la base", err);
      }
    };
    syncFromDb();
    const onUpdated = () => {
      syncFromDb();
    };
    window.addEventListener(EVT_ESTABLISHMENT_UPDATED, onUpdated as EventListener);
    return () => {
      window.removeEventListener(EVT_ESTABLISHMENT_UPDATED, onUpdated as EventListener);
    };
  }, []);

  // Callback to refresh reviews data after import
  const handleImportSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Callback to open visual panel after import
  const handleOpenVisualPanel = () => {
    if (currentEstablishment) {
      setVisualEstablishment({
        id: currentEstablishment.place_id, // Utiliser place_id comme id car les services utilisent place_id
        name: currentEstablishment.name,
        placeId: currentEstablishment.place_id
      });
      setShowReviewsVisual(true);
    }
  };

  // Mapping des erreurs Google Places
  function mapPlacesStatus(status: string, errorMessage?: string): string | null {
    const g = (window as any).google;
    if (!g?.maps?.places) return t("googlePlaces.notLoaded");
    switch (status) {
      case g.maps.places.PlacesServiceStatus.OK:
      case g.maps.places.PlacesServiceStatus.ZERO_RESULTS:
        return null;
      case g.maps.places.PlacesServiceStatus.REQUEST_DENIED:
        return t("googlePlaces.invalidKey");
      case g.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
        return t("googlePlaces.quotaExceeded");
      case g.maps.places.PlacesServiceStatus.INVALID_REQUEST:
        return t("googlePlaces.invalidRequest");
      default:
        return errorMessage || status || t("googlePlaces.unknownError");
    }
  }

  // Fonction pour récupérer les détails d'un lieu via Places Details (New)
  async function fetchPlaceDetails(placeId: string): Promise<any> {
    await loadGooglePlaces();
    const g = (window as any).google;
    const service = new g.maps.places.PlacesService(document.createElement('div'));
    return new Promise((resolve, reject) => {
      service.getDetails({
        placeId,
        fields: ['place_id', 'name', 'formatted_address', 'formatted_phone_number', 'website', 'rating', 'url', 'geometry']
      }, (result: any, status: string) => {
        const err = mapPlacesStatus(status);
        if (err) {
          reject(new Error(err));
        } else if (result) {
          resolve(result);
        } else {
          reject(new Error(t("googlePlaces.noResults")));
        }
      });
    });
  }

  // Reset complet de la barre de recherche et fermer
  const resetSearchAndClose = () => {
    setSelected(null);
    setShowSearch(false);
    const input = document.getElementById('places-input') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  };

  // Ouvrir la barre de recherche
  const openSearch = () => {
    setShowSearch(true);
    setTimeout(() => {
      const input = document.getElementById('places-input');
      if (input) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => input.focus(), 300);
      }
    }, 100);
  };

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
      rating: place.rating ?? null
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
          throw new Error(t("googlePlaces.apiNotAvailable"));
        }
        const autocomplete = new g.maps.places.Autocomplete(input, {
          types: ['establishment'],
          fields: ['place_id'] // Only get place_id from autocomplete
        });
        autocomplete.addListener('place_changed', async () => {
          const autocompletePlace = autocomplete.getPlace();
          if (!autocompletePlace || !autocompletePlace.place_id) return;
          try {
            // Récupérer les détails complets via Places Details API
            const placeDetails = await fetchPlaceDetails(autocompletePlace.place_id);

            // Sérialiser les détails
            const etab = serializePlace(placeDetails);

            // UNIQUEMENT mettre à jour l'état local (pas de sauvegarde DB)
            setSelected(etab);
            toast.success(t("establishment.selected", { name: etab.name }), {
              description: t("establishment.clickSaveToAddToList")
            });
          } catch (error: any) {
            console.error('Erreur lors de la récupération des détails:', error);
            toast.error(error?.message || t("establishment.cannotRetrieveDetails"));
          }
        });
        console.log('✅ Autocomplete initialisé avec succès');
      } catch (error: any) {
        console.error('❌ Erreur de chargement Google Places:', error);
        let errorMsg = t("googlePlaces.error");
        if (error?.message?.includes('manquante')) {
          errorMsg += t("googlePlaces.missingApiKey");
        } else if (error?.message?.includes('Échec')) {
          errorMsg += t("googlePlaces.domainNotAuthorized");
        } else {
          errorMsg += error?.message || t("googlePlaces.unknownError");
        }
        setPlacesError(errorMsg);
      }
    };
    initPlaces();
  }, []);

  // Vérifier s'il y a des établissements enregistrés dans la DB
  useEffect(() => {
    const checkRegisteredEstablishments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setHasRegisteredEstablishments(false);
          return;
        }
        
        const { data, error } = await supabase
          .from("établissements")
          .select("place_id")
          .eq("user_id", user.id)
          .limit(1);
        
        if (error) {
          console.error("Erreur lors de la vérification des établissements:", error);
          setHasRegisteredEstablishments(false);
          return;
        }
        
        setHasRegisteredEstablishments((data?.length || 0) > 0);
      } catch (error) {
        console.error("Erreur lors de la vérification des établissements:", error);
        setHasRegisteredEstablishments(false);
      }
    };
    
    checkRegisteredEstablishments();
    
    // Écouter les mises à jour de la liste
    const handleListUpdated = () => {
      checkRegisteredEstablishments();
    };
    
    window.addEventListener(EVT_LIST_UPDATED, handleListUpdated);
    window.addEventListener(EVT_SAVED, handleListUpdated);
    
    return () => {
      window.removeEventListener(EVT_LIST_UPDATED, handleListUpdated);
      window.removeEventListener(EVT_SAVED, handleListUpdated);
    };
  }, []);

  // Handle import button click and analysis button click and ESC key
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target && target.closest('[data-testid="btn-import-avis"]')) {
        // Vérifier qu'un établissement existe (sélectionné OU enregistré)
        const hasEstablishment = currentEstablishment?.place_id || selected?.place_id;
        if (!hasEstablishment && !hasRegisteredEstablishments) {
          // Ne pas afficher d'erreur si un établissement est en train d'être ajouté
          if (!isEstablishmentBeingAddedRef.current) {
            toast.error(t("establishment.noEstablishmentSelected"), {
              description: t("establishment.pleaseAddEstablishmentFirst")
            });
          }
          return;
        }
        setShowImportBar(true);
        setTimeout(() => {
          document.getElementById('import-avis-toolbar-anchor')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 50);
      }
      if (target && target.closest('[data-testid="btn-analyser-etablissement"]')) {
        // Récupérer l'établissement depuis le bouton (source de vérité : Mon Établissement)
        const button = target.closest('[data-testid="btn-analyser-etablissement"]') as HTMLElement;
        const placeId = button?.dataset?.placeId;
        const name = button?.dataset?.name;
        
        if (placeId && name) {
          // Utiliser l'établissement affiché dans "Mon Établissement" (pas currentEstablishment)
          setVisualEstablishment({
            id: placeId,
            name: name,
            placeId: placeId
          });
          setShowReviewsVisual(!showReviewsVisual);
          setTimeout(() => {
            document.getElementById('reviews-visual-anchor')?.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }, 50);
        } else if (currentEstablishment) {
          // Fallback vers currentEstablishment si les data attributes ne sont pas disponibles
          setVisualEstablishment({
            id: currentEstablishment.place_id,
            name: currentEstablishment.name,
            placeId: currentEstablishment.place_id
          });
          setShowReviewsVisual(!showReviewsVisual);
          setTimeout(() => {
            document.getElementById('reviews-visual-anchor')?.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }, 50);
        }
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
  }, [showImportBar, showReviewsVisual, currentEstablishment, selected, hasRegisteredEstablishments, t]);

  // Écouter les événements d'ajout d'établissement pour éviter l'erreur
  useEffect(() => {
    const handleEstablishmentSaved = (event: any) => {
      // Si un établissement vient d'être sauvegardé, marquer qu'on est en train d'ajouter
      if (event.detail && event.detail.place_id) {
        setIsEstablishmentBeingAdded(true);
        isEstablishmentBeingAddedRef.current = true;
        // Réinitialiser le flag après un court délai pour laisser le temps à currentEstablishment de se mettre à jour
        setTimeout(() => {
          setIsEstablishmentBeingAdded(false);
          isEstablishmentBeingAddedRef.current = false;
        }, 1000);
      } else if (event.detail === null) {
        // Si detail est null, c'est une suppression
        setIsEstablishmentBeingAdded(false);
        isEstablishmentBeingAddedRef.current = false;
      }
    };
    
    window.addEventListener(EVT_SAVED, handleEstablishmentSaved as EventListener);
    
    return () => {
      window.removeEventListener(EVT_SAVED, handleEstablishmentSaved as EventListener);
    };
  }, []);

  // Fermer automatiquement la modal d'import si l'établissement est supprimé (instantanément)
  // MAIS ne pas afficher d'erreur si un établissement vient d'être ajouté
  useEffect(() => {
    // Ne rien faire si un établissement est en train d'être ajouté
    if (isEstablishmentBeingAdded) {
      return;
    }
    
    const hasEstablishment = currentEstablishment?.place_id || selected?.place_id;
    if (showImportBar && !hasEstablishment && !hasRegisteredEstablishments) {
      // Fermer immédiatement sans délai seulement si ce n'est pas un ajout en cours
      setShowImportBar(false);
      // Ne pas afficher d'erreur ici car elle sera affichée dans handleDocumentClick
    }
  }, [currentEstablishment, selected, showImportBar, isEstablishmentBeingAdded, hasRegisteredEstablishments, t]);

  // Écouter les événements de suppression pour fermer la modal instantanément
  useEffect(() => {
    const handleEstablishmentDeleted = () => {
      // Attendre un peu pour laisser le temps à currentEstablishment de se mettre à jour
      setTimeout(() => {
        // Vérifier le flag via la ref pour avoir la valeur actuelle (pas celle capturée par la closure)
        if (isEstablishmentBeingAddedRef.current) {
          return; // Ne rien faire si un établissement est en train d'être ajouté
        }
        
        // Vérifier si l'établissement existe (sélectionné OU enregistré)
        const hasEstablishment = currentEstablishment?.place_id || selected?.place_id;
        if (showImportBar && !hasEstablishment && !hasRegisteredEstablishments) {
          setShowImportBar(false);
          // Ne pas afficher d'erreur ici car elle sera affichée dans handleDocumentClick si nécessaire
        }
      }, 200);
    };
    
    // Écouter les événements de mise à jour d'établissement pour réagir instantanément
    window.addEventListener(EVT_LIST_UPDATED, handleEstablishmentDeleted);
    window.addEventListener(EVT_ESTABLISHMENT_UPDATED, handleEstablishmentDeleted);
    
    return () => {
      window.removeEventListener(EVT_LIST_UPDATED, handleEstablishmentDeleted);
      window.removeEventListener(EVT_ESTABLISHMENT_UPDATED, handleEstablishmentDeleted);
    };
  }, [currentEstablishment, selected, showImportBar, hasRegisteredEstablishments, t]);

  return <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-slate-100 via-blue-50 to-violet-100">
      {/* Background with organic shapes */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-violet-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-200 to-yellow-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-30"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
      <div className="container mx-auto px-4 py-8 pb-16">
        <h1 className="text-3xl font-bold mb-8">{t("establishment.title")}</h1>
        
        <div className="space-y-6">
          {/* Section de recherche d'établissement - toujours montée, masquée via CSS */}
          <div className={showSearch ? "space-y-4" : "hidden"}>
            <h2 className="text-xl font-semibold">{t("establishment.search")}</h2>
            
            <div className="space-y-2">
              <div className="relative">
                <input id="places-input" className="w-full bg-white border border-border rounded-lg px-3 py-2 pr-24 focus:outline-none focus:ring-2 focus:ring-primary" placeholder={t("establishment.searchPlaceholder")} />
                <button
                  type="button"
                  onClick={resetSearchAndClose}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1.5 rounded-md cursor-pointer transition-colors"
                >
                  {t("common.cancel")}
                </button>
              </div>
              
              {placesError && <div className="text-sm text-destructive">
                  {placesError}
                </div>}
              
              <div className="text-xs text-muted-foreground">
                {t("establishment.poweredByGoogle")}
              </div>
              
              {selected && <div className="inline-flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
                  <span>{t("establishment.selected")}</span>
                  <strong>{selected.name}</strong>
                </div>}
            </div>
            
            <SaveEstablishmentButton selected={selected} onSaveSuccess={resetSearchAndClose} />
          </div>

          {/* Section Mon Établissement */}
          <section data-testid="card-mon-etablissement" className="border border-border rounded-lg p-4 bg-primary-foreground">
            <h2 className="text-xl font-semibold mb-3">{t("establishment.myEstablishment")}</h2>
            <MonEtablissementCard onAddClick={openSearch} />
          </section>

          {/* Anchor for reviews visual panel */}
          <div id="reviews-visual-anchor" />

          {/* Reviews Visual Panel */}
          {showReviewsVisual && <ReviewsVisualPanel establishmentId={visualEstablishment?.placeId || visualEstablishment?.id || currentEstablishment?.place_id} establishmentName={visualEstablishment?.name || currentEstablishment?.name} onClose={() => setShowReviewsVisual(false)} key={refreshTrigger} />}

          {/* Anchor pour le scroll vers la barre d'import */}
          <div id="import-avis-toolbar-anchor" />

          {/* Barre d'outils d'import (affichée conditionnellement) */}
          {showImportBar && (currentEstablishment?.place_id || selected?.place_id) ? (
            <ImportAvisToolbar 
              onClose={() => setShowImportBar(false)} 
              onFileAnalyzed={() => {
            console.log("Fichier analysé, rafraîchissement des données...");
              }} 
              onImportSuccess={handleImportSuccess} 
              onOpenVisualPanel={handleOpenVisualPanel} 
              placeId={currentEstablishment?.place_id || selected?.place_id} 
              establishmentName={currentEstablishment?.name || selected?.name} 
            />
          ) : showImportBar ? (
            <div className="border border-yellow-200 rounded-lg p-6 bg-yellow-50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-900">{t("establishment.noEstablishmentSelected") || "Aucun établissement sélectionné"}</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    {t("establishment.pleaseAddEstablishmentFirst") || "Veuillez d'abord ajouter un établissement pour pouvoir importer des avis."}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={openSearch}
                    className="mt-3"
                  >
                    {t("establishment.addEstablishment") || "Ajouter un établissement"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Liste des établissements enregistrés */}
          <div data-testid="section-etablissements-enregistres">
            <SavedEstablishmentsList onAddClick={openSearch} />
          </div>
          </div>
        </div>
      </div>
    </div>;
}