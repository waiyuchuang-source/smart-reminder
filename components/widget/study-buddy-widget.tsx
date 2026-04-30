"use client";

import { useUser } from "@/hooks/use-user";
import { useTasks } from "@/hooks/use-tasks";
import { useNudge } from "@/hooks/use-nudge";
import { useWidgetStore } from "@/stores/widget-store";
import { ProgressRing } from "./progress-ring";
import { StreakBadge } from "./streak-badge";
import { NudgeMessage } from "./nudge-message";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, X, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function StudyBuddyWidget({ userId = "user-passive-1" }: { userId?: string }) {
  const { user, isLoading: userLoading } = useUser(userId);
  const { tasks, pendingTasks, isLoading: tasksLoading, mutate: mutateTasks } = useTasks(userId);
  const { nudgeMessage, isLoading: nudgeLoading } = useNudge(userId);
  
  const { isOpen, toggleOpen } = useWidgetStore();

  const handleStartTask = async () => {
    // Simulate starting/completing a task
    if (pendingTasks.length > 0) {
      const taskToComplete = pendingTasks[0];
      // In a real app, we'd make a POST request here.
      // We simulate optimistic update using mutate.
      mutateTasks((currentData) => {
        if (!currentData) return currentData;
        return currentData.map(t => 
          t.id === taskToComplete.id ? { ...t, status: "completed" as const } : t
        );
      }, false);
    }
  };

  const isLoading = userLoading || tasksLoading || nudgeLoading;
  
  const totalTasks = tasks?.length || 0;
  const completedCount = totalTasks - pendingTasks.length;
  const progress = totalTasks === 0 ? 100 : (completedCount / totalTasks) * 100;
  
  // Is this the "学霸" (active/all-done) journey?
  const isAllDone = totalTasks > 0 && pendingTasks.length === 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.2 } }}
            className={`mb-4 w-80 overflow-hidden rounded-2xl border bg-white p-5 shadow-2xl dark:bg-zinc-950 ${
              isAllDone 
                ? "border-amber-200 shadow-amber-500/10 dark:border-amber-900/50" 
                : "border-blue-100 shadow-blue-500/10 dark:border-blue-900/30"
            }`}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isAllDone ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                  <Bot className="h-4 w-4" />
                </div>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  学习搭子
                </span>
              </div>
              <button 
                onClick={toggleOpen}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <ProgressRing progress={progress} />
                  <div className="flex flex-col items-end gap-1">
                    <StreakBadge days={user?.streakDays || 0} />
                    <span className="text-sm font-medium text-zinc-500">
                      今日进度 {completedCount}/{totalTasks}
                    </span>
                  </div>
                </div>

                <NudgeMessage 
                  message={nudgeMessage || "干得漂亮，今天的任务都完成啦！"} 
                  onStart={handleStartTask} 
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized Trigger */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleOpen}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700"
          >
            <Bot className="h-6 w-6" />
            {pendingTasks.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold dark:border-zinc-950">
                {pendingTasks.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
