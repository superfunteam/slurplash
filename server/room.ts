import type { WebSocket } from "ws";
import {
  BIG_BITE_SLOTS,
  BIG_BITE_VOTES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  NAME_MAX_LENGTH,
  ANSWER_MAX_LENGTH,
  REACTION_COOLDOWN_MS,
  TIMINGS,
} from "../src/shared/constants";
import { AVATAR_IDS, type AvatarId, type ReactionId } from "../src/shared/avatars";
import { BIG_BITE_PROMPTS, HEAD_TO_HEAD_PROMPTS, NO_ANSWER_FALLBACKS } from "../src/shared/prompts";
import type {
  BigBiteAnswer,
  ClientMessage,
  ErrorCode,
  GameStats,
  MatchupResult,
  MeState,
  Phase,
  PlayerStats,
  PublicMatchup,
  PublicPlayer,
  PublicState,
  Role,
  ServerMessage,
  SfxName,
} from "../src/shared/types";
import { bigBitePoints, circularPairs, makeId, scoreMatchup, shuffle, type Ballot } from "./engine";

interface PlayerRecord {
  id: string;
  token: string;
  name: string;
  avatar: AvatarId;
  score: number;
  connected: boolean;
  order: number;
  stats: PlayerStats;
  lobbyEvict: NodeJS.Timeout | null;
}

interface AudienceRecord {
  id: string;
  token: string;
  connected: boolean;
}

interface Conn {
  ws: WebSocket;
  role: Role;
  id: string;
  lastReaction: number;
}

interface MatchupData {
  index: number;
  prompt: string;
  a: string;
  b: string;
  answers: Map<string, string>;
  ballots: Map<string, Ballot>;
  result: MatchupResult | null;
}

interface BigBiteData {
  prompt: string;
  entries: Map<string, string[]>;
  answers: BigBiteAnswer[] | null;
  ballots: Map<string, string[]>;
  results: { pointsByPlayer: Record<string, number>; top: BigBiteAnswer | null } | null;
}

const LOBBY_EVICT_MS = 45_000;

export class Room {
  readonly code: string;
  readonly hostToken = makeId("h_");
  private conns = new Map<WebSocket, Conn>();
  private players = new Map<string, PlayerRecord>();
  private audience = new Map<string, AudienceRecord>();
  private phase: Phase = { kind: "lobby" };
  private matchups: MatchupData[] = [];
  private bigBite: BigBiteData | null = null;
  private previousScores: Record<string, number> = {};
  private stats: GameStats | null = null;
  private gameNumber = 0;
  private usedPrompts = new Set<string>();
  private timer: NodeJS.Timeout | null = null;
  private timerFn: (() => void) | null = null;
  private broadcastQueued = false;
  private orderCounter = 0;
  lastActivity = Date.now();
  onEmpty: (() => void) | null = null;

  constructor(code: string) {
    this.code = code;
  }

  /* ───────────────────────── connections ───────────────────────── */

  get isEmpty(): boolean {
    return this.conns.size === 0;
  }

  private send(ws: WebSocket, msg: ServerMessage) {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  }

  private sfx(name: SfxName) {
    for (const [ws, conn] of this.conns) if (conn.role === "host") this.send(ws, { type: "sfx", name });
  }

  private error(ws: WebSocket, code: ErrorCode, message: string) {
    this.send(ws, { type: "error", code, message });
  }

  attachHost(ws: WebSocket, token: string): boolean {
    if (token !== this.hostToken) return false;
    this.conns.set(ws, { ws, role: "host", id: "host", lastReaction: 0 });
    this.send(ws, { type: "welcome", role: "host", id: "host", token: this.hostToken, code: this.code });
    this.touch();
    this.queueBroadcast();
    return true;
  }

