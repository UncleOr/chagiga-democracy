"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export interface UpdateNicknameResult {
  ok: boolean;
  error?: string;
  nickname?: string;
}

/** Set the current user's public nickname (display_name), and keep any existing bids in sync. */
export async function updateNickname(_prev: unknown, formData: FormData): Promise<UpdateNicknameResult> {
  const profile = await requireUser();
  const nickname = String(formData.get("nickname") ?? "").trim();
  if (nickname.length < 2) return { ok: false, error: "הכינוי חייב להכיל לפחות 2 תווים." };
  if (nickname.length > 40) return { ok: false, error: "הכינוי ארוך מדי (עד 40 תווים)." };

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ display_name: nickname }).eq("id", profile.id);
  if (error) return { ok: false, error: "שמירת הכינוי נכשלה." };

  // Keep the denormalized nickname on the user's bids consistent with the public table.
  await admin.from("bids").update({ nickname }).eq("user_id", profile.id);

  revalidatePath("/me");
  revalidatePath("/");
  return { ok: true, nickname };
}
