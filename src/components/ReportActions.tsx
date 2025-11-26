import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Download, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReportActionsProps {
  establishmentId?: string;
  placeId?: string;
  establishmentName?: string;
}

export default function ReportActions({ establishmentId, placeId, establishmentName }: ReportActionsProps) {
  const [email, setEmail] = useState("");
  const [loadingJson, setLoadingJson] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  const handleDownloadJson = async () => {
    setLoadingJson(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Vous devez être connecté");
        return;
      }

      const response = await supabase.functions.invoke('download-report-json', {
        body: { establishmentId, placeId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Créer un blob et télécharger le fichier
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${establishmentName?.replace(/[^a-z0-9]/gi, '-') || 'analyse'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Rapport téléchargé avec succès");
    } catch (error: any) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error(error.message || "Erreur lors du téléchargement");
    } finally {
      setLoadingJson(false);
    }
  };

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      toast.error("Adresse email invalide");
      return;
    }

    setLoadingEmail(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Vous devez être connecté");
        return;
      }

      const response = await supabase.functions.invoke('send-report-email', {
        body: { establishmentId, placeId, to: email },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success(`Rapport envoyé à ${email}`);
      setEmail("");
    } catch (error: any) {
      console.error("Erreur lors de l'envoi:", error);
      toast.error(error.message || "Erreur lors de l'envoi");
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Téléchargement JSON */}
      <Button
        onClick={handleDownloadJson}
        disabled={loadingJson}
        variant="outline"
        className="w-full sm:w-auto"
      >
        {loadingJson ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Télécharger en JSON
      </Button>

      {/* Envoi par email */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          placeholder="Adresse email du destinataire"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={loadingEmail}
        />
        <Button
          onClick={handleSendEmail}
          disabled={loadingEmail || !email}
          className="w-full sm:w-auto"
        >
          {loadingEmail ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Envoyer le rapport
        </Button>
      </div>
    </div>
  );
}
