import useSWR from "swr";
import type { Task } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTasks(userId: string = "user-passive-1") {
  const { data, error, isLoading, mutate } = useSWR<Task[]>(
    `/api/tasks?userId=${userId}`,
    fetcher,
  );

  const tasks = data || [];
  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const toggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === "completed" ? "pending" : "completed";

    await mutate(
      tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
      false,
    );

    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status: newStatus }),
    });

    mutate();
  };

  return {
    tasks,
    pendingTasks,
    completedTasks,
    isLoading,
    isError: error,
    toggleTask,
    mutate,
  };
}
