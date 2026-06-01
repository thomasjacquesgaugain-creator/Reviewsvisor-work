import { useEffect, useState, useCallback } from "react";
import { getCurrentEstablishment } from "@/services/establishments";
import {
  Etab,
  EVT_SAVED,
  EVT_LIST_UPDATED,
  EVT_ESTABLISHMENT_UPDATED,
  STORAGE_KEY,
} from "../types/etablissement";
import {
  BarChart3,
  Download,
  ExternalLink,
  Star,
  Phone,
  Globe,
  MapPin,
  Building2,
  Loader2,
  Plus,
} from "lucide-react";
import { runAnalyze } from "@/lib/runAnalyze";
import {
  importGoogleReviews,
  type ImportReviewSource,
} from "@/lib/importGoogleReviews";
import { toast as sonnerToast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface MonEtablissementCardProps {
  onAddClick?: () => void;
}

export default function MonEtablissementCard({
  onAddClick,
}: MonEtablissementCardProps) {
  const [etab, setEtab] = useState<Etab | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImportingReviews, setIsImportingReviews] = useState(false);
  const [importSource, setImportSource] =
    useState<ImportReviewSource>("google");
  const [forceFullImport, setForceFullImport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  // Charger l'établissement actif depuis la DB (source de vérité)
  const loadActiveEstablishment = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setEtab(null);
        setIsLoading(false);
        return;
      }

      // Récupérer l'établissement actif depuis la DB

      //Fetching the current establishment from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_establishment_id")
        .eq("user_id", user.id)
        .single();

      const { data: establishment, error } = await supabase
        .from("establishments")
        .select("*")
        .eq("id", profile.current_establishment_id)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Erreur chargement établissement actif:", error);
        setEtab(null);
      } else if (profile) {
        const row = establishment as Record<string, unknown>;
        setEtab({
          id: establishment.id,
          place_id: establishment.place_id,
          name: establishment.name,
          address: establishment.formatted_address || "",
          phone: establishment.phone || undefined,
          website: establishment.website || undefined,
          //url: data.google_maps_url || undefined,
          rating: establishment.rating || undefined,
          lat: establishment.lat || null,
          lng: establishment.lng || null,
          types: (row.types as string) || undefined,
          last_reviews_import: (row.last_reviews_import as string) ?? null,
        });
      } else {
        setEtab(null);
      }
    } catch (err) {
      console.error("Erreur chargement établissement actif:", err);
      setEtab(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 1) Au mount, charger depuis la DB
  useEffect(() => {
    loadActiveEstablishment();
  }, [loadActiveEstablishment]);

  // 2) Se mettre à jour quand on clique "Enregistrer" ou qu'on sélectionne un autre
  useEffect(() => {
    const onSaved = () => {
      // Recharger depuis la DB pour avoir les données persistées
      loadActiveEstablishment();
    };
    window.addEventListener(EVT_SAVED, onSaved);
    return () => window.removeEventListener(EVT_SAVED, onSaved);
  }, [loadActiveEstablishment]);

  // 3) Écouter les changements d'auth (login/logout)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        loadActiveEstablishment();
      } else if (event === "SIGNED_OUT") {
        setEtab(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [loadActiveEstablishment]);

  const opts = {
    name: etab?.name ?? undefined,
    address: etab?.address || undefined,
    forceFullImport,
  };

  const handleImportReviews = async (source?: ImportReviewSource) => {
    if (!etab?.place_id) return;
    const src = source ?? importSource;
    setIsImportingReviews(true);
    try {
      const result = await importGoogleReviews(etab.place_id, 2000, {
        ...opts,
        source: src,
      });
      if (result.success) {
        loadActiveEstablishment();
        if (result.total === 0) {
          sonnerToast.info(
            t(
              "establishment.importNoReviews",
              "Aucun avis trouvé pour ce lieu",
            ),
          );
        } else {
          sonnerToast.success(
            t(
              "establishment.importReviewsSuccess",
              "{{inserted}} avis importés, {{skipped}} déjà présents",
              {
                inserted: result.inserted,
                skipped: result.skipped,
              },
            ),
          );
        }
      } else {
        sonnerToast.error(
          result.error || t("errors.generic", "Erreur lors de l'import"),
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sonnerToast.error(
        message || t("errors.generic", "Erreur lors de l'import"),
      );
    } finally {
      setIsImportingReviews(false);
    }
  };

  const handleImportAllReviews = async () => {
    if (!etab?.place_id) return;
    setIsImportingReviews(true);
    try {
      const sources: ImportReviewSource[] = [
        "google",
        "tripadvisor",
        "trustpilot",
      ];
      const results = await Promise.all(
        sources.map((src) =>
          importGoogleReviews(etab.place_id!, 2000, { ...opts, source: src }),
        ),
      );
      const inserted = results.reduce((a, r) => a + (r.inserted ?? 0), 0);
      const skipped = results.reduce((a, r) => a + (r.skipped ?? 0), 0);
      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        sonnerToast.warning(
          t(
            "establishment.importAllReviewsSuccess",
            "Import terminé : {{inserted}} avis importés au total, {{skipped}} déjà présents",
            {
              inserted,
              skipped,
            },
          ) + ` (${failed.length} plateforme(s) en erreur)`,
        );
      } else {
        sonnerToast.success(
          t(
            "establishment.importAllReviewsSuccess",
            "Import terminé : {{inserted}} avis importés au total, {{skipped}} déjà présents",
            {
              inserted,
              skipped,
            },
          ),
        );
      }
      loadActiveEstablishment();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sonnerToast.error(
        message || t("errors.generic", "Erreur lors de l'import"),
      );
    } finally {
      setIsImportingReviews(false);
    }
  };

  // Fonction pour analyser l'établissement
  const handleAnalyze = async () => {
    if (!etab?.place_id) return;

    setIsAnalyzing(true);
    try {
      const result = await runAnalyze({
        place_id: etab.place_id,
        name: etab.name,
        address: etab.address,
      });

      if (result.ok) {
        sonnerToast.success(
          t("establishment.reviewsAnalyzedSuccessCount", {
            count: result.counts?.collected || 0,
          }),
          {
            duration: 5000,
          },
        );
      } else {
        sonnerToast.error(t("establishment.analysisErrorOccurred"), {
          duration: 5000,
        });
      }
    } catch (error) {
      sonnerToast.error(t("establishment.unexpectedErrorOccurred"), {
        duration: 5000,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-600 dark:text-slate-400" />
      </div>
    );
  }

  // Fonction pour ouvrir la recherche (utilise la prop du parent)
  const handleAddClick = () => {
    if (onAddClick) {
      onAddClick();
    }
  };

  if (!etab) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[180px]">
        <button
          onClick={handleAddClick}
          className="cursor-pointer rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 min-w-[200px] max-w-[250px] shadow-sm hover:shadow-md hover:bg-primary/5 dark:hover:bg-slate-800 hover:border-primary/50 transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[80px]"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            {t("establishment.add")}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm pt-6 px-6 pb-4">
      {/* Grille 3 colonnes : L1 Nom | Note | Site web ; L2 Adresse | (vide) | Google Maps ; L3 Téléphone */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-6">
        {/* Ligne 1 - Col 1 : Nom */}
        <div className="flex flex-col gap-1 md:col-start-1 md:row-start-1">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            {t("establishment.nameLabel")}
          </p>
          <p className="text-base font-medium text-gray-900 dark:text-slate-100">{etab.name}</p>
        </div>

        {/* Ligne 1 - Col 2 : Note Google */}
        <div className="flex flex-col gap-1 md:col-start-2 md:row-start-1">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            {t("establishment.googleRating")}
          </p>
          {etab.rating ? (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/15 px-2.5 py-0.5 text-sm font-medium text-amber-950 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-100">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-600 dark:fill-amber-400 dark:text-amber-300" />
              {etab.rating}
            </span>
          ) : (
            <p className="text-base text-slate-600 dark:text-slate-400">—</p>
          )}
        </div>

        {/* Ligne 1 - Col 3 : Site web */}
        <div className="flex flex-col gap-1 md:col-start-3 md:row-start-1">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            {t("establishment.website")}
          </p>
          {etab.website ? (
            <a
              href={etab.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              {t("establishment.websiteOpen")}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <p className="text-base text-slate-600 dark:text-slate-400">—</p>
          )}
        </div>

        {/* Ligne 2 - Col 1 : Adresse */}
        <div className="flex flex-col gap-1 md:col-start-1 md:row-start-2">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {t("establishment.address")}
          </p>
          <p className="text-base font-medium text-gray-900 dark:text-slate-100">
            {etab.address}
          </p>
        </div>

        {/* Ligne 2 - Col 3 : Google Maps (sous Site web ; col 2 vide) */}
        <div className="flex flex-col gap-1 md:col-start-3 md:row-start-2">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            {t("establishment.googleMaps")}
          </p>
          {etab.place_id ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(etab.name)}&query_place_id=${encodeURIComponent(etab.place_id)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              {t("establishment.viewListing")}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : etab.address ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(etab.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              {t("establishment.viewListing")}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <p className="text-base text-slate-600 dark:text-slate-400">—</p>
          )}
        </div>

        {/* Ligne 3 - Col 1 : Téléphone */}
        <div className="flex flex-col gap-1 md:col-start-1 md:row-start-3">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            {t("establishment.phone")}
          </p>
          <p className="text-base font-medium text-gray-900 dark:text-slate-100">
            {etab.phone || "—"}
          </p>
        </div>
      </div>

      {/* Ligne du bas: place_id | Importer | Visuel | Supprimer */}
      <div className="border-t border-slate-200 dark:border-slate-800 mt-4 pt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* place_id à gauche */}
        <div className="flex items-center gap-2 md:w-1/3 md:max-w-[320px]">
          <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-xs text-slate-600 dark:text-slate-400 font-mono truncate">
            {t("establishment.placeId")}: {etab.place_id}
          </p>
        </div>

        {/* Importer au centre : dernière MAJ + sélecteur + boutons + forcer import complet */}
        <div className="flex flex-col md:flex-1 md:justify-center gap-2 items-center">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {etab.last_reviews_import
              ? t(
                  "establishment.lastReviewsImport",
                  "Dernière mise à jour : {{date}}",
                  {
                    date: new Date(etab.last_reviews_import).toLocaleString(
                      undefined,
                      {
                        dateStyle: "short",
                        timeStyle: "short",
                      },
                    ),
                  },
                )
              : t("establishment.noPreviousImport", "Aucun import précédent")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <label
              htmlFor="import-source"
              className="text-xs text-slate-600 dark:text-slate-400 font-medium sr-only"
            >
              Plateforme
            </label>
            <div className="relative">
              <select
                id="import-source"
                value={importSource}
                onChange={(e) =>
                  setImportSource(e.target.value as ImportReviewSource)
                }
                className="appearance-none rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-gray-900 dark:text-slate-100 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="select-import-source"
              >
                <option value="google">{t("platforms.google")}</option>
              </select>

              <svg
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 dark:text-slate-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m6 9 6 6 6-6"
                />
              </svg>
            </div>
            <button
              type="button"
              // onClick={() => handleImportReviews()}
              disabled={isImportingReviews}
              className="inline-flex h-auto items-center justify-center gap-1 rounded-lg border border-primary bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              title={t("establishment.importFromPlatform", {
                platform: t(`platforms.${importSource}`),
              })}
              data-testid="btn-import-avis"
            >
              {isImportingReviews ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {t("establishment.importFromPlatform", {
                platform: t(`platforms.${importSource}`),
              })}
            </button>
          </div>
          {/* <button
            type="button"
            onClick={handleImportAllReviews}
            disabled={isImportingReviews}
            className="inline-flex px-3 py-2 h-auto items-center justify-center gap-1 rounded-lg border border-primary/60 bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
            title={t("establishment.importAllReviews")}
            data-testid="btn-import-all-avis"
          >
            {t("establishment.importAllReviews")}
          </button> */}
          {/* <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={forceFullImport}
              onChange={(e) => setForceFullImport(e.target.checked)}
              className="rounded border-input"
              data-testid="checkbox-force-full-import"
            />
            {t("establishment.forceFullImport", "Forcer l'import complet")}
          </label> */}
        </div>

        {/* Visuel à droite */}
        <div className="flex flex-col md:flex-row md:w-1/3 md:justify-end gap-2">
          <button
            type="button"
            className="inline-flex h-auto w-full flex-col items-center justify-center gap-1 rounded-lg border border-primary bg-primary px-4 py-3 text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 md:w-44"
            title={t("establishment.visualReviews")}
            data-testid="btn-analyser-etablissement"
            data-place-id={etab.place_id}
            data-name={etab.name}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-[10px] font-medium">{t("establishment.visualReviews")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
