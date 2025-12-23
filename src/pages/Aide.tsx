import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, MessageCircle, LifeBuoy } from "lucide-react";
import AiAssistance from "@/components/AiAssistance";
import BackArrow from "@/components/BackArrow";
import { Badge } from "@/components/ui/badge";
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
  return <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-background via-background to-primary/5">
      {/* Subtle noise/grain overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-0" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
    }} />
      
      <BackArrow />
      
      <main className="flex-1 relative z-10">
        {/* HERO SECTION */}
        <section className="pt-8 pb-6 px-4 md:px-8 bg-gradient-to-b from-primary/5 via-transparent to-transparent">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <Badge variant="secondary" className="mb-5 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
              <LifeBuoy className="w-3.5 h-3.5 mr-1.5" />
              Support & FAQ
            </Badge>
            
            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground tracking-tight">
              Centre d'aide <span className="text-primary">Reviewsvisor</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Trouvez des réponses rapides à vos questions et découvrez comment utiliser <span className="text-primary">Reviewsvisor</span> efficacement.
            </p>
          </div>
        </section>

        {/* AI ASSISTANCE SECTION */}
        <section className="py-5 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border/60 rounded-2xl p-5 md:p-7 shadow-sm">
              <div className="flex gap-4">
                {/* Accent bar */}
                <div className="hidden sm:block w-1 bg-gradient-to-b from-primary to-primary/30 rounded-full shrink-0" />
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                      <MessageCircle className="w-4.5 h-4.5 text-primary-foreground" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">Assistance IA</h2>
                  </div>
                  
                  <AiAssistance className="bg-primary-foreground" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-5 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center">
                <HelpCircle className="w-4.5 h-4.5 text-success" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">Questions fréquentes</h2>
            </div>
            
            <div className="bg-card border border-border/60 rounded-2xl p-4 md:p-6 shadow-sm">
              <Accordion type="single" collapsible className="w-full space-y-2">
                {faqItems.map((item, index) => <AccordionItem key={index} value={`faq-${index}`} className="border border-border/50 rounded-lg px-4 bg-secondary/20 hover:bg-secondary/40 transition-colors duration-200">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                        <span className="font-medium text-foreground">{item.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pl-8 text-muted-foreground whitespace-pre-line">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>)}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CONTACT CALLOUT SECTION */}
        <section className="pt-4 pb-10 md:pb-14 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-success/10 border border-primary/20 rounded-2xl p-6 md:p-8 shadow-sm text-center">
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground">
                Besoin d'aide ?
              </h3>
              <p className="text-muted-foreground mb-5 max-w-lg mx-auto">
                Notre équipe est là pour vous accompagner dans l'utilisation de <span className="text-primary">Reviewsvisor</span>.
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
    </div>;
};
export default Aide;