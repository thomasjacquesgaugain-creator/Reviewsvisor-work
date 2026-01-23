import logoReviewsvisor from "@/assets/logo-reviewsvisor.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Sparkles, TrendingUp, Bell, BarChart3, Target, Eye, Globe, FileText, Users } from "lucide-react";
import BackArrow from "@/components/BackArrow";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const Fonctionnalites = () => {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-100 via-blue-50 to-violet-100">
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
        <section className="pt-12 pb-6 px-4 md:px-8 bg-gradient-to-b from-primary/5 via-transparent to-transparent">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {t("features.badge")}
            </Badge>
            
            {/* Title */}
            <h1 className="flex items-center justify-center gap-3 text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground tracking-tight">
              {t("features.title")} 
              <span className="text-primary">Reviewsvisor</span>
              <img src={logoReviewsvisor} alt={t("common.logoAlt")} className="h-8 w-8 md:h-10 md:w-10 object-contain" />
            </h1>
            
            {/* Subtitle */}
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
              {t("features.subtitle")}
            </p>
            
            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-4 md:gap-6 mt-10 max-w-xl mx-auto">
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm">
                <BarChart3 className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t("features.reviewsAnalyzed")}</p>
                <p className="text-lg font-bold text-foreground">—</p>
              </div>
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm">
                <Target className="w-5 h-5 text-success mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t("features.themesDetected")}</p>
                <p className="text-lg font-bold text-foreground">—</p>
              </div>
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm">
                <Bell className="w-5 h-5 text-warning mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t("features.alerts")}</p>
                <p className="text-lg font-bold text-foreground">—</p>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN FEATURES SECTION */}
        <section className="pt-8 pb-6 md:pt-10 md:pb-8 px-4 md:px-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Feature Card 1 */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex gap-4">
                <div className="hidden sm:block w-1 bg-gradient-to-b from-primary to-primary/30 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Eye className="w-5 h-5 text-primary" />
                    <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                      {t("features.seeReputationDifferently")}
                    </h2>
                  </div>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-prose">
                    {t("features.seeReputationDesc1")} <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> <span style={{color:"#3FB27F"}}>{t("features.seeReputationDesc2")}</span> {t("features.seeReputationDesc3")}
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex gap-4">
                <div className="hidden sm:block w-1 bg-gradient-to-b from-success to-success/30 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-5 h-5 text-success" />
                    <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                      {t("features.intelligenceUnderstands")}
                    </h2>
                  </div>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-prose">
                    {t("features.intelligenceDesc1")} <span style={{color:"#3FB27F"}}>{t("features.intelligenceDesc2")}</span> {t("features.intelligenceDesc3")}
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex gap-4">
                <div className="hidden sm:block w-1 bg-gradient-to-b from-primary to-primary/30 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="w-5 h-5 text-primary" />
                    <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                      {t("features.clearActionPaths")}
                    </h2>
                  </div>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-prose">
                    <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> {t("features.clearActionDesc1")} <span className="text-green-500 font-medium">actions concrètes</span> {t("features.clearActionDesc2")}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GRID FEATURES SECTION */}
        <section className="py-8 md:py-10 px-4 md:px-8 bg-gradient-to-b from-transparent via-secondary/30 to-transparent">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Grid Card 1 */}
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-foreground">
                    {t("features.visibleEvolution")}
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {t("features.visibleEvolutionDesc1")} <span style={{color:"#3FB27F"}}>{t("features.visibleEvolutionDesc2")}</span>.
                </p>
              </div>

              {/* Grid Card 2 */}
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-success" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-foreground">
                    {t("features.localGlobalUnderstanding")}
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {t("features.localGlobalDesc1")} <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> {t("features.localGlobalDesc2")} <span style={{color:"#3FB27F"}}>{t("features.localGlobalDesc3")}</span>.
                </p>
              </div>

              {/* Grid Card 3 */}
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-warning" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-foreground">
                    {t("features.reportsThatSpeak")}
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {t("features.reportsDesc1")} <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> <span style={{color:"#3FB27F"}}>{t("features.reportsDesc2")}</span>, {t("features.reportsDesc3")}.
                </p>
              </div>

              {/* Grid Card 4 */}
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-foreground">
                    {t("features.partnerNotJustTool")}
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {t("features.partnerDesc1")} <span style={{color:"#2C7BE5"}}>Reviewsvisor</span> <span style={{color:"#3FB27F"}}>{t("features.partnerDesc2")}</span>. {t("features.partnerDesc3")} <span style={{color:"#3FB27F"}}>{t("features.partnerDesc4")}</span>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="pt-8 pb-16 md:pt-10 md:pb-20 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-10 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground text-center">
                {t("features.questionsAboutFeatures")}
              </h2>
              
              <Accordion type="single" collapsible className="w-full space-y-3">
                <AccordionItem value="item-1" className="border border-border/60 rounded-xl px-4 md:px-6 bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200 data-[state=open]:bg-secondary/50">
                  <AccordionTrigger className="hover:no-underline py-5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                      <span className="font-medium text-foreground">{t("features.faq1Question")}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-8 text-muted-foreground leading-relaxed">
                    <>Reviewsvisor utilise une intelligence artificielle avancée pour analyser vos avis clients. L'outil lit chaque commentaire, identifie le ton et l'émotion, <span className="text-green-500 font-medium">extrait les mots-clés importants</span> et détecte automatiquement les points forts et les points faibles. Vous obtenez ensuite une <span className="text-green-500 font-medium">synthèse claire avec des axes d'amélioration prioritaires</span>.</>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border border-border/60 rounded-xl px-4 md:px-6 bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200 data-[state=open]:bg-secondary/50">
                  <AccordionTrigger className="hover:no-underline py-5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                      <span className="font-medium text-foreground">{t("features.faq2Question")}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-8 text-muted-foreground leading-relaxed">
                    <>Reviewsvisor ne se limite pas aux chiffres. L'IA analyse le ton, le vocabulaire et les émotions dans chaque avis afin de révéler les véritables ressentis des clients. L'outil identifie les tendances, les points forts et les axes d'amélioration, pour offrir <span className="text-green-500 font-medium">une vision stratégique plutôt qu'un simple tableau de données</span>.</>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border border-border/60 rounded-xl px-4 md:px-6 bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200 data-[state=open]:bg-secondary/50">
                  <AccordionTrigger className="hover:no-underline py-5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                      <span className="font-medium text-foreground">{t("features.faq3Question")}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-8 text-muted-foreground leading-relaxed">
                    <>L'IA regroupe les retours clients par thématiques récurrentes (accueil, qualité, prix, service, ambiance, etc.). Elle mesure la fréquence et la tonalité de chaque sujet pour établir une <span className="text-green-500 font-medium">liste claire des priorités d'amélioration à fort impact</span>.</>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border border-border/60 rounded-xl px-4 md:px-6 bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200 data-[state=open]:bg-secondary/50">
                  <AccordionTrigger className="hover:no-underline py-5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                      <span className="font-medium text-foreground">{t("features.faq4Question")}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-8 text-muted-foreground leading-relaxed">
                    <>Reviewsvisor utilise des modèles d'intelligence artificielle entraînés sur des millions de commentaires clients réels. <span className="text-green-500 font-medium">Le taux de précision moyen dépasse 90 %</span>, avec une amélioration continue grâce à l'apprentissage automatique des nouveaux avis analysés.</>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border border-border/60 rounded-xl px-4 md:px-6 bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200 data-[state=open]:bg-secondary/50">
                  <AccordionTrigger className="hover:no-underline py-5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                      <span className="font-medium text-foreground">{t("features.faq5Question")}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-8 text-muted-foreground leading-relaxed">
                    {t("features.faq5Answer")}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border border-border/60 rounded-xl px-4 md:px-6 bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200 data-[state=open]:bg-secondary/50">
                  <AccordionTrigger className="hover:no-underline py-5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                      <span className="font-medium text-foreground">{t("features.faq6Question")}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-8 text-muted-foreground leading-relaxed">
                    <>Cette fonctionnalité arrive très bientôt ! Reviewsvisor intégrera prochainement une <span className="text-green-500 font-medium">analyse concurrentielle avancée</span>, permettant de comparer vos indicateurs clés à ceux de vos concurrents directs. <span className="text-green-500 font-medium">Un véritable benchmarkeur intelligent</span> pour suivre votre position sur le marché.</>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="border border-border/60 rounded-xl px-4 md:px-6 bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200 data-[state=open]:bg-secondary/50">
                  <AccordionTrigger className="hover:no-underline py-5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="h-5 w-5 text-blue shrink-0" />
                      <span className="font-medium text-foreground">{t("features.faq7Question")}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-8 text-muted-foreground leading-relaxed">
                    <>Oui. Reviewsvisor permet de <span className="text-green-500 font-medium">centraliser la gestion de plusieurs établissements</span> depuis un tableau de bord unique. <span className="text-green-500 font-medium">Chaque lieu dispose de ses propres rapports, filtres et analyses</span>, tout en conservant une vision globale de la performance du groupe.</>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>
      </main>
      </div>
    </div>
  );
};

export default Fonctionnalites;