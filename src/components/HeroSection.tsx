import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, Target, TrendingUp, CheckCircle, Zap, Shield } from "lucide-react";
import logoHeader from "@/assets/reviewsvisor-logo-header.png";

export const HeroSection = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with organic shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100">
        <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-orange-200 to-yellow-200 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-gradient-to-bl from-blue-300 to-cyan-300 rounded-full blur-2xl opacity-25"></div>
      </div>

      <div className="relative z-10">
        {/* Trust indicators bar */}
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full mx-4 mt-6 shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-700">Transformer retour en conception</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-700">Vos avis, votre croissance</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-700">Un outil, une centralisation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Brand header - Large version */}
        <div className="flex items-center justify-center pt-6 pb-2">
          <img 
            src={logoHeader} 
            alt="Reviewsvisor Logo" 
            className="h-[90px] w-auto mt-4 -mr-2"
            style={{ filter: 'brightness(0) saturate(100%) invert(38%) sepia(89%) saturate(2475%) hue-rotate(214deg) brightness(101%) contrast(101%)' }}
          />
          <span className="text-[#2F6BFF] text-[48px] font-bold leading-none">
            Reviewsvisor
          </span>
        </div>


        {/* Main hero card */}
        <div className="container mx-auto px-4 pt-6 pb-16">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden max-w-3xl mx-auto mb-12">
            <CardContent className="p-8 text-center space-y-6">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                ⚡ Prêt à révolutionner votre établissement ?
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                Rejoignez des centaines de restaurateurs qui ont déjà{" "}
                <span className="text-green-600 font-semibold">augmenté leur note de 0.5 à 1 point</span>{" "}
                en quelques semaines grâce à nos insights précis et actionnables.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-medium"
                  onClick={() => window.location.href = '/onboarding'}
                >
                  <span>✨</span>
                  Commencer gratuitement maintenant
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border text-foreground px-8 py-3 rounded-full font-medium"
                  onClick={() => window.location.href = '/login'}
                >
                  <span>👤</span>
                  J&apos;ai déjà un compte
                </Button>
              </div>

              {/* Trust indicators bottom */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Transformer retour en conception</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Vos avis, votre croissance</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Un outil, une centralisation</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">IA GPT-4 Ultra-Intelligente</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  La même IA que ChatGPT analyse vos avis avec une précision chirurgicale. 
                  Détecte les émotions cachées et les problèmes récurrents que vous ne voyez pas.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Actions Prioritaires Précises</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Plus de devinettes ! Obtenez un plan d'action concret avec les 3 problèmes à résoudre en 
                  priorité pour maximiser votre impact sur la satisfaction client.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Suivi Évolution Temps Réel</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Visualisez l'impact de vos améliorations avec des graphiques évolutifs et 
                  des alertes intelligentes quand de nouveaux problèmes émergent.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Why section */}
          <Card className="bg-blue-600 text-white border-0 shadow-xl rounded-3xl overflow-hidden max-w-4xl mx-auto">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💡</span>
                </div>
                <h2 className="text-2xl font-bold">Pourquoi <span translate="no">Reviewsvisor</span> fonctionne ?</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-1">⚡</span>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Rapidité Extrême</h3>
                      <p className="text-blue-100 text-sm leading-relaxed">
                        Analysez 1000 avis en 30 secondes. Plus besoin de passer des heures à lire et classer vos avis manuellement.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-1">📈</span>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Résultat immédiat</h3>
                      <p className="text-blue-100 text-sm leading-relaxed">
                        Chaque utilisateur qui utilise <span translate="no">Reviewsvisor</span> voit sa note augmenter de 0.5 à 1 point en moyenne chaque semaine.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-1">🔬</span>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Précision chirurgicale</h3>
                      <p className="text-blue-100 text-sm leading-relaxed">
                        <span translate="no">Reviewsvisor</span> analyse chaque mot, chaque émotion, chaque nuance pour vous donner des insights précis.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-1">🔒</span>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Sécurité Totale</h3>
                      <p className="text-blue-100 text-sm leading-relaxed">
                        Vos données sont protégées et isolées. Chaque utilisateur a son propre espace sécurisé et privé.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};