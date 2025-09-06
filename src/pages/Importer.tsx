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
  Locate,
  Building
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
  
  // États pour la saisie manuelle
  const [avisManuel, setAvisManuel] = useState({
    nomClient: '',
    note: '',
    commentaire: '',
    date: new Date().toISOString().split('T')[0],
    source: 'Saisie manuelle'
  });
  const [avisListe, setAvisListe] = useState<any[]>([]);
  const [saisieEnCours, setSaisieEnCours] = useState(false);

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

  // Fonctions pour la saisie manuelle
  const gererChangementAvis = (champ: string, valeur: string) => {
    setAvisManuel(prev => ({
      ...prev,
      [champ]: valeur
    }));
  };

  const ajouterAvis = () => {
    if (!avisManuel.nomClient || !avisManuel.note || !avisManuel.commentaire) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (parseFloat(avisManuel.note) < 1 || parseFloat(avisManuel.note) > 5) {
      toast({
        title: "Erreur",
        description: "La note doit être comprise entre 1 et 5",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setSaisieEnCours(true);
    
    // Simuler un délai de traitement
    setTimeout(() => {
      const nouvelAvis = {
        ...avisManuel,
        id: Date.now(),
        note: parseFloat(avisManuel.note)
      };
      
      setAvisListe(prev => [...prev, nouvelAvis]);
      
      // Réinitialiser le formulaire
      setAvisManuel({
        nomClient: '',
        note: '',
        commentaire: '',
        date: new Date().toISOString().split('T')[0],
        source: 'Saisie manuelle'
      });
      
      setSaisieEnCours(false);
      
      toast({
        title: "Avis ajouté",
        description: "L'avis a été ajouté avec succès",
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

  // 🔥 RECHERCHE ULTRA-MEGA-PUISSANTE d'établissements
  const rechercherEtablissements = async (requete: string) => {
    const query = requete.trim();
    if (!query) {
      setEtablissements([]);
      return;
    }

    try {
      setRechercheEnCours(true);
      const cityContext = villeSelectionnee || (ville.length >= 2 ? ville : "");
      let allResults: string[] = [];

      console.log(`🔥 RECHERCHE MEGA-PUISSANTE pour: "${query}" à ${cityContext}`);

      // 🚀 STRATÉGIE 1: Overpass API MEGA-ÉLARGIE (zone x3)
      const overpassResults = await searchOverpassMega(query, cityContext);
      allResults = [...allResults, ...overpassResults];
      console.log(`✅ Overpass: ${overpassResults.length} résultats`);

      // 🚀 STRATÉGIE 2: Nominatim ULTRA-VARIANTES (30+ requêtes)
      const nominatimResults = await searchNominatimMega(query, cityContext);
      allResults = [...allResults, ...nominatimResults];
      console.log(`✅ Nominatim: ${nominatimResults.length} résultats`);

      // 🚀 STRATÉGIE 3: Recherche FUZZY et PARTIELLE
      const fuzzyResults = await searchFuzzyMega(query, cityContext);
      allResults = [...allResults, ...fuzzyResults];
      console.log(`✅ Fuzzy: ${fuzzyResults.length} résultats`);

      // 🚀 STRATÉGIE 4: Recherche par MOTS-CLÉS séparés
      const keywordResults = await searchByKeywords(query, cityContext);
      allResults = [...allResults, ...keywordResults];
      console.log(`✅ Keywords: ${keywordResults.length} résultats`);

      // 🚀 STRATÉGIE 5: Recherche GÉOGRAPHIQUE élargie
      const geoResults = await searchGeoExpanded(query, cityContext);
      allResults = [...allResults, ...geoResults];
      console.log(`✅ Geo: ${geoResults.length} résultats`);

      // 🚀 STRATÉGIE 6: Recherche PHONÉTIQUE avancée
      const phoneticResults = await searchPhoneticAdvanced(query, cityContext);
      allResults = [...allResults, ...phoneticResults];
      console.log(`✅ Phonetic: ${phoneticResults.length} résultats`);

      // 🔥 DÉDUPLICATION ET TRI INTELLIGENT
      const uniqueResults = [...new Set(allResults)]
        .filter(result => result && result.trim())
        .map(result => ({
          text: result,
          score: calculateMegaScore(result, query, cityContext)
        }))
        .sort((a, b) => b.score - a.score)
        .map(item => item.text)
        .slice(0, 150); // 150 résultats max !

      console.log(`🔥 TOTAL: ${uniqueResults.length} établissements trouvés`);
      setEtablissements(uniqueResults);

      // 🚀 STRATÉGIE 7: Recherche GLOBALE de secours si < 5 résultats
      if (uniqueResults.length < 5) {
        console.log(`🆘 RECHERCHE DE SECOURS...`);
        const emergencyResults = await searchEmergencyMode(query, cityContext);
        const combinedResults = [...new Set([...uniqueResults, ...emergencyResults])];
        setEtablissements(combinedResults.slice(0, 200));
        console.log(`🆘 SECOURS: ${emergencyResults.length} résultats supplémentaires`);
      }

    } catch (error) {
      console.error("🔥 Erreur recherche MEGA:", error);
      setEtablissements([]);
    } finally {
      setRechercheEnCours(false);
    }
  };

  // 🚀 OVERPASS MEGA-ÉLARGI (zone x3, plus de endpoints)
  const searchOverpassMega = async (query: string, city: string) => {
    try {
      const bbox = await getBBoxMega(city);
      if (!bbox) return [];

      // Zone MEGA-élargie (x3)
      const expansion = {
        lat: (bbox.n - bbox.s) * 2.0, // x3 au total
        lon: (bbox.e - bbox.w) * 2.0
      };

      const megaBbox = {
        s: bbox.s - expansion.lat,
        n: bbox.n + expansion.lat,
        w: bbox.w - expansion.lon,
        e: bbox.e + expansion.lon
      };

      const overpassQuery = `
        [out:json][timeout:90];
        (
          node["amenity"~"^(restaurant|cafe|bar|fast_food|food_court|pub|biergarten|ice_cream|nightclub)$"]["name"](${megaBbox.s},${megaBbox.w},${megaBbox.n},${megaBbox.e});
          way["amenity"~"^(restaurant|cafe|bar|fast_food|food_court|pub|biergarten|ice_cream|nightclub)$"]["name"](${megaBbox.s},${megaBbox.w},${megaBbox.n},${megaBbox.e});
          relation["amenity"~"^(restaurant|cafe|bar|fast_food|food_court|pub|biergarten|ice_cream|nightclub)$"]["name"](${megaBbox.s},${megaBbox.w},${megaBbox.n},${megaBbox.e});
          node["shop"~"^(bakery|pastry|confectionery|chocolate|coffee|deli|butcher)$"]["name"](${megaBbox.s},${megaBbox.w},${megaBbox.n},${megaBbox.e});
          way["shop"~"^(bakery|pastry|confectionery|chocolate|coffee|deli|butcher)$"]["name"](${megaBbox.s},${megaBbox.w},${megaBbox.n},${megaBbox.e});
          node["cuisine"]["name"](${megaBbox.s},${megaBbox.w},${megaBbox.n},${megaBbox.e});
          way["cuisine"]["name"](${megaBbox.s},${megaBbox.w},${megaBbox.n},${megaBbox.e});
          node["leisure"~"^(sports_club|social_club)$"]["name"](${megaBbox.s},${megaBbox.w},${megaBbox.n},${megaBbox.e});
          way["leisure"~"^(sports_club|social_club)$"]["name"](${megaBbox.s},${megaBbox.w},${megaBbox.n},${megaBbox.e});
        );
        out center 800;`;

      const endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter", 
        "https://overpass.openstreetmap.ru/api/interpreter",
        "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
        "https://overpass.openstreetmap.fr/api/interpreter"
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `data=${encodeURIComponent(overpassQuery)}`
          });

          if (response.ok) {
            const data = await response.json();
            return data.elements?.map((el: any) => {
              const name = el.tags?.name || "";
              const amenity = el.tags?.amenity || el.tags?.shop || el.tags?.leisure || "restaurant";
              const typeLabel = amenity === "restaurant" ? "" : ` (${amenity})`;
              return `${name}${typeLabel} — ${city}`;
            }).filter((name: string) => name.trim() && !name.startsWith(" —")) || [];
          }
        } catch (err) {
          console.log(`❌ Overpass ${endpoint} failed`);
        }
      }
    } catch (error) {
      console.log("❌ Overpass MEGA failed:", error);
    }
    return [];
  };

  // 🚀 NOMINATIM MEGA-VARIANTES (50+ requêtes différentes)
  const searchNominatimMega = async (query: string, city: string) => {
    const baseVariants = [
      // Recherches exactes avec ville
      ...(city ? [
        `"${query}" ${city} restaurant`,
        `"${query}" ${city} café`, 
        `"${query}" ${city} bar`,
        `"${query}" ${city} brasserie`,
        `"${query}" ${city}`,
        `${query} restaurant ${city}`,
        `${query} café ${city}`,
        `${query} bar ${city}`,
        `${query} ${city}`,
        `restaurant "${query}" ${city}`,
        `café "${query}" ${city}`,
        `bar "${query}" ${city}`,
        `${query} près de ${city}`,
        `${query} near ${city}`,
        `${query} in ${city}`,
        `${query} à ${city}`,
        `établissement ${query} ${city}`,
        `${city} ${query}`,
        `${city} restaurant ${query}`,
        `${city} café ${query}`
      ] : []),
      // Recherches générales étendues
      `"${query}" restaurant France`,
      `"${query}" café France`,
      `"${query}" bar France`,
      `"${query}" brasserie France`,
      `${query} restaurant France`,
      `${query} café France`,
      `${query} bar France`,
      `${query} brasserie France`,
      `restaurant ${query}`,
      `café ${query}`,
      `bar ${query}`,
      `brasserie ${query}`,
      query,
      // Variantes orthographiques
      query.replace(/é/g, 'e'),
      query.replace(/è/g, 'e'),
      query.replace(/ê/g, 'e'),
      query.replace(/ç/g, 'c'),
      query.replace(/à/g, 'a'),
      query.replace(/ù/g, 'u'),
      query.replace(/'/g, ''),
      query.replace(/'/g, ''),
      query.replace(/-/g, ' '),
      query.replace(/-/g, ''),
      query.replace(/&/g, 'et'),
      query.replace(/\./g, ''),
      // Variantes avec espaces
      query.replace(/\s+/g, ''),
      query.replace(/\s+/g, '-'),
      // Mots séparés (si plusieurs mots)
      ...query.split(' ').filter(word => word.length >= 2).map(word => 
        city ? `${word} ${city}` : word
      )
    ];

    let allResults: string[] = [];
    
    // Traiter par lots pour éviter le rate limiting
    const batchSize = 8;
    for (let i = 0; i < Math.min(baseVariants.length, 40); i += batchSize) {
      const batch = baseVariants.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (searchTerm) => {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=25&q=${encodeURIComponent(searchTerm)}&extratags=1&namedetails=1`;
          const response = await fetch(url, { 
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(5000) // 5s timeout
          });
          
          if (response.ok) {
            const data = await response.json();
            return data
              .filter((item: any) => item.name && (
                (item.class === "amenity" && ["restaurant", "cafe", "bar", "fast_food", "pub", "biergarten", "nightclub"].includes(item.type)) ||
                (item.class === "shop" && ["bakery", "pastry", "confectionery", "coffee", "deli"].includes(item.type)) ||
                item.tags?.cuisine ||
                item.display_name?.toLowerCase().includes('restaurant') ||
                item.display_name?.toLowerCase().includes('café') ||
                item.display_name?.toLowerCase().includes('bar')
              ))
              .map((item: any) => {
                const name = item.name.trim();
                const cityName = item.address?.city || item.address?.town || item.address?.village || city || "France";
                const typeLabel = item.type === "restaurant" ? "" : ` (${item.type})`;
                return `${name}${typeLabel} — ${cityName}`;
              });
          }
        } catch (error) {
          console.log(`❌ Nominatim failed: ${searchTerm}`);
          return [];
        }
        return [];
      });

      const batchResults = await Promise.all(batchPromises);
      allResults = [...allResults, ...batchResults.flat()];
      
      // Délai entre les lots
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return allResults;
  };

  // 🚀 RECHERCHE FUZZY et PARTIELLE
  const searchFuzzyMega = async (query: string, city: string) => {
    const fuzzyVariants = [];
    
    // Recherches avec caractères manquants/supplémentaires
    for (let i = 0; i < query.length; i++) {
      if (query.length > 3) {
        // Suppression d'un caractère
        const missing = query.slice(0, i) + query.slice(i + 1);
        if (missing.length >= 3) fuzzyVariants.push(missing);
      }
      
      // Inversion de caractères adjacents
      if (i < query.length - 1) {
        const swapped = query.slice(0, i) + query[i + 1] + query[i] + query.slice(i + 2);
        fuzzyVariants.push(swapped);
      }
    }

    // Préfixes et suffixes
    if (query.length >= 4) {
      fuzzyVariants.push(query.slice(0, -1)); // Sans dernier caractère
      fuzzyVariants.push(query.slice(1));     // Sans premier caractère
      fuzzyVariants.push(query.slice(0, -2)); // Sans 2 derniers
      fuzzyVariants.push(query.slice(2));     // Sans 2 premiers
    }

    let results: string[] = [];
    for (const variant of [...new Set(fuzzyVariants)].slice(0, 15)) {
      try {
        const searchQuery = city ? `${variant} ${city}` : variant;
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=15&q=${encodeURIComponent(searchQuery)}`;
        const response = await fetch(url, { 
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          const data = await response.json();
          const variantResults = data
            .filter((item: any) => item.name)
            .map((item: any) => {
              const name = item.name.trim();
              const cityName = item.address?.city || item.address?.town || city || "France";
              return `${name} — ${cityName}`;
            });
          
          results = [...results, ...variantResults];
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`❌ Fuzzy search failed: ${variant}`);
      }
    }

    return results;
  };

  // 🚀 RECHERCHE par MOTS-CLÉS séparés
  const searchByKeywords = async (query: string, city: string) => {
    const words = query.split(' ').filter(w => w.length >= 2);
    if (words.length <= 1) return [];

    let results: string[] = [];
    
    // Recherche avec chaque mot individuellement
    for (const word of words) {
      try {
        const searchQuery = city ? `${word} restaurant ${city}` : `${word} restaurant`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=20&q=${encodeURIComponent(searchQuery)}`;
        const response = await fetch(url, { 
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          const data = await response.json();
          const wordResults = data
            .filter((item: any) => item.name)
            .map((item: any) => {
              const name = item.name.trim();
              const cityName = item.address?.city || item.address?.town || city || "France";
              return `${name} — ${cityName}`;
            });
          
          results = [...results, ...wordResults];
        }
        
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error) {
        console.log(`❌ Keyword search failed: ${word}`);
      }
    }

    return results;
  };

  // 🚀 RECHERCHE GÉOGRAPHIQUE élargie (villes voisines)
  const searchGeoExpanded = async (query: string, city: string) => {
    if (!city) return [];

    // Rechercher dans les villes voisines
    const nearbyQueries = [
      `${query} près de ${city}`,
      `${query} ${city} région`,
      `${query} ${city} métropole`,
      `${query} autour de ${city}`,
      `${query} ${city} agglomération`
    ];

    let results: string[] = [];
    for (const searchQuery of nearbyQueries) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=20&q=${encodeURIComponent(searchQuery)}`;
        const response = await fetch(url, { 
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          const data = await response.json();
          const geoResults = data
            .filter((item: any) => item.name)
            .map((item: any) => {
              const name = item.name.trim();
              const cityName = item.address?.city || item.address?.town || city;
              return `${name} — ${cityName}`;
            });
          
          results = [...results, ...geoResults];
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.log(`❌ Geo search failed: ${searchQuery}`);
      }
    }

    return results;
  };

  // 🚀 RECHERCHE PHONÉTIQUE avancée
  const searchPhoneticAdvanced = async (query: string, city: string) => {
    const phoneticVariants = [
      // Phonétique française
      query.replace(/ph/g, 'f'),
      query.replace(/qu/g, 'k'), 
      query.replace(/ch/g, 'sh'),
      query.replace(/th/g, 't'),
      query.replace(/tion/g, 'sion'),
      query.replace(/eau/g, 'o'),
      query.replace(/au/g, 'o'),
      query.replace(/ai/g, 'è'),
      query.replace(/ei/g, 'è'),
      query.replace(/ou/g, 'u'),
      query.replace(/an/g, 'en'),
      query.replace(/in/g, 'ain'),
      // Variantes communes
      query.replace(/mc/gi, 'mac'),
      query.replace(/mac/gi, 'mc'),
      query.replace(/saint/gi, 'st'),
      query.replace(/st/gi, 'saint'),
      query.replace(/&/g, 'et'),
      query.replace(/et/g, '&'),
      query.replace(/chez/gi, 'che'),
      query.replace(/che/gi, 'chez'),
      // Doublements de consonnes
      query.replace(/([bcdfghjklmnpqrstvwxz])/g, '$1$1'),
      query.replace(/([bcdfghjklmnpqrstvwxz])\1/g, '$1')
    ];

    let results: string[] = [];
    for (const variant of [...new Set(phoneticVariants)].slice(0, 12)) {
      if (variant !== query && variant.length >= 3) {
        try {
          const searchQuery = city ? `${variant} ${city}` : variant;
          const url = `https://nominatim.openstreetmap.org/search?format=json&limit=12&q=${encodeURIComponent(searchQuery)}`;
          const response = await fetch(url, { 
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(3000)
          });
          
          if (response.ok) {
            const data = await response.json();
            const phoneticResults = data
              .filter((item: any) => item.name)
              .map((item: any) => {
                const name = item.name.trim();
                const cityName = item.address?.city || item.address?.town || city || "France";
                return `${name} — ${cityName}`;
              });
            
            results = [...results, ...phoneticResults];
          }
          
          await new Promise(resolve => setTimeout(resolve, 120));
        } catch (error) {
          console.log(`❌ Phonetic search failed: ${variant}`);
        }
      }
    }

    return results;
  };

  // 🆘 MODE RECHERCHE D'URGENCE
  const searchEmergencyMode = async (query: string, city: string) => {
    console.log(`🆘 MODE URGENCE activé pour: ${query}`);
    
    const emergencyQueries = [
      query,
      query.substring(0, Math.max(3, query.length - 1)),
      query.substring(1),
      query.replace(/[^a-zA-Z0-9\s]/g, ''),
      ...query.split('').slice(0, 3).map(char => `${char}*`),
      city ? `restaurant ${city}` : 'restaurant',
      city ? `café ${city}` : 'café',
      city ? `bar ${city}` : 'bar'
    ];

    let results: string[] = [];
    for (const emergencyQuery of emergencyQueries) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=30&q=${encodeURIComponent(emergencyQuery)}`;
        const response = await fetch(url, { 
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(2000)
        });
        
        if (response.ok) {
          const data = await response.json();
          const emergencyResults = data
            .filter((item: any) => item.name)
            .map((item: any) => {
              const name = item.name.trim();
              const cityName = item.address?.city || item.address?.town || city || "France";
              return `${name} — ${cityName}`;
            });
          
          results = [...results, ...emergencyResults];
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`❌ Emergency search failed: ${emergencyQuery}`);
      }
    }

    return [...new Set(results)].slice(0, 50);
  };

  // 🎯 Score MEGA-INTELLIGENT
  const calculateMegaScore = (result: string, query: string, city: string) => {
    const name = result.split(' — ')[0].toLowerCase();
    const queryLower = query.toLowerCase();
    let score = 0;

    // Correspondances exactes
    if (name === queryLower) score += 1000;
    else if (name.startsWith(queryLower)) score += 800;
    else if (name.includes(queryLower)) score += 600;
    else if (name.replace(/[^a-z0-9]/g, '').includes(queryLower.replace(/[^a-z0-9]/g, ''))) score += 400;

    // Correspondances de mots
    const queryWords = queryLower.split(' ');
    const nameWords = name.split(' ');
    const wordMatches = queryWords.filter(qw => nameWords.some(nw => nw.includes(qw) || qw.includes(nw)));
    score += wordMatches.length * 200;

    // Bonus ville
    if (city && result.toLowerCase().includes(city.toLowerCase())) score += 300;

    // Bonus type d'établissement
    if (name.includes('restaurant') || name.includes('café') || name.includes('bar')) score += 100;

    // Pénalité pour résultats trop génériques
    if (name.length < 3) score -= 200;

    return score;
  };

  // 🗺️ BBOX MEGA pour ville
  const getBBoxMega = async (cityName: string) => {
    if (villeBBox && villeBBox.name.toLowerCase() === cityName.toLowerCase()) {
      return villeBBox;
    }

    try {
      const queries = [
        `${cityName} France`,
        cityName,
        `city ${cityName}`,
        `town ${cityName}`,
        `commune ${cityName}`,
        `${cityName} municipality`
      ];
      
      for (const cityQuery of queries) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=8&q=${encodeURIComponent(cityQuery)}&featuretype=city,town,village,municipality`;
        const response = await fetch(url, { 
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const data = await response.json();
          const cityItem = data.find((item: any) => 
            item.class === "place" || (item.class === "boundary" && item.type === "administrative")
          );
          
          if (cityItem?.boundingbox) {
            const [s, n, w, e] = cityItem.boundingbox.map((v: string) => parseFloat(v));
            const bbox = { s, n, w, e, name: cityName };
            setVilleBBox(bbox);
            return bbox;
          }
        }
      }
    } catch (error) {
      console.error("❌ BBOX MEGA failed:", error);
    }
    
    return null;
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
                <img 
                  src="/lovable-uploads/08f62503-65d7-4681-8ddf-00f4efb00ffa.png" 
                  alt="Analytique logo" 
                  className="w-8 h-8"
                />
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
              <Link to="/etablissement" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
                <Building className="w-4 h-4" />
                Établissement
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
                          className="w-full pl-10"
                        />
                        {rechercheEnCours && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                          </div>
                        )}
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>

                      {/* Suggestions d'établissements */}
                      {etablissements.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-20 relative">
                          <div className="px-3 py-2 bg-blue-50 border-b border-blue-200 text-xs text-blue-700 font-medium">
                            {etablissements.length} établissement{etablissements.length > 1 ? 's' : ''} trouvé{etablissements.length > 1 ? 's' : ''} à {villeSelectionnee || ville}
                          </div>
                          {etablissements.map((etablissementNom, index) => (
                            <button
                              key={index}
                              onClick={() => selectionnerEtablissement(etablissementNom)}
                              className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-sm flex items-center justify-between group"
                            >
                              <span>{etablissementNom}</span>
                              <Search className="w-3 h-3 text-gray-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Message de recherche en cours */}
                      {rechercheEnCours && etablissement.length >= 2 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                            Recherche en ligne d'établissements pour "{etablissement}"...
                          </div>
                        </div>
                      )}
                      
                      {/* Message aucun résultat */}
                      {!rechercheEnCours && etablissement.length >= 2 && etablissements.length === 0 && (villeSelectionnee || ville) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-700">
                          <div className="flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Aucun établissement trouvé pour "{etablissement}" à {villeSelectionnee || ville}. Essayez un nom plus court ou vérifiez l'orthographe.
                          </div>
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


                  <div className="flex gap-4">
                    <Button 
                      onClick={lancerRecuperation} 
                      className="flex-1"
                      disabled={!ville.trim() || !etablissement.trim()}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Rechercher et récupérer les avis
                    </Button>
                  </div>
                  
                  {/* Message d'aide amélioré */}
                  {(!ville.trim() || !etablissement.trim()) && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-400 rounded-r-lg">
                      <div className="flex">
                        <Info className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-800 font-medium mb-2">
                            🌐 Recherche automatique d'établissements en ligne
                          </p>
                          <ol className="text-sm text-blue-700 ml-4 list-decimal space-y-1">
                            <li>Tapez votre ville (ex: "Lorient", "Paris")</li>
                            <li>Sélectionnez votre ville dans la liste</li>
                            <li>Tapez le nom de votre établissement</li>
                            <li>Les établissements apparaîtront automatiquement depuis OpenStreetMap</li>
                            <li>Cliquez sur votre établissement puis sur "Rechercher"</li>
                          </ol>
                          <p className="text-xs text-blue-600 mt-2 font-medium">
                            ✨ Base de données mondiale • Mise à jour en temps réel • Plus de 100M d'établissements
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Indicateur de connexion internet */}
                  {(rechercheVillesEnCours || rechercheEnCours) && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Connexion active avec les serveurs OpenStreetMap
                      </div>
                    </div>
                  )}
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
                <div className="space-y-6">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Saisie manuelle d'avis</h3>
                    <p className="text-gray-600">
                      Ajoutez un nouvel avis client dans le système
                    </p>
                  </div>

                  {/* Formulaire de saisie */}
                  <div className="max-w-2xl mx-auto space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Nom du client <span className="text-red-500">*</span>
                        </label>
                        <Input
                          placeholder="Ex: Marie Dupont"
                          value={avisManuel.nomClient}
                          onChange={(e) => gererChangementAvis('nomClient', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Note <span className="text-red-500">*</span>
                        </label>
                        <Select value={avisManuel.note} onValueChange={(value) => gererChangementAvis('note', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir une note" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">⭐ 1/5</SelectItem>
                            <SelectItem value="2">⭐⭐ 2/5</SelectItem>
                            <SelectItem value="3">⭐⭐⭐ 3/5</SelectItem>
                            <SelectItem value="4">⭐⭐⭐⭐ 4/5</SelectItem>
                            <SelectItem value="5">⭐⭐⭐⭐⭐ 5/5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Commentaire <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        className="w-full min-h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                        placeholder="Écrivez le commentaire du client..."
                        value={avisManuel.commentaire}
                        onChange={(e) => gererChangementAvis('commentaire', e.target.value)}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Date
                        </label>
                        <Input
                          type="date"
                          value={avisManuel.date}
                          onChange={(e) => gererChangementAvis('date', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Source
                        </label>
                        <Select value={avisManuel.source} onValueChange={(value) => gererChangementAvis('source', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Saisie manuelle">Saisie manuelle</SelectItem>
                            <SelectItem value="Google">Google</SelectItem>
                            <SelectItem value="TripAdvisor">TripAdvisor</SelectItem>
                            <SelectItem value="Yelp">Yelp</SelectItem>
                            <SelectItem value="Facebook">Facebook</SelectItem>
                            <SelectItem value="Site web">Site web</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button 
                        onClick={ajouterAvis} 
                        disabled={saisieEnCours}
                        className="flex-1"
                      >
                        {saisieEnCours ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Ajout en cours...
                          </>
                        ) : (
                          'Ajouter l\'avis'
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Liste des avis ajoutés */}
                  {avisListe.length > 0 && (
                    <div className="mt-8 pt-6 border-t">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Avis ajoutés ({avisListe.length})
                      </h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {avisListe.map((avis) => (
                          <div key={avis.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <span className="font-medium text-gray-900">{avis.nomClient}</span>
                                <div className="flex items-center gap-1 mt-1">
                                  {Array.from({ length: avis.note }, (_, i) => (
                                    <span key={i} className="text-yellow-400">⭐</span>
                                  ))}
                                  <span className="text-sm text-gray-500 ml-1">({avis.note}/5)</span>
                                </div>
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                <div>{avis.date}</div>
                                <div>{avis.source}</div>
                              </div>
                            </div>
                            <p className="text-gray-700 text-sm">{avis.commentaire}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
