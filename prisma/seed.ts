import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

const USERS = [
  {
    id: "user-passive-1",
    name: "林晓",
    segment: "passive",
    streakDays: 4,
    lastActiveAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    preferredReminderTime: "17:00",
    deskMateName: "张博",
    deskMateId: "user-active-1",
    isOnline: true,
    teamMateIds: JSON.stringify(["user-active-1"]),
    rankLevel: 5,
    rankTitle: "中坚力量",
  },
  {
    id: "user-active-1",
    name: "张博",
    segment: "active",
    streakDays: 42,
    lastActiveAt: new Date(),
    deskMateName: "林晓",
    deskMateId: "user-passive-1",
    isOnline: true,
    teamMateIds: JSON.stringify(["user-passive-1"]),
    rankLevel: 12,
    rankTitle: "学神附体",
  },
  {
    id: "user-risk-1",
    name: "王超",
    segment: "at-risk",
    streakDays: 0,
    lastActiveAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    deskMateName: "张博",
    deskMateId: "user-active-1",
    isOnline: false,
    teamMateIds: JSON.stringify(["user-active-1"]),
    rankLevel: 1,
    rankTitle: "暂露头角",
  },
];

const TASKS = [
  { id: "task-1", title: "阅读小测: 鲁迅文集", course: "语文", durationMinutes: 10, status: "pending", dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), userId: "user-passive-1" },
  { id: "task-2", title: "一元二次方程练习", course: "数学", durationMinutes: 25, status: "completed", dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), userId: "user-passive-1" },
  { id: "task-3", title: "英语听力 15 篇", course: "英语", durationMinutes: 15, status: "completed", dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), userId: "user-passive-1" },
  { id: "task-4", title: "物理力学综合挑战", course: "物理", durationMinutes: 45, status: "pending", dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), userId: "user-active-1" },
  { id: "task-5", title: "单词打卡", course: "英语", durationMinutes: 5, status: "pending", dueDate: new Date().toISOString(), userId: "user-risk-1" },
];

const COPIES = [
  { id: "fb-emp-1", tone: "empathetic", targetSegment: "passive", template: "{user_name}同学，你的{task_name}任务还差一点就完成啦，现在开始 5 分钟就能搞定！", baseScore: 8.5, tags: JSON.stringify(["efficient", "gentle"]) },
  { id: "fb-mot-1", tone: "motivational", targetSegment: "active", template: "完成今日{task_name}，保持你 {streak} 天的连胜记录！你是最棒的！", baseScore: 9.0, tags: JSON.stringify(["streak", "honor"]) },
  { id: "fb-hum-1", tone: "humorous", targetSegment: "at-risk", template: '呼叫 {user_name}！完成本次{task_name}即可领取“连续学习奖励”刺激包哦！🎁', baseScore: 7.5, tags: JSON.stringify(["reward", "fun"]) },
  { id: "fb-soc-1", tone: "humorous", targetSegment: "at-risk", template: '和你一起学习的 {buddy_name} 已经完成了今天的任务，就差你啦！快来追上他！🚀', baseScore: 9.5, tags: JSON.stringify(["social", "competitive"]) },
];

const WEIGHTS = [
  { tone: "empathetic", weight: 0.6 },
  { tone: "motivational", weight: 0.3 },
  { tone: "humorous", weight: 0.1 },
];

async function main() {
  console.log("Seeding database...");

  for (const u of USERS) {
    await prisma.user.upsert({ where: { id: u.id }, update: u, create: u });
  }

  for (const t of TASKS) {
    await prisma.task.upsert({ where: { id: t.id }, update: t, create: t });
  }

  for (const c of COPIES) {
    await prisma.nudgeCopy.upsert({ where: { id: c.id }, update: c, create: c });
  }

  for (const w of WEIGHTS) {
    await prisma.toneWeight.upsert({ where: { tone: w.tone }, update: w, create: w });
  }

  // Seed initial NudgeLog entries for admin stats demo
  const LOG_SEEDS = [
    { tone: "empathetic", viewed: 120, clicked: 22, dismissed: 15, completed: 8 },
    { tone: "motivational", viewed: 80, clicked: 4, dismissed: 8, completed: 3 },
    { tone: "humorous", viewed: 40, clicked: 3, dismissed: 12, completed: 2 },
  ];

  const userIds = ["user-passive-1", "user-active-1", "user-risk-1"];
  const copyMap: Record<string, string> = { empathetic: "fb-emp-1", motivational: "fb-mot-1", humorous: "fb-hum-1" };

  for (const seed of LOG_SEEDS) {
    const copyId = copyMap[seed.tone];
    for (let i = 0; i < seed.viewed; i++) {
      const userId = userIds[i % userIds.length];
      const ts = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      await prisma.nudgeLog.create({ data: { userId, copyId, tone: seed.tone, action: "nudge_viewed", timestamp: ts } });
    }
    for (let i = 0; i < seed.clicked; i++) {
      const userId = userIds[i % userIds.length];
      const ts = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      await prisma.nudgeLog.create({ data: { userId, copyId, tone: seed.tone, action: "nudge_clicked", timestamp: ts } });
    }
    for (let i = 0; i < seed.dismissed; i++) {
      const userId = userIds[i % userIds.length];
      const ts = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      await prisma.nudgeLog.create({ data: { userId, copyId, tone: seed.tone, action: "dismissed", timestamp: ts } });
    }
    for (let i = 0; i < seed.completed; i++) {
      const userId = userIds[i % userIds.length];
      const ts = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      await prisma.nudgeLog.create({ data: { userId, copyId, tone: seed.tone, action: "task_completed", timestamp: ts } });
    }
  }

  // Seed a default tone experiment
  await prisma.experiment.upsert({
    where: { id: "exp-tone-default" },
    update: {},
    create: {
      id: "exp-tone-default",
      name: "语气风格实验",
      description: "测试不同语气分配策略对 CTR 的影响",
      type: "tone",
      variants: JSON.stringify([
        { id: "empathetic_heavy", name: "同理心优先" },
        { id: "balanced", name: "均衡分配" },
        { id: "humorous_heavy", name: "幽默优先" },
      ]),
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: "frequency_config" },
    update: {},
    create: {
      key: "frequency_config",
      value: JSON.stringify({
        globalCoolingMinutes: 15,
        typeCoolingMinutes: 60,
        maxDailyNudges: 5,
        fatigueThresholdHigh: 70,
        fatigueThresholdMedium: 40,
      }),
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
