import { describe, it, expect } from "vitest";
import fixture from "./fixtures/fixture-2022-snapshot17.json";
import { settle, amountDue, type CalcBid, type CalcParty, type CalcConfig } from "@/lib/calc";

// The workbook was last recalculated at a 17-bid snapshot; fixture-2022-snapshot17.json
// is exactly that subset, with cached expected mandate/gold/sniper/passfail per person.

const parties: CalcParty[] = fixture.parties.map((p: any) => ({
  id: p.id,
  nickname: p.nickname,
  is_swing: p.is_swing,
  actual_seats: p.actual_seats,
  actual_passed: p.actual_passed,
}));

const bids: CalcBid[] = fixture.bids.map((b: any, i: number) => ({
  id: i,
  nickname: b.nickname,
  seats: b.seats,
  passfail: b.passfail,
  is_double: b.is_double,
  has_sniper: b.has_sniper,
  has_passfail: b.has_passfail,
}));

const c = fixture.constants as CalcConfig;

describe("settle() reproduces the 2022 workbook exactly", () => {
  const { pots, results } = settle(parties, bids, c);
  const byNick = new Map(results.map((r) => [r.nickname, r]));

  it("computes the correct pots", () => {
    expect(pots.basicTotal).toBe(900);
    expect(pots.mandatePot).toBe(450);
    expect(pots.goldPot).toBe(450);
    expect(pots.sniperPot).toBe(140);
    expect(pots.passfailPot).toBe(180);
    expect(pots.numParties).toBe(17);
  });

  it("matches every cached per-person value (mandate/gold/sniper/passfail)", () => {
    let checked = 0;
    for (const e of fixture.expected as any[]) {
      const r = byNick.get(e.nickname);
      expect(r, `missing result for ${e.nickname}`).toBeTruthy();
      for (const k of ["mandate", "gold", "sniper", "passfail"] as const) {
        if (e[k] == null) continue;
        checked++;
        expect(r![k], `${e.nickname}.${k}`).toBeCloseTo(e[k], 4);
      }
    }
    expect(checked).toBeGreaterThan(60);
  });

  it("distributes the full collected pot (no money lost to rounding)", () => {
    const { totalDistributed } = settle(parties, bids, c);
    // mandate+gold = basicTotal, sniper + passfail pots fully paid out
    expect(totalDistributed).toBeCloseTo(900 + 140 + 180, 6);
  });
});

describe("amountDue", () => {
  it("sums add-ons correctly", () => {
    expect(amountDue({ is_double: false, has_sniper: false, has_passfail: false }, c)).toBe(50);
    expect(amountDue({ is_double: true, has_sniper: true, has_passfail: true }, c)).toBe(150);
  });
});
