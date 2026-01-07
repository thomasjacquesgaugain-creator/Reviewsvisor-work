import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, BarChart3, Clock, TrendingUp, User, LogOut, Home, Building, Target, Bell, MessageCircle, Star, ArrowUp, CheckCircle, ArrowDownRight, Minus, Award } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { fr, enUS, it, es, ptBR } from "date-fns/locale";
import { getBaselineScore, formatDelta, getEvolutionStatus, computeSatisfactionPct, ensureBaselineSatisfaction, computeSatisfactionDelta } from "@/utils/baselineScore";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";
import { getReponsesStats } from "@/lib/reponses";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { useTranslation } from "react-i18next";


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
  const { t, i18n } = useTranslation();

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

        // Si aucun établissement n'est sélectionné, réinitialiser les données
        if (!currentEstablishment?.place_id) {
          setRecentReviewsCount(0);
          setAllReviews([]);
          setLastReviewDate(null);
          setAvgRating(0);
          setValidatedResponsesCount(0);
          setTotalReviewsForEstablishment(0);
          setLoading(false);
          return;
        }

        // Récupérer les avis UNIQUEMENT pour l'établissement actif
        const { data: reviews, error } = await supabase
          .from('reviews')
          .select('inserted_at, rating, text, place_id')
          .eq('user_id', session.user.id)
          .eq('place_id', currentEstablishment.place_id) // ← Filtrer par place_id de l'établissement actif
          .order('inserted_at', { ascending: false });

        if (!error && reviews) {
          setRecentReviewsCount(reviews.length);
          setAllReviews(reviews);
          
          if (reviews.length > 0 && reviews[0].inserted_at) {
            setLastReviewDate(new Date(reviews[0].inserted_at));
          } else {
            setLastReviewDate(null);
          }
          
          // Calculer la moyenne des notes pour CET établissement
          const ratingsWithValue = reviews.filter(r => r.rating !== null && r.rating !== undefined);
          if (ratingsWithValue.length > 0) {
            const sum = ratingsWithValue.reduce((acc, r) => acc + (r.rating || 0), 0);
            const average = sum / ratingsWithValue.length;
            setAvgRating(average);
          } else {
            setAvgRating(0);
          }

          // Utiliser getReponsesStats pour les réponses validées
          if (currentEstablishment.place_id && session.user.id) {
            const stats = await getReponsesStats(currentEstablishment.place_id, session.user.id);
            setValidatedResponsesCount(stats.validated);
            setTotalReviewsForEstablishment(stats.total);
          }
        } else if (error) {
          console.error('Error fetching reviews:', error);
          setRecentReviewsCount(0);
          setAllReviews([]);
          setAvgRating(0);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserProfile();

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

    // S'abonner aux changements en temps réel UNIQUEMENT pour l'établissement actif
    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (currentEstablishment?.place_id) {
      channel = supabase
        .channel(`reviews-changes-${currentEstablishment.place_id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'reviews',
            filter: `place_id=eq.${currentEstablishment.place_id}` // ← Filtrer par place_id
          },
          (payload) => {
            // Vérifier que le nouvel avis appartient bien à l'établissement actif
            if (payload.new.place_id === currentEstablishment.place_id) {
              setRecentReviewsCount(prev => prev + 1);
              if (payload.new.inserted_at) {
                setLastReviewDate(new Date(payload.new.inserted_at));
              }
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('response-validated', handleResponseValidated);
    };
  }, [navigate, currentEstablishment?.place_id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Calcul de l'évolution de la note depuis l'enregistrement (avant le return conditionnel)
  const ratingEvolution = useMemo(() => {
    if (!currentEstablishment?.place_id || avgRating === 0 || allReviews.length === 0) {
      return null;
    }
    
    const baseline = getBaselineScore(currentEstablishment.place_id, avgRating);
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
  }, [currentEstablishment?.place_id, avgRating, allReviews.length]);

  // Calcul de l'évolution de la satisfaction depuis l'enregistrement
  const satisfactionEvolution = useMemo(() => {
    if (!currentEstablishment?.place_id || allReviews.length === 0) {
      return null;
    }
    
    const currentSatisfactionPct = computeSatisfactionPct(allReviews);
    const baseline = ensureBaselineSatisfaction(currentEstablishment.place_id, currentSatisfactionPct);
    const delta = computeSatisfactionDelta(currentSatisfactionPct, baseline.percentage);
    
    return {
      delta,
      currentPct: currentSatisfactionPct,
      baselinePct: baseline.percentage,
      baselineDate: baseline.date,
    };
  }, [currentEstablishment?.place_id, allReviews]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t("common.loading")}</div>
      </div>
    );
  }

  const displayName = userProfile 
    ? `${userProfile.first_name} ${userProfile.last_name}` 
    : t("dashboard.user");

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with organic shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100">
        <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-orange-200 to-yellow-200 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-gradient-to-bl from-blue-300 to-cyan-300 rounded-full blur-2xl opacity-25"></div>
      </div>

      <div className="relative z-10">
        {/* Main content */}
        <div className="container mx-auto px-4 pt-8 pb-10">
          {/* Welcome card */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden max-w-3xl mx-auto mb-6">
            <CardContent className="p-8 text-center space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">{t("dashboard.welcomeWithName", { name: displayName })}</h2>
              {currentEstablishment?.name && (
                <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold">
                  <Building className="w-5 h-5" />
                  <span>{currentEstablishment.name}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link to="/etablissement">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium">
                    <Building className="w-5 h-5 mr-2" />
                    {t("nav.establishment")}
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="outline" className="border-gray-300 text-gray-700 px-8 py-3 rounded-full font-medium">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    {t("dashboard.viewDashboard")}
                  </Button>
                </Link>
                </div>
              </CardContent>
            </Card>

            {/* Notifications section */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden max-w-3xl mx-auto mb-4">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">{t("dashboard.notifications")}</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 border rounded-xl">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center border-2 border-blue-300 shadow-md">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {recentReviewsCount} {t("dashboard.reviews")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {lastReviewDate 
                            ? t("dashboard.reviewsReceived", { 
                                time: formatDistanceToNow(lastReviewDate, { 
                                  addSuffix: true, 
                                  locale: i18n.language === 'fr' ? fr : 
                                         i18n.language === 'en' ? enUS :
                                         i18n.language === 'it' ? it :
                                         i18n.language === 'es' ? es :
                                         i18n.language === 'pt' ? ptBR : enUS
                                }) 
                              })
                            : t("dashboard.noReviewsYet")
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
                        ? t("dashboard.baselineInfo", { 
                            value: ratingEvolution.baseline.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'it' ? 'it-IT' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'pt' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }), 
                            date: format(new Date(ratingEvolution.baselineDate), 'dd/MM/yyyy', { 
                              locale: i18n.language === 'fr' ? fr : 
                                     i18n.language === 'it' ? it :
                                     i18n.language === 'es' ? es :
                                     i18n.language === 'pt' ? ptBR : enUS
                            })
                          })
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
                            ? t("dashboard.rating")
                            : ratingEvolution.status === 'increase'
                              ? t("dashboard.ratingIncreased", { delta: ratingEvolution.formattedDelta })
                              : ratingEvolution.status === 'decrease'
                                ? t("dashboard.ratingDecreased", { delta: ratingEvolution.formattedDelta })
                                : t("dashboard.ratingStable", { delta: ratingEvolution.formattedDelta })
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          {!ratingEvolution ? t("dashboard.waitingForData") : t("dashboard.sinceRegistration")}
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
                          {t("dashboard.responsesCount", { validated: validatedResponsesCount, total: totalReviewsForEstablishment || recentReviewsCount })}
                        </p>
                        <p className="text-sm text-gray-600">{t("dashboard.validated")}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 border rounded-xl"
                    title={
                      satisfactionEvolution 
                        ? t("dashboard.baselineInfo", { 
                            value: `${satisfactionEvolution.baselinePct}%`, 
                            date: format(new Date(satisfactionEvolution.baselineDate), 'dd/MM/yyyy', { 
                              locale: i18n.language === 'fr' ? fr : 
                                     i18n.language === 'it' ? it :
                                     i18n.language === 'es' ? es :
                                     i18n.language === 'pt' ? ptBR : enUS
                            })
                          })
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
                            ? t("dashboard.satisfaction")
                            : t("dashboard.satisfactionIncreased", { delta: satisfactionEvolution.delta })
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          {!satisfactionEvolution ? t("dashboard.waitingForReviews") : t("dashboard.sinceRegistration")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto pt-6 pb-0">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{t("dashboard.globalPerformance")}</h3>
                
                {/* Badge central */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 bg-emerald-500 rounded-full px-5 py-3 shadow-md">
                    <Award className="w-5 h-5 text-white" />
                    <span className="text-amber-300 text-lg">★</span>
                    <span className="text-white font-semibold text-base">{t("dashboard.good")}</span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t("dashboard.basedOnRating")}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{t("dashboard.satisfactionIndex")}</h3>
                
                {/* Badge central */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 bg-blue-500 rounded-full px-5 py-3 shadow-md">
                    <Star className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold text-base">78%</span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t("dashboard.identifyProblems")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{t("dashboard.perceivedValue")}</h3>
                
                {/* Badge central */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 bg-amber-500 rounded-full px-5 py-3 shadow-md">
                    <TrendingUp className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold text-base">{t("dashboard.high")}</span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t("dashboard.calculateScore")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{t("dashboard.deliveredExperience")}</h3>
                
                {/* Badge central */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 bg-violet-500 rounded-full px-5 py-3 shadow-md">
                    <Clock className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold text-base">{t("dashboard.smooth")}</span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t("dashboard.summaryRecommendations")}
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