  join(ws: WebSocket, rawName: string, avatar: AvatarId): void {
    const name = rawName.trim().slice(0, NAME_MAX_LENGTH);
    if (!name) return this.error(ws, "invalid", "Pick a nickname first.");
    if (!AVATAR_IDS.includes(avatar)) return this.error(ws, "invalid", "Pick a snack.");

    const gameInProgress = this.phase.kind !== "lobby";
    const seatsFull = this.players.size >= MAX_PLAYERS;

    if (gameInProgress || seatsFull) {
      const id = makeId("a_");
      const rec: AudienceRecord = { id, token: makeId("t_"), connected: true };
      this.audience.set(id, rec);
      this.conns.set(ws, { ws, role: "audience", id, lastReaction: 0 });
      this.send(ws, { type: "welcome", role: "audience", id, token: rec.token, code: this.code });
      this.sfx("pop");
    } else {
      const taken = [...this.players.values()].some((p) => p.name.toLowerCase() === name.toLowerCase());
      if (taken) return this.error(ws, "name-taken", "Someone already grabbed that nickname.");
      const id = makeId("p_");
      const rec: PlayerRecord = {
        id,
        token: makeId("t_"),
        name,
        avatar,
        score: 0,
        connected: true,
        order: this.orderCounter++,
        stats: freshStats(),
        lobbyEvict: null,
      };
      this.players.set(id, rec);
      this.conns.set(ws, { ws, role: "player", id, lastReaction: 0 });
      this.send(ws, { type: "welcome", role: "player", id, token: rec.token, code: this.code });
      this.sfx("chime");
    }
    this.touch();
    this.queueBroadcast();
  }

  rejoin(ws: WebSocket, id: string, token: string): boolean {
    const player = this.players.get(id);
    if (player && player.token === token) {
      player.connected = true;
      if (player.lobbyEvict) {
        clearTimeout(player.lobbyEvict);
        player.lobbyEvict = null;
      }
      this.conns.set(ws, { ws, role: "player", id, lastReaction: 0 });
      this.send(ws, { type: "welcome", role: "player", id, token, code: this.code });
      this.queueBroadcast();
      return true;
    }
    const aud = this.audience.get(id);
    if (aud && aud.token === token) {
      aud.connected = true;
      this.conns.set(ws, { ws, role: "audience", id, lastReaction: 0 });
      this.send(ws, { type: "welcome", role: "audience", id, token, code: this.code });
      this.queueBroadcast();
      return true;
    }
    return false;
  }

  leave(ws: WebSocket): void {
    const conn = this.conns.get(ws);
    if (!conn) return;
    this.conns.delete(ws);
    if (conn.role === "player") {
      const p = this.players.get(conn.id);
      if (p) {
        p.connected = false;
        if (this.phase.kind === "lobby") {
          p.lobbyEvict = setTimeout(() => {
            if (!p.connected && this.phase.kind === "lobby") {
              this.players.delete(p.id);
              this.queueBroadcast();
            }
          }, LOBBY_EVICT_MS);
        }
      }
    } else if (conn.role === "audience") {
      const a = this.audience.get(conn.id);
      if (a) a.connected = false;
    }
    this.queueBroadcast();
    if (this.conns.size === 0) this.onEmpty?.();
  }

  private touch() {
    this.lastActivity = Date.now();
  }

  /* ───────────────────────── message routing ───────────────────────── */

  handle(ws: WebSocket, msg: ClientMessage): void {
    const conn = this.conns.get(ws);
    if (!conn) return;
    this.touch();
    switch (msg.type) {
      case "host:start":
        if (conn.role === "host") this.startGame(ws);
        break;
      case "player:start": {
        const p = this.players.get(conn.id);
        if (p && this.isVip(p)) this.startGame(ws);
        break;
      }
      case "host:skip":
        if (conn.role === "host") this.skip();
        break;
      case "host:playAgain":
        if (conn.role === "host" && this.phase.kind === "podium") this.playAgain();
        break;
      case "host:newGame":
        if (conn.role === "host") this.newGame();
        break;
      case "answer":
        if (conn.role === "player") this.submitAnswer(conn.id, msg.matchupIndex, msg.text);
        break;
      case "bigbite:answer":
        if (conn.role === "player") this.submitBigBite(conn.id, msg.entries);
        break;
      case "vote":
        if (conn.role !== "host") this.vote(conn, msg.matchupIndex, msg.playerId);
        break;
      case "bigbite:vote":
        if (conn.role !== "host") this.bigBiteVote(conn, msg.answerId);
        break;
      case "reaction":
        if (conn.role !== "host") this.reaction(conn, msg.reaction);
        break;
      default:
        break;
    }
  }

