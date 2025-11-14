import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, BarChart3, Clock, TrendingUp, User, LogOut, Home, Building, Target, Bell, MessageCircle, Star, ArrowUp, CheckCircle, ArrowDownRight, Minus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { getBaselineScore, formatDelta, getEvolutionStatus, computeSatisfactionPct, ensureBaselineSatisfaction, computeSatisfactionDelta } from "@/utils/baselineScore";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";
import { getReponsesStats } from "@/lib/reponses";
import { SubscriptionCard } from "@/components/SubscriptionCard";

const Dashboard = () => {
  const [userProfile, setUserProfile] = useState<{ first_name: string; last_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentReviewsCount, setRecentReviewsCount] = useState(0);
  const [lastReviewDate, setLastReviewDate] = useState<Date | null>(null);
  const [validatedResponsesCount, setValidatedResponsesCount] = useState(0);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [totalReviewsForEstablishment, setTotalReviewsForEstablishment] = useState(0);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentEstablishment = useCurrentEstablishment();

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/auth');
          return;
        }

        // Pour l'instant, utiliser les données de base de l'utilisateur
        const profile = {
          first_name: session.user.user_metadata?.first_name || 'Utilisateur',
          last_name: session.user.user_metadata?.last_name || ''
        };

        setUserProfile(profile);

        // Récupérer le nombre d'avis et la date du dernier avis
        const { data: reviews, error } = await supabase
          .from('reviews')
          .select('inserted_at, rating, text, place_id')
          .eq('user_id', session.user.id)
          .order('inserted_at', { ascending: false });

        if (!error && reviews) {
          setRecentReviewsCount(reviews.length);
          setAllReviews(reviews);
          
          if (reviews.length > 0 && reviews[0].inserted_at) {
            setLastReviewDate(new Date(reviews[0].inserted_at));
          }
          
          // Calculer la moyenne des notes
          const ratingsWithValue = reviews.filter(r => r.rating !== null && r.rating !== undefined);
          if (ratingsWithValue.length > 0) {
            const sum = ratingsWithValue.reduce((acc, r) => acc + (r.rating || 0), 0);
            const average = sum / ratingsWithValue.length;
            setAvgRating(average);
          }

          // Si un établissement est sélectionné, utiliser getReponsesStats
          if (currentEstablishment?.place_id && session.user.id) {
            const stats = await getReponsesStats(currentEstablishment.place_id, session.user.id);
            setValidatedResponsesCount(stats.validated);
            setTotalReviewsForEstablishment(stats.total);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserProfile();

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel('reviews-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reviews'
        },
        (payload) => {
          setRecentReviewsCount(prev => prev + 1);
          if (payload.new.inserted_at) {
            setLastReviewDate(new Date(payload.new.inserted_at));
          }
        }
      )
      .subscribe();

    // Écouter les validations de réponses
    const handleResponseValidated = async () => {
      if (!currentEstablishment?.place_id) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Utiliser getReponsesStats pour mettre à jour
      const stats = await getReponsesStats(currentEstablishment.place_id, session.user.id);
      setValidatedResponsesCount(stats.validated);
      setTotalReviewsForEstablishment(stats.total);
    };

    window.addEventListener('response-validated', handleResponseValidated);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('response-validated', handleResponseValidated);
    };
  }, [navigate, toast, currentEstablishment?.place_id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Calcul de l'évolution de la note depuis l'enregistrement (avant le return conditionnel)
  const ratingEvolution = useMemo(() => {
    if (!currentEstablishment?.id || avgRating === 0) {
      return null;
    }
    
    const baseline = getBaselineScore(currentEstablishment.id, avgRating);
    const delta = avgRating - baseline.score;
    const status = getEvolutionStatus(delta);
    const formattedDelta = formatDelta(delta);
    
    return {
      delta,
      formattedDelta,
      status,
      baseline: baseline.score,
      baselineDate: baseline.date,
    };
  }, [currentEstablishment?.id, avgRating]);

  // Calcul de l'évolution de la satisfaction depuis l'enregistrement
  const satisfactionEvolution = useMemo(() => {
    if (!currentEstablishment?.id || allReviews.length === 0) {
      return null;
    }
    
    const currentSatisfactionPct = computeSatisfactionPct(allReviews);
    const baseline = ensureBaselineSatisfaction(currentEstablishment.id, currentSatisfactionPct);
    const delta = computeSatisfactionDelta(currentSatisfactionPct, baseline.percentage);
    
    return {
      delta,
      currentPct: currentSatisfactionPct,
      baselinePct: baseline.percentage,
      baselineDate: baseline.date,
    };
  }, [currentEstablishment?.id, allReviews]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  const displayName = userProfile 
    ? `${userProfile.first_name} ${userProfile.last_name}` 
    : "Utilisateur";

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
              <div className="flex items-center gap-0.5 w-fit">
                <img 
                  src="/lovable-uploads/08f62503-65d7-4681-8ddf-00f4efb00ffa.png" 
                  alt="Logo Reviewsvisor" 
                  className="w-8 h-8 flex-shrink-0"
                />
                <span className="text-[0.95rem] font-bold text-gray-900 whitespace-nowrap">Reviewsvisor</span>
              </div>
              
              <div className="flex items-center gap-4">
                <Link to="/tableau-de-bord" className="text-blue-600 font-medium hover:underline flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Accueil
                </Link>
                <Link to="/dashboard">
                  <Button variant="ghost" className="text-gray-700 flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/etablissement">
                  <Button variant="ghost" className="text-gray-700 flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    Établissement
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-gray-700">
                  <span>Bonjour, {displayName}</span>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-gray-700 flex items-center gap-1"
                  onClick={handleLogout}
                >
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
              <span className="text-blue-600">Reviewsvisor</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Analysez automatiquement vos avis clients pour identifier les problèmes prioritaires et améliorer la satisfaction de votre établissement.
            </p>
          </div>

          {/* Welcome card */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden max-w-3xl mx-auto mb-16">
            <CardContent className="p-8 text-center space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Bienvenue, {displayName} !</h2>
              <p className="text-gray-600">
                Vous êtes connecté et pouvez maintenant analyser vos avis clients.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link to="/etablissement">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium">
                    <Building className="w-5 h-5 mr-2" />
                    Établissement
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="outline" className="border-gray-300 text-gray-700 px-8 py-3 rounded-full font-medium">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Voir mon dashboard
                  </Button>
                </Link>
                </div>
              </CardContent>
            </Card>

            {/* Notifications section */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden max-w-3xl mx-auto mb-16">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">Notifications</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 border rounded-xl">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center border-2 border-blue-300 shadow-md">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {recentReviewsCount} {recentReviewsCount <= 1 ? 'avis' : 'avis'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {lastReviewDate 
                            ? `Reçus ${formatDistanceToNow(lastReviewDate, { addSuffix: true, locale: fr })}`
                            : 'Aucun avis pour le moment'
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`border rounded-xl ${
                      !ratingEvolution 
                        ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
                        : ratingEvolution.status === 'decrease'
                          ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'
                          : 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
                    }`}
                    title={
                      ratingEvolution 
                        ? `Baseline : ${ratingEvolution.baseline.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} fixée le ${format(new Date(ratingEvolution.baselineDate), 'dd/MM/yyyy', { locale: fr })}`
                        : undefined
                    }
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-md ${
                          !ratingEvolution
                            ? 'bg-green-600 border-green-300'
                            : ratingEvolution.status === 'decrease'
                              ? 'bg-red-600 border-red-300'
                              : 'bg-green-600 border-green-300'
                        }`}
                      >
                        {!ratingEvolution ? (
                          <ArrowUp className="w-5 h-5 text-white" />
                        ) : ratingEvolution.status === 'decrease' ? (
                          <ArrowDownRight className="w-5 h-5 text-white" />
                        ) : (
                          <ArrowUp className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {!ratingEvolution 
                            ? 'Note'
                            : ratingEvolution.status === 'increase'
                              ? `Augmentée de ${ratingEvolution.formattedDelta}`
                              : ratingEvolution.status === 'decrease'
                                ? `Baisse de ${ratingEvolution.formattedDelta}`
                                : `Stable (${ratingEvolution.formattedDelta})`
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          {!ratingEvolution ? 'En attente de données' : 'depuis l\'enregistrement'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 border rounded-xl">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center border-2 border-yellow-300 shadow-md">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {validatedResponsesCount}/{totalReviewsForEstablishment || recentReviewsCount} réponses
                        </p>
                        <p className="text-sm text-gray-600">Validées</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 border rounded-xl"
                    title={
                      satisfactionEvolution 
                        ? `Baseline : ${satisfactionEvolution.baselinePct}% fixée le ${format(new Date(satisfactionEvolution.baselineDate), 'dd/MM/yyyy', { locale: fr })}`
                        : undefined
                    }
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center border-2 border-purple-300 shadow-md">
                        <ArrowUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {!satisfactionEvolution 
                            ? 'Satisfaction'
                            : `Satisfaction +${satisfactionEvolution.delta}%`
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          {!satisfactionEvolution ? 'En attente d\'avis' : 'depuis l\'enregistrement'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

          {/* Subscription Card */}
          <div className="max-w-3xl mx-auto mb-16">
            <SubscriptionCard />
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Analyse IA avancée</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Détection automatique des thématiques, sentiments et mentions fréquentes dans vos avis
                </p>
              </CardContent>
            </Card>
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