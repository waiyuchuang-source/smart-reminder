"use client";

import { useState, useEffect, useRef } from "react";

import { useUser } from "@/hooks/use-user";
import { useTasks } from "@/hooks/use-tasks";
import { useNudge } from "@/hooks/use-nudge";
import { useWidgetStore } from "@/stores/widget-store";
import { ProgressRing } from "./progress-ring";
import { StreakBadge } from "./streak-badge";
import { NudgeMessage } from "./nudge-message";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, X, Users, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTeamStore } from "@/stores/team-store";
import { nudgeGovernor } from "@/lib/nudge-governor";
import { useTaskStore } from "@/stores/task-store";

function DeskMateStatus({ buddyName, buddyId, currentUserName }: { buddyName: string; buddyId?: string; currentUserName?: string }) {
  const userTasks = useTaskStore((state) => state.userTasks);
  const tasks = buddyId ? (userTasks[buddyId] || []) : [];
  const isBuddyDone = tasks.length > 0 && tasks.every(t => t.status === "completed");

  if (isBuddyDone) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-2 rounded-2xl bg-green-50/50 p-4 border border-green-100 dark:bg-green-900/10 dark:border-green-900/30"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-green-700 dark:text-green-400">
          <span className="text-xl">🎉</span>
          你的队友 {buddyName} 也完成啦！
        </div>
        <p className="text-[10px] text-green-600/70 dark:text-green-400/50">你们真是黄金搭档！</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        <p className="text-[11px] font-medium text-amber-600/80 dark:text-amber-400/70">
          队友 {buddyName} 还在努力中...
        </p>
      </div>
      <NudgeBuddyButton buddyName={buddyName} buddyId={buddyId} senderName={currentUserName} />
    </div>
  );
}

