"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import type { User } from "firebase/auth";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Could not sign in. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoadingGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      if (credential.user) {
        await ensureUserProfile(credential.user);
      }
    } catch (err) {
      setError("Could not sign in with Google. Try again.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-center">Welcome back</h1>
        <Card className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-sm font-medium text-slate-200">Email</label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-sm font-medium text-slate-200">Password</label>
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
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Signing in..." : "Log in"}
            </Button>
          </form>
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
            <div className="h-px flex-1 bg-slate-800" />
            <span>or</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>
          <Button
            type="button"
            variant="outline"
            fullWidth
            disabled={loadingGoogle}
            onClick={handleGoogle}
          >
            {loadingGoogle ? "Connecting to Google..." : "Continue with Google"}
          </Button>
        </Card>
        <p className="text-sm text-center text-slate-400">
          New here?{" "}
          <Link href="/signup" className="text-sky-400 hover:text-sky-300">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
