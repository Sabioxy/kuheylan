"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function ScrollToMarketplace({ targetId }: { targetId: string }) {
  return (
    <motion.button
      type="button"
      onClick={() => {
        const el = document.getElementById(targetId);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      whileHover={{ y: 2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="group inline-flex items-center gap-2 rounded-full border border-zinc-200/60 bg-white/60 px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10"
    >
      Aşağı kaydır
      <motion.span
        className="inline-flex"
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="h-4 w-4 opacity-70" />
      </motion.span>
    </motion.button>
  );
}
