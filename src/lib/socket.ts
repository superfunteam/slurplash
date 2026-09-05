"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { ClientMessage, MeState, PublicState, ServerMessage } from "@/shared/types";

export type ConnectionStatus = "connecting" | "open" | "closed";

interface Snapshot {
  status: ConnectionStatus;
  state: PublicState | null;
  me: MeState | null;
  error: { code: string; message: string } | null;
  welcome: Extract<ServerMessage, { type: "welcome" }> | null;
  /** serverNow - Date.now(), so clients can render authoritative countdowns */
  clockOffset: number;
}

type Listener = (msg: ServerMessage) => void;

/**
 * A tiny resilient WebSocket client. One instance per page; reconnects with
 * backoff and replays an "on open" message (attach / rejoin) so a refreshed
 * phone or projector slips right back into the room.
 */
export class GameClient {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private subscribers = new Set<() => void>();
  private snapshot: Snapshot = { status: "connecting", state: null, me: null, error: null, welcome: null, clockOffset: 0 };
  private retry = 0;
  private closedByUser = false;
  private onOpenMessage: (() => ClientMessage | null) | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(onOpenMessage?: () => ClientMessage | null) {
    this.onOpenMessage = onOpenMessage ?? null;
  }

  setOnOpen(fn: () => ClientMessage | null) {
    this.onOpenMessage = fn;
  }

  connect() {
    if (typeof window === "undefined") return;
    this.closedByUser = false;
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    this.ws = ws;
    this.update({ status: "connecting" });

    ws.onopen = () => {
      this.retry = 0;
      this.update({ status: "open", error: null });
      const msg = this.onOpenMessage?.();
      if (msg) this.send(msg);
    };
    ws.onmessage = (ev) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (msg.type === "state") {
        this.update({ state: msg.state, me: msg.me, clockOffset: msg.state.serverNow - Date.now() });
      } else if (msg.type === "welcome") {
        this.update({ welcome: msg, error: null });
      } else if (msg.type === "error") {
        this.update({ error: { code: msg.code, message: msg.message } });
      }
      for (const l of this.listeners) l(msg);
    };
    ws.onclose = () => {
      this.update({ status: "closed" });
      if (this.closedByUser) return;
      const delay = Math.min(8000, 400 * 2 ** this.retry++);
      this.reconnectTimer = setTimeout(() => this.connect(), delay);
    };
    ws.onerror = () => {
      /* onclose follows */
    };
  }

  close() {
    this.closedByUser = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }

  send(msg: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  clearError() {
    this.update({ error: null });
  }

  resetRoom() {
    this.update({ state: null, me: null, welcome: null, error: null });
  }

  private update(patch: Partial<Snapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const s of this.subscribers) s();
  }

  subscribe = (fn: () => void) => {
    this.subscribers.add(fn);
    return () => {
      this.subscribers.delete(fn);
    };
  };

  getSnapshot = () => this.snapshot;
}

const SERVER_SNAPSHOT: Snapshot = { status: "connecting", state: null, me: null, error: null, welcome: null, clockOffset: 0 };

const noopSubscribe = () => () => {};

export function useGameClient(onOpenMessage?: () => ClientMessage | null) {
  const [client] = useState(() => new GameClient(onOpenMessage));

  // Keep the reconnect handshake fresh without re-creating the client.
  useEffect(() => {
    client.setOnOpen(() => onOpenMessage?.() ?? null);
  });

  useEffect(() => {
    client.connect();
    return () => client.close();
  }, [client]);

  const snap = useSyncExternalStore(client.subscribe, client.getSnapshot, () => SERVER_SNAPSHOT);
  const send = useCallback((msg: ClientMessage) => client.send(msg), [client]);
  return { client, send, ...snap };
}

/** True once the component has mounted on the client (safe for localStorage reads). */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/** Seconds remaining until an authoritative server timestamp. */
export function useCountdown(endsAt: number | null | undefined, clockOffset: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [endsAt]);
  if (!endsAt) return 0;
  return Math.max(0, (endsAt - (now + clockOffset)) / 1000);
}
