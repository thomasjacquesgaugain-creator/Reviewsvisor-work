import { useEffect, useState } from "react";
import BackArrow from "@/components/BackArrow";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthProvider";

interface LegalDocViewerProps {
  docSlug: string;
  pdfFilename?: string;
  pdfDownloadName?: string;
}

export function LegalDocViewer({
  docSlug,
}: LegalDocViewerProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const htmlUrl = `/legal/${docSlug}.html`;
  const embeddedDocumentOverrides = `
    <style>
      body {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .legal-doc-content {
        color: #374151;
      }

      .dark .legal-doc-content {
        color: #cbd5e1;
      }

      .dark .legal-doc-content h1,
      .dark .legal-doc-content h2,
      .dark .legal-doc-content h3,
      .dark .legal-doc-content h4,
      .dark .legal-doc-content h5,
      .dark .legal-doc-content h6,
      .dark .legal-doc-content strong,
      .dark .legal-doc-content b {
        color: #f8fafc !important;
      }

      .dark .legal-doc-content p,
      .dark .legal-doc-content li,
      .dark .legal-doc-content td,
      .dark .legal-doc-content blockquote {
        color: #cbd5e1 !important;
      }

      .dark .legal-doc-content .update-date {
        color: #94a3b8 !important;
      }

      .dark .legal-doc-content h2 {
        border-bottom-color: #334155 !important;
      }

      .dark .legal-doc-content th {
        background: #1e293b !important;
        color: #f8fafc !important;
        border-color: #334155 !important;
      }

      .dark .legal-doc-content td {
        border-color: #334155 !important;
      }

      .dark .legal-doc-content tr:nth-child(even) td {
        background: #0f172a !important;
      }

      .dark .legal-doc-content a {
        color: #60a5fa !important;
      }

      .legal-doc-content .footer {
        display: none !important;
      }
    </style>
  `;

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
        const content =
          embeddedDocumentOverrides +
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="relative z-10">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <BackArrow top="top-[70px]" scrollTop="top-[15px]" isLoggedIn={user ? true : false}/>
            <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 !mb-0">
                {t("footer.legalHeader")}
              </h1>
              <p className="!mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t("footer.legalHeaderMessage")}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-5 py-8 sm:px-8 lg:px-12">
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Chargement du document…
                  </p>
                </div>
              )}

              {error && !loading && (
                <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-4">
                  <p className="font-semibold text-red-700 dark:text-red-400">
                    Le document n&apos;a pas pu être chargé
                  </p>

                  <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                    {error}
                  </p>
                </div>
              )}

              {!loading && !error && bodyContent && (
                <article
                  className="legal-doc-content max-w-none overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: bodyContent }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
