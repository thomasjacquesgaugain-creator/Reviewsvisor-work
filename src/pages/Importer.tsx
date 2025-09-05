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
  LogOut
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

const Importer = () => {
  const { toast } = useToast();
  const [ville, setVille] = useState("");
  const [etablissement, setEtablissement] = useState("");
  const [periode, setPeriode] = useState("1-mois");
  const [etablissements, setEtablissements] = useState<string[]>([]);
  const [villes, setVilles] = useState<string[]>([]);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [etablissementSelectionne, setEtablissementSelectionne] = useState("");
  const [villeSelectionnee, setVilleSelectionnee] = useState("");

  // Recherche d'établissements basée sur la ville
  const rechercherEtablissements = async (villeRecherche: string) => {
    if (!villeRecherche.trim()) {
      setEtablissements([]);
      return;
    }

    setRechercheEnCours(true);
    
    setTimeout(() => {
      const etablissementsExemples = [
        `Restaurant Le Petit ${villeRecherche}`,
        `Café Central ${villeRecherche}`,
        `Brasserie du Centre ${villeRecherche}`,
        `Restaurant Gastronomique ${villeRecherche}`,
        `Pizzeria Roma ${villeRecherche}`,
        `Bistrot des Amis ${villeRecherche}`,
        `Restaurant Asiatique ${villeRecherche}`,
        `Bar-Restaurant Le ${villeRecherche}`
      ];
      
      setEtablissements(etablissementsExemples);
      setRechercheEnCours(false);
      
      if (etablissementsExemples.length > 0) {
        toast({
          title: "Établissements trouvés",
          description: `${etablissementsExemples.length} établissements trouvés à ${villeRecherche}`,
          duration: 3000,
        });
      }
    }, 1000);
  };

  // Recherche de villes basée sur l'établissement
  const rechercherVilles = async (etablissementRecherche: string) => {
    if (!etablissementRecherche.trim()) {
      setVilles([]);
      return;
    }

    setRechercheEnCours(true);
    
    setTimeout(() => {
      const villesExemples = [
        "Paris",
        "Lyon", 
        "Marseille",
        "Toulouse",
        "Nice",
        "Nantes",
        "Strasbourg",
        "Montpellier"
      ];
      
      setVilles(villesExemples);
      setRechercheEnCours(false);
      
      if (villesExemples.length > 0) {
        toast({
          title: "Villes suggérées",
          description: `${villesExemples.length} villes où "${etablissementRecherche}" pourrait être présent`,
          duration: 3000,
        });
      }
    }, 1000);
  };

  // Effect pour la recherche basée sur la ville
  useEffect(() => {
    if (ville.length >= 3 && !villeSelectionnee) {
      const timeoutId = setTimeout(() => {
        rechercherEtablissements(ville);
        setVilles([]); // Clear ville suggestions when typing ville
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else if (ville.length < 3) {
      setEtablissements([]);
      setEtablissement("");
      setEtablissementSelectionne("");
    }
  }, [ville, villeSelectionnee]);

  // Effect pour la recherche basée sur l'établissement
  useEffect(() => {
    if (etablissement.length >= 3 && !etablissementSelectionne) {
      const timeoutId = setTimeout(() => {
        rechercherVilles(etablissement);
        setEtablissements([]); // Clear etablissement suggestions when typing etablissement
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else if (etablissement.length < 3) {
      setVilles([]);
      setVille("");
      setVilleSelectionnee("");
    }
  }, [etablissement, etablissementSelectionne]);

  const selectionnerEtablissement = (etablissementNom: string) => {
    setEtablissement(etablissementNom);
    setEtablissementSelectionne(etablissementNom);
    setEtablissements([]); // Clear suggestions
    toast({
      title: "Établissement sélectionné",
      description: etablissementNom,
      duration: 2000,
    });
  };

  const selectionnerVille = (villeNom: string) => {
    setVille(villeNom);
    setVilleSelectionnee(villeNom);
    setVilles([]); // Clear suggestions
    toast({
      title: "Ville sélectionnée",
      description: villeNom,
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">analytique</span>
            </div>
            
            <div className="flex items-center gap-6">
              <Link to="/" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
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
          <div className="flex items-center gap-4">
            <Link to="/saisie-manuelle">
              <Button variant="ghost" className="text-gray-600 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Saisie manuelle
              </Button>
            </Link>
            <Link to="/import-csv">
              <Button variant="ghost" className="text-gray-600 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import CSV
              </Button>
            </Link>
            <Button variant="ghost" className="text-blue-600 font-medium flex items-center gap-2">
              <Search className="w-4 h-4" />
              Récupération automatique
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Récupération automatique d'avis</h1>
            </div>
            <p className="text-lg text-gray-600">
              Récupérez automatiquement les avis Google, Tripadvisor et Yelp de votre établissement
            </p>
          </div>

          {/* Form */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nom de l'établissement <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Ex: Restaurant Le Petit Bistrot..."
                      value={etablissement}
                      onChange={(e) => setEtablissement(e.target.value)}
                      className="w-full"
                    />
                    {rechercheEnCours && etablissement.length >= 3 && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Liste des villes suggérées */}
                  {villes.length > 0 && !villeSelectionnee && (
                    <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-lg">
                      <div className="p-2 bg-gray-50 border-b text-xs font-medium text-gray-600">
                        Villes suggérées pour cet établissement
                      </div>
                      {villes.map((villeItem, index) => (
                        <button
                          key={index}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-600 text-sm border-b border-gray-100 last:border-b-0"
                          onClick={() => selectionnerVille(villeItem)}
                        >
                          {villeItem}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Liste des établissements trouvés */}
                  {etablissements.length > 0 && !etablissementSelectionne && (
                    <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-lg">
                      <div className="p-2 bg-gray-50 border-b text-xs font-medium text-gray-600">
                        {etablissements.length} établissements trouvés
                      </div>
                      {etablissements.map((etab, index) => (
                        <button
                          key={index}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-600 text-sm border-b border-gray-100 last:border-b-0"
                          onClick={() => selectionnerEtablissement(etab)}
                        >
                          {etab}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {etablissementSelectionne && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                      <span className="text-sm text-green-700">✓ {etablissementSelectionne}</span>
                      <button
                        onClick={() => {
                          setEtablissementSelectionne("");
                          setEtablissement("");
                        }}
                        className="text-green-600 hover:text-green-800 text-xs underline"
                      >
                        Changer
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Ville <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Ex: Paris, Lyon, Marseille..."
                      value={ville}
                      onChange={(e) => setVille(e.target.value)}
                      className="w-full"
                    />
                    {rechercheEnCours && ville.length >= 3 && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  
                  {villeSelectionnee && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                      <span className="text-sm text-green-700">✓ {villeSelectionnee}</span>
                      <button
                        onClick={() => {
                          setVilleSelectionnee("");
                          setVille("");
                        }}
                        className="text-green-600 hover:text-green-800 text-xs underline"
                      >
                        Changer
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Période des avis
                  </label>
                  <Select value={periode} onValueChange={setPeriode}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="1-mois">1 mois</SelectItem>
                      <SelectItem value="3-mois">3 mois</SelectItem>
                      <SelectItem value="6-mois">6 mois</SelectItem>
                      <SelectItem value="1-an">1 an</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
                disabled={!ville || !etablissement}
                onClick={lancerRecuperation}
              >
                Récupérer les avis
              </Button>
            </CardContent>
          </Card>

          {/* Conseils */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-lg">Conseils :</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Vous pouvez commencer par saisir soit le nom de l'établissement, soit la ville</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Saisissez au moins 3 caractères pour déclencher la recherche automatique</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Si vous tapez un établissement, des villes suggérées apparaîtront</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Si vous tapez une ville, des établissements suggérés apparaîtront</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Si aucun avis n'est trouvé pour une période courte, essayez une période plus longue</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Les avis sont récupérés depuis Google, Tripadvisor et Yelp</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Importer;