"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import type { MeState, PublicState } from "@/shared/types";
import { BIG_BITE_VOTES, TIMINGS } from "@/shared/constants";
import { haptic } from "@/lib/audio";

export function BigBiteVoteView({ state, me, remaining, onVote }: { state: PublicState; me: MeState; remaining: number; onVote: (answerId: string) => void }) {
  const bb = state.bigBite;
  if (!bb?.answers) return null;
  const picked = me.bigBiteVotes;
  const done = picked.length >= BIG_BITE_VOTES;
  const frac = Math.max(0, Math.min(1, remaining / (TIMINGS.bigBiteVoting / 1000)));
  return (
    <div className="flex flex-1 flex-col gap-3 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
      <div className="flex items-center justify-between text-white">
        <span className="display-soft text-lg">
          Pick <span className="numeric text-seven-orange-bright">{BIG_BITE_VOTES - picked.length}</span> more
        </span>
        <span className={`numeric display text-2xl ${remaining <= 5 ? "text-seven-red" : ""}`}>{Math.ceil(remaining)}s</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
        <div className={`h-full rounded-full ${remaining <= 5 ? "bg-seven-red" : "bg-seven-orange"}`} style={{ width: `${frac * 100}%`, transition: "width 120ms linear" }} />
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: BIG_BITE_VOTES }, (_, i) => (
          <div key={i} className={`h-2 flex-1 rounded-full ${i < picked.length ? "bg-seven-green-bright" : "bg-white/20"}`} />
        ))}
      </div>
      <div className="no-scrollbar -mx-5 flex-1 overflow-y-auto px-5">
        <div className="flex flex-col gap-2.5 pb-4">
          {bb.answers.map((a, i) => {
            const mine = a.playerId === me.id;
            const on = picked.includes(a.id);
            const disabled = mine || (done && !on);
            return (
              <motion.button
                key={a.id}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: Math.min(0.6, i * 0.04), type: "spring", stiffness: 300, damping: 26 }}
                whileTap={disabled ? undefined : { scale: 0.97 }}
                disabled={disabled}
                onClick={() => {
                  haptic(10);
                  onVote(a.id);
                }}
                className={`flex items-center gap-3 rounded-[1.25rem] p-3 pl-4 text-left transition-colors ${on ? "bg-seven-green text-white shadow-[0_5px_0_0_#004D38]" : "card-white text-ink"} ${disabled && !on ? "opacity-40" : ""}`}
              >
                <span className="display-soft flex-1 text-lg leading-snug">{a.text}</span>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${on ? "bg-white text-seven-green" : "bg-mist text-ink-soft/40"}`}>{mine ? <span className="text-[9px] font-extrabold uppercase">You</span> : <Check size={20} strokeWidth={3} />}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
      {done && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-2xl bg-seven-green px-4 py-3 text-center display-soft text-white">
          All 3 votes in — tap one to swap it out
        </motion.div>
      )}
    </div>
  );
}
