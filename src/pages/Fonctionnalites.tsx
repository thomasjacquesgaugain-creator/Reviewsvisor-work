import logoReviewsvisor from "@/assets/logo-reviewsvisor.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Sparkles, TrendingUp, Bell, BarChart3, Target, Eye, Globe, FileText, Users } from "lucide-react";
import BackArrow from "@/components/BackArrow";
import { Badge } from "@/components/ui/badge";

const Fonctionnalites = () => {
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
        <section className="pt-12 pb-6 px-4 md:px-8 bg-gradient-to-b from-primary/5 via-transparent to-transparent">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              IA • Insights • Action
            </Badge>
            
            {/* Title */}
            <h1 className="flex items-center justify-center gap-3 text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground tracking-tight">
              Fonctionnalités de 
              <span className="text-primary">Reviewsvisor</span>
              <img src={logoReviewsvisor} alt="Logo Reviewsvisor" className="h-8 w-8 md:h-10 md:w-10 object-contain" />
            </h1>
            
            {/* Subtitle */}
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
              Transformez vos avis clients en insights stratégiques grâce à une analyse IA avancée
            </p>
            
            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-4 md:gap-6 mt-10 max-w-xl mx-auto">
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm">
                <BarChart3 className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Avis analysés</p>
                <p className="text-lg font-bold text-foreground">—</p>
              </div>
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm">
                <Target className="w-5 h-5 text-success mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Thèmes détectés</p>
                <p className="text-lg font-bold text-foreground">—</p>
              </div>
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm">
                <Bell className="w-5 h-5 text-warning mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Alertes</p>
                <p className="text-lg font-bold text-foreground">—</p>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN FEATURES SECTION */}
        <section className="pt-8 pb-16 md:pt-10 md:pb-20 px-4 md:px-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Feature Card 1 */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex gap-4">
                <div className="hidden sm:block w-1 bg-gradient-to-b from-primary to-primary/30 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Eye className="w-5 h-5 text-primary" />
                    <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                      Voyez votre réputation autrement
                    </h2>
                  </div>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-prose">
                    Derrière chaque note, il y a une émotion. <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> <span style={{color:"#3FB27F"}}>capte ces nuances pour vous offrir une lecture humaine</span> de votre réputation. Vous découvrez enfin ce que vos clients ressentent vraiment.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex gap-4">
                <div className="hidden sm:block w-1 bg-gradient-to-b from-success to-success/30 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-5 h-5 text-success" />
                    <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                      Une intelligence qui comprend vos clients
                    </h2>
                  </div>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-prose">
                    Notre IA lit les avis comme une personne : elle repère le ton, le choix des mots, les émotions et les thèmes dominants. <span style={{color:"#3FB27F"}}>Elle transforme le bruit des commentaires en une vision claire</span> de votre image.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex gap-4">
                <div className="hidden sm:block w-1 bg-gradient-to-b from-primary to-primary/30 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="w-5 h-5 text-primary" />
                    <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                      Des pistes d'action claires
                    </h2>
                  </div>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-prose">
                    <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> ne se contente pas d'analyser : il vous montre où agir. En quelques secondes, <span style={{color:"#3FB27F"}}>vous identifiez les domaines à renforcer et ceux qui font déjà la différence</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GRID FEATURES SECTION */}
        <section className="py-8 md:py-10 px-4 md:px-8 bg-gradient-to-b from-transparent via-secondary/30 to-transparent">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Grid Card 1 */}
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-foreground">
                    Une évolution visible
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Votre réputation est vivante. Notre outil suit vos progrès, détecte les changements de perception et <span style={{color:"#3FB27F"}}>aide à anticiper les tendances avant qu'elles ne deviennent critiques</span>.
                </p>
              </div>

              {/* Grid Card 2 */}
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-success" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-foreground">
                    Une compréhension locale et globale
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Que vous gériez un seul établissement ou un réseau entier, <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> vous offre une vision claire de vos performances à chaque échelle. Comparez vos sites, repérez les différences régionales et <span style={{color:"#3FB27F"}}>ajustez vos stratégies là où cela compte le plus</span>.
                </p>
              </div>

              {/* Grid Card 3 */}
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-warning" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-foreground">
                    Des rapports qui parlent vrai
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Des visuels clairs, des données utiles et une interprétation accessible. <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> <span style={{color:"#3FB27F"}}>vous offre la vérité sur votre réputation</span>, sans jargon inutile.
                </p>
              </div>

              {/* Grid Card 4 */}
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-foreground">
                    Un partenaire, pas juste un outil
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Au fil du temps, <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> <span style={{color:"#3FB27F"}}>apprend à connaître votre établissement et vous guide vers l'excellence</span>. Ensemble, on transforme les avis en <span style={{color:"#3FB27F"}}>leviers de croissance</span>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="pt-8 pb-16 md:pt-10 md:pb-20 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-10 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground text-center">
                Questions sur les fonctionnalités
              </h2>
              
              <Accordion type="single" collapsible className="w-full space-y-3">
                <AccordionItem value="item-1" className="border border-border/60 rounded-xl px-4 md:px-6 bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200 data-[state=open]:bg-secondary/50">
                  <AccordionTrigger className="hover:no-underline py-5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                      <span className="font-medium text-foreground">Comment fonctionne l'analyse des avis ?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-8 text-muted-foreground leading-relaxed">
                    <span className="text-blue">Reviewsvisor</span> utilise une intelligence artificielle avancée pour analyser vos avis clients. L'outil lit chaque commentaire, identifie le ton et l'émotion, extrait les mots-clés importants et détecte automatiquement les points forts et les points faibles. Vous obtenez ensuite une synthèse claire avec des <span className="text-green">axes d'amélioration prioritaires</span>.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border border-border/60 rounded-xl px-4 md:px-6 bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200 data-[state=open]:bg-secondary/50">
                  <AccordionTrigger className="hover:no-underline py-5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                      <span className="font-medium text-foreground">En quoi Reviewsvisor est-il différent d'un simple outil de statistiques ?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-8 text-muted-foreground leading-relaxed">
                    <span className="text-blue">Reviewsvisor</span> ne se limite pas aux chiffres. L'IA analyse le ton, le vocabulaire et les émotions dans chaque avis afin de révéler les véritables ressentis des clients. L'outil identifie les tendances, les points forts et les axes d'amélioration, pour offrir une vision stratégique plutôt qu'un simple tableau de données.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border border-border/60 rounded-xl px-4 md:px-6 bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200 data-[state=open]:bg-secondary/50">
                  <AccordionTrigger className="hover:no-underline py-5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                      <span className="font-medium text-foreground">Comment les axes d'amélioration sont-ils déterminés ?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-8 text-muted-foreground leading-relaxed">
                    L'IA regroupe les retours clients par thématiques récurrentes (accueil, qualité, prix, service, ambiance, etc.). Elle mesure la fréquence et la tonalité de chaque sujet pour établir une liste claire des priorités d'amélioration à fort impact.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border border-border/60 rounded-xl px-4 md:px-6 bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200 data-[state=open]:bg-secondary/50">
                  <AccordionTrigger className="hover:no-underline py-5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                      <span className="font-medium text-foreground">Quelle est la précision de l'analyse ?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-8 text-muted-foreground leading-relaxed">
                    <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> utilise des modèles d'intelligence artificielle entraînés sur des millions de commentaires clients réels. <span style={{color:"#3FB27F"}}>Le taux de précision moyen dépasse 90 %</span>, avec une amélioration continue grâce à l'apprentissage automatique des nouveaux avis analysés.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border border-border/60 rounded-xl px-4 md:px-6 bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200 data-[state=open]:bg-secondary/50">
                  <AccordionTrigger className="hover:no-underline py-5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                      <span className="font-medium text-foreground">L'IA peut-elle détecter les faux avis ou les avis suspects ?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-8 text-muted-foreground leading-relaxed">
                    Oui, partiellement. <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> repère les avis suspects selon plusieurs signaux : répétition de <span style={{color:"#3FB27F"}}>mots-clés</span>, <span style={{color:"#3FB27F"}}>schémas d'écriture inhabituels</span>, extrêmes émotionnels ou activité anormale sur une courte période. Cette fonctionnalité est conçue pour alerter les établissements sur les anomalies possibles.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border border-border/60 rounded-xl px-4 md:px-6 bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200 data-[state=open]:bg-secondary/50">
                  <AccordionTrigger className="hover:no-underline py-5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                      <span className="font-medium text-foreground">Puis-je comparer mes performances à celles de mes concurrents ?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-8 text-muted-foreground leading-relaxed">
                    Cette fonctionnalité arrive très bientôt ! <span className="text-blue">Reviewsvisor</span> intégrera prochainement une <span className="font-semibold">analyse concurrentielle avancée</span>, permettant de comparer vos indicateurs clés à ceux de vos concurrents directs. Un véritable <span className="font-semibold">benchmarkeur intelligent</span> pour suivre votre position sur le marché.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="border border-border/60 rounded-xl px-4 md:px-6 bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200 data-[state=open]:bg-secondary/50">
                  <AccordionTrigger className="hover:no-underline py-5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                      <span className="font-medium text-foreground">Puis-je connecter plusieurs établissements à un seul compte ?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-8 text-muted-foreground leading-relaxed">
                    Oui. <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> permet de <span style={{color:"#3FB27F"}}>centraliser la gestion de plusieurs établissements</span> depuis un tableau de bord unique. Chaque lieu dispose de <span style={{color:"#3FB27F"}}>ses propres rapports</span>, filtres et analyses, tout en conservant une vision globale de la performance du groupe.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Fonctionnalites;