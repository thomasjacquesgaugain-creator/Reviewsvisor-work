import useSWR from "swr";

export function useReviewsSummary(estId?: string, bump?: number) {
  const key = estId ? `/api/reviews/summary?establishmentId=${encodeURIComponent(estId)}&v=${bump ?? 0}` : null;
  const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then(r => r.json());
  const { data, isLoading, mutate } = useSWR(key, fetcher, { revalidateOnFocus: false });
  return { summary: data as { totalAll?: number; avgRating?: number } | undefined, isLoading, refetch: () => mutate() };
}