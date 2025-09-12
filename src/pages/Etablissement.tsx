import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, MapPin, Phone, Mail, Globe, Star, Users, FileText, Home, BarChart3, Upload, LogOut, Search, Info, Locate } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import AutocompleteEtablissementInline from "@/components/AutocompleteEtablissementInline";
import AutocompleteEtablissementsFR from "@/components/AutocompleteEtablissementsFR";
import PlacesSearchInput from "@/components/PlacesSearchInput";
import EstablishmentCard from "@/components/EstablishmentCard";
import { useEstablishmentStore } from "@/store/establishmentStore";
import { getCurrentEstablishment, EstablishmentData } from "@/services/establishments";

const Etablissement = () => {
  const { toast } = useToast();
  const { selectedEstablishment, setSelectedEstablishment, isLoading, setIsLoading } = useEstablishmentStore();
  const [modeActuel, setModeActuel] = useState<'recuperation' | 'saisie'>('recuperation');
  const [etablissement, setEtablissement] = useState("");
  const [periode, setPeriode] = useState("1-mois");
  const [etablissements, setEtablissements] = useState<string[]>([]);
  const [suggestionsEtablissements, setSuggestionsEtablissements] = useState<any[]>([]);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [rechercheEtablissementsEnCours, setRechercheEtablissementsEnCours] = useState(false);
  const [etablissementSelectionne, setEtablissementSelectionne] = useState("");
  const [positionUtilisateur, setPositionUtilisateur] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [geolocalisationEnCours, setGeolocalisationEnCours] = useState(false);

  // États pour la saisie manuelle d'établissement
  const [etablissementManuel, setEtablissementManuel] = useState({
    nom: '',
    url: '',
    adresse: '',
    telephone: ''
  });
  const [saisieEnCours, setSaisieEnCours] = useState(false);

  // Fonctions pour la saisie manuelle d'établissement
  const gererChangementEtablissement = (champ: string, valeur: string) => {
    setEtablissementManuel(prev => ({
      ...prev,
      [champ]: valeur
    }));
  };

  const enregistrerEtablissement = () => {
    if (!etablissementManuel.nom || !etablissementManuel.url) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir au moins le nom et l'URL",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    setSaisieEnCours(true);

    // Simuler un délai de traitement
    setTimeout(() => {
      setSaisieEnCours(false);
      toast({
        title: "Établissement enregistré",
        description: "Les informations ont été enregistrées avec succès",
        duration: 3000
      });
    }, 500);
  };

  // Load current establishment on component mount
  useEffect(() => {
    const loadCurrentEstablishment = async () => {
      if (selectedEstablishment) return; // Already loaded
      
      try {
        setIsLoading(true);
        const current = await getCurrentEstablishment();
        setSelectedEstablishment(current);
      } catch (error) {
        console.error('Error loading current establishment:', error);
        // Don't show error toast for this, it's normal if no establishment exists
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentEstablishment();
  }, [selectedEstablishment, setSelectedEstablishment, setIsLoading]);

  // Handler for when an establishment is saved
  const handleEstablishmentSaved = (establishment: EstablishmentData) => {
    setSelectedEstablishment(establishment);
    toast({
      title: "Établissement mis à jour",
      description: "Votre établissement courant a été mis à jour",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/lovable-uploads/08f62503-65d7-4681-8ddf-00f4efb00ffa.png" alt="Analytique logo" className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900">analytique</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/tableau-de-bord">
                <Button variant="ghost" className="text-gray-700 flex items-center gap-1">
                  <Home className="w-4 h-4" />
                  Accueil
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="ghost" className="text-gray-700 flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/etablissement">
                <Button variant="ghost" className="text-blue-600 font-medium flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  Établissement
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-gray-700">
                <span>Bonjour, Yohan Lopes</span>
              </div>
              <Button variant="ghost" className="text-gray-700 flex items-center gap-1">
                <LogOut className="w-4 h-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mon Établissement</h1>
            <p className="text-gray-600">Gérez les informations de votre établissement</p>
          </div>
        </div>

        {/* Import section */}
        <div className="mb-8">
          {/* Header buttons */}
          <div className="bg-white border border-gray-200 rounded-lg mb-6">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex-1">
                  <Button variant="ghost" className={`w-full flex items-center gap-2 ${modeActuel === 'saisie' ? 'text-blue-600 font-medium' : 'text-gray-600'}`} onClick={() => setModeActuel('saisie')}>
                    <FileText className="w-4 h-4" />
                    Recherche manuelle
                  </Button>
                </div>
                <div className="flex-1">
                  <Button variant="ghost" className={`w-full flex items-center gap-2 ${modeActuel === 'recuperation' ? 'text-blue-600 font-medium' : 'text-gray-600'}`} onClick={() => setModeActuel('recuperation')}>
                    <Search className="w-4 h-4" />
                    Recherche automatique
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Header dynamique */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                {modeActuel === 'saisie' && <FileText className="w-6 h-6 text-blue-600" />}
                {modeActuel === 'recuperation' && <Search className="w-6 h-6 text-blue-600" />}
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                {modeActuel === 'saisie' && "Recherche manuelle d'établissement"}
                {modeActuel === 'recuperation' && "Recherche automatique d'établissement"}
              </h2>
            </div>
            <p className="text-lg text-gray-600">
              {modeActuel === 'saisie' && "Saisissez manuellement votre établissement dans le système"}
              {modeActuel === 'recuperation' && "Récupérez automatiquement les avis Google, Tripadvisor et Yelp de votre établissement"}
            </p>
          </div>

          {/* Contenu conditionnel */}
          {modeActuel === 'recuperation' && (
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recherche Google Places (Auto-complétion) *
                    </label>
                    <div className="space-y-4">
                      <Input
                        id="venueSearch"
                        type="text"
                        placeholder="Rechercher un établissement…"
                        className="w-full"
                      />
                      <input id="selected_place_id" type="hidden" />
                      <Button 
                        id="saveVenueBtn" 
                        disabled
                        className="w-full"
                      >
                        Enregistrer l'établissement
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {modeActuel === 'saisie' && (
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de l'établissement *
                    </label>
                    <Input
                      type="text"
                      value={etablissementManuel.nom}
                      onChange={(e) => gererChangementEtablissement('nom', e.target.value)}
                      placeholder="Nom de l'établissement"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL de l'établissement *
                    </label>
                    <Input
                      type="url"
                      value={etablissementManuel.url}
                      onChange={(e) => gererChangementEtablissement('url', e.target.value)}
                      placeholder="https://www.exemple.com"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    <Input
                      type="text"
                      value={etablissementManuel.adresse}
                      onChange={(e) => gererChangementEtablissement('adresse', e.target.value)}
                      placeholder="123 Rue de la Paix, Paris"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <Input
                      type="tel"
                      value={etablissementManuel.telephone}
                      onChange={(e) => gererChangementEtablissement('telephone', e.target.value)}
                      placeholder="+33 1 23 45 67 89"
                      className="w-full"
                    />
                  </div>

                  <Button 
                    onClick={enregistrerEtablissement}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    disabled={saisieEnCours}
                  >
                    {saisieEnCours ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Enregistrement...
                      </>
                    ) : (
                      "Enregistrer l'établissement"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Establishment display */}
          {selectedEstablishment && (
            <EstablishmentCard 
              establishment={selectedEstablishment}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>

      {/* Script pour initialiser Google Places Autocomplete */}
      <script dangerouslySetInnerHTML={{
        __html: `
          // Fonctions utilitaires pour Supabase
          const SUPABASE_URL = "https://zzjmtipdsccxmmoaetlp.supabase.co";
          const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6am10aXBkc2NjeG1tb2FldGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjY1NjksImV4cCI6MjA3MzIwMjU2OX0.9y4TO3Hbp2rgD33ygLNRtDZiBbMEJ6Iz2SW6to6wJkU";

          async function supa() {
            if (!window.supabase) {
              await new Promise((res) => {
                const s = document.createElement('script');
                s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
                s.onload = res;
                document.head.appendChild(s);
              });
              window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
                auth: { persistSession: true, autoRefreshToken: true }
              });
            }
            return window.supabase;
          }

          // Edge Function → détails Google
          async function fetchPlaceDetails(place_id){
            const url = SUPABASE_URL + "/functions/v1/place-details";
            const res = await fetch(url, {
              method: "POST",
              headers: { "content-type": "application/json", "Authorization": "Bearer " + SUPABASE_ANON },
              body: JSON.stringify({ place_id })
            });
            if(!res.ok) throw new Error(await res.text());
            return await res.json();
          }

          // Upsert venues
          async function saveSelectedPlace(place_id){
            const supabase = await supa();

            const { data: { user } } = await supabase.auth.getUser();
            if(!user){ alert("Connecte-toi d'abord."); return; }

            const d = await fetchPlaceDetails(place_id);

            // Enregistrer en base (upsert par place_id)
            const payload = {
              owner_id: user.id,
              place_id: d.place_id,
              name: d.name ?? 'Sans nom',
              address: d.address ?? null,
              phone_number: d.phone ?? null,
              website: d.website ?? null,
              google_rating: d.rating ?? null,
              opening_hours: d.opening_hours ?? null,
              lat: d.lat ?? null,
              lng: d.lng ?? null
            };

            const { error } = await supabase.from('venues').upsert(payload, { onConflict: 'place_id' });
            if(error){ alert(error.message || "Erreur enregistrement (RLS ?)"); return; }

            alert("Établissement enregistré ✅");
            
            // Refresh the page to show the new establishment
            window.location.reload();
          }

          // Fonction d'initialisation de l'autocomplétion
          window.initAutocomplete = function initAutocomplete() {
            const input  = document.getElementById('venueSearch');
            const hidden = document.getElementById('selected_place_id');
            const btn    = document.getElementById('saveVenueBtn');

            if (!input || !hidden || !btn) return;

            // eslint-disable-next-line no-undef
            const ac = new google.maps.places.Autocomplete(input, {
              types: ['establishment'],
              fields: ['place_id', 'name', 'formatted_address']
            });

            // Quand l'utilisateur clique UNE suggestion
            ac.addListener('place_changed', () => {
              const place = ac.getPlace();
              if (!place || !place.place_id) return;

              // 1) Afficher dans la barre : "Nom — Adresse"
              const label = [place.name, place.formatted_address].filter(Boolean).join(" — ");
              input.value = label;

              // 2) Stocker le place_id
              hidden.value = place.place_id;

              // 3) Activer le bouton
              btn.disabled = false;
            });

            // Quand je clique "Enregistrer l'établissement"
            btn.addEventListener('click', async () => {
              const pid = hidden.value;
              if (!pid) {
                alert("Choisis d'abord un établissement.");
                return;
              }
              btn.disabled = true;
              const old = btn.textContent;
              btn.textContent = "Enregistrement…";
              try {
                await saveSelectedPlace(pid);
              } catch (e) {
                console.error(e);
                alert("Erreur (voir console).");
              } finally {
                btn.disabled = false;
                btn.textContent = old;
              }
            });
          };

          // Charger Google Maps API et initialiser
          if (!window.google) {
            const script = document.createElement('script');
            script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCs0SQuBNFEW4FVXkprFoJZYL3REtBXdy0&libraries=places&callback=initAutocomplete';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
          } else {
            // Si Google Maps est déjà chargé, initialiser directement
            window.initAutocomplete();
          }
        `
      }} />
    </div>
  );
};

export default Etablissement;