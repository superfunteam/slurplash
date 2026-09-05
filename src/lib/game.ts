import type { PublicPlayer, PublicState, RoundNumber } from "@/shared/types";

export const ROUND_META: Record<RoundNumber, { title: string; subtitle: string; blurb: string }> = {
  1: { title: "The Snack Run", subtitle: "Round 1", blurb: "Two prompts each. Be funny. Be fast." },
  2: { title: "Big Gulp Stakes", subtitle: "Round 2", blurb: "Double points. Double the regret." },
  3: { title: "The Big Bite", subtitle: "Final Round", blurb: "One prompt. Three answers. 500 a vote." },
};

export function playerById(state: PublicState | null, id: string | null | undefined): PublicPlayer | undefined {
  if (!state || !id) return undefined;
  return state.players.find((p) => p.id === id);
}

export function standings(players: PublicPlayer[]): PublicPlayer[] {
  return players.slice().sort((a, b) => b.score - a.score);
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
