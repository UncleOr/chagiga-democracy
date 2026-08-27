"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface UpdateNicknameResult {
  ok: boolean;
  error?: string;
  nickname?: string;
}

/** Set the current user's public nickname (display_name). Enforces uniqueness (case-insensitive). */
export async function updateNickname(_prev: unknown, formData: FormData): Promise<UpdateNicknameResult> {
  const profile = await requireUser();
  const nickname = String(formData.get("nickname") ?? "").trim();
  if (nickname.length < 2) return { ok: false, error: "הכינוי חייב להכיל לפחות 2 תווים." };
  if (nickname.length > 40) return { ok: false, error: "הכינוי ארוך מדי (עד 40 תווים)." };

  const admin = createAdminClient();

  // Uniqueness: no other user may hold this nickname (case-insensitive).
  const { data: taken } = await admin
    .from("profiles")
    .select("id")
    .ilike("display_name", nickname)
    .neq("id", profile.id)
    .maybeSingle();
  if (taken) return { ok: false, error: "הכינוי כבר תפוס — בחרו כינוי אחר." };

  const { error } = await admin.from("profiles").update({ display_name: nickname }).eq("id", profile.id);
  if (error) {
    // Unique-index backstop (race).
    if ((error as { code?: string }).code === "23505")
      return { ok: false, error: "הכינוי כבר תפוס — בחרו כינוי אחר." };
    return { ok: false, error: "שמירת הכינוי נכשלה." };
  }

  // Keep the denormalized nickname on the user's bids consistent with the public table.
  await admin.from("bids").update({ nickname }).eq("user_id", profile.id);

  revalidatePath("/me");
  revalidatePath("/");
  return { ok: true, nickname };
}

/** Self-service: delete my own bid so I can start over. */
export async function resetMyBid() {
  const profile = await requireUser();
  const admin = createAdminClient();
  await admin.from("bids").delete().eq("user_id", profile.id);
  revalidatePath("/me");
  revalidatePath("/");
}

/** Self-service: permanently delete my own account (cascades to profile + bids), then sign out. */
export async function deleteMyAccount() {
  const profile = await requireUser();
  const supabase = await createClient();
  await supabase.auth.signOut();
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(profile.id);
  await admin.from("profiles").delete().eq("id", profile.id);
  redirect("/");
}
