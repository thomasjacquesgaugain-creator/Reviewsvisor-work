import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

export function LexiqueSection() {
  const { t } = useTranslation();
  const lexiqueItems = [
    {
      term: "KPI",
      description: t("analysis.lexique.kpiDescription"),
    },
    {
      term: t("analysis.lexique.paretoAnalysis"),
      description: t("analysis.lexique.paretoAnalysisDescription"),
    },
    {
      term: t("analysis.lexique.rootCauseAnalysis"),
      description: t("analysis.lexique.rootCauseAnalysisDescription"),
    },
    {
      term: t("analysis.lexique.aiTrust"),
      description: t("analysis.lexique.aiTrustDescription"),
    },
  ];

  return (
    <Card className="mt-12 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {t("analysis.lexique.title")}
          </h3>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        <Accordion type="single" collapsible className="w-full">
          {lexiqueItems.map((item, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border-b border-slate-200 dark:border-slate-700 last:border-b-0"
            >
              <AccordionTrigger className="hover:no-underline py-2">
                <span className="font-medium text-slate-900 dark:text-slate-100 text-left text-sm">
                  {item.term}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-6">
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
