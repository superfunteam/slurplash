"use client";

import { motion } from "motion/react";
import { REACTIONS, type ReactionId } from "@/shared/avatars";
import { SnackIcon } from "@/components/icons/SnackIcon";
import { haptic } from "@/lib/audio";

export function ReactionBar({ onReact }: { onReact: (r: ReactionId) => void }) {
  return (
    <div className="px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
      <div className="eyebrow mb-2 text-center text-white/50">Tap to react on the big screen</div>
      <div className="glass flex justify-between rounded-[1.5rem] p-2">
        {REACTIONS.map((r) => (
          <motion.button
            key={r.id}
            whileTap={{ scale: 0.75, rotate: -12 }}
            transition={{ type: "spring", stiffness: 600, damping: 18 }}
            onClick={() => {
              haptic(6);
              onReact(r.id);
            }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl active:bg-white/10"
            aria-label={r.name}
          >
            <SnackIcon id={r.id} size={40} />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
