import type { AvatarId, ReactionId } from "./avatars";

export type RoundNumber = 1 | 2 | 3;

/* ────────────────────────── Public snapshot ────────────────────────── */

export interface PublicPlayer {
  id: string;
  name: string;
  avatar: AvatarId;
  score: number;
  connected: boolean;
  isVip: boolean;
  /** true while the player has finished the current input phase */
  submitted: boolean;
  stats: PlayerStats;
}

export interface PlayerStats {
  sweeps: number;
  audienceWins: number;
  matchupWins: number;
  /** fewest votes ever received on a single answer */
  coldestVotes: number | null;
  coldestAnswer: string | null;
}

export type ShowdownStage = "prompt" | "reveal" | "voting" | "results";

export interface MatchupResult {
  votes: Record<string, number>; // playerId -> total votes
  playerVotes: Record<string, number>; // votes from active players only
  audienceVotes: Record<string, number>;
  pct: Record<string, number>; // 0..1
  basePoints: Record<string, number>;
  sweep: string | null; // playerId that swept the active-player vote
  audienceFav: string | null; // playerId that won the audience
  totalPoints: Record<string, number>;
  winner: string | null; // null on tie
}

export interface PublicMatchup {
  index: number;
  prompt: string;
  a: string; // playerId
  b: string; // playerId
  /** answers are only populated once stage >= reveal */
  answers: Record<string, string> | null;
  votesIn: number;
  eligibleVoters: number;
  result: MatchupResult | null;
}

export interface BigBiteAnswer {
  id: string;
  playerId: string;
  text: string;
  votes: number;
}

export interface PublicBigBite {
  prompt: string;
  answers: BigBiteAnswer[] | null; // null until reveal
  votesIn: number;
  eligibleVoters: number;
  results: { pointsByPlayer: Record<string, number>; top: BigBiteAnswer | null } | null;
}

export type Phase =
  | { kind: "lobby" }
  | { kind: "intro"; round: RoundNumber; endsAt: number }
  | { kind: "input"; round: RoundNumber; endsAt: number }
  | {
      kind: "showdown";
      round: 1 | 2;
      matchupIndex: number;
      matchupCount: number;
      stage: ShowdownStage;
      endsAt: number | null;
    }
  | { kind: "standings"; round: 1 | 2; endsAt: number }
  | { kind: "bigbite-reveal"; endsAt: number }
  | { kind: "bigbite-voting"; endsAt: number }
  | { kind: "bigbite-results"; endsAt: number }
  | { kind: "podium"; step: number; endsAt: number | null };

export interface GameStats {
  mostSweeps: { playerId: string; count: number } | null;
  audienceDarling: { playerId: string; count: number } | null;
  coldestAnswer: { playerId: string; text: string; votes: number } | null;
}

export interface PublicState {
  code: string;
  phase: Phase;
  players: PublicPlayer[];
  audienceCount: number;
  hostConnected: boolean;
  matchup: PublicMatchup | null;
  /** previous score before the current round's tally, for animating deltas */
  previousScores: Record<string, number>;
  bigBite: PublicBigBite | null;
  stats: GameStats | null;
  gameNumber: number;
  serverNow: number;
}

/* ────────────────────────── Private (per-client) ────────────────────────── */

export type Role = "host" | "player" | "audience";

export interface PrivatePrompt {
  matchupIndex: number;
  prompt: string;
  answer: string | null;
}

export interface MeState {
  role: Role;
  id: string;
  name?: string;
  avatar?: AvatarId;
  isVip?: boolean;
  /** prompts to answer this input phase (1 or 2 for head-to-head, 1 for big bite) */
  prompts: PrivatePrompt[];
  bigBiteEntries: string[] | null;
  /** whether this client already voted in the current matchup */
  voted: boolean;
  /** big bite answer ids already voted for */
  bigBiteVotes: string[];
  /** can vote in the current matchup */
  canVote: boolean;
}

/* ────────────────────────── Messages ────────────────────────── */

export type ClientMessage =
  | { type: "host:create" }
  | { type: "host:attach"; code: string; hostToken: string }
  | { type: "host:start" }
  | { type: "host:skip" }
  | { type: "host:playAgain" }
  | { type: "host:newGame" }
  | { type: "join"; code: string; name: string; avatar: AvatarId }
  | { type: "rejoin"; code: string; id: string; token: string }
  | { type: "player:start" }
  | { type: "answer"; matchupIndex: number; text: string }
  | { type: "bigbite:answer"; entries: string[] }
  | { type: "vote"; matchupIndex: number; playerId: string }
  | { type: "bigbite:vote"; answerId: string }
  | { type: "reaction"; reaction: ReactionId }
  | { type: "ping" };

export type ServerMessage =
  | { type: "welcome"; role: Role; id: string; token: string; code: string }
  | { type: "state"; state: PublicState; me: MeState }
  | { type: "reaction"; reaction: ReactionId; from: string }
  | { type: "sfx"; name: SfxName }
  | { type: "error"; code: ErrorCode; message: string }
  | { type: "pong"; now: number };

export type SfxName =
  | "chime"
  | "tick"
  | "buzzer"
  | "whoosh"
  | "splash"
  | "fanfare"
  | "cheer"
  | "tally"
  | "pop"
  | "drumroll";

export type ErrorCode =
  | "room-not-found"
  | "bad-token"
  | "name-taken"
  | "invalid"
  | "not-allowed"
  | "game-in-progress";
