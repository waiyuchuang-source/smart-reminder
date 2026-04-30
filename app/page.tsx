"use client";

import { useState } from "react";
import { StudyBuddyWidget } from "@/components/widget/study-buddy-widget";
import { useTasks } from "@/hooks/use-tasks";
import { useUser } from "@/hooks/use-user";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2, Circle } from "lucide-react";

export default function Home() {
  // We can simulate different users here to test different segments
  const [currentUser, setCurrentUser] = useState("user-passive-1");
  const { user } = useUser(currentUser);
  const { tasks, pendingTasks, completedTasks, isLoading } = useTasks(currentUser);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <span>智学平台</span>
          </div>
          <div className="flex gap-2">
            <select 
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value)}
            >
              <option value="user-passive-1">林晓 (被动型)</option>
              <option value="user-active-1">张博 (自驱型学霸)</option>
              <option value="user-risk-1">王超 (濒临流失)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            你好，{user?.name || "同学"} 👋
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            继续你的学习之旅吧。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="mb-4 text-xl font-semibold">今日学习任务</h2>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse opacity-50"><CardContent className="h-24" /></Card>
                ))}
              </div>
            ) : tasks?.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                <CardTitle>今天没有安排任务</CardTitle>
                <CardDescription className="mt-2">好好休息一下吧</CardDescription>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingTasks.map(task => (
                  <Card key={task.id} className="transition-all hover:shadow-md">
                    <CardContent className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-4">
                        <Circle className="h-6 w-6 text-zinc-300 dark:text-zinc-700" />
                        <div>
                          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{task.title}</h3>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="secondary">{task.course}</Badge>
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">预计 {task.durationMinutes} 分钟</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {completedTasks.length > 0 && pendingTasks.length > 0 && (
                  <div className="my-6 h-px bg-zinc-200 dark:bg-zinc-800" />
                )}

                {completedTasks.map(task => (
                  <Card key={task.id} className="bg-zinc-50/50 dark:bg-zinc-900/20">
                    <CardContent className="flex items-center justify-between p-5 opacity-60">
                      <div className="flex items-center gap-4">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                        <div>
                          <h3 className="font-medium text-zinc-900 line-through dark:text-zinc-100">{task.title}</h3>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="outline">{task.course}</Badge>
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">已完成</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>学习数据</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                  <span className="text-zinc-500">今日完成率</span>
                  <span className="font-medium">
                    {tasks && tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                  <span className="text-zinc-500">连胜天数</span>
                  <span className="font-medium text-orange-500">{user?.streakDays || 0} 天</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* The Study Buddy Widget Component */}
      <StudyBuddyWidget userId={currentUser} />
    </div>
  );
}
