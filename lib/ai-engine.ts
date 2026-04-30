import { NudgeTone, NudgeCopy } from "./types";

// This simulates calling the external AI API to generate copies
// In production, this would call process.env.AI_API_BASE with process.env.AI_API_KEY
export async function generateCopiesBatch(tone: NudgeTone, count: number): Promise<Omit<NudgeCopy, "id" | "targetSegment">[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const templates: Record<NudgeTone, string[]> = {
    empathetic: [
      "{user_name}，今天只差最后 {task_duration} 分钟的 {task_name} 啦，做完就能安心休息咯~",
      "知道你今天有点累，不过再坚持一下，完成 {task_name} 就可以好好放松啦！",
      " {user_name}，不要有压力哦，哪怕只完成一点点 {task_name} 也是进步！",
    ],
    motivational: [
      "哇！你是今天全站前 5% 的效率大师！继续保持连胜！",
      "优秀是一种习惯，{user_name}，完成 {task_name}，让今天的自己更强大！",
      "冲鸭！连胜 {streak} 天的你势不可挡，快去搞定 {task_name}！",
    ],
    humorous: [
      "呼叫 {user_name}！你的学习进度正在抗议，快来消灭 {task_name}！",
      "作业君说它很想你，特别是那个叫 {task_name} 的家伙！",
      "滴滴！前方高能预警，你的 {task_name} 正在向你招手！",
    ],
  };

  const pool = templates[tone];
  const results: Omit<NudgeCopy, "id" | "targetSegment">[] = [];

  for (let i = 0; i < count; i++) {
    const randomTemplate = pool[Math.floor(Math.random() * pool.length)];
    results.push({
      tone,
      template: randomTemplate,
      createdAt: new Date().toISOString(),
    });
  }

  return results;
}
