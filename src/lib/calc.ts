/**
 * Scoring engine for "חגיגה של דמוקרטיה".
 *
 * This is a faithful port of the Google-Sheets/Excel workbook and is verified
 * against the 2022 round in test/calc.test.ts (maxErr = 0 across 68 values).
 * See docs/regulation.md for the rules each block implements.
 *
 * The engine is pure and DB-agnostic: feed it plain party/bid objects.
 */

export interface CalcParty {
  id: string | number;
  nickname: string;
  is_swing: boolean;
  actual_seats: number | null;
  actual_passed: boolean | null;
}

export interface CalcBid {
  id: string | number;
  nickname: string;
  /** partyId -> predicted seats (missing/null = 0) */
  seats: Record<string | number, number | null>;
  /** swing partyId -> predicted pass (missing/null = not answered) */
  passfail: Record<string | number, boolean | null>;
  is_double: boolean;
  has_sniper: boolean;
  has_passfail: boolean;
}

export interface CalcConfig {
  base_bet: number;
  double_cost: number;
  sniper_cost: number;
  passfail_cost: number;
  gold_first: number;
  gold_second: number;
  sniper_first: number;
  sniper_second: number;
}

export interface BidResult {
  id: string | number;
  nickname: string;
  mandate: number;
  gold: number;
  sniper: number;
  passfail: number;
  total: number;
  /** diagnostics */
  totalDelta: number; // "פסילות"
  snipes: number; // exact hits (only counts if has_sniper)
  correctPassfail: number;
}

export interface Pots {
  basicTotal: number;
  mandatePot: number;
  goldPot: number;
  sniperPot: number;
  passfailPot: number;
  perParty: number;
  numParties: number;
}

export interface SettlementResult {
  pots: Pots;
  results: BidResult[];
  /** money collected vs distributed — remainder is at organizers' discretion (rule 1.7) */
  totalCollected: number;
  totalDistributed: number;
  remainder: number;
}

const mult = (b: CalcBid) => (b.is_double ? 2 : 1);

type CostConfig = Pick<CalcConfig, "base_bet" | "double_cost" | "sniper_cost" | "passfail_cost">;

/** Amount a single bid owes, per the add-ons chosen. */
export function amountDue(
  b: Pick<CalcBid, "is_double" | "has_sniper" | "has_passfail">,
  c: CostConfig,
): number {
  return (
    c.base_bet +
    (b.is_double ? c.double_cost : 0) +
    (b.has_sniper ? c.sniper_cost : 0) +
    (b.has_passfail ? c.passfail_cost : 0)
  );
}

/**
 * Settle a round. Pass only the bids that should count (i.e. paid/active).
 * Parties without a result (actual_seats === null) are treated as 0 seats,
 * matching the workbook; only settle once results are entered.
 */
