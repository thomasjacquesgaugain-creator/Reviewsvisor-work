import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, User, LogOut, Home, Eye, Trash2, AlertTriangle, CheckCircle, Lightbulb, Target, ChevronDown, ChevronUp, Building2, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const Dashboard = () => {
  const [showAvis, setShowAvis] = useState(false);
  const [showPlateformes, setShowPlateformes] = useState(false);
  const [showCourbeNote, setShowCourbeNote] = useState(false);
  const [periodeAnalyse, setPeriodeAnalyse] = useState("mois");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Mise à jour de l'heure en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Formatage de la date et de l'heure
  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      }),
      time: date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
      })
    };
  };
  const {
    date,
    time
  } = formatDateTime(currentDateTime);
  const avisExemples = [{
    id: 1,
    auteur: "Marie L.",
    note: 5,
    commentaire: "Excellent service, très satisfait !",
    date: "30/07/2025"
  }, {
    id: 2,
    auteur: "Jean D.",
    note: 4,
    commentaire: "Bonne ambiance, plats savoureux",
    date: "29/07/2025"
  }, {
    id: 3,
    auteur: "Sophie M.",
    note: 3,
    commentaire: "Service correct mais un peu d'attente",
    date: "28/07/2025"
  }];

  // Données pour la courbe de progression de la note
  const courbeNoteData = [
    { mois: 'Jan', note: 3.8 },
    { mois: 'Fév', note: 3.9 },
    { mois: 'Mar', note: 4.0 },
    { mois: 'Avr', note: 3.7 },
    { mois: 'Mai', note: 4.1 },
    { mois: 'Juin', note: 4.2 },
    { mois: 'Juil', note: 4.2 },
  ];
  return <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/lovable-uploads/62ee8352-36cc-4657-89b4-5c00321ab74c.png" alt="Analytics Logo" className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900">analytique</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6">
                <Link to="/tableau-de-bord" className="text-gray-600 hover:text-blue-600 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Accueil
                </Link>
                <Button variant="ghost" className="text-blue-600 font-medium flex items-center gap-2">
                  Dashboard
                </Button>
                <Link to="/etablissement" className="text-gray-600 hover:text-blue-600 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Établissement
                </Link>
              </div>
              
              <div className="flex items-center gap-4 ml-auto">
                <div className="text-gray-700 font-medium">
                  Bonjour, Yohan Lopes
                </div>
                <Button variant="ghost" className="text-gray-600 hover:text-red-600 flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </Button>
              </div>
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
              <div>
                <CardTitle className="text-lg">Historique des analyses</CardTitle>
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
            <p className="text-sm text-gray-500 mt-2">Les analyses précédentes et terminées. Les résultats</p>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-blue-600">65</span>
                  <div>
                    <div className="font-medium">{date} {time}</div>
                    <div className="text-sm text-gray-500">2h avis</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowAvis(!showAvis)} className="hover:bg-blue-50">
                  {showAvis ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
                </Button>
              </div>
              
              {showAvis && <div className="mt-4 space-y-3 border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Avis récents :</h4>
                  {avisExemples.map(avis => <div key={avis.id} className="bg-white p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{avis.auteur}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-500">{'★'.repeat(avis.note)}</span>
                          <span className="text-xs text-gray-500">{avis.date}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{avis.commentaire}</p>
                    </div>)}
                </div>}
            </div>
          </CardContent>
        </Card>

        {/* Métriques */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="relative">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold">4.2</span>
              </div>
              <p className="text-sm text-gray-600">Note moyenne</p>
              <p className="text-xs text-gray-500">Basée sur 158 avis</p>
              <Button variant="ghost" size="sm" onClick={() => setShowCourbeNote(!showCourbeNote)} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-yellow-50">
                {showCourbeNote ? <ChevronUp className="w-3 h-3 text-yellow-600" /> : <ChevronDown className="w-3 h-3 text-yellow-600" />}
              </Button>
            </CardContent>
          </Card>

        {/* Courbe de progression de la note */}
        {showCourbeNote && (
          <div className="col-span-full mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Évolution de la note moyenne
                </CardTitle>
                <p className="text-sm text-gray-600">Progression de votre note depuis la création du compte</p>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={courbeNoteData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
                      <Tooltip formatter={(value) => [`${value}/5`, 'Note moyenne']} />
                      <Line 
                        type="monotone" 
                        dataKey="note" 
                        stroke="#eab308" 
                        strokeWidth={3}
                        dot={{ fill: '#eab308', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-gray-500 mt-4">Date de création du compte: 09/09/2025</p>
              </CardContent>
            </Card>
          </div>
        )}

          <Card className="relative">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="text-2xl font-bold text-blue-600">326</span>
                <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
              </div>
              <p className="text-sm text-gray-600">Total avis</p>
              <p className="text-xs text-gray-500">Tous plateformes</p>
              <Button variant="ghost" size="sm" onClick={() => setShowPlateformes(!showPlateformes)} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-blue-50">
                {showPlateformes ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />}
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
        {showPlateformes && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Plateformes connectées</CardTitle>
              <p className="text-sm text-gray-600">Gérer vos présences sur les différentes plateformes</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
            </CardContent>
          </Card>}

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
              <span className="text-2xl font-bold text-purple-600">78%</span>
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
    </div>;
};
export default Dashboard;