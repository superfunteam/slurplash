"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { AvatarId } from "@/shared/avatars";
import { clearSession, loadSession, saveSession } from "@/lib/session";
import { useCountdown, useGameClient, useHydrated } from "@/lib/socket";
import { haptic } from "@/lib/audio";
import { JoinForm } from "./JoinForm";
import { PlayerChrome } from "./PlayerChrome";
import { PlayerLobby } from "./PlayerLobby";
import { AnswerView } from "./AnswerView";
import { VoteView } from "./VoteView";
import { BigBiteVoteView } from "./BigBiteVoteView";
import { WaitView } from "./WaitView";
import { ReactionBar } from "./ReactionBar";

const noop = () => () => {};

export function PlayScreen() {
  const params = useSearchParams();
  const urlCode = params.get("code") ?? "";
  const hydrated = useHydrated();
  const savedCode = useSyncExternalStore(noop, () => loadSession()?.code ?? "", () => "");
  const [joining, setJoining] = useState(false);

  const { client, send, state, me, error, status, welcome, clockOffset } = useGameClient(() => {
    const s = loadSession();
    // A different code in the URL means the player wants a fresh room.
    if (!s || (urlCode && s.code !== urlCode)) return null;
    return { type: "rejoin", code: s.code, id: s.id, token: s.token };
  });

  // Persist the seat so a refresh drops the player right back in.
  useEffect(() => {
    if (welcome) saveSession({ code: welcome.code, id: welcome.id, token: welcome.token, role: welcome.role });
  }, [welcome]);

  // Room gone / kicked → back to the join form.
  useEffect(() => {
    if (error?.code === "room-not-found" || error?.code === "bad-token") {
      clearSession();
      client.resetRoom();
    }
  }, [error, client]);

  // Reconnect the socket if the tab wakes up from a background sleep.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && status === "closed") client.connect();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [client, status]);

  const endsAt = state && "endsAt" in state.phase ? state.phase.endsAt : null;
  const remaining = useCountdown(endsAt, clockOffset);

  // Little buzz when a new prompt or vote arrives.
  const phaseKey = state ? `${state.phase.kind}-${"stage" in state.phase ? state.phase.stage : ""}` : "";
  useEffect(() => {
    if (phaseKey.startsWith("input") || phaseKey.endsWith("voting")) haptic([20, 40, 20]);
  }, [phaseKey]);

  const joined = !!state && !!me && me.role !== "host";
  const busy = joining && !joined && !error;

  return (
    <div className="play-bg relative flex min-h-dvh flex-col text-white">
      <AnimatePresence mode="wait">
        {!hydrated ? (
          <motion.div key="boot" className="flex-1" />
        ) : !joined ? (
          <JoinForm
            key="join"
            initialCode={urlCode || savedCode}
            error={error?.message ?? null}
            busy={busy}
            onClearError={() => {
              setJoining(false);
              client.clearError();
            }}
            onJoin={(code: string, name: string, avatar: AvatarId) => {
              setJoining(true);
              client.clearError();
              send({ type: "join", code, name, avatar });
            }}
          />
        ) : (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col">
            <PlayerChrome state={state} me={me} connected={status === "open"} />
            <AnimatePresence mode="wait">
              <motion.div key={phaseKey} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16, transition: { duration: 0.15 } }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }} className="flex flex-1 flex-col">
                <Body state={state} me={me} remaining={remaining} send={send} />
              </motion.div>
            </AnimatePresence>
            {showReactions(state, me) && <ReactionBar onReact={(reaction) => send({ type: "reaction", reaction })} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type State = NonNullable<ReturnType<typeof useGameClient>["state"]>;
type Me = NonNullable<ReturnType<typeof useGameClient>["me"]>;

function showReactions(state: State, me: Me): boolean {
  const k = state.phase.kind;
  if (k === "lobby" || k === "input") return me.role === "audience";
  return true;
}

function Body({ state, me, remaining, send }: { state: State; me: Me; remaining: number; send: ReturnType<typeof useGameClient>["send"] }) {
  const phase = state.phase;
  const isPlayer = me.role === "player";
  switch (phase.kind) {
    case "lobby":
      return <PlayerLobby state={state} me={me} onStart={() => send({ type: "player:start" })} />;
    case "input":
      if (isPlayer) {
        return <AnswerView state={state} me={me} remaining={remaining} onAnswer={(matchupIndex, text) => send({ type: "answer", matchupIndex, text })} onBigBite={(entries) => send({ type: "bigbite:answer", entries })} />;
      }
      return <WaitView state={state} me={me} />;
    case "showdown":
      return <VoteView state={state} me={me} remaining={remaining} onVote={(matchupIndex, playerId) => send({ type: "vote", matchupIndex, playerId })} />;
    case "bigbite-voting":
      return <BigBiteVoteView state={state} me={me} remaining={remaining} onVote={(answerId) => send({ type: "bigbite:vote", answerId })} />;
    default:
      return <WaitView state={state} me={me} />;
  }
}
