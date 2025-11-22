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
        <div className="flex items-center justify-center pt-2 pb-0">
          <img 
            src={logoHeader} 
            alt="Reviewsvisor Logo" 
            className="h-[90px] w-auto -mr-2 mt-4"
            style={{ filter: 'brightness(0) saturate(100%) invert(38%) sepia(89%) saturate(2475%) hue-rotate(214deg) brightness(101%) contrast(101%)' }}
          />
          <span className="text-[#2F6BFF] text-[48px] font-bold leading-none">
            Reviewsvisor
          </span>
        </div>


        {/* Main hero card */}
        <div className="container mx-auto px-4 pt-2 pb-16">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden max-w-3xl mx-auto mb-12">
            <CardContent className="p-8 text-center space-y-6">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                ⚡ Prêt à révolutionner votre établissement ?
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                Obtenez une <span className="font-semibold" style={{ color: '#2ECC71' }}>vision claire</span> des priorités en transformant leurs avis en véritables <span className="font-semibold" style={{ color: '#2ECC71' }}>leviers de croissance</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-medium"
                  onClick={() => window.location.href = '/onboarding'}
                >
                  <span>✨</span>
                  Commencer maintenant
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
            <h3 className="text-xl font-bold text-gray-900">Centralisation & Analyse Essentielle</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              <span style={{ color: '#23C55E' }}>Un outil</span>, <span style={{ color: '#23C55E' }}>une centralisation</span> pour votre établissement qui transforme vos <span style={{ color: '#23C55E' }}>retours en conception</span>.
              Avec Reviewsvisor, vos retours clients deviennent une véritable <span style={{ color: '#23C55E' }}>source de croissance</span>.
            </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-red-600" />
                </div>
            <h3 className="text-xl font-bold text-gray-900">Pourquoi les avis comptent vraiment</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              <span style={{ color: '#23C55E' }}>Parce qu&apos;un avis n&apos;est pas qu&apos;un commentaire</span> :<br />
              ➡️ <span style={{ color: '#2563EB' }}>94%</span> des clients consultent les avis avant de choisir un établissement.<br />
              ➡️ <span style={{ color: '#2563EB' }}>86%</span> hésitent à acheter auprès d&apos;un établissement avec des avis négatifs.
            </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
            <h3 className="text-xl font-bold text-gray-900">Décisions Basées sur Vos Données</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Nous croyons que chaque avis contient <span style={{ color: '#23C55E' }}>une opportunité d&apos;évolution</span> – et que des données bien analysées deviennent <span style={{ color: '#23C55E' }}>un véritable moteur de croissance</span>.<br /><br />
              Prenez des <span style={{ color: '#23C55E' }}>décisions stratégiques basées sur vos propres données</span>.
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
                    <div>
                      <h3 className="text-lg font-semibold mb-2">⚡ Analyse éclair</h3>
                      <p className="text-blue-100 text-sm leading-relaxed">
                        Reviewsvisor transforme vos avis en insights en quelques secondes, vous permettant de prendre des décisions rapides et fiables.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">🎯 Actionnable immédiatement</h3>
                      <p className="text-blue-100 text-sm leading-relaxed">
                        Reviewsvisor ne se contente pas d&apos;identifier des problèmes… il propose les solutions.<br />
                        Des priorités claires. Des résultats mesurables.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">🧠 Analyse Ultra-Précise</h3>
                      <p className="text-blue-100 text-sm leading-relaxed">
                        L&apos;IA détecte émotions, problèmes récurrents et opportunités d&apos;amélioration avec une précision exceptionnelle.<br />
                        Elle met en lumière les signaux faibles et ce qui compte réellement pour vos clients.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">📈 Croissance Mesurable</h3>
                      <p className="text-blue-100 text-sm leading-relaxed">
                        Reviewsvisor vous aide à augmenter votre note en ligne, attirer davantage de clients et améliorer vos revenus.<br />
                        Les établissements utilisant l&apos;analyse intelligente :<br />
                        • ✅ voient jusqu&apos;à +25% d&apos;avis positifs,<br />
                        • 📊 génèrent en moyenne +10% à +20% de chiffre d&apos;affaires,<br />
                        • ⭐ gagnent +0.5 à +1 point de note en quelques semaines.
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