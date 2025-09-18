import { AnalyseDashboard } from "@/components/AnalyseDashboard";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart3, TrendingUp, User, LogOut, Home, Eye, Trash2, AlertTriangle, CheckCircle, Lightbulb, Target, ChevronDown, ChevronUp, ChevronRight, Building2, Star, UtensilsCrossed, Wine, Users, MapPin, Clock, MessageSquare, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { useEstablishmentStore } from "@/store/establishmentStore";
import { Etab, STORAGE_KEY, EVT_SAVED, STORAGE_KEY_LIST } from "@/types/etablissement";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Area } from 'recharts';

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const etablissementId = searchParams.get('etablissementId');
  const {
    user
  } = useAuth();
  const {
    selectedEstablishment
  } = useEstablishmentStore();
  const [showAvis, setShowAvis] = useState(false);
  const [showPlateformes, setShowPlateformes] = useState(false);
  const [showCourbeNote, setShowCourbeNote] = useState(false);
  const [showAvisPositifs, setShowAvisPositifs] = useState(false);
  const [showAvisNegatifs, setShowAvisNegatifs] = useState(false);
  const [showThematiques, setShowThematiques] = useState(false);
  const [showReponseAuto, setShowReponseAuto] = useState(false);
  const [showParetoChart, setShowParetoChart] = useState(false);
  const [showParetoPoints, setShowParetoPoints] = useState(false);
  const [periodeAnalyse, setPeriodeAnalyse] = useState("mois");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Établissement sélectionné (depuis localStorage ou store)
  const [selectedEtab, setSelectedEtab] = useState<Etab | null>(null);

  // Liste des établissements enregistrés
  const [establishments, setEstablishments] = useState<Etab[]>([]);
  const [showEstablishmentsDropdown, setShowEstablishmentsDropdown] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSelectedEtab(JSON.parse(raw));

      // Charger la liste des établissements
      const rawList = localStorage.getItem(STORAGE_KEY_LIST);
      if (rawList) setEstablishments(JSON.parse(rawList));
    } catch {}
    const onSaved = (e: any) => setSelectedEtab(e.detail as Etab);
    window.addEventListener(EVT_SAVED, onSaved);
    return () => window.removeEventListener(EVT_SAVED, onSaved);
  }, []);
  useEffect(() => {
    if (selectedEstablishment) {
      setSelectedEtab({
        place_id: selectedEstablishment.place_id,
        name: selectedEstablishment.name,
        address: selectedEstablishment.formatted_address || "",
        lat: selectedEstablishment.lat ?? null,
        lng: selectedEstablishment.lng ?? null,
        website: selectedEstablishment.website,
        phone: selectedEstablishment.phone,
        rating: selectedEstablishment.rating ?? null
      });
    }
  }, [selectedEstablishment]);

  // Review insights data from Supabase
  const [insight, setInsight] = useState<any>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  // Mocked data for Pareto charts (will be updated below after variables are declared)
  const defaultParetoData = [{
    name: "Service lent",
    count: 45,
    percentage: 32.1,
    cumulative: 32.1
  }, {
    name: "Nourriture froide",
    count: 38,
    percentage: 27.1,
    cumulative: 59.2
  }, {
    name: "Attente longue",
    count: 25,
    percentage: 17.9,
    cumulative: 77.1
  }];
  const defaultParetoPointsData = [{
    name: "Qualité nourriture",
    count: 52,
    percentage: 35.4,
    cumulative: 35.4
  }, {
    name: "Service rapide",
    count: 41,
    percentage: 27.9,
    cumulative: 63.3
  }, {
    name: "Ambiance agréable",
    count: 28,
    percentage: 19.0,
    cumulative: 82.3
  }];

  // Fetch review insights data
  useEffect(() => {
    const fetchInsights = async () => {
      if (!user?.id || !selectedEstablishment?.place_id) return;
      setIsLoadingInsight(true);
      try {
        const {
          data: insightData,
          error
        } = await supabase.from('review_insights').select('counts, overall_rating, top_issues, top_strengths, positive_ratio, g_meta, last_analyzed_at').eq('place_id', selectedEstablishment.place_id).eq('user_id', user.id).order('last_analyzed_at', {
          ascending: false
        }).limit(1).maybeSingle();
        if (error) {
          console.error('[dashboard] review_insights error:', error);
        } else {
          setInsight(insightData);
        }
      } catch (error) {
        console.error('[dashboard] fetch insights error:', error);
      } finally {
        setIsLoadingInsight(false);
      }
    };
    fetchInsights();
  }, [user?.id, selectedEstablishment?.place_id]);

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

  // Map insight data to variables used by UI components
  const totalAnalyzed = insight?.counts?.google ?? 0;
  const avgRating = insight?.overall_rating ?? insight?.g_meta?.rating ?? 4.2;
  const totalReviews = insight?.counts?.google ?? 326;
  const positivePct = insight?.positive_ratio != null ? Math.round(insight.positive_ratio * 100) : 78;
  const negativePct = 100 - positivePct;
  const topIssues = insight?.top_issues ?? [];
  const topStrengths = insight?.top_strengths ?? [];

  // Map top issues to Pareto data format
  const paretoData = topIssues.length > 0 ? topIssues.slice(0, 3).map((issue: any, index: number) => {
    const count = issue.count || issue.mentions || 0;
    const percentage = totalAnalyzed > 0 ? count / totalAnalyzed * 100 : 0;
    return {
      name: issue.theme || issue.issue || `Problème ${index + 1}`,
      count,
      percentage,
      cumulative: 0 // Will be calculated below
    };
  }) : defaultParetoData;

  // Calculate cumulative percentages for issues
  let cumulativeIssues = 0;
  paretoData.forEach((item: any) => {
    cumulativeIssues += item.percentage;
    item.cumulative = cumulativeIssues;
  });

  // Map top strengths to Pareto data format
  const paretoPointsData = topStrengths.length > 0 ? topStrengths.slice(0, 3).map((strength: any, index: number) => {
    const count = strength.count || strength.mentions || 0;
    const percentage = totalAnalyzed > 0 ? count / totalAnalyzed * 100 : 0;
    return {
      name: strength.theme || strength.strength || `Point fort ${index + 1}`,
      count,
      percentage,
      cumulative: 0 // Will be calculated below
    };
  }) : defaultParetoPointsData;

  // Calculate cumulative percentages for strengths
  let cumulativeStrengths = 0;
  paretoPointsData.forEach((item: any) => {
    cumulativeStrengths += item.percentage;
    item.cumulative = cumulativeStrengths;
  });
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
  const courbeNoteData = [{
    mois: 'Jan',
    note: 3.8
  }, {
    mois: 'Fév',
    note: 3.9
  }, {
    mois: 'Mar',
    note: 4.0
  }, {
    mois: 'Avr',
    note: 3.7
  }, {
    mois: 'Mai',
    note: 4.1
  }, {
    mois: 'Juin',
    note: 4.2
  }, {
    mois: 'Juil',
    note: 4.2
  }];

  // Données pour les 5 meilleurs avis
  const meilleursAvis = [{
    id: 1,
    auteur: "Marie L.",
    note: 5,
    commentaire: "Excellent service ! L'équipe est très professionnelle et attentionnée. Je recommande vivement !",
    date: "02/08/2025",
    plateforme: "Google"
  }, {
    id: 2,
    auteur: "Pierre M.",
    note: 5,
    commentaire: "Une expérience parfaite du début à la fin. Qualité exceptionnelle et service irréprochable.",
    date: "30/07/2025",
    plateforme: "TripAdvisor"
  }, {
    id: 3,
    auteur: "Sophie D.",
    note: 5,
    commentaire: "Magnifique ! Tout était parfait, je reviendrai certainement. Bravo à toute l'équipe !",
    date: "28/07/2025",
    plateforme: "Google"
  }, {
    id: 4,
    auteur: "Thomas R.",
    note: 5,
    commentaire: "Service de qualité supérieure, personnel très accueillant. Une adresse à retenir absolument.",
    date: "26/07/2025",
    plateforme: "Yelp"
  }, {
    id: 5,
    auteur: "Julie C.",
    note: 5,
    commentaire: "Parfait en tous points ! Qualité, service, ambiance... tout y est. Félicitations !",
    date: "25/07/2025",
    plateforme: "Google"
  }];

  // Données pour les 5 pires avis
  const piresAvis = [{
    id: 1,
    auteur: "Marc D.",
    note: 1,
    commentaire: "Service décevant, temps d'attente très long et personnel peu professionnel.",
    date: "01/08/2025",
    plateforme: "Google"
  }, {
    id: 2,
    auteur: "Lisa F.",
    note: 1,
    commentaire: "Très mauvaise expérience, qualité insuffisante pour le prix demandé. Je ne recommande pas.",
    date: "29/07/2025",
    plateforme: "TripAdvisor"
  }, {
    id: 3,
    auteur: "Ahmed B.",
    note: 2,
    commentaire: "Pas à la hauteur des attentes. Service lent et produits de qualité moyenne.",
    date: "27/07/2025",
    plateforme: "Yelp"
  }, {
    id: 4,
    auteur: "Claire M.",
    note: 1,
    commentaire: "Expérience décevante, personnel désagréable et prestations insuffisantes.",
    date: "24/07/2025",
    plateforme: "Google"
  }, {
    id: 5,
    auteur: "David L.",
    note: 2,
    commentaire: "Rapport qualité-prix décevant, beaucoup d'améliorations à apporter.",
    date: "22/07/2025",
    plateforme: "TripAdvisor"
  }];

  // If we have an etablissementId in URL, show analysis dashboard
  if (etablissementId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <AnalyseDashboard />
        </div>
      </div>
    );
  }

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
            <span>Analyse de {totalAnalyzed} avis clients</span>
          </div>
        </div>

        {/* Établissement sélectionné */}
        {selectedEstablishment && <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{selectedEstablishment.name}</div>
                  <div className="text-sm text-gray-500">{selectedEstablishment.formatted_address}</div>
                </div>
              </div>
            </CardContent>
          </Card>}

        {/* Établissement sélectionné */}
        {selectedEtab && <Card className="mb-4">
            <CardContent className="p-4">
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    {/* Flèche vers le bas en haut à droite de l'icône */}
                    <Popover open={showEstablishmentsDropdown} onOpenChange={setShowEstablishmentsDropdown}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="absolute -top-1 -right-1 text-gray-400 hover:text-gray-600 p-0.5 h-auto w-auto bg-white border border-gray-200 rounded-full shadow-sm" title="Choisir un autre établissement">
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-2 bg-white" align="start">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700 px-3 py-2">
                            Mes Établissements
                          </div>
                          {establishments.length === 0 ? <div className="text-sm text-gray-500 px-3 py-2">
                              Aucun établissement enregistré
                            </div> : establishments.map(etab => <Button key={etab.place_id} variant="ghost" className="w-full justify-start p-3 h-auto text-left hover:bg-gray-50" onClick={() => {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(etab));
                        setSelectedEtab(etab);
                        setShowEstablishmentsDropdown(false);
                        // Déclencher l'événement pour mettre à jour d'autres composants
                        window.dispatchEvent(new CustomEvent(EVT_SAVED, {
                          detail: etab
                        }));
                      }}>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">{etab.name}</div>
                                    <div className="text-sm text-gray-500 truncate">{etab.address}</div>
                                  </div>
                                </div>
                              </Button>)}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{selectedEtab.name}</div>
                    <div className="text-sm text-gray-500">{selectedEtab.address}</div>
                  </div>
                </div>
                
                {/* Icône "Importer vos avis" au milieu en bas */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                  
                </div>
                
                {/* Icônes en bas à droite */}
                <div className="absolute bottom-0 right-0 flex gap-1">
                  {/* Bouton analyser établissement */}
                  <Button variant="ghost" size="sm" onClick={async () => {
                if (!selectedEtab?.place_id) return;
                // TODO: Implémenter l'analyse
                console.log('Analyser:', selectedEtab.place_id);
              }} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 h-auto" title="Analyser cet établissement">
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  
                  {/* Bouton oublier établissement */}
                  <Button variant="ghost" size="sm" onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setSelectedEtab(null);
              }} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto" title="Oublier cet établissement">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>}

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
                <span className="text-2xl font-bold">{avgRating.toFixed(1)}</span>
              </div>
              <p className="text-sm text-gray-600">Note moyenne</p>
              <p className="text-xs text-gray-500">Basée sur {totalReviews} avis</p>
              <Button variant="ghost" size="sm" onClick={() => setShowCourbeNote(!showCourbeNote)} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-yellow-50">
                {showCourbeNote ? <ChevronUp className="w-3 h-3 text-yellow-600" /> : <ChevronDown className="w-3 h-3 text-yellow-600" />}
              </Button>
            </CardContent>
          </Card>

          <Card className="relative">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="text-2xl font-bold text-blue-600">{totalReviews}</span>
                <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
              </div>
              <p className="text-sm text-gray-600">Total avis</p>
              <p className="text-xs text-gray-500">Tous plateformes</p>
              <Button variant="ghost" size="sm" onClick={() => setShowPlateformes(!showPlateformes)} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-blue-50">
                {showPlateformes ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />}
              </Button>
            </CardContent>
          </Card>

          <Card className="relative">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="text-2xl font-bold text-green-600">{positivePct}%</span>
              </div>
              <p className="text-sm text-gray-600">Avis positifs</p>
              <p className="text-xs text-gray-500">Note ≥ 4 étoiles</p>
              <Button variant="ghost" size="sm" onClick={() => setShowAvisPositifs(!showAvisPositifs)} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-green-50">
                {showAvisPositifs ? <ChevronUp className="w-3 h-3 text-green-600" /> : <ChevronDown className="w-3 h-3 text-green-600" />}
              </Button>
            </CardContent>
          </Card>

          <Card className="relative">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Avis négatifs</div>
                  <div className="text-2xl font-bold">{negativePct}%</div>
                  <div className="text-xs text-gray-400">avis négatifs</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAvisNegatifs(!showAvisNegatifs)} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-red-50">
                {showAvisNegatifs ? <ChevronUp className="w-3 h-3 text-red-600" /> : <ChevronDown className="w-3 h-3 text-red-600" />}
              </Button>
            </CardContent>
          </Card>

          
        </div>

        {/* Courbe de progression de la note */}
        {showCourbeNote && <Card className="mb-8">
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
                    <Tooltip formatter={value => [`${value}/5`, 'Note moyenne']} />
                    <Line type="monotone" dataKey="note" stroke="#eab308" strokeWidth={3} dot={{
                  fill: '#eab308',
                  strokeWidth: 2,
                  r: 4
                }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-gray-500 mt-4">Date de création du compte: 09/09/2025</p>
            </CardContent>
          </Card>}

        {/* Pires avis */}
        {showAvisNegatifs && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Top 5 des mauvais avis
              </CardTitle>
              <p className="text-sm text-gray-600">Les avis les moins bien notés nécessitant votre attention</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {piresAvis.map((avis, index) => <div key={avis.id} className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-red-700">#{index + 1}</span>
                        <span className="font-medium">{avis.auteur}</span>
                        <span className="text-yellow-500">{'★'.repeat(avis.note)}{'☆'.repeat(5 - avis.note)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{avis.plateforme}</span>
                        <span className="text-xs text-gray-500">{avis.date}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 italic">"{avis.commentaire}"</p>
                  </div>)}
              </div>
            </CardContent>
          </Card>}

        {/* Meilleurs avis */}
        {showAvisPositifs && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Top 5 des meilleurs avis
              </CardTitle>
              <p className="text-sm text-gray-600">Les avis les mieux notés de vos clients</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {meilleursAvis.map((avis, index) => <div key={avis.id} className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-700">#{index + 1}</span>
                        <span className="font-medium">{avis.auteur}</span>
                        <span className="text-yellow-500">{'★'.repeat(avis.note)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{avis.plateforme}</span>
                        <span className="text-xs text-gray-500">{avis.date}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 italic">"{avis.commentaire}"</p>
                  </div>)}
              </div>
            </CardContent>
          </Card>}

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
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <CardTitle className="text-lg">Top 3 Problèmes prioritaires</CardTitle>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground cursor-pointer transition-transform ${showParetoChart ? 'rotate-180' : ''}`} onClick={() => setShowParetoChart(!showParetoChart)} />
              </div>
              <p className="text-sm text-gray-500">Les plus mentionnés par fréquence et pourcentage en priorité</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-500" />
                  <div>
                    <div className="font-medium">Temps d'attente trop long</div>
                    <div className="text-sm text-gray-500">25% des avis</div>
                  </div>
                </div>
                <Badge variant="destructive">Critique</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-500" />
                  <div>
                    <div className="font-medium">Service client insatisfaisant</div>
                    <div className="text-sm text-gray-500">20% des avis</div>
                  </div>
                </div>
                <Badge variant="destructive">Critique</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-yellow-600" />
                  <div>
                    <div className="font-medium">Prix trop élevés</div>
                    <div className="text-sm text-gray-500">15% des avis</div>
                  </div>
                </div>
                <Badge className="bg-yellow-500 text-white">Moyen</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Points forts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <CardTitle className="text-lg">Top 3 Points forts</CardTitle>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground cursor-pointer transition-transform ${showParetoPoints ? 'rotate-180' : ''}`} onClick={() => setShowParetoPoints(!showParetoPoints)} />
              </div>
              <p className="text-sm text-gray-500">Les points forts les plus mentionnés par vos clients</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="font-medium">Qualité exceptionnelle</div>
                    <div className="text-sm text-gray-500">30% des avis</div>
                  </div>
                </div>
                <Badge className="bg-green-500 text-white">Force</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="font-medium">Satisfaction générale</div>
                    <div className="text-sm text-gray-500">25% des avis</div>
                  </div>
                </div>
                <Badge className="bg-green-500 text-white">Force</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wine className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="font-medium">Bonne ambiance</div>
                    <div className="text-sm text-gray-500">20% des avis</div>
                  </div>
                </div>
                <Badge className="bg-green-500 text-white">Force</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Diagramme de Pareto des Points Forts */}
        {showParetoPoints && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Diagramme de Pareto - Analyse des points forts
              </CardTitle>
              <p className="text-sm text-gray-600">Identification des 20% de points forts qui génèrent 80% de la satisfaction</p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={paretoPointsData} margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60
              }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <Tooltip formatter={(value, name) => {
                  if (name === 'Cumulative') return [`${value}%`, 'Cumul %'];
                  return [value, 'Mentions positives'];
                }} />
                    <Bar yAxisId="left" dataKey="count" fill="hsl(var(--primary))" name="Mentions positives" />
                    <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="hsl(var(--green-600))" strokeWidth={2} dot={{
                  fill: "hsl(var(--green-600))",
                  strokeWidth: 2,
                  r: 4
                }} name="Cumulative" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-gray-500 mt-4">Les barres représentent les mentions positives, la ligne le pourcentage cumulé des forces</p>
            </CardContent>
          </Card>}

        {/* Diagramme de Pareto */}
        {showParetoChart && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Diagramme de Pareto - Analyse des problèmes
              </CardTitle>
              <p className="text-sm text-gray-600">Identification des 20% de causes qui génèrent 80% des problèmes</p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={paretoData} margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60
              }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <Tooltip formatter={(value, name) => {
                  if (name === 'Cumulative') return [`${value}%`, 'Cumul %'];
                  return [value, 'Occurrences'];
                }} />
                    <Bar yAxisId="left" dataKey="count" fill="hsl(var(--destructive))" name="Occurrences" />
                    <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" strokeWidth={2} dot={{
                  fill: "hsl(var(--primary))",
                  strokeWidth: 2,
                  r: 4
                }} name="Cumulative" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-gray-500 mt-4">Les barres représentent le nombre d'occurrences, la ligne le pourcentage cumulé</p>
            </CardContent>
          </Card>}

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
        <Card className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">78%</span>
                <CardTitle className="text-lg">Analyse par thématiques</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowThematiques(!showThematiques)} className="h-6 w-6 p-0 hover:bg-purple-50">
                {showThematiques ? <ChevronUp className="w-3 h-3 text-purple-600" /> : <ChevronDown className="w-3 h-3 text-purple-600" />}
              </Button>
            </div>
            <p className="text-sm text-gray-500">Répartition des avis par catégories</p>
          </CardHeader>
          {showThematiques && <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="font-medium">Cuisine</div>
                      <div className="text-sm text-gray-500">35% des avis</div>
                    </div>
                  </div>
                  <Badge className="bg-purple-500 text-white">Thématique</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="font-medium">Service</div>
                      <div className="text-sm text-gray-500">30% des avis</div>
                    </div>
                  </div>
                  <Badge className="bg-purple-500 text-white">Thématique</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wine className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="font-medium">Ambiance</div>
                      <div className="text-sm text-gray-500">25% des avis</div>
                    </div>
                  </div>
                  <Badge className="bg-purple-500 text-white">Thématique</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="font-medium">Emplacement</div>
                      <div className="text-sm text-gray-500">10% des avis</div>
                    </div>
                  </div>
                  <Badge className="bg-purple-500 text-white">Thématique</Badge>
                </div>
              </div>
            </CardContent>}
        </Card>

        {/* Réponse automatique */}
        <Card className="relative mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-purple-600">
                  <Info className="w-6 h-6" />
                </span>
                <CardTitle className="text-lg">Réponse automatique</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowReponseAuto(!showReponseAuto)} className="h-6 w-6 p-0 hover:bg-purple-50">
                {showReponseAuto ? <ChevronUp className="w-3 h-3 text-purple-600" /> : <ChevronDown className="w-3 h-3 text-purple-600" />}
              </Button>
            </div>
            <p className="text-sm text-gray-500">Système automatisé aux avis clients</p>
          </CardHeader>
          {showReponseAuto && <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Sophie M.</span>
                      <div className="flex items-center ml-2">
                        {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">À valider</Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">"Excellent restaurant, service impeccable et plats délicieux !"</p>
                  <div className="bg-white border-l-4 border-purple-500 p-3 rounded">
                    <p className="text-sm text-gray-600 font-medium mb-1">Réponse automatique proposée :</p>
                    <p className="text-sm text-gray-700">"Merci Sophie pour votre retour positif ! Nous sommes ravis que vous ayez apprécié votre expérience chez nous. Au plaisir de vous revoir bientôt !"</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">Valider</Button>
                    <Button size="sm" variant="outline">Modifier</Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Thomas R.</span>
                      <div className="flex items-center ml-2">
                        {[1, 2].map(star => <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                        {[3, 4, 5].map(star => <Star key={star} className="w-3 h-3 text-gray-300" />)}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">À valider</Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">"Service très lent et plats tièdes à l'arrivée. Déçu de cette expérience."</p>
                  <div className="bg-white border-l-4 border-purple-500 p-3 rounded">
                    <p className="text-sm text-gray-600 font-medium mb-1">Réponse automatique proposée :</p>
                    <p className="text-sm text-gray-700">"Bonjour Thomas, nous vous présentons nos excuses pour cette expérience décevante. Vos remarques sont précieuses et nous allons améliorer nos services. N'hésitez pas à nous recontacter directement."</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">Valider</Button>
                    <Button size="sm" variant="outline">Modifier</Button>
                  </div>
                </div>
              </div>
            </CardContent>}
        </Card>
      </div>
    </div>;
};
export default Dashboard;