  /* ───────────────────────── lobby / game lifecycle ───────────────────────── */

  private isVip(p: PlayerRecord): boolean {
    const first = [...this.players.values()].sort((x, y) => x.order - y.order)[0];
    return first?.id === p.id;
  }

  private startGame(ws: WebSocket) {
    if (this.phase.kind !== "lobby") return;
    if (this.players.size < MIN_PLAYERS) {
      this.error(ws, "not-allowed", `Need at least ${MIN_PLAYERS} players in the hot seat.`);
      return;
    }
    this.gameNumber += 1;
    this.usedPrompts.clear();
    for (const p of this.players.values()) {
      p.score = 0;
      p.stats = freshStats();
      if (p.lobbyEvict) {
        clearTimeout(p.lobbyEvict);
        p.lobbyEvict = null;
      }
    }
    this.stats = null;
    this.bigBite = null;
    this.matchups = [];
    this.sfx("fanfare");
    this.startRound(1);
  }

  private playAgain() {
    // Drop players who bailed, keep the rest, reset to lobby-less fresh game.
    for (const [id, p] of this.players) if (!p.connected) this.players.delete(id);
    if (this.players.size < MIN_PLAYERS) {
      this.newGame();
      return;
    }
    this.phase = { kind: "lobby" };
    this.gameNumber += 1;
    this.usedPrompts.clear();
    for (const p of this.players.values()) {
      p.score = 0;
      p.stats = freshStats();
    }
    this.stats = null;
    this.bigBite = null;
    this.matchups = [];
    this.previousScores = {};
    this.sfx("fanfare");
    this.startRound(1);
  }

  private newGame() {
    this.clearTimer();
    this.phase = { kind: "lobby" };
    this.matchups = [];
    this.bigBite = null;
    this.stats = null;
    this.previousScores = {};
    this.usedPrompts.clear();
    // Everyone leaves the room; their controllers return to the join screen.
    for (const [ws, conn] of this.conns) {
      if (conn.role === "host") continue;
      this.send(ws, { type: "error", code: "room-not-found", message: "The host started a brand new game. Join again!" });
      this.conns.delete(ws);
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    }
    this.players.clear();
    this.audience.clear();
    this.queueBroadcast();
  }

  /* ───────────────────────── rounds ───────────────────────── */

  private pickPrompts(bank: string[], count: number): string[] {
    const fresh = shuffle(bank.filter((p) => !this.usedPrompts.has(p)));
    const picked = fresh.slice(0, count);
    if (picked.length < count) picked.push(...shuffle(bank).slice(0, count - picked.length));
    picked.forEach((p) => this.usedPrompts.add(p));
    return picked;
  }

  private startRound(round: 1 | 2 | 3) {
    this.previousScores = Object.fromEntries([...this.players.values()].map((p) => [p.id, p.score]));
    for (const p of this.players.values()) p.stats = { ...p.stats };

    if (round === 3) {
      const [prompt] = this.pickPrompts(BIG_BITE_PROMPTS, 1);
      this.bigBite = { prompt, entries: new Map(), answers: null, ballots: new Map(), results: null };
      this.matchups = [];
    } else {
      const ids = shuffle([...this.players.keys()]);
      const prompts = this.pickPrompts(HEAD_TO_HEAD_PROMPTS, ids.length);
      this.matchups = circularPairs(ids).map((pair, index) => ({
        index,
        prompt: prompts[index],
        a: pair.a,
        b: pair.b,
        answers: new Map(),
        ballots: new Map(),
        result: null,
      }));
    }

    const introMs = 4_200;
    this.setPhase({ kind: "intro", round, endsAt: Date.now() + introMs });
    this.sfx("whoosh");
    this.schedule(introMs, () => this.startInput(round));
  }

  private startInput(round: 1 | 2 | 3) {
    const ms = TIMINGS.input[round];
    this.setPhase({ kind: "input", round, endsAt: Date.now() + ms });
    this.schedule(ms, () => this.endInput());
  }

