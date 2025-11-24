import logoReviewsvisor from "@/assets/logo-reviewsvisor.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import AiAssistance from "@/components/AiAssistance";

const Fonctionnalites = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-6 pb-0 px-4">
        <section className="py-5 pb-0">
          <div className="relative z-1">
            <div className="max-w-[800px] mx-auto">
              <h1 className="apropos-title">
                Fonctionnalités de 
                <span className="apropos-brand">Reviewsvisor</span>
                <img src={logoReviewsvisor} alt="Logo Reviewsvisor" className="apropos-logo" />
              </h1>
              
              <div className="text-foreground/90 leading-relaxed space-y-6 text-lg mb-2">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    1. Vision globale de votre réputation
                  </h2>
                  <p>
                    Une vue d'ensemble simple et précise pour comprendre immédiatement ce que vos clients pensent de vous.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    2. Analyse intelligente des avis
                  </h2>
                  <p>
                    L'IA lit chaque avis et en extrait ce qui compte : sentiments, mots-clés, points forts et points faibles.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    3. Points d'amélioration prioritaires
                  </h2>
                  <p>
                    Nous mettons en avant ce qui pénalise réellement votre note, pour vous guider vers des actions concrètes.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    4. Historique de votre évolution
                  </h2>
                  <p>
                    Suivez l'évolution de votre réputation au fil du temps : progrès, tendances, pics d'activité, périodes sensibles.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    5. Centralisation multi-plateforme
                  </h2>
                  <p>
                    Tous vos avis regroupés en un seul endroit, automatiquement : Google, Facebook, TripAdvisor, TheFork…
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    6. Rapports faciles à comprendre
                  </h2>
                  <p>
                    Un résumé clair, envoyé automatiquement, pour vous aider à prendre les bonnes décisions rapidement.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    7. Conseils personnalisés
                  </h2>
                  <p>
                    Des recommandations adaptées à votre établissement pour améliorer l'expérience client et votre note.
                  </p>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-border">
                <h2 className="text-2xl font-bold mb-6 text-foreground">Questions sur les fonctionnalités</h2>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Comment fonctionne l'analyse des avis ?
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 text-base leading-relaxed">
                      <span className="text-blue">Reviewsvisor</span> utilise une intelligence artificielle avancée pour analyser vos avis clients. L'outil lit chaque commentaire, identifie le ton et l'émotion, extrait les mots-clés importants et détecte automatiquement les points forts et les points faibles. Vous obtenez ensuite une synthèse claire avec des <span className="text-green">axes d'amélioration prioritaires</span>.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Comment interpréter les rapports d'analyse ?
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 text-base leading-relaxed">
                      Nos rapports sont conçus pour être clairs et actionnables. Vous verrez votre note moyenne, la répartition positive/négative, les thèmes récurrents identifiés par l'IA, ainsi que les principaux points d'amélioration. Chaque section est accompagnée de conseils personnalisés pour améliorer votre expérience client et votre réputation en ligne.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Comment Reviewsvisor identifie les points forts et faibles ?
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 text-base leading-relaxed">
                      L'intelligence artificielle analyse chaque avis pour détecter les aspects positifs et négatifs. Elle identifie les thèmes récurrents (accueil, propreté, qualité...), calcule leur impact sur votre note globale et les classe par ordre d'importance. Les points faibles prioritaires sont ceux qui affectent le plus votre réputation.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Peut-on personnaliser les rapports d'analyse ?
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 text-base leading-relaxed">
                      Oui, vous pouvez adapter les rapports selon vos besoins. Filtrez par période, plateforme ou type d'avis. Vous pouvez également exporter vos rapports en PDF pour les partager avec votre équipe ou vos partenaires.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Reviewsvisor s'intègre-t-il à d'autres outils de gestion (Google, TripAdvisor, etc.) ?
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 text-base leading-relaxed">
                      Oui, <span className="text-blue">Reviewsvisor</span> centralise automatiquement vos avis depuis Google My Business, TripAdvisor, Facebook, TheFork et d'autres plateformes majeures. L'import peut être automatisé ou manuel selon vos préférences.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <div className="mt-12 pt-8 border-t border-border">
                <h2 className="text-2xl font-bold mb-6 text-foreground">Assistance IA</h2>
                <p className="text-foreground/80 text-base leading-relaxed mb-6">
                  Posez vos questions à notre assistant virtuel pour obtenir une réponse personnalisée et immédiate.
                </p>
                <AiAssistance />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Fonctionnalites;
