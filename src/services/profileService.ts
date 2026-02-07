import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

/** Log Supabase/Postgres error in a readable way (message, code, details, hint). */
export function logSupabaseError(
  context: string,
  err: unknown
): void {
  const e = err as { message?: string; code?: string; details?: string; hint?: string };
  console.error(`[${context}]`, {
    message: e?.message ?? String(err),
    code: e?.code,
    details: e?.details,
    hint: e?.hint,
  });
}

export type ProfileRow = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  phone: string | null;
  postal_address: string | null;
  avatar_url: string | null;
};

/**
 * Récupère les métadonnées auth pour pré-remplir le profil (inscription / OAuth).
 */
function getMetaFields(user: User): {
  first_name: string;
  last_name: string;
  display_name: string;
} {
  const m = user.user_metadata ?? {};
  const first = (m.first_name ?? m.given_name ?? "").toString().trim();
  const last = (m.last_name ?? m.family_name ?? "").toString().trim();
  const display =
    (m.display_name ?? m.name ?? m.full_name ?? "").toString().trim() ||
    (first || last ? `${first} ${last}`.trim() : "");
  const fallbackDisplay = user.email
    ? user.email.split("@")[0]
    : "Utilisateur";
  return {
    first_name: first,
    last_name: last,
    display_name: display || fallbackDisplay,
  };
}

/**
 * Charge le profil depuis profiles (id = auth.user.id via user_id).
 * Si aucun profil n'existe, crée une ligne (upsert) avec id/user_id = user.id
 * et first_name/last_name/display_name depuis user_metadata, puis re-fetch.
 */
export async function getOrCreateProfile(
  supabase: SupabaseClient,
  user: User
): Promise<ProfileRow | null> {
  const selectCols = "id, user_id, first_name, last_name, display_name, phone, postal_address, avatar_url";

  const { data, error } = await supabase
    .from("profiles")
    .select(selectCols)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    logSupabaseError("getOrCreateProfile (select)", error);
    return null;
  }

  if (data) {
    return data as ProfileRow;
  }

  const meta = getMetaFields(user);
  const { error: upsertError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      user_id: user.id,
      first_name: meta.first_name || null,
      last_name: meta.last_name || null,
      display_name: meta.display_name || null,
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    logSupabaseError("getOrCreateProfile (upsert)", upsertError);
    return null;
  }

  const { data: refetched, error: refetchError } = await supabase
    .from("profiles")
    .select(selectCols)
    .eq("user_id", user.id)
    .single();

  if (refetchError) {
    logSupabaseError("getOrCreateProfile (refetch)", refetchError);
    return null;
  }

  return refetched as ProfileRow;
}
