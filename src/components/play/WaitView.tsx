"use client";

import { motion } from "motion/react";
import { Tv, Trophy } from "lucide-react";
import type { MeState, PublicState } from "@/shared/types";
import { ROUND_META, playerById, standings } from "@/lib/game";
import { Avatar } from "@/components/ui/Avatar";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export function WaitView({ state, me }: { state: PublicState; me: MeState }) {
  const phase = state.phase;
  const p = playerById(state, me.id);
  const rank = p ? standings(state.players).findIndex((x) => x.id === p.id) + 1 : 0;

  let title = "Eyes on the big screen";
  let subtitle = "";
  if (phase.kind === "intro") {
    title = ROUND_META[phase.round].title;
    subtitle = ROUND_META[phase.round].blurb;
  } else if (phase.kind === "standings") {
    title = rank ? `You’re in ${rank}${rank === 1 ? "st" : rank === 2 ? "nd" : rank === 3 ? "rd" : "th"}` : "Standings";
    subtitle = phase.round === 1 ? "Round 2 is double points. Everything’s still on the table." : "The Big Bite is next. 500 a vote, anyone can win.";
  } else if (phase.kind === "bigbite-reveal") {
    title = "Here they come";
    subtitle = "Read everything on the big screen. Voting opens in a moment.";
  } else if (phase.kind === "bigbite-results") {
    title = "The tally";
    subtitle = "Watch the points roll in.";
  } else if (phase.kind === "podium") {
    title = phase.step >= 3 ? (rank === 1 ? "You won the store!" : `You finished ${rank}${rank === 1 ? "st" : rank === 2 ? "nd" : rank === 3 ? "rd" : "th"}`) : "Drumroll…";
    subtitle = phase.step >= 4 ? "Thanks for playing. The host can run it back." : "The podium is being assembled on the big screen.";
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      {phase.kind === "podium" && phase.step >= 3 && rank === 1 ? (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -8, 8, 0] }} transition={{ scale: { type: "spring", stiffness: 300, damping: 12 }, rotate: { duration: 0.8, delay: 0.3 } }} className="flex h-28 w-28 items-center justify-center rounded-full bg-seven-orange text-white shadow-[0_10px_0_0_#B8560C]">
          <Trophy size={60} />
        </motion.div>
      ) : (
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}>
          <Tv size={64} className="text-seven-orange-bright" />
        </motion.div>
      )}
      <div className="display mt-6 text-4xl text-white">{title}</div>
      {subtitle && <div className="display-soft mt-3 text-white/70">{subtitle}</div>}
      {p && (
        <div className="glass mt-8 flex items-center gap-3 rounded-full py-2 pl-2 pr-6 text-white">
          <Avatar id={p.avatar} size={44} />
          <div className="text-left leading-tight">
            <div className="display-soft">{p.name}</div>
            <div className="numeric text-seven-orange-bright">
              <AnimatedNumber value={p.score} /> pts
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
