"use client";

import { AnimatePresence, motion } from "motion/react";
import { Users, Crown } from "lucide-react";
import type { PublicState } from "@/shared/types";
import { BIG_BITE_VOTES, POINTS, TIMINGS } from "@/shared/constants";
import { playerById } from "@/lib/game";
import { Avatar } from "@/components/ui/Avatar";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { TimerRing } from "@/components/ui/TimerRing";

const FLAVORS = ["liquid-blue", "liquid-cherry", "bg-seven-green", "bg-seven-orange"];

export function BigBiteView({ state, remaining }: { state: PublicState; remaining: number }) {
  const phase = state.phase;
  const bb = state.bigBite;
  if (!bb || !bb.answers) return null;
  const kind = phase.kind;
  const results = kind === "bigbite-results";
  const answers = results ? bb.answers.slice().sort((x, y) => y.votes - x.votes) : bb.answers;
  const cols = answers.length > 12 ? 4 : answers.length > 6 ? 3 : 2;

  return (
    <div className="absolute inset-0 flex flex-col px-14 pb-10 pt-32">
      <div className="flex items-start justify-between gap-10">
        <div className="card-white relative flex-1 overflow-hidden rounded-[2rem] px-10 py-7">
          <div className="stripes-h absolute inset-x-0 top-0 h-2.5" />
          <div className="eyebrow text-seven-green">The Big Bite · {POINTS[3].perVote} points per vote</div>
          <div className="display-soft mt-2 text-[44px] leading-tight text-seven-green-dark">{bb.prompt}</div>
        </div>
        <div className="flex shrink-0 items-center gap-6">
          <AnimatePresence mode="wait">
            {kind === "bigbite-voting" && (
              <motion.div key="t" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="flex items-center gap-6">
                <div className="glass flex flex-col items-center rounded-3xl px-6 py-4 text-white">
                  <div className="eyebrow opacity-70">Votes</div>
                  <div className="numeric display text-5xl">{BIG_BITE_VOTES}</div>
                  <div className="eyebrow opacity-70">each</div>
                </div>
                <div className="glass flex flex-col items-center rounded-3xl px-6 py-4 text-white">
                  <Users size={22} className="opacity-80" />
                  <div className="numeric display text-4xl">
                    {bb.votesIn}
                    <span className="text-2xl opacity-60">/{bb.eligibleVoters}</span>
                  </div>
                  <div className="eyebrow opacity-70">done</div>
                </div>
                <TimerRing remaining={remaining} total={TIMINGS.bigBiteVoting / 1000} size={180} stroke={14} label="vote" />
              </motion.div>
            )}
            {kind === "bigbite-reveal" && (
              <motion.div key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass rounded-3xl px-8 py-5 text-white">
                <div className="eyebrow text-seven-orange-bright">Here they come</div>
                <div className="display-soft text-3xl">Pick your 3 favorites</div>
              </motion.div>
            )}
            {results && (
              <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl px-8 py-5 text-white">
                <div className="eyebrow text-seven-orange-bright">Results</div>
                <div className="display-soft text-3xl">Authors revealed</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 grid flex-1 gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: "minmax(0, 1fr)", maxHeight: 640 }}>
        {answers.map((a, i) => {
          const author = playerById(state, a.playerId);
          const top = results && i === 0 && a.votes > 0;
          return (
            <motion.div
              key={a.id}
              layout
              initial={{ y: 60, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 22, delay: kind === "bigbite-reveal" ? 0.4 + i * 0.7 : 0 }}
              className={`relative flex items-center gap-4 overflow-hidden rounded-[1.5rem] p-2 ${FLAVORS[i % FLAVORS.length]} ${top ? "shadow-glow-orange" : ""}`}
            >
              <div className="flex flex-1 items-center gap-4 rounded-[1.1rem] bg-white/95 px-5 py-4">
                <div className={`numeric display-soft flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${top ? "bg-seven-orange text-white" : "bg-mist text-seven-green-dark"}`}>{top ? <Crown size={22} /> : i + 1}</div>
                <div className="display-soft flex-1 leading-tight text-ink" style={{ fontSize: answers.length > 12 ? 24 : answers.length > 6 ? 30 : 36 }}>{a.text}</div>
                {results && author && (
                  <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="flex items-center gap-2">
                    <Avatar id={author.avatar} size={40} />
                    <span className="display-soft text-lg text-ink-soft">{author.name}</span>
                  </motion.div>
                )}
                {results && (
                  <div className="ml-2 flex flex-col items-end">
                    <div className="numeric display text-[34px] text-seven-green">
                      +<AnimatedNumber value={a.votes * POINTS[3].perVote} delay={0.4 + i * 0.08} />
                    </div>
                    <div className="eyebrow text-ink-soft">{a.votes} vote{a.votes === 1 ? "" : "s"}</div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
