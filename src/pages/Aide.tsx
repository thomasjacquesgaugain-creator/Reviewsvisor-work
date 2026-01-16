import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, MessageCircle, LifeBuoy } from "lucide-react";
import AiAssistance from "@/components/AiAssistance";
import BackArrow from "@/components/BackArrow";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
const Aide = () => {
  const { t } = useTranslation();
  
  const faqItems = [{
    question: t("help.faq1Question"),
    answer: t("help.faq1Answer")
  }, {
    question: t("help.faq2Question"),
    answer: t("help.faq2Answer")
  }, {
    question: t("help.faq3Question"),
    answer: t("help.faq3Answer")
  }, {
    question: t("help.faq4Question"),
    answer: t("help.faq4Answer")
  }, {
    question: t("help.faq5Question"),
    answer: t("help.faq5Answer")
  }];
  
  return <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-100 via-blue-50 to-violet-100">
      {/* Background with organic shapes */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-violet-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-200 to-yellow-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-30"></div>
      </div>
      
      <div className="relative z-10">
      <BackArrow />
      
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="pt-8 pb-6 px-4 md:px-8 bg-gradient-to-b from-primary/5 via-transparent to-transparent">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <Badge variant="secondary" className="mb-5 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
              <LifeBuoy className="w-3.5 h-3.5 mr-1.5" />
              {t("help.supportFaq")}
            </Badge>
            
            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground tracking-tight">
              {t("help.helpCenter")} <span className="text-primary">Reviewsvisor</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {t("help.subtitle")} <span className="text-primary">Reviewsvisor</span> {t("help.subtitle2")}.
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
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MessageCircle className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">{t("help.aiAssistance")}</h2>
                  </div>
                  
                  <AiAssistance className="text-primary-foreground border-primary-foreground bg-primary-foreground" />
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
              <h2 className="text-xl md:text-2xl font-bold text-foreground">{t("help.frequentQuestions")}</h2>
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
                {t("help.needHelp")}
              </h3>
              <p className="text-muted-foreground mb-5 max-w-lg mx-auto">
                {t("help.teamHere")} <span className="text-primary">Reviewsvisor</span>.
              </p>
              <Link to="/contact">
                <Button size="lg" className="font-semibold shadow-sm hover:shadow-md transition-shadow">
                  {t("help.contactUs")}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      </div>
    </div>;
};
export default Aide;