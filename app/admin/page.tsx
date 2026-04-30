"use client";

import { useState } from "react";
import { useAdminStats } from "@/hooks/use-admin-stats";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, RefreshCw, Settings2, Users } from "lucide-react";
import { NudgeTone, ToneWeights } from "@/lib/types";

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
  
  // Local state for weights before saving
  const [localWeights, setLocalWeights] = useState<ToneWeights | null>(null);

  // Init local weights from server data
  if (data?.weights && !localWeights) {
    setLocalWeights(data.weights);
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
              <div className="text-2xl font-bold">15.2%</div>
              <p className="text-xs text-green-500">↑ 较上周增长 7.2%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">任务完成率</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68.5%</div>
              <p className="text-xs text-green-500">↑ 距目标 75% 还差 6.5%</p>
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

      </main>
    </div>
  );
}

// Needed because we use CheckCircle2 in this file but didn't import it at the top
import { CheckCircle2 } from "lucide-react";
