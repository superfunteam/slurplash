"use client";

import { motion } from "motion/react";
import { Crown, WifiOff } from "lucide-react";
import type { MeState, PublicState } from "@/shared/types";
import { playerById } from "@/lib/game";
import { Avatar } from "@/components/ui/Avatar";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { SevenElevenLogo } from "@/components/brand/SevenElevenLogo";

export function PlayerChrome({ state, me, connected }: { state: PublicState; me: MeState; connected: boolean }) {
  const p = playerById(state, me.id);
  return (
    <div className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-2.5">
        <SevenElevenLogo size={34} />
        <div className="leading-tight">
          <div className="display text-lg text-white">Slurplash</div>
          <div className="eyebrow text-white/50" style={{ fontSize: 9 }}>Room {state.code}</div>
        </div>
      </div>
      {me.role === "player" && p ? (
        <div className="glass flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-white">
          <Avatar id={p.avatar} size={36} />
          <div className="leading-tight">
            <div className="display-soft flex items-center gap-1 text-sm">
              {p.name}
              {p.isVip && <Crown size={12} className="text-seven-orange-bright" />}
            </div>
            <div className="numeric text-xs text-seven-orange-bright">
              <AnimatedNumber value={p.score} /> pts
            </div>
          </div>
        </div>
      ) : (
        <div className="glass rounded-full px-4 py-2 text-white display-soft text-sm">Audience</div>
      )}
      {!connected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute left-1/2 top-[max(1rem,env(safe-area-inset-top))] -translate-x-1/2 rounded-full bg-seven-red px-3 py-1 text-xs font-bold text-white">
          <WifiOff size={12} className="mr-1 inline" /> reconnecting
        </motion.div>
      )}
    </div>
  );
}
