import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bot, Building2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AppPageBackground } from "@/components/AppPageBackground";
import { AdvisorContent } from "@/components/advisor/AdvisorContent";
import { useAuth } from "@/contexts/AuthProvider";
import { useEstablishmentStore } from "@/store/establishmentStore";
import { getDashboardSnapshot } from "@/services/dashboardSnapshot";
import { loadLatestAnalysis } from "@/services/analysisLoader";
import { listAll } from "@/services/reviewsService";
import { getEstablishmentTypeTranslationKey } from "@/utils/establishmentTypeMapping";
import {
  clearAdvisorReturnPath,
  getAdvisorReturnPath,
} from "@/utils/advisorNavigation";
import i18n from "@/i18n/config";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AdvisorPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedEstablishment, activePlaceId } = useEstablishmentStore();
  const [insight, setInsight] = useState<Record<string, unknown> | null>(null);
  const [reviews, setReviews] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const placeId = activePlaceId ?? selectedEstablishment?.place_id ?? null;
  const establishmentName =
    selectedEstablishment?.name ?? t("establishment.establishment");
  const establishmentAddress = selectedEstablishment?.formatted_address ?? "";
  const establishmentType =
    selectedEstablishment?.types?.[i18n.language] ?? null;

  useEffect(() => {
    let cancelled = false;

    const loadAdvisorData = async () => {
      if (!user?.id || !placeId) {
        setInsight(null);
        setReviews([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const snapshot = getDashboardSnapshot(placeId);
      if (snapshot?.insight || (snapshot?.reviews?.length ?? 0) > 0) {
        if (!cancelled) {
          setInsight(snapshot.insight ?? null);
          setReviews(snapshot.reviews ?? []);
          setIsLoading(false);
        }
      }

      try {
        const [analysisResult, fetchedReviews] = await Promise.all([
          loadLatestAnalysis(placeId, user.id),
          listAll(placeId),
        ]);

        if (cancelled) return;

        if (analysisResult.success && analysisResult.data) {
          setInsight(analysisResult.data as Record<string, unknown>);
        }

        setReviews(fetchedReviews ?? []);
      } catch (error) {
        console.error("[Advisor] Failed to load advisor context:", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadAdvisorData();

    return () => {
      cancelled = true;
    };
  }, [placeId, user?.id]);

  const handleBack = () => {
    const returnPath = getAdvisorReturnPath();
    clearAdvisorReturnPath();
    navigate(returnPath);
  };

  const headerSubtitle = useMemo(() => {
    const typeLabel = establishmentType ? ` (${establishmentType})` : "";
    return `${t("dashboard.aiAssistant")} • ${establishmentName}${typeLabel}`;
  }, [establishmentName, establishmentType, t]);

  return (
    <div className="app-page-shell">
      <AppPageBackground />

      <main className="relative flex-1">
        <div className="relative z-10">
          <div className="container mx-auto max-w-[1200px] px-4 py-6 pb-12 md:px-5 md:py-8">
            <div className="mb-8 bg-white dark:bg-slate-900 shadow-sm dark:shadow-slate-950/40 rounded-2xl p-6 border border-transparent dark:border-slate-800">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-center gap-3 xl:flex-shrink-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {t("dashboard.agent")}
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="truncate text-sm text-slate-500 dark:text-slate-400 max-w-[260px] cursor-pointer">
                            {headerSubtitle}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{headerSubtitle}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {selectedEstablishment && (
                  <div className="w-full xl:max-w-[600px] flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-4 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                      <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {establishmentName}
                        {establishmentType ? (
                          <span className="font-normal text-slate-500 dark:text-slate-400">
                            {" "}
                            • (<em>{establishmentType}</em>)
                          </span>
                        ) : null}
                      </div>
                      {establishmentAddress ? (
                        <div className="text-xs text-slate-500 dark:text-slate-400 max-w-[500px]">
                          {establishmentAddress}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex w-full xl:w-auto justify-center shrink-0 items-center gap-2 rounded-[10px] border border-[#e5e0f0] bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 transition-all hover:-translate-y-px hover:border-violet-400 hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-violet-950/30"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("common.back")}
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            ) : !placeId ? (
              <div className="rounded-[20px] bg-white p-10 text-center shadow-[0_4px_16px_rgba(80,60,130,0.08)] dark:border dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t("establishment.noEstablishmentSelected")}
                </p>
              </div>
            ) : (
              <AdvisorContent
                establishmentName={establishmentName}
                insight={insight}
                reviews={reviews}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdvisorPage;
