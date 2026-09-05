/** Game tuning — every timing and point value lives here. */

export const MAX_PLAYERS = 8;
export const MIN_PLAYERS = 2;

export const TIMINGS = {
  /** ms */
  input: { 1: 75_000, 2: 75_000, 3: 90_000 } as Record<1 | 2 | 3, number>,
  /** grace after the last answer arrives before we move on */
  inputGrace: 1_800,
  showPrompt: 5_000,
  reveal: 3_200,
  voting: 15_000,
  votingGrace: 1_400,
  matchupResults: 8_000,
  standings: 12_000,
  bigBiteReveal: 7_000,
  bigBiteVoting: 30_000,
  bigBiteResults: 14_000,
  podiumStep: 4_200,
} as const;

export const POINTS = {
  1: { base: 1_000, sweep: 500, audience: 100 },
  2: { base: 2_000, sweep: 1_000, audience: 200 },
  3: { perVote: 500 },
} as const;

export const BIG_BITE_SLOTS = 3;
export const BIG_BITE_VOTES = 3;

export const ANSWER_MAX_LENGTH = 80;
export const NAME_MAX_LENGTH = 14;

/** Reaction spam guard — per socket */
export const REACTION_COOLDOWN_MS = 350;
