"use client";

import { useState } from "react";
import useSWR from "swr";
import { useAdminStats } from "@/hooks/use-admin-stats";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, RefreshCw, Settings2, Users, CheckCircle2, Activity, Shield } from "lucide-react";
import { NudgeTone, ToneWeights } from "@/lib/types";
import { PromptEditor } from "@/components/admin/prompt-editor";
import { ChurnAlertPanel } from "@/components/admin/churn-alert-panel";
import { ExperimentPanel } from "@/components/admin/experiment-panel";
import { useFatigue } from "@/hooks/use-fatigue";
import { useFrequencyConfig } from "@/hooks/use-frequency-config";
import type { FrequencyConfig } from "@/lib/frequency-config";

interface PromptTemplate {
  id: string;
  name: string;
  tone: string;
  systemPrompt: string;
  fewShotExamples: string[];
  isActive: boolean;
  updatedAt: string;
}

interface ChurnAlert {
  userId: string;
  userName: string;
  daysInactive: number;
  lastActiveAt: string;
  parentNotified: boolean;
  notifiedAt?: string;
}

const promptsFetcher = async (url: string): Promise<PromptTemplate[]> => {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) return [];
  return (json.data.templates ?? []) as PromptTemplate[];
};

const churnFetcher = async (url: string): Promise<ChurnAlert[]> => {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) return [];
  return (json.data.alerts ?? []) as ChurnAlert[];
};

const toneColors: Record<string, string> = {
  empathetic: "bg-blue-500",
  motivational: "bg-amber-500",
  humorous: "bg-purple-500",
};

const toneNames: Record<string, string> = {
  empathetic: "同理心 (安抚/理解)",
  motivational: "激励 (打气/荣誉)",
  humorous: "幽默 (趣味/警示)",
};

