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
import { useState } from "react";

const Importer = () => {
  const [ville, setVille] = useState("");
  const [etablissement, setEtablissement] = useState("");
  const [periode, setPeriode] = useState("1-mois");

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
              <span className="text-xl font-bold text-gray-900">ReviewRadar</span>
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
            <Button variant="ghost" className="text-gray-600 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Saisie manuelle
            </Button>
            <Button variant="ghost" className="text-gray-600 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import CSV
            </Button>
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
                    Ville <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Ex: Paris, Lyon, Marseille..."
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nom de l'établissement <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Sélectionnez d'abord une ville"
                    value={etablissement}
                    onChange={(e) => setEtablissement(e.target.value)}
                    className="w-full"
                    disabled={!ville}
                  />
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
                  <span>Commencez par sélectionner une ville pour voir les établissements disponibles</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Tapez le nom de l'établissement pour voir les suggestions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Sélectionnez l'établissement exact pour une précision maximale</span>
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