import logoReviewsvisor from "@/assets/logo-reviewsvisor.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import BackArrow from "@/components/BackArrow";

const Fonctionnalites = () => {
  return (
    <div className="min-h-screen flex flex-col relative">
      <BackArrow />
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
                    Voyez votre réputation autrement
                  </h2>
                  <p>
                    Derrière chaque note, il y a une émotion. <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> <span style={{color:"#3FB27F"}}>capte ces nuances pour vous offrir une lecture humaine</span> de votre réputation. Vous découvrez enfin ce que vos clients ressentent vraiment.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    Une intelligence qui comprend vos clients
                  </h2>
                  <p>
                    Notre IA lit les avis comme une personne : elle repère le ton, le choix des mots, les émotions et les thèmes dominants. <span style={{color:"#3FB27F"}}>Elle transforme le bruit des commentaires en une vision claire</span> de votre image.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    Des pistes d'action claires
                  </h2>
                  <p>
                    <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> ne se contente pas d'analyser : il vous montre où agir. En quelques secondes, <span style={{color:"#3FB27F"}}>vous identifiez les domaines à renforcer et ceux qui font déjà la différence</span>.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    Une évolution visible
                  </h2>
                  <p>
                    Votre réputation est vivante. Notre outil suit vos progrès, détecte les changements de perception et <span style={{color:"#3FB27F"}}>aide à anticiper les tendances avant qu'elles ne deviennent critiques</span>.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    Une compréhension locale et globale
                  </h2>
                  <p>
                    Que vous gériez un seul établissement ou un réseau entier, <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> vous offre une vision claire de vos performances à chaque échelle. Comparez vos sites, repérez les différences régionales et <span style={{color:"#3FB27F"}}>ajustez vos stratégies là où cela compte le plus</span>.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    Des rapports qui parlent vrai
                  </h2>
                  <p>
                    Des visuels clairs, des données utiles et une interprétation accessible. <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> <span style={{color:"#3FB27F"}}>vous offre la vérité sur votre réputation</span>, sans jargon inutile.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    Un partenaire, pas juste un outil
                  </h2>
                  <p>
                    Au fil du temps, <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> <span style={{color:"#3FB27F"}}>apprend à connaître votre établissement et vous guide vers l'excellence</span>. Ensemble, on transforme les avis en <span style={{color:"#3FB27F"}}>leviers de croissance</span>.
                  </p>
                </div>
              </div>

              <div className="mt-12 pt-8 mb-16 border-t border-border">
                <h2 className="text-2xl font-bold mb-6 text-foreground">Questions sur les fonctionnalités</h2>
                
                <Accordion type="single" collapsible className="w-full space-y-2">
                  <AccordionItem value="item-1" className="border border-border rounded-lg px-4 bg-card">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                        <span className="font-medium text-foreground">Comment fonctionne l'analyse des avis ?</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pl-8 text-muted-foreground">
                      <span className="text-blue">Reviewsvisor</span> utilise une intelligence artificielle avancée pour analyser vos avis clients. L'outil lit chaque commentaire, identifie le ton et l'émotion, extrait les mots-clés importants et détecte automatiquement les points forts et les points faibles. Vous obtenez ensuite une synthèse claire avec des <span className="text-green">axes d'amélioration prioritaires</span>.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2" className="border border-border rounded-lg px-4 bg-card">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                        <span className="font-medium text-foreground">En quoi Reviewsvisor est-il différent d'un simple outil de statistiques ?</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pl-8 text-muted-foreground">
                      <span className="text-blue">Reviewsvisor</span> ne se limite pas aux chiffres. L'IA analyse le ton, le vocabulaire et les émotions dans chaque avis afin de révéler les véritables ressentis des clients. L'outil identifie les tendances, les points forts et les axes d'amélioration, pour offrir une vision stratégique plutôt qu'un simple tableau de données.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3" className="border border-border rounded-lg px-4 bg-card">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                        <span className="font-medium text-foreground">Comment les axes d'amélioration sont-ils déterminés ?</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pl-8 text-muted-foreground">
                      L'IA regroupe les retours clients par thématiques récurrentes (accueil, qualité, prix, service, ambiance, etc.). Elle mesure la fréquence et la tonalité de chaque sujet pour établir une liste claire des priorités d'amélioration à fort impact.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4" className="border border-border rounded-lg px-4 bg-card">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                        <span className="font-medium text-foreground">Quelle est la précision de l'analyse ?</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pl-8 text-muted-foreground">
                      <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> utilise des modèles d'intelligence artificielle entraînés sur des millions de commentaires clients réels. <span style={{color:"#3FB27F"}}>Le taux de précision moyen dépasse 90 %</span>, avec une amélioration continue grâce à l'apprentissage automatique des nouveaux avis analysés.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5" className="border border-border rounded-lg px-4 bg-card">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                        <span className="font-medium text-foreground">L'IA peut-elle détecter les faux avis ou les avis suspects ?</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pl-8 text-muted-foreground">
                      Oui, partiellement. <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> repère les avis suspects selon plusieurs signaux : répétition de <span style={{color:"#3FB27F"}}>mots-clés</span>, <span style={{color:"#3FB27F"}}>schémas d'écriture inhabituels</span>, extrêmes émotionnels ou activité anormale sur une courte période. Cette fonctionnalité est conçue pour alerter les établissements sur les anomalies possibles.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-6" className="border border-border rounded-lg px-4 bg-card">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                        <span className="font-medium text-foreground">Puis-je comparer mes performances à celles de mes concurrents ?</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pl-8 text-muted-foreground">
                      Cette fonctionnalité arrive très bientôt ! <span className="text-blue">Reviewsvisor</span> intégrera prochainement une <span className="font-semibold">analyse concurrentielle avancée</span>, permettant de comparer vos indicateurs clés à ceux de vos concurrents directs. Un véritable <span className="font-semibold">benchmarkeur intelligent</span> pour suivre votre position sur le marché.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-7" className="border border-border rounded-lg px-4 bg-card">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                        <span className="font-medium text-foreground">Puis-je connecter plusieurs établissements à un seul compte ?</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pl-8 text-muted-foreground">
                      Oui. <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> permet de <span style={{color:"#3FB27F"}}>centraliser la gestion de plusieurs établissements</span> depuis un tableau de bord unique. Chaque lieu dispose de <span style={{color:"#3FB27F"}}>ses propres rapports</span>, filtres et analyses, tout en conservant une vision globale de la performance du groupe.
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
