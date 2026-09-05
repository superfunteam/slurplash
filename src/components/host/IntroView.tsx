"use client";

import { motion } from "motion/react";
import type { RoundNumber } from "@/shared/types";
import { ROUND_META } from "@/lib/game";
import { RollerGrill } from "@/components/ui/RollerGrill";

export function IntroView({ round }: { round: RoundNumber }) {
  const meta = ROUND_META[round];
  return (
    <div className="absolute inset-0">
      <RollerGrill />
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center text-center">
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9, type: "spring", stiffness: 240, damping: 20 }} className="eyebrow text-seven-orange-bright" style={{ fontSize: 24 }}>
          {meta.subtitle}
          {round === 2 && <span className="ml-4 rounded-full bg-seven-orange px-4 py-1 text-white">Double points</span>}
        </motion.div>
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: -2 }}
          transition={{ delay: 1.05, type: "spring", stiffness: 250, damping: 16 }}
          className="display mt-4 text-[170px] text-white"
          style={{ textShadow: "0 10px 0 rgba(0,0,0,0.3), 0 0 80px rgba(245,130,32,0.35)" }}
        >
          {meta.title}
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.5 }} className="display-soft mt-6 text-[40px] text-white/85">
          {meta.blurb}
        </motion.div>
      </div>
    </div>
  );
}
