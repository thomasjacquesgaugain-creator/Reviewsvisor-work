import { useCallback, useState } from "react";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";

export function useReviewsVisual() {
  const currentEstablishment = useCurrentEstablishment();
  const [refreshToken, setRefreshToken] = useState(0);

  const refetchList = useCallback(async (opts?: { cache?: string }) => {
    // Trigger a refresh of the reviews list
    window.dispatchEvent(new CustomEvent("reviews:refresh", { 
      detail: { establishmentId: currentEstablishment?.id || currentEstablishment?.place_id } 
    }));
  }, [currentEstablishment]);

  const refetchSummary = useCallback(async () => {
    // Trigger a refresh of the summary
    setRefreshToken(Date.now());
    window.dispatchEvent(new CustomEvent("reviews:summary-refresh", { 
      detail: { establishmentId: currentEstablishment?.id || currentEstablishment?.place_id } 
    }));
  }, [currentEstablishment]);

  const openPanel = useCallback(() => {
    // Trigger opening of the visual panel
    window.dispatchEvent(new CustomEvent("reviews:open-panel"));
  }, []);

  return { 
    openPanel, 
    refetchList, 
    refetchSummary, 
    refreshToken 
  };
}