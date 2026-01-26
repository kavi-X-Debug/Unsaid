"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import {
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const ensureUserProfile = async (user: User) => {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return;
    }
    const emailLocal = user.email ? user.email.split("@")[0] : "";
    const namePart = user.displayName ? user.displayName.split(" ")[0] : "";
    const rawBase = (emailLocal || namePart || user.uid.slice(0, 8)).toLowerCase();
    let base = rawBase.replace(/[^a-z0-9_]/g, "");
    if (!base) {
      base = `user_${user.uid.slice(0, 6)}`;
    }
    let candidate = base;
    let suffix = 0;
    for (;;) {
      const existing = await getDocs(
        query(collection(db, "users"), where("username", "==", candidate))
      );
      if (existing.empty) {
        break;
      }
      suffix += 1;
      candidate = `${base}${suffix}`;
    }
    await setDoc(ref, {
      uid: user.uid,
      username: candidate,
      bio: null,
      createdAt: serverTimestamp(),
      settings: {
        positiveOnlyMode: false
      }
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        setError("Please verify your email before logging in.");
        setMessage("We sent a verification link to your email. Please check your inbox.");
        return;
      }
      await ensureUserProfile(credential.user);
      router.push("/inbox");
    } catch (err) {
      setError("Could not sign in. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setMessage(null);
    setLoadingGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      if (credential.user) {
        await ensureUserProfile(credential.user);
        router.push("/inbox");
      }
    } catch (err) {
      console.error("Google sign-in error (login):", err);
      setError("Could not sign in with Google. Try again.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-slate-950 via-slate-950 to-black">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-sky-400/80">
            Log in
          </p>
          <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Welcome back
          </h1>
          <p className="text-xs text-slate-400">
            Continue to your smart inbox to see new questions and polls.
          </p>
        </div>
        <Card className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Email
              </label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Password
              </label>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            {message && <p className="text-sm text-emerald-400">{message}</p>}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Signing in..." : "Log in"}
            </Button>
          </form>
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 dark:text-slate-500">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span>or</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              disabled={loadingGoogle}
              onClick={handleGoogle}
            >
              {loadingGoogle ? (
                "Connecting to Google..."
              ) : (
                <>
                  <svg
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.5c-.2 1.3-.9 2.4-2 3.1l3.2 2.5c1.9-1.8 3-4.5 3-7.6 0-.7-.1-1.4-.2-2H12z"
                    />
                    <path
                      fill="#34A853"
                      d="M6.6 14.3l-.9.7-2.6 2c1.6 3.1 4.7 5.1 8.9 5.1 2.7 0 5-.9 6.7-2.5l-3.2-2.5c-.9.6-2 1-3.5 1-2.7 0-5-1.8-5.8-4.3z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M3.1 7.1C2.4 8.5 2 10 2 11.6c0 1.6.4 3.1 1.1 4.5l3.5-2.8c-.2-.6-.3-1.2-.3-1.8 0-.6.1-1.2.3-1.8z"
                    />
                    <path
                      fill="#4285F4"
                      d="M12 4.5c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 1.7 14.7.8 12 .8 7.8.8 4.7 2.8 3.1 7.1l3.5 2.8C7.1 7.3 9.3 4.5 12 4.5z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </Button>
          </div>
        </Card>
        <p className="text-sm text-center text-slate-500 dark:text-slate-400">
          New here?{" "}
          <Link href="/signup" className="text-sky-400 hover:text-sky-300">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
