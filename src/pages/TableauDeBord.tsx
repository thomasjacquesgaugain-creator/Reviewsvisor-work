import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, BarChart3, Clock, TrendingUp, User, LogOut, Home, Building, Target, Bell, MessageCircle, Star, ArrowUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [userProfile, setUserProfile] = useState<{ first_name: string; last_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/auth');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Erreur",
            description: "Impossible de récupérer les informations du profil.",
            variant: "destructive",
          });
        } else {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserProfile();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

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
              <div className="flex items-center gap-2">
                <img 
                  src="/lovable-uploads/08f62503-65d7-4681-8ddf-00f4efb00ffa.png" 
                  alt="Analytique logo" 
                  className="w-8 h-8"
                />
                <span className="text-xl font-bold text-gray-900">analytique</span>
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
              <span className="text-blue-600">analytique</span>
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
            <div className="max-w-3xl mx-auto mb-16">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Notifications</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 border rounded-xl">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">3 nouveaux avis</p>
                      <p className="text-sm text-gray-600">Reçus aujourd'hui</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 border rounded-xl">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                      <ArrowUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Note augmentée de 0,3</p>
                      <p className="text-sm text-gray-600">Cette semaine</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 border rounded-xl">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Moyenne 4,2/5</p>
                      <p className="text-sm text-gray-600">Sur 30 derniers jours</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 border rounded-xl">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">+15% satisfaction</p>
                      <p className="text-sm text-gray-600">Par rapport au mois dernier</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
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