  private submitAnswer(playerId: string, matchupIndex: number, raw: string) {
    if (this.phase.kind !== "input" || this.phase.round === 3) return;
    const m = this.matchups[matchupIndex];
    if (!m || (m.a !== playerId && m.b !== playerId)) return;
    const text = raw.trim().slice(0, ANSWER_MAX_LENGTH);
    if (!text) return;
    m.answers.set(playerId, text);
    this.sfx("pop");
    this.queueBroadcast();
    if (this.allAnswersIn()) this.schedule(TIMINGS.inputGrace, () => this.endInput());
  }

  private submitBigBite(playerId: string, entries: string[]) {
    if (this.phase.kind !== "input" || this.phase.round !== 3 || !this.bigBite) return;
    if (!this.players.has(playerId)) return;
    const clean = (Array.isArray(entries) ? entries : [])
      .map((e) => String(e ?? "").trim().slice(0, ANSWER_MAX_LENGTH))
      .filter(Boolean)
      .slice(0, BIG_BITE_SLOTS);
    if (clean.length === 0) return;
    this.bigBite.entries.set(playerId, clean);
    this.sfx("pop");
    this.queueBroadcast();
    if (this.allAnswersIn()) this.schedule(TIMINGS.inputGrace, () => this.endInput());
  }

  private allAnswersIn(): boolean {
    if (this.phase.kind !== "input") return false;
    if (this.phase.round === 3) {
      return [...this.players.values()].every((p) => this.bigBite?.entries.has(p.id));
    }
    return this.matchups.every((m) => m.answers.has(m.a) && m.answers.has(m.b));
  }

  private hasSubmitted(playerId: string): boolean {
    if (this.phase.kind !== "input") return false;
    if (this.phase.round === 3) return !!this.bigBite?.entries.has(playerId);
    const mine = this.matchups.filter((m) => m.a === playerId || m.b === playerId);
    return mine.length > 0 && mine.every((m) => m.answers.has(playerId));
  }

  private endInput() {
    if (this.phase.kind !== "input") return;
    const round = this.phase.round;
    if (round === 3) {
      this.bigBiteReveal();
      return;
    }
    for (const m of this.matchups) {
      for (const pid of [m.a, m.b]) {
        if (!m.answers.has(pid)) m.answers.set(pid, NO_ANSWER_FALLBACKS[Math.floor(Math.random() * NO_ANSWER_FALLBACKS.length)]);
      }
    }
    this.sfx("buzzer");
    this.showMatchup(round, 0);
  }

  /* ───────────────────────── showdown ───────────────────────── */

  private showMatchup(round: 1 | 2, index: number) {
    const count = this.matchups.length;
    if (index >= count) {
      this.standings(round);
      return;
    }
    const base = { kind: "showdown" as const, round, matchupIndex: index, matchupCount: count };
    this.setPhase({ ...base, stage: "prompt", endsAt: Date.now() + TIMINGS.showPrompt });
    this.sfx("whoosh");
    this.schedule(TIMINGS.showPrompt, () => {
      this.setPhase({ ...base, stage: "reveal", endsAt: Date.now() + TIMINGS.reveal });
      this.sfx("splash");
      this.schedule(TIMINGS.reveal, () => {
        this.setPhase({ ...base, stage: "voting", endsAt: Date.now() + TIMINGS.voting });
        this.schedule(TIMINGS.voting, () => this.endVoting());
      });
    });
  }

  private eligibleVoterIds(m: MatchupData): { id: string; isPlayer: boolean }[] {
    const out: { id: string; isPlayer: boolean }[] = [];
    for (const p of this.players.values()) if (p.connected && p.id !== m.a && p.id !== m.b) out.push({ id: p.id, isPlayer: true });
    for (const a of this.audience.values()) if (a.connected) out.push({ id: a.id, isPlayer: false });
    return out;
  }

  private vote(conn: Conn, matchupIndex: number, choice: string) {
    if (this.phase.kind !== "showdown" || this.phase.stage !== "voting") return;
    if (this.phase.matchupIndex !== matchupIndex) return;
    const m = this.matchups[matchupIndex];
    if (!m || (choice !== m.a && choice !== m.b)) return;
    if (conn.role === "player" && (conn.id === m.a || conn.id === m.b)) return;
    m.ballots.set(conn.id, { voterId: conn.id, isPlayer: conn.role === "player", choice });
    this.sfx("pop");
    this.queueBroadcast();
    const eligible = this.eligibleVoterIds(m);
    if (eligible.length > 0 && eligible.every((v) => m.ballots.has(v.id))) {
      this.schedule(TIMINGS.votingGrace, () => this.endVoting());
    }
  }

