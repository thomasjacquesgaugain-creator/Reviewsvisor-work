import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, BarChart3, Clock, TrendingUp, User, LogOut, Home, Building } from "lucide-react";
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
                <Button variant="ghost" className="text-gray-700 flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </Button>
                <Link to="/etablissement" className="text-gray-700 hover:text-blue-600 flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  Établissement
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

        {/* Main content */}
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-5xl font-bold text-gray-900">
              Review<span className="text-blue-600">Radar</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Analysez automatiquement vos avis clients pour identifier les problèmes prioritaires et améliorer la satisfaction de votre établissement.
            </p>
          </div>

          {/* Welcome card */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden max-w-3xl mx-auto mb-16">
            <CardContent className="p-8 text-center space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Bienvenue, Yohan Lopes !</h2>
              <p className="text-gray-600">
                Vous êtes connecté et pouvez maintenant analyser vos avis clients.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium">
                  <Upload className="w-5 h-5 mr-2" />
                  Importer des avis
                </Button>
                <Button variant="outline" className="border-gray-300 text-gray-700 px-8 py-3 rounded-full font-medium">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Voir mon dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Problèmes prioritaires</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Identification des 3 problèmes les plus critiques à résoudre en priorité.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Score de satisfaction</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Calcul automatique de votre score moyen basé sur l'analyse des sentiments.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Gain de temps</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Résumé express et recommandations personnalisées en quelques clics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;