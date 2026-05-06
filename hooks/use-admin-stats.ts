import useSWR from "swr";
import { ToneWeights } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type AdminStatsResponse = {
  stats: {
    tone: string;
    views: number;
    clicks: number;
    dismissed: number;
    ctr: number;
    dismissRate: number;
  }[];
  weights: ToneWeights;
  totalCopies: number;
  totalViews: number;
  totalClicks: number;
  totalDismissed: number;
  totalCompleted: number;
  openRate: number;
  completionRate: number;
  overallDismissRate: number;
};

export function useAdminStats() {
  const { data, error, isLoading, mutate } = useSWR<AdminStatsResponse>(`/api/admin/stats`, fetcher);

  return {
    data,
    isLoading,
    isError: error,
    mutate,
  };
}
