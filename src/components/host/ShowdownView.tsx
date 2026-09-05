"use client";

import { AnimatePresence, motion } from "motion/react";
import { Crown, Sparkles, Users, Zap } from "lucide-react";
import type { MatchupResult, PublicState } from "@/shared/types";
import { POINTS, TIMINGS } from "@/shared/constants";
import { pct, playerById } from "@/lib/game";
import { AnswerCard } from "@/components/ui/AnswerCard";
import { Avatar } from "@/components/ui/Avatar";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { SlurpeeSplash } from "@/components/ui/SlurpeeSplash";
import { TimerRing } from "@/components/ui/TimerRing";

export function ShowdownView({ state, remaining }: { state: PublicState; remaining: number }) {
  const phase = state.phase;
  const m = state.matchup;
  if (phase.kind !== "showdown" || !m) return null;
  const a = playerById(state, m.a);
  const b = playerById(state, m.b);
  if (!a || !b) return null;
  const stage = phase.stage;
  const res = m.result;
  const pts = POINTS[phase.round];

  return (
    <div className="absolute inset-0 flex flex-col px-14 pb-12 pt-32">
      {/* ── prompt ── */}
      <motion.div
        layout
        className="card-white relative mx-auto w-full overflow-hidden rounded-[2rem]"
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0, padding: stage === "prompt" ? 64 : 28 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
      >
        <div className="stripes-h absolute inset-x-0 top-0 h-2.5" />
        <div className="flex items-center gap-8">
          <div className="numeric display shrink-0 rounded-3xl bg-seven-green px-6 py-3 text-[36px] text-white">
            {m.index + 1}<span className="opacity-60">/{phase.matchupCount}</span>
          </div>
          <motion.div layout="position" className="display-soft text-seven-green-dark" animate={{ fontSize: stage === "prompt" ? 68 : 40 }} transition={{ type: "spring", stiffness: 200, damping: 26 }} style={{ lineHeight: 1.1 }}>
            {m.prompt}
          </motion.div>
        </div>
      </motion.div>

      {/* ── contenders ── */}
      <div className="relative mt-8 grid flex-1 grid-cols-[1fr_auto_1fr] items-stretch gap-8">
        <AnimatePresence>
          {stage === "prompt" && (
            <motion.div key="hint" className="absolute inset-0 z-10 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.1 }}>
              <div className="flex items-center gap-12">
                <Contender player={a} side="A" />
                <motion.div className="display text-[120px] text-seven-orange" animate={{ rotate: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}>
                  VS
                </motion.div>
                <Contender player={b} side="B" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {stage !== "prompt" && m.answers && (
          <>
            <Side flavor="blue" text={m.answers[a.id]} player={a} res={res} stage={stage} delay={0} round={phase.round} />
            <div className="flex w-[240px] flex-col items-center justify-center gap-6">
              <AnimatePresence mode="wait">
                {stage === "voting" ? (
                  <motion.div key="timer" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="flex flex-col items-center gap-5">
                    <TimerRing remaining={remaining} total={TIMINGS.voting / 1000} size={220} stroke={16} label="vote now" />
                    <div className="glass flex items-center gap-2 rounded-full px-5 py-2 text-white">
                      <Users size={18} />
                      <span className="numeric display-soft text-xl">{m.votesIn}</span>
                      <span className="opacity-60">/ {m.eligibleVoters} in</span>
                    </div>
                  </motion.div>
                ) : stage === "reveal" ? (
                  <motion.div key="vs" className="display text-[110px] text-seven-orange" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: -4 }} transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.5 }}>
                    VS
                  </motion.div>
                ) : (
                  <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2 text-white">
                    <div className="eyebrow text-seven-orange-bright">Base pot</div>
                    <div className="numeric display text-6xl">{pts.base.toLocaleString()}</div>
                    <div className="eyebrow mt-3 opacity-60">split by votes</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Side flavor="cherry" text={m.answers[b.id]} player={b} res={res} stage={stage} delay={0.35} round={phase.round} />
          </>
        )}
      </div>
    </div>
  );
}

function Contender({ player, side }: { player: NonNullable<ReturnType<typeof playerById>>; side: "A" | "B" }) {
  return (
    <motion.div initial={{ x: side === "A" ? -120 : 120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 20 }} className="flex flex-col items-center gap-5">
      <Avatar id={player.avatar} size={220} ring />
      <div className="display-soft rounded-full bg-white px-8 py-3 text-[36px] text-seven-green-dark">{player.name}</div>
    </motion.div>
  );
}

function Side({
  flavor,
  text,
  player,
  res,
  stage,
  delay,
  round,
}: {
  round: 1 | 2;
  flavor: "blue" | "cherry";
  text: string;
  player: NonNullable<ReturnType<typeof playerById>>;
  res: MatchupResult | null;
  stage: string;
  delay: number;
}) {
  const results = stage === "results" && res;
  const isWinner = !!results && res.winner === player.id;
  const isLoser = !!results && res.winner !== null && res.winner !== player.id;
  const total = results ? res.totalPoints[player.id] : 0;
  const sweep = results && res.sweep === player.id;
  const fav = results && res.audienceFav === player.id;

  return (
    <div className="relative flex">
      {stage === "reveal" && <SlurpeeSplash flavor={flavor} delay={delay} />}
      <motion.div
        className="relative flex w-full"
        initial={{ y: 400, rotate: flavor === "blue" ? -8 : 8, opacity: 0 }}
        animate={{ y: 0, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 210, damping: 18, delay: delay + 0.15 }}
      >
        <AnswerCard
          flavor={flavor}
          dim={isLoser}
          winner={isWinner}
          className="w-full"
          textSize={text.length <= 36 ? 68 : text.length <= 60 ? 56 : 46}
          footer={
            <div className="flex flex-col gap-4">
              <AnimatePresence>
                {stage === "results" ? (
                  <motion.div key="who" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                    <Avatar id={player.avatar} size={44} />
                    <span className="display-soft text-2xl text-ink-soft">{player.name}</span>
                    {isWinner && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }} className="ml-auto flex items-center gap-1.5 rounded-full bg-seven-orange px-3 py-1 text-sm font-extrabold uppercase tracking-wider text-white">
                        <Crown size={16} /> Winner
                      </motion.span>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="flavor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                    <span className={`rounded-full px-4 py-1.5 text-sm font-extrabold uppercase tracking-[0.18em] text-white ${flavor === "blue" ? "bg-slurpee-blue" : "bg-slurpee-cherry"}`}>{flavor === "blue" ? "Blue Raspberry" : "Cherry"}</span>
                    <span className="eyebrow text-ink-soft/50">Author hidden until the tally</span>
                  </motion.div>
                )}
              </AnimatePresence>
              {results && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
                  <div className="h-6 w-full overflow-hidden rounded-full bg-mist">
                    <motion.div className={`h-full rounded-full ${flavor === "blue" ? "liquid-blue" : "liquid-cherry"}`} initial={{ width: 0 }} animate={{ width: `${res.pct[player.id] * 100}%` }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }} />
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="display-soft text-ink-soft text-xl">
                      <span className="numeric text-ink text-3xl">{pct(res.pct[player.id])}</span> · {res.votes[player.id]} vote{res.votes[player.id] === 1 ? "" : "s"}
                    </div>
                    <div className="display text-[56px] text-seven-green">
                      +<AnimatedNumber value={total} delay={0.4} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sweep && (
                      <motion.div initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 14, delay: 0.9 }} className="flex items-center gap-2 rounded-full bg-seven-red px-4 py-2 text-white">
                        <Zap size={18} fill="currentColor" /> <span className="display-soft text-lg">Slurplash sweep!</span> <span className="numeric font-extrabold">+{POINTS[round].sweep}</span>
                      </motion.div>
                    )}
                    {fav && (
                      <motion.div initial={{ scale: 0, rotate: 12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 14, delay: 1.15 }} className="flex items-center gap-2 rounded-full bg-slurpee-blue px-4 py-2 text-white">
                        <Sparkles size={18} /> <span className="display-soft text-lg">Audience favorite</span> <span className="numeric font-extrabold">+{POINTS[round].audience}</span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          }
        >
          {text}
        </AnswerCard>
      </motion.div>
    </div>
  );
}
