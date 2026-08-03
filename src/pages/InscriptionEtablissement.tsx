import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import EtablissementPage from "./Etablissement";
import { PlanSelectionModal } from "@/components/PlanSelectionModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { Etab } from "@/types/etablissement";


export default function InscriptionEtablissement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [checkingSession, setCheckingSession] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Etab | null>(null);
  const [reviewCountLast12Months, setReviewCountLast12Months] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) navigate("/inscription", { replace: true });
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("onboarding_status")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Failed to load onboarding_status:", error);
        navigate("/inscription", { replace: true });
        return;
      }

      const status = profile?.onboarding_status;

      if (status === "email_pending") {
        navigate("/inscription/verifier-email", { replace: true });
        return;
      }
      if (status === "active") {
        navigate("/tableau-de-bord", { replace: true }); // adjust to your actual app home route
        return;
      }

      setCheckingSession(false);
    }

    checkStatus();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleContinue(selected: Etab) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke("outscraper-google-reviews-count", {
        body: {
          placeId: selected.place_id,
          name: selected.name,
          address: selected.address,
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (error) {
        let errorMessage = t("common.somethingWentWrong");
        try {
          if ("context" in error && error.context) {
            const errorBody = await error.context.json();
            errorMessage = errorBody?.error || errorMessage;
          }
        } catch {
          // fall through with generic message
        }
        throw new Error(errorMessage);
      }

      const payload = typeof data === "string" ? JSON.parse(data) : data;
      const count = Number(payload?.last12MonthsReviewsCount ?? payload?.total ?? 0) || 0;

      setSelectedEstablishment(selected);
      setReviewCountLast12Months(count);
      setShowPlanModal(true);
    } catch (error: any) {
      console.error("Failed to fetch review count for plan recommendation:", error);
      toast.error(error?.message || t("common.somethingWentWrong"));
    }
  }

  async function handleLeave() {
    setLeaving(true);
    try {
      await signOut();
      sessionStorage.removeItem("pending_verification_email");
      navigate("/inscription", { replace: true });
    } catch (err) {
      console.error("Error signing out:", err);
      toast.error(t("common.somethingWentWrong"));
      setLeaving(false);
    }
  }

  if (checkingSession) return null; // brief flash only, redirect effect handles the no-session case

  return (
    <>
      <button
        type="button"
        onClick={handleLeave}
        disabled={leaving}
        className="fixed top-[15px] left-[24px] z-50 flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 disabled:opacity-50"
        aria-label={t("common.backToHome", "Retour")}
      >
        <ArrowLeft size={28} color="#2F6BFF" strokeWidth={2.5} />
      </button>
      <EtablissementPage mode="signup" onContinue={handleContinue} />
      <PlanSelectionModal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        establishment={selectedEstablishment}
        reviewCountLast12Months={reviewCountLast12Months}
      />
    </>
  );
}