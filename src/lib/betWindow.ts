import type { Round } from "@/lib/types";

/** Is the GLOBAL betting window open right now (round open + before closes_at)? */
export function roundBetOpen(round: Round, now: number = Date.now()): boolean {
  if (round.status !== "open") return false;
  if (round.closes_at && new Date(round.closes_at).getTime() <= now) return false;
  return true;
}

/** Does this user have an active PERSONAL extension right now? Never after settlement. */
export function overrideActive(
  round: Round,
  overrideUntil: string | null,
  now: number = Date.now(),
): boolean {
  if (!overrideUntil) return false;
  if (round.status === "settled") return false;
  return new Date(overrideUntil).getTime() > now;
}

/** Final gate: may this user submit/edit a bet now? */
export function canBet(
  round: Round,
  overrideUntil: string | null,
  now: number = Date.now(),
): boolean {
  return roundBetOpen(round, now) || overrideActive(round, overrideUntil, now);
}
