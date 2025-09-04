import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, BarChart3, Clock, TrendingUp, User, LogOut, Home, AlertTriangle, CheckCircle, Trash2, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with organic shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100">
        <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-orange-200 to-yellow-200 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-gradient-to-bl from-blue-300 to-cyan-300 rounded-full blur-2xl opacity-25"></div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <span className="text-xl font-bold text-gray-900">ReviewRadar</span>
              </div>
              
              <div className="flex items-center gap-6">
                <Link to="/" className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                  <Home className="w-4 h-4" />
                  Accueil
                </Link>
                <Button variant="ghost" className="text-gray-700 flex items-center gap-1">
                  <Upload className="w-4 h-4" />
                  Importer
                </Button>
                <Button variant="ghost" className="text-blue-600 flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </Button>
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

        {/* Main content */}
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 Dashboard d'analyse</h1>
            <p className="text-gray-600">📈 Analyse de 0 avis clients</p>
            <Button variant="outline" className="mt-2 text-red-500 border-red-200">
              Supprimer cette analyse
            </Button>
          </div>

          {/* Analytics History */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-xl mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <span>📊</span>
                <CardTitle className="text-lg">Historique des analyses</CardTitle>
              </div>
              <Button variant="outline" className="text-red-500 border-red-200">
                Supprimer tout
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">Toutes vos analyses précédentes. Sélectionnez une pour voir les résultats.</p>
              
              {/* Analysis entry */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-gray-600">65</span>
                  <div>
                    <p className="font-medium">23/07/2025 14:30 - 31 avis</p>
                    <p className="text-sm text-gray-500">Score: 96% positif - 0% négatif</p>
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

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">0%</div>
                <div className="text-sm text-gray-600">RedReview Score</div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Total avis</div>
                <div className="text-xs text-gray-500">pas analysé</div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">0%</div>
                <div className="text-sm text-gray-600">Avis positifs</div>
                <div className="text-xs text-gray-500">pas analysé</div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">0%</div>
                <div className="text-sm text-gray-600">Avis négatifs</div>
                <div className="text-xs text-gray-500">pas analysé</div>
              </CardContent>
            </Card>
          </div>

          {/* Problems and Strengths */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Top 3 Problems */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Top 3 Problèmes prioritaires
                </CardTitle>
                <p className="text-sm text-gray-600">Les problèmes les plus fréquents à résoudre en priorité</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Temps d'attente trop long</p>
                    <p className="text-sm text-gray-600">25% des avis</p>
                  </div>
                  <Badge className="bg-red-100 text-red-700 border-red-200">Critique</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Service client insatisfaisant</p>
                    <p className="text-sm text-gray-600">20% des avis</p>
                  </div>
                  <Badge className="bg-red-100 text-red-700 border-red-200">Critique</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Prix trop élevés</p>
                    <p className="text-sm text-gray-600">15% des avis</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Moyen</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Top 3 Strengths */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  Top 3 Points forts
                </CardTitle>
                <p className="text-sm text-gray-600">Les points forts les plus mentionnés par vos clients</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Qualité exceptionnelle</p>
                    <p className="text-sm text-gray-600">30% des avis</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200">Force</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Satisfaction générale</p>
                    <p className="text-sm text-gray-600">25% des avis</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200">Force</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Bonne ambiance</p>
                    <p className="text-sm text-gray-600">20% des avis</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200">Force</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <TrendingUp className="w-5 h-5" />
                Recommandations actionnables
              </CardTitle>
              <p className="text-sm text-gray-600">Actions concrètes à mettre en place</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Améliorer le service</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Être attentif aux retours clients</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;