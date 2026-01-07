import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface AiAssistanceProps {
  className?: string;
}

const AiAssistance = ({ className }: AiAssistanceProps) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
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
      const { data, error } = await supabase.functions.invoke("ai-assistance", {
        body: { question: question.trim() },
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
        if (data.error.includes("Trop de requêtes") || data.error.includes(t("aiAssistance.tooManyRequests"))) {
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

  return (
    <div className="w-full my-8 p-6 bg-card border border-border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-2 text-foreground">
        {t("help.aiAssistance")}
      </h2>
      <p className="text-foreground/70 mb-4 text-sm">
        {t("aiAssistance.askQuestionsAboutReviewsvisor")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder={t("aiAssistance.placeholderExample")}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-background"
          />
          <Button type="submit" disabled={isLoading} className="shrink-0">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4 !text-white" stroke="white" />
            )}
            <span className="ml-2">{t("aiAssistance.ask")}</span>
          </Button>
        </div>

        {answer && (
          <div className="p-4 bg-background border border-border rounded-md">
            <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
              {answer}
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default AiAssistance;
