"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NudgeMessage({ message, onStart, taskTitle, isGenerating }: { message: string | null; onStart?: () => void; taskTitle?: string; isGenerating?: boolean }) {
  const [displayedText, setDisplayedText] = useState("");
  
  if (!message) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative rounded-2xl rounded-br-sm bg-blue-50 p-3 text-sm leading-relaxed text-blue-900 dark:bg-blue-900/20 dark:text-blue-100">
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {message}
        </motion.p>
      </div>
      
      {onStart && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            onClick={onStart}
            className="w-full gap-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
          >
            <PlayCircle className="h-4 w-4" />
            {taskTitle ? `开始任务：${taskTitle}` : "一键开始"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
