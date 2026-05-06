import useSWR from "swr";
import type { FatigueResult } from "@/lib/fatigue";

interface FatigueEntry {
  userId: string;
  userName: string;
  fatigue: FatigueResult;
}

const fetcher = async (url: string): Promise<FatigueEntry[]> => {
  const res = await fetch(url);
  const json = await res.json();
  return json.success ? json.data : [];
};

export function useFatigue() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/fatigue", fetcher);
  return { fatigueData: data ?? [], isLoading, isError: error, mutate };
}
