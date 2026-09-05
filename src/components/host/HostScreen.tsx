"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import type { ReactionId } from "@/shared/avatars";
import type { ServerMessage } from "@/shared/types";
import { useCountdown, useGameClient } from "@/lib/socket";
import { sfx } from "@/lib/audio";
import { loadHostToken, saveHostToken } from "@/lib/session";
import { Stage } from "@/components/ui/Stage";
import { FloatingReactions } from "@/components/ui/FloatingReactions";
import { Wordmark } from "@/components/brand/Wordmark";
import { HostChrome } from "./HostChrome";
import { LobbyView } from "./LobbyView";
import { IntroView } from "./IntroView";
import { InputView } from "./InputView";
import { ShowdownView } from "./ShowdownView";
import { StandingsView } from "./StandingsView";
import { BigBiteView } from "./BigBiteView";
import { PodiumView } from "./PodiumView";

export function HostScreen({ code }: { code: string | null }) {
  const router = useRouter();
  const [muted, setMuted] = useState(false);
  const [soundReady, setSoundReady] = useState(false);
  const reactionListeners = useRef(new Set<(r: ReactionId) => void>());

  const { client, send, state, error, status, clockOffset, welcome } = useGameClient(() => {
    if (!code) return { type: "host:create" };
    const token = loadHostToken(code);
    return token ? { type: "host:attach", code, hostToken: token } : null;
  });

  // First-time create → persist token and move to the room URL.
  useEffect(() => {
    if (!welcome || welcome.role !== "host") return;
    saveHostToken(welcome.code, welcome.token);
    if (!code) router.replace(`/host/${welcome.code}`);
  }, [welcome, code, router]);

  // Server-driven cues & reactions.
  useEffect(
    () =>
      client.on((msg: ServerMessage) => {
        if (msg.type === "sfx") sfx.play(msg.name);
        if (msg.type === "reaction") for (const l of reactionListeners.current) l(msg.reaction);
      }),
    [client],
  );

  // Unlock audio on first gesture anywhere on the page.
  useEffect(() => {
    const unlock = () => {
      sfx.unlock();
      setSoundReady(true);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Local ticking in the final five seconds of any countdown.
  const endsAt = state && "endsAt" in state.phase ? state.phase.endsAt : null;
  const remaining = useCountdown(endsAt, clockOffset);
  const lastTick = useRef(-1);
  useEffect(() => {
    const s = Math.ceil(remaining);
    if (s <= 5 && s > 0 && s !== lastTick.current && endsAt) {
      lastTick.current = s;
      sfx.play("tick");
    }
    if (s > 5) lastTick.current = -1;
  }, [remaining, endsAt]);

  const subscribeReactions = useCallback((fn: (r: ReactionId) => void) => {
    reactionListeners.current.add(fn);
    return () => {
      reactionListeners.current.delete(fn);
    };
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const joinHost = origin.replace(/^https?:\/\//, "");
  const joinUrl = state ? `${origin}/play?code=${state.code}` : origin;

  if (error && (error.code === "room-not-found" || error.code === "bad-token")) {
    return (
      <Stage>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 text-center text-white">
          <Wordmark size="lg" />
          <div className="display text-6xl">{error.message}</div>
          <button onClick={() => router.replace("/host")} className="press display-soft rounded-3xl bg-seven-orange px-10 py-5 text-3xl text-white shadow-[0_8px_0_0_#B8560C]">
            Create a new room
          </button>
        </div>
      </Stage>
    );
  }

  if (!state) {
    return (
      <Stage>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-white">
          <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}>
            <Wordmark size="xl" />
          </motion.div>
          <div className="display-soft text-3xl text-white/70">{status === "open" ? "Opening the store…" : "Connecting…"}</div>
        </div>
      </Stage>
    );
  }

  const phase = state.phase;
  const key = phase.kind === "showdown" ? `showdown-${phase.round}-${phase.matchupIndex}` : phase.kind.startsWith("bigbite") ? "bigbite" : `${phase.kind}-${"round" in phase ? phase.round : ""}`;

  return (
    <Stage className="grain">
      <div className="dot-grid absolute inset-0 opacity-40" />
      <HostChrome
        state={state}
        muted={muted}
        onToggleMute={() => {
          sfx.unlock();
          sfx.setMuted(!muted);
          setMuted(!muted);
        }}
        onSkip={() => send({ type: "host:skip" })}
        joinHost={joinHost}
      />

      <AnimatePresence mode="wait">
        <motion.div key={key} className="absolute inset-0" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02, transition: { duration: 0.25 } }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
          {phase.kind === "lobby" && <LobbyView state={state} joinUrl={joinUrl} joinHost={joinHost} onStart={() => send({ type: "host:start" })} />}
          {phase.kind === "intro" && <IntroView round={phase.round} />}
          {phase.kind === "input" && <InputView state={state} remaining={remaining} />}
          {phase.kind === "showdown" && <ShowdownView state={state} remaining={remaining} />}
          {phase.kind === "standings" && <StandingsView state={state} />}
          {(phase.kind === "bigbite-reveal" || phase.kind === "bigbite-voting" || phase.kind === "bigbite-results") && <BigBiteView state={state} remaining={remaining} />}
          {phase.kind === "podium" && <PodiumView state={state} onPlayAgain={() => send({ type: "host:playAgain" })} onNewGame={() => send({ type: "host:newGame" })} />}
        </motion.div>
      </AnimatePresence>

      <FloatingReactions subscribe={subscribeReactions} />

      <AnimatePresence>
        {!soundReady && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="glass absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full px-6 py-3 text-white">
            <Volume2 size={20} className="text-seven-orange-bright" />
            <span className="display-soft text-lg">Click anywhere to turn on the store chime</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {status !== "open" && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} className="absolute left-1/2 top-28 z-50 -translate-x-1/2 rounded-full bg-seven-red px-6 py-2 text-white display-soft">
            Reconnecting to the store…
          </motion.div>
        )}
      </AnimatePresence>
    </Stage>
  );
}
