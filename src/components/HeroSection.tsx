import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-analytics.jpg";
import { ArrowRight, BarChart3, MessageSquare, TrendingUp } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Analysez vos{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                commentaires Google
              </span>{" "}
              avec l'IA
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Découvrez ce que vos clients pensent vraiment de votre restaurant. 
              Notre IA analyse automatiquement tous vos avis Google pour vous donner 
              des insights précieux et actionables.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="hero" size="lg" className="group">
              Commencer l'analyse
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg">
              Voir la démo
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-8">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium">Analyse automatique</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center mx-auto">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium">Visualisations claires</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center mx-auto">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium">Insights actionables</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-3xl opacity-20 transform rotate-3"></div>
          <img 
            src={heroImage} 
            alt="Dashboard d'analyse des commentaires restaurant"
            className="relative w-full h-auto rounded-2xl shadow-elegant transform hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>
    </section>
  );
};