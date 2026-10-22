import { isAuthSessionMissingError, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Every visitor acts under a Supabase Auth identity, but none of them ever
 * see a sign-in screen: this returns the current session's user, silently
 * starting an anonymous one if none exists yet. Anonymous sessions still
 * carry the `authenticated` role and a real auth.uid(), so existing RLS
 * policies and "the signed-in operator's own records" queries work
 * unchanged — there's just no login step in front of them.
 */
export async function ensureUser(supabase: SupabaseClient<Database>): Promise<User> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error && !isAuthSessionMissingError(error)) throw error;
  if (user) return user;

  const { data, error: signInError } = await supabase.auth.signInAnonymously();
  if (signInError) throw signInError;
  if (!data.user) throw new Error("Could not start a session.");
  return data.user;
}
