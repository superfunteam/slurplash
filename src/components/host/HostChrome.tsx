"use client";

import { motion } from "motion/react";
import { Volume2, VolumeX, SkipForward, Users } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import type { PublicState } from "@/shared/types";
import { ROUND_META } from "@/lib/game";

export function HostChrome({
  state,
  muted,
  onToggleMute,
  onSkip,
  joinHost,
}: {
  state: PublicState;
  muted: boolean;
  onToggleMute: () => void;
  onSkip: () => void;
  joinHost: string;
}) {
  const phase = state.phase;
  const round = "round" in phase ? phase.round : phase.kind === "bigbite-reveal" || phase.kind === "bigbite-voting" || phase.kind === "bigbite-results" ? 3 : null;
  const showSkip = phase.kind !== "lobby" && !(phase.kind === "podium" && phase.endsAt === null);
  return (
    <div className="absolute inset-x-0 top-0 z-50 flex items-center justify-between px-14 pt-8">
      <div className="flex items-center gap-6">
        <Wordmark size="sm" />
        {round && (
          <motion.div key={round} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass flex items-center gap-3 rounded-full px-5 py-2 text-white">
            <span className="eyebrow text-seven-orange-bright">{ROUND_META[round].subtitle}</span>
            <span className="display-soft text-lg">{ROUND_META[round].title}</span>
            {round === 2 && <span className="rounded-full bg-seven-orange px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider">2× points</span>}
          </motion.div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {phase.kind !== "lobby" && (
          <div className="glass flex items-center gap-3 rounded-full px-5 py-2 text-white">
            <span className="eyebrow opacity-70">Join</span>
            <span className="display-soft text-lg">{joinHost}</span>
            <span className="h-5 w-px bg-white/25" />
            <span className="eyebrow opacity-70">Code</span>
            <span className="numeric display-soft text-xl tracking-[0.18em] text-seven-orange-bright">{state.code}</span>
          </div>
        )}
        <div className="glass flex items-center gap-2 rounded-full px-4 py-2 text-white">
          <Users size={18} className="opacity-80" />
          <span className="numeric display-soft text-lg">{state.audienceCount}</span>
          <span className="eyebrow opacity-70">Audience</span>
        </div>
        <button onClick={onToggleMute} className="glass press flex h-11 w-11 items-center justify-center rounded-full text-white" aria-label={muted ? "Unmute" : "Mute"}>
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        {showSkip && (
          <button onClick={onSkip} className="glass press flex h-11 items-center gap-2 rounded-full px-4 text-white" aria-label="Skip ahead">
            <SkipForward size={18} />
            <span className="eyebrow">Skip</span>
          </button>
        )}
      </div>
    </div>
  );
}
