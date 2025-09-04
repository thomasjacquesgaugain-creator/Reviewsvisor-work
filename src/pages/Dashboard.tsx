import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Lightbulb
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
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
                Accueil
              </Link>
              <Button variant="ghost" className="text-gray-600">
                Importer
              </Button>
              <Button variant="ghost" className="text-blue-600 font-medium">
                Dashboard
              </Button>
              <div className="flex items-center gap-2 text-gray-700">
                <span>Bonjour, Yohan Lopes</span>
              </div>
              <Button variant="ghost" className="text-gray-600">
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
          <Button variant="outline" className="mt-2 text-red-500 border-red-200">
            Supprimer cette analyse
          </Button>
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
              <Button variant="outline" className="text-red-500 border-red-200">
                Supprimer tout
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-blue-600">65</span>
                <div>
                  <div className="font-medium">31/07/2025 14:30</div>
                  <div className="text-sm text-gray-500">2h avis</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                  Voir
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métriques */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Satisfaction Score</div>
                  <div className="text-2xl font-bold">0%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total avis</div>
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-xs text-gray-400">avis analysés</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Avis positifs</div>
                  <div className="text-2xl font-bold">0%</div>
                  <div className="text-xs text-gray-400">avis analysés</div>
                </div>
              </div>
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
                  <div className="text-2xl font-bold">0%</div>
                  <div className="text-xs text-gray-400">avis négatifs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
        <Card>
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
      </div>
    </div>
  );
};

export default Dashboard;