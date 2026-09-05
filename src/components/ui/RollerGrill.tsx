"use client";

import { motion } from "motion/react";
import { SnackIcon } from "@/components/icons/SnackIcon";

const ITEMS: Array<{ icon: "bigbite" | "taquito"; row: 0 | 1; delay: number; duration: number }> = [
  { icon: "bigbite", row: 0, delay: 0, duration: 4.2 },
  { icon: "taquito", row: 1, delay: 0.5, duration: 3.6 },
  { icon: "bigbite", row: 0, delay: 1.3, duration: 4.6 },
  { icon: "taquito", row: 0, delay: 2.4, duration: 3.9 },
  { icon: "bigbite", row: 1, delay: 1.9, duration: 4.4 },
  { icon: "taquito", row: 1, delay: 3.1, duration: 3.7 },
  { icon: "bigbite", row: 0, delay: 3.6, duration: 4.1 },
];

/**
 * Roller-grill transition: hot dogs and taquitos roll endlessly across chrome
 * rollers. Sits behind round intro titles.
 */
export function RollerGrill({ label }: { label?: string }) {
  return (
    <motion.div className="absolute inset-0 z-40 flex flex-col items-center justify-center overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.35 } }}>
      <div className="absolute inset-0 bg-seven-green-ink/80" />
      {/* faint snack wall behind */}
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, #fff 2px, transparent 2.5px)", backgroundSize: "48px 48px" }} />
      {/* rollers */}
      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col gap-[150px]">
        {[0, 1].map((row) => (
          <div key={row} className="relative h-8 w-full overflow-hidden rounded-2xl" style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>
            <motion.div
              className="absolute inset-y-0 -left-[80px] w-[calc(100%+160px)]"
              style={{ background: "repeating-linear-gradient(90deg, #DCE3EE 0 34px, #8E9BB0 34px 40px)", boxShadow: "inset 0 -7px 0 rgba(0,0,0,0.28), inset 0 5px 0 rgba(255,255,255,0.55)" }}
              animate={{ x: [0, 40] }}
              transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
            />
          </div>
        ))}
      </div>
      {ITEMS.map((it, i) => (
        <motion.div
          key={i}
          className="absolute left-0"
          style={{ top: it.row === 0 ? "calc(50% - 205px)" : "calc(50% - 20px)" }}
          initial={{ x: -220, rotate: 0 }}
          animate={{ x: 2140, rotate: 1080 }}
          transition={{ duration: it.duration, delay: it.delay, repeat: Infinity, ease: "linear" }}
        >
          <SnackIcon id={it.icon} size={130} />
        </motion.div>
      ))}
      {label && (
        <motion.div className="display relative z-10 text-center text-[120px] text-white" style={{ textShadow: "0 8px 0 rgba(0,0,0,0.3)" }} initial={{ scale: 0.6, opacity: 0, rotate: -6 }} animate={{ scale: 1, opacity: 1, rotate: -2 }} exit={{ scale: 1.2, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.25 }}>
          {label}
        </motion.div>
      )}
    </motion.div>
  );
}
