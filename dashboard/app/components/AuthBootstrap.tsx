"use client";

import { useEffect } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ensureUser } from "@/lib/supabase/ensure-user";

/** Silently establishes an anonymous session on first load; see ensure-user.ts. */
export function AuthBootstrap() {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    void ensureUser(createClient()).catch((error) => {
      console.error("Could not start a session:", error);
    });
  }, []);

  return null;
}
