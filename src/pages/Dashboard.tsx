import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  User, 
  LogOut, 
  Home,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Target,
  ChevronDown,
  ChevronUp,
  Building2,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Dashboard = () => {
  const [showAvis, setShowAvis] = useState(false);
  const [showPlateformes, setShowPlateformes] = useState(false);
  const [periodeAnalyse, setPeriodeAnalyse] = useState("mois");

  const avisExemples = [
    { id: 1, auteur: "Marie L.", note: 5, commentaire: "Excellent service, très satisfait !", date: "30/07/2025" },
    { id: 2, auteur: "Jean D.", note: 4, commentaire: "Bonne ambiance, plats savoureux", date: "29/07/2025" },
    { id: 3, auteur: "Sophie M.", note: 3, commentaire: "Service correct mais un peu d'attente", date: "28/07/2025" },
  ];
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
              <Link to="/etablissement" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                Établissement
              </Link>
              <Link to="/importer" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                Importer
              </Link>
              <Button variant="ghost" className="text-blue-600 font-medium flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Button>
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4" />
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

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Dashboard d'analyse</h1>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Analyse de 0 avis clients</span>
          </div>
        </div>

        {/* Historique des analyses */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <CardTitle className="text-lg">Historique des analyses</CardTitle>
                <span className="text-sm text-gray-500">Les analyses précédentes et terminées. Les résultats</span>
              </div>
              <Select value={periodeAnalyse} onValueChange={setPeriodeAnalyse}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="jour">Jour</SelectItem>
                  <SelectItem value="semaine">Semaine</SelectItem>
                  <SelectItem value="mois">Mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-blue-600">65</span>
                  <div>
                    <div className="font-medium">31/07/2025 14:30</div>
                    <div className="text-sm text-gray-500">2h avis</div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAvis(!showAvis)}
                  className="hover:bg-blue-50"
                >
                  {showAvis ? (
                    <ChevronUp className="w-4 h-4 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-blue-600" />
                  )}
                </Button>
              </div>
              
              {showAvis && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Avis récents :</h4>
                  {avisExemples.map((avis) => (
                    <div key={avis.id} className="bg-white p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{avis.auteur}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-500">{'★'.repeat(avis.note)}</span>
                          <span className="text-xs text-gray-500">{avis.date}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{avis.commentaire}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Métriques */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold">4.2</span>
              </div>
              <p className="text-sm text-gray-600">Note moyenne</p>
              <p className="text-xs text-gray-500">Basée sur 158 avis</p>
            </CardContent>
          </Card>

          <Card className="relative">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">326</div>
              <p className="text-sm text-gray-600">Total avis</p>
              <p className="text-xs text-gray-500">Tous plateformes</p>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowPlateformes(!showPlateformes)}
                className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-blue-50"
              >
                {showPlateformes ? (
                  <ChevronUp className="w-3 h-3 text-blue-600" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-blue-600" />
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="text-2xl font-bold text-green-600">78%</span>
              </div>
              <p className="text-sm text-gray-600">Avis positifs</p>
              <p className="text-xs text-gray-500">Note ≥ 4 étoiles</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Avis négatifs</div>
                  <div className="text-2xl font-bold">22%</div>
                  <div className="text-xs text-gray-400">avis négatifs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plateformes connectées - Affichées en dessous des métriques */}
        {showPlateformes && (
          <div className="mb-8 space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 font-bold">G</span>
                </div>
                <div>
                  <div className="font-medium">Google My Business</div>
                  <div className="text-sm text-gray-500">142 avis • 4.3 étoiles</div>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700">Connecté</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold">T</span>
                </div>
                <div>
                  <div className="font-medium">TripAdvisor</div>
                  <div className="text-sm text-gray-500">98 avis • 4.1 étoiles</div>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700">Connecté</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 font-bold">Y</span>
                </div>
                <div>
                  <div className="font-medium">Yelp</div>
                  <div className="text-sm text-gray-500">86 avis • 4.0 étoiles</div>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700">Connecté</Badge>
            </div>
          </div>
        )}

        {/* Problèmes et Points forts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Problèmes prioritaires */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <CardTitle className="text-lg">Top 3 Problèmes prioritaires</CardTitle>
              </div>
              <p className="text-sm text-gray-500">Les plus mentionnés par fréquence et pourcentage en priorité</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <div className="font-medium">Temps d'attente trop long</div>
                  <div className="text-sm text-gray-500">25% des avis</div>
                </div>
                <Badge variant="destructive">Critique</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <div className="font-medium">Service client insatisfaisant</div>
                  <div className="text-sm text-gray-500">20% des avis</div>
                </div>
                <Badge variant="destructive">Critique</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <div className="font-medium">Prix trop élevés</div>
                  <div className="text-sm text-gray-500">15% des avis</div>
                </div>
                <Badge className="bg-yellow-500 text-white">Moyen</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Points forts */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <CardTitle className="text-lg">Top 3 Points forts</CardTitle>
              </div>
              <p className="text-sm text-gray-500">Les points forts les plus mentionnés par vos clients</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium">Qualité exceptionnelle</div>
                  <div className="text-sm text-gray-500">30% des avis</div>
                </div>
                <Badge className="bg-green-500 text-white">Force</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium">Satisfaction générale</div>
                  <div className="text-sm text-gray-500">25% des avis</div>
                </div>
                <Badge className="bg-green-500 text-white">Force</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium">Bonne ambiance</div>
                  <div className="text-sm text-gray-500">20% des avis</div>
                </div>
                <Badge className="bg-green-500 text-white">Force</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommandations */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-lg">Recommandations actionnables</CardTitle>
            </div>
            <p className="text-sm text-gray-500">Actions concrètes à mettre en place</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Améliorer le service</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Être attentif aux retours clients</span>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-900">Correction réussie</div>
              <div className="text-sm text-blue-700">Redirection vers votre dashboard</div>
            </div>
          </CardContent>
        </Card>

        {/* Analyse par thématiques */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              <CardTitle className="text-lg">Analyse par thématiques</CardTitle>
            </div>
            <p className="text-sm text-gray-500">Répartition des avis par catégories</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <div className="font-medium">Services</div>
                  <div className="text-sm text-gray-500">45% des avis</div>
                </div>
                <Badge className="bg-purple-500 text-white">Thématique</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;