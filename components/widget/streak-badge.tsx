"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

export function StreakBadge({ days }: { days: number }) {
  if (days <= 0) return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-bold text-orange-600 dark:bg-orange-900/30 dark:text-orange-500"
    >
      <Flame className="h-3 w-3 fill-orange-500" />
      <span>{days} 天连胜</span>
    </motion.div>
  );
}
