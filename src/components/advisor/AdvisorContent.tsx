import { useRef, useState } from "react";
import { Bot, Info, Loader2, Send, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  buildEstablishmentContext,
  type EstablishmentContext,
} from "@/components/advisor/buildEstablishmentContext";

const FAQ_QUESTION_KEYS = [
  "help.faq6Question",
  "help.faq7Question",
  "help.faq8Question",
  "help.faq9Question",
  "help.faq10Question",
  "help.faq11Question",
  "help.faq12Question",
  "help.faq13Question",
  "help.faq14Question",
  "help.faq15Question",
] as const;

interface AdvisorContentProps {
  establishmentName: string;
  insight: Record<string, unknown> | null;
  reviews: Array<Record<string, unknown>>;
}

export function AdvisorContent({
  establishmentName,
  insight,
  reviews,
}: AdvisorContentProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const questionInputRef = useRef<HTMLInputElement | null>(null);

  const resetAdvisor = () => {
    setQuestion("");
    setAnswer("");
    setIsLoading(false);
  };

  const submitQuestion = async (questionText: string) => {
    if (!questionText.trim()) {
      toast({
        title: t("aiAssistance.emptyQuestion"),
        description: t("aiAssistance.pleaseAskQuestion"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setAnswer(t("aiAssistance.analysisInProgress"));

    try {
      const establishmentContext: EstablishmentContext = buildEstablishmentContext(
        establishmentName,
        insight,
        reviews,
      );

      const { data, error } = await supabase.functions.invoke("ai-assistance", {
        body: {
          question: questionText.trim(),
          establishmentContext,
          language: i18n.language,
        },
      });

      if (error) {
        console.error("Erreur:", error);
        setAnswer(t("aiAssistance.errorOccurred"));
        toast({
          title: t("common.error"),
          description: t("aiAssistance.cannotContactAI"),
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        setAnswer(data.error);
        if (
          data.error.includes("Trop de requêtes") ||
          data.error.includes(t("aiAssistance.tooManyRequests"))
        ) {
          toast({
            title: t("aiAssistance.limitReached"),
            description: data.error,
            variant: "destructive",
          });
        }
        return;
      }

      setAnswer(data?.answer || t("aiAssistance.noAnswerReceived"));
    } catch (err) {
      console.error("Erreur inattendue:", err);
      setAnswer(t("errors.generic"));
      toast({
        title: t("common.error"),
        description: t("errors.generic"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitQuestion(question);
  };

  const handleFaqClick = (faqKey: (typeof FAQ_QUESTION_KEYS)[number]) => {
    const faqQuestion = t(faqKey);
    setQuestion(faqQuestion);
    setAnswer("");
    questionInputRef.current?.focus();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-300 space-y-4">
      <Card className="rounded-[20px] border-transparent bg-white shadow-[0_4px_16px_rgba(80,60,130,0.08),0_1px_3px_rgba(80,60,130,0.05)] dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="p-6">
          <div className="mb-1 flex items-center gap-2.5">
            <Bot className="h-[22px] w-[22px] shrink-0 text-violet-500" />
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t("dashboard.agent")}
            </span>
          </div>

          <p className="mb-[18px] max-w-[680px] text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">
              {t("dashboard.aiRespondReviewTitle")}
            </span>{" "}
            {t("dashboard.aiRespondReviewDescription")}
          </p>

          <div className="rounded-[14px] border border-[#ececf2] bg-[#fafafd] p-3 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex gap-3">
              <div className="w-1 shrink-0 self-stretch rounded-full bg-gradient-to-b from-blue-500 to-blue-500/30" />
              <form onSubmit={handleSubmit} className="flex flex-1 flex-wrap gap-2 sm:flex-nowrap">
                <Input
                  ref={questionInputRef}
                  type="text"
                  placeholder={t("dashboard.askQuestion")}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 rounded-[10px] border-[#e5e7eb] bg-white dark:border-slate-600 dark:bg-slate-900"
                />
                {question.trim() && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => {
                      resetAdvisor();
                      questionInputRef.current?.focus();
                    }}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="shrink-0 bg-blue-500 text-white hover:bg-blue-600 rounded-[10px]"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="ml-2 ">{t("aiAssistance.ask")}</span>
                </Button>
              </form>
            </div>
          </div>

          {answer && (
            <div className="mt-4 rounded-md border border-border bg-white p-4 dark:bg-slate-900">
              <div
                className="whitespace-pre-wrap text-sm leading-relaxed text-foreground"
                dangerouslySetInnerHTML={{
                  __html: answer
                    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                    .replace(/\n/g, "<br />"),
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[20px] border-transparent bg-white shadow-[0_4px_16px_rgba(80,60,130,0.08),0_1px_3px_rgba(80,60,130,0.05)] dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
              <Info className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground md:text-2xl">
                {t("help.frequentQuestions")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("help.frequentQuestionsHint")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {FAQ_QUESTION_KEYS.map((faqKey) => (
              <button
                key={faqKey}
                type="button"
                onClick={() => handleFaqClick(faqKey)}
                className="w-full cursor-pointer rounded-lg border border-border/50 bg-secondary/20 px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/80 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:hover:bg-blue-950/30"
              >
                <p className="font-medium text-foreground">{t(faqKey)}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