export function settle(parties: CalcParty[], bids: CalcBid[], c: CalcConfig): SettlementResult {
  const numParties = parties.length;
  const swing = parties.filter((p) => p.is_swing);

  // ── Pots ────────────────────────────────────────────────────────────────
  const basicTotal = bids.reduce((s, b) => s + mult(b) * c.base_bet, 0);
  const mandatePot = basicTotal / 2;
  const goldPot = basicTotal / 2;
  const sniperPot = bids.reduce((s, b) => s + (b.has_sniper ? c.sniper_cost : 0), 0);
  const passfailPot = bids.reduce((s, b) => s + (b.has_passfail ? c.passfail_cost : 0), 0);
  const perParty = numParties ? mandatePot / numParties : 0;

  const seat = (b: CalcBid, id: CalcParty["id"]) => {
    const v = b.seats[id];
    return v == null ? 0 : v;
  };
  const deltaFor = (b: CalcBid, p: CalcParty) => Math.abs(seat(b, p.id) - (p.actual_seats ?? 0));
  const totalDelta = (b: CalcBid) => parties.reduce((s, p) => s + deltaFor(b, p), 0);
  const snipesOf = (b: CalcBid) =>
    b.has_sniper ? parties.reduce((s, p) => s + (deltaFor(b, p) === 0 ? 1 : 0), 0) : 0;

  const R = new Map<CalcBid["id"], BidResult>();
  for (const b of bids)
    R.set(b.id, {
      id: b.id,
      nickname: b.nickname,
      mandate: 0,
      gold: 0,
      sniper: 0,
      passfail: 0,
      total: 0,
      totalDelta: totalDelta(b),
      snipes: snipesOf(b),
      correctPassfail: 0,
    });

  // ── 1) Mandate pot — per party, closest guess wins (rule 3.1.6) ───────────
  for (const p of parties) {
    const minDelta = Math.min(...bids.map((b) => deltaFor(b, p)));
    const winners = bids.filter((b) => deltaFor(b, p) === minDelta);
    const denom = winners.reduce((s, b) => s + mult(b), 0);
    if (denom > 0)
      for (const b of winners) R.get(b.id)!.mandate += (perParty * mult(b)) / denom;
  }

  // ── 2) Gold — by total delta; 1st 75% / 2nd 25%, no-2nd → 1st 100% (3.1.7) ─
  const td = bids.map((b) => ({ b, d: totalDelta(b) }));
  const firstD = Math.min(...td.map((x) => x.d));
  const secondCandidates = td.filter((x) => x.d > firstD).map((x) => x.d);
  const secondD = secondCandidates.length ? Math.min(...secondCandidates) : null;
  const gFirst = td.filter((x) => x.d === firstD).map((x) => x.b);
  const gSecond = secondD === null ? [] : td.filter((x) => x.d === secondD).map((x) => x.b);
  let goldFirstPot = goldPot * c.gold_first;
  let goldSecondPot = goldPot * c.gold_second;
  if (gSecond.length === 0) {
    goldFirstPot = goldPot;
    goldSecondPot = 0;
  }
  const gd1 = gFirst.reduce((s, b) => s + mult(b), 0);
  if (gd1 > 0) for (const b of gFirst) R.get(b.id)!.gold += (goldFirstPot * mult(b)) / gd1;
  const gd2 = gSecond.reduce((s, b) => s + mult(b), 0);
  if (gd2 > 0) for (const b of gSecond) R.get(b.id)!.gold += (goldSecondPot * mult(b)) / gd2;

  // ── 3) Sniper — buyers only, exact hits; count-based (rule 3.3) ───────────
  const snipers = bids.filter((b) => b.has_sniper).map((b) => ({ b, n: snipesOf(b) })).filter((x) => x.n > 0);
  if (snipers.length) {
    const firstN = Math.max(...snipers.map((x) => x.n));
    const lower = snipers.filter((x) => x.n < firstN).map((x) => x.n);
    const secondN = lower.length ? Math.max(...lower) : null;
    const sFirst = snipers.filter((x) => x.n === firstN).map((x) => x.b);
    const sSecond = secondN === null ? [] : snipers.filter((x) => x.n === secondN).map((x) => x.b);
    let p1 = sniperPot * c.sniper_first;
    let p2 = sniperPot * c.sniper_second;
    if (sSecond.length === 0) {
      p1 = sniperPot; // rule 3.3.6
      p2 = 0;
    }
    for (const b of sFirst) R.get(b.id)!.sniper += p1 / sFirst.length;
    for (const b of sSecond) R.get(b.id)!.sniper += p2 / sSecond.length;
  }

  // ── 4) Pass-or-not — per live swing party, split among correct (rule 3.4) ─
  const buyers = bids.filter((b) => b.has_passfail);
  const isCorrect = (b: CalcBid, p: CalcParty) =>
    b.passfail[p.id] != null && b.passfail[p.id] === p.actual_passed;
  const liveParties = swing.filter((p) => buyers.some((b) => isCorrect(b, p)));
  const perSwing = liveParties.length ? passfailPot / liveParties.length : 0;
  for (const p of liveParties) {
    const correct = buyers.filter((b) => isCorrect(b, p));
    for (const b of correct) R.get(b.id)!.passfail += perSwing / correct.length;
  }
  for (const b of buyers) {
    const r = R.get(b.id)!;
    r.correctPassfail = swing.filter((p) => isCorrect(b, p)).length;
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  const results = [...R.values()].map((r) => ({
    ...r,
    total: r.mandate + r.gold + r.sniper + r.passfail,
  }));

  const totalCollected = bids.reduce(
    (s, b) => s + amountDue(b, c),
    0,
  );
  const totalDistributed = results.reduce((s, r) => s + r.total, 0);

  results.sort((a, b) => b.total - a.total);

  return {
    pots: { basicTotal, mandatePot, goldPot, sniperPot, passfailPot, perParty, numParties },
    results,
    totalCollected,
    totalDistributed,
    remainder: totalCollected - totalDistributed,
  };
}

/** Live "פסילות" (total delta) for a bid — usable before settlement for the standings preview. */
export function bidTotalDelta(parties: CalcParty[], b: CalcBid): number {
  return parties.reduce((s, p) => s + Math.abs((b.seats[p.id] ?? 0) - (p.actual_seats ?? 0)), 0);
}
