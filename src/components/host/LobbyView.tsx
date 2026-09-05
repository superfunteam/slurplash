"use client";

import { AnimatePresence, motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { Crown, Play, Smartphone, Wifi, WifiOff } from "lucide-react";
import type { PublicState } from "@/shared/types";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/shared/constants";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SnackIcon } from "@/components/icons/SnackIcon";

const spring = { type: "spring", stiffness: 380, damping: 26 } as const;

export function LobbyView({ state, joinUrl, joinHost, onStart }: { state: PublicState; joinUrl: string; joinHost: string; onStart: () => void }) {
  const seats = Array.from({ length: MAX_PLAYERS }, (_, i) => state.players[i] ?? null);
  const canStart = state.players.length >= MIN_PLAYERS;
  return (
    <div className="absolute inset-0 flex items-stretch gap-14 px-14 pb-14 pt-32">
      {/* ── Join panel ── */}
      <motion.div initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={spring} className="card-white relative flex w-[640px] flex-col items-center justify-between overflow-hidden rounded-[2.5rem] p-12 text-center">
        <div className="stripes-h absolute inset-x-0 top-0 h-3" />
        <div>
          <div className="eyebrow text-seven-green">Grab your phone</div>
          <div className="display mt-3 text-[54px] text-seven-green-dark">Join at</div>
          <div className="display-soft mt-1 text-[40px] text-seven-orange">{joinHost}</div>
        </div>
        <div className="relative my-6 rounded-[2rem] bg-white p-5" style={{ boxShadow: "0 0 0 6px #EAF3EF, 0 20px 40px -20px rgba(0,0,0,0.35)" }}>
          <QRCodeSVG value={joinUrl} size={260} level="M" fgColor="#023B2D" bgColor="#ffffff" />
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-seven-green px-4 py-1 text-xs font-extrabold uppercase tracking-[0.2em] text-white">Scan me</div>
        </div>
        <div>
          <div className="eyebrow text-ink-soft">Room code</div>
          <div className="numeric display mt-1 text-[132px] tracking-[0.12em] text-seven-green-dark" style={{ textShadow: "0 6px 0 #EAF3EF" }}>
            {state.code}
          </div>
        </div>
      </motion.div>

      {/* ── Players ── */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-end justify-between">
          <div>
            <div className="eyebrow text-seven-orange-bright">Hot seat</div>
            <div className="display mt-2 text-[64px] text-white">
              {state.players.length === 0 ? "Who's playing?" : `${state.players.length} of ${MAX_PLAYERS} seats filled`}
            </div>
          </div>
          <div className="glass flex items-center gap-3 rounded-full px-6 py-3 text-white">
            <Smartphone size={22} className="text-seven-orange-bright" />
            <span className="display-soft text-xl">Player 9+ joins the audience</span>
          </div>
        </div>

        <div className="mt-10 grid flex-1 grid-cols-4 grid-rows-2 gap-6">
          <AnimatePresence initial={false}>
            {seats.map((p, i) =>
              p ? (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22 }}
                  className="card-white relative flex flex-col items-center justify-center gap-4 rounded-[2rem] p-6"
                >
                  {p.isVip && (
                    <div className="absolute left-5 top-5 flex items-center gap-1 rounded-full bg-seven-orange px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">
                      <Crown size={14} /> VIP
                    </div>
                  )}
                  <div className="absolute right-5 top-5 text-ink-soft/60">{p.connected ? <Wifi size={18} className="text-seven-green" /> : <WifiOff size={18} className="text-seven-red" />}</div>
                  <Avatar id={p.avatar} size={132} bounce dim={!p.connected} />
                  <div className="display-soft max-w-full truncate text-[34px] text-seven-green-dark">{p.name}</div>
                </motion.div>
              ) : (
                <motion.div key={`empty-${i}`} layout className="flex flex-col items-center justify-center gap-3 rounded-[2rem] border-[3px] border-dashed border-white/20 text-white/40">
                  <div className="flex h-[132px] w-[132px] items-center justify-center rounded-full bg-white/5">
                    <SnackIcon id={["slurpee", "donut", "taquito", "bigbite", "coffee", "pizza", "redbull", "nachos"][i] as "slurpee"} size={70} className="opacity-25 grayscale" />
                  </div>
                  <div className="display-soft text-2xl">Open seat</div>
                </motion.div>
              ),
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="text-white/80 display-soft text-2xl">
            {canStart ? (
              <span>
                The <span className="text-seven-orange-bright">VIP</span> can start from their phone, or you can hit it here.
              </span>
            ) : (
              <span>Need at least {MIN_PLAYERS} players to fire up the roller grill.</span>
            )}
          </div>
          <Button size="xl" variant="primary" disabled={!canStart} onClick={onStart}>
            <Play size={26} fill="currentColor" /> Start game
          </Button>
        </div>
      </div>
    </div>
  );
}