  private endVoting() {
    if (this.phase.kind !== "showdown") return;
    const { round, matchupIndex } = this.phase;
    const m = this.matchups[matchupIndex];
    if (!m) return;
    const result = scoreMatchup(m.a, m.b, [...m.ballots.values()], round);
    m.result = result;
    for (const pid of [m.a, m.b]) {
      const p = this.players.get(pid);
      if (!p) continue;
      p.score += result.totalPoints[pid];
      if (result.sweep === pid) p.stats.sweeps += 1;
      if (result.audienceFav === pid) p.stats.audienceWins += 1;
      if (result.winner === pid) p.stats.matchupWins += 1;
      const v = result.votes[pid];
      if (p.stats.coldestVotes === null || v < p.stats.coldestVotes) {
        p.stats.coldestVotes = v;
        p.stats.coldestAnswer = m.answers.get(pid) ?? null;
      }
    }
    this.setPhase({ kind: "showdown", round, matchupIndex, matchupCount: this.matchups.length, stage: "results", endsAt: Date.now() + TIMINGS.matchupResults });
    this.sfx(result.sweep ? "cheer" : "tally");
    this.schedule(TIMINGS.matchupResults, () => this.showMatchup(round, matchupIndex + 1));
  }

  private standings(round: 1 | 2) {
    this.setPhase({ kind: "standings", round, endsAt: Date.now() + TIMINGS.standings });
    this.sfx("fanfare");
    this.schedule(TIMINGS.standings, () => this.startRound(round === 1 ? 2 : 3));
  }

  /* ───────────────────────── big bite ───────────────────────── */

  private bigBiteReveal() {
    if (!this.bigBite) return;
    const answers: BigBiteAnswer[] = [];
    for (const p of this.players.values()) {
      const entries = this.bigBite.entries.get(p.id) ?? [];
      const filled = entries.length ? entries : [NO_ANSWER_FALLBACKS[Math.floor(Math.random() * NO_ANSWER_FALLBACKS.length)]];
      for (const text of filled) answers.push({ id: makeId("bb_"), playerId: p.id, text, votes: 0 });
    }
    this.bigBite.answers = shuffle(answers);
    const ms = Math.max(TIMINGS.bigBiteReveal, answers.length * 700 + 2_500);
    this.setPhase({ kind: "bigbite-reveal", endsAt: Date.now() + ms });
    this.sfx("splash");
    this.schedule(ms, () => {
      this.setPhase({ kind: "bigbite-voting", endsAt: Date.now() + TIMINGS.bigBiteVoting });
      this.schedule(TIMINGS.bigBiteVoting, () => this.endBigBiteVoting());
    });
  }

  private bigBiteVote(conn: Conn, answerId: string) {
    if (this.phase.kind !== "bigbite-voting" || !this.bigBite?.answers) return;
    const answer = this.bigBite.answers.find((a) => a.id === answerId);
    if (!answer) return;
    if (conn.role === "player" && answer.playerId === conn.id) return;
    const mine = this.bigBite.ballots.get(conn.id) ?? [];
    const idx = mine.indexOf(answerId);
    if (idx >= 0) mine.splice(idx, 1);
    else if (mine.length < BIG_BITE_VOTES) mine.push(answerId);
    else return;
    this.bigBite.ballots.set(conn.id, mine);
    this.sfx("pop");
    this.queueBroadcast();

    const voters = [...[...this.players.values()].filter((p) => p.connected), ...[...this.audience.values()].filter((a) => a.connected)];
    if (voters.length > 0 && voters.every((v) => (this.bigBite!.ballots.get(v.id)?.length ?? 0) >= BIG_BITE_VOTES)) {
      this.schedule(TIMINGS.votingGrace, () => this.endBigBiteVoting());
    }
  }

