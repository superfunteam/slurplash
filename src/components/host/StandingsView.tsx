"use client";

import { motion } from "motion/react";
import { ArrowUp, Minus } from "lucide-react";
import type { PublicState } from "@/shared/types";
import { standings } from "@/lib/game";
import { Avatar } from "@/components/ui/Avatar";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export function StandingsView({ state }: { state: PublicState }) {
  const phase = state.phase;
  if (phase.kind !== "standings") return null;
  const ranked = standings(state.players);
  const leader = ranked[0];
  return (
    <div className="absolute inset-0 flex flex-col px-14 pb-12 pt-32">
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow text-seven-orange-bright">After round {phase.round}</div>
          <div className="display mt-2 text-[84px] text-white">Standings</div>
        </div>
        {leader && (
          <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="glass flex items-center gap-4 rounded-full py-3 pl-3 pr-7 text-white">
            <Avatar id={leader.avatar} size={56} />
            <div>
              <div className="eyebrow text-seven-orange-bright">Leading the store</div>
              <div className="display-soft text-2xl">{leader.name}</div>
            </div>
          </motion.div>
        )}
      </div>

      <div className={`mt-8 grid flex-1 gap-x-8 gap-y-5 content-start ${ranked.length > 5 ? "grid-cols-2" : "grid-cols-1"}`}>
        {ranked.map((p, i) => {
          const delta = p.score - (state.previousScores[p.id] ?? 0);
          return (
            <motion.div
              key={p.id}
              layout
              initial={{ x: i % 2 === 0 ? -60 : 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.1 + i * 0.09 }}
              className={`flex items-center gap-6 rounded-[1.75rem] pr-10 ${ranked.length > 5 ? "p-4" : "p-5"} ${i === 0 ? "card-white" : "glass text-white"}`}
            >
              <div className={`numeric display flex items-center justify-center rounded-2xl ${ranked.length > 5 ? "h-16 w-16 text-3xl" : "h-20 w-20 text-4xl"} ${i === 0 ? "bg-seven-orange text-white" : "bg-white/10"}`}>{i + 1}</div>
              <Avatar id={p.avatar} size={ranked.length > 5 ? 72 : 96} dim={!p.connected} />
              <div className={`display-soft flex-1 truncate ${ranked.length > 5 ? "text-[34px]" : "text-[44px]"} ${i === 0 ? "text-seven-green-dark" : ""}`}>{p.name}</div>
              <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 + i * 0.09, type: "spring", stiffness: 400, damping: 20 }} className={`flex items-center gap-1 rounded-full px-3 py-1 text-lg font-extrabold ${delta > 0 ? "bg-seven-green text-white" : "bg-white/10 text-white/60"}`}>
                {delta > 0 ? <ArrowUp size={18} strokeWidth={3} /> : <Minus size={18} />}
                <span className="numeric">{delta.toLocaleString()}</span>
              </motion.div>
              <div className={`numeric display w-[240px] text-right ${ranked.length > 5 ? "text-[44px]" : "text-[56px]"} ${i === 0 ? "text-seven-green" : ""}`}>
                <AnimatedNumber value={p.score} delay={0.9 + i * 0.09} />
              </div>
            </motion.div>
          );
        })}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="display-soft mt-4 text-center text-2xl text-white/60">
        {phase.round === 1 ? "Next up: Big Gulp Stakes — everything is worth double." : "Next up: The Big Bite. Three answers, 500 points a vote. Anyone can still win."}
      </motion.div>
    </div>
  );
}
