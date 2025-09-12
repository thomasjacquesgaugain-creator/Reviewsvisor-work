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
import GooglePlaceAutocomplete from "@/components/GooglePlaceAutocomplete";
import EstablishmentCard from "@/components/EstablishmentCard";
import { useEstablishmentStore } from "@/store/establishmentStore";
import { getCurrentEstablishment, EstablishmentData, saveSelectedPlace } from "@/services/establishments";
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
  
  // New state for the form integration
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // États pour la saisie manuelle d'établissement
  const [etablissementManuel, setEtablissementManuel] = useState({
    nom: '',
    url: '',
    adresse: '',
    telephone: ''
  });
  const [saisieEnCours, setSaisieEnCours] = useState(false);

  // Google Maps API Key - À configurer
  const GOOGLE_API_KEY = "YOUR_API_KEY";

  // Fonctions pour la saisie manuelle d'établissement
  const gererChangementEtablissement = (champ: string, valeur: string) => {
    setEtablissementManuel(prev => ({
      ...prev,
      [champ]: valeur
    }));
  };

  // Recherche d'établissement avec Google Maps API
  const rechercherEtablissement = async () => {
    const nomEtablissement = etablissement.trim();
    if (!nomEtablissement) {
      toast({
        title: "Erreur",
        description: "Veuillez renseigner le nom de l'établissement",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    if (!GOOGLE_API_KEY || GOOGLE_API_KEY === "YOUR_API_KEY") {
      // Fallback vers OpenStreetMap
      await rechercherEtablissementsOpenStreetMap(nomEtablissement);
      return;
    }
    try {
      setRechercheEnCours(true);

      // Text Search pour trouver l'établissement
      const searchUrl = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
      searchUrl.searchParams.set("query", nomEtablissement);
      searchUrl.searchParams.set("region", "fr"); // Limité à la France
      searchUrl.searchParams.set("language", "fr");
      searchUrl.searchParams.set("key", GOOGLE_API_KEY);
      const searchResponse = await fetch(searchUrl.toString());
      const searchData = await searchResponse.json();
      const results = searchData?.results || [];
      if (!results.length) {
        toast({
          title: "Aucun résultat",
          description: "Aucun établissement trouvé. Essayez une variante du nom.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }

      // Convertir les résultats au format attendu
      const suggestions = results.slice(0, 8).map((result: any) => ({
        id: result.place_id,
        nom: result.name,
        adresse: result.formatted_address,
        type: result.types?.[0] || "establishment",
        lat: result.geometry?.location?.lat || 0,
        lon: result.geometry?.location?.lng || 0,
        rating: result.rating || 0,
        user_ratings_total: result.user_ratings_total || 0
      }));
      setSuggestionsEtablissements(suggestions);
      toast({
        title: "Recherche terminée",
        description: `${results.length} établissement(s) trouvé(s)`,
        duration: 3000
      });
    } catch (error) {
      console.error("Erreur recherche Google Maps:", error);
      toast({
        title: "Erreur de recherche",
        description: "Impossible d'effectuer la recherche. Vérifiez votre connexion.",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setRechercheEnCours(false);
    }
  };

  // Fallback vers OpenStreetMap si Google API n'est pas disponible
  const rechercherEtablissementsOpenStreetMap = async (nom: string) => {
    try {
      setRechercheEnCours(true);
      const queries = [nom, `"${nom}"`, `${nom} France`];
      let suggestions: any[] = [];
      for (const query of queries) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&q=${encodeURIComponent(query)}&extratags=1&countrycodes=fr`;
        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": "AnalytiqueApp/1.0"
          }
        });
        if (response.ok) {
          const data = await response.json();
          const nouveauxResultats = data.filter((item: any) => {
            if (!item.name) return false;
            return item.name.toLowerCase().includes(nom.toLowerCase());
          }).map((item: any) => ({
            id: item.place_id,
            nom: item.name || item.display_name?.split(",")[0] || "Établissement",
            adresse: item.display_name,
            type: item.type || "establishment",
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
          }));
          suggestions = [...suggestions, ...nouveauxResultats];
          if (suggestions.length >= 5) break;
        }
      }
      const suggestionsUniques = suggestions.filter((suggestion, index, self) => index === self.findIndex(s => s.id === suggestion.id)).slice(0, 8);
      setSuggestionsEtablissements(suggestionsUniques);
      if (suggestionsUniques.length > 0) {
        toast({
          title: "Recherche terminée",
          description: `${suggestionsUniques.length} établissement(s) trouvé(s)`,
          duration: 3000
        });
      } else {
        toast({
          title: "Aucun résultat",
          description: "Aucun établissement trouvé avec OpenStreetMap",
          variant: "destructive",
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Erreur recherche OpenStreetMap:", error);
    } finally {
      setRechercheEnCours(false);
    }
  };

  // Recherche automatique d'établissements avec l'Edge Function
  const rechercherEtablissementsAutomatique = async (nom: string) => {
    console.log("Début recherche pour:", nom);
    if (!nom || nom.length < 2) {
      setSuggestionsEtablissements([]);
      return;
    }
    try {
      setRechercheEtablissementsEnCours(true);

      // Utiliser l'Edge Function pour la recherche
      const response = await fetch('/api/search-establishments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: nom
        })
      });
      const data = await response.json();
      if (response.ok) {
        const suggestions = data.establishments.map((item: any) => ({
          id: item.place_id || Math.random().toString(),
          nom: item.name,
          adresse: item.address,
          type: "establishment",
          lat: item.location?.lat || 0,
          lon: item.location?.lng || 0,
          rating: item.rating || 0,
          user_ratings_total: item.user_ratings_total || 0
        }));
        setSuggestionsEtablissements(suggestions.slice(0, 8));
      } else {
        setSuggestionsEtablissements([]);
      }
    } catch (error) {
      console.error("Erreur recherche établissements:", error);
      setSuggestionsEtablissements([]);
    } finally {
      setRechercheEtablissementsEnCours(false);
    }
  };

  // Sélectionner un établissement depuis les suggestions
  const selectionnerEtablissement = (etablissementSuggere: any) => {
    setEtablissement(etablissementSuggere.nom);
    setSuggestionsEtablissements([]);
    toast({
      title: "Établissement sélectionné",
      description: `${etablissementSuggere.nom} a été sélectionné`,
      duration: 2000
    });
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

  // Obtenir la géolocalisation de l'utilisateur
  const obtenirGeolocalisation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Géolocalisation non supportée",
        description: "Votre navigateur ne supporte pas la géolocalisation",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    setGeolocalisationEnCours(true);
    navigator.geolocation.getCurrentPosition(position => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      setPositionUtilisateur(coords);
      setGeolocalisationEnCours(false);
      toast({
        title: "Position trouvée",
        description: "Recherche d'établissements à proximité...",
        duration: 3000
      });
    }, error => {
      setGeolocalisationEnCours(false);
      let message = "Erreur de géolocalisation";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = "Autorisation de géolocalisation refusée";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "Position non disponible";
          break;
        case error.TIMEOUT:
          message = "Délai de géolocalisation dépassé";
          break;
      }
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
        duration: 3000
      });
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    });
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

  // Handle analyze establishment button click
  const handleAnalyzeEstablishment = async () => {
    const pid = (document.getElementById('selected_place_id') as HTMLInputElement)?.value;
    if (pid) {
      setIsAnalyzing(true);
      try {
        await saveSelectedPlace(pid);
        toast({
          title: "Analyse terminée",
          description: "L'établissement a été analysé et sauvegardé avec succès",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Erreur lors de l'analyse de l'établissement",
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  return <div className="min-h-screen bg-gray-50">
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
          {modeActuel === 'recuperation' && <Card className="mb-8">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recherche Google Places (Auto-complétion) *
                    </label>
                    <GooglePlaceAutocomplete 
                      id="venueSearch"
                      value={etablissement} 
                      onChange={setEtablissement} 
                      onSelect={place => {
                        setEtablissement(place.name);
                        // Store the place_id for analysis
                        setSelectedPlaceId(place.place_id);
                        // Pré-remplir automatiquement les champs
                        setEtablissementManuel({
                          nom: place.name,
                          url: place.website || '',
                          adresse: place.address,
                          telephone: place.phone || ''
                        });
                      }}
                      onEstablishmentSaved={handleEstablishmentSaved}
                      placeholder="Rechercher un établissement…" 
                    />
                  </div>
                  
                  {/* Hidden input to store selected place_id */}
                  <input 
                    id="selected_place_id" 
                    type="hidden" 
                    value={selectedPlaceId}
                    readOnly
                  />

                  {/* Venue Information Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom de l'établissement
                      </label>
                      <Input
                        id="venue_name"
                        value={etablissementManuel.nom}
                        onChange={(e) => gererChangementEtablissement('nom', e.target.value)}
                        placeholder="Nom"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse
                      </label>
                      <Input
                        id="venue_address"
                        value={etablissementManuel.adresse}
                        onChange={(e) => gererChangementEtablissement('adresse', e.target.value)}
                        placeholder="Adresse"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone
                      </label>
                      <Input
                        id="venue_phone"
                        value={etablissementManuel.telephone}
                        onChange={(e) => gererChangementEtablissement('telephone', e.target.value)}
                        placeholder="Téléphone"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site web
                      </label>
                      <Input
                        id="venue_website"
                        value={etablissementManuel.url}
                        onChange={(e) => gererChangementEtablissement('url', e.target.value)}
                        placeholder="Site web"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Analyze Button */}
                  <div className="flex justify-center pt-6">
                    <Button
                      id="analyzeBtn"
                      onClick={handleAnalyzeEstablishment}
                      disabled={!selectedPlaceId || isAnalyzing}
                      className="px-8 py-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Analyse en cours...
                        </>
                      ) : (
                        'Analyser cet établissement'
                      )}
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ou rechercher dans la base française
                    </label>
                    <AutocompleteEtablissementsFR onPicked={item => {
                      setEtablissement(item.label);
                      setEtablissementManuel({
                        nom: item.label,
                        url: '',
                        adresse: item.secondary || '',
                        telephone: ''
                      });
                      toast({
                        title: "Établissement français sélectionné",
                        description: `${item.label} (SIRET: ${item.siret || 'Non disponible'})`,
                        duration: 3000
                      });
                    }} />
                  </div>
                </div>

                {/* Affichage des résultats de recherche */}
                {suggestionsEtablissements.length > 0 && <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Résultats de recherche</h3>
                    <div className="space-y-3">
                      {suggestionsEtablissements.map(etablissement => <div key={etablissement.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => selectionnerEtablissement(etablissement)}>
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{etablissement.nom}</h4>
                              <p className="text-sm text-gray-500 mt-1">{etablissement.adresse}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                  {etablissement.type}
                                </span>
                                {etablissement.rating && <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                    <span className="text-xs text-gray-600">
                                      {etablissement.rating} ({etablissement.user_ratings_total} avis)
                                    </span>
                                  </div>}
                              </div>
                            </div>
                          </div>
                        </div>)}
                    </div>
                  </div>}
              </CardContent>
            </Card>}

          {modeActuel === 'saisie' && <Card className="mb-8">
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Recherche Google Places pour pré-remplissage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recherche Google Places (pour pré-remplissage)
                    </label>
                    <GooglePlaceAutocomplete value="" onChange={() => {}} onSelect={place => {
                  setEtablissementManuel({
                    nom: place.name,
                    url: place.website || '',
                    adresse: place.address,
                    telephone: place.phone || ''
                  });
                  toast({
                    title: "Informations pré-remplies",
                    description: `Données de ${place.name} importées`,
                    duration: 3000
                  });
                }} placeholder="Rechercher pour pré-remplir automatiquement" />
                    <div className="text-xs text-gray-500 mt-1">
                      Sélectionnez un établissement pour remplir automatiquement les champs ci-dessous
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-medium text-gray-900 mb-4">Informations de l'établissement</h3>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Nom de l'établissement <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          id="venue_name"
                          placeholder="Ex: Restaurant Le Gourmet" 
                          value={etablissementManuel.nom} 
                          onChange={e => gererChangementEtablissement('nom', e.target.value)} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          URL/Site web <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          id="venue_website"
                          placeholder="Ex: https://www.legourmet.fr" 
                          value={etablissementManuel.url} 
                          onChange={e => gererChangementEtablissement('url', e.target.value)} 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Adresse (optionnelle)
                        </label>
                        <Input 
                          id="venue_address"
                          placeholder="Ex: 123 Rue de la Paix, 75001 Paris" 
                          value={etablissementManuel.adresse} 
                          onChange={e => gererChangementEtablissement('adresse', e.target.value)} 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Téléphone (optionnel)
                        </label>
                        <Input 
                          id="venue_phone"
                          placeholder="Ex: +33 1 23 45 67 89" 
                          value={etablissementManuel.telephone || ''} 
                          onChange={e => gererChangementEtablissement('telephone', e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={enregistrerEtablissement} disabled={saisieEnCours || !etablissementManuel.nom || !etablissementManuel.url} className="w-full">
                    {saisieEnCours ? <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Enregistrement...
                      </> : "Analyser cet établissement"}
                  </Button>
                </div>
              </CardContent>
            </Card>}
        </div>

        {/* Section Mon Établissement */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <EstablishmentCard 
            establishment={selectedEstablishment} 
            isLoading={isLoading}
          />
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Utilisez l'autocomplétion Google Places ci-dessus pour sélectionner votre établissement et voir ses informations s'afficher automatiquement.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Keep the old static card for comparison - can be removed later */}
        <Card className="mb-8" style={{ display: 'none' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Mon Établissement (Statique)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nom de l'établissement</label>
                <div className="text-gray-900 font-medium">Restaurant Le Petit Paris</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Adresse</label>
                <div className="text-gray-900">123 Rue de la République, 75001 Paris</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Téléphone</label>
                <div className="text-gray-900">01 42 36 58 79</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <div className="text-gray-900">contact@lepetitparis.fr</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Type d'établissement</label>
                <div className="text-gray-900">Restaurant</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">SIRET</label>
                <div className="text-gray-900">12345678912345</div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Modifier les informations
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Ajouter une photo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section Réponse automatique */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Info className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Réponse automatique</h3>
                  <p className="text-sm text-gray-600">Configurez les réponses automatiques aux avis</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configurer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Etablissement;