  private endBigBiteVoting() {
    if (this.phase.kind !== "bigbite-voting" || !this.bigBite?.answers) return;
    const counts = new Map<string, number>();
    for (const ids of this.bigBite.ballots.values()) for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
    const pointsByPlayer: Record<string, number> = {};
    let top: BigBiteAnswer | null = null;
    for (const a of this.bigBite.answers) {
      a.votes = counts.get(a.id) ?? 0;
      pointsByPlayer[a.playerId] = (pointsByPlayer[a.playerId] ?? 0) + bigBitePoints(a.votes);
      if (!top || a.votes > top.votes) top = a;
      const p = this.players.get(a.playerId);
      if (p && (p.stats.coldestVotes === null || a.votes < p.stats.coldestVotes)) {
        p.stats.coldestVotes = a.votes;
        p.stats.coldestAnswer = a.text;
      }
    }
    for (const [pid, pts] of Object.entries(pointsByPlayer)) {
      const p = this.players.get(pid);
      if (p) p.score += pts;
    }
    this.bigBite.results = { pointsByPlayer, top: top && top.votes > 0 ? top : null };
    this.setPhase({ kind: "bigbite-results", endsAt: Date.now() + TIMINGS.bigBiteResults });
    this.sfx("cheer");
    this.schedule(TIMINGS.bigBiteResults, () => this.podium(0));
  }

  /* ───────────────────────── podium ───────────────────────── */

  private computeStats(): GameStats {
    const players = [...this.players.values()];
    const by = (pick: (p: PlayerRecord) => number, min = 1) => {
      let best: PlayerRecord | null = null;
      for (const p of players) if (pick(p) >= min && (!best || pick(p) > pick(best))) best = p;
      return best;
    };
    const sweeper = by((p) => p.stats.sweeps);
    const darling = by((p) => p.stats.audienceWins);
    let coldest: PlayerRecord | null = null;
    for (const p of players) {
      if (p.stats.coldestVotes === null) continue;
      if (!coldest || p.stats.coldestVotes < (coldest.stats.coldestVotes ?? Infinity)) coldest = p;
    }
    return {
      mostSweeps: sweeper ? { playerId: sweeper.id, count: sweeper.stats.sweeps } : null,
      audienceDarling: darling ? { playerId: darling.id, count: darling.stats.audienceWins } : null,
      coldestAnswer:
        coldest && coldest.stats.coldestAnswer
          ? { playerId: coldest.id, text: coldest.stats.coldestAnswer, votes: coldest.stats.coldestVotes ?? 0 }
          : null,
    };
  }

  private podium(step: number) {
    if (step === 0) this.stats = this.computeStats();
    const last = 4;
    const finalStep = step >= last;
    this.setPhase({ kind: "podium", step, endsAt: finalStep ? null : Date.now() + TIMINGS.podiumStep });
    if (step === 0) this.sfx("drumroll");
    else if (step === 3) this.sfx("cheer");
    else this.sfx("fanfare");
    if (!finalStep) this.schedule(TIMINGS.podiumStep, () => this.podium(step + 1));
    else this.clearTimer();
  }

  /* ───────────────────────── reactions ───────────────────────── */

  private reaction(conn: Conn, reaction: ReactionId) {
    const now = Date.now();
    if (now - conn.lastReaction < REACTION_COOLDOWN_MS) return;
    conn.lastReaction = now;
    for (const [ws, c] of this.conns) if (c.role === "host") this.send(ws, { type: "reaction", reaction, from: conn.id });
  }

  /* ───────────────────────── timers ───────────────────────── */

