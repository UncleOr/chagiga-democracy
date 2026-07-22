import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getRoundById, getRoundData, getAdminBids, settleRoundData } from "@/lib/data";

function csvCell(v: string | number | boolean | null | undefined): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const n2 = (n: number) => (Math.round(n * 100) / 100).toString();

export async function GET(request: Request) {
  await requireAdmin();
  const roundId = new URL(request.url).searchParams.get("round");
  if (!roundId) return new NextResponse("missing round", { status: 400 });

  const round = await getRoundById(roundId);
  if (!round) return new NextResponse("round not found", { status: 404 });

  const [data, adminBids] = await Promise.all([getRoundData(roundId), getAdminBids(roundId)]);
  const settlement = data && settleRoundData(data, { onlyPaid: true });
  const resById = new Map((settlement?.results ?? []).map((r) => [String(r.id), r]));

  const header = [
    "כינוי",
    "מייל",
    "הכפלה",
    "בונוס צלפים",
    "עוברת או לא",
    "סכום ששולם",
    "שולם",
    "מוקפא",
    "פסילות",
    "צליפות",
    "מתנדנדות נכונות",
    "קופת מנדטים",
    "הימור זהב",
    "בונוס צלפים ₪",
    "עוברת או לא ₪",
    'סה"כ זכייה',
  ];

  const rows = adminBids.map((b) => {
    const r = resById.get(b.id);
    return [
      b.nickname,
      b.email,
      b.is_double ? "כן" : "",
      b.has_sniper ? "כן" : "",
      b.has_passfail ? "כן" : "",
      n2(b.amount_due),
      b.paid ? "כן" : "",
      b.frozen ? "כן" : "",
      r ? r.totalDelta : "",
      r ? r.snipes : "",
      r ? r.correctPassfail : "",
      r ? n2(r.mandate) : "",
      r ? n2(r.gold) : "",
      r ? n2(r.sniper) : "",
      r ? n2(r.passfail) : "",
      r ? n2(r.total) : "",
    ];
  });

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const bom = "﻿"; // so Excel reads UTF-8 (Hebrew) correctly
  const filename = `chagiga-${round.name.replace(/[^\w֐-׿-]+/g, "_")}.csv`;

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
