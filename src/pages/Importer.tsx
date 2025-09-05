import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Upload, 
  FileText, 
  Search,
  Info,
  Home,
  BarChart3,
  LogOut,
  MapPin,
  Locate
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

const Importer = () => {
  const { toast } = useToast();
  const [modeActuel, setModeActuel] = useState<'recuperation' | 'saisie' | 'import'>('recuperation');
  const [ville, setVille] = useState("");
  const [etablissement, setEtablissement] = useState("");
  const [periode, setPeriode] = useState("1-mois");
  const [etablissements, setEtablissements] = useState<string[]>([]);
  const [villes, setVilles] = useState<string[]>([]);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [rechercheVillesEnCours, setRechercheVillesEnCours] = useState(false);
  const [etablissementSelectionne, setEtablissementSelectionne] = useState("");
  const [villeSelectionnee, setVilleSelectionnee] = useState("");
  const [villeBBox, setVilleBBox] = useState<{s:number;n:number;w:number;e:number;name:string} | null>(null);
  const [bboxEnCours, setBboxEnCours] = useState(false);
  const [positionUtilisateur, setPositionUtilisateur] = useState<{lat: number, lng: number} | null>(null);
  const [geolocalisationEnCours, setGeolocalisationEnCours] = useState(false);
  
  // États pour l'import CSV
  const [fichierCSV, setFichierCSV] = useState<File | null>(null);
  const [donneesCSV, setDonneesCSV] = useState<any[]>([]);
  const [importEnCours, setImportEnCours] = useState(false);

  // Fonctions pour l'import CSV
  const gererSelectionFichier = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = event.target.files?.[0];
    if (fichier) {
      if (fichier.type !== 'text/csv' && !fichier.name.endsWith('.csv')) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un fichier CSV",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      setFichierCSV(fichier);
      lireFichierCSV(fichier);
    }
  };

  const lireFichierCSV = (fichier: File) => {
    setImportEnCours(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const contenu = e.target?.result as string;
        const lignes = contenu.split('\n');
        const headers = lignes[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const donnees = lignes.slice(1)
          .filter(ligne => ligne.trim())
          .map((ligne, index) => {
            const valeurs = ligne.split(',').map(v => v.trim().replace(/"/g, ''));
            const objet: any = {};
            headers.forEach((header, i) => {
              objet[header] = valeurs[i] || '';
            });
            objet.id = index + 1;
            return objet;
          });

        setDonneesCSV(donnees);
        toast({
          title: "Fichier importé",
          description: `${donnees.length} avis importés avec succès`,
          duration: 3000,
        });
      } catch (error) {
        toast({
          title: "Erreur d'import",
          description: "Impossible de lire le fichier CSV",
          variant: "destructive",
          duration: 3000,
        });
      } finally {
        setImportEnCours(false);
      }
    };

    reader.onerror = () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la lecture du fichier",
        variant: "destructive",
        duration: 3000,
      });
      setImportEnCours(false);
    };

    reader.readAsText(fichier);
  };

  const ouvrirSelecteurFichier = () => {
    document.getElementById('fichier-csv-input')?.click();
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
        
        // Recherche automatique des établissements à proximité
        rechercherEtablissementsProches(coords);
        
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

  // Recherche d'établissements à proximité avec coordonnées GPS
  const rechercherEtablissementsProches = async (coords: {lat: number, lng: number}) => {
    try {
      setRechercheEnCours(true);
      const radius = 2000; // 2km de rayon
      const query = `restaurant near ${coords.lat},${coords.lng}`;
      
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=20&q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: any[] = await res.json();

      const restaurantTypes = new Set(["restaurant", "cafe", "bar", "fast_food", "food_court", "pub", "biergarten"]);
      const results = data.filter((item: any) => {
        if (item.class === "amenity" && restaurantTypes.has(item.type)) {
          // Vérifier la distance (approximative)
          const distance = Math.sqrt(
            Math.pow(parseFloat(item.lat) - coords.lat, 2) + 
            Math.pow(parseFloat(item.lon) - coords.lng, 2)
          ) * 111000; // Conversion approximative en mètres
          return distance <= radius;
        }
        return false;
      });

      const noms: string[] = results
        .map((item: any) => {
          const name = item.name || (item.display_name?.split(",")[0] ?? "").trim();
          const city = item.address?.city || item.address?.town || item.address?.village;
          const distance = Math.round(Math.sqrt(
            Math.pow(parseFloat(item.lat) - coords.lat, 2) + 
            Math.pow(parseFloat(item.lon) - coords.lng, 2)
          ) * 111000);
          return name ? `${name}${city ? ` — ${city}` : ""} (${distance}m)` : null;
        })
        .filter(Boolean) as string[];

      setEtablissements(noms);
      if (noms.length > 0) {
        toast({
          title: "Établissements trouvés",
          description: `${noms.length} établissements à proximité`,
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de rechercher les établissements à proximité",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setRechercheEnCours(false);
    }
  };

  // Recherche de villes via Nominatim
  const rechercherVilles = async (nomVille: string) => {
    const query = nomVille.trim();
    if (!query) {
      setVilles([]);
      return;
    }

    try {
      setRechercheVillesEnCours(true);
      
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&q=${encodeURIComponent(query)}&extratags=1&namedetails=1&featuretype=city,town,village,municipality`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: any[] = await res.json();

      // Filtrer pour ne garder que les villes, villages, communes
      const villesTypes = new Set(["city", "town", "village", "municipality", "administrative"]);
      const results = data.filter((item: any) => 
        villesTypes.has(item.type) || 
        (item.class === "place" && ["city", "town", "village", "municipality"].includes(item.type)) ||
        (item.class === "boundary" && item.type === "administrative")
      );

      const nomsVilles: string[] = results
        .map((item: any) => {
          const name = item.name || (item.display_name?.split(",")[0] ?? "").trim();
          const country = item.address?.country || "";
          const state = item.address?.state || "";
          return name ? `${name}${state && country !== "France" ? `, ${state}` : ""}${country && country !== "France" ? `, ${country}` : ""}` : null;
        })
        .filter(Boolean) as string[];

      // Enlever les doublons
      const villesUniques = [...new Set(nomsVilles)];
      setVilles(villesUniques);
      
    } catch (e) {
      console.error("Erreur recherche villes:", e);
      setVilles([]);
    } finally {
      setRechercheVillesEnCours(false);
    }
  };

  // Recherche d'établissements améliorée via Overpass (OSM) et Nominatim
  const rechercherEtablissements = async (requete: string) => {
    const query = requete.trim();
    if (!query) {
      setEtablissements([]);
      return;
    }

    try {
      setRechercheEnCours(true);

      const cityContext = villeSelectionnee || (ville.length >= 2 ? ville : "");
      const allowedTypes = ["restaurant", "cafe", "bar", "fast_food", "food_court", "pub", "biergarten"] as const;

      // Helpers internes améliorés
      const ensureBBox = async (cityName: string) => {
        if (villeBBox && villeBBox.name.toLowerCase() === cityName.toLowerCase()) {
          return villeBBox;
        }
        setBboxEnCours(true);
        try {
          // Recherche plus précise de la ville
          const cityQueries = [
            `${cityName} France`,
            cityName,
            `city ${cityName}`,
            `town ${cityName}`
          ];
          
          for (const cityQuery of cityQueries) {
            const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(cityQuery)}&featuretype=city,town,village`;
            const res = await fetch(url, { headers: { Accept: "application/json" } });
            if (!res.ok) continue;
            
            const data: any[] = await res.json();
            const cityItem = data.find(item => 
              (item.class === "place" && ["city", "town", "village"].includes(item.type)) ||
              (item.class === "boundary" && item.type === "administrative")
            );
            
            if (cityItem?.boundingbox) {
              const [south, north, west, east] = cityItem.boundingbox.map((v: string) => parseFloat(v));
              const bbox = { s: south, n: north, w: west, e: east, name: cityName };
              setVilleBBox(bbox);
              setBboxEnCours(false);
              return bbox;
            }
          }
        } catch (error) {
          console.error("Erreur bbox:", error);
        }
        setBboxEnCours(false);
        return null;
      };

      const fetchOverpass = async (bbox: { s: number; n: number; w: number; e: number }) => {
        const { s, n, w, e } = bbox;
        const overpassQuery = `
          [out:json][timeout:30];
          (
            node["amenity"~"^(restaurant|cafe|bar|fast_food|food_court|pub|biergarten)$"]["name"](${s},${w},${n},${e});
            way["amenity"~"^(restaurant|cafe|bar|fast_food|food_court|pub|biergarten)$"]["name"](${s},${w},${n},${e});
            relation["amenity"~"^(restaurant|cafe|bar|fast_food|food_court|pub|biergarten)$"]["name"](${s},${w},${n},${e});
          );
          out center 200;`;
        
        const endpoints = [
          "https://overpass-api.de/api/interpreter",
          "https://overpass.kumi.systems/api/interpreter",
          "https://overpass.openstreetmap.ru/api/interpreter"
        ];
        
        for (const ep of endpoints) {
          try {
            const r = await fetch(ep, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: `data=${encodeURIComponent(overpassQuery)}`,
            });
            if (r.ok) {
              const json = await r.json();
              return json.elements || [];
            }
          } catch (err) {
            console.log(`Endpoint ${ep} failed, trying next...`);
          }
        }
        return [];
      };

      // Recherche prioritaire avec bbox si ville renseignée
      if (cityContext) {
        const bbox = await ensureBBox(cityContext);
        if (bbox) {
          const elements = await fetchOverpass(bbox);
          const filterText = etablissement.trim().toLowerCase();
          
          const list = elements
            .filter((el: any) => el.tags?.name)
            .map((el: any) => {
              const name = el.tags.name as string;
              const amenity = el.tags.amenity as string;
              const city = (el.tags?.["addr:city"] as string) || 
                          (el.tags?.["addr:town"] as string) || 
                          cityContext;
              const typeLabel = amenity === "restaurant" ? "" : ` (${amenity})`;
              return { name: name.trim(), city: city.trim(), type: typeLabel };
            })
            .filter((it: any) => 
              !filterText || 
              it.name.toLowerCase().includes(filterText) ||
              it.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(filterText.replace(/[^a-z0-9]/g, ''))
            )
            .sort((a: any, b: any) => {
              // Priorité aux correspondances exactes
              const aExact = a.name.toLowerCase().startsWith(filterText);
              const bExact = b.name.toLowerCase().startsWith(filterText);
              if (aExact && !bExact) return -1;
              if (!aExact && bExact) return 1;
              return a.name.localeCompare(b.name);
            });

          const noms: string[] = Array.from(
            new Set<string>(list.map((it: { name: string; city: string; type: string }) => 
              `${it.name}${it.type} — ${it.city}`
            ))
          ).slice(0, 50); // Limiter à 50 résultats
          
          if (noms.length > 0) {
            setEtablissements(noms);
            return;
          }
        }
      }

      // Fallback amélioré: Nominatim avec requêtes optimisées
      const strategies = [
        // Requêtes spécifiques avec ville
        ...(cityContext ? [
          `"${etablissement}" ${cityContext} restaurant`,
          `${etablissement} restaurant ${cityContext}`,
          `${etablissement} ${cityContext}`
        ] : []),
        // Requêtes générales
        `"${etablissement}" restaurant`,
        `${etablissement} restaurant`,
        etablissement
      ];

      let allResults: any[] = [];
      for (const searchQuery of strategies) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=20&q=${encodeURIComponent(searchQuery)}&extratags=1`;
        try {
          const res = await fetch(url, { headers: { Accept: "application/json" } });
          if (!res.ok) continue;
          const data: any[] = await res.json();
          allResults = [...allResults, ...data];
          
          // Arrêter si on a trouvé des restaurants pertinents
          const relevantFound = data.some(
            (item) => item.class === "amenity" && allowedTypes.includes(item.type) && item.name
          );
          if (relevantFound && allResults.length >= 10) break;
        } catch (error) {
          console.log(`Nominatim query failed: ${searchQuery}`);
        }
      }

      // Traitement des résultats Nominatim
      const uniqueResults = allResults.filter(
        (item, index, self) => index === self.findIndex((t) => t.place_id === item.place_id)
      );

      let results = uniqueResults.filter(
        (item: any) => item.class === "amenity" && allowedTypes.includes(item.type) && item.name
      );
      
      if (results.length === 0) {
        results = uniqueResults.filter((item: any) => item.name).slice(0, 15);
      }

      const nomsFallback: string[] = results
        .map((item: any) => {
          const name = item.name?.trim() || (item.display_name?.split(",")[0] ?? "").trim();
          const city = item.address?.city || item.address?.town || item.address?.village || item.address?.municipality;
          const type = item.type === "restaurant" ? "" : ` (${item.type})`;
          return name && city ? `${name}${type} — ${city}` : (name ? `${name}${type}` : null);
        })
        .filter(Boolean) as string[];

      setEtablissements(nomsFallback);
    } catch (e) {
      console.error("Erreur recherche établissements:", e);
      setEtablissements([]);
    } finally {
      setRechercheEnCours(false);
    }
  };

  // Recherche automatique de villes quand l'utilisateur tape
  useEffect(() => {
    if (ville.length >= 2 && !villeSelectionnee) {
      const timeoutId = setTimeout(() => {
        rechercherVilles(ville);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (ville.length < 2) {
      setVilles([]);
    }
  }, [ville, villeSelectionnee]);

  // Recherche automatique d'établissements en fonction de ce qui est tapé (ville + établissement)
  useEffect(() => {
    if (etablissement.length >= 2) {
      const cityContext = villeSelectionnee || (ville.length >= 2 ? ville : "");
      const q = cityContext ? `${etablissement} ${cityContext}` : etablissement;
      const timeoutId = setTimeout(() => {
        rechercherEtablissements(q);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setEtablissements([]);
      setEtablissementSelectionne("");
    }
  }, [etablissement, ville, villeSelectionnee]);

  const selectionnerVille = (nomVille: string) => {
    setVille(nomVille);
    setVilleSelectionnee(nomVille);
    setVilleBBox(null);
    setVilles([]);
    toast({
      title: "Ville sélectionnée",
      description: nomVille,
      duration: 2000,
    });
  };

  const selectionnerEtablissement = (etablissementNom: string) => {
    setEtablissement(etablissementNom);
    setEtablissementSelectionne(etablissementNom);
    setEtablissements([]);
    toast({
      title: "Établissement sélectionné",
      description: etablissementNom,
      duration: 2000,
    });
  };

  const lancerRecuperation = () => {
    if (!ville || !etablissement) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une ville et un établissement",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    toast({
      title: "Récupération en cours",
      description: `Recherche des avis pour ${etablissement} sur les derniers ${periode}...`,
      duration: 4000,
    });
  };

  // Empêcher le scroll avec la barre d'espace globalement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target as HTMLElement)?.matches('input, textarea, [contenteditable]')) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keypress', handleKeyPress);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">analytique</span>
            </div>
            
            <div className="flex items-center gap-6">
              <Link to="/tableau-de-bord" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
                <Home className="w-4 h-4" />
                Accueil
              </Link>
              <Button variant="ghost" className="text-blue-600 font-medium flex items-center gap-1">
                <Upload className="w-4 h-4" />
                Importer
              </Button>
              <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Link>
              <div className="flex items-center gap-2 text-gray-700">
                <span>Bonjour, Yohan Lopes</span>
              </div>
              <Button variant="ghost" className="text-gray-600 flex items-center gap-1">
                <LogOut className="w-4 h-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Header buttons */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex-1">
              <Button 
                variant="ghost" 
                className={`w-full flex items-center gap-2 ${modeActuel === 'saisie' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                onClick={() => setModeActuel('saisie')}
              >
                <FileText className="w-4 h-4" />
                Saisie manuelle
              </Button>
            </div>
            <div className="flex-1">
              <Button 
                variant="ghost" 
                className={`w-full flex items-center gap-2 ${modeActuel === 'import' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                onClick={() => setModeActuel('import')}
              >
                <Upload className="w-4 h-4" />
                Import CSV
              </Button>
            </div>
            <div className="flex-1">
              <Button 
                variant="ghost" 
                className={`w-full flex items-center gap-2 ${modeActuel === 'recuperation' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                onClick={() => setModeActuel('recuperation')}
              >
                <Search className="w-4 h-4" />
                Récupération automatique
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header dynamique */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                {modeActuel === 'saisie' && <FileText className="w-6 h-6 text-blue-600" />}
                {modeActuel === 'import' && <Upload className="w-6 h-6 text-blue-600" />}
                {modeActuel === 'recuperation' && <Search className="w-6 h-6 text-blue-600" />}
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {modeActuel === 'saisie' && 'Saisie manuelle d\'avis'}
                {modeActuel === 'import' && 'Import CSV d\'avis'}
                {modeActuel === 'recuperation' && 'Récupération automatique d\'avis'}
              </h1>
            </div>
            <p className="text-lg text-gray-600">
              {modeActuel === 'saisie' && 'Saisissez vos avis manuellement dans le système'}
              {modeActuel === 'import' && 'Importez vos avis depuis un fichier CSV'}
              {modeActuel === 'recuperation' && 'Récupérez automatiquement les avis Google, Tripadvisor et Yelp de votre établissement'}
            </p>
          </div>

          {/* Contenu conditionnel */}
          {modeActuel === 'recuperation' && (
            <>
              {/* Form avec bouton géolocalisation */}
              <Card className="mb-8">
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Ville <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          placeholder="Tapez le nom de votre ville..."
                          value={ville}
                          onChange={(e) => {
                            setVille(e.target.value);
                            setVilleSelectionnee("");
                          }}
                          className="w-full"
                        />
                        {rechercheVillesEnCours && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                          </div>
                        )}
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>

                      {/* Suggestions de villes */}
                      {villes.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-md shadow-sm max-h-40 overflow-y-auto z-10">
                          {villes.map((nomVille, index) => (
                            <button
                              key={index}
                              onClick={() => selectionnerVille(nomVille)}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-sm"
                            >
                              {nomVille}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Nom de l'établissement <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          placeholder="Tapez le nom de votre établissement..."
                          value={etablissement}
                          onChange={(e) => setEtablissement(e.target.value)}
                          className="w-full"
                        />
                        {rechercheEnCours && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                          </div>
                        )}
                      </div>

                      {/* Suggestions d'établissements */}
                      {etablissements.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-md shadow-sm max-h-40 overflow-y-auto z-10">
                          {etablissements.map((etablissementNom, index) => (
                            <button
                              key={index}
                              onClick={() => selectionnerEtablissement(etablissementNom)}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-sm"
                            >
                              {etablissementNom}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Période
                      </label>
                      <Select value={periode} onValueChange={setPeriode}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-semaine">1 semaine</SelectItem>
                          <SelectItem value="1-mois">1 mois</SelectItem>
                          <SelectItem value="3-mois">3 mois</SelectItem>
                          <SelectItem value="6-mois">6 mois</SelectItem>
                          <SelectItem value="1-an">1 an</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Section géolocalisation */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-sm">ou</span>
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <Button
                      onClick={obtenirGeolocalisation}
                      disabled={geolocalisationEnCours}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {geolocalisationEnCours ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      ) : (
                        <Locate className="w-4 h-4" />
                      )}
                      {geolocalisationEnCours 
                        ? "Recherche de votre position..." 
                        : "Utiliser ma position actuelle"
                      }
                    </Button>
                    {positionUtilisateur && (
                      <p className="text-sm text-green-600 mt-2">
                        Position trouvée: {positionUtilisateur.lat.toFixed(4)}, {positionUtilisateur.lng.toFixed(4)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={lancerRecuperation} className="flex-1">
                      Lancer la récupération
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Info card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <h3 className="font-semibold text-gray-900">Comment ça fonctionne ?</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Recherche automatique sur Google My Business, TripAdvisor et Yelp</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Extraction des avis selon la période sélectionnée</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Analyse automatique du sentiment et des mots-clés</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Sélectionnez une ville pour une recherche plus précise</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </>
          )}

          {modeActuel === 'saisie' && (
            <Card>
              <CardContent className="p-8">
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Saisie manuelle d'avis</h3>
                  <p className="text-gray-600 mb-6">
                    Ajoutez manuellement les avis de vos clients dans le système
                  </p>
                  <Button>
                    Commencer la saisie
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {modeActuel === 'import' && (
            <Card>
              <CardContent className="p-8">
                {/* Input file caché */}
                <input
                  id="fichier-csv-input"
                  type="file"
                  accept=".csv"
                  onChange={gererSelectionFichier}
                  className="hidden"
                />
                
                {!fichierCSV ? (
                  <div className="text-center py-12">
                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Import CSV</h3>
                    <p className="text-gray-600 mb-6">
                      Importez vos avis depuis un fichier CSV au format standard
                    </p>
                    <div className="space-y-4">
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors cursor-pointer"
                        onClick={ouvrirSelecteurFichier}
                      >
                        <p className="text-gray-500 mb-4">Glissez-déposez votre fichier CSV ici ou</p>
                        <Button variant="outline" disabled={importEnCours}>
                          {importEnCours ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
                              Importation...
                            </>
                          ) : (
                            'Choisir un fichier'
                          )}
                        </Button>
                      </div>
                      <div className="text-left bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Format CSV requis :</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Nom du client</li>
                          <li>• Note (sur 5)</li>
                          <li>• Commentaire</li>
                          <li>• Date</li>
                          <li>• Source (Google, TripAdvisor, etc.)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Fichier importé</h3>
                      <p className="text-gray-600">
                        <strong>{fichierCSV.name}</strong> - {donneesCSV.length} avis trouvés
                      </p>
                    </div>

                    {donneesCSV.length > 0 && (
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-3">Aperçu des données :</h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-white rounded border">
                              <thead className="bg-gray-100">
                                <tr>
                                  {Object.keys(donneesCSV[0] || {}).slice(0, 5).map((header) => (
                                    <th key={header} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {donneesCSV.slice(0, 3).map((ligne, index) => (
                                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    {Object.values(ligne).slice(0, 5).map((valeur: any, i) => (
                                      <td key={i} className="px-4 py-2 text-sm text-gray-600 border-b max-w-32 truncate">
                                        {String(valeur)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {donneesCSV.length > 3 && (
                            <p className="text-sm text-gray-500 mt-2">
                              ... et {donneesCSV.length - 3} autres avis
                            </p>
                          )}
                        </div>

                        <div className="flex gap-4">
                          <Button className="flex-1">
                            Valider l'import ({donneesCSV.length} avis)
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setFichierCSV(null);
                              setDonneesCSV([]);
                            }}
                          >
                            Changer de fichier
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Importer;
