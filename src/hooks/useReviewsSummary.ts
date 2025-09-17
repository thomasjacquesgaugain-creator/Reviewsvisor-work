import { useState, useEffect } from "react";

export interface ReviewsSummary {
  totalAll?: number;
  avgRating?: number;
}

export function useReviewsSummary(establishmentId?: string, refreshToken?: number) {
  const [summary, setSummary] = useState<ReviewsSummary | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const fetchSummary = async () => {
    if (!establishmentId) {
      setSummary(undefined);
      return;
    }

    setIsLoading(true);
    try {
      const url = `/api/reviews/summary?establishmentId=${encodeURIComponent(establishmentId)}&v=${refreshToken ?? 0}`;
      const response = await fetch(url, { 
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error("Error fetching reviews summary:", error);
      setSummary({ totalAll: 0, avgRating: null });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [establishmentId, refreshToken]);

  return {
    summary,
    isLoading,
    refetch: fetchSummary,
  };
}