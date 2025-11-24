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
                      En quoi Reviewsvisor est-il différent d'un simple outil de statistiques ?
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 text-base leading-relaxed">
                      <span className="text-blue">Reviewsvisor</span> ne se limite pas aux chiffres. L'IA analyse le ton, le vocabulaire et les émotions dans chaque avis afin de révéler les véritables ressentis des clients. L'outil identifie les tendances, les points forts et les axes d'amélioration, pour offrir une vision stratégique plutôt qu'un simple tableau de données.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Comment les axes d'amélioration sont-ils déterminés ?
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 text-base leading-relaxed">
                      L'IA regroupe les retours clients par thématiques récurrentes (accueil, qualité, prix, service, ambiance, etc.). Elle mesure la fréquence et la tonalité de chaque sujet pour établir une liste claire des priorités d'amélioration à fort impact.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Quelle est la précision de l'analyse ?
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 text-base leading-relaxed">
                      <span className="text-blue">Reviewsvisor</span> utilise des modèles d'intelligence artificielle entraînés sur des millions de commentaires clients réels. Le taux de précision moyen dépasse 90 %, avec une amélioration continue grâce à l'apprentissage automatique des nouveaux avis analysés.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      L'IA peut-elle détecter les faux avis ou les avis suspects ?
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 text-base leading-relaxed">
                      Oui, partiellement. <span className="text-blue">Reviewsvisor</span> repère les avis suspects selon plusieurs signaux : répétition de mots-clés, schémas d'écriture inhabituels, extrêmes émotionnels ou activité anormale sur une courte période. Cette fonctionnalité est conçue pour alerter les établissements sur les anomalies possibles.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-6">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Puis-je comparer mes performances à celles de mes concurrents ?
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 text-base leading-relaxed">
                      Cette fonctionnalité arrive très bientôt ! <span className="text-blue">Reviewsvisor</span> intégrera prochainement une <span className="font-semibold">analyse concurrentielle avancée</span>, permettant de comparer vos indicateurs clés à ceux de vos concurrents directs. Un véritable <span className="font-semibold">benchmarkeur intelligent</span> pour suivre votre position sur le marché.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-7">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Puis-je connecter plusieurs établissements à un seul compte ?
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 text-base leading-relaxed">
                      Oui. <span className="text-blue">Reviewsvisor</span> permet de centraliser la gestion de plusieurs établissements depuis un tableau de bord unique. Chaque lieu dispose de ses propres rapports, filtres et analyses, tout en conservant une vision globale de la performance du groupe.
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
