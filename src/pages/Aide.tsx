import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import AiAssistance from "@/components/AiAssistance";
import BackArrow from "@/components/BackArrow";
const faqItems = [{
  question: "Comment importer mes avis Google ?",
  answer: `Vous pouvez importer vos avis Google de deux façons :
- en important un fichier via Google Takeout,
- ou via la récupération automatique si votre établissement est connecté.

Chaque méthode est expliquée étape par étape directement dans la section "Instructions".`
}, {
  question: "Que faire si je ne trouve pas mon établissement ?",
  answer: `Assurez-vous que votre établissement est bien visible sur Google Maps et associé au bon compte Google Business Profile.

Si le problème persiste, vous pouvez importer vos avis manuellement via Google Takeout ou contacter notre support pour vérification.`
}, {
  question: "Puis-je utiliser Reviewsvisor pour plusieurs établissements ?",
  answer: `Oui. Reviewsvisor permet d'analyser plusieurs établissements depuis un seul compte.

Chaque établissement dispose de ses propres analyses, recommandations et historiques d'avis.`
}, {
  question: "Puis-je partager les analyses avec mon équipe ?",
  answer: `Oui. Les analyses peuvent être partagées avec votre équipe afin d'aligner tout le monde sur les priorités à améliorer (service, prix, qualité, organisation).

Cela permet de transformer les avis clients en actions concrètes.`
}, {
  question: "Puis-je répondre automatiquement aux avis clients ?",
  answer: `Oui. Reviewsvisor propose un système de réponses automatiques assistées par IA.

Vous pouvez générer des réponses adaptées au ton des avis (positifs ou négatifs), tout en gardant le contrôle avant publication.`
}];
const Aide = () => {
  return <div className="min-h-screen flex flex-col relative">
      <BackArrow />
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

              <AiAssistance className="bg-primary-foreground" />

              {/* Section FAQ */}
              <div className="mt-12">
                <h2 className="text-2xl font-semibold mb-6 text-foreground">
                  Questions fréquentes
                </h2>
                <Accordion type="single" collapsible className="w-full space-y-2">
                  {faqItems.map((item, index) => <AccordionItem key={index} value={`faq-${index}`} className="border border-border rounded-lg px-4 bg-card">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3 text-left">
                          <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                          <span className="font-medium text-foreground">{item.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 pl-8 text-muted-foreground whitespace-pre-line">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>)}
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
    </div>;
};
export default Aide;