import logoReviewsvisor from "@/assets/logo-reviewsvisor.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
                      Comment Reviewsvisor identifie-t-il les points forts et les points faibles ?
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 text-base leading-relaxed">
                      L'IA regroupe automatiquement vos avis par thèmes récurrents (service, accueil, prix, ambiance, propreté, qualité...). Elle mesure la tonalité positive ou négative de chaque commentaire et met en avant les éléments qui reviennent le plus souvent. Ainsi, vous identifiez rapidement ce qui plaît à vos clients et ce qui nécessite une amélioration.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Peut-on personnaliser les rapports d'analyse ?
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 text-base leading-relaxed">
                      Oui, vous pouvez filtrer vos rapports par période, par plateforme (Google, TripAdvisor...), par note ou par source. Vous choisissez également les indicateurs que vous souhaitez suivre dans vos rapports pour vous concentrer sur ce qui compte vraiment pour votre établissement.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Fonctionnalites;
