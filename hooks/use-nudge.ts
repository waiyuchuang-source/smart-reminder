import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useNudge(userId: string = "user-passive-1") {
  const { data, error, isLoading, mutate } = useSWR<{ message: string | null }>(
    `/api/nudge?userId=${userId}`,
    fetcher
  );

  return {
    nudgeMessage: data?.message,
    isLoading,
    isError: error,
    mutate,
  };
}
