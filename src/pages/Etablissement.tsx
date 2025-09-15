import { useEffect, useState } from "react";
import { loadGoogleMaps } from "@/lib/loadGoogleMaps";
import MonEtablissementCard from "@/components/MonEtablissementCard";
import SaveEstablishmentButton from "@/components/SaveEstablishmentButton";
import { AnalyzeEstablishmentButton } from "@/components/AnalyzeEstablishmentButton";
import { SavedEstablishmentsList } from "@/components/SavedEstablishmentsList";
import { Etab } from "@/types/etablissement";
import { Button } from "@/components/ui/button";
import { Building2, Home, LogOut, Check } from "lucide-react";
import { Link } from "react-router-dom";

// TypeScript declarations for Google Maps
declare global {
  interface Window {
    google: any;
    initPlaces: () => void;
  }
}

export default function EtablissementPage() {
  const [selected, setSelected] = useState<Etab | null>(null);

  // ⚠️ Utilise EXACTEMENT ces champs dans Autocomplete pour récupérer phone/website/rating :
  // fields: ['place_id','name','formatted_address','geometry.location','url','website','formatted_phone_number','rating']
  function serializePlace(place: any): Etab {
    return {
      place_id: place.place_id,
      name: place.name ?? "",
      address: place.formatted_address ?? "",
      lat: place.geometry?.location?.lat() ?? null,
      lng: place.geometry?.location?.lng() ?? null,
      url: place.url ?? "",
      website: place.website ?? "",
      phone: place.formatted_phone_number ?? "",
      rating: place.rating ?? null,
    };
  }

  // Initialize Google Places autocomplete
  useEffect(() => {
    const initPlaces = () => {
      const input = document.getElementById('places-input') as HTMLInputElement;
      if (!input || !window.google?.maps?.places) return;
      
      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        types: ['establishment'],
        fields: ['place_id','name','formatted_address','geometry.location','url','website','formatted_phone_number','rating']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place || !place.place_id) return;
        setSelected(serializePlace(place)); // -> active le bouton + badge vert
      });
    };

    // Set up global callback
    window.initPlaces = initPlaces;

    // Load Google Maps or initialize if already loaded
    if (window.google?.maps?.places) {
      initPlaces();
    } else {
      loadGoogleMaps()
        .then(() => {
          initPlaces();
        })
        .catch((e) => {
          console.error('Erreur de chargement Google Maps:', e);
        });
    }
  }, []);

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
            
            <div className="space-y-2">
              <input
                id="places-input"
                className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Rechercher un établissement…"
              />
              
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
          <section className="border border-border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">🏢 Mon Établissement</h2>
            <MonEtablissementCard />
          </section>

          {/* Section Mes Établissements Enregistrés */}
          <section>
            <SavedEstablishmentsList />
          </section>
        </div>
      </div>
    </div>
  );
}