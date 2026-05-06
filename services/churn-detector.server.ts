import { prisma } from "@/lib/prisma";

const CHURN_THRESHOLD_DAYS = 4;

export interface ChurnAlert {
  userId: string;
  userName: string;
  daysInactive: number;
  lastActiveAt: string;
  parentNotified: boolean;
  notifiedAt?: string;
}

const parentNotifications = new Map<string, { notifiedAt: string }>();

export async function detectChurnUsers(): Promise<ChurnAlert[]> {
  const now = Date.now();
  const users = await prisma.user.findMany();

  return users
    .filter((u) => {
      const daysInactive = Math.floor((now - u.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24));
      return daysInactive >= CHURN_THRESHOLD_DAYS;
    })
    .map((u) => {
      const daysInactive = Math.floor((now - u.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24));
      const notification = parentNotifications.get(u.id);
      return {
        userId: u.id,
        userName: u.name,
        daysInactive,
        lastActiveAt: u.lastActiveAt.toISOString(),
        parentNotified: !!notification,
        notifiedAt: notification?.notifiedAt,
      };
    });
}

export function markParentNotified(userId: string): void {
  parentNotifications.set(userId, { notifiedAt: new Date().toISOString() });
}
