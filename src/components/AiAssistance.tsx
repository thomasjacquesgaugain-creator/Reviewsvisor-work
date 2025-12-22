import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AiAssistanceProps {
  className?: string;
}

const AiAssistance = ({ className }: AiAssistanceProps) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast({
        title: "Question vide",
        description: "Veuillez poser une question.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setAnswer("Analyse en cours…");

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistance", {
        body: { question: question.trim() },
      });

      if (error) {
        console.error("Erreur:", error);
        setAnswer("Une erreur est survenue. Veuillez réessayer.");
        toast({
          title: "Erreur",
          description: "Impossible de contacter l'assistant IA.",
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        setAnswer(data.error);
        if (data.error.includes("Trop de requêtes")) {
          toast({
            title: "Limite atteinte",
            description: data.error,
            variant: "destructive",
          });
        }
        return;
      }

      setAnswer(data?.answer || "Aucune réponse reçue.");
    } catch (err) {
      console.error("Erreur inattendue:", err);
      setAnswer("Une erreur inattendue est survenue.");
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[700px] mx-auto my-8 p-6 bg-[#F7F7F9] border border-border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-2 text-foreground">
        Assistance IA
      </h2>
      <p className="text-foreground/70 mb-4 text-sm">
        Posez ici vos questions concernant uniquement <span className="text-blue font-semibold">Reviewsvisor</span>.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Ex : Comment importer mes avis ?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-background"
          />
          <Button type="submit" disabled={isLoading} className="shrink-0">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="ml-2">Demander</span>
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
