import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Returns the current profile, or null when signed out. Bootstraps a profile row on first login. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    // First login — create the profile. is_admin defaults from the bootstrap list (DB trigger).
    const { data: created } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        display_name:
          (user.user_metadata?.full_name as string) ??
          (user.user_metadata?.name as string) ??
          null,
      })
      .select("*")
      .single();
    profile = created;
  }

  return profile as Profile | null;
}

export async function requireUser(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.banned) redirect("/banned");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireUser();
  if (!profile.is_admin) redirect("/");
  return profile;
}