  private schedule(ms: number, fn: () => void) {
    this.clearTimer();
    this.timerFn = fn;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.timerFn = null;
      fn();
    }, ms);
  }

  private clearTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.timerFn = null;
  }

  /** Host "skip" — fire whatever is scheduled next, right now. */
  private skip() {
    if (this.phase.kind === "lobby") return;
    const fn = this.timerFn;
    if (!fn) return;
    this.clearTimer();
    fn();
  }

  destroy() {
    this.clearTimer();
    for (const p of this.players.values()) if (p.lobbyEvict) clearTimeout(p.lobbyEvict);
    for (const ws of this.conns.keys()) {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    }
    this.conns.clear();
  }

  /* ───────────────────────── snapshots ───────────────────────── */

  private setPhase(phase: Phase) {
    this.phase = phase;
    this.queueBroadcast();
  }

  private queueBroadcast() {
    if (this.broadcastQueued) return;
    this.broadcastQueued = true;
    setImmediate(() => {
      this.broadcastQueued = false;
      this.broadcast();
    });
  }

  private broadcast() {
    const state = this.publicState();
    for (const [ws, conn] of this.conns) this.send(ws, { type: "state", state, me: this.meState(conn) });
  }

  private currentMatchup(): MatchupData | null {
    if (this.phase.kind !== "showdown") return null;
    return this.matchups[this.phase.matchupIndex] ?? null;
  }

  private publicState(): PublicState {
    const players: PublicPlayer[] = [...this.players.values()]
      .sort((a, b) => a.order - b.order)
      .map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        connected: p.connected,
        isVip: this.isVip(p),
        submitted: this.hasSubmitted(p.id),
        stats: p.stats,
      }));

    let matchup: PublicMatchup | null = null;
    const m = this.currentMatchup();
    if (m && this.phase.kind === "showdown") {
      const revealed = this.phase.stage !== "prompt";
      matchup = {
        index: m.index,
        prompt: m.prompt,
        a: m.a,
        b: m.b,
        answers: revealed ? Object.fromEntries(m.answers) : null,
        votesIn: m.ballots.size,
        eligibleVoters: this.eligibleVoterIds(m).length,
        result: m.result,
      };
    }

    let bigBite: PublicState["bigBite"] = null;
    if (this.bigBite) {
      const showAnswers = this.phase.kind === "bigbite-reveal" || this.phase.kind === "bigbite-voting" || this.phase.kind === "bigbite-results" || this.phase.kind === "podium";
      const showVotes = this.phase.kind === "bigbite-results" || this.phase.kind === "podium";
      const voters = [...this.players.values()].filter((p) => p.connected).length + [...this.audience.values()].filter((a) => a.connected).length;
      bigBite = {
        prompt: this.bigBite.prompt,
        answers: showAnswers && this.bigBite.answers ? this.bigBite.answers.map((a) => ({ ...a, votes: showVotes ? a.votes : 0 })) : null,
        votesIn: [...this.bigBite.ballots.values()].filter((v) => v.length >= BIG_BITE_VOTES).length,
        eligibleVoters: voters,
        results: this.bigBite.results,
      };
    }

    return {
      code: this.code,
      phase: this.phase,
      players,
      audienceCount: [...this.audience.values()].filter((a) => a.connected).length,
      hostConnected: [...this.conns.values()].some((c) => c.role === "host"),
      matchup,
      previousScores: this.previousScores,
      bigBite,
      stats: this.stats,
      gameNumber: this.gameNumber,
      serverNow: Date.now(),
    };
  }

  private meState(conn: Conn): MeState {
    const base: MeState = { role: conn.role, id: conn.id, prompts: [], bigBiteEntries: null, voted: false, bigBiteVotes: [], canVote: false };
    if (conn.role === "host") return base;

    const player = conn.role === "player" ? this.players.get(conn.id) : undefined;
    if (player) {
      base.name = player.name;
      base.avatar = player.avatar;
      base.isVip = this.isVip(player);
    }

    if (this.phase.kind === "input" && player) {
      if (this.phase.round === 3) {
        base.prompts = this.bigBite ? [{ matchupIndex: -1, prompt: this.bigBite.prompt, answer: null }] : [];
        base.bigBiteEntries = this.bigBite?.entries.get(player.id) ?? null;
      } else {
        base.prompts = this.matchups
          .filter((m) => m.a === player.id || m.b === player.id)
          .map((m) => ({ matchupIndex: m.index, prompt: m.prompt, answer: m.answers.get(player.id) ?? null }));
      }
    }

    const m = this.currentMatchup();
    if (m && this.phase.kind === "showdown") {
      const inMatchup = player ? m.a === player.id || m.b === player.id : false;
      base.canVote = !inMatchup && this.phase.stage === "voting";
      base.voted = m.ballots.has(conn.id);
    }

    if (this.bigBite && this.phase.kind === "bigbite-voting") {
      base.bigBiteVotes = this.bigBite.ballots.get(conn.id) ?? [];
      base.canVote = true;
    }
    return base;
  }
}

function freshStats(): PlayerStats {
  return { sweeps: 0, audienceWins: 0, matchupWins: 0, coldestVotes: null, coldestAnswer: null };
}
