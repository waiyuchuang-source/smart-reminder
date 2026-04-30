import { User, Task, NudgeCopy } from "./types";
import { db } from "./mock-data";

export function matchNudgeForUser(user: User, tasks: Task[]): string | null {
  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  
  if (pendingTasks.length === 0 && tasks.length > 0) {
    // All tasks completed - force motivational
    const copy = db.generatedCopies.find((c) => c.tone === "motivational") || db.generatedCopies[0];
    return interpolate(copy.template, user, null);
  }

  if (pendingTasks.length === 0) {
    return null; // No tasks at all
  }

  const nextTask = pendingTasks[0];

  // Match based on segment
  let preferredTone = "empathetic";
  if (user.segment === "active") preferredTone = "motivational";
  if (user.segment === "at-risk") preferredTone = "humorous";

  // Find a matching copy, fallback to any available if exact tone not found
  const matchedCopy = 
    db.generatedCopies.find((c) => c.tone === preferredTone && (c.targetSegment === user.segment || c.targetSegment === "all")) || 
    db.generatedCopies.find((c) => c.tone === preferredTone) ||
    db.generatedCopies[0];

  return interpolate(matchedCopy.template, user, nextTask);
}

function interpolate(template: string, user: User, task: Task | null): string {
  let result = template
    .replace(/{user_name}/g, user.name)
    .replace(/{streak}/g, user.streakDays.toString());

  if (task) {
    result = result
      .replace(/{task_name}/g, task.title)
      .replace(/{task_duration}/g, task.durationMinutes.toString());
  }

  return result;
}
