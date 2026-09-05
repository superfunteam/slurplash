import { POINTS } from "../src/shared/constants";
import type { MatchupResult } from "../src/shared/types";

/** Fisher–Yates, non-mutating. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Circular bipartite pairing.
 * For N players, prompt i is answered by player i and player (i+1) mod N.
 * Every player gets exactly 2 prompts and faces two different neighbours.
 * With N = 2 both players share both prompts (two sequential battles).
 */
export function circularPairs(playerIds: string[]): Array<{ a: string; b: string }> {
  const n = playerIds.length;
  return playerIds.map((id, i) => ({ a: id, b: playerIds[(i + 1) % n] }));
}

export function randomCode(taken: (code: string) => boolean): string {
  // 4-digit numeric PIN; occasionally lean into 7-Eleven numbers for flavour.
  const flavour = ["7110", "7111", "7117", "1171", "7711", "7171"];
  for (let i = 0; i < 200; i++) {
    const pick =
      Math.random() < 0.08
        ? flavour[Math.floor(Math.random() * flavour.length)]
        : String(1000 + Math.floor(Math.random() * 9000));
    if (!taken(pick)) return pick;
  }
  throw new Error("No free room codes");
}

export interface Ballot {
  voterId: string;
  isPlayer: boolean; // active player vs audience
  choice: string; // playerId
}

/**
 * Head-to-head scoring.
 * - Base points split proportionally across all votes (players + audience).
 * - Clean sweep: 100% of active-player votes (with at least one cast) → sweep bonus.
 * - Audience favourite: strict winner of the audience vote → audience bonus.
 * - No votes at all: base points split evenly, no bonuses.
 */
export function scoreMatchup(a: string, b: string, ballots: Ballot[], round: 1 | 2): MatchupResult {
  const pts = POINTS[round];
  const votes: Record<string, number> = { [a]: 0, [b]: 0 };
  const playerVotes: Record<string, number> = { [a]: 0, [b]: 0 };
  const audienceVotes: Record<string, number> = { [a]: 0, [b]: 0 };

  for (const ballot of ballots) {
    if (ballot.choice !== a && ballot.choice !== b) continue;
    votes[ballot.choice] += 1;
    if (ballot.isPlayer) playerVotes[ballot.choice] += 1;
    else audienceVotes[ballot.choice] += 1;
  }

  const total = votes[a] + votes[b];
  const pct: Record<string, number> = total === 0 ? { [a]: 0.5, [b]: 0.5 } : { [a]: votes[a] / total, [b]: votes[b] / total };

  const basePoints: Record<string, number> = {
    [a]: Math.round(pts.base * pct[a]),
    [b]: Math.round(pts.base * pct[b]),
  };

  const totalPlayerVotes = playerVotes[a] + playerVotes[b];
  let sweep: string | null = null;
  if (totalPlayerVotes > 0) {
    if (playerVotes[a] === totalPlayerVotes) sweep = a;
    else if (playerVotes[b] === totalPlayerVotes) sweep = b;
  }

  let audienceFav: string | null = null;
  if (audienceVotes[a] > audienceVotes[b]) audienceFav = a;
  else if (audienceVotes[b] > audienceVotes[a]) audienceFav = b;

  const totalPoints: Record<string, number> = { [a]: basePoints[a], [b]: basePoints[b] };
  if (sweep) totalPoints[sweep] += pts.sweep;
  if (audienceFav) totalPoints[audienceFav] += pts.audience;

  let winner: string | null = null;
  if (votes[a] > votes[b]) winner = a;
  else if (votes[b] > votes[a]) winner = b;

  return { votes, playerVotes, audienceVotes, pct, basePoints, sweep, audienceFav, totalPoints, winner };
}

export function bigBitePoints(votes: number): number {
  return votes * POINTS[3].perVote;
}

export function makeId(prefix = ""): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = prefix;
  for (let i = 0; i < 10; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}
