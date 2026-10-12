"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const configured = isSupabaseConfigured();

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <a className="brand-lockup auth-brand" href="/" aria-label="ReGrade home">
          <span className="brand-mark">R</span>
          <span><strong>regrade</strong><small>TRIAGE PLATFORM</small></span>
        </a>
        <h1>Welcome back</h1>
        <p className="auth-description">Sign in to your ReGrade workspace.</p>

        {!configured ? (
          <div className="auth-message auth-error">
            Supabase is not configured. Copy <code>.env.example</code> to{" "}
            <code>.env.local</code> and enter your project URL and publishable
            key to continue.
          </div>
        ) : (
          <form className="auth-form" onSubmit={signIn}>
            <label htmlFor="email">Email</label>
            <input
              autoComplete="email"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
            <label htmlFor="password">Password</label>
            <input
              autoComplete="current-password"
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
            {errorMessage && (
              <div className="auth-message auth-error" role="alert">
                {errorMessage}
              </div>
            )}
            <button
              className="button button-primary auth-submit"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}
        <p className="auth-footnote">
          Accounts are provisioned by a project administrator in Supabase.
        </p>
      </section>
    </main>
  );
}
