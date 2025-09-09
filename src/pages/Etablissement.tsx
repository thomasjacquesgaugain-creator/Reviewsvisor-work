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
  const [suggestionsVilles, setSuggestionsVilles] = useState<any[]>([]);
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
    const nomVille = ville.trim();
    
    if (!nomEtablissement || !nomVille) {
      toast({
        title: "Erreur",
        description: "Veuillez renseigner le nom de l'établissement et la ville",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!GOOGLE_API_KEY || GOOGLE_API_KEY === "YOUR_API_KEY") {
      // Fallback vers OpenStreetMap
      await rechercherEtablissementsOpenStreetMap(nomEtablissement, nomVille);
      return;
    }

    try {
      setRechercheEnCours(true);
      
      // 1) Geocode de la ville pour obtenir les coordonnées
      const geoUrl = new URL("https://maps.googleapis.com/maps/api/geocode/json");
      geoUrl.searchParams.set("address", nomVille);
      geoUrl.searchParams.set("language", "fr");
      geoUrl.searchParams.set("key", GOOGLE_API_KEY);
      
      const geoResponse = await fetch(geoUrl.toString());
      const geoData = await geoResponse.json();
      const location = geoData?.results?.[0]?.geometry?.location;
      
      if (!location) {
        toast({
          title: "Ville introuvable",
          description: `Impossible de localiser "${nomVille}"`,
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      // 2) Text Search pour trouver l'établissement
      const searchUrl = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
      searchUrl.searchParams.set("query", `${nomEtablissement} ${nomVille}`);
      searchUrl.searchParams.set("location", `${location.lat},${location.lng}`);
      searchUrl.searchParams.set("radius", "30000"); // 30km
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
        ville: nomVille,
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
  const rechercherEtablissementsOpenStreetMap = async (nom: string, villeContext: string) => {
    try {
      setRechercheEnCours(true);
      
      const queries = [
        `${nom} ${villeContext}`,
        `${nom}, ${villeContext}`,
        `"${nom}" ${villeContext}`
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
              const nomMatch = item.name.toLowerCase().includes(nom.toLowerCase());
              const villeMatch = item.display_name && item.display_name.toLowerCase().includes(villeContext.toLowerCase());
              return nomMatch || villeMatch;
            })
            .map((item: any) => ({
              id: item.place_id,
              nom: item.name || item.display_name?.split(",")[0] || "Établissement",
              adresse: item.display_name,
              type: item.type || "establishment",
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              ville: item.address?.city || item.address?.town || item.address?.village || villeContext,
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
  const rechercherEtablissementsAutomatique = async (nom: string, villeContext: string = "") => {
    console.log("Début recherche pour:", nom, "ville:", villeContext);
    
    if (!nom || nom.length < 2) {
      setSuggestionsEtablissements([]);
      return;
    }

    if (!villeContext || villeContext.length < 2) {
      setSuggestionsEtablissements([]);
      return;
    }

    try {
      setRechercheEtablissementsEnCours(true);
      
      // Utiliser l'Edge Function pour la recherche
      const response = await fetch('/api/find-establishment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: nom, city: villeContext })
      });

      const data = await response.json();
      
      if (response.ok) {
        const suggestions = data.results.map((item: any) => ({
          id: item.place_id || item.osm_id?.toString() || Math.random().toString(),
          nom: item.name,
          adresse: item.formatted_address,
          type: "establishment",
          lat: item.location?.lat || 0,
          lon: item.location?.lng || item.location?.lon || 0,
          ville: villeContext,
          source: item.source
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

  // Recherche automatique de villes
  const rechercherVillesAutomatique = async (nomVille: string) => {
    console.log("Début recherche villes pour:", nomVille);
    
    if (!nomVille || nomVille.length < 2) {
      setSuggestionsVilles([]);
      return;
    }

    try {
      setRechercheVillesEnCours(true);
      
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&q=${encodeURIComponent(nomVille)}&extratags=1&countrycodes=fr`;
      
      const response = await fetch(url, {
        headers: { 
          Accept: "application/json",
          "User-Agent": "AnalytiqueApp/1.0"
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Réponse villes:", data);
        
        // Filtrer pour les villes, villages, communes
        const villeTypes = new Set([
          "city", "town", "village", "municipality", "administrative"
        ]);
        
        const suggestions = data
          .filter((item: any) => 
            (item.class === "place" && villeTypes.has(item.type)) ||
            (item.class === "boundary" && item.type === "administrative" && 
             (item.address?.city || item.address?.town || item.address?.village))
          )
          .map((item: any) => ({
            id: item.place_id,
            nom: item.name || item.display_name?.split(",")[0] || "Ville",
            adresse: item.display_name,
            type: item.type,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            codePostal: item.address?.postcode || "",
            departement: item.address?.county || item.address?.state || "",
            pays: item.address?.country || "France"
          }))
          .slice(0, 8); // Limiter à 8 suggestions
        
        console.log(`Trouvé ${suggestions.length} villes:`, suggestions);
        setSuggestionsVilles(suggestions);
        
      } else {
        console.error("Erreur response villes:", response.status);
        setSuggestionsVilles([]);
      }
      
    } catch (error) {
      console.error("Erreur recherche villes:", error);
      setSuggestionsVilles([]);
    } finally {
      setRechercheVillesEnCours(false);
    }
  };

  // Sélectionner une ville depuis les suggestions
  const selectionnerVille = (villeSuggere: any) => {
    setVille(villeSuggere.nom);
    setSuggestionsVilles([]);
    
    toast({
      title: "Ville sélectionnée",
      description: `${villeSuggere.nom} a été sélectionnée`,
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
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-y-auto">
                          {suggestionsEtablissements.map((suggestion) => (
                            <div
                              key={suggestion.id}
                              onClick={() => selectionnerEtablissement(suggestion)}
                              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
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

                </div>

                <div className="flex gap-4">
                  <Button 
                    className="w-full"
                    onClick={rechercherEtablissement}
                    disabled={rechercheEnCours}
                  >
                    {rechercheEnCours ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Recherche en cours...
                      </>
                    ) : (
                      "Recherche de l'établissement"
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