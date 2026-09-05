"use client";

import { motion } from "motion/react";
import { Crown, Play, Tv } from "lucide-react";
import type { MeState, PublicState } from "@/shared/types";
import { MIN_PLAYERS } from "@/shared/constants";
import { playerById } from "@/lib/game";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

export function PlayerLobby({ state, me, onStart }: { state: PublicState; me: MeState; onStart: () => void }) {
  const p = playerById(state, me.id);
  const canStart = state.players.length >= MIN_PLAYERS;
  const isAudience = me.role === "audience";
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      {p && (
        <motion.div initial={{ scale: 0.4, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}>
          <Avatar id={p.avatar} size={168} ring bounce />
        </motion.div>
      )}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }} className="mt-8">
        <div className="eyebrow text-seven-orange-bright">{isAudience ? "You're in the audience" : "You're in the hot seat"}</div>
        <div className="display mt-2 text-5xl text-white">{isAudience ? "Get ready to vote" : `Hey, ${p?.name ?? "you"}!`}</div>
        <div className="display-soft mt-4 text-lg text-white/70">
          {isAudience ? "Every vote you cast shapes the scoreboard. And you can react to anything." : "Eyes on the big screen. Prompts land here when the game starts."}
        </div>
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }} className="mt-10 flex w-full flex-col items-center gap-4">
        <div className="glass flex items-center gap-3 rounded-full px-5 py-2.5 text-white">
          <Tv size={18} className="text-seven-orange-bright" />
          <span className="display-soft">
            {state.players.length} player{state.players.length === 1 ? "" : "s"} · {state.audienceCount} in the crowd
          </span>
        </div>
        {me.isVip ? (
          <>
            <Button size="xl" block onClick={onStart} disabled={!canStart}>
              <Play size={24} fill="currentColor" /> Start the game
            </Button>
            <div className="flex items-center gap-1.5 text-sm text-white/60">
              <Crown size={14} className="text-seven-orange-bright" /> You’re the VIP. {canStart ? "Everyone’s waiting on you." : `Need ${MIN_PLAYERS - state.players.length} more.`}
            </div>
          </>
        ) : (
          <div className="text-sm text-white/60">Waiting for the VIP to start…</div>
        )}
      </motion.div>
    </div>
  );
}
