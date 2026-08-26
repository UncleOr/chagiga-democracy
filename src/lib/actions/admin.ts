"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RoundStatus } from "@/lib/types";

function refreshAll() {
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  revalidatePath("/me");
}

// ── Rounds ──────────────────────────────────────────────────────────────────
export async function createRound(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim() || "סבב חדש";
  const admin = createAdminClient();
  const { data } = await admin.from("rounds").insert({ name, status: "draft" }).select("id").single();
  refreshAll();
  if (data) redirect(`/admin?round=${data.id}`);
}

export async function updateRound(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const num = (k: string, d: number) => {
    const v = Number(formData.get(k));
    return Number.isFinite(v) ? v : d;
  };
  const closesRaw = String(formData.get("closes_at") ?? "").trim();
  const admin = createAdminClient();
  await admin
    .from("rounds")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      threshold_pct: num("threshold_pct", 4),
      base_bet: num("base_bet", 50),
      double_cost: num("double_cost", 50),
      sniper_cost: num("sniper_cost", 20),
      passfail_cost: num("passfail_cost", 30),
      gold_first_pct: num("gold_first_pct", 0.75),
      gold_second_pct: num("gold_second_pct", 0.25),
      sniper_first_pct: num("sniper_first_pct", 0.75),
      sniper_second_pct: num("sniper_second_pct", 0.25),
      paybox_url: String(formData.get("paybox_url") ?? "").trim() || null,
      closes_at: closesRaw ? new Date(closesRaw).toISOString() : null,
    })
    .eq("id", id);
  refreshAll();
}

export async function setRoundStatus(id: string, status: RoundStatus) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("rounds").update({ status }).eq("id", id);
  refreshAll();
}

// ── Parties ─────────────────────────────────────────────────────────────────
export async function upsertParty(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = String(formData.get("id") ?? "").trim();
  const round_id = String(formData.get("round_id"));
  const name = String(formData.get("name") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim() || name;
  const is_swing = formData.get("is_swing") === "on";
  const display_order = Number(formData.get("display_order") ?? 0) || 0;
  const blocRaw = String(formData.get("bloc") ?? "").trim();
  const bloc = ["coalition", "change", "arab"].includes(blocRaw) ? blocRaw : null;
  if (!name) return;

  if (id) {
    await admin.from("parties").update({ name, nickname, is_swing, display_order, bloc }).eq("id", id);
  } else {
    await admin.from("parties").insert({ round_id, name, nickname, is_swing, display_order, bloc });
  }
  revalidatePath("/admin/parties");
  revalidatePath("/");
}

export async function deleteParty(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("parties").delete().eq("id", id);
  revalidatePath("/admin/parties");
  revalidatePath("/");
}

// ── Results + settle ──────────────────────────────────────────────────────
export async function saveResults(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const round_id = String(formData.get("round_id"));
  const { data: parties } = await admin.from("parties").select("id, is_swing").eq("round_id", round_id);
  for (const p of parties ?? []) {
    const seatsRaw = formData.get(`seats_${p.id}`);
    const actual_seats =
      seatsRaw === null || String(seatsRaw).trim() === "" ? null : Math.max(0, Math.floor(Number(seatsRaw)));
    const passRaw = formData.get(`pass_${p.id}`);
    const actual_passed = p.is_swing ? passRaw === "pass" : null;
    await admin.from("parties").update({ actual_seats, actual_passed }).eq("id", p.id);
  }
  refreshAll();
  revalidatePath("/admin/results");
}

export async function settleRound(roundId: string) {
  await requireAdmin();
  await setRoundStatus(roundId, "settled");
}

// ── Payments ────────────────────────────────────────────────────────────────
export async function markPaid(bidId: string, paid: boolean) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin
    .from("bids")
    .update({ paid, paid_at: paid ? new Date().toISOString() : null })
    .eq("id", bidId);
  refreshAll();
  revalidatePath("/admin/payments");
}

// ── Users ─────────────────────────────────────────────────────────────────
export async function setUserAdmin(userId: string, value: boolean) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("profiles").update({ is_admin: value }).eq("id", userId);
  revalidatePath("/admin/users");
}

export async function setUserBanned(userId: string, value: boolean) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("profiles").update({ banned: value }).eq("id", userId);
  revalidatePath("/admin/users");
}
