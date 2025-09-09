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
import AutocompleteEtablissementInline from "@/components/AutocompleteEtablissementInline";

const Etablissement = () => {
  const { toast } = useToast();
  const [modeActuel, setModeActuel] = useState<'recuperation' | 'saisie'>('recuperation');
  const [etablissement, setEtablissement] = useState("");
  const [periode, setPeriode] = useState("1-mois");
  const [etablissements, setEtablissements] = useState<string[]>([]);
  const [suggestionsEtablissements, setSuggestionsEtablissements] = useState<any[]>([]);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [rechercheEtablissementsEnCours, setRechercheEtablissementsEnCours] = useState(false);
  const [etablissementSelectionne, setEtablissementSelectionne] = useState("");
  const [positionUtilisateur, setPositionUtilisateur] = useState<{lat: number, lng: number} | null>(null);
  const [geolocalisationEnCours, setGeolocalisationEnCours] = useState(false);
  
  // États pour la saisie manuelle d'établissement
  const [etablissementManuel, setEtablissementManuel] = useState({
    nom: '',
    url: '',
    adresse: ''
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
        duration: 3000,
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
          duration: 3000,
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
        duration: 3000,
      });

    } catch (error) {
      console.error("Erreur recherche Google Maps:", error);
      toast({
        title: "Erreur de recherche",
        description: "Impossible d'effectuer la recherche. Vérifiez votre connexion.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setRechercheEnCours(false);
    }
  };

  // Fallback vers OpenStreetMap si Google API n'est pas disponible
  const rechercherEtablissementsOpenStreetMap = async (nom: string) => {
    try {
      setRechercheEnCours(true);
      
      const queries = [
        nom,
        `"${nom}"`,
        `${nom} France`
      ];
      
      let suggestions: any[] = [];
      
      for (const query of queries) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&q=${encodeURIComponent(query)}&extratags=1&countrycodes=fr`;
        
        const response = await fetch(url, {
          headers: { 
            Accept: "application/json",
            "User-Agent": "AnalytiqueApp/1.0"
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const nouveauxResultats = data
            .filter((item: any) => {
              if (!item.name) return false;
              return item.name.toLowerCase().includes(nom.toLowerCase());
            })
            .map((item: any) => ({
              id: item.place_id,
              nom: item.name || item.display_name?.split(",")[0] || "Établissement",
              adresse: item.display_name,
              type: item.type || "establishment",
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
            }));
          
          suggestions = [...suggestions, ...nouveauxResultats];
          if (suggestions.length >= 5) break;
        }
      }
      
      const suggestionsUniques = suggestions
        .filter((suggestion, index, self) => 
          index === self.findIndex(s => s.id === suggestion.id)
        )
        .slice(0, 8);
      
      setSuggestionsEtablissements(suggestionsUniques);
      
      if (suggestionsUniques.length > 0) {
        toast({
          title: "Recherche terminée",
          description: `${suggestionsUniques.length} établissement(s) trouvé(s)`,
          duration: 3000,
        });
      } else {
        toast({
          title: "Aucun résultat",
          description: "Aucun établissement trouvé avec OpenStreetMap",
          variant: "destructive",
          duration: 3000,
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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: nom })
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
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Établissement *</label>
                  <AutocompleteEtablissementInline 
                    onPicked={(place) => {
                      setEtablissement(place.name);
                      toast({
                        title: "Établissement sélectionné",
                        description: `${place.name} a été sélectionné`,
                        duration: 2000,
                      });
                    }}
                  />
                </div>

                <div className="mt-6">
                  <Button 
                    className="w-full"
                    onClick={rechercherEtablissement}
                    disabled={rechercheEnCours || !etablissement}
                  >
                    {rechercheEnCours ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Recherche en cours...
                      </>
                    ) : (
                      "Analyser cet établissement"
                    )}
                  </Button>
                </div>

                {/* Affichage des résultats de recherche */}
                {suggestionsEtablissements.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Résultats de recherche</h3>
                    <div className="space-y-3">
                      {suggestionsEtablissements.map((etablissement) => (
                        <div
                          key={etablissement.id}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => selectionnerEtablissement(etablissement)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{etablissement.nom}</h4>
                              <p className="text-sm text-gray-500 mt-1">{etablissement.adresse}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                  {etablissement.type}
                                </span>
                                {etablissement.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                    <span className="text-xs text-gray-600">
                                      {etablissement.rating} ({etablissement.user_ratings_total} avis)
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                      placeholder="Ex: https://www.legourmet.fr"
                      value={etablissementManuel.url}
                      onChange={(e) => gererChangementEtablissement('url', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Adresse
                    </label>
                    <Input
                      placeholder="Ex: 123 Rue de la Paix, 75001 Paris"
                      value={etablissementManuel.adresse}
                      onChange={(e) => gererChangementEtablissement('adresse', e.target.value)}
                    />
                  </div>

                </div>

                <Button 
                  onClick={enregistrerEtablissement} 
                  disabled={saisieEnCours}
                  className="w-full"
                >
                  {saisieEnCours ? "Enregistrement..." : "Enregistrer l'établissement"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Etablissement;