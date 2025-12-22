import logoReviewsvisor from "@/assets/logo-reviewsvisor.png";
import BackArrow from "@/components/BackArrow";
import { Badge } from "@/components/ui/badge";
import { Eye, Target, Cpu, Lightbulb, CheckCircle2, Sparkles, Building2 } from "lucide-react";

const APropos = () => {
  return (
    <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-background via-background to-primary/5">
      {/* Subtle noise/grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      <BackArrow />
      
      <main className="flex-1 relative z-10">
        {/* HERO SECTION */}
        <section className="pt-12 pb-16 px-4 md:px-8 bg-gradient-to-b from-primary/5 via-transparent to-transparent">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Notre vision
            </Badge>
            
            {/* Title */}
            <h1 className="flex items-center justify-center gap-3 text-3xl md:text-4xl lg:text-5xl font-bold mb-8 text-foreground tracking-tight">
              À propos de 
              <span className="text-primary">Reviewsvisor</span>
              <img src={logoReviewsvisor} alt="Logo Reviewsvisor" className="h-8 w-8 md:h-10 md:w-10 object-contain" />
            </h1>
            
            {/* Intro text */}
            <div className="max-w-2xl mx-auto space-y-4 text-lg md:text-xl text-muted-foreground leading-relaxed mb-12">
              <p className="flex items-center justify-center gap-2">
                <span className="text-blue">Reviewsvisor</span> est une plateforme d'analyse intelligente des avis clients.
              </p>
              
              <p>
                <span className="text-green">Un outil, une centralisation</span> pour votre établissement qui transforme <span className="text-green">vos retours en conception</span>.
              </p>
            </div>
            
            {/* Vision cards */}
            <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-xl mx-auto">
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <Eye className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Vision</p>
              </div>
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <Target className="w-5 h-5 text-success mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Mission</p>
              </div>
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <Cpu className="w-5 h-5 text-accent mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Technologie</p>
              </div>
            </div>
          </div>
        </section>

        {/* INTRO SECTION */}
        <section className="py-12 md:py-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex gap-4">
                <div className="hidden sm:block w-1 bg-gradient-to-b from-success to-success/30 rounded-full shrink-0" />
                <div className="flex-1 space-y-4 text-base md:text-lg text-muted-foreground leading-relaxed">
                  <p>
                    Notre technologie transforme vos avis clients en insights précis pour vous aider à améliorer l'expérience, augmenter votre note en ligne et optimiser vos services au sein de votre établissement, <span className="text-green">vos avis deviennent maintenant une source de croissance</span>.
                  </p>
                  
                  <p>
                    Restaurants, hôtels, commerces : <span className="text-green">prenez les meilleures décisions grâce à vos propres données</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MISSION SECTION */}
        <section className="py-12 md:py-16 px-4 md:px-8 bg-gradient-to-b from-transparent via-secondary/30 to-transparent">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-10 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex gap-4">
                <div className="hidden sm:block w-1.5 bg-gradient-to-b from-primary to-primary/30 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground">Notre mission</h2>
                  </div>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-prose">
                    Chez <span className="text-blue">Reviewsvisor</span>, notre objectif est simple : aider chaque établissement à comprendre ce que ressentent réellement ses clients. Nous croyons que chaque <span className="text-green">avis contient une opportunité d'évolution</span>, et que les données bien analysées peuvent devenir un véritable <span className="text-green">moteur de croissance</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY SECTION */}
        <section className="py-12 md:py-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-success" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Pourquoi nous avons créé <span className="text-blue">Reviewsvisor</span>
              </h2>
            </div>
            
            {/* Intro card */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm mb-6">
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Les restaurateurs, hôteliers et commerçants reçoivent chaque jour des avis, mais ont rarement le temps de les analyser en profondeur. Les plateformes sont nombreuses, les commentaires s'accumulent, et il devient difficile d'identifier rapidement ce qui fonctionne… ou ce qui doit être amélioré.
              </p>
            </div>
            
            {/* Principles intro */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm">
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
                C'est pour résoudre ce problème que <span className="text-blue">Reviewsvisor</span> a été conçu :
              </p>
              
              {/* Principles list */}
              <div className="grid gap-3">
                <div className="flex items-center gap-4 p-4 bg-secondary/40 rounded-xl border border-border/40 hover:bg-secondary/60 transition-colors duration-200">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-foreground font-medium">👉 Un outil simple,</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-secondary/40 rounded-xl border border-border/40 hover:bg-secondary/60 transition-colors duration-200">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  <span className="text-foreground font-medium">👉 Une analyse intelligente,</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-secondary/40 rounded-xl border border-border/40 hover:bg-secondary/60 transition-colors duration-200">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span className="text-foreground font-medium">👉 Une vision claire,</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-secondary/40 rounded-xl border border-border/40 hover:bg-secondary/60 transition-colors duration-200">
                  <CheckCircle2 className="w-5 h-5 text-warning shrink-0" />
                  <span className="text-foreground font-medium">👉 Et des actions concrètes.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TECHNOLOGY SECTION */}
        <section className="py-12 md:py-16 px-4 md:px-8 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-primary/20 rounded-2xl p-6 md:p-10 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden">
              {/* Subtle tech pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Notre technologie</h2>
                </div>
                
                <div className="space-y-4 text-base md:text-lg text-muted-foreground leading-relaxed">
                  <p>
                    <span className="text-blue">Reviewsvisor</span> utilise un modèle d'analyse avancé capable de comprendre le ton, l'émotion et les sujets importants dans chaque commentaire. L'outil identifie automatiquement les tendances, détecte les points forts récurrents et met en avant les <span className="text-green">axes d'amélioration prioritaires</span>.
                  </p>
                  
                  <p>
                    Plus qu'un simple tableau de bord, <span className="text-blue">Reviewsvisor</span> est un véritable <span className="text-green">assistant d'amélioration continue</span> pour votre établissement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PLATFORM SECTION */}
        <section className="py-16 md:py-24 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8 justify-center">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Une plateforme pensée pour vous</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Text card */}
              <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  Que vous soyez un restaurant, un hôtel ou un commerce, <span className="text-blue">Reviewsvisor</span> s'adapte à votre quotidien. Notre interface a été conçue pour être intuitive, rapide et efficace, même pour les utilisateurs les moins technophiles.
                </p>
              </div>
              
              {/* Visual placeholder card */}
              <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-success/10 border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-card/80 border border-border/50 flex items-center justify-center shadow-sm">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Interface intuitive</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Simple • Rapide • Efficace</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default APropos;