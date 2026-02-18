import { useEffect, useState } from "react";
import BackArrow from "@/components/BackArrow";

interface LegalDocViewerProps {
  docSlug: string;
  pdfFilename?: string;
  pdfDownloadName?: string;
}

export function LegalDocViewer({
  docSlug,
}: LegalDocViewerProps) {
  const htmlUrl = `/legal/${docSlug}.html`;

  const [bodyContent, setBodyContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setBodyContent(null);

    fetch(htmlUrl)
      .then((res) => {
        console.log("[LegalDocViewer] fetch", htmlUrl, "status:", res.status);
        if (!res.ok) {
          throw new Error(`Fichier introuvable (${res.status}). Vérifiez que public/legal/${docSlug}.html existe.`);
        }
        return res.text();
      })
      .then((html) => {
        const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const widthOverride =
          "<style>body { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }</style>";
        const content =
          widthOverride +
          (styleMatch ? `<style>${styleMatch[1]}</style>` : "") +
          (bodyMatch?.[1] ?? html);
        console.log("[LegalDocViewer] content length:", content?.length ?? 0);
        setBodyContent(content);
        setError(null);
      })
      .catch((err) => {
        console.error("[LegalDocViewer] fetch error:", err);
        setError(err instanceof Error ? err.message : "Erreur de chargement");
        setBodyContent(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [htmlUrl, docSlug]);

  return (
    <div className="min-h-0 flex-1 bg-white">
      <BackArrow />
      <div className="w-full bg-white px-6 py-10 [&_.footer]:hidden">
        {loading && (
          <p className="text-muted-foreground py-8">Chargement du document…</p>
        )}

        {error && !loading && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive">
            <p className="font-medium">Le document n&apos;a pas pu être chargé</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && bodyContent && (
          <div
            className="prose prose-slate max-w-none [&_.footer]:hidden"
            dangerouslySetInnerHTML={{ __html: bodyContent }}
          />
        )}
      </div>
    </div>
  );
}
