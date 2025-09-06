import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Star, 
  Users, 
  FileText, 
  Home, 
  BarChart3, 
  Upload, 
  LogOut,
  Search,
  Info,
  Locate
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

const Etablissement = () => {
  const { toast } = useToast();
  const [modeActuel, setModeActuel] = useState<'recuperation' | 'saisie'>('recuperation');
  const [ville, setVille] = useState("");
  const [etablissement, setEtablissement] = useState("");
  const [periode, setPeriode] = useState("1-mois");
  const [etablissements, setEtablissements] = useState<string[]>([]);
  const [suggestionsEtablissements, setSuggestionsEtablissements] = useState<any[]>([]);
  const [villes, setVilles] = useState<string[]>([]);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [rechercheEtablissementsEnCours, setRechercheEtablissementsEnCours] = useState(false);
  const [rechercheVillesEnCours, setRechercheVillesEnCours] = useState(false);
  const [etablissementSelectionne, setEtablissementSelectionne] = useState("");
  const [villeSelectionnee, setVilleSelectionnee] = useState("");
  const [villeBBox, setVilleBBox] = useState<{s:number;n:number;w:number;e:number;name:string} | null>(null);
  const [bboxEnCours, setBboxEnCours] = useState(false);
  const [positionUtilisateur, setPositionUtilisateur] = useState<{lat: number, lng: number} | null>(null);
  const [geolocalisationEnCours, setGeolocalisationEnCours] = useState(false);
  
  // États pour la saisie manuelle d'établissement
  const [etablissementManuel, setEtablissementManuel] = useState({
    nom: '',
    url: '',
    adresse: '',
    telephone: '',
    email: '',
    type: 'Restaurant'
  });

  const [saisieEnCours, setSaisieEnCours] = useState(false);

  // Fonctions pour la saisie manuelle d'établissement
  const gererChangementEtablissement = (champ: string, valeur: string) => {
    setEtablissementManuel(prev => ({
      ...prev,
      [champ]: valeur
    }));
  };

  // Google Places API Key - À remplacer par votre clé API
  const GOOGLE_API_KEY = "YOUR_GOOGLE_PLACES_API_KEY";

  // Recherche automatique d'établissements avec Google Places API
  const rechercherEtablissementsAutomatique = async (nom: string, villeContext: string = "") => {
    if (!nom || nom.length < 2) {
      setSuggestionsEtablissements([]);
      return;
    }

    if (!GOOGLE_API_KEY || GOOGLE_API_KEY === "YOUR_GOOGLE_PLACES_API_KEY") {
      console.warn("Clé API Google Places manquante");
      setSuggestionsEtablissements([]);
      return;
    }

    try {
      setRechercheEtablissementsEnCours(true);
      
      const query = villeContext ? `${nom} ${villeContext}` : nom;
      
      // Appel à l'API Google Places Autocomplete
      const autocompleteUrl = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
      autocompleteUrl.searchParams.set("input", query);
      autocompleteUrl.searchParams.set("types", "establishment");
      autocompleteUrl.searchParams.set("language", "fr");
      autocompleteUrl.searchParams.set("components", "country:fr");
      autocompleteUrl.searchParams.set("key", GOOGLE_API_KEY);

      const response = await fetch(autocompleteUrl.toString());
      
      if (!response.ok) {
        throw new Error("Erreur API Google Places");
      }

      const data = await response.json();
      const predictions = data.predictions || [];

      // Obtenir les détails pour chaque prédiction
      const suggestionsAvecDetails = await Promise.all(
        predictions.slice(0, 8).map(async (prediction: any) => {
          try {
            const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
            detailsUrl.searchParams.set("place_id", prediction.place_id);
            detailsUrl.searchParams.set("fields", "place_id,name,formatted_address,address_component,geometry,types");
            detailsUrl.searchParams.set("language", "fr");
            detailsUrl.searchParams.set("key", GOOGLE_API_KEY);

            const detailsResponse = await fetch(detailsUrl.toString());
            if (!detailsResponse.ok) return null;

            const detailsData = await detailsResponse.json();
            const place = detailsData.result;

            if (!place) return null;

            // Parser les composants d'adresse
            const addressComponents = place.address_components || [];
            const getComponent = (type: string) => 
              addressComponents.find((comp: any) => comp.types.includes(type))?.long_name || "";

            return {
              id: prediction.place_id,
              nom: place.name || prediction.description,
              adresse: place.formatted_address || prediction.description,
              type: place.types[0] || "establishment",
              lat: place.geometry?.location?.lat || 0,
              lon: place.geometry?.location?.lng || 0,
              ville: getComponent("locality") || getComponent("postal_town") || "",
              details: {
                numero: getComponent("street_number"),
                voie: getComponent("route"),
                ville: getComponent("locality") || getComponent("postal_town"),
                codePostal: getComponent("postal_code"),
                departement: getComponent("administrative_area_level_2"),
                region: getComponent("administrative_area_level_1"),
                pays: getComponent("country")
              }
            };
          } catch (error) {
            console.error("Erreur détails lieu:", error);
            return null;
          }
        })
      );

      // Filtrer les résultats null et mettre à jour les suggestions
      const suggestionsValides = suggestionsAvecDetails.filter(Boolean);
      setSuggestionsEtablissements(suggestionsValides);
      console.log(`Trouvé ${suggestionsValides.length} établissements via Google Places`);
      
    } catch (error) {
      console.error("Erreur recherche Google Places:", error);
      setSuggestionsEtablissements([]);
      
      // Fallback vers OpenStreetMap si Google API échoue
      console.log("Fallback vers OpenStreetMap...");
      await rechercherEtablissementsOpenStreetMap(nom, villeContext);
    } finally {
      setRechercheEtablissementsEnCours(false);
    }
  };

  // Méthode de fallback OpenStreetMap
  const rechercherEtablissementsOpenStreetMap = async (nom: string, villeContext: string = "") => {
    try {
      const query = villeContext ? `${nom} ${villeContext}` : nom;
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=${encodeURIComponent(query)}&extratags=1`;
      
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const etablissementTypes = new Set([
          "restaurant", "cafe", "bar", "fast_food", "food_court", "pub", 
          "biergarten", "ice_cream", "nightclub", "bakery", "pastry", "caterer"
        ]);
        
        const suggestions = data
          .filter((item: any) => 
            (item.class === "amenity" && etablissementTypes.has(item.type)) ||
            (item.class === "shop" && ["bakery", "pastry", "confectionery"].includes(item.type)) ||
            (item.class === "craft" && item.type === "caterer")
          )
          .map((item: any) => ({
            id: item.place_id,
            nom: item.name || item.display_name?.split(",")[0] || "Établissement",
            adresse: item.display_name,
            type: item.type,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            ville: item.address?.city || item.address?.town || item.address?.village || "",
          }));
        
        setSuggestionsEtablissements(suggestions);
        console.log(`Fallback OSM: ${suggestions.length} suggestions`);
      }
    } catch (error) {
      console.error("Erreur fallback OpenStreetMap:", error);
      setSuggestionsEtablissements([]);
    }
  };

  // Sélectionner un établissement depuis les suggestions
  const selectionnerEtablissement = (etablissementSuggere: any) => {
    setEtablissement(etablissementSuggere.nom);
    if (etablissementSuggere.ville && !ville) {
      setVille(etablissementSuggere.ville);
    }
    setSuggestionsEtablissements([]);
    
    toast({
      title: "Établissement sélectionné",
      description: `${etablissementSuggere.nom} a été sélectionné`,
      duration: 2000,
    });
  };

  const enregistrerEtablissement = () => {
    if (!etablissementManuel.nom || !etablissementManuel.url) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir au moins le nom et l'URL",
        variant: "destructive",
        duration: 3000,
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
        duration: 3000,
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
        duration: 3000,
      });
      return;
    }

    setGeolocalisationEnCours(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setPositionUtilisateur(coords);
        setGeolocalisationEnCours(false);
        
        toast({
          title: "Position trouvée",
          description: "Recherche d'établissements à proximité...",
          duration: 3000,
        });
      },
      (error) => {
        setGeolocalisationEnCours(false);
        let message = "Erreur de géolocalisation";
        switch(error.code) {
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
          duration: 3000,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
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
                  <Button 
                    variant="ghost" 
                    className={`w-full flex items-center gap-2 ${modeActuel === 'saisie' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                    onClick={() => setModeActuel('saisie')}
                  >
                    <FileText className="w-4 h-4" />
                    Recherche manuelle
                  </Button>
                </div>
                <div className="flex-1">
                  <Button 
                    variant="ghost" 
                    className={`w-full flex items-center gap-2 ${modeActuel === 'recuperation' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                    onClick={() => setModeActuel('recuperation')}
                  >
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
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Établissement <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        placeholder="Nom de votre établissement..."
                        value={etablissement}
                        onChange={(e) => {
                          setEtablissement(e.target.value);
                          rechercherEtablissementsAutomatique(e.target.value, ville);
                        }}
                        className="w-full"
                      />
                      {rechercheEtablissementsEnCours && (
                        <div className="absolute right-3 top-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        </div>
                      )}
                      
                      {/* Suggestions dropdown */}
                      {suggestionsEtablissements.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {suggestionsEtablissements.map((suggestion) => (
                            <div
                              key={suggestion.id}
                              onClick={() => selectionnerEtablissement(suggestion)}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{suggestion.nom}</div>
                              <div className="text-sm text-gray-500 truncate">{suggestion.adresse}</div>
                              <div className="text-xs text-blue-600 capitalize">{suggestion.type}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Ville <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        placeholder="Tapez le nom de votre ville..."
                        value={ville}
                        onChange={(e) => setVille(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Période d'analyse
                    </label>
                    <Select value={periode} onValueChange={setPeriode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-mois">1 mois</SelectItem>
                        <SelectItem value="3-mois">3 mois</SelectItem>
                        <SelectItem value="6-mois">6 mois</SelectItem>
                        <SelectItem value="1-an">1 an</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button className="w-full">
                    Analyser les avis
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {modeActuel === 'saisie' && (
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nom de l'établissement <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Ex: Restaurant Le Gourmet"
                      value={etablissementManuel.nom}
                      onChange={(e) => gererChangementEtablissement('nom', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      URL/Site web <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="https://monrestaurant.com"
                      value={etablissementManuel.url}
                      onChange={(e) => gererChangementEtablissement('url', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Adresse
                    </label>
                    <Input
                      placeholder="123 Rue de la Paix, 75001 Paris"
                      value={etablissementManuel.adresse}
                      onChange={(e) => gererChangementEtablissement('adresse', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Téléphone
                    </label>
                    <Input
                      placeholder="01 23 45 67 89"
                      value={etablissementManuel.telephone}
                      onChange={(e) => gererChangementEtablissement('telephone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <Input
                      placeholder="contact@monrestaurant.com"
                      value={etablissementManuel.email}
                      onChange={(e) => gererChangementEtablissement('email', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Type d'établissement
                    </label>
                    <Select value={etablissementManuel.type} onValueChange={(value) => gererChangementEtablissement('type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Restaurant">Restaurant</SelectItem>
                        <SelectItem value="Café">Café</SelectItem>
                        <SelectItem value="Bar">Bar</SelectItem>
                        <SelectItem value="Boulangerie">Boulangerie</SelectItem>
                        <SelectItem value="Hôtel">Hôtel</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>



                <Button 
                  onClick={enregistrerEtablissement}
                  disabled={saisieEnCours}
                  className="w-full"
                >
                  {saisieEnCours ? 'Enregistrement en cours...' : 'Enregistrer les informations'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              
              
            </Card>

          </div>

          {/* Statistiques */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Note moyenne
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">4.2</div>
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className={`w-4 h-4 ${star <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">Basé sur 247 avis</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">23</div>
                  <p className="text-sm text-gray-600">Nouveaux avis ce mois</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">89%</div>
                  <p className="text-sm text-gray-600">Avis positifs</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Button className="w-full mb-3">
                  Modifier les informations
                </Button>
                <Button variant="outline" className="w-full">
                  Voir les avis
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Etablissement;