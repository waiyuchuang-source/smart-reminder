import useSWR from "swr";
import { User } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUser(userId: string = "user-passive-1") {
  const { data, error, isLoading, mutate } = useSWR<User>(`/api/user?userId=${userId}`, fetcher);

  return {
    user: data,
    isLoading,
    isError: error,
    mutate,
  };
}
