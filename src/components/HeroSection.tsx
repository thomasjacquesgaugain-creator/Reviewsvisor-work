import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, Target, TrendingUp, CheckCircle, Zap, Shield, BarChart3 } from "lucide-react";

export const HeroSection = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Trust indicators */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Aucune carte de crédit requise</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Analyse gratuite</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Résultats en 30 secondes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main hero content */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 max-w-4xl mx-auto mb-16">
          <Badge variant="secondary" className="mx-auto">
            <Zap className="w-4 h-4 mr-2" />
            Prêt à révolutionner votre établissement ?
          </Badge>
          
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
            Analysez vos{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              commentaires Google
            </span>{" "}
            avec l'IA
          </h1>
          
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Rejoignez des centaines de restaurateurs qui ont déjà{" "}
            <span className="text-success font-semibold">augmenté leur note de 0.5 à 1 point</span>{" "}
            en quelques semaines grâce à nos insights précis et actionnables.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button variant="hero" size="lg" className="group">
              <ArrowRight className="w-5 h-5 mr-2" />
              Commencer gratuitement maintenant
            </Button>
            <Button variant="outline" size="lg">
              J'ai déjà un compte
            </Button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="relative overflow-hidden border-0 shadow-elegant bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">IA GPT-4 Ultra-Intelligente</h3>
              <p className="text-muted-foreground">
                La même IA que ChatGPT analyse vos avis avec une précision chirurgicale. 
                Détecte les émotions cachées et les problèmes récurrents que vous ne voyez pas.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-elegant bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Actions Prioritaires Précises</h3>
              <p className="text-muted-foreground">
                Plus de devinettes ! Obtenez un plan d'action concret avec les 3 problèmes à résoudre en 
                priorité pour maximiser votre impact sur la satisfaction client.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-elegant bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 bg-success rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Suivi Évolution Temps Réel</h3>
              <p className="text-muted-foreground">
                Visualisez l'impact de vos améliorations avec des graphiques évolutifs et 
                des alertes intelligentes quand de nouveaux problèmes émergent.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Why section */}
        <Card className="bg-gradient-primary text-white border-0 shadow-glow">
          <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4">Pourquoi ReviewRadar fonctionne ?</h2>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Rapidité Extrême
                </h3>
                <p className="text-white/90">
                  Analysez 1000 avis en 30 secondes. Plus besoin de passer des heures à lire et classer vos avis manuellement.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Sécurité Totale
                </h3>
                <p className="text-white/90">
                  Vos données sont protégées et isolées. Chaque utilisateur a son propre espace sécurisé et privé.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};