function NudgeBuddyButton({ buddyName, buddyId, senderName }: { buddyName: string; buddyId?: string; senderName?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const { sendSignal } = useTeamStore();

  const handleNudge = async () => {
    if (status !== "idle" || !buddyId || !senderName) return;

    setStatus("sending");
    try {
      sendSignal({
        senderName: senderName,
        recipientId: buddyId,
        type: "nudge",
        message: `你的队友 ${senderName} 正在等你完全任务哦！快来一起打卡吧！🚀`,
      });

      setStatus("sent");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (e) {
      setStatus("idle");
    }
  };

  return (
    <button
      onClick={handleNudge}
      disabled={status !== "idle"}
      className={`group relative flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all active:scale-95 overflow-hidden ${status === "sent"
        ? "bg-green-500 text-white"
        : "bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700"
        }`}
    >
      <span className="relative z-10 flex items-center gap-2">
        {status === "idle" && "督促队友"}
        {status === "sending" && "正在发送..."}
        {status === "sent" && "已送达提醒！"}
        <span className="text-base">
          {status === "idle" && "🚀"}
          {status === "sending" && "📡"}
          {status === "sent" && "✅"}
        </span>
      </span>
      {status === "idle" && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      )}
    </button>
  );
}

export function StudyBuddyWidget({ userId = "user-passive-1", mockHour, mockMinute }: { userId?: string; mockHour?: number; mockMinute?: number }) {
  const { user, isLoading: userLoading } = useUser(userId);
  const { tasks, pendingTasks, isLoading: tasksLoading, toggleTask } = useTasks(userId);
  const { nudgeMessage, isAppropriateTime, isLoading: nudgeLoading } = useNudge(userId, mockHour, mockMinute);

  const { isOpen, toggleOpen, setOpen } = useWidgetStore();
  const [dynamicNudge, setDynamicNudge] = useState<string | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const { notifications, dismissNotification, markAllAsRead } = useTeamStore();
  const myNotifications = notifications.filter(n => n.recipientId === userId);
  const unreadCount = myNotifications.filter(n => !n.isRead).length;

  const lastNudgeId = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAllAsRead(userId);
    }
  }, [isOpen, unreadCount, userId, markAllAsRead]);

  useEffect(() => {
    const latestNudge = myNotifications.find(n => n.type === "nudge");
    if (latestNudge && latestNudge.id !== lastNudgeId.current && !isOpen) {
      setOpen(true);
      lastNudgeId.current = latestNudge.id;
    }
  }, [myNotifications, isOpen, setOpen]);

  useEffect(() => {
    const fetchAiNudge = async () => {
      if (!user || !tasks || isAiGenerating) return;
      setIsAiGenerating(true);
      try {
        const response = await fetch("/api/ai/nudge/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user, tasks }),
        });
        const data = await response.json();
        setDynamicNudge(data.message);
      } catch (e) {
        setDynamicNudge(nudgeMessage ?? null);
      } finally {
        setIsAiGenerating(false);
      }
    };

    fetchAiNudge();
  }, [user?.id, pendingTasks.length]);

  const handleStartTask = async () => {
    if (pendingTasks.length > 0) {
      toggleTask(pendingTasks[0].id);
      nudgeGovernor.recordDelivery(userId, "standard_nudge");
    }
  };

  const isLoading = userLoading || tasksLoading || nudgeLoading;
  const totalTasks = tasks?.length || 0;
  const completedCount = totalTasks - pendingTasks.length;
  const progress = totalTasks === 0 ? 100 : (completedCount / totalTasks) * 100;
  const isAllDone = totalTasks > 0 && pendingTasks.length === 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
      {/* Teammate Signals - Only shown when closed */}
      <div className="flex flex-col gap-2 mb-1 pointer-events-auto">
        <AnimatePresence>
          {!isOpen && myNotifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-sm shadow-2xl backdrop-blur-xl border ${n.type === "nudge"
                ? "bg-amber-500/95 text-white border-amber-400/50 shadow-amber-500/20"
                : "bg-zinc-900/90 text-white border-zinc-800 dark:bg-white/90 dark:text-black dark:border-white/20"
                }`}
            >
              {n.type === "nudge" ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 font-black italic tracking-tight">
                    <Sparkles className="h-4 w-4" />
                    来自队友的催促
                  </div>
                  <p className="text-xs font-medium opacity-90">{n.message}</p>
                </div>
              ) : (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
                    <Users className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="font-medium">队友 <b>{n.senderName}</b> 已上线！</span>
                </>
              )}
              <button
                onClick={() => dismissNotification(n.id)}
                className="ml-2 rounded-full hover:bg-black/10 p-1.5 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.92, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 50, scale: 0.92, filter: "blur(10px)", transition: { duration: 0.25 } }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed bottom-24 right-6 w-80 overflow-hidden rounded-[2rem] border bg-white/90 backdrop-blur-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:bg-zinc-950/90 pointer-events-auto ${isAllDone
              ? "border-amber-200/50 dark:border-amber-900/30"
              : "border-blue-100/50 dark:border-blue-900/20"
              }`}
          >
            {/* Header with Background Glow */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none" />
            
            <div className="relative mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-inner ${isAllDone ? 'bg-amber-100 text-amber-600' : 'bg-blue-600 text-white'}`}>
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <span className="block font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                    学习搭子
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    AI Companion
                  </span>
                </div>
              </div>
              <button
                onClick={toggleOpen}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="relative">
              {isLoading ? (
                <div className="flex flex-col gap-4">
                  <Skeleton className="h-20 w-full rounded-3xl" />
                  <Skeleton className="h-28 w-full rounded-3xl" />
                </div>
              ) : (
                <motion.div
                  key="main"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Integrated Teammate Nudges at the Top */}
                  <AnimatePresence>
                    {myNotifications.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2 mb-4"
                      >
                        {myNotifications.map((n) => (
                          <div
                            key={n.id}
                            className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-xs shadow-sm border ${n.type === "nudge"
                              ? "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800"
                              : "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800"
                              }`}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-sm">{n.type === "nudge" ? "📢" : "👋"}</span>
                              <p className="leading-tight">
                                <span className="font-bold">{n.senderName}</span>: {n.message}
                              </p>
                            </div>
                            <button
                              onClick={() => dismissNotification(n.id)}
                              className="rounded-full hover:bg-black/5 p-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <section className="flex items-center justify-between rounded-3xl bg-zinc-50/80 p-4 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                    <div className="relative h-14 w-14 group">
                      <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                      <ProgressRing progress={progress} size={56} strokeWidth={5} />
                    </div>
                    <div className="text-right">
                      <StreakBadge days={user?.streakDays || 0} />
                      <p className="mt-1 text-[10px] font-bold text-zinc-400 uppercase">Current Streak</p>
                    </div>
                  </section>

                  <div className="relative">
                    <NudgeMessage
                      message={isAiGenerating ? "AI 正在思考专属鼓励..." : (dynamicNudge || nudgeMessage || "任务已全部达成！")}
                      onStart={isAppropriateTime && pendingTasks.length > 0 ? handleStartTask : undefined}
                      taskTitle={pendingTasks[0]?.title}
                      isGenerating={isAiGenerating}
                    />
                  </div>

                  {user?.deskMateName && (
                    <div className="pt-2">
                      <DeskMateStatus
                        buddyName={user.deskMateName}
                        buddyId={user.deskMateId}
                        currentUserName={user.name}
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 20 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleOpen}
            className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] hover:bg-blue-700 transition-colors relative"
          >
            <Bot className="h-7 w-7" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-4 border-zinc-50 bg-red-500 text-[10px] font-black text-white dark:border-zinc-950">
                {unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
