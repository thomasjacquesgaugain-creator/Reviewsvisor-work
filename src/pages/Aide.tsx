import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import AiAssistance from "@/components/AiAssistance";

const Aide = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-6 pb-8 px-4">
        <section className="py-5">
          <div className="relative z-1">
            <div className="max-w-[900px] mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center text-foreground">
                Centre d'aide <span className="text-blue">Reviewsvisor</span>
              </h1>
              
              <p className="text-center text-foreground/80 text-lg mb-12 max-w-[700px] mx-auto">
                Trouvez des réponses rapides à vos questions et découvrez comment utiliser <span className="text-blue">Reviewsvisor</span> efficacement.
              </p>

              <AiAssistance />

              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-foreground">Questions fréquentes</h2>
                
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
                      Comment connecter mon établissement ?
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 text-base leading-relaxed">
                      Il vous suffit de rechercher votre établissement dans notre interface de recherche. Une fois trouvé, vous pouvez l'enregistrer et commencer à importer vos avis depuis Google, Facebook, TripAdvisor et d'autres plateformes. Le processus est simple et guidé étape par étape.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Quelles plateformes sont supportées ?
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 text-base leading-relaxed">
                      <span className="text-blue">Reviewsvisor</span> centralise vos avis provenant de Google My Business, Facebook, TripAdvisor, TheFork, Yelp et bien d'autres. Vous pouvez également importer manuellement des avis depuis n'importe quelle source en utilisant notre système d'import CSV ou de collage direct.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      À quelle fréquence les données sont-elles mises à jour ?
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 text-base leading-relaxed">
                      Les analyses et statistiques sont actualisées en temps réel dès que de nouveaux avis sont importés. Vous pouvez configurer des imports automatiques pour certaines plateformes ou effectuer des mises à jour manuelles à tout moment selon vos besoins.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Comment interpréter les rapports d'analyse ?
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 text-base leading-relaxed">
                      Nos rapports sont conçus pour être clairs et actionnables. Vous verrez votre note moyenne, la répartition positive/négative, les thèmes récurrents identifiés par l'IA, ainsi que les principaux points d'amélioration. Chaque section est accompagnée de conseils personnalisés pour améliorer votre expérience client et votre réputation en ligne.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <div className="text-center mt-12 pt-8 border-t border-border">
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Besoin d'aide ?
                </h3>
                <p className="text-foreground/80 mb-6">
                  Notre équipe est là pour vous accompagner dans l'utilisation de <span className="text-blue">Reviewsvisor</span>.
                </p>
                <Link to="/contact">
                  <Button size="lg" className="font-semibold">
                    Contactez-nous
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Aide;
