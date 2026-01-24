import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen } from "lucide-react";

export function LexiqueSection() {
  const lexiqueItems = [
    {
      term: "KPI",
      description:
        "Un KPI (Key Performance Indicator) est une mesure quantitative utilisée pour évaluer le niveau d’atteinte d’un objectif défini. Il sert à suivre l’évolution de la performance dans le temps et à appuyer les décisions de pilotage.",
    },
    {
      term: "Analyse de Pareto",
      description:
        "L’analyse de Pareto est une méthode de priorisation fondée sur le principe selon lequel une part limitée des causes produit la majorité des effets. Elle permet d’identifier les quelques facteurs qui contribuent le plus à un résultat, par exemple des problèmes, des défauts ou de l’insatisfaction.",
    },
    {
      term: "Analyse des causes racines (Ishikawa)",
      description:
        "L’analyse des causes racines de type Ishikawa (ou diagramme en arêtes de poisson) est un outil visuel de cause à effet qui structure les causes potentielles d’un problème. Les causes sont regroupées en grandes catégories, qui peuvent varier selon le contexte (par exemple processus, méthodes, ressources ou environnement).",
    },
    {
      term: "Confiance IA",
      description:
        "La confiance IA désigne un indicateur du degré de fiabilité des résultats produits par un modèle au regard de la quantité, de la qualité et de la cohérence des données utilisées. Elle reflète le niveau d’incertitude associé aux analyses et doit être interprétée comme un niveau de confiance plutôt que comme une vérité absolue.",
    },
  ];

  return (
    <Card className="mt-12 border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-semibold text-gray-800">
            Lexique – comprendre les indicateurs
          </h3>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        <Accordion type="single" collapsible className="w-full">
          {lexiqueItems.map((item, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border-b border-gray-200 last:border-b-0"
            >
              <AccordionTrigger className="hover:no-underline py-2">
                <span className="font-medium text-gray-900 text-left text-sm">
                  {item.term}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <p className="text-sm text-slate-600 leading-6">
                  {item.description}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
