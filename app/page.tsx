"use client";

import { useState } from "react";
import { StudyBuddyWidget } from "@/components/widget/study-buddy-widget";
import { useTasks } from "@/hooks/use-tasks";
import { useUser } from "@/hooks/use-user";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  Users, 
  Trophy, 
  Clock, 
  Zap, 
  Flame,
  LayoutDashboard,
  Bell
} from "lucide-react";
import { useTeamStore } from "@/stores/team-store";
import { MOCK_USERS } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { AIOptimizer } from "@/components/dashboard/ai-optimizer";
import { AIMentalCard } from "@/components/dashboard/ai-mental-card";
import { MiniRankCard } from "@/components/dashboard/mini-rank-card";

export default function Home() {
  const [currentUser, setCurrentUser] = useState("user-passive-1");
  const [mockHour, setMockHour] = useState<number | undefined>(undefined);
  const [mockMinute, setMockMinute] = useState<number | undefined>(undefined);
  const { user } = useUser(currentUser);
  const { tasks, pendingTasks, completedTasks, isLoading, toggleTask } = useTasks(currentUser);

  const handleTimeChange = (val: string) => {
    if (val === "") {
      setMockHour(undefined);
      setMockMinute(undefined);
    } else {
      const [h, m] = val.split(":").map(Number);
      setMockHour(h);
      setMockMinute(m);
    }
  };

  const simulatedTimeStr = mockHour !== undefined 
    ? `${mockHour}:${(mockMinute ?? 0).toString().padStart(2, "0")}`
    : "系统时间";

  const { sendSignal } = useTeamStore();

  const handleSimulateOnline = () => {
    const teammateId = user?.teamMateIds?.[0];
    const teammate = MOCK_USERS.find(u => u.id === teammateId);
    sendSignal({
      senderName: teammate?.name || "神秘队友",
      recipientId: currentUser,
      type: "online",
    });
  };

  const totalTasks = tasks?.length || 0;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks.length / totalTasks) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <span className="text-xl tracking-tight">智学助手</span>
            </div>
            
            <nav className="hidden items-center gap-4 md:flex">
              <Badge variant="secondary" className="cursor-pointer bg-zinc-100 px-3 py-1 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400">
                <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" /> 控制面板
              </Badge>
              <Badge variant="outline" className="cursor-pointer px-3 py-1 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800">
                <BookOpen className="mr-1.5 h-3.5 w-3.5" /> 课程库
              </Badge>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateOnline}
              className="flex h-9 items-center gap-2 rounded-full bg-blue-50 px-4 text-sm font-medium text-blue-600 transition-all hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">模拟上线</span>
            </button>

            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

            <select 
              className="h-9 rounded-full border border-zinc-200 bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
              value={mockHour === undefined ? "" : simulatedTimeStr}
              onChange={(e) => handleTimeChange(e.target.value)}
            >
              <option value="">🕒 模拟时间</option>
              <option value="16:55">16:55 (下课前)</option>
              <option value="21:00">21:00 (复习时)</option>
            </select>

            <select 
              className="h-9 rounded-full border border-zinc-200 bg-white px-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value)}
            >
              {MOCK_USERS.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.segment})</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        {/* Welcome Section */}
        <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {user?.name}，今天准备攻克哪一门？
            </h1>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">
              当前学习效率 <span className="font-semibold text-blue-600">85%</span>，保持专注！
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2"
          >
            <div className="flex items-center gap-2 rounded-xl bg-orange-100 px-4 py-2 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              <Flame className="h-5 w-5 fill-current" />
              <span className="text-lg font-bold">{user?.streakDays || 0}</span>
              <span className="text-sm font-medium">天连胜</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-blue-100 px-4 py-2 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <Clock className="h-5 w-5" />
              <span className="text-lg font-bold">2.4</span>
              <span className="text-sm font-medium">h 专注</span>
            </div>
          </motion.div>
        </section>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* Module: Tasks (The Core) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-8"
          >
            <Card className="h-full border-none shadow-sm dark:bg-zinc-900/50">
              <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800/50">
                <div>
                  <CardTitle className="text-xl">今日任务</CardTitle>
                  <CardDescription>你还有 {pendingTasks.length} 个任务待完成</CardDescription>
                </div>
                <Badge className="bg-blue-600">{completionRate}% 完成</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {isLoading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse bg-zinc-50/50 dark:bg-zinc-800/20" />)
                  ) : tasks?.length === 0 ? (
                    <div className="flex flex-col items-center py-20 opacity-40">
                      <CheckCircle2 className="h-12 w-12" />
                      <p className="mt-2 font-medium">空空如也，享受闲暇</p>
                    </div>
                  ) : (
                    <>
                      {pendingTasks.map(task => (
                        <div key={task.id} className="group flex items-center justify-between p-6 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => toggleTask(task.id)}
                              className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-zinc-200 transition-all group-hover:border-blue-500 dark:border-zinc-700"
                            >
                              <Circle className="h-4 w-4 text-transparent" />
                              <CheckCircle2 className="absolute h-5 w-5 text-blue-500 opacity-0 group-hover:opacity-30" />
                            </button>
                            <div>
                              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{task.title}</h4>
                              <div className="mt-1 flex items-center gap-3">
                                <span className="flex items-center gap-1 text-xs text-zinc-400">
                                  <BookOpen className="h-3 w-3" /> {task.course}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-zinc-400">
                                  <Clock className="h-3 w-3" /> {task.durationMinutes} min
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="opacity-0 group-hover:opacity-100">立即开始</Badge>
                        </div>
                      ))}
                      {completedTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between bg-zinc-50/30 p-6 opacity-60 dark:bg-zinc-900/20">
                          <div className="flex items-center gap-4">
                            <button onClick={() => toggleTask(task.id)} className="text-green-500">
                              <CheckCircle2 className="h-7 w-7 fill-current" />
                            </button>
                            <h4 className="font-medium text-zinc-500 line-through">{task.title}</h4>
                          </div>
                          <Badge variant="outline" className="text-zinc-400">已打卡</Badge>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Sidebar Modules */}
          <div className="space-y-6 lg:col-span-4">
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              {user && (
                <AIOptimizer 
                  user={user} 
                  tasks={tasks || []} 
                  onStartTask={(id) => toggleTask(id)} 
                />
              )}
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <MiniRankCard 
                  rankLevel={user?.rankLevel || 1} 
                  rankTitle={user?.rankTitle || "学徒"} 
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                {user && (
                  <AIMentalCard 
                    user={user} 
                    pendingTaskCount={pendingTasks.length} 
                  />
                )}
              </motion.div>
            </div>

            {/* Module: Teammate Status */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-none shadow-sm dark:bg-zinc-900/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-bold">队友动态</CardTitle>
                  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 pt-2">
                    {MOCK_USERS.filter(u => u.id !== currentUser).slice(0, 3).map(buddy => (
                      <div key={buddy.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-zinc-100 p-1 ring-2 ring-zinc-50 dark:bg-zinc-800 dark:ring-zinc-800">
                            <div className="h-full w-full rounded-full bg-zinc-200 dark:bg-zinc-700" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{buddy.name}</p>
                            <p className="text-[10px] text-zinc-500">正在攻克 {buddy.segment === 'active' ? '高数' : '英语'}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{buddy.isOnline ? '在线' : '离线'}</Badge>
                      </div>
                    ))}
                  </div>
                  <button className="mt-6 w-full rounded-xl border border-dashed border-zinc-200 py-3 text-sm text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800">
                    + 邀请更多队友
                  </button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Module: Quick Notification Center */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-none shadow-sm dark:bg-zinc-900/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bell className="h-4 w-4 text-blue-500" /> 系统通知
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/10">
                    <p className="text-xs font-medium text-orange-800 dark:text-orange-400">检测到注意力分散，建议休息 5 分钟</p>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">你上周的英语任务完成率提高了 12%</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-zinc-200 py-8 text-center dark:border-zinc-800">
        <p className="text-sm text-zinc-400">© 2026 智学助手. 助力高效学习。</p>
      </footer>

      {/* The Study Buddy Widget Component (Renamed to Popup) */}
      <StudyBuddyWidget userId={currentUser} mockHour={mockHour} mockMinute={mockMinute} />
    </div>
  );
}
