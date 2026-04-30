import useSWR from "swr";
import { Task } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useTasks(userId: string = "user-passive-1") {
  const { data, error, isLoading, mutate } = useSWR<Task[]>(`/api/tasks?userId=${userId}`, fetcher);

  const pendingTasks = data?.filter(t => t.status !== "completed") || [];
  const completedTasks = data?.filter(t => t.status === "completed") || [];

  return {
    tasks: data,
    pendingTasks,
    completedTasks,
    isLoading,
    isError: error,
    mutate,
  };
}
