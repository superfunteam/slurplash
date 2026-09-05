"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, PencilLine, Smartphone } from "lucide-react";
import type { PublicState } from "@/shared/types";
import { TIMINGS } from "@/shared/constants";
import { ROUND_META } from "@/lib/game";
import { Avatar } from "@/components/ui/Avatar";
import { TimerRing } from "@/components/ui/TimerRing";

export function InputView({ state, remaining }: { state: PublicState; remaining: number }) {
  const phase = state.phase;
  if (phase.kind !== "input") return null;
  const total = TIMINGS.input[phase.round] / 1000;
  const done = state.players.filter((p) => p.submitted).length;
  const meta = ROUND_META[phase.round];
  const bigBite = phase.round === 3;
  const n = state.players.length;
  const cols = n <= 4 ? n : 4;
  const cardSize = n <= 4 ? 200 : 150;

  return (
    <div className="absolute inset-0 flex flex-col px-14 pb-12 pt-32">
      <div className="flex w-full items-center justify-between">
        <div>
          <div className="eyebrow text-seven-orange-bright">{meta.subtitle} · Answer time</div>
          <div className="display mt-2 text-[84px] text-white">{bigBite ? "Three answers. Go." : "Write something funny."}</div>
          <div className="display-soft mt-3 flex items-center gap-3 text-[30px] text-white/75">
            <Smartphone size={30} className="text-seven-orange-bright" />
            {bigBite ? "Everyone has the same prompt on their phone. Fill all 3 slots." : "Two prompts each. Answer both on your phone before the clock runs out."}
          </div>
        </div>
        <TimerRing remaining={remaining} total={total} size={260} stroke={18} label="seconds" />
      </div>

      {bigBite && state.bigBite && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card-white relative mt-8 w-full overflow-hidden rounded-[2rem] px-10 py-7">
          <div className="stripes-h absolute inset-x-0 top-0 h-2.5" />
          <div className="eyebrow text-seven-green">The prompt</div>
          <div className="display-soft mt-2 text-[48px] leading-tight text-seven-green-dark">{state.bigBite.prompt}</div>
        </motion.div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {state.players.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 24 }}
              className={`relative flex flex-col items-center gap-4 rounded-[2rem] px-8 py-6 transition-colors duration-500 ${p.submitted ? "card-white" : "glass"}`}
              style={{ width: cardSize + 100 }}
            >
              <Avatar id={p.avatar} size={cardSize * 0.72} dim={!p.connected} bounce={!p.submitted} />
              <div className={`display-soft w-full truncate text-center ${p.submitted ? "text-seven-green-dark" : "text-white"}`} style={{ fontSize: n <= 4 ? 32 : 26 }}>
                {p.name}
              </div>
              <AnimatePresence mode="wait">
                {p.submitted ? (
                  <motion.div key="done" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 20 }} className="absolute -right-3 -top-3 flex h-14 w-14 items-center justify-center rounded-full bg-seven-green text-white shadow-lg ring-4 ring-white">
                    <Check size={30} strokeWidth={3.5} />
                  </motion.div>
                ) : (
                  <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute -right-3 -top-3 flex h-14 w-14 items-center justify-center rounded-full bg-seven-orange text-white shadow-lg">
                    <motion.div animate={{ rotate: [-12, 12, -12] }} transition={{ repeat: Infinity, duration: 0.9 }}>
                      <PencilLine size={26} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-white">
        <div className="display-soft text-3xl">
          <span className="numeric text-seven-orange-bright">{done}</span>
          <span className="opacity-60"> / {n} locked in</span>
        </div>
        <div className="h-5 w-[720px] overflow-hidden rounded-full bg-white/15">
          <motion.div className="stripes-h h-full rounded-full" animate={{ width: `${(done / Math.max(1, n)) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
      </div>
    </div>
  );
}
