"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, ChevronDown, ChevronUp } from "lucide-react";

interface Variant {
  id: string;
  name: string;
}

interface Experiment {
  id: string;
  name: string;
  description: string | null;
  status: string;
  type: string;
  variants: Variant[];
  assignmentCount: number;
  createdAt: string;
}

interface VariantMetrics {
  variantId: string;
  variantName: string;
  views: number;
  clicks: number;
  ctr: number;
}

interface Comparison {
  variantA: string;
  variantB: string;
  zScore: number;
  pValue: number;
  significant: boolean;
  confidenceLevel: string;
}

interface ExperimentResults {
  experiment: Experiment;
  metrics: VariantMetrics[];
  comparisons: Comparison[];
  totalAssignments: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function ConfidenceBadge({ level }: { level: string }) {
  if (level === "high") return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">p&lt;0.05 显著</Badge>;
  if (level === "moderate") return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">p&lt;0.1 趋势</Badge>;
  return <Badge variant="secondary">样本不足</Badge>;
}

function ExperimentDetail({ experimentId }: { experimentId: string }) {
  const { data } = useSWR<{ success: boolean; data: ExperimentResults }>(
    `/api/experiments/${experimentId}/results`,
    fetcher,
  );

  if (!data?.success) return <div className="py-4 text-center text-sm text-zinc-400">加载中...</div>;

  const { metrics, comparisons, totalAssignments } = data.data;

  return (
    <div className="space-y-4 pt-3">
      <p className="text-xs text-zinc-500">已分组用户: {totalAssignments}</p>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <th className="px-4 py-2 text-left font-medium">变体</th>
              <th className="px-4 py-2 text-right font-medium">曝光</th>
              <th className="px-4 py-2 text-right font-medium">点击</th>
              <th className="px-4 py-2 text-right font-medium">CTR</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.variantId} className="border-b border-zinc-50 last:border-0 dark:border-zinc-900">
                <td className="px-4 py-2.5 font-medium">{m.variantName}</td>
                <td className="px-4 py-2.5 text-right text-zinc-500">{m.views}</td>
                <td className="px-4 py-2.5 text-right text-zinc-500">{m.clicks}</td>
                <td className="px-4 py-2.5 text-right font-bold">{m.ctr.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {comparisons.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500">显著性检验 (Z-Test)</p>
          {comparisons.map((c, i) => {
            const nameA = metrics.find((m) => m.variantId === c.variantA)?.variantName ?? c.variantA;
            const nameB = metrics.find((m) => m.variantId === c.variantB)?.variantName ?? c.variantB;
            return (
              <div key={i} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900/50">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {nameA} vs {nameB} &middot; z={c.zScore.toFixed(2)} &middot; p={c.pValue.toFixed(3)}
                </span>
                <ConfidenceBadge level={c.confidenceLevel} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ExperimentPanel() {
  const { data, mutate } = useSWR<{ success: boolean; data: Experiment[] }>("/api/experiments", fetcher);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const experiments = data?.success ? data.data : [];

  const handleCreateDefault = async () => {
    setIsCreating(true);
    try {
      await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Tone CTR Experiment",
          description: "比较不同语气风格对点击率的影响",
          type: "tone",
          variants: [
            { id: "empathetic", name: "同理心风格" },
            { id: "motivational", name: "激励风格" },
            { id: "humorous", name: "幽默风格" },
          ],
        }),
      });
      await mutate();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-violet-500" />
            <div>
              <CardTitle>A/B 实验</CardTitle>
              <CardDescription>实验分组与显著性检验</CardDescription>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={handleCreateDefault} disabled={isCreating}>
            新建实验
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {experiments.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">暂无实验，点击上方按钮创建</p>
        ) : (
          <div className="space-y-3">
            {experiments.map((exp) => (
              <div key={exp.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{exp.name}</span>
                    <Badge variant={exp.status === "active" ? "default" : "secondary"}>
                      {exp.status === "active" ? "进行中" : "已结束"}
                    </Badge>
                    <span className="text-xs text-zinc-400">{exp.variants.length} 变体 · {exp.assignmentCount} 用户</span>
                  </div>
                  {expandedId === exp.id ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                </button>
                {expandedId === exp.id && (
                  <div className="border-t border-zinc-100 px-4 pb-4 dark:border-zinc-800">
                    <ExperimentDetail experimentId={exp.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