export default function AdminDashboard() {
  const { data, isLoading, mutate } = useAdminStats();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    data: templates,
    mutate: mutatePrompts,
  } = useSWR<PromptTemplate[]>("/api/admin/prompts", promptsFetcher);
  const {
    data: churnAlerts,
    mutate: mutateChurn,
  } = useSWR<ChurnAlert[]>("/api/admin/churn-alert", churnFetcher);

  const handleSavePrompt = async (id: string, systemPrompt: string) => {
    await fetch("/api/admin/prompts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, systemPrompt }),
    });
    await mutatePrompts();
  };

  const handleNotifyParent = async (userId: string) => {
    await fetch("/api/admin/churn-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await mutateChurn();
  };
  
  const { fatigueData, mutate: mutateFatigue } = useFatigue();
  const { config: freqConfig, mutate: mutateFreqConfig } = useFrequencyConfig();

  const [localWeights, setLocalWeights] = useState<ToneWeights | null>(null);
  const [localFreqConfig, setLocalFreqConfig] = useState<FrequencyConfig | null>(null);
  const [isSavingFreq, setIsSavingFreq] = useState(false);

  if (data?.weights && !localWeights) {
    setLocalWeights(data.weights);
  }

  if (freqConfig && !localFreqConfig) {
    setLocalFreqConfig(freqConfig);
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await fetch("/api/nudge/generate", { method: "POST" });
      mutate();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveWeights = async () => {
    if (!localWeights) return;
    setIsSaving(true);
    try {
      await fetch("/api/admin/weights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localWeights),
      });
      mutate();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFreqConfig = async () => {
    if (!localFreqConfig) return;
    setIsSavingFreq(true);
    try {
      await fetch("/api/admin/frequency-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localFreqConfig),
      });
      mutateFreqConfig();
    } finally {
      setIsSavingFreq(false);
    }
  };

  const handleWeightChange = (tone: NudgeTone, value: number) => {
    if (!localWeights) return;
    // Simple naive normalization for demo
    const newWeights = { ...localWeights, [tone]: value };
    setLocalWeights(newWeights);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
          <Settings2 className="h-6 w-6 text-zinc-600" />
          <span>智能提醒引擎看板</span>
          <Badge variant="secondary" className="ml-2">Admin</Badge>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-6 py-8">
        
        {/* Top Metric Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总文案生成量</CardTitle>
              <BarChart3 className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalCopies || 0}</div>
              <p className="text-xs text-zinc-500">模拟库当前存量</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均触达打开率</CardTitle>
              <Users className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.openRate?.toFixed(1) ?? "—"}%</div>
              <p className="text-xs text-zinc-500">总曝光 {data?.totalViews ?? 0} · 关闭率 {data?.overallDismissRate?.toFixed(1) ?? 0}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">任务完成率</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.completionRate?.toFixed(1) ?? "—"}%</div>
              <p className="text-xs text-zinc-500">完成 {data?.totalCompleted ?? 0} · 关闭 {data?.totalDismissed ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Stats Table */}
          <Card>
            <CardHeader>
              <CardTitle>A/B 测试漏斗分析</CardTitle>
              <CardDescription>各风格 AI 文案点击转化表现</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data?.stats.map((stat) => (
                  <div key={stat.tone} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${toneColors[stat.tone]}`} />
                        <span className="font-medium">{toneNames[stat.tone]}</span>
                      </div>
                      <span className="font-bold">{stat.ctr.toFixed(1)}% CTR</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div 
                        className={`h-full ${toneColors[stat.tone]}`} 
                        style={{ width: `${stat.ctr * 2}%` }} // Multiply by 2 just to make bar more visible for demo
                      />
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>曝光: {stat.views}</span>
                      <span>点击: {stat.clicks}</span>
                      <span>关闭: {stat.dismissed} ({stat.dismissRate.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Control Panel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>异步生成引擎控制</CardTitle>
                  <CardDescription>调整 Cron Job 下一次生成的权重</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  触发批量生成
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {localWeights && Object.entries(localWeights).map(([tone, weight]) => (
                  <div key={tone} className="flex flex-col gap-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{toneNames[tone]}</span>
                      <span className="text-zinc-500">{(weight * 100).toFixed(0)}% 流量</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={weight}
                      onChange={(e) => handleWeightChange(tone as NudgeTone, parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                ))}

                <div className="pt-4">
                  <Button 
                    className="w-full" 
                    onClick={handleSaveWeights}
                    disabled={isSaving}
                  >
                    保存权重配置
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Prompt Template Management + Churn Alert */}
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              {templates ? (
                <PromptEditor templates={templates} onSave={handleSavePrompt} />
              ) : (
                <div className="h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <ChurnAlertPanel
                alerts={churnAlerts ?? []}
                onNotifyParent={handleNotifyParent}
                onRefresh={() => mutateChurn()}
              />
            </CardContent>
          </Card>
        </div>

        {/* Row 4: Frequency Config + Fatigue Monitor */}
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-zinc-600" />
                <div>
                  <CardTitle>频控与疲劳度配置</CardTitle>
                  <CardDescription>调整频率控制参数和疲劳度阈值</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {localFreqConfig ? (
                <div className="space-y-5">
                  {([
                    { key: "globalCoolingMinutes" as const, label: "全局冷却（分钟）", min: 1, max: 120 },
                    { key: "typeCoolingMinutes" as const, label: "同类冷却（分钟）", min: 1, max: 480 },
                    { key: "maxDailyNudges" as const, label: "每日推送上限", min: 1, max: 50 },
                    { key: "fatigueThresholdHigh" as const, label: "高疲劳阈值（抑制推送）", min: 1, max: 100 },
                    { key: "fatigueThresholdMedium" as const, label: "中疲劳阈值（精选推送）", min: 0, max: 99 },
                  ]).map((field) => (
                    <div key={field.key} className="flex items-center justify-between gap-4">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 min-w-0 flex-1">{field.label}</label>
                      <input
                        type="number"
                        min={field.min}
                        max={field.max}
                        value={localFreqConfig[field.key]}
                        onChange={(e) => setLocalFreqConfig({ ...localFreqConfig, [field.key]: parseInt(e.target.value) || 0 })}
                        className="w-20 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-right dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </div>
                  ))}
                  <Button className="w-full mt-2" onClick={handleSaveFreqConfig} disabled={isSavingFreq}>
                    {isSavingFreq ? "保存中..." : "保存频控配置"}
                  </Button>
                </div>
              ) : (
                <div className="h-48 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-zinc-600" />
                  <div>
                    <CardTitle>用户疲劳度监控</CardTitle>
                    <CardDescription>实时疲劳状态与关闭率</CardDescription>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => mutateFatigue()}>
                  <RefreshCw className="mr-1 h-3 w-3" /> 刷新
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fatigueData.map((entry) => {
                  const color = entry.fatigue.level === "high" ? "bg-red-500" : entry.fatigue.level === "medium" ? "bg-amber-500" : "bg-green-500";
                  const levelText = entry.fatigue.level === "high" ? "高" : entry.fatigue.level === "medium" ? "中" : "低";
                  return (
                    <div key={entry.userId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{entry.userName}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={entry.fatigue.level === "high" ? "destructive" : entry.fatigue.level === "medium" ? "secondary" : "outline"}>
                            疲劳{levelText} {entry.fatigue.score}
                          </Badge>
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className={`h-full ${color} transition-all`} style={{ width: `${entry.fatigue.score}%` }} />
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-500">
                        <span>关闭率: {(entry.fatigue.factors.dismissRate * 100).toFixed(1)}%</span>
                        <span>近2h密度: {entry.fatigue.factors.recentDensity}</span>
                        <span>时段因子: {entry.fatigue.factors.timeOfDayFactor}</span>
                      </div>
                    </div>
                  );
                })}
                {fatigueData.length === 0 && (
                  <p className="text-sm text-zinc-400 text-center py-8">暂无用户数据</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 5: A/B Experiment Panel */}
        <ExperimentPanel />

      </main>
    </div>
  );
}
