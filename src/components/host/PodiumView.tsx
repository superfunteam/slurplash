"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { RotateCcw, Sparkles, Snowflake, Trophy, Zap, Plus } from "lucide-react";
import type { PublicState } from "@/shared/types";
import { playerById, standings } from "@/lib/game";
import { Avatar } from "@/components/ui/Avatar";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Button } from "@/components/ui/Button";
import { SevenElevenLogo } from "@/components/brand/SevenElevenLogo";

const TITLES = ["Store Manager of the Year", "Franchisee of the Year", "Employee of the Month"];
const HEIGHTS = [420, 320, 250];
const ORDER = [1, 0, 2]; // visual left→right: 2nd, 1st, 3rd

export function PodiumView({ state, onPlayAgain, onNewGame }: { state: PublicState; onPlayAgain: () => void; onNewGame: () => void }) {
  const phase = state.phase;
  const step = phase.kind === "podium" ? phase.step : 0;
  const ranked = standings(state.players);
  const top3 = ranked.slice(0, 3);
  const revealed = (rank: number) => (rank === 2 ? step >= 1 : rank === 1 ? step >= 2 : step >= 3);

  useEffect(() => {
    if (step !== 3) return;
    const end = Date.now() + 2400;
    const colors = ["#F58220", "#EE1C25", "#008060", "#00A3E0", "#ffffff"];
    const frame = () => {
      confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors, zIndex: 100 });
      confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors, zIndex: 100 });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    confetti({ particleCount: 180, spread: 100, startVelocity: 55, origin: { x: 0.5, y: 0.5 }, colors, zIndex: 100 });
  }, [step]);

  const stats = state.stats;

  return (
    <div className="absolute inset-0 flex flex-col px-14 pb-10 pt-32">
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow text-seven-orange-bright">Final results</div>
          <AnimatePresence mode="wait">
            <motion.div key={step >= 3 ? "win" : "drum"} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="display mt-2 text-[84px] text-white">
              {step >= 3 && top3[0] ? `${top3[0].name} takes the store!` : step === 0 ? "And the winner is…" : "Counting the register…"}
            </motion.div>
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {step >= 4 && (
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="flex gap-4">
              <Button size="xl" variant="primary" onClick={onPlayAgain}>
                <RotateCcw size={24} /> Play again, same crew
              </Button>
              <Button size="xl" variant="secondary" onClick={onNewGame}>
                <Plus size={24} /> New game
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex flex-1 gap-10">
        {/* ── podium ── */}
        <div className="flex flex-1 items-end justify-center gap-6">
          {ORDER.map((rank) => {
            const p = top3[rank];
            if (!p) return <div key={rank} className="w-[300px]" />;
            const shown = revealed(rank);
            return (
              <div key={p.id} className="flex w-[320px] flex-col items-center justify-end">
                <AnimatePresence>
                  {shown && (
                    <motion.div initial={{ y: 40, opacity: 0, scale: 0.7 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }} className="mb-5 flex flex-col items-center gap-3">
                      <Avatar id={p.avatar} size={rank === 0 ? 190 : 140} ring bounce={rank === 0} />
                      <div className="display-soft rounded-full bg-white px-6 py-2 text-[30px] text-seven-green-dark">{p.name}</div>
                      <div className="numeric display text-4xl text-white">
                        <AnimatedNumber value={p.score} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: shown ? HEIGHTS[rank] : 0 }}
                  transition={{ type: "spring", stiffness: 160, damping: 22 }}
                  className={`relative flex w-full flex-col items-center overflow-hidden rounded-t-[2rem] ${rank === 0 ? "bg-seven-orange" : rank === 1 ? "bg-white" : "bg-seven-green"}`}
                  style={{ boxShadow: "inset 0 -14px 0 rgba(0,0,0,0.18)" }}
                >
                  <div className={`numeric display mt-6 text-[110px] leading-none ${rank === 1 ? "text-seven-green-dark" : "text-white"}`}>{rank + 1}</div>
                  <div className={`mt-2 flex items-center gap-2 rounded-full px-4 py-1.5 ${rank === 1 ? "bg-mist text-seven-green-dark" : "bg-black/15 text-white"}`}>
                    <Trophy size={18} />
                    <span className="display-soft text-lg">{TITLES[rank]}</span>
                  </div>
                  <div className="absolute bottom-4 opacity-80"><SevenElevenLogo size={48} /></div>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* ── stats ── */}
        <AnimatePresence>
          {step >= 4 && stats && (
            <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 24 }} className="flex w-[520px] flex-col gap-4 self-center">
              <StatCard icon={<Zap size={26} fill="currentColor" />} tint="bg-seven-red" label="Most Slurpee Sweeps" player={playerById(state, stats.mostSweeps?.playerId)?.name} value={stats.mostSweeps ? `${stats.mostSweeps.count} sweep${stats.mostSweeps.count === 1 ? "" : "s"}` : "Nobody swept"} avatar={playerById(state, stats.mostSweeps?.playerId)?.avatar} />
              <StatCard icon={<Sparkles size={26} />} tint="bg-slurpee-blue" label="Audience Darling" player={playerById(state, stats.audienceDarling?.playerId)?.name} value={stats.audienceDarling ? `${stats.audienceDarling.count} crowd win${stats.audienceDarling.count === 1 ? "" : "s"}` : "The crowd was quiet"} avatar={playerById(state, stats.audienceDarling?.playerId)?.avatar} />
              <StatCard icon={<Snowflake size={26} />} tint="bg-seven-green" label="Coldest Answer" player={playerById(state, stats.coldestAnswer?.playerId)?.name} value={stats.coldestAnswer ? `“${stats.coldestAnswer.text}” — ${stats.coldestAnswer.votes} vote${stats.coldestAnswer.votes === 1 ? "" : "s"}` : "—"} avatar={playerById(state, stats.coldestAnswer?.playerId)?.avatar} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({ icon, tint, label, player, value, avatar }: { icon: React.ReactNode; tint: string; label: string; player?: string; value: string; avatar?: PublicState["players"][number]["avatar"] }) {
  return (
    <div className="card-white flex items-center gap-4 rounded-[1.5rem] p-4">
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white ${tint}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="eyebrow text-ink-soft">{label}</div>
        <div className="display-soft truncate text-2xl text-seven-green-dark">{player ?? "—"}</div>
        <div className="truncate text-base text-ink-soft">{value}</div>
      </div>
      {avatar && <Avatar id={avatar} size={52} />}
    </div>
  );
}
