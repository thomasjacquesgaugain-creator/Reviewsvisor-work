import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Sparkles, MessageSquare, FileText, Building2 } from "lucide-react";
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

const suggestionChips = [
  { label: "Importer des avis", icon: FileText },
  { label: "Ajouter un établissement", icon: Building2 },
  { label: "Comprendre un rapport", icon: MessageSquare },
];

const Aide = () => {
  return (
    <div className="min-h-screen flex flex-col relative bg-gradient-to-b from-background via-background to-muted/20">
      <BackArrow />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-8 pb-6 md:pt-12 md:pb-8 px-4 overflow-hidden">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue/5 via-transparent to-primary/5 pointer-events-none" />
          
          <div className="relative z-10 max-w-[900px] mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue/10 border border-blue/20 text-blue text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Support • FAQ • IA</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              Centre d'aide <span className="text-blue">Reviewsvisor</span>
            </h1>
            
            <p className="text-foreground/70 text-base md:text-lg max-w-[600px] mx-auto leading-relaxed">
              Trouvez des réponses rapides à vos questions et découvrez comment utiliser <span className="text-blue font-medium">Reviewsvisor</span> efficacement.
            </p>
          </div>
        </section>

        {/* AI Assistance Section */}
        <section className="px-4 pb-8 md:pb-10">
          <div className="max-w-[900px] mx-auto">
            <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
              {/* Card Header */}
              <div className="px-6 py-4 border-b border-border/40 bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue/10">
                    <Sparkles className="h-5 w-5 text-blue" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Assistance IA</h2>
                    <p className="text-sm text-muted-foreground">Posez votre question, notre IA vous répond instantanément</p>
                  </div>
                </div>
              </div>
              
              {/* Card Body */}
              <div className="p-6">
                <AiAssistance className="bg-transparent border-0 shadow-none p-0" />
                
                {/* Suggestion Chips */}
                <div className="mt-5 pt-5 border-t border-border/40">
                  <p className="text-xs text-muted-foreground mb-3">Suggestions :</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestionChips.map((chip, index) => (
                      <button
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted border border-border/40 text-sm text-foreground/80 hover:text-foreground transition-colors"
                      >
                        <chip.icon className="h-3.5 w-3.5" />
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 pb-10 md:pb-14">
          <div className="max-w-[900px] mx-auto">
            <div className="bg-card/50 rounded-2xl border border-border/50 shadow-sm p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-semibold mb-6 text-foreground flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue/10">
                  <HelpCircle className="h-5 w-5 text-blue" />
                </div>
                Questions fréquentes
              </h2>
              
              <Accordion type="single" collapsible className="w-full space-y-3">
                {faqItems.map((item, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`faq-${index}`} 
                    className="border border-border/50 rounded-xl px-5 bg-background/80 hover:bg-background transition-colors shadow-sm data-[state=open]:shadow-md data-[state=open]:border-blue/30"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                        <span className="font-medium text-foreground">{item.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pl-8 text-muted-foreground whitespace-pre-line leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="px-4 pb-12 md:pb-16">
          <div className="max-w-[900px] mx-auto">
            <div className="text-center py-8 px-6 rounded-2xl bg-gradient-to-br from-blue/5 via-background to-primary/5 border border-border/40">
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                Besoin d'aide ?
              </h3>
              <p className="text-foreground/70 mb-6 max-w-md mx-auto">
                Notre équipe est là pour vous accompagner dans l'utilisation de <span className="text-blue font-medium">Reviewsvisor</span>.
              </p>
              <Link to="/contact">
                <Button size="lg" className="font-semibold shadow-sm hover:shadow-md transition-shadow">
                  Contactez-nous
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Aide;
