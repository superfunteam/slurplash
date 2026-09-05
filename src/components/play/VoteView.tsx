"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Tv } from "lucide-react";
import type { MeState, PublicState } from "@/shared/types";
import { TIMINGS } from "@/shared/constants";
import { playerById } from "@/lib/game";
import { Avatar } from "@/components/ui/Avatar";
import { haptic } from "@/lib/audio";

export function VoteView({ state, me, remaining, onVote }: { state: PublicState; me: MeState; remaining: number; onVote: (matchupIndex: number, playerId: string) => void }) {
  const phase = state.phase;
  const m = state.matchup;
  if (phase.kind !== "showdown" || !m) return null;
  const a = playerById(state, m.a);
  const b = playerById(state, m.b);
  const inMatchup = me.id === m.a || me.id === m.b;
  const voting = phase.stage === "voting";
  const frac = Math.max(0, Math.min(1, remaining / (TIMINGS.voting / 1000)));

  if (inMatchup) {
    return (
      <Center>
        <motion.div animate={{ rotate: [-3, 3, -3] }} transition={{ repeat: Infinity, duration: 2 }} className="text-7xl">
          🔥
        </motion.div>
        <div className="display mt-6 text-4xl text-white">You’re in this one!</div>
        <div className="display-soft mt-3 text-white/70">Sit tight and watch the big screen. No voting for yourself, that’s a corporate compliance thing.</div>
      </Center>
    );
  }

  if (!voting) {
    return (
      <Center>
        <Tv size={64} className="text-seven-orange-bright" />
        <div className="display mt-6 text-4xl text-white">{phase.stage === "results" ? "And the points go to…" : "Eyes up"}</div>
        <div className="display-soft mt-3 text-white/70">{phase.stage === "prompt" ? "The prompt is on the big screen." : phase.stage === "reveal" ? "Answers incoming." : "Check the big screen for the tally."}</div>
      </Center>
    );
  }

  if (me.voted) {
    return (
      <Center>
        <motion.div initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 14 }} className="flex h-24 w-24 items-center justify-center rounded-full bg-seven-green text-white shadow-[0_8px_0_0_#004D38]">
          <Check size={56} strokeWidth={3.5} />
        </motion.div>
        <div className="display mt-6 text-4xl text-white">Vote locked!</div>
        <div className="display-soft mt-3 text-white/70">Results land on the big screen in a sec.</div>
      </Center>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
      <div className="flex items-center justify-between text-white">
        <span className="eyebrow opacity-60">Which one wins?</span>
        <span className={`numeric display text-2xl ${remaining <= 5 ? "text-seven-red" : ""}`}>{Math.ceil(remaining)}s</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
        <div className={`h-full rounded-full ${remaining <= 5 ? "bg-seven-red" : "bg-seven-orange"}`} style={{ width: `${frac * 100}%`, transition: "width 120ms linear" }} />
      </div>
      <div className="glass rounded-2xl px-4 py-3 text-sm leading-snug text-white/85">{m.prompt}</div>
      <AnimatePresence>
        {m.answers && (
          <>
            <VoteButton key="a" flavor="blue" text={m.answers[m.a]} delay={0} onClick={() => onVote(m.index, m.a)} />
            <div className="display text-center text-2xl text-seven-orange">VS</div>
            <VoteButton key="b" flavor="cherry" text={m.answers[m.b]} delay={0.1} onClick={() => onVote(m.index, m.b)} />
          </>
        )}
      </AnimatePresence>
      <div className="mt-1 flex items-center justify-center gap-2 text-xs text-white/40">
        {a && <Avatar id={a.avatar} size={20} />}
        {b && <Avatar id={b.avatar} size={20} />}
        <span>Authors stay hidden until the reveal</span>
      </div>
    </div>
  );
}

function VoteButton({ flavor, text, delay, onClick }: { flavor: "blue" | "cherry"; text: string; delay: number; onClick: () => void }) {
  return (
    <motion.button
      initial={{ y: 40, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 22, delay }}
      whileTap={{ scale: 0.96, y: 4 }}
      onClick={() => {
        haptic([12, 30, 12]);
        onClick();
      }}
      className={`relative flex flex-1 flex-col overflow-hidden rounded-[1.75rem] p-2 text-left ${flavor === "blue" ? "liquid-blue shadow-[0_8px_0_0_#0A6A98]" : "liquid-cherry shadow-[0_8px_0_0_#8F0E14]"}`}
    >
      <div className="flex flex-1 items-center rounded-[1.3rem] bg-white/95 px-5 py-4">
        <span className="display-soft text-[22px] leading-snug text-ink">{text}</span>
      </div>
      <div className="absolute right-4 top-4 rounded-full bg-black/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">{flavor === "blue" ? "Blue Raspberry" : "Cherry"}</div>
    </motion.button>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      {children}
    </motion.div>
  );
}
