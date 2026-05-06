import useSWR from "swr";
import type { FrequencyConfig } from "@/lib/frequency-config";

const fetcher = async (url: string): Promise<FrequencyConfig | null> => {
  const res = await fetch(url);
  const json = await res.json();
  return json.success ? json.data : null;
};

export function useFrequencyConfig() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/frequency-config", fetcher);
  return { config: data ?? null, isLoading, isError: error, mutate };
}
