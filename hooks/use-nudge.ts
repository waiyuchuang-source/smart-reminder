import useSWR from "swr";
import type { NudgeResult } from "@/lib/nudge-matcher";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useNudge(userId: string = "user-passive-1", mockHour?: number, mockMinute?: number) {
  const params = new URLSearchParams();
  params.set("userId", userId);
  if (mockHour !== undefined) params.set("mockHour", mockHour.toString());
  if (mockMinute !== undefined) params.set("mockMinute", mockMinute.toString());

  const { data, error, isLoading, mutate } = useSWR<NudgeResult>(
    `/api/nudge?${params.toString()}`,
    fetcher,
  );

  return {
    nudgeMessage: data?.message,
    isAppropriateTime: data?.isAppropriateTime ?? true,
    copyId: data?.copyId,
    tone: data?.tone,
    experimentId: (data as unknown as Record<string, unknown>)?.experimentId as string | undefined,
    variantId: (data as unknown as Record<string, unknown>)?.variantId as string | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}
