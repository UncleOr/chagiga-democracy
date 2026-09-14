import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/config";
import type { Party, Round } from "@/lib/types";
import { settle, type CalcBid, type CalcParty, type CalcConfig, type SettlementResult, amountDue } from "@/lib/calc";

/** Map a stored Round to the engine's CalcConfig (field-name bridge). */
function roundToConfig(r: Round): CalcConfig {
  return {
    base_bet: r.base_bet,
    double_cost: r.double_cost,
    sniper_cost: r.sniper_cost,
    passfail_cost: r.passfail_cost,
    gold_first: r.gold_first_pct,
    gold_second: r.gold_second_pct,
    sniper_first: r.sniper_first_pct,
    sniper_second: r.sniper_second_pct,
  };
}

export interface PublicBid {
  id: string;
  nickname: string;
  is_double: boolean;
  has_sniper: boolean;
  has_passfail: boolean;
  paid: boolean;
  frozen: boolean;
  seats: Record<string, number>;
  passfail: Record<string, boolean>;
}

export interface RoundData {
  round: Round;
  parties: Party[];
  bids: PublicBid[];
}

/** The round to display: the open one, else the most recent non-draft round. */
export async function getActiveRound(): Promise<Round | null> {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("rounds")
    .select("*")
    .neq("status", "draft")
    .order("created_at", { ascending: false });

  const rounds = (data ?? []) as Round[];
  if (rounds.length === 0) return null;

  const open = rounds.find((r) => r.status === "open");
  let round = open ?? rounds[0];

  // Auto-close ("המועד הקובע"): if past closes_at while still open, flip to closed.
  if (round.status === "open" && round.closes_at && new Date(round.closes_at) <= new Date()) {
    const admin = createAdminClient();
    await admin.from("rounds").update({ status: "closed" }).eq("id", round.id);
    round = { ...round, status: "closed" };
  }
  return round;
}

export async function getAllRounds(): Promise<Round[]> {
  if (!supabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("rounds").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Round[];
}

export async function getRoundById(id: string): Promise<Round | null> {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("rounds").select("*").eq("id", id).maybeSingle();
  return (data as Round) ?? null;
}

export async function getParties(roundId: string): Promise<Party[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parties")
    .select("*")
    .eq("round_id", roundId)
    .order("display_order");
  return (data ?? []) as Party[];
}

/** Public bids for a round (no email) plus their predictions, ready for the engine. */
export async function getPublicBids(roundId: string): Promise<PublicBid[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("v_public_bids")
    .select("*")
    .eq("round_id", roundId);
  const bids = (rows ?? []) as Omit<PublicBid, "seats" | "passfail">[];
  if (bids.length === 0) return [];

  const ids = bids.map((b) => b.id);
  const [{ data: seatRows }, { data: pfRows }] = await Promise.all([
    supabase.from("bid_seats").select("bid_id, party_id, seats").in("bid_id", ids),
    supabase.from("bid_passfail").select("bid_id, party_id, predicted_pass").in("bid_id", ids),
  ]);

  const seatsByBid = new Map<string, Record<string, number>>();
  for (const s of seatRows ?? []) {
    const m = seatsByBid.get(s.bid_id) ?? {};
    m[s.party_id] = s.seats;
    seatsByBid.set(s.bid_id, m);
  }
  const pfByBid = new Map<string, Record<string, boolean>>();
  for (const p of pfRows ?? []) {
    const m = pfByBid.get(p.bid_id) ?? {};
    m[p.party_id] = p.predicted_pass;
    pfByBid.set(p.bid_id, m);
  }

  return bids.map((b) => ({
    ...b,
    seats: seatsByBid.get(b.id) ?? {},
    passfail: pfByBid.get(b.id) ?? {},
  }));
}

export interface MyBid {
  id: string;
  nickname: string;
  is_double: boolean;
  has_sniper: boolean;
  has_passfail: boolean;
  amount_due: number;
  payment_claimed: boolean;
  paid: boolean;
  frozen: boolean;
  seats: Record<string, number>;
  passfail: Record<string, boolean>;
}

export async function getMyBid(roundId: string, userId: string): Promise<MyBid | null> {
  const supabase = await createClient();
  const { data: bid } = await supabase
    .from("bids")
    .select("id, nickname, is_double, has_sniper, has_passfail, amount_due, payment_claimed, paid, frozen")
    .eq("round_id", roundId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!bid) return null;

  const [{ data: seatRows }, { data: pfRows }] = await Promise.all([
    supabase.from("bid_seats").select("party_id, seats").eq("bid_id", bid.id),
    supabase.from("bid_passfail").select("party_id, predicted_pass").eq("bid_id", bid.id),
  ]);
  const seats: Record<string, number> = {};
  for (const s of seatRows ?? []) seats[s.party_id] = s.seats;
  const passfail: Record<string, boolean> = {};
  for (const p of pfRows ?? []) passfail[p.party_id] = p.predicted_pass;
  return { ...(bid as Omit<MyBid, "seats" | "passfail">), seats, passfail };
}

export async function getAllProfiles(): Promise<import("@/lib/types").Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });
  return (data ?? []) as import("@/lib/types").Profile[];
}

export interface AdminBid {
  id: string;
  nickname: string;
  email: string;
  amount_due: number;
  is_double: boolean;
  has_sniper: boolean;
  has_passfail: boolean;
  payment_claimed: boolean;
  paid: boolean;
  frozen: boolean;
  created_at: string;
}

