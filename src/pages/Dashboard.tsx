import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, User, LogOut, Home, Eye, Trash2, AlertTriangle, CheckCircle, Lightbulb, Target, ChevronDown, ChevronUp, ChevronRight, Building2, Star, UtensilsCrossed, Wine, Users, MapPin, Clock, MessageSquare, Info } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentPlace } from "@/lib/currentPlace";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Area } from 'recharts';

type Summary = {
  overall_rating: number | null;
  positive_pct: number | null;
  negative_pct: number | null;
  counts?: { total?: number };
  top_issues?: { label: string; why?: string }[];
  top_strengths?: { label: string; why?: string }[];
  recommendations?: string[];
};

const Dashboard = () => {
  const location = useLocation();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [lastAt, setLastAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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

  const placeId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('place_id') || getCurrentPlace()?.place_id || null;
  }, [location.search]);

  useEffect(() => {
    (async () => {
      if (!placeId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('review_insights')
        .select('avg_rating,positive_ratio,total_count,top_issues,top_praises,updated_at')
        .eq('place_id', placeId)
        .maybeSingle();
      if (!error && data) {
        const mappedSummary: Summary = {
          overall_rating: data.avg_rating,
          positive_pct: data.positive_ratio ? Math.round(data.positive_ratio * 100) : null,
          negative_pct: data.positive_ratio ? Math.round((1 - data.positive_ratio) * 100) : null,
          counts: { total: data.total_count || 0 },
          top_issues: (data.top_issues as any[]) || [],
          top_strengths: (data.top_praises as any[]) || [],
          recommendations: []
        };
        setSummary(mappedSummary);
        setLastAt(data.updated_at ?? null);
      } else {
        setSummary(null);
        setLastAt(null);
      }
      setLoading(false);
    })();
  }, [placeId]);

  // Données mockées pour le diagramme de Pareto des problèmes
  const paretoData = [
    { name: "Service lent", count: 45, percentage: 32.1, cumulative: 32.1 },
    { name: "Nourriture froide", count: 38, percentage: 27.1, cumulative: 59.2 },
    { name: "Attente longue", count: 25, percentage: 17.9, cumulative: 77.1 },
    { name: "Personnel impoli", count: 18, percentage: 12.9, cumulative: 90.0 },
    { name: "Prix élevés", count: 8, percentage: 5.7, cumulative: 95.7 },
    { name: "Autres", count: 6, percentage: 4.3, cumulative: 100.0 }
  ];

  // Données mockées pour le diagramme de Pareto des points forts
  const paretoPointsData = [
    { name: "Qualité nourriture", count: 52, percentage: 35.4, cumulative: 35.4 },
    { name: "Service rapide", count: 41, percentage: 27.9, cumulative: 63.3 },
    { name: "Ambiance agréable", count: 28, percentage: 19.0, cumulative: 82.3 },
    { name: "Prix abordables", count: 15, percentage: 10.2, cumulative: 92.5 },
    { name: "Personnel aimable", count: 7, percentage: 4.8, cumulative: 97.3 },
    { name: "Autres", count: 4, percentage: 2.7, cumulative: 100.0 }
  ];

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

  if (!placeId) {
    return (
      <div className="min-h-screen bg-gray-50">
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
        
        <div className="container mx-auto px-4 py-8">
          <div className="p-6">
            <div className="mb-2 font-semibold">Aucun établissement sélectionné</div>
            <div className="text-sm text-muted-foreground">Allez sur la page Établissement, choisissez un lieu puis cliquez "Analyser cet établissement".</div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
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
      
      <div className="container mx-auto px-4 py-8">
        <div className="p-6">Chargement des analyses…</div>
      </div>
    </div>
  );

  if (!summary) return (
    <div className="min-h-screen bg-gray-50">
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
      
      <div className="container mx-auto px-4 py-8">
        <div className="p-6">Aucune analyse trouvée pour cet établissement.</div>
      </div>
    </div>
  );

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
        <div className="p-4 space-y-6">
          <div className="text-sm text-muted-foreground">
            Établissement: {placeId} {lastAt ? `• Dernière analyse: ${new Date(lastAt).toLocaleString()}` : ''}
          </div>

        {/* Métriques */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="relative">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold">{summary.overall_rating?.toFixed(1) || '—'}</span>
              </div>
              <p className="text-sm text-gray-600">Note moyenne</p>
              <p className="text-xs text-gray-500">Basée sur {summary.counts?.total || 0} avis</p>
              <Button variant="ghost" size="sm" onClick={() => setShowCourbeNote(!showCourbeNote)} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-yellow-50">
                {showCourbeNote ? <ChevronUp className="w-3 h-3 text-yellow-600" /> : <ChevronDown className="w-3 h-3 text-yellow-600" />}
              </Button>
            </CardContent>
          </Card>

          <Card className="relative">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="text-2xl font-bold text-blue-600">{summary.counts?.total || 0}</span>
                <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
              </div>
              <p className="text-sm text-gray-600">Total avis</p>
              <p className="text-xs text-gray-500">Échantillon collecté</p>
              <Button variant="ghost" size="sm" onClick={() => setShowPlateformes(!showPlateformes)} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-blue-50">
                {showPlateformes ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />}
              </Button>
            </CardContent>
          </Card>

          <Card className="relative">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="text-2xl font-bold text-green-600">{summary.positive_pct || 0}%</span>
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
                  <div className="text-2xl font-bold">{summary.negative_pct || 0}%</div>
                  <div className="text-xs text-gray-400">avis négatifs</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAvisNegatifs(!showAvisNegatifs)} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-red-50">
                {showAvisNegatifs ? <ChevronUp className="w-3 h-3 text-red-600" /> : <ChevronDown className="w-3 h-3 text-red-600" />}
              </Button>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>;
};

export default Dashboard;