import { User, Task, NudgeCopy, ToneWeights } from "./types";

export const MOCK_USERS: User[] = [
  {
    id: "user-passive-1",
    name: "林晓",
    segment: "passive",
    streakDays: 4,
    lastActiveAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "user-active-1",
    name: "张博",
    segment: "active",
    streakDays: 42,
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: "user-risk-1",
    name: "王超",
    segment: "at-risk",
    streakDays: 0,
    lastActiveAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_TASKS: Record<string, Task[]> = {
  "user-passive-1": [
    {
      id: "task-1",
      title: "阅读小测: 鲁迅文集",
      course: "语文",
      durationMinutes: 10,
      status: "pending",
      dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "task-2",
      title: "一元二次方程练习",
      course: "数学",
      durationMinutes: 25,
      status: "completed",
      dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "task-3",
      title: "英语听力 15 篇",
      course: "英语",
      durationMinutes: 15,
      status: "completed",
      dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    },
  ],
  "user-active-1": [
    {
      id: "task-4",
      title: "物理力学综合挑战",
      course: "物理",
      durationMinutes: 45,
      status: "pending",
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

export const FALLBACK_COPIES: NudgeCopy[] = [
  {
    id: "fb-emp-1",
    tone: "empathetic",
    targetSegment: "passive",
    template: "{user_name}，今天只差最后 {task_duration} 分钟的 {task_name} 啦，做完就能安心休息咯~",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fb-mot-1",
    tone: "motivational",
    targetSegment: "active",
    template: "哇！你是今天全站前 5% 的效率大师！继续保持连胜！",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fb-hum-1",
    tone: "humorous",
    targetSegment: "at-risk",
    template: "呼叫 {user_name}！你的学习进度正在抗议，快来消灭 {task_name}！",
    createdAt: new Date().toISOString(),
  },
];

// In-memory mock database for generated copies
export const db = {
  generatedCopies: [...FALLBACK_COPIES],
  weights: {
    empathetic: 0.6,
    motivational: 0.3,
    humorous: 0.1,
  } as ToneWeights,
  // Mock tracking stats: clicks / views
  stats: {
    empathetic: { views: 1200, clicks: 216 }, // 18%
    motivational: { views: 800, clicks: 40 }, // 5%
    humorous: { views: 400, clicks: 32 }, // 8%
  },
};