/** Full bid rows incl. email — admin only (RLS enforces). */
export async function getAdminBids(roundId: string): Promise<AdminBid[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bids")
    .select(
      "id, nickname, email, amount_due, is_double, has_sniper, has_passfail, payment_claimed, paid, frozen, created_at",
    )
    .eq("round_id", roundId)
    .order("created_at", { ascending: true });
  return (data ?? []) as AdminBid[];
}

export async function getRoundData(roundId: string): Promise<RoundData | null> {
  const round = await getRoundById(roundId);
  if (!round) return null;
  const [parties, bids] = await Promise.all([getParties(roundId), getPublicBids(roundId)]);
  return { round, parties, bids };
}

const toCalcParty = (p: Party): CalcParty => ({
  id: p.id,
  nickname: p.nickname,
  is_swing: p.is_swing,
  actual_seats: p.actual_seats,
  actual_passed: p.actual_passed,
});

const toCalcBid = (b: PublicBid): CalcBid => ({
  id: b.id,
  nickname: b.nickname,
  seats: b.seats,
  passfail: b.passfail,
  is_double: b.is_double,
  has_sniper: b.has_sniper,
  has_passfail: b.has_passfail,
});

/** Whether the round has results (any actual_seats filled). */
export function hasResults(parties: Party[]): boolean {
  return parties.some((p) => p.actual_seats !== null);
}

/**
 * Settlement over the bids that count (paid only). Returns null until results
 * are entered. Used for the final standings + money.
 */
export function settleRoundData(data: RoundData, opts?: { onlyPaid?: boolean }): SettlementResult | null {
  if (!hasResults(data.parties)) return null;
  const onlyPaid = opts?.onlyPaid ?? true;
  const bids = data.bids.filter((b) => (onlyPaid ? b.paid : true));
  return settle(data.parties.map(toCalcParty), bids.map(toCalcBid), roundToConfig(data.round));
}

export interface PollMetrics {
  potTotal: number;
  pollTotal: number; // winnings if results = poll averages (with current bid)
  perfectTotal: number; // winnings if this bid nailed the poll averages exactly
  mostSimilar: string | null;
  mostDifferent: string | null;
}

/**
 * "What-if" projection for one bettor, assuming the election lands on the
 * current news-poll averages. Pool = paid bids plus this bettor (so they always
 * see their own projection). Returns null if the bettor isn't found or no polls.
 */
export function computePollMetrics(data: RoundData, nickname: string): PollMetrics | null {
  const { parties, round } = data;
  if (parties.length === 0) return null;
  const threshold = round.threshold_pct;
  const cfg = roundToConfig(round);

  const pollParties: CalcParty[] = parties.map((p) => ({
    id: p.id,
    nickname: p.nickname,
    is_swing: p.is_swing,
    actual_seats: p.poll_seats ?? 0,
    actual_passed: p.is_swing ? (p.poll_seats ?? 0) >= threshold : null,
  }));

  const pool = data.bids.filter((b) => b.paid || b.nickname === nickname);
  const me = pool.find((b) => b.nickname === nickname);
  if (!me) return null;

  const bids: CalcBid[] = pool.map((b) => ({
    id: b.nickname,
    nickname: b.nickname,
    seats: b.seats,
    passfail: b.passfail,
    is_double: b.is_double,
    has_sniper: b.has_sniper,
    has_passfail: b.has_passfail,
  }));

  const base = settle(pollParties, bids, cfg);
  const potTotal = base.pots.basicTotal + base.pots.sniperPot + base.pots.passfailPot;
  const pollTotal = base.results.find((r) => String(r.id) === nickname)?.total ?? 0;

  const perfectSeats = Object.fromEntries(pollParties.map((p) => [p.id, p.actual_seats]));
  const perfectPf = Object.fromEntries(
    pollParties.filter((p) => p.is_swing).map((p) => [p.id, p.actual_passed]),
  );
  const perfectBids = bids.map((b) =>
    b.id === nickname ? { ...b, seats: perfectSeats, passfail: perfectPf, has_sniper: true, has_passfail: true } : b,
  );
  const perfectTotal =
    settle(pollParties, perfectBids, cfg).results.find((r) => String(r.id) === nickname)?.total ?? 0;

  const avg: Record<string, number> = {};
  for (const p of parties) avg[p.id] = pool.reduce((a, b) => a + (b.seats[p.id] ?? 0), 0) / (pool.length || 1);
  let sim: { p: string; d: number } | null = null;
  let dif: { p: string; d: number } | null = null;
  for (const p of parties) {
    const d = Math.abs((me.seats[p.id] ?? 0) - avg[p.id]);
    if (sim === null || d < sim.d) sim = { p: p.nickname, d };
    if (dif === null || d > dif.d) dif = { p: p.nickname, d };
  }

  return { potTotal, pollTotal, perfectTotal, mostSimilar: sim?.p ?? null, mostDifferent: dif?.p ?? null };
}

/** Current pot sizes from paid bids (shown live, before results). */
export function currentPots(data: RoundData) {
  const paid = data.bids.filter((b) => b.paid);
  const r = data.round;
  const basicTotal = paid.reduce((s, b) => s + (b.is_double ? 2 : 1) * r.base_bet, 0);
  return {
    participants: paid.length,
    mandatePot: basicTotal / 2,
    goldPot: basicTotal / 2,
    sniperPot: paid.reduce((s, b) => s + (b.has_sniper ? r.sniper_cost : 0), 0),
    passfailPot: paid.reduce((s, b) => s + (b.has_passfail ? r.passfail_cost : 0), 0),
    total: paid.reduce((s, b) => s + amountDue(b, r), 0),
  };
}
